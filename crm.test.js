import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {availablePayout,invoiceBalance,seed,run,owners,performance,allocate} from './model.js';
import {closeSummary,closeExport} from './close-summary.js';
import {paymentTrace} from './payment-trace.js';
const people=()=>JSON.parse(readFileSync(new URL('./demo-users.json',import.meta.url))).map(({id,name,roles})=>({id,name,roles}));
const fixture=()=>seed(people());

test('skeptic: reversing an eligible payout preserves the original and restores only its amount',()=>{
 const s=fixture(),admin=s.people[0],original=structuredClone(s.payouts[0]);
 const prior=availablePayout(s,'partner','partner','2026-11-21');
 const fields={payout:original.id,date:'2026-11-21',reason:'Duplicate manual record'};
 assert.throws(()=>run(s,s.people[1],'reversePayout',fields),/denied/);
 assert.throws(()=>run(s,admin,'reversePayout',{...fields,date:'2026-11-14'}),/between/);
 assert.throws(()=>run(s,admin,'reversePayout',{...fields,reason:''}),/Enter a value/);
 run(s,admin,'closeMonth',{client:'alder',month:'2026-10'});
 const closed=structuredClone(s.closes[0]);
 run(s,admin,'reversePayout',fields);
 assert.deepEqual(s.payouts[0],original);
 assert.equal(s.payouts.at(-1).reverses,original.id);
 assert.deepEqual(s.closes[0],closed);
 assert.equal(availablePayout(s,'partner','partner','2026-11-21'),prior+original.amount);
 assert.throws(()=>run(s,admin,'reversePayout',fields),/already has/);
 assert.throws(()=>run(s,admin,'reversePayout',{...fields,payout:s.payouts.at(-1).id}),/original payout/);
 const trace=paymentTrace(s,s.fees[0]);
 assert.deepEqual(trace.payouts.map(row=>[row.ref,row.attributed]),[['SAMPLE-001',20000],['Reversal of SAMPLE-001',-20000]]);
});

test('skeptic: duplicate refund references are case-insensitive and scoped to the client and entry type',()=>{
 const s=fixture(),admin=s.people[0],first=s.receipts[0];
 const refund={client:first.cid,fee:first.fee,receipt:first.id,date:'2026-11-21',amount:'1',ref:first.ref,deduct:'no'};
 run(s,admin,'refund',refund);
 const size=s.receipts.length;
 assert.throws(()=>run(s,admin,'refund',{...refund,ref:' '+first.ref.toLowerCase()+' '}),/already recorded/);
 assert.equal(s.receipts.length,size);
 const other=s.receipts[1];
 run(s,admin,'refund',{...refund,client:other.cid,fee:other.fee,receipt:other.id});
 assert.equal(s.receipts.length,size+1);
});

test('skeptic: partial collection, approval, partial payout, close and later refund reconcile',()=>{
 const s=fixture(),admin=s.people[0];
 run(s,admin,'fee',{client:'alder',date:'2026-10-19',fixed:'100',performance:'100',ref:'PARTIAL-052'});
 const fee=s.fees.at(-1);
 const payment={client:'alder',fee:fee.id,date:'2026-10-20',amount:'100',method:'ACH',ref:'PARTIAL-CASH'};
 const beforeDraft=availablePayout(s,'partner','partner','2026-11-20');
 run(s,admin,'receipt',{...payment,review:'draft'});
 const original=s.receipts.at(-1);
 assert.deepEqual(original.parts,[5000,5000]);
 assert.equal(availablePayout(s,'partner','partner','2026-11-20'),beforeDraft);
 run(s,admin,'approveReceipt',{receipt:original.id});
 assert.equal(availablePayout(s,'partner','partner','2026-11-20'),beforeDraft+1250);
 run(s,admin,'payout',{person:'partner',kind:'partner',date:'2026-11-20',amount:'5',method:'ACH',ref:'PARTIAL-PAYOUT'});
 assert.equal(s.payouts.at(-1).availableBefore,beforeDraft+1250);
 run(s,admin,'closeMonth',{client:'alder',month:'2026-10'});
 const closed=structuredClone(s.closes.at(-1));
 const refund={client:'alder',fee:fee.id,receipt:original.id,date:'2026-11-21',amount:'20.01',ref:'OPEN-AMOUNT',deduct:'yes'};
 run(s,admin,'refund',{...refund,invoice:'reopen'});
 assert.deepEqual(invoiceBalance(s,fee),[6001,6000]);
 assert.deepEqual(invoiceBalance(s,fee,'2026-11-20'),[5000,5000]);
 assert.equal(availablePayout(s,'partner','partner','2026-11-21'),beforeDraft+1250-500-250);
 assert.deepEqual(s.closes.at(-1),closed);
 const summary=closeSummary(s,'alder','2026-10');
 assert.deepEqual(summary.corrections,[{date:'2026-11-21',reference:'OPEN-AMOUNT',original:'PARTIAL-CASH',type:'Refund',cash:-2001,commission:-350}]);
 assert.ok(closeExport(summary).rows.every(row=>row.length===closeExport(summary).definition.columns.length));
});

test('skeptic: settled refunds preserve the receivable and reopened pennies can be recollected only after the refund',()=>{
 const s=fixture(),admin=s.people[0],fee=s.fees[0],original=s.receipts[0];
 const refund={client:fee.cid,fee:fee.id,receipt:original.id,date:'2026-11-21',amount:'0.01',ref:'CENT',deduct:'no'};
 run(s,admin,'refund',refund);
 assert.deepEqual(invoiceBalance(s,fee),[0,0]);
 run(s,admin,'refund',{...refund,ref:'CENT-OPEN',invoice:'reopen'});
 assert.deepEqual(invoiceBalance(s,fee),[1,0]);
 const payment={client:fee.cid,fee:fee.id,date:'2026-11-20',amount:'0.01',method:'ACH',ref:'RECOVERED'};
 assert.throws(()=>run(s,admin,'receipt',payment),/outstanding/);
 run(s,admin,'receipt',{...payment,date:'2026-11-22'});
 assert.deepEqual(invoiceBalance(s,fee),[0,0]);
});
test('marginal and whole-period tiers',()=>{const t=[{to:5000000,rate:500},{to:null,rate:700}];assert.equal(performance(6000000,t,'marginal'),320000);assert.equal(performance(6000000,t,'whole'),420000)});
test('fractional cent allocations reconcile',()=>assert.deepEqual(allocate(101,[1,1]),[51,50]));
test('individual rates, pool, reserves and expenses reconcile',()=>{const s=fixture();assert.deepEqual(s.receipts[0].shares.map(x=>x.amount),[60000,25000]);assert.equal(s.receipts[1].shares.reduce((a,x)=>a+x.amount,0),37500);const a=owners(s)[0];assert.equal(a.available,375000);assert.equal(a.reserve,75000);assert.equal(a.shares.reduce((n,x)=>n+x.amount,a.reserve),a.available)});
test('partial payments, overrides and historical values',()=>{const s=fixture(),admin=s.people[0],fee=s.fees[1];run(s,admin,'receipt',{client:'harbor',fee:fee.id,date:'2026-10-16',amount:1000,override:500,ref:'partial',method:'ACH'});assert.deepEqual(s.receipts.at(-1).parts,[50000,50000]);const snapshot=JSON.stringify(s.receipts);run(s,admin,'terms',{client:'harbor',date:'2026-11-01',partners:'partner,20',owners:'owner,60'});assert.equal(JSON.stringify(s.receipts),snapshot);assert.throws(()=>run(s,admin,'receipt',{client:'harbor',fee:fee.id,date:'2026-11-02',amount:2000,ref:'overpayment'}),/exceeds/)});
test('refund follows original allocations and caps cumulative refunds',()=>{const s=fixture(),r=s.receipts[0],f={client:r.cid,fee:r.fee,receipt:r.id,date:'2026-11-01',amount:1000,ref:'refund',deduct:'yes'};run(s,s.people[0],'refund',f);assert.equal(s.receipts.at(-1).shares[0].amount,-12000);assert.throws(()=>run(s,s.people[0],'refund',{...f,amount:5000,ref:'second refund'}),/exceeds/)});
test('loss stays with client and is recovered next period',()=>{const s=fixture(),u=s.people[0];run(s,u,'expense',{date:'2026-09-01',name:'Setup',amount:500,lines:'alder,500'});let a=owners(s).filter(x=>x.cid==='alder');assert.equal(a[0].loss,50000);assert.equal(a[1].opening,50000);assert.equal(a[1].available,325000);assert.equal(owners(s).at(-1).opening,0)});
test('expense allocation, overpayment and unauthorized mutation rejected',()=>{const s=fixture();assert.throws(()=>run(s,s.people[0],'expense',{date:'2026-11-01',name:'Bill',amount:100,lines:'alder,60'}),/Allocations/);assert.throws(()=>run(s,s.people[0],'payout',{person:'partner',amount:99999,date:'2026-11-01'}),/exceeds/);assert.throws(()=>run(s,s.people[1],'settings',{day:1}),/denied/)});

test('a payout cannot use future client collections',()=>{
 const s=fixture();
 assert.throws(()=>run(s,s.people[0],'payout',{person:'partner',kind:'partner',amount:50,date:'2026-09-15',ref:'early',method:'ACH'}),/exceeds/);
});
test('a shared vendor bill counts once across two clients',()=>{
 const s=fixture();
 assert.equal(owners(s).reduce((total,m)=>total+m.expenses,0),60000);
});
test('duplicate referrals can link to one won client with separate stage histories',()=>{
 const s=fixture(),admin=s.people[0];
 for(const id of ['partner','partner2']){
  run(s,admin,'refer',{partner:id,name:'Linden Group',contact:'referral@example.invalid'});
  const deal=s.deals.at(-1);
  run(s,admin,'stage',{deal:deal.id,stage:'Won',client:'alder',note:'Reviewed introduction'});
  assert.equal(deal.history[0].from,'New Referral');
  assert.equal(deal.cid,'alder');
 }
 assert.equal(s.deals.at(-1).duplicate,true);
 assert.equal(s.clients.length,2);
});
test('absorbed refunds leave referral earnings intact',()=>{
 const s=fixture(),r=s.receipts[0];
 run(s,s.people[0],'refund',{client:r.cid,fee:r.fee,receipt:r.id,amount:300,ref:'absorbed',date:'2026-11-01',deduct:'no'});
 assert.deepEqual(s.receipts.at(-1).shares,[]);
 assert.equal(s.receipts.at(-1).amount,-30000);
});
test('manual correction preserves original receipt and adjusts only intended earnings',()=>{
 const s=fixture(),r=s.receipts[0],original=structuredClone(r);
 run(s,s.people[0],'adjustment',{date:'2026-11-10',client:r.cid,fee:r.fee,receipt:r.id,person:'partner',direction:'debit',amount:'7.25',reason:'Correct original rate',ref:'COR-001'});
 assert.deepEqual(r,original);
 assert.equal(s.receipts.at(-1).shares[0].amount,-725);
 assert.equal(s.receipts.at(-1).amount,0);
});
test('late payout entries reserve only funds needed by previously recorded future payments',async()=>{
 const { payoutCapacity,followingMonth }=await import('./payout-balance.js');
 const earnings=[{date:'2025-12-01',amount:10000},{date:'2026-01-01',amount:15000}];
 assert.equal(payoutCapacity(earnings,[{date:'2026-01-02',amount:12000}],'2025-12-02'),10000);
 assert.equal(payoutCapacity(earnings,[{date:'2026-01-02',amount:20000}],'2025-12-02'),5000);
 assert.equal(payoutCapacity(earnings,[],'2025-11-30'),0);
 assert.equal(followingMonth('2025-12'),'2026-01-01');
});
test('month-end scheduling supports all 31 days and keeps payments in the intended month',async()=>{
 const {scheduledPayoutDate}=await import('./payout-balance.js');
 const s=fixture();
 run(s,s.people[0],'settings',{day:31});assert.equal(s.day,31);
 assert.throws(()=>run(s,s.people[0],'settings',{day:32}));
 assert.equal(scheduledPayoutDate('2027-01',31),'2027-02-28');
 assert.equal(scheduledPayoutDate('2028-01',31),'2028-02-29');
 assert.equal(scheduledPayoutDate('2027-12',31),'2028-01-31');
});

test('closing a client period preserves its settlement and rejects edits through the close date',()=>{
 const s=fixture(),admin=s.people[0];
 const close={client:'alder',month:'2026-10'};
 for(const user of s.people.filter(p=>!p.roles.includes('admin')))assert.throws(()=>run(s,user,'closeMonth',close),/denied/);
 run(s,admin,'closeMonth',close);
 const snapshot=structuredClone(s.closes[0]);
 assert.match(snapshot.digest,/^[a-f0-9]{64}$/);
 assert.deepEqual(snapshot.settled,owners(s).find(row=>row.month==='2026-10'&&row.cid==='alder'));
 assert.throws(()=>run(s,admin,'closeMonth',close),/closed/);
 assert.throws(()=>run(s,admin,'terms',{client:'alder',date:'2026-10-31'}),/closed/);
 assert.throws(()=>run(s,admin,'expense',{date:'2026-10-11',name:'Shared',amount:15,lines:'harbor,5\nalder,10'}),/closed/);
 run(s,admin,'expense',{date:'2026-10-11',name:'Harbor only',amount:5,lines:'harbor,5'});
 run(s,admin,'expense',{date:'2026-11-01',name:'Open month',amount:5,lines:'alder,5'});
 assert.deepEqual(s.closes[0],snapshot);
});

test('equal and sales-weighted bills allocate every penny and reject missing sales',()=>{
 const s=fixture(),admin=s.people[0];
 const bill={date:'2026-10-19',name:'Shared subscription',amount:'0.03',lines:'alder\nharbor'};
 run(s,admin,'expense',{...bill,allocation:'equal'});
 assert.deepEqual(s.expenses.at(-1).lines.map(line=>line.amount),[2,1]);
 run(s,admin,'fee',{client:'alder',date:'2026-10-18',fixed:'1',sales:'40000',ref:'Additional qualifying sales'});
 run(s,admin,'expense',{...bill,allocation:'sales',amount:'120.00'});
 assert.deepEqual(s.expenses.at(-1).lines.map(line=>line.amount),[8000,4000]);
 assert.throws(()=>run(s,admin,'expense',{...bill,date:'2026-09-18',allocation:'sales'}),/requires qualifying sales/);
 assert.throws(()=>run(s,admin,'expense',{...bill,lines:'alder\nalder',allocation:'equal'}),/Duplicate/);
});

test('draft receipt commissions require approval before partner payouts',()=>{
 const s=fixture(),admin=s.people[0];
 run(s,admin,'fee',{client:'alder',date:'2026-10-25',fixed:'1000',ref:'Draft test'});
 run(s,admin,'receipt',{client:'alder',fee:s.fees.at(-1).id,date:'2026-10-25',amount:'1000',method:'ACH',ref:'Draft test',review:'draft'});
 const receipt=s.receipts.at(-1), fields={person:'partner',date:'2026-11-20',amount:700,method:'ACH',ref:'Approved payout'};
 assert.equal(receipt.approval,'draft');
 assert.throws(()=>run(s,admin,'payout',fields),/exceeds/);
 assert.throws(()=>run(s,admin,'closeMonth',{client:'alder',month:'2026-10'}),/Approve draft/);
 assert.throws(()=>run(s,s.people[1],'approveReceipt',{receipt:receipt.id}),/denied/);
 run(s,admin,'approveReceipt',{receipt:receipt.id});
 run(s,admin,'payout',fields);
 assert.throws(()=>run(s,admin,'approveReceipt',{receipt:receipt.id}),/no draft/);
});

test('batch payouts roll back all lines on failure and prevent duplicate references',()=>{
 const s=fixture(),admin=s.people[0],before=structuredClone(s.payouts);
 const batch={date:'2026-11-20',method:'ACH',rows:'partner,partner,15,R1\nowner,owner,25,R2'};
 assert.throws(()=>run(s,admin,'batchPayout',{...batch,rows:batch.rows+'\npartner,partner,999999,R3'}),/exceeds/);
 assert.deepEqual(s.payouts,before);
 run(s,admin,'batchPayout',batch);
 assert.deepEqual(s.payouts.slice(-2).map(p=>[p.person,p.kind,p.amount,p.ref]),[['partner','partner',1500,'R1'],['owner','owner',2500,'R2']]);
 assert.throws(()=>run(s,admin,'batchPayout',batch),/already have/);
 assert.equal(s.payouts.length,before.length+2);
});

test('won handoff preserves partner attribution and rejects duplicate client creation atomically',()=>{
 const s=fixture(),admin=s.people[0];
 run(s,admin,'refer',{name:'Alder Studio',contact:'referral@example.invalid',partner:'partner'});
 const opportunity=s.deals.at(-1),before=structuredClone(s);
 const won={deal:opportunity.id,stage:'Won',additionalPartners:'partner2'};
 assert.throws(()=>run(s,admin,'stage',won),/existing client/);
 assert.deepEqual(s,before);
 run(s,admin,'stage',{...won,client:'alder'});
 assert.deepEqual(s.clients[0].referrals[opportunity.id],['partner','partner2']);
 assert.throws(()=>run(s,admin,'stage',{...won,additionalPartners:'partner2,partner2'}),/distinct/);
});
