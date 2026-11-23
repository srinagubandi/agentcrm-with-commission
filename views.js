import {myViews} from './saved-views.js';
import {visibleReports,reportPanel} from './report-engine.js';
import {availablePayout,invoiceBalance,owners,reportableReceipts,stages,today,visibleClients} from './model.js';
import {closeSummary} from './close-summary.js';
import {paymentTrace} from './payment-trace.js';
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
 const menu=[['/','Overview'],['/reports','Reports'],...(global||partner?[['/sales','Sales pipeline'],['/clients','Clients']]:[]),...(global?[['/earnings','Monthly earnings']]:[]),...(global||partner?[['/commissions','Commissions']]:[]),...(global||owner?[['/owners','Owner shares']]:[]),...(global?[['/people','People'],['/settings','Settings']]:[])];
 const title=menu.find(m=>m[0]===path)?.[1]||'Overview';
 const form=(a,label,body)=>'<details><summary>'+label+'</summary><form method="post" action="/save"><input type="hidden" name="csrf" value="'+ctx.csrf+'"><input type="hidden" name="version" value="'+ctx.version+'"><input type="hidden" name="action" value="'+a+'"><input type="hidden" name="return" value="'+path+'">'+body+(['fee','receipt','refund','expense','payout','terms','adjustment','closeMonth','batchPayout','approveReceipt','reversePayout'].includes(a)?'<button name="preview" value="yes">Review entry</button>':'<button>'+label+'</button>')+'</form></details>';
  const preferenceForm=()=>form('preference','Request payout preference change',input('preference','Payment method and masked identifier (last four only)')+
   '<p>Approved: '+esc(u.preference||'None')+' · Pending: '+esc(u.pending||'None')+'</p>');
 const dateInput=()=>input('date','Date','date',today());const personSelect=(key,role,label)=>options(key,label,s.people.filter(p=>!role||p.roles.includes(role)).map(p=>[p.id,p.name]));
 const clients=visibleClients(s,u);
 const pickClient=()=>options('client','Client',clients.map(c=>[c.id,c.name]));
 const clientsTable=table(['Client','Agreement effective'],clients.map(c=>['<a href="/clients?client='+encodeURIComponent(c.id)+'">'+esc(c.name)+'</a>',esc(c.history.at(-1)?.from||'Needs terms')]));
 const deals=s.deals.filter(d=>global||d.pid===u.id);
 const receipts=global?s.receipts:reportableReceipts(s).filter(r=>r.shares.some(p=>p.id===u.id));
 const approvedReceipts=new Set(reportableReceipts(s));
 const entries=receipts.flatMap(r=>r.shares.filter(p=>global||p.id===u.id).map(p=>({
   ...p,cid:r.cid,date:r.date,ref:r.ref,reason:r.reason,
   type:r.original?'Refund':r.adjusts?'Commission correction':'Payment',
   status:approvedReceipts.has(r)?'Approved':'Draft'
 })));
 const payouts=s.payouts.filter(p=>global||p.person===u.id);
 const metrics=pairs=>'<div class="metrics">'+pairs.map(([l,v])=>'<article><small>'+l+'</small><strong>'+v+'</strong></article>').join('')+'</div>';
 const expenseKey=clients.map(c=>esc(c.name)+' = '+esc(c.id)).join(' · ');
 const dealTable=table(['Prospect','Referral partner','Stage','Next follow-up'],deals.map(d=>[esc(d.name)+(d.duplicate&&global?' <b>Check overlap</b>':''),esc(names[d.pid]),esc(d.stage),esc(d.follow||'—')]));
 const payoutTable=records=>table(['Recipient','Type','Date','Amount','Method','Reference',...(global?['Reversal reason']:[])],
   records.map(p=>[esc(names[p.person]),esc(p.kind),esc(p.date),money(p.amount),esc(p.method),esc(p.ref),...(global?[esc(p.reason||'')]:[])]));
 const reverseForm=kind=>{
   const reversed=new Set(s.payouts.map(p=>p.reverses).filter(Boolean));
   const eligible=s.payouts.filter(p=>p.kind===kind&&p.amount>0&&!reversed.has(p.id));
   if(!eligible.length)return '';
   return form('reversePayout','Reverse a recorded payout',
     options('payout','Original payout',eligible.map(p=>[p.id,p.date+' · '+names[p.person]+' · '+p.ref+' · '+money(p.amount)]))+
     dateInput()+input('reason','Reason for the ledger reversal')+
     '<p>Use this to correct a mistaken entry or record funds already recovered. This entry changes the ledger only.</p>');
 };
 let body=path==='/reports'?reportPanel(s,u,ctx.query||new URLSearchParams()):'';
 if(path==='/reports'){
   const q=new URLSearchParams(ctx.query||'');
   if(!q.has('report'))q.set('report',visibleReports(u)[0]?.id||'');
   const available=myViews(s,u);
   if(available.length)body+=panel('My saved views','<ul>'+available.map(v=>'<li><a href="/reports?'+esc(v.query)+'">'+esc(v.name)+'</a></li>').join('')+'</ul>')+form('removeView','Remove saved view',options('view','View',available.map(v=>[v.id,v.name])));
   body+=form('saveView','Save current report view',input('title','View name')+'<input type="hidden" name="selection" value="'+esc(q.toString())+'">');
 }
 if(path==='/'){
 const myOwner=owners(s).flatMap(m=>m.shares).filter(p=>global||p.id===u.id);
 body=global?metrics([['Collected fees',money(sum(receipts,'amount'))],['Referral commissions',money(sum(entries,'amount'))],['Owner shares',money(sum(myOwner,'amount'))]]):metrics([...(partner?[['My commissions',money(sum(entries,'amount'))],['Referral payouts',money(sum(payouts.filter(p=>p.kind==='partner'),'amount'))]]:[]),...(owner?[['My owner shares',money(sum(myOwner,'amount'))]]:[])]);
 const due = deals.filter(d=>d.follow && d.follow<=today() && !['Won','Lost'].includes(d.stage))
   .sort((a,b)=>a.follow.localeCompare(b.follow));
 const attention = due.length ? '<ul class="attention">'+due.map(d=>'<li><strong>'+esc(d.name)+'</strong><span>'+esc(d.stage)+'</span><time>'+esc(d.follow)+'</time></li>').join('')+'</ul>' : '<p class="empty">No open referrals are due for follow-up.</p>';
 if(global||partner){
   const queue = panel('Attention Queue',attention+'<a href="/sales">Open sales pipeline</a>');
   const ledger = global ? panel('Reconciliation ledger',table(['Client','Payment reference','Date','Collected'],receipts.slice().sort((a,b)=>b.date.localeCompare(a.date)).slice(0,8).map(r=>[esc(clientName(r.cid)),esc(r.ref),esc(r.date),money(r.amount)]))+'<a href="/earnings">View monthly earnings</a>') : panel('My disbursement ledger',payoutTable(payouts));
   body+='<div class="overview-columns">'+queue+ledger+'</div>'+panel('Sales follow-up',dealTable);
 }
 if(global||!partner) body+=panel('Recent payouts',payoutTable(payouts));
 }
 if(path==='/sales'){
 body=panel('Pipeline',stages.map(stage=>{const list=deals.filter(d=>d.stage===stage);return '<article class="lane"><h3>'+stage+' <small>'+list.length+'</small></h3>'+list.map(d=>'<div class="card"><strong>'+esc(d.name)+'</strong><p>'+esc(d.contact)+'</p><small>'+esc(d.follow||'No follow-up date')+'</small></div>').join('')+'</article>'}).join('')).replace('<section>','<section class="board">');
 if(admin||partner)body+=form('refer','Submit referral',input('name','Company')+input('contact','Contact name or email')+(admin?personSelect('partner','partner','Referring partner'):'')+input('follow','Follow-up date','date','',false));
 if(admin)body+=form('stage','Update opportunity',options('deal','Opportunity',deals.map(d=>[d.id,d.name+' · '+names[d.pid]]))+options('stage','Stage',stages.map(x=>[x,x]))+options('client','When won, link to',[['','Create a client'],...clients.map(c=>[c.id,c.name])])+input('follow','Next follow-up','date','',false)+input('note','Review or follow-up notes','text','',false)+input('additionalPartners','Additional partner IDs, comma-separated. Leave blank to keep or enter - to clear.','text','',false)+'<p>'+s.people.filter(p=>p.roles.includes('partner')).map(p=>esc(p.name)+' ('+esc(p.id)+')').join(' · ')+'</p>');body+=panel('Referral register',dealTable);if(global)body+=panel('Stage history',table(['Prospect','Date','Change','Note'],deals.flatMap(d=>(d.history||[]).map(h=>[esc(d.name),h.at,esc(h.from)+' → '+esc(h.to),esc(h.note)]))));
 }
 if(path==='/clients'){
 body=panel('Client directory',clientsTable);
 const c=clients.find(x=>x.id===ctx.client)||clients[0];if(c){const t=c.history.filter(h=>h.from<=today()).at(-1);body+=panel(esc(c.name),t?table(global?['Partner','Fixed fee share','Performance fee share','Start','End']:['Partner','Start','End'],t.partners.filter(p=>global||p.id===u.id).map(p=>[esc(names[p.id]),...(global?[p.rate/100+'%',p.performance/100+'%']:[]),esc(p.start||t.from),esc(p.end||'Ongoing')])):'<p>Set up this client’s first agreement.</p>');if(t&&global)body+=panel('Current fee agreement',metrics([['Monthly retainer',money(t.retainer)],['Split method',t.pool===null?'Individual':t.pool/100+'% pool'],['Tier method',esc(t.mode)]]));}
 if(admin)body+=form('terms','Add agreement version',pickClient()+input('date','Effective date','date',today())+input('retainer','Monthly retainer ($)','number',0)+options('mode','Performance fee tiers',[['marginal','Marginal tiers'],['whole','Whole month']])+multi('tiers','Tier rows · upper sales limit, rate (%)','50000,5\n*,7')+options('eligible','Commissionable fees',[['both','All fees'],['fixed','Fixed fees only'],['performance','Performance fees only']])+options('split','Partner split method',[['individual','Individual rates'],['pool','Shared pool']])+input('pool','Pool percentage','number',0)+multi('partners','Partner rows · ID, fixed %, performance %, start date, end date','partner,10,15')+multi('owners','Owner rows · ID, percentage','owner,50\nsuper,30')+'<p>Participant IDs: '+s.people.map(p=>esc(p.name)+' ('+esc(p.id)+')').join(' · ')+'</p>');
 }
 if(path==='/earnings'){
 const selected=clients.find(client=>client.id===ctx.client)??clients[0];
 const selectedFees=s.fees.filter(fee=>fee.cid===selected?.id);
 const originalReceipts=receipts.filter(receipt=>receipt.cid===selected?.id&&receipt.amount>0);
 const scopedClient='<input type="hidden" name="client" value="'+esc(selected?.id)+'"><p>Client: '+esc(selected?.name)+'</p>';
 const feeSelect=()=>options('fee','Fee entry',selectedFees.map(f=>[f.id,clientName(f.cid)+' · '+f.reference]));
 const receiptSelect=()=>options('receipt','Original receipt',originalReceipts.map(r=>[r.id,r.ref+' · '+clientName(r.cid)]));
 const selectClient='<form method="get" action="/earnings"><label>Client for payment entries<select name="client">'+clients.map(client=>'<option value="'+esc(client.id)+'"'+(client.id===selected?.id?' selected':'')+'>'+esc(client.name)+'</option>').join('')+'</select></label><button>Choose client</button></form>';
 body=panel('Client fees',table(['Client','Reference','Date','Fixed fee','Performance fee','Outstanding'],s.fees.map(f=>[esc(clientName(f.cid)),'<a href="/earnings?client='+encodeURIComponent(f.cid)+'&amp;invoice='+encodeURIComponent(f.id)+'">'+esc(f.reference)+'</a>',f.date,money(f.fixed),money(f.perf),money(invoiceBalance(s,f).reduce((a,b)=>a+b,0))])))+panel('Collections and refunds',table(['Client','Date','Reference','Amount'],receipts.map(r=>[esc(clientName(r.cid)),r.date,esc(r.ref),money(r.amount)])));
 const clientReceipts=receipts.filter(r=>r.cid===selected?.id);
 const latest=clientReceipts.map(r=>r.date).sort().at(-1)||today();
 const requestedMonth=ctx.query?.get('period');
 const period=/^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth||'')?requestedMonth:latest.slice(0,7);
 const rows=clientReceipts.filter(r=>r.date.startsWith(period));
 const partnerTotals=new Map();
 for(const r of rows)for(const share of r.shares)partnerTotals.set(share.id,(partnerTotals.get(share.id)||0)+share.amount);
 const cash=sum(rows,'amount'),partnerTotal=[...partnerTotals.values()].reduce((a,b)=>a+b,0);
 const monthPicker='<form class="scope-picker" action="/earnings"><label>Client<select name="client">'+clients.map(c=>'<option value="'+esc(c.id)+'" '+(c.id===selected?.id?'selected':'')+'>'+esc(c.name)+'</option>').join('')+'</select></label>'+input('period','Period','month',period)+'<button>Apply</button></form>';
 const feeCards=['Performance fee','Fixed monthly retainer'].map((label,index)=>{
   const value=rows.reduce((total,r)=>total+(r.parts?.[index===0?1:0]||0),0);
   return '<article class="fee-card"><small>Agency collected fee</small><h3>'+label+'</h3><strong>'+money(value)+'</strong></article>';
 }).join('');
 const breakdown=[...partnerTotals].map(([id,amount])=>'<li><span class="monogram" aria-hidden="true">'+esc((names[id]||id).split(/\s+/).map(w=>w[0]).slice(0,2).join(''))+'</span><span>'+esc(names[id]||id)+'</span><strong>'+money(amount)+'</strong></li>').join('');
 body='<section class="settlement"><div><small>Settlement period</small><h2>'+esc(selected?.name||'No client selected')+'</h2><p>Referral commissions are based on eligible agency fees collected for this client.</p></div>'+monthPicker+'</section><div class="fee-grid"><div><h2>Agency Fee Composition</h2>'+feeCards+'<div class="fee-summary">Net collections, including refunds <strong>'+money(cash)+'</strong></div></div><div><h2>Partner Commission Breakdown</h2><section class="distribution"><small>Partner &amp; agreed cut</small><ul>'+breakdown+'</ul>'+(!breakdown?'<p>No commission entries this period.</p>':'')+'<div class="fee-summary">Partner share <strong>'+money(partnerTotal)+'</strong></div><div class="fee-summary">Agency retained before expenses <strong>'+money(cash-partnerTotal)+'</strong></div></section></div></div>'+body;
 const selectedInvoice=s.fees.find(fee=>fee.id===ctx.query?.get('invoice'));
 if(selectedInvoice){
   const trace=paymentTrace(s,selectedInvoice);
   const references=new Map(trace.receipts.map(row=>[row.id,row.ref]));
   body+=panel('Payment history · '+esc(selectedInvoice.reference),
     '<p>'+esc(clientName(selectedInvoice.cid))+' · Outstanding '+money(trace.open)+'</p>'+
     table(['Date','Entry','Reference','Original reference','Cash','Commission entries','Approval'],
       trace.receipts.map(row=>[row.date,row.original?'Refund':row.adjusts?'Commission correction':'Collection',
         esc(row.ref),esc(references.get(row.original||row.adjusts)||''),money(row.amount),
         row.shares.map(share=>esc(names[share.id]||share.id)+' '+money(share.amount)).join('<br>'),
         row.approvedBy?'Approved by '+esc(names[row.approvedBy]||row.approvedBy)+' on '+esc(row.approvedAt):
           trace.approved.has(row)?(row.amount>0?'Recorded':'Posted'):'Draft']))+
     '<h3>Partner payout allocation</h3><p>New payouts record which approved commissions they cover. Earlier payouts without saved allocations show a historical estimate. Owner payouts are reconciled by month in <a href="/owners">Owner shares</a>.</p>'+
     table(['Date','Partner','Payout reference','Amount applied','Allocation basis'],
       trace.payouts.map(p=>[p.date,esc(names[p.person]||p.person),esc(p.ref),money(p.attributed),p.allocationBasis])));
 }
 if(admin){body+=form('fee','Record fee',pickClient()+dateInput()+input('ref','Invoice or fee reference')+input('fixed','Fixed fee ($), blank uses agreement retainer','number','',false)+options('calc','Performance fee method',[['direct','Enter fee'],['sales','Calculate from sales']])+input('sales','Qualifying sales ($)','number',0)+input('performance','Known performance fee ($)','number',0));
 body+=panel('Payment entry client',selectClient);
 if(selectedFees.length)body+=form('receipt','Record client payment',scopedClient+feeSelect()+dateInput()+input('amount','Amount collected ($)','number')+input('override','Fixed fee allocation override ($), optional','number','',false)+input('method','Payment method')+input('ref','Payment reference'));
 if(originalReceipts.length){
   body+=form('refund','Record refund',scopedClient+feeSelect()+receiptSelect()+dateInput()+input('amount','Refund ($)','number')+options('invoice','Invoice treatment',[['settled','Keep invoice settled'],['reopen','Reopen refunded amount']])+options('deduct','Referral commission adjustment',[['yes','Deduct from future payout'],['no','Leave commission unchanged']])+input('ref','Refund reference'));
   body+=form('adjustment','Correct partner commission',scopedClient+feeSelect()+receiptSelect()+personSelect('person','partner','Partner')+dateInput()+options('direction','Adjustment',[['credit','Increase commission'],['debit','Reduce commission']])+input('amount','Adjustment amount ($)','number')+input('reason','Explanation on partner statement')+input('ref','Correction reference'));
 }
 }
 }
 if(path==='/commissions'){
 const paid=payouts.filter(p=>p.kind==='partner');
 const recipients=s.people.filter(p=>p.roles.includes('partner')&&(global||p.id===u.id));
 const current=today();
 const cleared=sum(entries.filter(p=>p.status==='Approved'&&p.date<=current),'amount');
 const paidThroughToday=sum(paid.filter(p=>p.date<=current),'amount');
 body=metrics([...(global?[['Draft as of today',money(sum(entries.filter(p=>p.status==='Draft'&&p.date<=current),'amount'))]]:[]),
   ['Approved as of today',money(cleared)],['Paid as of today',money(paidThroughToday)],['Balance as of today',money(cleared-paidThroughToday)]])
   +panel('Available to pay today',table(['Recipient','Amount'],recipients.map(p=>[esc(p.name),money(availablePayout(s,p.id,'partner',current))])))
   +panel('Commission statement',table(['Client','Partner','Date','Entry','Reference',global?'Calculation':'Commission detail','Amount','Approval'],
    entries.map(p=>[esc(clientName(p.cid)),esc(names[p.id]),p.date,p.type,esc(p.ref),
      p.detail.map(line=>global ? line.type+' '+money(line.base)+' x '+line.rate/100+'%' : line.type+' commission '+money(line.amount)).join('<br>')||esc(p.reason||p.type),money(p.amount),p.status])))
   +panel('Partner payout history',payoutTable(paid));
 if(partner)body+=preferenceForm();
 if(admin)body+=form('payout','Record external payout',personSelect('person',null,'Recipient')+options('kind','Earnings type',[['partner','Referral commission'],['owner','Owner share']])+dateInput()+input('amount','Amount ($)','number')+input('method','Method')+input('ref','Reference'));
 if(admin)body+=reverseForm('partner');
 if(global)body+=panel('Payout review queue',
   '<p>Amounts as of '+current+'. Ready to pay reflects approval status and existing payout commitments.</p>'+
   table(['Partner','Held for approval','Approved','Net recorded payouts','Ready to pay'],recipients.map(person=>{
     const items=entries.filter(row=>row.id===person.id&&row.date<=current);
     return [esc(person.name),money(sum(items.filter(row=>row.status==='Draft'),'amount')),
       money(sum(items.filter(row=>row.status==='Approved'),'amount')),
       money(sum(paid.filter(row=>row.person===person.id&&row.date<=current),'amount')),
       money(availablePayout(s,person.id,'partner',current))];
   }))+'<p><a href="/commissions/allocations.csv">Download recorded payout allocations</a></p>');
 }
 if(path==='/owners'){
 const m=owners(s).filter(x=>global||x.shares.some(p=>p.id===u.id));body=panel('Monthly owner distributions',table(global?['Client','Month','Collections','Referral commissions','Expenses','Opening loss','Available','Owner shares','Reserve','Closing loss']:['Client','Month','My share'],m.map(x=>global?[esc(clientName(x.cid)),x.month,money(x.income),money(x.commission),money(x.expenses),money(x.opening),money(x.available),x.shares.map(p=>esc(names[p.id])+' '+money(p.amount)).join('<br>'),money(x.reserve),money(x.loss)]:[esc(clientName(x.cid)),x.month,money(x.shares.find(p=>p.id===u.id).amount)])));
 const ownerPayouts=payouts.filter(p=>p.kind==='owner');
 const ownerRecipients=s.people.filter(p=>p.roles.includes('owner')&&(global||p.id===u.id));
 const current=today();
 body+=panel('Owner payout reconciliation',table(['Owner','Distributions through prior month','Paid as of today','Balance as of today','Available to pay today'],
   ownerRecipients.map(person=>{
     const accrued=m.filter(row=>row.month<current.slice(0,7)).flatMap(row=>row.shares).filter(p=>p.id===person.id);
     const paid=sum(ownerPayouts.filter(row=>row.person===person.id&&row.date<=current),'amount');
     const earned=sum(accrued,'amount');
     return [esc(person.name),money(earned),money(paid),money(earned-paid),money(availablePayout(s,person.id,'owner',current))];
   })));
 body+=panel('Owner payout history',payoutTable(ownerPayouts));
 if(admin)body+=reverseForm('owner');
 if(global)body+=panel('Expense allocations',table(['Bill','Date','Total','Client allocations'],s.expenses.map(e=>[esc(e.name),e.date,money(e.amount),e.lines.map(l=>esc(clientName(l.cid))+' '+money(l.amount)).join('<br>')])));
 if(admin)body+=form('expense','Record expense',input('name','Vendor or expense')+dateInput()+input('amount','Bill total ($)','number')+options('allocation','Allocation method',[['custom','Exact dollar amounts'],['equal','Equal split'],['sales','Qualifying sales for bill month']])+multi('lines','One allocation per line · client ID, dollars','alder,200\nharbor,100')+'<p>For equal and sales-weighted splits, enter only a client ID on each line.</p><p>'+expenseKey+'</p>');}
   if(path==='/commissions'&&admin){
   const drafts=s.receipts.filter(r=>r.approval==='draft');
   if(drafts.length)body+=form('approveReceipt','Approve receipt commissions',
     options('receipt','Draft receipt',drafts.map(r=>[r.id,clientName(r.cid)+' · '+r.ref])));
 }
 if(path==='/commissions'&&admin)body+=form('batchPayout','Record payout batch',
   dateInput()+input('method','External payment method')+
   multi('rows','One payout per line: recipient ID, partner or owner, dollars, external reference','partner,partner,50.00,ACH-001')+
   '<p>'+s.people.filter(p=>p.roles.includes('partner')||p.roles.includes('owner')).map(p=>esc(p.name)+' ('+esc(p.id)+')').join(' · ')+'</p>');
 if(path==='/owners'&&owner)body+=preferenceForm();
 if(path==='/owners'&&global){
   const closed=s.closes||[];
   const link=c=>'?closedClient='+encodeURIComponent(c.cid)+'&amp;closedMonth='+encodeURIComponent(c.month);
   body+=panel('Closed client periods',table(['Client','Through month','Closed by','Closed at (UTC)','Settlement'],closed.map(c=>
     [esc(clientName(c.cid)),esc(c.month),esc(names[c.by]),esc(c.at),'<a href="/owners'+link(c)+'">Review '+esc(c.month)+' close</a>'])));
   const summary=closeSummary(s,ctx.query?.get('closedClient'),ctx.query?.get('closedMonth'));
   if(summary){
     const {close,client,closedBy,corrections}=summary;
     const values=close.settled??{};
     const download='/owners/close.csv?client='+encodeURIComponent(close.cid)+'&amp;month='+encodeURIComponent(close.month);
     body+=panel('Settlement through '+esc(close.month)+' · '+esc(client),
       '<p>Closed by '+esc(closedBy)+' on '+esc(close.at)+' UTC.</p>'+
       metrics([['Collections',money(values.income??0)],['Commission',money(values.commission??0)],['Expenses',money(values.expenses??0)],['Distributable',money(values.available??0)],['Reserve',money(values.reserve??0)],['Closing loss',money(close.loss)]])+
       '<p>Settlement SHA-256 <code class="breakable">'+esc(close.digest)+'</code></p><p><a href="'+download+'">Download close summary CSV</a></p>'+
       '<h3>Later corrections linked to this close</h3>'+
       table(['Posted','Type','Reference','Original reference','Cash','Commission'],corrections.map(c=>[c.date,c.type,esc(c.reference),esc(c.original),money(c.cash),money(c.commission)])));
   }
 }
 if(path==='/owners'&&admin)body+=form('closeMonth','Close client period',
   pickClient()+input('month','Close through month','month')+'<p>Earlier ledger entries and agreement dates become read-only for this client.</p>');
 if(path==='/people'){body=panel('User directory',table(['Person','Login','Roles','Approved payment preference','Requested change'],s.people.map(p=>[esc(p.name),esc(p.email),p.roles.map(x=>esc(x==='super'?'Super User':x)).join(', '),admin?esc(p.preference||'—'):'Restricted',admin?esc(p.pending||'—'):'Restricted'])));if(admin)body+=form('super','Update Super User designation',personSelect('person',null,'Person')+options('enabled','Agency-wide financial reporting',[['yes','Grant Super User'],['no','Remove Super User']]))+form('approvePreference','Approve payout preference',options('person','Recipient',s.people.filter(p=>p.pending).map(p=>[p.id,p.name])));}
 if(path==='/people'&&admin)body+=form('person','Add user',input('displayName','Full name')+input('email','Login email','email')+input('password','Initial password (14 or more characters)','password')+['partner','owner','admin','super'].map(role=>'<label><input type="checkbox" name="role_'+role+'" value="yes">'+esc(role==='super'?'Super User':role)+'</label>').join(''));
 if(path==='/settings'){body=panel('Monthly payout schedule','<p>Prior-month referral commissions are due on day <strong>'+s.day+'</strong> of the following month. Short months use their last calendar day.</p>');if(admin)body+=form('settings','Set payout day',input('day','Day of month (1–31)','number',s.day));}
 if(path==='/settings'&&admin)body+=panel('Recent changes',table(['When (UTC)','Person','Action'],(ctx.audit||[]).map(a=>[esc(a.at),esc(names[a.person]),esc(a.event)])));
 if(path==='/clients'&&admin)body+=form('client','Add client',input('name','Company')+input('contact','Primary contact','text','',false));
 if(path==='/clients'&&global){const c=clients.find(x=>x.id===ctx.client)||clients[0];if(c){if(c.referrals)body+=panel('Referral attribution',table(['Opportunity','Referral partners'],Object.entries(c.referrals).map(([id,ids])=>[esc(s.deals.find(d=>d.id===id)?.name||id),ids.map(p=>esc(names[p]||p)).join(', ')])));body+=panel('Client activity',table(['Date','Entered by','Note'],(c.notes||[]).map(n=>[n.date,esc(names[n.by]),esc(n.text)])));if(admin)body+=form('note','Add client note',pickClient()+input('note','Note'))}}
 return doc(title,'<a class="skip" href="#content">Skip to content</a><aside><div class="brand"><b aria-hidden="true">A</b>AgentCRM</div><div class="workspace-context"><small>Workspace</small><strong>'+esc(global?'Agency workspace':partner?'Partner portal':'Owner portal')+'</strong></div><nav aria-label="Workspace">'+menu.map(([url,name])=>'<a '+(url===path?'aria-current="page"':'')+' href="'+url+'">'+name+'</a>').join('')+'</nav></aside><main id="content" data-screen="'+esc(path.slice(1)||'overview')+'"><header><span>Synthetic demo</span><span>'+esc(u.name)+' · '+esc(u.roles.join(' / '))+'</span><form method="post" action="/logout"><input type="hidden" name="csrf" value="'+ctx.csrf+'"><button>Sign out</button></form></header><h1>'+esc(title)+'</h1>'+(ctx.saved?'<p role="status">Changes saved.</p>':'')+body+'</main>');
}
