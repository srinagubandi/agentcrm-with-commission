import {available,analyze,analysisControls,analysisExtras,exportData} from './analysis-tools.js';
import { owners, reportableReceipts } from './model.js';
import { reportCatalog } from './report-catalog.js';

export function visibleReports(user) {
  return reportCatalog.filter(report => user.roles.some(role => report.roles.includes(role)));
}

function html(value) {
  return String(value ?? '').replace(/[&<>"']/g, ch =>
    ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[ch]));
}

function project(state, user, definition) {
  const global = user.roles.includes('admin') || user.roles.includes('super');
  const person = id => state.people.find(p => p.id === id)?.name ?? id;
  const client = id => state.clients.find(c => c.id === id)?.name ?? id;
  const allowed = id => global || user.id === id;
  if (!global&&definition.roles.includes('partner')) state={...state,receipts:reportableReceipts(state)};
  return definition.rows({state, person, client, allowed, owners});
}

export function readReport(state, user, id, query = new URLSearchParams()) {
  const definition = visibleReports(user).find(report => report.id === id);
  if (!definition) return null;
  let rows = project(state, user, definition);
  const { capabilities, columns } = definition;
  if (capabilities.includes('search')) {
    const term = (query.get('q') ?? '').trim().toLowerCase();
    if (term) rows = rows.filter(row => row.some(cell => String(cell ?? '').toLowerCase().includes(term)));
  }
  if (capabilities.includes('month')) {
    const month = query.get('month');
    if (month) rows = /^\d{4}-(0[1-9]|1[0-2])$/.test(month)
      ? rows.filter(row => String(row[0]).slice(0,7) === month) : [];
  }
  if (capabilities.includes('sort')) {
    const position = columns.indexOf(query.get('sort'));
    if (position >= 0) {
      const direction = query.get('direction') === 'desc' ? -1 : 1;
      rows = [...rows].sort((a,b) => direction * (typeof a[position] === 'number' && typeof b[position] === 'number'
        ? a[position] - b[position] : String(a[position]).localeCompare(String(b[position]),'en',{numeric:true})));
    }
  }
  const analysis=analyze(definition,rows,query);
  return {definition,rows:analysis.rows,analysis};
}

const usd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});
function display(report, value, index, csv) {
  if(value===''||value==null)return '';
  const label = report.columns[index];
  if (label.endsWith(' ($)')) return csv ? (value/100).toFixed(2) : usd.format(value/100);
  if (label.endsWith(' (%)')) return csv ? (value/100).toFixed(2) : (value/100)+'%';
  return String(value ?? '');
}

export function reportCsv({definition,rows}) {
  if (!definition.capabilities.includes('csv')) throw Error('Export unavailable');
  function quote(cell, numeric) {
    let str = String(cell);
    if (!numeric && /^[\s]*[=+@-]|^[\t\r\n]/.test(str)) str = "'"+str;
    return '"'+str.replaceAll('"','""')+'"';
  }
  return [definition.columns.map(label=>quote(label,false)).join(','),
    ...rows.map(row=>row.map((v,i)=>quote(display(definition,v,i,true),typeof v==='number')).join(','))].join('\r\n')+'\r\n';
}

export function reportPanel(state,user,query,print=false) {
  const choices=visibleReports(user);
  if (!choices.length) return '<p>No reports available for this account.</p>';
  const id=query.get('report') || choices[0].id;
  const result=readReport(state,user,id,query);
  if (!result) return '<p>Report unavailable.</p>';
  const {definition,rows}=result;
  const opts=(pairs,active)=>pairs.map(([v,l])=>'<option value="'+html(v)+'"'+(v===active?' selected':'')+'>'+html(l)+'</option>').join('');
  const caps=definition.capabilities;
  let form='<form class="report-filters" method="get" action="/reports"><label>Report<select name="report">'+opts(choices.map(d=>[d.id,d.title]),id)+'</select></label>';
  if(caps.includes('search')) form+='<label>Search visible records<input name="q" value="'+html(query.get('q'))+'"></label>';
  if(caps.includes('month')) form+='<label>'+html(definition.columns[0])+' month<input type="month" name="month" value="'+html(query.get('month'))+'"></label>';
  if(caps.includes('sort')) form+='<label>Sort by<select name="sort">'+opts([['','Default order'],...definition.columns.map(c=>[c,c])],query.get('sort'))+'</select></label><label>Order<select name="direction">'+opts([['asc','Ascending'],['desc','Descending']],query.get('direction'))+'</select></label>';
  form+=analysisControls(definition,query,result.analysis)+'<button>Apply</button></form>';
  const download=new URLSearchParams(query); download.set('report',id);
  let output='<section class="report-studio"><h2>'+html(definition.title)+'</h2>'+(print?'':form)+'<p>'+rows.length+' matching records</p>';
  if(!print&&caps.includes('csv')) output+='<p><a href="/reports.csv?'+html(download.toString())+'">Download filtered CSV</a></p>';
  let comparison=null;
  if(available(definition,'compare')&&/^\d{4}-(0[1-9]|1[0-2])$/.test(query.get('baseline')||'')){
    const previous=new URLSearchParams(query);
    for(const key of ['year','quarter','from','through','baseline'])previous.delete(key);
    previous.set('month',query.get('baseline'));
    const prior=readReport(state,user,id,previous).rows;
    const total=list=>result.analysis.measure===-1?list.length:list.reduce((n,r)=>n+r[result.analysis.measure],0);
    comparison={current:total(rows),baseline:total(prior)};
  }
  output+=analysisExtras(definition,query,result.analysis,comparison);
  const subset=exportData({...result,rows:print?rows:result.analysis.pageRows},true);
  if(!rows.length) return output+'<p>No matching entries.</p></section>';
  return output+'<div class="scroll"><table><thead><tr>'+subset.definition.columns.map(c=>'<th scope="col">'+html(c)+'</th>').join('')+'</tr></thead><tbody>'+subset.rows.map(row=>'<tr>'+row.map((v,i)=>'<td>'+html(display(subset.definition,v,i,false))+'</td>').join('')+'</tr>').join('')+'</tbody></table></div></section>';
}
