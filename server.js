import {available,exportData} from './analysis-tools.js';
import {reportPanel,readReport,reportCsv} from './report-engine.js';
import {previewPage,hasPreview} from './preview.js';
import {prepareAccounts,addPerson} from './administration.js';
import {saveView,removeView} from './saved-views.js';
import http from 'node:http';
import {DatabaseSync} from 'node:sqlite';
import {mkdirSync,readFileSync} from 'node:fs';
import {resolve} from 'node:path';
import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import {seed,run,visibleClients} from './model.js';
import {page,login,esc} from './views.js';
const accounts=JSON.parse(readFileSync(new URL('./demo-users.json',import.meta.url)));
const {version:release}=JSON.parse(readFileSync(new URL('./package.json',import.meta.url)));
const css=readFileSync(new URL('./style.css',import.meta.url));
const directory=process.env.DATA_DIR||'./local-data';mkdirSync(directory,{recursive:true});
const db=new DatabaseSync(resolve(directory,'agentcrm.sqlite'));
db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS records(id INTEGER PRIMARY KEY, version INTEGER, data TEXT); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY, person TEXT, csrf TEXT, expires INTEGER); CREATE TABLE IF NOT EXISTS audit(id INTEGER PRIMARY KEY, person TEXT, event TEXT, at TEXT)');
const digest=v=>createHash('sha256').update(v).digest('hex');
const nonce=()=>randomBytes(32).toString('hex');
if(!db.prepare('SELECT id FROM records WHERE id=1').get())db.prepare('INSERT INTO records VALUES(1,1,?)').run(JSON.stringify(seed(accounts.map(({id,name,email,roles})=>({id,name,email,roles})))));
prepareAccounts(db);
const failures=new Map(), secure=process.env.NODE_ENV==='production';
const cookie=v=>'crm='+v+'; HttpOnly; SameSite=Lax; Path=/'+(secure?'; Secure':'');
const bounce=(res,location)=>{res.writeHead(303,{Location:location});res.end()};
const reply=(res,status,body,type='text/html; charset=utf-8')=>{res.writeHead(status,{'Content-Type':type});res.end(body)};
const routes=['/reports','/','/sales','/clients','/earnings','/commissions','/owners','/people','/settings'];
http.createServer(async(req,res)=>{
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Content-Security-Policy',"default-src 'self'; style-src 'self'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'");
 const url=new URL(req.url,'http://localhost'),path=url.pathname;
 try{
 if(path==='/health'){
   res.setHeader('X-AgentCRM-Version',release);
   return reply(res,200,JSON.stringify({status:'ok',database:!!db.prepare('SELECT id FROM records WHERE id=1').get()}),'application/json');
 }
 if(path==='/style.css')return reply(res,200,css,'text/css');
 const token=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('crm='))?.slice(4)||'';
 const session=db.prepare('SELECT * FROM sessions WHERE token=? AND expires>?').get(digest(token),Date.now());
 let f={};if(req.method==='POST'){const chunks=[];let len=0;for await(const b of req){len+=b.length;if(len>32768)return reply(res,413,'Request too large');chunks.push(b)}
 if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)return reply(res,403,'Origin mismatch');f=Object.fromEntries(new URLSearchParams(Buffer.concat(chunks).toString()))}
 if(path==='/login'){if(req.method==='GET')return reply(res,200,login());if(req.method!=='POST')return reply(res,405,'Method not allowed');
 const email=String(f.email||'').toLowerCase().trim(),key=digest(email);let bucket=failures.get(key);if(bucket&&bucket.until>Date.now()&&bucket.count>=12)return reply(res,429,login('Try again later.'));
 const a=accounts.find(x=>x.email===email)||db.prepare('SELECT person AS id,salt,hash FROM credentials WHERE email=?').get(email),candidate=scryptSync(f.password||'',(a||accounts[0]).salt,64);
 if(!a||!timingSafeEqual(candidate,Buffer.from(a.hash,'hex'))){if(!bucket||bucket.until<Date.now())bucket={until:Date.now()+600000,count:0};bucket.count++;if(a)failures.set(key,bucket);return reply(res,401,login('Email or password did not match.'))}
 failures.delete(key);const id=nonce();db.prepare('DELETE FROM sessions WHERE expires<=?').run(Date.now());db.prepare('INSERT INTO sessions VALUES(?,?,?,?)').run(digest(id),a.id,nonce(),Date.now()+8*3600000);res.setHeader('Set-Cookie',cookie(id));return bounce(res,'/')}
 if(!session)return bounce(res,'/login');
 const record=db.prepare('SELECT * FROM records WHERE id=1').get(),state=JSON.parse(record.data),u=state.people.find(p=>p.id===session.person);
 const admin=u.roles.includes('admin'),global=admin||u.roles.includes('super');
 if(req.method==='POST'){if(f.csrf!==session.csrf)return reply(res,403,'Form token mismatch');
 if(path==='/logout'){db.prepare('DELETE FROM sessions WHERE token=?').run(session.token);res.setHeader('Set-Cookie',cookie('')+'; Max-Age=0');return bounce(res,'/login')}
 if(path!=='/save')return reply(res,404,'Unknown action');
 if(Number(f.version)!==record.version)return reply(res,409,'Another entry was saved. Reload the previous page before submitting.');
 if(f.action==='saveView')saveView(state,u,f);
 else if(f.action==='removeView')removeView(state,u,f.view);
 else if(f.action==='super'){if(!admin)return reply(res,403,'Permission denied');const p=state.people.find(p=>p.id===f.person);if(!p)throw Error('Unknown person');p.roles=p.roles.filter(r=>r!=='super');if(f.enabled==='yes')p.roles.push('super')}
 else if(f.action==='person'){if(!admin)return reply(res,403,'Permission denied')}
 else {
   const partner=u.roles.includes('partner'),owner=u.roles.includes('owner');
   if(!admin&&!((partner&&f.action==='refer')||((partner||owner)&&f.action==='preference')))return reply(res,403,'Permission denied');
   if(f.action==='receipt')f.review='draft';
   run(state,u,f.action,f);
 }
 if(f.preview==='yes'&&hasPreview(f.action))return reply(res,200,previewPage(state,f));
 db.exec('BEGIN IMMEDIATE');try{if(f.action==='person')addPerson(state,db,f,accounts);const updated=db.prepare('UPDATE records SET version=version+1,data=? WHERE id=1 AND version=?').run(JSON.stringify(state),record.version);if(!updated.changes)throw Error('Data changed. Reload and retry.');db.prepare('INSERT INTO audit(person,event,at) VALUES(?,?,?)').run(u.id,f.action,new Date().toISOString());db.exec('COMMIT')}catch(e){db.exec('ROLLBACK');throw e}
 return bounce(res,(routes.includes(f.return)?f.return:'/')+'?saved=1')}
 if(req.method==='GET'&&path==='/reports.csv'){const result=readReport(state,u,url.searchParams.get('report'),url.searchParams);if(!result||!result.definition.capabilities.includes('csv'))return reply(res,403,'Report unavailable');res.setHeader('Content-Disposition','attachment; filename="'+result.definition.id+'.csv"');const selected=url.searchParams.get('layout')==='visible'&&available(result.definition,'csvColumns');return reply(res,200,reportCsv(exportData(result,selected)),'text/csv; charset=utf-8')}
 if(req.method==='GET'&&['/reports.json','/reports/print'].includes(path)){
   const result=readReport(state,u,url.searchParams.get('report'),url.searchParams);
   const print=path==='/reports/print';
   if(!result||!available(result.definition,print?'print':'json'))return reply(res,403,'Report unavailable');
   if(print)return reply(res,200,'<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'+esc(result.definition.title)+'</title><link rel="stylesheet" href="/style.css"></head><body><main class="print-report">'+reportPanel(state,u,url.searchParams,true)+'</main></body></html>');
   const data=exportData(result,true);
   res.setHeader('Content-Disposition','attachment; filename="'+result.definition.id+'.json"');
   return reply(res,200,JSON.stringify({report:result.definition.id,columns:data.definition.columns,units:data.definition.columns.map(c=>c.endsWith(' ($)')?'USD cents':c.endsWith(' (%)')?'basis points':'native'),rows:data.rows}),'application/json; charset=utf-8');
 }
 if(req.method!=='GET'||!routes.includes(path))return reply(res,404,'Page unavailable');
 if((['/people','/settings','/earnings'].includes(path)&&!global)||(['/owners'].includes(path)&&!global&&!u.roles.includes('owner'))||(['/sales','/clients','/commissions'].includes(path)&&!global&&!u.roles.includes('partner')))return reply(res,403,'Permission denied');
 const client=url.searchParams.get('client');
 if(path==='/clients'&&client!==null&&!visibleClients(state,u).some(record=>record.id===client))return reply(res,404,'Client unavailable');
 return reply(res,200,page(state,u,path,{csrf:session.csrf,version:record.version,saved:url.searchParams.has('saved'),client,query:url.searchParams,audit:admin&&path==='/settings'?db.prepare('SELECT person,event,at FROM audit ORDER BY id DESC LIMIT 100').all():[]}));
 }catch(e){reply(res,400,'<!doctype html><html lang="en"><title>Entry needs attention</title><link rel="stylesheet" href="/style.css"><main><h1>Entry needs attention</h1><p>'+esc(e.message)+'</p><p>Use your browser’s Back button to revise this entry.</p><a href="/">Overview</a></main></html>')}
}).listen(Number(process.env.PORT||3000),'0.0.0.0');
