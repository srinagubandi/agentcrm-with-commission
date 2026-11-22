import test from 'node:test';
import assert from 'node:assert/strict';
import {spawn} from 'node:child_process';
import {mkdtemp,copyFile,writeFile,readFile,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {randomBytes,scryptSync} from 'node:crypto';
import {once} from 'node:events';
import net from 'node:net';
test('six authenticated roles, workflow writes, privacy, replay protection and restart',async()=>{
 const dir=await mkdtemp(join(process.cwd(),'crm-test-'));const files=['server.js','model.js','views.js','style.css','package.json'];
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
 const privateHtml=await(await visit('partner','/commissions')).text();assert.ok(!privateHtml.includes('Jules Lane'));assert.ok(!(await(await visit('owner','/owners')).text()).includes('Harbor House'));
 const token=await fields('partner','/sales');assert.equal((await save('partner',{...token,action:'settings',day:'4'})).status,403);assert.equal((await save('partner',{...token,csrf:'wrong',action:'refer'})).status,403);
 const referral={...token,action:'refer',name:'Synthetic Test',partner:'partner2',contact:'test@example.invalid'};assert.equal((await save('partner',referral)).status,303);assert.equal((await save('partner',referral)).status,409);
 assert.ok(!(await(await visit('partner2','/sales')).text()).includes('Synthetic Test'));
 assert.equal((await save('partner',{...await fields('partner','/commissions'),action:'preference',preference:'Demo provider reference'})).status,303);
 assert.equal((await save('admin',{...await fields('admin','/people'),action:'approvePreference',person:'partner'})).status,303);
 assert.equal((await save('admin',{...await fields('admin','/settings'),action:'settings',day:'17'})).status,303);
 await stop();await start();assert.match(await(await visit('admin','/settings')).text(),/<strong>17<\/strong>/);assert.match(await(await visit('partner','/commissions')).text(),/Approved: Demo provider reference/);
 }finally{await stop();await rm(dir,{recursive:true,force:true})}
});


