export function closeSummary(state,clientId,month) {
  const close=(state.closes||[]).find(row=>row.cid===clientId&&row.month===month);
  if(!close)return null;
  const client=state.clients.find(row=>row.id===clientId);
  const previous=(state.closes||[]).filter(row=>row.cid===clientId&&row.month<month)
    .sort((a,b)=>a.month.localeCompare(b.month)).at(-1)?.month??'';
  const originals=new Map(state.receipts.filter(row=>row.cid===clientId&&row.amount>0
    &&row.date.slice(0,7)>previous&&row.date.slice(0,7)<=month).map(row=>[row.id,row]));
  const corrections=state.receipts.filter(row=>row.cid===clientId&&row.date.slice(0,7)>month
    &&originals.has(row.original||row.adjusts)).map(row=>({
      date:row.date,reference:row.ref,original:originals.get(row.original||row.adjusts).ref,
      type:row.original?'Refund':'Commission correction',cash:row.amount,
      commission:row.shares.reduce((sum,share)=>sum+share.amount,0)
    }));
  return {close,client:client.name,closedBy:state.people.find(row=>row.id===close.by)?.name??close.by,corrections};
}

export function closeExport(summary) {
  const {client,close,closedBy,corrections}=summary;
  const m=close.settled;
  const columns=['Client','Close through','Closed by','Closed at (UTC)','SHA-256','Record',
    'Date','Reference','Original reference','Collections ($)','Commission ($)','Expenses ($)',
    'Distributable ($)','Reserve ($)','Closing loss ($)'];
  const prefix=[client,close.month,closedBy,close.at,close.digest];
  const rows=[
    [...prefix,'Settlement','','','',m?.income??0,m?.commission??0,m?.expenses??0,m?.available??0,m?.reserve??0,close.loss],
    ...corrections.map(row=>[...prefix,row.type,row.date,row.reference,row.original,row.cash,row.commission,'','','',''])
  ];
  return {definition:{columns,capabilities:['csv']},rows};
}
