// Reuse existing study controls and event contracts in a dedicated workspace.
const testWorkspace=new URLSearchParams(location.search).get('workspace')==='test';
document.body.classList.add('compact-workspace',testWorkspace?'test-workspace':'atlas-workspace');
if(testWorkspace){
  document.title='VITRION · Test case workspace';
  document.querySelector('#entry').classList.add('done');
  const intro=document.querySelector('#evaluate .section-intro');
  intro.innerHTML='<div><p class="eyebrow">IMAGING LAB / LOCAL SESSION</p><h2 id="evaluation-title">Test case<span class="title-dot">.</span></h2></div><p>Research use only · Operator illustrations are not reconstructions.</p>';
  const grid=document.querySelector('.evaluation-grid');
  const panels=[...grid.children];
  const sidebar=document.createElement('aside');sidebar.className='case-sidebar';
  const tabs=document.createElement('div');tabs.className='case-tabs';tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Case workflow');
  sidebar.append(tabs);
  const groups=[['Study',[panels[0],panels[3]]],['Annotate',[panels[4]]],['Findings',[panels[5]]]];
  const buttons=[],pages=[];
  function activate(i){buttons.forEach((b,j)=>{b.setAttribute('aria-selected',String(i===j));b.tabIndex=i===j?0:-1;pages[j].hidden=i!==j})}
  groups.forEach(([name,items],i)=>{const button=document.createElement('button');button.type='button';button.textContent=name;button.id='case-tab-'+i;button.setAttribute('role','tab');button.setAttribute('aria-controls','case-page-'+i);const page=document.createElement('section');page.id='case-page-'+i;page.className='case-page';page.setAttribute('role','tabpanel');page.setAttribute('aria-labelledby',button.id);items.forEach(p=>page.append(p));button.onclick=()=>activate(i);button.onkeydown=e=>{if(['ArrowRight','ArrowLeft','Home','End'].includes(e.key)){e.preventDefault();const next=e.key==='Home'?0:e.key==='End'?2:(i+(e.key==='ArrowRight'?1:2))%3;activate(next);buttons[next].focus()}};buttons.push(button);pages.push(page);tabs.append(button);sidebar.append(page)});
  const guidance=document.createElement('div');guidance.className='workflow-guidance';guidance.setAttribute('role','status');guidance.textContent='1. Upload and process a study. 2. Annotate a bone. 3. Open its illustrative preview.';
  panels[2].prepend(guidance);
  const next=document.createElement('button');next.type='button';next.className='submit-button';next.textContent='Continue to bone annotation →';next.hidden=true;next.onclick=()=>activate(1);panels[3].append(next);
  document.addEventListener('vitrion:study-ready',event=>{
    next.hidden=false;
    guidance.textContent=event.detail.status==='model_predicted'?'Select a returned finding to open its linked bone.':'Image loaded. Automatic fracture detection is unavailable. Select a bone and sub-region in Annotate, then click Add unreviewed finding to enable the 3D preview.';
    activate(1);
  });
  panels[0].querySelector('input[name=file]').addEventListener('change',()=>{next.hidden=true;guidance.textContent='New image selected. Process this study before adding annotations.';activate(0)});
  panels[0].querySelectorAll('select').forEach(select=>select.addEventListener('change',()=>{next.hidden=true;guidance.textContent='Study metadata changed. Process the study again to use these settings.'}));
  panels[1].classList.add('image-panel');panels[2].classList.add('model-panel');grid.replaceChildren(sidebar,panels[1],panels[2]);activate(0);
  document.querySelector('.topbar nav').innerHTML='<a href="/">Anatomical atlas</a><span class="nav-current">TEST CASE WORKSPACE</span>';
}else{
  const intro=document.querySelector('#explore .section-intro');intro.innerHTML='<div><p class="eyebrow">REFERENCE ATLAS / 206 BONES</p><h2 id="explore-title">The human frame<span class="title-dot">.</span></h2></div><p>Select a bone to focus. Drag to orbit · scroll to zoom.</p>';
}
