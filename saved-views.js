import { visibleReports } from './report-engine.js';
import { randomUUID } from 'node:crypto';
const allowedKeys=new Set(['report','q','month','sort','direction','year','quarter','from','through','dimension','match','omit','groups','trend','measure','col','size','baseline']);

export function normalizeView(user,raw) {
  if(typeof raw!=='string'||raw.length>7000)throw Error('Report selection is too long.');
  const source=new URLSearchParams(raw),params=new URLSearchParams();
  const id=source.get('report');
  if(!visibleReports(user).some(d=>d.id===id))throw Error('Report unavailable.');
  for(const [k,v] of source)if(allowedKeys.has(k)&&v.length<=600)params.append(k,v);
  return params.toString();
}

export function saveView(state,user,fields) {
  const name=String(fields.title||'').trim();
  if(!name||name.length>80)throw Error('Choose a view name of 1 to 80 characters.');
  const query=normalizeView(user,fields.selection);
  state.reportViews??=[];
  const mine=state.reportViews.filter(v=>v.person===user.id);
  const existing=mine.find(v=>v.name.toLowerCase()===name.toLowerCase());
  if(existing){existing.query=query;existing.name=name;return;}
  if(mine.length>=30)throw Error('Remove a saved view before adding another.');
  state.reportViews.push({id:randomUUID(),person:user.id,name,query});
}

export function removeView(state,user,id) {
  const row=(state.reportViews||[]).find(v=>v.person===user.id&&v.id===id);
  if(!row)throw Error('Saved view unavailable.');
  state.reportViews=state.reportViews.filter(v=>v!==row);
}

export function myViews(state,user){
  const permitted=new Set(visibleReports(user).map(d=>d.id));
  return (state.reportViews||[]).filter(v=>v.person===user.id&&permitted.has(new URLSearchParams(v.query).get('report')));
}
