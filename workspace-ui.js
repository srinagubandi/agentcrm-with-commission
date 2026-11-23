const search = document.querySelector('#workspace-search');
if(search){
  const field=search.elements.page;
  const choices=[...document.querySelectorAll('nav[aria-label="Workspace"] a')];
  search.addEventListener('submit',event=>{
    event.preventDefault();
    const query=field.value.trim().toLowerCase();
    const choice=choices.find(a=>a.getAttribute('aria-label').toLowerCase()===query)||
      choices.find(a=>query&&a.getAttribute('aria-label').toLowerCase().includes(query));
    if(choice) location.assign(choice.href);
    else {field.setCustomValidity('Choose a workspace page from the list.');field.reportValidity()}
  });
  field.addEventListener('input',()=>field.setCustomValidity(''));
  document.addEventListener('keydown',event=>{
    if((event.ctrlKey||event.metaKey)&&event.key.toLowerCase()==='k'){event.preventDefault();field.focus();field.select()}
  });
}
const main=document.querySelector('main[data-screen]');
if(main){
  const sections=[...main.children].filter(el=>el.matches('section,details')&&el.querySelector(':scope > h2,:scope > summary'));
  if(sections.length>=3 && !['sales','overview','earnings','reports','settings'].includes(main.dataset.screen)){
    const picker=document.createElement('select');
    const label=document.createElement('label');
    label.className='section-picker';
    label.append('Go to section',picker);
    picker.append(new Option('Select a section',''));
    sections.forEach((el,i)=>{
      el.id=el.id||'workspace-section-'+i;
      picker.append(new Option(el.querySelector(':scope > h2,:scope > summary').textContent,el.id));
    });
    picker.addEventListener('change',()=>{
      const target=document.getElementById(picker.value);
      if(!target)return;
      if(target.tagName==='DETAILS')target.open=true;
      target.tabIndex=-1;target.focus();target.scrollIntoView({block:'start'});
    });
    main.querySelector('h1').after(label);
  }
}
/* Keep ledger tables wide and group related edits in the inspector at desktop sizes. */
if(main){
  const layouts={
    clients:{inspector:['Current fee agreement','Referral attribution','Client activity'],actions:['terms','note','client']},
    commissions:{inspector:['Available to pay today','Payout review queue'],actions:['approveReceipt','payout','batchPayout','preference','reversePayout']},
    owners:{inspector:['Owner payout reconciliation','Closed client periods'],actions:['expense','closeMonth','preference','reversePayout']},
    people:{inspector:[],actions:['person','super','approvePreference']},


  };
  const rule=layouts[main.dataset.screen];
  if(rule){
    const panels=[...main.children].filter(el=>el.matches('section,details'));
    const side=panels.filter(el=>rule.inspector.includes(el.querySelector(':scope > h2')?.textContent)||rule.actions.includes(el.querySelector('input[name="action"]')?.value));
    if(side.length && panels.length>side.length){
      const layout=document.createElement('div'), ledger=document.createElement('div'), inspector=document.createElement('div');
      layout.className='workspace-columns';inspector.className='inspector';
      panels[0].before(layout);layout.append(ledger,inspector);
      for(const panel of panels)(side.includes(panel)?inspector:ledger).append(panel);
    }
  }
}

if(main){
  const actions={sales:['refer','New Referral'],owners:['expense','Split vendor invoice'],clients:['terms','Edit fee agreement'],people:['person','Add user']};
  const action=actions[main.dataset.screen];
  const field=action&&main.querySelector('input[name="action"][value="'+action[0]+'"]');
  const disclosure=field?.closest('details');
  if(disclosure){
    const launch=document.createElement('button'),dialog=document.createElement('dialog'),close=document.createElement('button'),title=document.createElement('h2');
    const form=field.form;
    launch.type=close.type='button';launch.textContent=title.textContent=action[1];close.textContent='Close';
    launch.className='page-action';title.id='action-dialog-title';dialog.setAttribute('aria-labelledby',title.id);
    dialog.append(title,close);main.append(dialog);main.querySelector('h1').after(launch);
    launch.addEventListener('click',()=>{dialog.append(form);dialog.showModal()});
    close.addEventListener('click',()=>dialog.close());
    dialog.addEventListener('close',()=>{disclosure.append(form);launch.focus()});
  }
}

const passwordToggle=document.querySelector('#show-password');
if(passwordToggle){
  passwordToggle.addEventListener('change',()=>{
    document.querySelector('#vault-password').type=passwordToggle.checked?'text':'password';
  });
}

function addRowEditor(form,kind){
  const tiers=kind==='tiers';
  const source=form.elements[tiers?'tiers':'lines'];
  const choices=form.querySelector('.allocation-clients');
  if(!source||(!tiers&&!choices))return;
  const group=document.createElement('fieldset'),legend=document.createElement('legend');
  const rows=document.createElement('div'),add=document.createElement('button');
  legend.textContent=tiers?'Performance fee tiers':'Client allocations';
  add.type='button';add.textContent=tiers?'Add tier':'Add client allocation';
  group.className='line-editor';group.append(legend,rows,add);
  source.closest('label').before(group);
  function sync(){
    source.value=[...rows.children].map(row=>{
      const [key,value]=row.querySelectorAll('input,select');
      const custom=tiers||form.elements.allocation.value==='custom';
      value.disabled=!custom;
      value.closest('label').hidden=!custom;
      return (tiers?(key.value||'*'):key.value)+(custom?','+value.value:'');
    }).join('\n');
  }
  function addRow(){
    const row=document.createElement('div');
    row.className='line-entry';
    const key=tiers?document.createElement('input'):choices.content.querySelector('select').cloneNode(true);
    if(tiers){key.type='number';key.min='0.01';key.step='0.01';key.placeholder='Open-ended'}
    const value=document.createElement('input');
    value.type='number';value.min='0';value.step='0.01';value.required=true;
    if(tiers){value.max='100';value.value='0'}
    const fields=[[key,tiers?'Upper sales limit ($)':'Client'],[value,tiers?'Commission rate (%)':'Allocated amount ($)']];
    for(const [control,text] of fields){const label=document.createElement('label');label.append(text,control);row.append(label)}
    const remove=document.createElement('button');remove.type='button';remove.textContent='Remove';
    remove.addEventListener('click',()=>{row.remove();sync();add.focus()});
    row.append(remove);rows.append(row);sync();return key;
  }
  if(source.value.trim()){group.remove();return}
  source.closest('label').hidden=true;
  if(!tiers){for(const p of form.querySelectorAll('p'))if(p.textContent.startsWith('For equal')||p.textContent.includes(' = '))p.hidden=true}
  addRow();
  add.addEventListener('click',()=>addRow().focus());
  group.addEventListener('input',sync);group.addEventListener('change',sync);
  form.elements.allocation?.addEventListener('change',sync);
  form.addEventListener('submit',sync);
}
for(const field of document.querySelectorAll('input[name="action"]')){
  if(field.value==='terms'||field.value==='expense')addRowEditor(field.form,field.value==='terms'?'tiers':'expense');
}
