import {invoiceBalance,reportableReceipts} from './model.js';

import { replayPartnerAllocations } from './payout-allocations.js';

export function paymentTrace(state,invoice) {
  const open=invoiceBalance(state,invoice).reduce((sum,amount)=>sum+amount,0);
  const receipts=state.receipts.filter(receipt=>receipt.fee===invoice.id)
    .sort((a,b)=>a.date.localeCompare(b.date));
  const approved=new Set(reportableReceipts(state));
  const allocations=replayPartnerAllocations(state,approved);
  const payouts=state.payouts.flatMap(payout=>{
    const rows=payout.applications??(allocations.get(payout.id)||[]).map(({lot,amount})=>({fee:lot?.fee,amount}));
    const amount=rows.filter(row=>row.fee===invoice.id).reduce((sum,row)=>sum+row.amount,0);
    return amount?[{...payout,attributed:amount,allocationBasis:payout.applications?'Recorded':'Historical estimate'}]:[];
  });
  return {invoice,open,receipts,approved,payouts};
}

export function payoutAllocationExport(state) {
  const people=new Map(state.people.map(person=>[person.id,person.name]));
  const receipts=new Map(state.receipts.map(receipt=>[receipt.id,receipt]));
  const fees=new Map(state.fees.map(fee=>[fee.id,fee]));
  const clients=new Map(state.clients.map(client=>[client.id,client.name]));
  const payouts=new Map(state.payouts.map(payout=>[payout.id,payout]));
  const columns=['Payout date','Payout reference','Entry','Original payout','Partner','Client','Invoice reference','Commission reference','Applied amount ($)'];
  const rows=state.payouts.flatMap(payout=>(payout.applications||[]).map(line=>{
    const fee=fees.get(line.fee);
    return [payout.date,payout.ref,payout.reverses?'Reversal':'Payout',payouts.get(payout.reverses)?.ref??'',
      people.get(payout.person)??payout.person,clients.get(fee?.cid)??'',fee?.reference??'',
      receipts.get(line.receipt)?.ref??'',line.amount];
  }));
  return {definition:{columns,capabilities:['csv']},rows};
}
