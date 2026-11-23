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
  if(sections.length>=3 && !['sales','overview','earnings'].includes(main.dataset.screen)){
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
    reports:{inspector:['My saved views'],actions:['saveView','removeView']},
    settings:{inspector:['Monthly payout schedule'],actions:['settings']}
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
