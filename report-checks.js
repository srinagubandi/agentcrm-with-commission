import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { seed, run } from './model.js';
import { readReport, reportCsv, reportPanel } from './report-engine.js';
import { page } from './views.js';

const people=JSON.parse(readFileSync(new URL('./demo-users.json',import.meta.url))).map(({id,name,roles,email})=>({id,name,roles,email}));
function fixture(){
  const state=seed(structuredClone(people));
  const a=state.people[0],r=state.receipts[0];
  run(state,a,'refund',{date:'2026-11-02',client:r.cid,fee:r.fee,receipt:r.id,amount:100,ref:'Review refund',deduct:'yes'});
  run(state,a,'payout',{date:'2026-11-03',kind:'owner',person:'owner',amount:10,ref:'Owner draw',method:'ACH'});
  run(state,a,'expense',{date:'2026-09-01',name:'Setup',amount:100,lines:'alder,100'});
  run(state,a,'stage',{deal:state.deals[0].id,stage:'Contacted',note:'Called prospect',follow:'2026-11-24'});
  return state;
}
// Expected reference records are independently calculated from the synthetic contracts.
const examples={
 invoices:['2026-10-01','Alder Studio','OCT-alder',300000,200000,500000],
 balances:['2026-10-01','Harbor House','OCT-harbor',500000,250000,250000],
 collections:['2026-10-15','Alder Studio','ACH','DEMO-alder',500000],
 allocations:['2026-10-15','Harbor House','DEMO-harbor',150000,100000],
 refunds:['2026-11-02','Alder Studio','Review refund','DEMO-alder',10000,1700],
 earnings:['2026-10-15','Alder Studio','Morgan Reed','DEMO-alder',60000],
 calculations:['2026-10-15','Alder Studio','Morgan Reed','Performance',200000,1500,30000],
 'partner-payments':['2026-11-15','Morgan Reed','ACH','SAMPLE-001',20000],
 'partner-month':['2026-10','Morgan Reed',82500,0,82500],
 scheduled:['2026-11-15','2026-10','Morgan Reed',82500],
 'owner-earnings':['2026-10','Alder Studio','Sam Cole',182500],
 'owner-payments':['2026-11-03','Sam Cole','ACH','Owner draw',1000],
 reserves:['2026-10','Alder Studio',365000,292000,73000],
 losses:['2026-09','Alder Studio',0,-10000,10000],
 expenses:['2026-10-18','Design production','Harbor House',20000],
 followups:['2026-11-24','Beacon Creative','Morgan Reed','Contacted','team@example.invalid'],
 stages:[new Date().toISOString().slice(0,10),'Beacon Creative','New Referral','Contacted','Avery Bell','Called prospect'],
 agreements:['2026-01-01','Alder Studio',300000,'both','Individual','marginal'],
 tiers:['2026-01-01','Alder Studio',2,'Unlimited',700,'marginal'],
 'owner-terms':['2026-01-01','Alder Studio','Sam Cole',5000]
};
const stages=['rows','search','month','sort','csv'];
export function review(def,step){
  const state=fixture(),admin=state.people[0],expected=examples[def.id];
  const query=new URLSearchParams({report:def.id});
  const get=(user=admin,q=query,s=state)=>readReport(s,user,def.id,q);
  const snapshot=JSON.stringify(state), base=get().rows;
  const findings=[];
  // Code review 1: inspect the report's declaration and result contract.
  assert.ok(def.capabilities.includes(stages[step]));
  assert.equal(def.columns.length,new Set(def.columns).size);
  assert.ok(base.every(r=>r.length===def.columns.length&&r.every(v=>typeof v==='string'||Number.isSafeInteger(v))));
  const body=page(state,admin,'/reports',{query,csrf:'test',version:1});
  // Code review 2: verify this feature is actually reachable from the rendered screen.
  const controls=['<th scope="col">','name="q"','name="month"','name="sort"','Download filtered CSV'];
  assert.ok(body.includes(controls[step])&&body.includes(def.title));
  const forbidden={id:'unrelated',roles:['guest']};
  assert.equal(get(forbidden),null);
  const scoped=['partner','owner'].find(role=>def.roles.includes(role));
  if(scoped) assert.deepEqual(get({id:'unrelated',roles:[scoped]}).rows,[]);
  else assert.equal(get({id:'partner',roles:['partner']}),null);
  // Skeptic 1: the same query must not return records through a different identity.
  const empty={people:[],clients:[],deals:[],expenses:[],receipts:[],fees:[],payouts:[],day:15};
  assert.deepEqual(get(admin,query,empty).rows,[]);
  // Skeptic 2: challenge the feature with an empty source and a hostile or boundary input.
  if(step===0){
    assert.ok(base.some(row=>JSON.stringify(row)===JSON.stringify(expected)),def.id+' fixture mismatch: '+JSON.stringify(base));
    const restricted=reportPanel(state,forbidden,query);assert.ok(!restricted.includes(def.title));
    findings.push('Verified independent fixture '+JSON.stringify(expected));
  }else if(step===1){
    const needle=String(expected[1]).toUpperCase();query.set('q','  '+needle+' ');
    assert.deepEqual(get().rows,base.filter(row=>row.some(cell=>String(cell).toUpperCase().includes(needle))));
    query.set('q','<unmatched-input>');assert.deepEqual(get().rows,[]);assert.ok(!reportPanel(state,admin,query).includes('<unmatched-input>'));
    findings.push('Case-insensitive match for '+needle+'; unknown text returns zero rows; input is escaped.');
  }else if(step===2){
    const month=expected[0].slice(0,7);query.set('month',month);
    assert.deepEqual(get().rows,base.filter(row=>row[0].startsWith(month)));query.set('month','2026-13');assert.deepEqual(get().rows,[]);
    findings.push('Checked '+month+' against source dates and rejected invalid month 13.');
  }else if(step===3){
    const i=Math.max(1,def.columns.findIndex(c=>c.endsWith('($)')));query.set('sort',def.columns[i]);
    for(const dir of ['asc','desc']){query.set('direction',dir);const rows=get().rows;assert.equal(rows.length,base.length);for(let j=1;j<rows.length;j++){
      const a=rows[j-1][i],b=rows[j][i];const cmp=typeof a==='number'?a-b:String(a).localeCompare(String(b),'en',{numeric:true});assert.ok(dir==='asc'?cmp<=0:cmp>=0);
    }}
    query.set('sort','unknown');assert.deepEqual(get().rows,base);
    findings.push('Checked both sort directions on '+def.columns[i]+' and fallback for an unknown column.');
  }else{
    const csv=reportCsv(get());assert.ok(csv.startsWith('"'+def.columns[0]+'"'));assert.equal(csv.split('\r\n').length,base.length+2);
    const hostile=Array(def.columns.length).fill('=FORMULA');hostile[0]='=FORMULA';
    assert.ok(reportCsv({definition:def,rows:[hostile]}).includes('"\'=FORMULA"'));
    query.set('q','unmatched-fixture');assert.equal(reportCsv(get()).split('\r\n').length,2);
    findings.push('CSV contains '+base.length+' visible records, quotes formula-like text and preserves empty filtered exports.');
  }
  assert.equal(JSON.stringify(state),snapshot);
  return {contract:'Column types, width and capability declaration verified.',integration:'Rendered /reports exposes '+controls[step]+'.',
    privacy:'Unrelated identity and scoped role evaluated before projection.',boundary:'Empty source and feature-specific edge verified.',acceptance:findings[0]};
}
