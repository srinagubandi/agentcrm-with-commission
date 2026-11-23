import assert from 'node:assert/strict';
import {available,analyze,analysisControls,analysisExtras,exportData} from './analysis-tools.js';
import {reportPanel,readReport,reportCsv} from './report-engine.js';
import {seed,run,today} from './model.js';
import {readFileSync} from 'node:fs';
const accounts=JSON.parse(readFileSync(new URL('./demo-users.json',import.meta.url))).map(({id,name,roles,email})=>({id,name,roles,email}));

const markers={year:'name="year"',quarter:'name="quarter"',from:'name="from"',through:'name="through"',match:'name="match"',omit:'name="omit"',groups:'name="groups"',trend:'name="trend"',columns:'name="col"',pageSize:'name="size"',pageNav:'aria-label="Report pages"',csvColumns:'CSV with visible columns',print:'Print full filtered report',json:'Download JSON',compare:'name="baseline"'};

function fixture(){
  const state=seed(structuredClone(accounts)),admin=state.people[0],r=state.receipts[0];
  run(state,admin,'refund',{date:'2026-11-02',client:r.cid,fee:r.fee,receipt:r.id,amount:10,ref:'R-2',deduct:'yes'});
  run(state,admin,'payout',{date:'2026-11-03',kind:'owner',person:'owner',amount:2,method:'ACH',ref:'P-2'});
  run(state,admin,'expense',{date:'2026-09-01',name:'Startup',amount:50,lines:'alder,50'});
  run(state,admin,'stage',{deal:state.deals[0].id,stage:'Contacted',note:'Review',follow:today()});
  return state;
}

export function checkCapability(def,feature){
  assert.ok(available(def,feature));
  const state=fixture(),u=state.people[0],query=new URLSearchParams({report:def.id});
  const scope=readReport(state,u,def.id,query);
  const panel=reportPanel(state,u,query);
  assert.ok(panel.includes(markers[feature]),def.id+' missing '+feature);
  assert.ok(scope.rows.length,'Fixture must exercise '+def.id);
  const outsider={id:'outside',roles:['partner']},privateQuery=new URLSearchParams({report:def.id,groups:'1',trend:'1',baseline:'2026-10'});
  const restricted=readReport(state,outsider,def.id,privateQuery);
  assert.ok(restricted===null || (restricted.rows.length===0 && restricted.analysis.groups.length===0));
  if(restricted)assert.ok(!reportPanel(state,outsider,privateQuery).includes('Alder Studio'));
  const row=scope.rows[0],monthly=row[0].length===7,month=row[0].slice(0,7);
  const marker=row[1];const example=structuredClone(row);
  example[0]=monthly?'2024-02':'2024-02-29';
  const second=structuredClone(example);second[0]=monthly?'2025-04':'2025-04-01';second[1]='Other';
  const rows=[example,second],frozen=JSON.stringify(rows);
  const result=(params={},data=rows)=>analyze(def,data,new URLSearchParams(params));
  const view=(params={})=>reportPanel(state,u,new URLSearchParams({report:def.id,...params}));
  let evidence;
  switch(feature){
    case 'year':
      assert.deepEqual(result({year:'2024'}).rows,[example]);assert.equal(result({year:'24'}).rows.length,0);
      evidence='Selected 2024 and rejected incomplete year 24';break;
    case 'quarter':
      assert.deepEqual(result({quarter:'1'}).rows,[example]);assert.deepEqual(result({quarter:'2'}).rows,[second]);assert.equal(result({quarter:'9'}).rows.length,0);
      evidence='Separated Q1 and Q2 across the March boundary and rejected quarter 9';break;
    case 'from':
      assert.deepEqual(result({from:'2025-04-01'}).rows,[second]);assert.equal(result({from:'2023-02-29'}).rows.length,0);
      evidence='Inclusive April start and invalid February 29 tested';break;
    case 'through':
      assert.deepEqual(result({through:'2024-02-29'}).rows,[example]);assert.equal(result({from:'2025-01-01',through:'2024-02-29'}).rows.length,0);
      evidence='Included leap day and rejected reversed interval';break;
    case 'match':
      assert.deepEqual(result({match:String(marker),dimension:def.columns[1]}).rows,[example]);assert.equal(result({match:'absent'}).rows.length,0);
      evidence='Matched actual dimension value and excluded absent value';break;
    case 'omit':
      assert.deepEqual(result({omit:String(marker)}).rows,[second]);assert.equal(result({match:String(marker),omit:String(marker)}).rows.length,0);
      evidence='Excluded chosen value and resolved conflicting filters to zero rows';break;
    case 'groups':case 'trend':{
      const key=feature==='groups'?'groups':'trend';const a=result({[key]:'1'},[example,example,second]);
      assert.equal(a[key].length,2);assert.equal(a[key].reduce((s,x)=>s+x.count,0),3);
      const expected=a.measure===-1?3:example[a.measure]*2+second[a.measure];
      assert.equal(a[key].reduce((s,x)=>s+x.value,0),expected);
      assert.deepEqual(result({[key]:'1'},[])[key],[]);
      evidence='Reconciled three entries into two buckets and checked empty totals';break;
    }
    case 'columns':{
      const a=result({col:def.columns.at(-1)});assert.deepEqual(a.indexes,[def.columns.length-1]);
      assert.equal(result({col:'unknown'}).indexes.length,def.columns.length);
      evidence='Projected final column and recovered from an invalid selection';break;
    }
    case 'pageSize':
      assert.equal(result({size:'10'}).size,10);assert.equal(result({size:'100'}).size,100);assert.equal(result({size:'-1'}).size,25);
      evidence='Accepted supported limits and rejected a negative page size';break;
    case 'pageNav':{
      const big=[...Array(30).fill(example),second];const a=result({size:'10',page:'99'},big);assert.equal(a.page,4);assert.deepEqual(a.pageRows,[second]);
      assert.equal(result({size:'10',page:'-2'},big).page,1);
      evidence='31 rows paginate into four pages with clamped first and last page';break;
    }
    case 'csvColumns':case 'json':{
      const data=exportData({...scope,analysis:result({col:def.columns[1]})},true);
      assert.deepEqual(data.definition.columns,[def.columns[1]]);assert.equal(data.rows.length,scope.rows.length);assert.ok(data.rows.every(r=>r.length===1));
      if(feature==='csvColumns')assert.ok(reportCsv(data).startsWith('"'+def.columns[1]+'"'));
      else assert.deepEqual(JSON.parse(JSON.stringify(data.rows)),data.rows);
      assert.equal(exportData(scope,false).definition.columns.length,def.columns.length);
      evidence='Verified field order, all filtered rows and full-width export parity';break;
    }
    case 'print':{
      const printed=reportPanel(state,u,query,true);assert.ok(printed.includes(def.title)&&printed.includes('<table>'));assert.ok(!printed.includes('method="get"'));
      assert.ok(reportPanel(state,outsider,privateQuery,true).includes('unavailable')||!reportPanel(state,outsider,privateQuery,true).includes('Alder Studio'));
      evidence='Read-only print layout renders scoped rows and suppresses filter form';break;
    }
    case 'compare':{
      const valid=view({baseline:month,month});assert.ok(valid.includes('Period comparison'));assert.match(valid,/Change (?:\$0\.00|0)<\/p>/);assert.ok(!view({baseline:'2024-99'}).includes('Period comparison'));
      evidence='Matched a period to itself for zero variance and rejected invalid baseline';break;
    }
  }
  assert.equal(JSON.stringify(rows),frozen);
  const empty=result({},[]);assert.deepEqual(empty.pageRows,[]);
  const controls=analysisControls(def,query,scope.analysis)+analysisExtras(def,query,scope.analysis,null);
  assert.ok(controls.includes(markers[feature]));
  return {codeReview1:'Checked the '+feature+' contract against the '+def.id+' projection ('+def.columns.length+' columns).',codeReview2:'Checked integration of '+markers[feature]+' through the authenticated report panel.',skepticReview1:'Tested unrelated partner scope including aggregated and comparison output.',skepticReview2:evidence,fixOrDisposition:'Assertions passed; input rows remained unchanged.'};
}
