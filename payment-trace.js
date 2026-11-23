import {invoiceBalance,reportableReceipts} from './model.js';

function estimatePartnerAllocations(state) {
  const approved=new Set(reportableReceipts(state));
  const events=[
    ...state.receipts.flatMap(receipt=>receipt.shares.filter(share=>approved.has(receipt)||share.amount<0)
      .map(share=>({date:receipt.date,person:share.id,earned:share.amount,receipt}))),
    ...state.payouts.filter(payout=>payout.kind==='partner')
      .map(payout=>({date:payout.date,person:payout.person,payout}))
  ].sort((a,b)=>a.date.localeCompare(b.date));
  const ledgers=new Map();
  const allocations=new Map();
  function ledger(person) {
    if(!ledgers.has(person))ledgers.set(person,{lots:[],debt:0});
    return ledgers.get(person);
  }
  function consume(account,requested,firstReceipt) {
    const preferred=firstReceipt?account.lots.find(lot=>lot.receipt===firstReceipt):null;
    const lots=preferred?[preferred,...account.lots.filter(lot=>lot!==preferred)]:account.lots;
    const result=[];
    let remaining=requested;
    for(const lot of lots){
      if(remaining===0)break;
      const amount=Math.min(lot.remaining,remaining);
      if(amount===0)continue;
      lot.remaining-=amount;
      remaining-=amount;
      result.push({lot,amount});
    }
    account.debt+=remaining;
    if(remaining)result.push({lot:null,amount:remaining});
    return result;
  }
  function credit(account,amount,lot) {
    const offset=Math.min(account.debt,amount);
    account.debt-=offset;
    if(lot)lot.remaining+=amount-offset;
  }
  for(const event of events){
    const account=ledger(event.person);
    if(event.receipt){
      if(event.earned<0)consume(account,-event.earned,event.receipt.original||event.receipt.adjusts);
      if(event.earned>0){
        const lot={receipt:event.receipt.id,fee:event.receipt.fee,remaining:0};
        account.lots.push(lot);
        credit(account,event.earned,lot);
      }
    }else if(event.payout.reverses){
      const original=allocations.get(event.payout.reverses)||[];
      for(const {lot,amount} of original)credit(account,amount,lot);
      allocations.set(event.payout.id,original.map(({lot,amount})=>({lot,amount:-amount})));
    }else if(event.payout.amount>0){
      allocations.set(event.payout.id,consume(account,event.payout.amount));
    }
  }
  return allocations;
}

export function paymentTrace(state,invoice) {
  const open=invoiceBalance(state,invoice).reduce((sum,amount)=>sum+amount,0);
  const receipts=state.receipts.filter(receipt=>receipt.fee===invoice.id)
    .sort((a,b)=>a.date.localeCompare(b.date));
  const approved=new Set(reportableReceipts(state));
  const allocations=estimatePartnerAllocations(state);
  const payouts=state.payouts.flatMap(payout=>{
    const amount=(allocations.get(payout.id)||[]).filter(row=>row.lot?.fee===invoice.id)
      .reduce((sum,row)=>sum+row.amount,0);
    return amount?[{...payout,attributed:amount}]:[];
  });
  return {invoice,open,receipts,approved,payouts};
}
