import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';
import {once} from 'node:events';
import net from 'node:net';
import {skepticChecks} from './skeptic-checks.js';
test('six authenticated roles, workflow writes, privacy, replay protection and restart',async(t)=>{
 const dir=await mkdtemp(join(process.cwd(),'crm-test-'));const files=['server.js','model.js','payout-balance.js','views.js','report-engine.js','analysis-tools.js','analysis-config.js','saved-views.js','report-catalog.js','preview.js','administration.js','style.css','package.json'];
 for(const f of files)await copyFile(new URL(f,import.meta.url),join(dir,f));
 const people=JSON.parse(await readFile(new URL('./demo-users.json',import.meta.url)));const keys={};
 for(const p of people){keys[p.id]=randomBytes(20).toString('hex');p.hash=scryptSync(keys[p.id],p.salt,64).toString('hex')}
 await writeFile(join(dir,'demo-users.json'),JSON.stringify(people));
 const listener=net.createServer();listener.listen(0,'127.0.0.1');await once(listener,'listening');const port=listener.address().port;await new Promise(r=>listener.close(r));
 const url='http://127.0.0.1:'+port;let proc;
 async function start(){proc=spawn(process.execPath,['server.js'],{cwd:dir,env:{...process.env,PORT:String(port),NODE_ENV:'test',DATA_DIR:dir},stdio:['ignore','ignore','inherit']});for(let n=0;n<100;n++){try{if((await fetch(url+'/health')).ok)return}catch{}await new Promise(r=>setTimeout(r,50))}throw Error('Startup failed')}
 async function stop(){if(proc&&proc.exitCode===null){const done=once(proc,'exit');proc.kill();await done}}
 try{await start();const cookies={};for(const p of people){const r=await fetch(url+'/login',{method:'POST',body:new URLSearchParams({email:p.email,password:keys[p.id]}),redirect:'manual'});assert.equal(r.status,303);cookies[p.id]=r.headers.get('set-cookie').split(';')[0]}
 const visit=(who,path)=>fetch(url+path,{headers:{cookie:cookies[who]},redirect:'manual'});
 async function fields(who,path){const html=await(await visit(who,path)).text();return {csrf:html.match(/name="csrf" value="([^"]+)/)[1],version:html.match(/name="version" value="([^"]+)/)?.[1]}}
 const save=(who,f)=>fetch(url+'/save',{method:'POST',headers:{cookie:cookies[who]},body:new URLSearchParams(f),redirect:'manual'});
 for(const [who,path,code] of [['partner','/people',403],['partner2','/earnings',403],['owner','/people',403],['owner','/owners',200],['super','/owners',200],['admin','/settings',200],['principal','/people',200]])assert.equal((await visit(who,path)).status,code);
 const reports=await visit('admin','/reports');assert.equal(reports.status,200);assert.match(await reports.text(),/Client fee register/);
 const ownExport=await visit('partner','/reports.csv?report=earnings');assert.equal(ownExport.status,200);assert.ok(!(await ownExport.text()).includes('Jules Lane'));
 assert.equal((await visit('partner','/reports.csv?report=reserves')).status,403);
 const previewForm={...await fields('admin','/earnings'),action:'fee',date:'2026-11-18',client:'alder',fixed:'',sales:'60000',calc:'sales',ref:'PREVIEW-TEST',return:'/earnings',preview:'yes'};
 const preview=await save('admin',previewForm);assert.equal(preview.status,200);assert.match(await preview.text(),/6,200.00/);
 assert.ok(!(await(await visit('admin','/earnings')).text()).includes('PREVIEW-TEST'));
 delete previewForm.preview;assert.equal((await save('admin',previewForm)).status,303);
 assert.match(await(await visit('admin','/earnings')).text(),/PREVIEW-TEST/);
 const personFields={...await fields('admin','/people'),action:'person',displayName:'Sample recruit',email:'recruit@example.invalid',password:randomBytes(24).toString('hex'),role_partner:'yes'};
 assert.equal((await save('admin',personFields)).status,303);
 const invited=await fetch(url+'/login',{method:'POST',body:new URLSearchParams({email:personFields.email,password:personFields.password}),redirect:'manual'});assert.equal(invited.status,303);
 const filtered=await visit('partner','/reports.json?report=earnings&col=Partner&match=Morgan+Reed&dimension=Partner');
 assert.equal(filtered.status,200);const exported=await filtered.json();assert.deepEqual(exported.columns,['Partner']);assert.ok(exported.rows.length&&exported.rows.every(r=>r[0]==='Morgan Reed'));
 assert.equal((await visit('partner','/reports/print?report=reserves')).status,403);assert.equal((await visit('partner','/reports.json?report=reserves')).status,403);
 const print=await visit('partner','/reports/print?report=earnings');assert.equal(print.status,200);assert.ok(!(await print.text()).includes('Jules Lane'));
 const sv={...await fields('partner','/reports'),action:'saveView',return:'/reports',title:'Morgan October',selection:'report=earnings&month=2026-10'};
 assert.equal((await save('partner',sv)).status,303);assert.match(await(await visit('partner','/reports')).text(),/Morgan October/);assert.ok(!(await(await visit('partner2','/reports')).text()).includes('Morgan October'));
 const privateHtml=await(await visit('partner','/commissions')).text();assert.ok(!privateHtml.includes('Jules Lane'));assert.ok(!(await(await visit('owner','/owners')).text()).includes('Harbor House'));
 const token=await fields('partner','/sales');assert.equal((await save('partner',{...token,action:'settings',day:'4'})).status,403);assert.equal((await save('partner',{...token,csrf:'wrong',action:'refer'})).status,403);
 const referral={...token,action:'refer',name:'Synthetic Test',partner:'partner2',contact:'test@example.invalid'};assert.equal((await save('partner',referral)).status,303);assert.equal((await save('partner',referral)).status,409);
 assert.ok(!(await(await visit('partner2','/sales')).text()).includes('Synthetic Test'));
 assert.equal((await save('partner',{...await fields('partner','/commissions'),action:'preference',preference:'Demo provider reference'})).status,303);
 assert.equal((await save('admin',{...await fields('admin','/people'),action:'approvePreference',person:'partner'})).status,303);
 assert.equal((await save('admin',{...await fields('admin','/settings'),action:'settings',day:'17'})).status,303);
 for(const route of ['/reports.csv','/reports.json','/reports/print']){
  assert.equal((await visit('partner',route+'?report=calculations')).status,403);
 }
 assert.doesNotMatch(await(await visit('partner','/commissions')).text(),/\$[\d,.]+ x [\d.]+%/);
 assert.equal((await save('owner',{...await fields('owner','/owners'),action:'preference',preference:'ACH ending 1234',return:'/owners'})).status,303);
 assert.equal((await save('admin',{...await fields('admin','/people'),action:'approvePreference',person:'owner'})).status,303);
 const earnings=await(await visit('admin','/earnings')).text();
 const fee=earnings.match(/<option value="([^"]+)">Alder Studio[^<]*PREVIEW-TEST/)[1];
 const receiptFields={...await fields('admin','/earnings'),action:'receipt',client:'alder',date:'2026-11-20',fee,amount:'400',method:'ACH',ref:'WEB-DRAFT',return:'/earnings',preview:'yes'};
 const receiptPreview=await save('admin',receiptFields);
 assert.equal(receiptPreview.status,200);
 assert.match(await receiptPreview.text(),/Draft/);
 delete receiptFields.preview;
 assert.equal((await save('admin',receiptFields)).status,303);
 assert.doesNotMatch(await(await visit('partner','/reports.csv?report=earnings')).text(),/WEB-DRAFT/);
 const receipt=(await(await visit('admin','/commissions')).text()).match(/<option value="([^"]+)">Alder Studio[^<]*WEB-DRAFT/)[1];
 assert.equal((await save('partner',{...await fields('partner','/commissions'),action:'approveReceipt',receipt})).status,403);
 assert.equal((await save('admin',{...await fields('admin','/commissions'),action:'approveReceipt',receipt})).status,303);
 assert.match(await(await visit('partner','/reports.csv?report=earnings')).text(),/WEB-DRAFT/);
 const batch={...await fields('admin','/commissions'),action:'batchPayout',date:'2026-11-20',method:'ACH',rows:'partner,partner,1,WEB-BATCH\nowner,owner,2,WEB-OWNER',return:'/commissions',preview:'yes'};
 const batchPreview=await save('admin',batch);
 assert.equal(batchPreview.status,200);
 assert.match(await batchPreview.text(),/\$3\.00/);
 delete batch.preview;
 assert.equal((await save('admin',batch)).status,303);
 const closeFields={...await fields('admin','/owners'),action:'closeMonth',client:'alder',month:'2026-10',return:'/owners',preview:'yes'};
 const closePreview=await save('admin',closeFields);
 assert.equal(closePreview.status,200);
 assert.match(await closePreview.text(),/Close through/);
 delete closeFields.preview;
 assert.equal((await save('admin',closeFields)).status,303);
 assert.equal((await save('admin',{...await fields('admin','/owners'),action:'expense',name:'Late expense',date:'2026-10-20',amount:'1',lines:'alder,1'})).status,400);
 await stop();await start();assert.match(await(await visit('admin','/settings')).text(),/<strong>17<\/strong>/);assert.match(await(await visit('partner','/commissions')).text(),/Approved: Demo provider reference/);
 assert.match(await(await visit('owner','/owners')).text(),/Approved: ACH ending 1234/);
 assert.match(await(await visit('super','/owners')).text(),/Closed client periods/);
 assert.doesNotMatch(await(await visit('owner','/owners')).text(),/Closed client periods/);
 assert.match(await(await visit('partner','/commissions')).text(),/WEB-BATCH/);
 assert.doesNotMatch(await(await visit('admin','/commissions')).text(),/WEB-OWNER/);
 assert.match(await(await visit('owner','/owners')).text(),/WEB-OWNER/);
 assert.equal((await visit('partner','/clients?client=unavailable-example')).status,404);
 assert.equal((await visit('admin','/clients?client=alder')).status,200);
 await skepticChecks(t,{visit,fields,save});
 }finally{await stop();await rm(dir,{recursive:true,force:true})}
});
