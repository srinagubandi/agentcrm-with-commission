import {randomUUID} from 'node:crypto';
export const stages=['New Referral','Contacted','Discovery','Proposal','Negotiation','Won','Lost'];
export const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>randomUUID();
export function check(ok,message){if(!ok) throw new Error(message)}
function required(v){check(typeof v==='string'&&v.trim().length>0&&v.length<600,'Enter a value under 600 characters');return v.trim()}
function decimal(v,max){check(v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=max,'Amount or percentage outside range');return Math.round(Number(v)*100)}
const cents=v=>decimal(v,100000000);
const rate=v=>decimal(v,100);
const portion=(n,r)=>Math.round(n*r/10000);
function date(v){check(/^\d{4}-\d\d-\d\d$/.test(v)&&new Date(v+'T12:00Z').toISOString().startsWith(v),'Choose a valid date');return v}
function get(list,id){const item=list.find(x=>x.id===id);check(item,'Record unavailable');return item}
export function allocate(amount,weights){
 const total=weights.reduce((a,b)=>a+b,0);if(!total)return weights.map(()=>0);
 const products=weights.map(w=>BigInt(amount)*BigInt(w)), base=products.map(n=>Number(n/BigInt(total)));
 const order=products.map((n,i)=>[i,Number(n%BigInt(total))]).sort((a,b)=>b[1]-a[1]);
 for(let i=0,left=amount-base.reduce((a,b)=>a+b,0);i<left;i++)base[order[i][0]]++;return base;
}
export function performance(sales,tiers,mode){
 let previous=0,fee=0; for(const t of tiers){const upper=t.to??Infinity;
 check(upper>previous,'Tier thresholds must increase');if(mode==='whole'&&sales<=upper)return portion(sales,t.rate);
 fee+=portion(Math.max(0,Math.min(sales,upper)-previous),t.rate);previous=upper;
 }return fee;
}
function parseRows(input,people){
 const seen=new Set();return String(input||'').split(/\r?\n/).filter(l=>l.trim()).map(line=>{
 const [id,pct,perf,start,end]=line.split(',').map(s=>s.trim());get(people,id);check(!seen.has(id),'Duplicate participant');seen.add(id);
 if(start)date(start);if(end)date(end);check(!start||!end||start<=end,'Invalid agreement dates');
 return {id,rate:rate(pct),performance:perf?rate(perf):rate(pct),start:start||'',end:end||''};
 });}
export function owners(s){
 const months=new Map();function row(cid,d){const key=cid+'|'+d.slice(0,7);if(!months.has(key))months.set(key,{key,cid,month:d.slice(0,7),income:0,commission:0,expenses:0});return months.get(key)}
 for(const r of s.receipts){const m=row(r.cid,r.date);m.income+=r.amount;m.commission+=r.shares.reduce((a,x)=>a+x.amount,0)}
 for(const e of s.expenses)for(const a of e.lines)row(a.cid,e.date).expenses+=a.amount;
 const losses={};return [...months.values()].sort((a,b)=>a.key.localeCompare(b.key)).map(m=>{
 m.opening=losses[m.cid]||0;const net=m.income-m.commission-m.expenses-m.opening;m.loss=losses[m.cid]=Math.max(0,-net);m.available=Math.max(0,net);
 const c=get(s.clients,m.cid), rules=c.history.filter(h=>h.from<=m.month+'-31').at(-1)?.owners||[];
 const weights=rules.map(x=>x.rate);weights.push(10000-weights.reduce((a,b)=>a+b,0));const amounts=allocate(m.available,weights);
 m.shares=rules.map((x,i)=>({id:x.id,amount:amounts[i]}));m.reserve=amounts.at(-1);return m;
 });
}
export function run(s,user,action,f){
 const admin=user.roles.includes('admin'),partner=user.roles.includes('partner');
 if(!admin)check(partner&&['refer','preference'].includes(action),'Permission denied');
 if(action==='refer'){
 const name=required(f.name),pid=partner&&!admin?user.id:f.partner;get(s.people,pid);
 s.deals.push({id:uid(),name,contact:required(f.contact),pid,stage:stages[0],follow:f.follow?date(f.follow):'',note:'',duplicate:s.deals.some(d=>d.name.toLowerCase()===name.toLowerCase())});return}
 if(action==='preference'){const p=get(s.people,user.id);p.pending=required(f.preference);return}
 if(action==='approvePreference'){const p=get(s.people,f.person);check(p.pending,'No change pending');p.preference=p.pending;p.pending='';return}
 if(action==='settings'){const n=Number(f.day);check(Number.isInteger(n)&&n>=1&&n<=28,'Choose a day from 1 to 28');s.day=n;return}
 if(action==='stage'){const d=get(s.deals,f.deal);check(stages.includes(f.stage),'Unknown stage');d.history??=[];d.history.push({from:d.stage,to:f.stage,at:today(),by:user.id,note:String(f.note||'').slice(0,500)});d.stage=f.stage;d.note=String(f.note||'').slice(0,500);d.follow=f.follow?date(f.follow):'';if(d.stage==='Won'&&!d.cid){d.cid=f.client||uid();if(f.client)get(s.clients,f.client);else s.clients.push({id:d.cid,name:d.name,history:[]})}return}
 if(action==='expense'){const d=date(f.date),amount=cents(f.amount),seen=new Set();const lines=required(f.lines).split(/\r?\n/).map(line=>{const [cid,n]=line.split(',').map(x=>x.trim());get(s.clients,cid);check(!seen.has(cid),'Duplicate allocation');seen.add(cid);return {cid,amount:cents(n)}});check(amount>0&&lines.reduce((a,l)=>a+l.amount,0)===amount,'Allocations must equal the bill');s.expenses.push({id:uid(),name:required(f.name),date:d,amount,lines});return}
 if(action==='payout'){const p=get(s.people,f.person),d=date(f.date),amount=cents(f.amount),kind=f.kind==='owner'?'owner':'partner';
 const earned=kind==='owner'?owners(s).filter(m=>m.month<d.slice(0,7)).flatMap(x=>x.shares):s.receipts.filter(r=>r.date<=d).flatMap(x=>x.shares);
 const due=earned.filter(x=>x.id===p.id).reduce((a,x)=>a+x.amount,0)-s.payouts.filter(x=>x.person===p.id&&x.kind===kind).reduce((a,x)=>a+x.amount,0);
 check(amount>0&&amount<=due,'Payout exceeds available balance');s.payouts.push({id:uid(),person:p.id,kind,date:d,amount,method:required(f.method),ref:required(f.ref)});return}
 const c=get(s.clients,f.client);
 if(action==='terms'){const from=date(f.date);check(!c.history.length||from>c.history.at(-1).from,'Use a later effective date');
 const partners=parseRows(f.partners,s.people.filter(p=>p.roles.includes('partner'))),os=parseRows(f.owners,s.people.filter(p=>p.roles.includes('owner')));
 check(['both','fixed','performance'].includes(f.eligible||'both'),'Invalid fee eligibility');for(const field of ['rate','performance'])check(partners.reduce((a,p)=>a+p[field],0)<=10000,'Partner shares exceed 100%');check(os.reduce((a,p)=>a+p.rate,0)<=10000,'Owner shares exceed 100%');
 if(f.split==='pool'&&partners.length){for(const k of ['rate','performance'])check(partners.reduce((a,p)=>a+p[k],0)===10000,'Allocate the entire partner pool')}const tiers=String(f.tiers||'*,0').split(/\r?\n/).map(line=>{const [to,r]=line.split(',').map(x=>x.trim());return {to:to==='*'?null:cents(to),rate:rate(r)}});check(tiers.at(-1).to===null,'End tiers with *,rate');performance(0,tiers,'marginal');
 c.history.push({from,partners,owners:os,tiers,mode:f.mode==='whole'?'whole':'marginal',pool:f.split==='pool'?rate(f.pool):null,eligible:f.eligible||'both',retainer:cents(f.retainer||0)});return}
 const d=date(f.date),t=c.history.filter(h=>h.from<=d).at(-1);check(t,'Add effective agreement terms for this date');
 if(action==='fee'){const sales=cents(f.sales||0);const fixed=cents(f.fixed??t.retainer/100),perf=f.calc==='sales'?performance(sales,t.tiers,t.mode):cents(f.performance||0);check(fixed+perf>0,'Enter a fee');s.fees.push({id:uid(),cid:c.id,date:d,fixed,perf,sales,reference:required(f.ref)});return}
 const fee=get(s.fees,f.fee);check(fee.cid===c.id&&d>=fee.date,'Check client and fee date');
 if(action==='receipt'){const amount=cents(f.amount),previous=s.receipts.filter(x=>x.fee===fee.id&&x.amount>0);
 const remaining=[fee.fixed,fee.perf].map((n,i)=>n-previous.reduce((a,r)=>a+r.parts[i],0));check(amount>0&&amount<=remaining[0]+remaining[1],'Payment exceeds outstanding fee');
 const parts=f.override!==''&&f.override!=null?[cents(f.override),amount-cents(f.override)]:allocate(amount,remaining);
 check(parts.every((n,i)=>n>=0&&n<=remaining[i]),'Invalid receipt allocation');
 const ps=t.partners.filter(p=>(!p.start||p.start<=d)&&(!p.end||p.end>=d));const shares=ps.map(p=>({id:p.id,amount:0,detail:[]}));
 parts.forEach((n,i)=>{if(t.eligible!=='both'&&t.eligible!==(i?'performance':'fixed'))return;
 const basis=t.pool===null?n:portion(n,t.pool),weights=ps.map(p=>i?p.performance:p.rate);const amounts=allocate(basis,[...weights,10000-weights.reduce((a,b)=>a+b,0)]);
 shares.forEach((p,j)=>{p.amount+=amounts[j];p.detail.push({type:i?'Performance':'Fixed',base:basis,rate:weights[j],amount:amounts[j]})})});
 s.receipts.push({id:uid(),cid:c.id,fee:fee.id,date:d,ref:required(f.ref),method:required(f.method),parts,amount,shares});return}
 if(action==='refund'){const orig=get(s.receipts,f.receipt);check(orig.fee===fee.id&&orig.amount>0&&d>=orig.date,'Invalid original receipt');const prior=s.receipts.filter(x=>x.original===orig.id);
 const amount=cents(f.amount),before=-prior.reduce((a,x)=>a+x.amount,0);check(amount>0&&before+amount<=orig.amount,'Refund exceeds payment');
 const shares=f.deduct==='yes'?orig.shares.map(p=>({id:p.id,amount:-(Math.round(p.amount*(before+amount)/orig.amount)-Math.round(p.amount*before/orig.amount)),detail:[]})):[];
 s.receipts.push({id:uid(),cid:c.id,fee:fee.id,original:orig.id,date:d,ref:required(f.ref),amount:-amount,parts:[],shares});return}
 throw new Error('Unknown action');
}
export function seed(people){
 const s={people,clients:[],deals:[],expenses:[],receipts:[],payouts:[],fees:[],day:15};const admin=get(people,'admin');
 for(const [id,name] of [['alder','Alder Studio'],['harbor','Harbor House']]){
 s.clients.push({id,name,history:[]});run(s,admin,'terms',{client:id,date:'2026-01-01',partners:id==='alder'?'partner,10,15\npartner2,5':'partner2,40\npartner,60',owners:id==='alder'?'owner,50\nsuper,30':'super,75',split:id==='alder'?'individual':'pool',pool:'15',retainer:3000,tiers:'50000,5\n*,7'});
 run(s,admin,'fee',{client:id,date:'2026-10-01',fixed:3000,calc:'sales',sales:40000,ref:'OCT-'+id});run(s,admin,'receipt',{client:id,fee:s.fees.at(-1).id,date:'2026-10-15',amount:id==='alder'?5000:2500,ref:'DEMO-'+id,method:'ACH'});}
 run(s,admin,'expense',{date:'2026-10-18',amount:600,name:'Design production',lines:'alder,400\nharbor,200'});
 run(s,admin,'payout',{person:'partner',kind:'partner',amount:200,date:'2026-11-15',method:'ACH',ref:'SAMPLE-001'});
 for(const [i,name] of ['Beacon Creative','Maple Workshop','Ember Supply','Birch & Co'].entries()){run(s,admin,'refer',{name,contact:'team@example.invalid',partner:i%2?'partner2':'partner',follow:'2026-11-25'});s.deals.at(-1).stage=stages[i]}return s;
}


