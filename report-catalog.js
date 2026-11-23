import {scheduledPayoutDate} from './payout-balance.js';
import {invoiceBalance} from './model.js';
function monthlyPartnerRows(state, person, allowed) {
  const periods = new Map();
  function entry(date, id) {
    const month = date.slice(0,7);
    const key = month + '|' + id;
    if (!periods.has(key)) periods.set(key,[month,person(id),0,0,0]);
    return periods.get(key);
  }
  for (const receipt of state.receipts) {
    for (const share of receipt.shares) {
      if (allowed(share.id)) entry(receipt.date,share.id)[2] += share.amount;
    }
  }
  for (const payout of state.payouts) {
    if (payout.kind === 'partner' && allowed(payout.person)) entry(payout.date,payout.person)[3] += payout.amount;
  }
  return [...periods.values()].map(([month,name,earned,paid])=>[month,name,earned,paid,earned-paid]);
}

export const reportCatalog = [
  {
    id: "invoices",
    title: "Client fee register",
    roles: ["admin","super"],
    columns: ["Invoice date","Client","Reference","Fixed fee ($)","Performance fee ($)","Total ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.fees.map(f=>[f.date,client(f.cid),f.reference,f.fixed,f.perf,f.fixed+f.perf])
  },
  {
    id: "balances",
    title: "Outstanding client fees",
    roles: ["admin","super"],
    columns: ["Invoice date","Client","Reference","Billed ($)","Collected against invoice ($)","Outstanding ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, client}) => state.fees.flatMap(f=>{
      const billed=f.fixed+f.perf;
      const outstanding=invoiceBalance(state,f).reduce((sum,amount)=>sum+amount,0);
      return outstanding>0?[[f.date,client(f.cid),f.reference,billed,billed-outstanding,outstanding]]:[];
    })
  },
  {
    id: "collections",
    title: "Client payment register",
    roles: ["admin","super"],
    columns: ["Payment date","Client","Method","Reference","Collected ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.receipts.filter(r=>r.amount>0).map(r=>[r.date,client(r.cid),r.method,r.ref,r.amount])
  },
  {
    id: "allocations",
    title: "Payment allocations by fee type",
    roles: ["admin","super"],
    columns: ["Payment date","Client","Reference","Retainer allocation ($)","Performance allocation ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.receipts.filter(r=>r.amount>0).map(r=>[r.date,client(r.cid),r.ref,...r.parts])
  },
  {
    id: "refunds",
    title: "Client refunds and partner adjustments",
    roles: ["admin","super"],
    columns: ["Refund date","Client","Refund reference","Original reference","Refund ($)","Partner deduction ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.receipts.filter(r=>r.original).map(r=>[r.date,client(r.cid),r.ref,state.receipts.find(x=>x.id===r.original)?.ref??'',-r.amount,-r.shares.reduce((a,p)=>a+p.amount,0)])
  },
  {
    id: "earnings",
    title: "Partner earnings by client",
    roles: ["admin","super","partner"],
    columns: ["Payment date","Client","Partner","Reference","Commission ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.receipts.flatMap(r=>r.shares.filter(p=>allowed(p.id)).map(p=>[r.date,client(r.cid),person(p.id),r.ref,p.amount]))
  },
  {
    id: "calculations",
    title: "Partner commission calculations",
    roles: ["admin","super"],
    columns: ["Payment date","Client","Partner","Fee type","Commission basis ($)","Share (%)","Commission ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.receipts.flatMap(r=>r.shares.filter(p=>allowed(p.id)).flatMap(p=>p.detail.map(d=>[r.date,client(r.cid),person(p.id),d.type,d.base,d.rate,d.amount])))
  },
  {
    id: "partner-payments",
    title: "Recorded partner payouts",
    roles: ["admin","super","partner"],
    columns: ["Payout date","Partner","Method","Reference","Paid ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.payouts.filter(p=>p.kind==='partner'&&allowed(p.person)).map(p=>[p.date,person(p.person),p.method,p.ref,p.amount])
  },
  {
    id: "partner-month",
    title: "Partner monthly activity",
    roles: ["admin","super","partner"],
    columns: ["Month","Partner","Earned incl. adjustments ($)","Paid in month ($)","Net movement ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => monthlyPartnerRows(state,person,allowed)
  },
  {
    id: "scheduled",
    title: "Scheduled referral commissions",
    roles: ["admin","super","partner"],
    columns: ["Due date","Earning month","Partner","Commission for period ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => monthlyPartnerRows(state,person,allowed).filter(row=>row[2]!==0).map(([month,name,earned])=>{const next=scheduledPayoutDate(month,state.day);return [next,month,name,earned]})
  },
  {
    id: "owner-earnings",
    title: "Owner distributions by client",
    roles: ["admin","super","owner"],
    columns: ["Month","Client","Owner","Distribution ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => owners(state).flatMap(m=>m.shares.filter(p=>allowed(p.id)).map(p=>[m.month,client(m.cid),person(p.id),p.amount]))
  },
  {
    id: "owner-payments",
    title: "Recorded owner payouts",
    roles: ["admin","super","owner"],
    columns: ["Payout date","Owner","Method","Reference","Paid ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.payouts.filter(p=>p.kind==='owner'&&allowed(p.person)).map(p=>[p.date,person(p.person),p.method,p.ref,p.amount])
  },
  {
    id: "reserves",
    title: "Agency reserve reconciliation",
    roles: ["admin","super"],
    columns: ["Month","Client","Available ($)","Allocated to owners ($)","Reserve ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => owners(state).map(m=>[m.month,client(m.cid),m.available,m.shares.reduce((n,p)=>n+p.amount,0),m.reserve])
  },
  {
    id: "losses",
    title: "Client loss carryforward",
    roles: ["admin","super"],
    columns: ["Month","Client","Opening loss ($)","Monthly net ($)","Closing loss ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => owners(state).filter(m=>m.loss||m.opening).map(m=>[m.month,client(m.cid),m.opening,m.income-m.commission-m.expenses,m.loss])
  },
  {
    id: "expenses",
    title: "Vendor expense allocations",
    roles: ["admin","super"],
    columns: ["Bill date","Vendor or bill","Client","Allocated expense ($)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.expenses.flatMap(e=>e.lines.map(l=>[e.date,e.name,client(l.cid),l.amount]))
  },
  {
    id: "followups",
    title: "Open sales follow-ups",
    roles: ["admin","super","partner"],
    columns: ["Follow-up date","Prospect","Referrer","Stage","Contact"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.deals.filter(d=>allowed(d.pid)&&!['Won','Lost'].includes(d.stage)).map(d=>[d.follow||'',d.name,person(d.pid),d.stage,d.contact])
  },
  {
    id: "stages",
    title: "Sales stage changes",
    roles: ["admin","super"],
    columns: ["Change date","Prospect","Previous stage","New stage","Changed by","Note"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.deals.flatMap(d=>(d.history||[]).map(h=>[h.at,d.name,h.from,h.to,person(h.by),h.note]))
  },
  {
    id: "agreements",
    title: "Client fee agreement history",
    roles: ["admin","super"],
    columns: ["Effective date","Client","Monthly retainer ($)","Fee eligibility","Split method","Tier method"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.clients.flatMap(c=>c.history.map(t=>[t.from,c.name,t.retainer,t.eligible,t.pool===null?'Individual':'Pool',t.mode]))
  },
  {
    id: "tiers",
    title: "Performance fee tier schedule",
    roles: ["admin","super"],
    columns: ["Effective date","Client","Tier","Upper sales limit","Agency rate (%)","Method"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.clients.flatMap(c=>c.history.flatMap(t=>t.tiers.map((tier,i)=>[t.from,c.name,i+1,tier.to===null?'Unlimited':(tier.to/100).toFixed(2),tier.rate,t.mode])))
  },
  {
    id: "owner-terms",
    title: "Owner participation agreements",
    roles: ["admin","super","owner"],
    columns: ["Effective date","Client","Owner","Contract share (%)"],
    capabilities: ["rows","search","month","sort","csv"],
    rows: ({state, person, client, allowed, owners}) => state.clients.flatMap(c=>c.history.flatMap(t=>t.owners.filter(p=>allowed(p.id)).map(p=>[t.from,c.name,person(p.id),p.rate])))
  }
];
