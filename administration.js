import {randomUUID, randomBytes, scryptSync} from 'node:crypto';
import {check} from './model.js';

export function prepareAccounts(db) {
  db.exec('CREATE TABLE IF NOT EXISTS credentials (person TEXT PRIMARY KEY, email TEXT UNIQUE, salt TEXT, hash TEXT)');
}

export function addPerson(state, db, fields, demoAccounts) {
  const email=String(fields.email||'').trim().toLowerCase();
  const name=String(fields.displayName||'').trim();
  const roles=['partner','owner','admin','super'].filter(role=>fields['role_'+role]==='yes');
  check(name.length>0&&name.length<=150,'Enter a name of up to 150 characters');
  check(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)&&email.length<=254,'Enter a valid email');
  check(roles.length>0,'Select a role');
  check(!state.people.some(p=>p.email.toLowerCase()===email)&&!demoAccounts.some(p=>p.email===email),'Email is already assigned');
  check(typeof fields.password==='string'&&fields.password.length>=14&&fields.password.length<=256,'Use a password of 14 to 256 characters');
  const id=randomUUID(),salt=randomBytes(16).toString('hex');
  const hash=scryptSync(fields.password,salt,64).toString('hex');
  db.prepare('INSERT INTO credentials(person,email,salt,hash) VALUES(?,?,?,?)').run(id,email,salt,hash);
  state.people.push({id,email,name,roles});
}
