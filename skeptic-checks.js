import assert from 'node:assert/strict';

const people = ['admin','partner','partner2','owner','super','principal'];
const privileged = new Set(['admin','super','principal']);
const admins = new Set(['admin','principal']);
const partners = new Set(['partner','partner2']);
const owners = new Set(['owner','super','principal']);
const everyone = () => true;

const pages = [
  ['/','Overview',everyone],
  ['/sales','Sales pipeline',role=>privileged.has(role)||partners.has(role)],
  ['/clients','Clients',role=>privileged.has(role)||partners.has(role)],
  ['/earnings','Monthly earnings',role=>privileged.has(role)],
  ['/commissions','Commissions',role=>privileged.has(role)||partners.has(role)],
  ['/owners','Owner shares',role=>privileged.has(role)||owners.has(role)],
  ['/people','People',role=>privileged.has(role)],
  ['/settings','Settings',role=>privileged.has(role)],
  ['/reports','Reports',everyone]
];

// Keep expectations independent of report configuration in the application.
const reports = {
  invoices:['Client fee register','agency'],
  balances:['Outstanding client fees','agency'],
  collections:['Client payment register','agency'],
  allocations:['Payment allocations by fee type','agency'],
  refunds:['Client refunds and partner adjustments','agency'],
  earnings:['Partner earnings by client','partner'],
  calculations:['Partner commission calculations','agency'],
  'partner-payments':['Recorded partner payouts','partner'],
  'partner-month':['Partner monthly activity','partner'],
  scheduled:['Scheduled referral commissions','partner'],
  'owner-earnings':['Owner distributions by client','owner'],
  'owner-payments':['Recorded owner payouts','owner'],
  reserves:['Agency reserve reconciliation','agency'],
  losses:['Client loss carryforward','agency'],
  expenses:['Vendor expense allocations','agency'],
  followups:['Open sales follow-ups','partner'],
  stages:['Sales stage changes','agency'],
  agreements:['Client fee agreement history','agency'],
  tiers:['Performance fee tier schedule','agency'],
  'owner-terms':['Owner participation agreements','owner']
};

const formats = [
  ['/reports.csv','text/csv'],
  ['/reports.json','application/json'],
  ['/reports/print','text/html']
];

export async function skepticChecks(test,{visit,fields,save}) {
  let loops = 0;
  async function check(role,scenario,run) {
    loops++;
    await test.test(`skeptic loop ${loops}: ${role} | ${scenario}`,run);
  }
  for(const role of people) {
    for(const [route,title,canUse] of pages) {
      await check(role,`open ${title}`,async()=>{
        const response=await visit(role,route);
        assert.equal(response.status,canUse(role)?200:403);
        const body=await response.text();
        if(!canUse(role)){
          assert.equal(body,'Permission denied');
          return;
        }
        assert.ok(body.includes(`<h1>${title}</h1>`));
        assert.ok(body.includes('Skip to content'));
        if(route==='/commissions'&&!privileged.has(role)){
          assert.doesNotMatch(body,/\$[\d,.]+ x [\d.]+%/);
          assert.match(body,/commission \$/);
          assert.doesNotMatch(body,/Record external payout/);
        }
        if(route==='/owners'&&role==='owner'){
          assert.match(body,/Owner payout history/);
          assert.doesNotMatch(body,/Harbor House|Closed client periods|WEB-BATCH/);
        }
        if(role==='super'){
          assert.doesNotMatch(body,/name="action" value="(?:stage|terms|expense|payout|receipt|closeMonth|person|settings)"/);
        }
      });
    }
    for(const [id,[title,scope]] of Object.entries(reports)){
      for(const [route,type] of formats) {
        await check(role,`${route} ${title}`,async()=>{
          const canRead=privileged.has(role)||(scope==='partner'&&partners.has(role))||(scope==='owner'&&owners.has(role));
          const response=await visit(role,`${route}?report=${id}`);
          assert.equal(response.status,canRead?200:403);
          const body=await response.text();
          if(!canRead){
            assert.equal(body,'Report unavailable');
            return;
          }
          assert.ok(response.headers.get('content-type').startsWith(type));
          if(type==='application/json'){
            const data=JSON.parse(body);
            assert.equal(data.report,id);
            assert.equal(data.units.length,data.columns.length);
            assert.ok(data.rows.every(row=>row.length===data.columns.length));
          }else if(type==='text/html')assert.ok(body.includes(title));
          else assert.match(body,/^"[^"]+","[^"]+"/);
          if(!privileged.has(role)&&scope==='partner'){
            const other=role==='partner'?'Jules Lane':'Morgan Reed';
            assert.ok(!body.includes(other));
          }
          if(role==='owner')assert.doesNotMatch(body,/Harbor House|Sarah Jenkins/);
        });
      }
    }
    const ownReport=privileged.has(role)?'invoices':partners.has(role)?'earnings':'owner-earnings';
    const signedFields=()=>fields(role,'/reports');
    const recipient=partners.has(role)||owners.has(role);
    const attemptedWrites=[
      ['save a role-appropriate report view',{action:'saveView',title:'Skeptic role view',selection:`report=${ownReport}`},303],
      ['preview client period close',{action:'closeMonth',client:'harbor',month:'2026-10',return:'/owners',preview:'yes'},admins.has(role)?200:403],
      ['request a masked payout preference',{action:'preference',preference:'ACH ending 5678'},recipient?303:admins.has(role)?400:403],
      ['submit a referral',{action:'refer',partner:'partner',name:'Role check '+role,contact:'workflow@example.invalid'},partners.has(role)||admins.has(role)?303:403],
      ['record a second payout with the same reference',{action:'payout',person:'partner',kind:'partner',date:'2026-11-21',method:'ACH',amount:'1.00',ref:'SAMPLE-001'},admins.has(role)?400:403],
      ['request a preference with an unmasked identifier',{action:'preference',preference:'ACH 12345'},recipient||admins.has(role)?400:403]
    ];
    for(const [scenario,payload,status] of attemptedWrites){
      await check(role,scenario,async()=>{
        const response=await save(role,{...await signedFields(),...payload});
        assert.equal(response.status,status);
        const message=await response.text();
        if(payload.preview&&status===200)assert.match(message,/Close through/);
        if(payload.action==='payout'&&status===400)assert.match(message,/already have a payout with that reference/);
        if(payload.preference==='ACH 12345'&&recipient)assert.match(message,/Enter a masked identifier/);
      });
    }
  }
  assert.equal(loops,450);
}
