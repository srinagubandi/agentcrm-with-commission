import { enabledTools } from './analysis-config.js';

export const toolNames = ['year','quarter','from','through','match','omit','groups','trend','columns','pageSize','pageNav','csvColumns','print','json','compare'];
const escape = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const usd = new Intl.NumberFormat('en-US',{style:'currency',currency:'USD'});

export function available(definition, feature) {
  return enabledTools[definition.id]?.includes(feature) === true;
}

function validDay(day) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(day)) return false;
  const parsed = new Date(day+'T12:00:00Z');
  return Number.isFinite(parsed.valueOf()) && parsed.toISOString().startsWith(day);
}

export function analyze(definition, source, query) {
  const has = feature => available(definition,feature);
  const columns = definition.columns;
  const year = has('year') && query.get('year');
  const quarter = has('quarter') && query.get('quarter');
  const lower = has('from') && query.get('from');
  const upper = has('through') && query.get('through');
  const dimension = Math.max(1,columns.indexOf(query.get('dimension')));
  const selected = query.get('match') || '';
  const excluded = query.get('omit') || '';
  const rows = source.filter(row=>{
    const day = String(row[0] ?? '');
    const monthly = day.length === 7;
    if(year && (!/^\d{4}$/.test(year)||day.slice(0,4)!==year))return false;
    if(quarter && (!/^[1-4]$/.test(quarter)||Math.ceil(Number(day.slice(5,7))/3)!==Number(quarter)))return false;
    // A monthly record overlaps every date within its calendar month.
    if(lower && (!validDay(lower)||!day||day < (monthly?lower.slice(0,7):lower)))return false;
    if(upper && (!validDay(upper)||!day||day > (monthly?upper.slice(0,7):upper)))return false;
    if(lower && upper && lower>upper)return false;
    if(has('match')&&selected&&String(row[dimension])!==selected)return false;
    if(has('omit')&&excluded&&String(row[dimension])===excluded)return false;
    return true;
  });
  const requested = has('columns') ? query.getAll('col') : [];
  let indexes = columns.map((_,i)=>i).filter(i=>!requested.length||requested.includes(columns[i]));
  if(!indexes.length)indexes=columns.map((_,i)=>i);
  const sizes=[10,25,50,100];
  const size=has('pageSize')&&sizes.includes(Number(query.get('size')))?Number(query.get('size')):25;
  const pages=Math.max(1,Math.ceil(rows.length/size));
  const requestedPage=Number(query.get('page'));
  const page=has('pageNav')&&Number.isSafeInteger(requestedPage)?Math.max(1,Math.min(pages,requestedPage)):1;
  // Never truncate a report until its pagination controls have shipped.
  const pageRows=has('pageNav')?rows.slice((page-1)*size,page*size):rows;
  const measures=columns.flatMap((name,i)=>name.endsWith(' ($)')?[i]:[]);
  const measure=measures.find(i=>columns[i]===query.get('measure'))??measures.at(-1)??-1;
  function summarize(records,keyOf) {
    const map = new Map();
    for(const row of records) {
      const key = keyOf(row);
      const item = map.get(key) || {key,count:0,value:0};
      item.count++;
      item.value += measure===-1?1:row[measure];
      map.set(key,item);
    }
    return [...map.values()].sort((a,b)=>a.key.localeCompare(b.key,'en',{numeric:true}));
  }
  const groups=has('groups')&&query.get('groups')==='1'?summarize(rows,r=>String(r[dimension])):[];
  const trend=has('trend')&&query.get('trend')==='1'?summarize(rows,r=>String(r[0]).slice(0,7)||'Undated'):[];
  return {rows,pageRows,indexes,dimension,measure,measures,groups,trend,size,page,pages};
}

function queryLink(query,changes,route='/reports') {
  const params=new URLSearchParams(query);
  for(const [k,v] of Object.entries(changes))params.set(k,String(v));
  return escape(route+'?'+params.toString());
}

export function analysisControls(def,q,a) {
  const has=f=>available(def,f);
  function input(name,label,type='text') {
    return '<label>'+label+'<input type="'+type+'" name="'+name+'" value="'+escape(q.get(name))+'"></label>';
  }
  function select(name,label,values,active) {
    return '<label>'+label+'<select name="'+name+'">'+values.map(([k,v])=>'<option value="'+escape(k)+'"'+(String(k)===String(active)?' selected':'')+'>'+escape(v)+'</option>').join('')+'</select></label>';
  }
  function toggle(name,label) {
    return '<label><input type="checkbox" name="'+name+'" value="1"'+(q.get(name)==='1'?' checked':'')+'>'+label+'</label>';
  }
  let out='';
  if(has('year'))out+=input('year','Calendar year');
  if(has('quarter'))out+=select('quarter','Calendar quarter',[['','All quarters'],...[1,2,3,4].map(i=>[i,'Q'+i])],q.get('quarter'));
  if(has('from'))out+=input('from','From date','date');
  if(has('through'))out+=input('through','Through date','date');
  if(has('match'))out+=select('dimension','Field for exact matching and grouping',def.columns.slice(1).map(v=>[v,v]),def.columns[a.dimension])+input('match','Include exact field value');
  if(has('omit'))out+=input('omit','Exclude exact field value');
  if(has('groups'))out+=toggle('groups','Summarize by selected field');
  if((has('groups')||has('trend'))&&a.measures.length)out+=select('measure','Amount to summarize',a.measures.map(i=>[def.columns[i],def.columns[i]]),def.columns[a.measure]);
  if(has('trend'))out+=toggle('trend','Show monthly totals');
  if(has('columns'))out+='<fieldset><legend>Visible columns</legend>'+def.columns.map((v,i)=>'<label><input type="checkbox" name="col" value="'+escape(v)+'"'+(a.indexes.includes(i)?' checked':'')+'>'+escape(v)+'</label>').join('')+'</fieldset>';
  if(has('pageSize'))out+=select('size','Rows per page',[10,25,50,100].map(n=>[n,n]),a.size);
  if(has('compare'))out+=input('baseline','Compare against this month','month');
  return out?'<details class="analysis"><summary>Report options</summary>'+out+'</details>':'';
}

export function analysisExtras(def,q,a,comparison) {
  const has=f=>available(def,f);
  const amount=n=>a.measure===-1?String(n):usd.format(n/100);
  const metric=a.measure===-1?'Record count':def.columns[a.measure];
  const grid=(title,items)=>!items.length?'':'<section><h3>'+title+'</h3><table><thead><tr><th>Group</th><th>Records</th><th>'+escape(metric)+'</th></tr></thead><tbody>'+items.map(v=>'<tr><th scope="row">'+escape(v.key)+'</th><td>'+v.count+'</td><td>'+amount(v.value)+'</td></tr>').join('')+'</tbody></table></section>';
  let out=grid('Group totals',a.groups)+grid('Monthly totals',a.trend);
  if(comparison)out+='<section><h3>Period comparison</h3><p>'+escape(metric)+' · Current selection '+amount(comparison.current)+' · '+escape(q.get('baseline'))+' '+amount(comparison.baseline)+' · Change '+amount(comparison.current-comparison.baseline)+'</p></section>';
  if(has('pageNav')){
    out+='<nav aria-label="Report pages">Page '+a.page+' of '+a.pages;
    if(a.page>1)out+=' <a href="'+queryLink(q,{report:def.id,page:a.page-1})+'">Previous page</a>';
    if(a.page<a.pages)out+=' <a href="'+queryLink(q,{report:def.id,page:a.page+1})+'">Next page</a>';
    out+='</nav>';
  }
  if(has('csvColumns'))out+='<a href="'+queryLink(q,{report:def.id,layout:'visible'},'/reports.csv')+'">CSV with visible columns</a> ';
  if(has('print'))out+='<a href="'+queryLink(q,{report:def.id},'/reports/print')+'">Print full filtered report</a> ';
  if(has('json'))out+='<a href="'+queryLink(q,{report:def.id},'/reports.json')+'">Download JSON</a>';
  return out;
}

export function exportData(result,visible) {
  const {definition,rows,analysis}=result;
  const indexes=visible?analysis.indexes:definition.columns.map((_,i)=>i);
  return {definition:{...definition,columns:indexes.map(i=>definition.columns[i])},rows:rows.map(r=>indexes.map(i=>r[i]))};
}
