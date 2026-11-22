import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {seed,run,owners,performance,allocate} from './model.js';
const people=()=>JSON.parse(readFileSync(new URL('./demo-users.json',import.meta.url))).map(({id,name,roles})=>({id,name,roles}));
const fixture=()=>seed(people());
test('marginal and whole-period tiers',()=>{const t=[{to:5000000,rate:500},{to:null,rate:700}];assert.equal(performance(6000000,t,'marginal'),320000);assert.equal(performance(6000000,t,'whole'),420000)});
test('fractional cent allocations reconcile',()=>assert.deepEqual(allocate(101,[1,1]),[51,50]));
test('individual rates, pool, reserves and expenses reconcile',()=>{const s=fixture();assert.deepEqual(s.receipts[0].shares.map(x=>x.amount),[60000,25000]);assert.equal(s.receipts[1].shares.reduce((a,x)=>a+x.amount,0),37500);const a=owners(s)[0];assert.equal(a.available,375000);assert.equal(a.reserve,75000);assert.equal(a.shares.reduce((n,x)=>n+x.amount,a.reserve),a.available)});
test('partial payments, overrides and historical values',()=>{const s=fixture(),admin=s.people[0],fee=s.fees[1];run(s,admin,'receipt',{client:'harbor',fee:fee.id,date:'2026-10-16',amount:1000,override:500,ref:'partial',method:'ACH'});assert.deepEqual(s.receipts.at(-1).parts,[50000,50000]);const snapshot=JSON.stringify(s.receipts);run(s,admin,'terms',{client:'harbor',date:'2026-11-01',partners:'partner,20',owners:'owner,60'});assert.equal(JSON.stringify(s.receipts),snapshot);assert.throws(()=>run(s,admin,'receipt',{client:'harbor',fee:fee.id,date:'2026-11-02',amount:2000}),/exceeds/)});
test('refund follows original allocations and caps cumulative refunds',()=>{const s=fixture(),r=s.receipts[0],f={client:r.cid,fee:r.fee,receipt:r.id,date:'2026-11-01',amount:1000,ref:'refund',deduct:'yes'};run(s,s.people[0],'refund',f);assert.equal(s.receipts.at(-1).shares[0].amount,-12000);assert.throws(()=>run(s,s.people[0],'refund',{...f,amount:5000}),/exceeds/)});
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
