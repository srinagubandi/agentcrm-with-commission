import assert from 'node:assert/strict';
import { run, owners } from './model.js';
import { payoutCapacity, scheduledPayoutDate } from './payout-balance.js';

export const families = ['fee tiers','receipt allocation','shared pools','eligibility dates','refunds','corrections','owner loss recovery','payout chronology','payout calendar'];
const dollars = cents => (cents / 100).toFixed(2);
const total = list => list.reduce((a,b)=>a+b,0);
const admin = {id:'admin',roles:['admin']};
const partner = {id:'p1',roles:['partner']};

function ledger() {
  return {people:[admin,partner,{id:'p2',roles:['partner']},{id:'o1',roles:['owner']}],
    clients:[{id:'a',name:'Alder',history:[]},{id:'b',name:'Birch',history:[]}],
    receipts:[],expenses:[],payouts:[],fees:[],deals:[],day:15};
}

function post(s, action, fields) {
  run(s,admin,action,{client:'a',date:'2026-01-12',ref:'fixture',method:'ACH',...fields});
}
function terms(s, fields={}) {
  post(s,'terms',{date:'2026-01-01',partners:'p1,10,15\np2,5,5',owners:'o1,75',...fields});
}
function invoice(s,fixed,perf) {
  post(s,'fee',{fixed:dollars(fixed),performance:dollars(perf)});
  return s.fees.at(-1).id;
}
function receive(s,fee,amount,extra={}) {
  post(s,'receipt',{fee,amount:dollars(amount),...extra});
  return s.receipts.at(-1);
}
function rejected(s,action,fields,pattern) {
  const before=JSON.stringify(s);
  assert.throws(()=>post(s,action,fields),pattern);
  assert.equal(JSON.stringify(s),before);
}

// Each family has a reproducible 1,111-case input partition. Values represent
// amounts, allocations, contractual limits or calendar dates, never a no-op flag.
export function financialScenario(family,i) {
  assert.ok(Number.isInteger(i)&&i>=0&&i<1111);
  const s=ledger();
  let inputs, actual, expected, review, challenge;
  if(family===0){
    const threshold=100000+i*19, rate1=125+(i%35)*25, rate2=320+(i%53)*10;
    const sales=threshold+[-1,0,1,13571,-14729][i%5],whole=i%2===1;
    terms(s,{mode:whole?'whole':'marginal',tiers:dollars(threshold)+','+dollars(rate1)+'\n*,'+dollars(rate2)});
    post(s,'fee',{sales:dollars(sales),calc:'sales',fixed:'0'});
    actual=s.fees[0].perf;
    expected=whole?Math.round(sales*(sales<=threshold?rate1:rate2)/10000):
      Math.round(Math.min(threshold,sales)*rate1/10000)+Math.round(Math.max(0,sales-threshold)*rate2/10000);
    assert.equal(s.receipts.length,0);rejected(s,'fee',{sales:'-0.01',calc:'sales'},/outside range/);
    inputs={threshold,sales,rate1,rate2,whole};review='Fee stored in cents; fee posting creates no receipt';challenge='Negative qualifying sales rejected atomically';
  } else if(family===1){
    const fixed=5000+17*i,perf=1201+7*i,sum=fixed+perf,paid=1+((i*197)%sum),manual=i%3===0;
    const chosen=manual?Math.min(fixed,paid):Math.floor(paid*fixed/sum+0.5);
    terms(s);const fee=invoice(s,fixed,perf);
    const r=receive(s,fee,paid,manual?{override:dollars(chosen)}:{});
    actual=r.parts;expected=[chosen,paid-chosen];
    assert.equal(total(r.parts),paid);
    rejected(s,'receipt',{fee,amount:dollars(sum-paid+1)},/exceeds/);
    inputs={fixed,perf,paid,manual};review='Allocated cents exhaust receipt and fit both fee balances';challenge='One cent above outstanding balance rejected atomically';
  } else if(family===2){
    const paid=10000+i*37,split=1+i%99,poolRate=300+(i%40)*25;
    terms(s,{split:'pool',pool:dollars(poolRate),partners:'p1,'+split+'\np2,'+(100-split)});
    const fee=invoice(s,paid,0),r=receive(s,fee,paid);
    const pool=Math.round(paid*poolRate/10000);
    actual=r.shares.map(p=>p.amount);expected=[Math.floor(pool*split/100+0.5),pool-Math.floor(pool*split/100+0.5)];
    assert.equal(total(actual),pool);
    rejected(s,'terms',{date:'2026-02-01',split:'pool',pool:10,partners:'p1,40\np2,59'},/entire partner pool/);
    inputs={paid,split,poolRate};review='Distributions reconcile to the rounded pool';challenge='Underallocated pool rejected without installing new terms';
  } else if(family===3){
    const start=2+i%15,end=start+1+i%7,day=[start-1,start,end,end+1][i%4],amount=10000+i*11;
    const date=n=>'2026-01-'+String(n).padStart(2,'0');
    terms(s,{partners:'p1,20,30,'+date(start)+','+date(end)});
    post(s,'fee',{date:'2026-01-01',fixed:dollars(amount),performance:0});
    const fee=s.fees[0].id,r=receive(s,fee,amount,{date:date(day)});
    actual=r.shares.map(p=>p.amount);expected=day>=start&&day<=end?[Math.round(amount*0.2)]:[];
    assert.equal(r.date,date(day));
    rejected(s,'terms',{date:'2026-02-01',partners:'p1,5,5,'+date(end)+','+date(start)},/agreement dates/);
    inputs={amount,start,end,day};review='Receipt date selects participants, including exact agreement endpoints';challenge='Reversed participation dates rejected atomically';
  } else if(family===4){
    const amount=35000+31*i,first=1+(i*73)%(amount-1),absorbed=i%3===0;
    terms(s);const fee=invoice(s,amount,0),r=receive(s,fee,amount);
    const original=JSON.stringify(r);
    const refund=(n,deduct)=>post(s,'refund',{fee,receipt:r.id,amount:dollars(n),deduct});
    refund(first,absorbed?'no':'yes');refund(amount-first,'yes');
    actual=s.receipts.slice(1).flatMap(x=>x.shares.filter(p=>p.id==='p1')).reduce((n,p)=>n-p.amount,0);
    const originalCommission=r.shares[0].amount;
    expected=originalCommission-(absorbed?Math.round(originalCommission*first/amount):0);
    assert.equal(JSON.stringify(r),original);
    rejected(s,'refund',{fee,receipt:r.id,amount:'0.01',deduct:'yes'},/exceeds/);
    inputs={amount,first,absorbed};review='Refunds retain original allocations and preserve receipt';challenge='A further cent after full refund is rejected';
  } else if(family===5){
    const fixed=23000+i*47,correction=1+i*7,direction=i%2?'credit':'debit';
    terms(s);const fee=invoice(s,fixed,0),r=receive(s,fee,fixed),original=JSON.stringify(r);
    const args={fee,receipt:r.id,person:'p1',amount:dollars(correction),direction,reason:'Statement reconciliation'};
    post(s,'adjustment',args);const a=s.receipts.at(-1);
    actual=[a.amount,a.shares[0].amount,a.shares.length];expected=[0,correction*(direction==='credit'?1:-1),1];
    assert.equal(a.adjusts,r.id);assert.equal(JSON.stringify(r),original);
    rejected(s,'adjustment',{...args,person:'o1'},/not on this receipt/);
    inputs={fixed,correction,direction};review='Correction links to receipt without altering client cash';challenge='Unrelated recipient rejected and original receipt preserved';
  } else if(family===6){
    const cost=3000+19*i,rev=1200+(i*83)%24000,ownerRate=25+i%76;
    terms(s,{owners:'o1,'+ownerRate,partners:''});terms(s,{client:'b',owners:'o1,100',partners:''});
    post(s,'expense',{name:'Allocated expense',amount:dollars(cost+300),lines:'a,'+dollars(cost)+'\nb,3.00'});
    post(s,'fee',{date:'2026-02-02',fixed:dollars(rev),performance:0});
    receive(s,s.fees[0].id,rev,{date:'2026-02-03'});const rows=owners(s),m=rows.find(x=>x.cid==='a'&&x.month==='2026-02');
    actual=[m.opening,m.available,m.loss,m.shares[0].amount,m.reserve];
    const available=Math.max(0,rev-cost),share=Math.round(available*ownerRate/100);
    expected=[cost,available,Math.max(0,cost-rev),share,available-share];
    assert.equal(rows.find(x=>x.cid==='b').loss,300);
    rejected(s,'expense',{name:'Unbalanced',amount:dollars(cost+1),lines:'a,'+dollars(cost)},/Allocations/);
    inputs={cost,rev,ownerRate};review='Closing loss, owner share and retained reserve reconcile';challenge='Other client loss stays isolated; unreconciled expense blocked';
  } else if(family===7){
    const first=10000+11*i,second=800+i*7,paid=200+(i*29)%(first+second-200);
    const earnings=[{date:'2026-01-05',amount:first},{date:'2026-02-05',amount:second}];
    const payments=[{date:'2026-02-06',amount:paid}];
    actual=payoutCapacity(earnings,payments,'2026-01-15');
    expected=Math.min(first,first+second-paid);
    assert.equal(payoutCapacity(earnings,payments,'2026-01-01'),0);
    assert.equal(payoutCapacity(earnings.toReversed(),payments,'2026-01-15'),actual);
    inputs={first,second,paid};review='Eligible early funds and future payment commitments both honored';challenge='Reordered receipts and date before earnings checked';
  } else if(family===8){
    const start=new Date(Date.UTC(2020,0+i%132,1));
    const year=start.getUTCFullYear(),month=start.getUTCMonth()+1,day=1+(Math.floor(i/132)*7+i%31)%31;
    const period=start.toISOString().slice(0,7);actual=scheduledPayoutDate(period,day);
    const payYear=year+(month===12?1:0),payMonth=month%12+1;
    const leap=payYear%4===0&&(payYear%100!==0||payYear%400===0);
    const max=[31,leap?29:28,31,30,31,30,31,31,30,31,30,31][payMonth-1];
    expected=[payYear,String(payMonth).padStart(2,'0'),String(Math.min(max,day)).padStart(2,'0')].join('-');
    run(s,admin,'settings',{day});assert.equal(s.day,day);
    assert.throws(()=>run(s,partner,'settings',{day}),/denied/);assert.equal(s.day,day);
    inputs={period,day};review='Following-month due date independently checked against Gregorian calendar';challenge='Partner cannot change the accepted agency-wide schedule';
  } else throw Error('Unknown family');
  assert.deepEqual(actual,expected);
  const beforeDeniedWrite = JSON.stringify(s);
  assert.throws(() => run(s,partner,'settings',{day:s.day===1?2:1}), /denied/);
  assert.equal(JSON.stringify(s),beforeDeniedWrite);
  return {family:families[family],inputs,actual,expected,contract:review,boundary:challenge};
}
