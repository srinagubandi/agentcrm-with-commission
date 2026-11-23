import { esc } from './views.js';
const usd = n => new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'}).format(n/100);
const financialActions = ['fee','receipt','refund','payout','reversePayout','expense','terms','adjustment','closeMonth','batchPayout','approveReceipt'];
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
    if(r.original)lines.push(['Invoice treatment',r.reopened?'Reopen refunded amount':'Keep invoice settled']);
    if(r.parts.length) lines.push(['Retainer allocation',usd(r.parts[0])],['Performance allocation',usd(r.parts[1])]);
    for(const p of r.shares)lines.push([names.get(p.id),usd(p.amount)]);
  } else if (data.action==='reversePayout') {
    const p=state.payouts.at(-1);
    const original=state.payouts.find(row=>row.id===p.reverses);
    lines=[['Original payout',original.ref],['Recipient',names.get(p.person)],['Reversal date',p.date],
      ['Ledger adjustment',usd(p.amount)],['Reason',p.reason],['Effect','Records a ledger correction only. Verify cash recovery separately.']];
  } else if (data.action==='payout') {
    const p=state.payouts.at(-1);
    lines=[['Recipient',names.get(p.person)],['Payment method',p.method],['Reference',p.ref],
      ['Available before payout',usd(p.availableBefore)],['Amount',usd(p.amount)],['Available after payout',usd(p.availableBefore-p.amount)]];
  } else if (data.action==='batchPayout') {
    const count=data.rows.split(/\r?\n/).filter(line=>line.trim()).length;
    const batch=state.payouts.slice(-count);
    const recipients=new Map();
    for(const p of batch){
      const key=p.kind+'|'+p.person;
      const row=recipients.get(key)||{name:names.get(p.person),kind:p.kind,before:p.availableBefore,total:0};
      row.total+=p.amount;
      row.after=p.availableBefore-p.amount;
      recipients.set(key,row);
    }
    lines=[['Payout count',count],['Total',usd(batch.reduce((total,p)=>total+p.amount,0))],
      ...[...recipients.values()].map(row=>['Recipient reconciliation · '+row.name+' ('+row.kind+')',
        usd(row.before)+' before · '+usd(row.total)+' selected · '+usd(row.after)+' remaining']),
      ...batch.map((p,index)=>['Row '+(index+1)+' · '+names.get(p.person),
        p.kind+' · '+p.ref+' · '+usd(p.amount)+' · available '+usd(p.availableBefore)+' before / '+usd(p.availableBefore-p.amount)+' after'])];
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

export function batchRetryPage(data,message) {
  const hidden=['csrf','version','action','return'].map(key=>
    '<input type="hidden" name="'+key+'" value="'+esc(data[key])+'">').join('');
  return '<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Correct payout batch</title><link rel="stylesheet" href="/style.css"></head><body><main><h1>Correct payout batch</h1><p role="alert">'+esc(message)+'</p><form method="post" action="/save">'+hidden+
    '<label>Payout date<input name="date" type="date" required value="'+esc(data.date)+'"></label><label>Payment method<input name="method" required value="'+esc(data.method)+'"></label><label>One payout per line: recipient ID, type, dollars, reference<textarea name="rows" required rows="8">'+esc(data.rows)+'</textarea></label><button name="preview" value="yes">Review corrected batch</button></form><p><a href="/commissions">Cancel</a></p></main></body></html>';
}
