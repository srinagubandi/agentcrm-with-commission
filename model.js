import {payoutCapacity,followingMonth} from './payout-balance.js';
import {partnerPayoutApplications} from './payout-allocations.js';
import {createHash,randomUUID} from 'node:crypto';
export const stages=['New Referral','Contacted','Discovery','Proposal','Negotiation','Won','Lost'];
export const today=()=>new Date().toISOString().slice(0,10);
const uid=()=>randomUUID();
export function check(ok,message){if(!ok) throw new Error(message)}
function required(v){check(typeof v==='string'&&v.trim().length>0&&v.length<600,'Enter a value under 600 characters');return v.trim()}
function decimal(v,max){check(v!==''&&v!=null&&Number.isFinite(Number(v))&&Number(v)>=0&&Number(v)<=max,'Amount or percentage outside range');const raw=String(v).trim();check(/^[0-9]+(?:\.[0-9]{1,2})?$/.test(raw),'Use a decimal with up to two places');const [whole,fraction='']=raw.split('.');return Number(whole)*100+Number(fraction.padEnd(2,'0'))}
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

function assertOpen(s, client, entryDate) {
 const month = entryDate.slice(0,7);
 check(!(s.closes||[]).some(close=>close.cid===client&&close.month>=month),
   'Client period is closed. Use an entry date in an open month.');
}

function cashReference(s,client,fields,kind) {
 const reference=required(fields.ref);
 const sameType=kind==='receipt'?entry=>entry.amount>0:entry=>entry.original!=null;
 check(!s.receipts.some(entry=>entry.cid===client&&sameType(entry)&&entry.ref.trim().toLowerCase()===reference.toLowerCase()),
   (kind==='receipt'?'Payment':'Refund')+' reference is already recorded for this client');
 return reference;
}

export function reportableReceipts(s) {
 const draftIds=new Set(s.receipts.filter(receipt=>receipt.approval==='draft').map(receipt=>receipt.id));
 return s.receipts.filter(receipt=>!draftIds.has(receipt.id)&&!draftIds.has(receipt.original)&&!draftIds.has(receipt.adjusts));
}

export function invoiceBalance(s, fee, asOf) {
 const parts=[fee.fixed,fee.perf];
 const entries=s.receipts.filter(entry=>entry.fee===fee.id);
 const apply=entry=>{
   if(entry.amount>0)entry.parts.forEach((amount,index)=>parts[index]-=amount);
   if(entry.reopened)entry.reopened.forEach((amount,index)=>parts[index]+=amount);
 };
 if(!asOf){entries.forEach(apply);return parts}
 entries.filter(entry=>entry.date<=asOf).forEach(apply);
 const available=[...parts];
 const future=entries.filter(entry=>entry.date>asOf).sort((a,b)=>a.date.localeCompare(b.date));
 for(const day of new Set(future.map(entry=>entry.date))){
   future.filter(entry=>entry.date===day).forEach(apply);
   available.forEach((amount,index)=>available[index]=Math.min(amount,parts[index]));
 }
 return available;
}

export function availablePayout(s,person,kind,asOf) {
 const approved=kind==='partner'?new Set(reportableReceipts(s)):null;
 const source=approved?s.receipts:owners(s).map(month=>({date:followingMonth(month.month),shares:month.shares}));
 const earnings=source.flatMap(entry=>entry.shares
   .filter(share=>share.id===person&&(!approved||approved.has(entry)||share.amount<0))
   .map(share=>({date:entry.date,amount:share.amount})));
 const payments=s.payouts.filter(payment=>payment.person===person&&payment.kind===kind);
 const capacity=payoutCapacity(earnings,payments,asOf);
 if(kind!=='partner'||capacity===0)return capacity;
 const proposed={id:Symbol(),person,kind,date:asOf,amount:capacity};
 return partnerPayoutApplications(s,approved,proposed).reduce((total,line)=>total+line.amount,0);
}

export function visibleClients(s,user) {
 const global=user.roles.includes('admin')||user.roles.includes('super');
 return global?s.clients:s.clients.filter(client=>
   client.history.some(terms=>terms.partners.some(partner=>partner.id===user.id)));
}

function closeMonth(s,user,f) {
 const client=get(s.clients,f.client);
 const month=String(f.month||'');
 check(/^\d{4}-(0[1-9]|1[0-2])$/.test(month)&&month<today().slice(0,7),'Choose a completed calendar month');
 assertOpen(s,client.id,month);
 check(!s.receipts.some(r=>r.cid===client.id&&r.date.slice(0,7)<=month&&r.approval==='draft'),
   'Approve draft commissions before closing this period');
 const ledger=owners(s).filter(row=>row.cid===client.id&&row.month<=month);
 const snapshot={
   month,cid:client.id,ledger,
   agreements:client.history.filter(terms=>terms.from.slice(0,7)<=month),
   fees:s.fees.filter(fee=>fee.cid===client.id&&fee.date.slice(0,7)<=month),
   receipts:s.receipts.filter(receipt=>receipt.cid===client.id&&receipt.date.slice(0,7)<=month),
   expenses:s.expenses.flatMap(expense=>expense.date.slice(0,7)<=month
     ? expense.lines.filter(line=>line.cid===client.id).map(line=>({id:expense.id,date:expense.date,amount:line.amount}))
     : [])
 };
 const digest=createHash('sha256').update(JSON.stringify(snapshot)).digest('hex');
 (s.closes??=[]).push({cid:client.id,month,by:user.id,at:new Date().toISOString(),digest,loss:ledger.at(-1)?.loss??0,
   settled:ledger.find(row=>row.month===month)||null});
}

function expenseLines(s,f,amount,d) {
 const mode=f.allocation||'custom';
 check(['custom','equal','sales'].includes(mode),'Choose an expense allocation method');
 const rows=String(f.lines||'').trim().split(/\r?\n/).filter(line=>line.trim());
 check(rows.length>0&&rows.length<=200,'Choose between 1 and 200 clients');
 const seen=new Set();
 const clients=rows.map(row=>{
   const columns=row.split(',').map(value=>value.trim());
   check(columns.length===(mode==='custom'?2:1),'Check the allocation row format');
   const [cid,value]=columns;
   get(s.clients,cid);
   check(!seen.has(cid),'Duplicate allocation');
   assertOpen(s,cid,d);
   seen.add(cid);
   return {cid,value};
 });
 let amounts;
 if(mode==='custom')amounts=clients.map(row=>cents(row.value));
 else{
   const weights=mode==='equal'?clients.map(()=>1):clients.map(({cid})=>
     s.fees.filter(fee=>fee.cid===cid&&fee.date.slice(0,7)===d.slice(0,7))
       .reduce((total,fee)=>total+fee.sales,0));
   check(weights.some(weight=>weight>0),'Sales-weighted allocation requires qualifying sales in the bill month');
   amounts=allocate(amount,weights);
 }
 check(amount>0&&amounts.reduce((sum,value)=>sum+value,0)===amount,'Allocations must equal the bill');
 return clients.map(({cid},index)=>({cid,amount:amounts[index]}));
}

export function run(s,user,action,f){
 const admin=user.roles.includes('admin'),partner=user.roles.includes('partner'),owner=user.roles.includes('owner');
 if(!admin)check((partner&&action==='refer')||((partner||owner)&&action==='preference'),'Permission denied');
 if(action==='refer'){
 const name=required(f.name),pid=partner&&!admin?user.id:f.partner;check(get(s.people,pid).roles.includes('partner'),'Select a referral partner');
 s.deals.push({id:uid(),name,contact:required(f.contact),...(f.estimate?.trim()?{estimate:cents(f.estimate)}:{}),pid,stage:stages[0],follow:f.follow?date(f.follow):'',note:'',duplicate:s.deals.some(d=>d.name.toLowerCase()===name.toLowerCase())});return}
 if(action==='preference'){
   check(partner||owner,'Only payout recipients can submit a payment preference');
   const preference=required(f.preference);
   check(!/\d(?:[ -]*\d){4}/.test(preference),'Enter a masked identifier with at most the last four digits');
   get(s.people,user.id).pending=preference;
   return;
 }
 if(action==='approvePreference'){const p=get(s.people,f.person);check(p.pending,'No change pending');p.preference=p.pending;p.pending='';return}
 if(action==='settings'){const n=Number(f.day);check(Number.isInteger(n)&&n>=1&&n<=31,'Choose a day from 1 to 31');s.day=n;return}
 if(action==='stage'){
   const deal=get(s.deals,f.deal);
   check(stages.includes(f.stage),'Unknown stage');
   const follow=f.follow?date(f.follow):'',note=String(f.note||'').slice(0,500);
   const rawPartners=String(f.additionalPartners||'').trim();
   const ids=rawPartners==='-'?[]:rawPartners?rawPartners.split(/[,\s]+/).filter(Boolean):(deal.additionalPartners||[]);
   check(ids.length<=4&&new Set([deal.pid,...ids]).size===ids.length+1,'Choose up to four distinct additional partners');
   for(const id of ids)get(s.people.filter(p=>p.roles.includes('partner')),id);
   if(f.stage==='Won'&&!deal.cid){
     if(f.client)deal.cid=get(s.clients,f.client).id;
     else{
       check(!s.clients.some(c=>c.name.toLowerCase()===deal.name.toLowerCase()),'Choose the existing client with this name');
       const client={id:uid(),name:deal.name,contact:deal.contact,notes:note?[{by:user.id,date:today(),text:note}]:[],history:[]};
       s.clients.push(client);
       deal.cid=client.id;
     }
   }
   (deal.history??=[]).push({from:deal.stage,to:f.stage,at:today(),by:user.id,note});
   Object.assign(deal,{stage:f.stage,note,follow,additionalPartners:ids});
   if(deal.cid){
     const client=get(s.clients,deal.cid);
     client.referrals??={};
     client.referrals[deal.id]=[deal.pid,...ids];
   }
   return;
 }
 if(action==='closeMonth'){closeMonth(s,user,f);return}
 if(action==='approveReceipt'){
   const receipt=get(s.receipts,f.receipt);
   check(receipt.approval==='draft','Receipt has no draft commissions');
   assertOpen(s,receipt.cid,receipt.date);
   receipt.approval='approved';
   receipt.approvedBy=user.id;
   receipt.approvedAt=new Date().toISOString();
   return;
 }
 if(action==='expense'){
   const billDate=date(f.date),amount=cents(f.amount);
   const lines=expenseLines(s,f,amount,billDate);
   s.expenses.push({id:uid(),name:required(f.name),date:billDate,amount,lines,allocation:f.allocation||'custom'});
   return;
 }
 if(action==='batchPayout'){
   const rows=String(f.rows||'').trim().split(/\r?\n/).filter(line=>line.trim());
   check(rows.length>=1&&rows.length<=100,'Enter from 1 to 100 payout rows');
   const draft={...s,payouts:[...s.payouts]};
   for(const [index,row] of rows.entries()){
     try{
       const columns=row.split(',').map(value=>value.trim());
       check(columns.length===4,'Enter recipient ID, earnings type, amount and reference for each payout');
       const [person,kind,amount,ref]=columns;
       run(draft,user,'payout',{person,kind,amount,ref,date:f.date,method:f.method});
     }catch(error){
       throw new Error('Payout row '+(index+1)+': '+error.message,{cause:error});
     }
   }
   s.payouts=draft.payouts;
   return;
 }
 if(action==='reversePayout'){
   const original=get(s.payouts,f.payout);
   const posted=date(f.date);
   check(original.amount>0,'Choose an original payout');
   check(!s.payouts.some(entry=>entry.reverses===original.id),'This payout already has a reversal');
   check(posted>=original.date&&posted<=today(),'Choose a reversal date between the payout date and today');
   check(!(s.closes||[]).some(close=>close.month>=posted.slice(0,7)),
     'Use a reversal date after the latest closed client period');
   const reason=required(f.reason);
   s.payouts.push({id:uid(),person:original.person,kind:original.kind,date:posted,amount:-original.amount,
     method:'Ledger reversal',ref:'Reversal of '+original.ref,reverses:original.id,reason,by:user.id,
     ...(original.applications?{applications:original.applications.map(line=>({...line,amount:-line.amount}))}:{})});
   return;
 }
 if(action==='payout'){const p=get(s.people,f.person),d=date(f.date),amount=cents(f.amount),kind=f.kind==='owner'?'owner':'partner';
 check(['partner','owner'].includes(f.kind??'partner'),'Choose a valid earnings type');
 check(p.roles.includes(kind),'Recipient is not eligible for this earnings type');
 const payments=s.payouts.filter(payment=>payment.person===p.id&&payment.kind===kind);
 const due=availablePayout(s,p.id,kind,d);
 check(amount>0&&amount<=due,'Payout exceeds available balance');
 const ref=required(f.ref);
 check(!payments.some(payment=>payment.ref===ref),'This recipient and earnings type already have a payout with that reference');
 const payout={id:uid(),person:p.id,kind,date:d,amount,method:required(f.method),ref,availableBefore:due};
 if(kind==='partner'){
   payout.applications=partnerPayoutApplications(s,new Set(reportableReceipts(s)),payout);
   check(payout.applications.reduce((total,line)=>total+line.amount,0)===amount,
     'This date has insufficient unassigned approved commission after reserving recorded payouts');
 }
 s.payouts.push(payout);return}
 if(action==='client'){const name=required(f.name);check(!s.clients.some(c=>c.name.toLowerCase()===name.toLowerCase()),'Client already exists');s.clients.push({id:uid(),name,contact:String(f.contact||'').trim().slice(0,500),history:[],notes:[]});return}
 const c=get(s.clients,f.client);
 if(action==='note'){const note=required(f.note);c.notes??=[];c.notes.push({by:user.id,date:today(),text:note});return}
 if(action==='terms'){const from=date(f.date);assertOpen(s,c.id,from);check(!c.history.length||from>c.history.at(-1).from,'Use a later effective date');
 const partners=parseRows(f.partners,s.people.filter(p=>p.roles.includes('partner'))),os=parseRows(f.owners,s.people.filter(p=>p.roles.includes('owner')));
 check(['both','fixed','performance'].includes(f.eligible||'both'),'Invalid fee eligibility');for(const field of ['rate','performance'])check(partners.reduce((a,p)=>a+p[field],0)<=10000,'Partner shares exceed 100%');check(os.reduce((a,p)=>a+p.rate,0)<=10000,'Owner shares exceed 100%');
 if(f.split==='pool'&&partners.length){for(const k of ['rate','performance'])check(partners.reduce((a,p)=>a+p[k],0)===10000,'Allocate the entire partner pool')}const tiers=String(f.tiers||'*,0').split(/\r?\n/).map(line=>{const [to,r]=line.split(',').map(x=>x.trim());return {to:to==='*'?null:cents(to),rate:rate(r)}});check(tiers.at(-1).to===null,'End tiers with *,rate');performance(0,tiers,'marginal');
 c.history.push({from,partners,owners:os,tiers,mode:f.mode==='whole'?'whole':'marginal',pool:f.split==='pool'?rate(f.pool):null,eligible:f.eligible||'both',retainer:cents(f.retainer||0)});return}
 const d=date(f.date),t=c.history.filter(h=>h.from<=d).at(-1);assertOpen(s,c.id,d);check(t,'Add effective agreement terms for this date');
 if(action==='fee'){const sales=cents(f.sales||0);const fixed=f.fixed===''||f.fixed==null?t.retainer:cents(f.fixed),perf=f.calc==='sales'?performance(sales,t.tiers,t.mode):cents(f.performance||0);check(fixed+perf>0,'Enter a fee');s.fees.push({id:uid(),cid:c.id,date:d,fixed,perf,sales,reference:required(f.ref)});return}
 const fee=get(s.fees,f.fee);check(fee.cid===c.id&&d>=fee.date,'Check client and fee date');
 if(action==='receipt'){const ref=cashReference(s,c.id,f,'receipt'),amount=cents(f.amount),remaining=invoiceBalance(s,fee,d);
 check(amount>0&&amount<=remaining[0]+remaining[1],'Payment exceeds outstanding fee');
 const parts=f.override!==''&&f.override!=null?[cents(f.override),amount-cents(f.override)]:allocate(amount,remaining);
 check(parts.every((n,i)=>n>=0&&n<=remaining[i]),'Invalid receipt allocation');
 const ps=t.partners.filter(p=>(!p.start||p.start<=d)&&(!p.end||p.end>=d));const shares=ps.map(p=>({id:p.id,amount:0,detail:[]}));
 parts.forEach((n,i)=>{if(t.eligible!=='both'&&t.eligible!==(i?'performance':'fixed'))return;
 const basis=t.pool===null?n:portion(n,t.pool),weights=ps.map(p=>i?p.performance:p.rate);const amounts=allocate(basis,[...weights,10000-weights.reduce((a,b)=>a+b,0)]);
 shares.forEach((p,j)=>{p.amount+=amounts[j];p.detail.push({type:i?'Performance':'Fixed',base:basis,rate:weights[j],amount:amounts[j]})})});
 s.receipts.push({id:uid(),cid:c.id,fee:fee.id,date:d,ref,method:required(f.method),parts,amount,shares,
   ...(f.review==='draft'&&shares.some(p=>p.amount>0)?{approval:'draft'}:{})});return}
 if(action==='adjustment'){
  const receipt=get(s.receipts,f.receipt);
  check(receipt.fee===fee.id&&receipt.amount>0&&d>=receipt.date,'Choose a valid original receipt');
  check(receipt.shares.some(p=>p.id===f.person),'Partner was not on this receipt');
  const amount=cents(f.amount);check(amount>0&&['credit','debit'].includes(f.direction),'Choose a nonzero adjustment');
  const reason=required(f.reason);
  s.receipts.push({id:uid(),cid:c.id,fee:fee.id,date:d,ref:required(f.ref),amount:0,parts:[],adjusts:receipt.id,reason,
    shares:[{id:f.person,amount:f.direction==='debit'?-amount:amount,detail:[]}]});
  return;
 }
 if(action==='refund'){const orig=get(s.receipts,f.receipt);check(orig.fee===fee.id&&orig.amount>0&&d>=orig.date,'Invalid original receipt');const prior=s.receipts.filter(x=>x.original===orig.id);
 const ref=cashReference(s,c.id,f,'refund');
 const amount=cents(f.amount),before=-prior.reduce((a,x)=>a+x.amount,0);check(amount>0&&before+amount<=orig.amount,'Refund exceeds payment');
 check(['yes','no'].includes(f.deduct),'Choose a refund treatment');const prorate=(value,part)=>Number((BigInt(value)*BigInt(part)*2n+BigInt(orig.amount))/(2n*BigInt(orig.amount)));const shares=f.deduct==='yes'?orig.shares.map(p=>({id:p.id,amount:-(prorate(p.amount,before+amount)-prorate(p.amount,before)),detail:[]})):[];
 const treatment=f.invoice||'settled';
 check(['settled','reopen'].includes(treatment),'Choose how the refund affects the invoice');
 const reopenedTotal=prior.reduce((sum,row)=>sum+(row.reopened?-row.amount:0),0);
 const restoredFixed=prorate(orig.parts[0],reopenedTotal+amount)-prorate(orig.parts[0],reopenedTotal);
 const reopened=treatment==='reopen'?[restoredFixed,amount-restoredFixed]:undefined;
 s.receipts.push({id:uid(),cid:c.id,fee:fee.id,original:orig.id,date:d,ref,amount:-amount,parts:[],shares,...(reopened?{reopened}:{})});return}
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
