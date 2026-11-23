import {mkdirSync,statSync} from 'node:fs';
import {resolve} from 'node:path';
import {backup,DatabaseSync} from 'node:sqlite';

export async function recoveryCopy(source,destination) {
  const sourcePath=resolve(source);
  if(!statSync(sourcePath).isFile())throw Error('Choose the source AgentCRM SQLite file');
  const directory=resolve(destination);
  mkdirSync(directory);
  const destinationPath=resolve(directory,'agentcrm.sqlite');
  const db=new DatabaseSync(sourcePath,{readOnly:true});
  try{
    await backup(db,destinationPath);
  }finally{
    db.close();
  }
  const copy=new DatabaseSync(destinationPath);
  try{
    const integrity=copy.prepare('PRAGMA integrity_check').all();
    if(integrity.length!==1||Object.values(integrity[0])[0]!=='ok')throw Error('Recovery copy failed the SQLite integrity check');
    copy.prepare('DELETE FROM sessions').run();
    const row=copy.prepare('SELECT version,data FROM records WHERE id=1').get();
    if(!row)throw Error('Recovery copy is missing the AgentCRM ledger');
    const state=JSON.parse(row.data);
    return {destination:directory,version:row.version,clients:state.clients.length,receipts:state.receipts.length,payouts:state.payouts.length};
  }finally{
    copy.close();
  }
}

if(import.meta.main){
  const [source,destination]=process.argv.slice(2);
  if(!source||!destination){
    console.error('Usage: node recovery-copy.js <source SQLite file> <new restore directory>');
    process.exitCode=1;
  }else{
    console.log(JSON.stringify(await recoveryCopy(source,destination)));
  }
}
