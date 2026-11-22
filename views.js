import {owners,stages,today} from './model.js';
export const esc=x=>String(x??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const money=n=>new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
const sum=(list,key)=>list.reduce((a,x)=>a+x[key],0);
const table=(heads,rows)=>rows.length?'<div class="scroll"><table><thead><tr>'+heads.map(h=>'<th>'+h+'</th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr>'+r.map(x=>'<td>'+x+'</td>').join('')+'</tr>').join('')+'</tbody></table></div>':'<p class="empty">No entries yet.</p>';
const input=(name,label,type='text',value='',required=true)=>'<label>'+label+'<input name="'+name+'" type="'+type+'" value="'+esc(value)+'" '+(type==='number'?'step="0.01" min="0" ':'')+(required?'required':'')+'></label>';
const options=(key,label,list)=>'<label>'+label+'<select name="'+key+'">'+list.map(([id,text])=>'<option value="'+esc(id)+'">'+esc(text)+'</option>').join('')+'</select></label>';
const multi=(key,label,example)=>'<label>'+label+'<textarea name="'+key+'" placeholder="'+esc(example)+'"></textarea></label>';
const panel=(title,body)=>'<section><h2>'+title+'</h2>'+body+'</section>';
const doc=(title,body)=>'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+title+' · AgentCRM</title><link rel="stylesheet" href="/style.css"></head><body>'+body+'</body></html>';
export const login=(error='')=>doc('Sign in','<main class="login"><div class="brand">AgentCRM</div><h1>Sign in</h1><p>Agency and partner workspace · Synthetic demo</p>'+(error?'<p role="alert">'+esc(error)+'</p>':'')+'<form method="post" action="/login">'+input('email','Email address','email')+input('password','Password','password')+'<button>Sign in</button></form></main>');
export function page(s,u,path,ctx){
 const admin=u.roles.includes('admin'),global=admin||u.roles.includes('super'),partner=u.roles.includes('partner'),owner=u.roles.includes('owner');
 const names=Object.fromEntries(s.people.map(p=>[p.id,p.name])),clientName=id=>s.clients.find(c=>c.id===id)?.name||id;
 const menu=[['/','Overview'],...(global||partner?[['/sales','Sales pipeline'],['/clients','Clients']]:[]),...(global?[['/earnings','Monthly earnings']]:[]),...(global||partner?[['/commissions','Commissions']]:[]),...(global||owner?[['/owners','Owner shares']]:[]),...(global?[['/people','People'],['/settings','Settings']]:[])];
 const title=menu.find(m=>m[0]===path)?.[1]||'Overview';
 const form=(a,label,body)=>'<details><summary>'+label+'</summary><form method="post" action="/save"><input type="hidden" name="csrf" value="'+ctx.csrf+'"><input type="hidden" name="version" value="'+ctx.version+'"><input type="hidden" name="action" value="'+a+'"><input type="hidden" name="return" value="'+path+'">'+body+'<button>'+label+'</button></form></details>';
 const dateInput=()=>input('date','Date','date',today());const personSelect=(key,role,label)=>options(key,label,s.people.filter(p=>!role||p.roles.includes(role)).map(p=>[p.id,p.name]));
 const clients=s.clients.filter(c=>global||c.history.some(h=>h.partners.some(p=>p.id===u.id)));
 const pickClient=()=>options('client','Client',clients.map(c=>[c.id,c.name]));
 const clientsTable=table(['Client','Agreement effective'],clients.map(c=>['<a href="/clients?client='+encodeURIComponent(c.id)+'">'+esc(c.name)+'</a>',esc(c.history.at(-1)?.from||'Needs terms')]));
 const deals=s.deals.filter(d=>global||d.pid===u.id);
 const receipts=s.receipts.filter(r=>global||r.shares.some(p=>p.id===u.id));
 const entries=receipts.flatMap(r=>r.shares.filter(p=>global||p.id===u.id).map(p=>({...p,cid:r.cid,date:r.date,ref:r.ref})));
 const payouts=s.payouts.filter(p=>global||p.person===u.id);
 const metrics=pairs=>'<div class="metrics">'+pairs.map(([l,v])=>'<article><small>'+l+'</small><strong>'+v+'</strong></article>').join('')+'</div>';
 const expenseKey=clients.map(c=>esc(c.name)+' = '+esc(c.id)).join(' · ');
 const dealTable=table(['Prospect','Referral partner','Stage','Next follow-up'],deals.map(d=>[esc(d.name)+(d.duplicate&&global?' <b>Check overlap</b>':''),esc(names[d.pid]),esc(d.stage),esc(d.follow||'—')]));
 const payoutTable=table(['Recipient','Type','Date','Amount','Method','Reference'],payouts.map(p=>[esc(names[p.person]),esc(p.kind),esc(p.date),money(p.amount),esc(p.method),esc(p.ref)]));
 let body='';
 if(path==='/'){
 const myOwner=owners(s).flatMap(m=>m.shares).filter(p=>global||p.id===u.id);
 body=global?metrics([['Collected fees',money(sum(receipts,'amount'))],['Referral commissions',money(sum(entries,'amount'))],['Owner shares',money(sum(myOwner,'amount'))]]):metrics([...(partner?[['My commissions',money(sum(entries,'amount'))],['Referral payouts',money(sum(payouts.filter(p=>p.kind==='partner'),'amount'))]]:[]),...(owner?[['My owner shares',money(sum(myOwner,'amount'))]]:[])]);
 if(partner||global)body+=panel('Sales follow-up',dealTable);body+=panel('Recent payouts',payoutTable);
 }
 if(path==='/sales'){
 body=panel('Pipeline',stages.map(stage=>{const list=deals.filter(d=>d.stage===stage);return '<article class="lane"><h3>'+stage+' <small>'+list.length+'</small></h3>'+list.map(d=>'<div class="card"><strong>'+esc(d.name)+'</strong><p>'+esc(d.contact)+'</p><small>'+esc(d.follow||'No follow-up date')+'</small></div>').join('')+'</article>'}).join('')).replace('<section>','<section class="board">');
 if(admin||partner)body+=form('refer','Submit referral',input('name','Company')+input('contact','Contact name or email')+(admin?personSelect('partner','partner','Referring partner'):'')+input('follow','Follow-up date','date','',false));
 if(admin)body+=form('stage','Update opportunity',options('deal','Opportunity',deals.map(d=>[d.id,d.name+' · '+names[d.pid]]))+options('stage','Stage',stages.map(x=>[x,x]))+options('client','When won, link to',[['','Create a client'],...clients.map(c=>[c.id,c.name])])+input('follow','Next follow-up','date','',false)+input('note','Review or follow-up notes','text','',false));body+=panel('Referral register',dealTable);if(global)body+=panel('Stage history',table(['Prospect','Date','Change','Note'],deals.flatMap(d=>(d.history||[]).map(h=>[esc(d.name),h.at,esc(h.from)+' → '+esc(h.to),esc(h.note)]))));
 }
 if(path==='/clients'){
 body=panel('Client directory',clientsTable);
 const c=clients.find(x=>x.id===ctx.client)||clients[0];if(c){const t=c.history.at(-1);body+=panel(esc(c.name),t?table(['Partner','Fixed fee share','Performance fee share','Start','End'],t.partners.filter(p=>global||p.id===u.id).map(p=>[esc(names[p.id]),p.rate/100+'%',p.performance/100+'%',esc(p.start||t.from),esc(p.end||'Ongoing')])):'<p>Set up this client’s first agreement.</p>');if(t&&global)body+=panel('Current fee agreement',metrics([['Monthly retainer',money(t.retainer)],['Split method',t.pool===null?'Individual':t.pool/100+'% pool'],['Tier method',esc(t.mode)]]));}
 if(admin)body+=form('terms','Add agreement version',pickClient()+input('date','Effective date','date',today())+input('retainer','Monthly retainer ($)','number',0)+options('mode','Performance fee tiers',[['marginal','Marginal tiers'],['whole','Whole month']])+multi('tiers','Tier rows · upper sales limit, rate (%)','50000,5\n*,7')+options('eligible','Commissionable fees',[['both','All fees'],['fixed','Fixed fees only'],['performance','Performance fees only']])+options('split','Partner split method',[['individual','Individual rates'],['pool','Shared pool']])+input('pool','Pool percentage','number',0)+multi('partners','Partner rows · ID, fixed %, performance %, start date, end date','partner,10,15')+multi('owners','Owner rows · ID, percentage','owner,50\nsuper,30')+'<p>Participant IDs: '+s.people.map(p=>esc(p.name)+' ('+esc(p.id)+')').join(' · ')+'</p>');
 }
 if(path==='/earnings'){
 const feeSelect=()=>options('fee','Fee entry',s.fees.map(f=>[f.id,clientName(f.cid)+' · '+f.reference]));
 body=panel('Client fees',table(['Client','Reference','Date','Fixed fee','Performance fee'],s.fees.map(f=>[esc(clientName(f.cid)),esc(f.reference),f.date,money(f.fixed),money(f.perf)])))+panel('Collections and refunds',table(['Client','Date','Reference','Amount'],receipts.map(r=>[esc(clientName(r.cid)),r.date,esc(r.ref),money(r.amount)])));
 if(admin){body+=form('fee','Record fee',pickClient()+dateInput()+input('ref','Invoice or fee reference')+input('fixed','Fixed fee ($)','number',0)+options('calc','Performance fee method',[['direct','Enter fee'],['sales','Calculate from sales']])+input('sales','Qualifying sales ($)','number',0)+input('performance','Known performance fee ($)','number',0));
 body+=form('receipt','Record client payment',pickClient()+feeSelect()+dateInput()+input('amount','Amount collected ($)','number')+input('override','Fixed fee allocation override ($), optional','number','',false)+input('method','Payment method')+input('ref','Payment reference'));
 body+=form('refund','Record refund',pickClient()+feeSelect()+options('receipt','Original receipt',receipts.filter(r=>r.amount>0).map(r=>[r.id,r.ref+' · '+clientName(r.cid)]))+dateInput()+input('amount','Refund ($)','number')+options('deduct','Referral commission adjustment',[['yes','Deduct from future payout'],['no','Agency absorbs refund']])+input('ref','Refund reference'))}
 }
 if(path==='/commissions'){
 const paid=payouts.filter(p=>p.kind==='partner');body=metrics([['Earned',money(sum(entries,'amount'))],['Paid',money(sum(paid,'amount'))],['Outstanding',money(sum(entries,'amount')-sum(paid,'amount'))]])+panel('Commission statement',table(['Client','Partner','Received','Calculation','Earned'],entries.map(p=>[esc(clientName(p.cid)),esc(names[p.id]),p.date,p.detail.map(x=>x.type+' '+money(x.base)+' × '+x.rate/100+'%').join('<br>')||'Refund adjustment',money(p.amount)])))+panel('Payout history',payoutTable);
 if(partner)body+=form('preference','Request payout preference change',input('preference','Preferred method and payout identifier')+'<p>Approved: '+esc(u.preference||'None')+' · Pending: '+esc(u.pending||'None')+'</p>');
 if(admin)body+=form('payout','Record external payout',personSelect('person',null,'Recipient')+options('kind','Earnings type',[['partner','Referral commission'],['owner','Owner share']])+dateInput()+input('amount','Amount ($)','number')+input('method','Method')+input('ref','Reference'));
 }
 if(path==='/owners'){
 const m=owners(s).filter(x=>global||x.shares.some(p=>p.id===u.id));body=panel('Monthly owner distributions',table(global?['Client','Month','Collections','Referral commissions','Expenses','Opening loss','Available','Owner shares','Reserve','Closing loss']:['Client','Month','My share'],m.map(x=>global?[esc(clientName(x.cid)),x.month,money(x.income),money(x.commission),money(x.expenses),money(x.opening),money(x.available),x.shares.map(p=>esc(names[p.id])+' '+money(p.amount)).join('<br>'),money(x.reserve),money(x.loss)]:[esc(clientName(x.cid)),x.month,money(x.shares.find(p=>p.id===u.id).amount)])));
 if(global)body+=panel('Expense allocations',table(['Bill','Date','Total','Client allocations'],s.expenses.map(e=>[esc(e.name),e.date,money(e.amount),e.lines.map(l=>esc(clientName(l.cid))+' '+money(l.amount)).join('<br>')])));
 if(admin)body+=form('expense','Record expense',input('name','Vendor or expense')+dateInput()+input('amount','Bill total ($)','number')+multi('lines','One allocation per line · client ID, dollars','alder,200\nharbor,100')+'<p>'+expenseKey+'</p>');}
 if(path==='/people'){body=panel('User directory',table(['Person','Login','Roles','Approved payment preference','Requested change'],s.people.map(p=>[esc(p.name),esc(p.email),p.roles.map(x=>esc(x==='super'?'Super User':x)).join(', '),admin?esc(p.preference||'—'):'Restricted',admin?esc(p.pending||'—'):'Restricted'])));if(admin)body+=form('super','Update Super User designation',personSelect('person',null,'Person')+options('enabled','Agency-wide financial reporting',[['yes','Grant Super User'],['no','Remove Super User']]))+form('approvePreference','Approve payout preference',personSelect('person','partner','Partner'));}
 if(path==='/settings'){body=panel('Monthly payout schedule','<p>Prior-month referral commissions are due on day <strong>'+s.day+'</strong> of the following month.</p>');if(admin)body+=form('settings','Set payout day',input('day','Day of month (1–28)','number',s.day));}
 return doc(title,'<aside><div class="brand">AgentCRM</div><small>Agency workspace</small><nav>'+menu.map(([url,name])=>'<a '+(url===path?'aria-current="page"':'')+' href="'+url+'">'+name+'</a>').join('')+'</nav></aside><main><header><span>Synthetic demo</span><span>'+esc(u.name)+' · '+esc(u.roles.join(' / '))+'</span><form method="post" action="/logout"><input type="hidden" name="csrf" value="'+ctx.csrf+'"><button>Sign out</button></form></header><h1>'+title+'</h1>'+(ctx.saved?'<p role="status">Changes saved.</p>':'')+body+'</main>');
}

