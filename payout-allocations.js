export function replayPartnerAllocations(state,approved,proposed) {
  const relevant=person=>!proposed||person===proposed.person;
  const events=[
    ...state.receipts.flatMap(receipt=>receipt.shares.filter(share=>relevant(share.id)&&(approved.has(receipt)||share.amount<0))
      .map(share=>({date:receipt.date,person:share.id,earned:share.amount,receipt}))),
    ...state.payouts.filter(payout=>payout.kind==='partner'&&relevant(payout.person))
      .map(payout=>({date:payout.date,person:payout.person,payout})),
    ...(proposed?[{date:proposed.date,person:proposed.person,payout:proposed}]:[])
  ].sort((a,b)=>a.date.localeCompare(b.date));
  const future=new Map();
  if(proposed){
    const reserved=new Map();
    for(const {payout} of events){
      if(!payout||payout.person!==proposed.person||payout.date<=proposed.date)continue;
      for(const line of payout.applications||[]){
        const total=(reserved.get(line.receipt)||0)+line.amount;
        reserved.set(line.receipt,total);
        future.set(line.receipt,Math.max(future.get(line.receipt)||0,total));
      }
    }
  }
  const ledgers=new Map();
  const allocations=new Map();
  const funding=new Map();
  function ledger(person) {
    if(!ledgers.has(person))ledgers.set(person,{lots:[],debt:0});
    return ledgers.get(person);
  }
  function consume(account,requested,firstReceipt,reserved) {
    const preferred=firstReceipt?account.lots.find(lot=>lot.receipt===firstReceipt):null;
    const lots=preferred?[preferred,...account.lots.filter(lot=>lot!==preferred)]:account.lots;
    const result=[];
    let remaining=requested;
    for(const lot of lots){
      if(remaining===0)break;
      const usable=Math.max(0,lot.remaining-(reserved?.get(lot.receipt)||0));
      const amount=Math.min(usable,remaining);
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
      for(const {lot,amount} of funding.get(event.payout.reverses)||[])credit(account,amount,lot);
      allocations.set(event.payout.id,original.map(({lot,amount})=>({lot,amount:-amount})));
    }else if(event.payout.amount>0){
      const {payout}=event;
      if(payout.applications){
        const funded=[];
        const pinned=payout.applications.map(line=>{
          const lot=account.lots.find(item=>item.receipt===line.receipt);
          const debit=Math.min(lot?.remaining??0,line.amount);
          if(lot&&debit){lot.remaining-=debit;funded.push({lot,amount:debit})}
          return {lot:lot??{receipt:line.receipt,fee:line.fee,remaining:0},amount:line.amount,shortage:line.amount-debit};
        });
        for(const line of pinned)if(line.shortage)funded.push(...consume(account,line.shortage));
        allocations.set(payout.id,pinned);
        funding.set(payout.id,funded);
      }else{
        const drawn=consume(account,payout.amount,null,payout===proposed?future:null);
        allocations.set(payout.id,drawn);
        funding.set(payout.id,drawn);
      }
      if(payout===proposed)break;
    }
  }
  return allocations;
}

export function partnerPayoutApplications(state,approved,payout) {
  const entries=replayPartnerAllocations(state,approved,payout).get(payout.id)||[];
  return entries.filter(row=>row.lot).map(({lot,amount})=>({receipt:lot.receipt,fee:lot.fee,amount}));
}
