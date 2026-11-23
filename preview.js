import { esc } from './views.js';
const usd = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
const financialActions = ['fee','receipt','refund','payout','expense','terms','adjustment','closeMonth','batchPayout','approveReceipt'];
export function hasPreview(action) {return financialActions.includes(action)}
export function previewPage(state, data) {
  const names=new Map(state.people.map(p=>[p.id,p.name]));
  let lines=[];
  if (data.action==='fee') {
    const fee=state.fees.at(-1);
    lines=[['Fixed fee',usd(fee.fixed)],['Performance fee',usd(fee.perf)],['Total fees',usd(fee.fixed+fee.perf)]];
  } else if (['receipt','refund','adjustment','approveReceipt'].includes(data.action)) {
    const r=data.action==='approveReceipt'?state.receipts.find(receipt=>receipt.id===data.receipt):state.receipts.at(-1);
    lines=[['Payment reference',r.ref],['Amount',usd(r.amount)]];
    if(r.approval)lines.push(['Commission status',r.approval==='draft'?'Draft — approve before payout':'Approved']);
    if(r.reason)lines.push(['Correction reason',r.reason]);
    if(r.parts.length) lines.push(['Retainer allocation',usd(r.parts[0])],['Performance allocation',usd(r.parts[1])]);
    for(const p of r.shares)lines.push([names.get(p.id),usd(p.amount)]);
  } else if (data.action==='payout') {
    const p=state.payouts.at(-1);
    lines=[['Recipient',names.get(p.person)],['Payment method',p.method],['Reference',p.ref],['Amount',usd(p.amount)]];
  } else if (data.action==='batchPayout') {
    const count=data.rows.split(/\r?\n/).filter(line=>line.trim()).length;
    const batch=state.payouts.slice(-count);
    lines=[['Payout count',count],['Total',usd(batch.reduce((total,p)=>total+p.amount,0))],
      ...batch.map(p=>[names.get(p.person),p.kind+' · '+p.ref+' · '+usd(p.amount)])];
  } else if (data.action==='closeMonth') {
    const close=state.closes.at(-1);
    lines=[['Client',state.clients.find(c=>c.id===close.cid).name],['Close through',close.month],
      ['Distributable this month',usd(close.settled?.available??0)],['Loss carried forward',usd(close.loss)],
      ['Effect','Earlier entries and agreements for this client will be locked.']];
  } else if (data.action==='expense') {
    const e=state.expenses.at(-1);
    lines=[['Bill',e.name],['Total',usd(e.amount)],...e.lines.map(l=>[state.clients.find(c=>c.id===l.cid).name,usd(l.amount)])];
  } else {
    const c=state.clients.find(c=>c.id===data.client),t=c.history.at(-1);
    lines=[['Client',c.name],['Effective date',t.from],['Retainer',usd(t.retainer)],['Split method',t.pool===null?'Individual rates':'Shared pool '+t.pool/100+'%'],
       ...t.partners.map(p=>[names.get(p.id),'Fixed '+p.rate/100+'%, performance '+p.performance/100+'%']),
       ...t.owners.map(p=>[names.get(p.id)+' owner share',p.rate/100+'%'])];
  }
  const safeReturn=['/clients','/earnings','/owners','/commissions'].includes(data.return)?data.return:'/';
  const inputs=Object.entries(data).filter(([k])=>k!=='preview').map(([k,v])=>'<input type="hidden" name="'+esc(k)+'" value="'+esc(v)+'">').join('');
  return '<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>Review entry · AgentCRM</title><link rel="stylesheet" href="/style.css"><main><h1>Review entry</h1><section><dl>'+lines.map(([k,v])=>'<dt>'+esc(k)+'</dt><dd>'+esc(v)+'</dd>').join('')+'</dl><form method="post" action="/save">'+inputs+'<button>Confirm and save</button></form><p><a href="'+safeReturn+'">Cancel</a></p></section></main></html>';
}
