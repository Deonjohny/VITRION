import {initAnnotations} from './annotation-ui.js?v=9';
import {presentationCase} from './case-presets.js?v=1';
const $=q=>document.querySelector(q);
const reducedMotion=matchMedia('(prefers-reduced-motion: reduce)').matches;
const entry=$('#entry');
let stopSkullIntro=null,entryClosed=false;
const dismissEntry=()=>{if(entryClosed)return;entryClosed=true;entry.classList.add('done');setTimeout(()=>{stopSkullIntro?.();entry.remove()},900)};
$('#skip-entry').addEventListener('click',dismissEntry);
window.addEventListener('keydown',event=>{if(event.key==='Escape')dismissEntry()});
if(reducedMotion||document.body.classList.contains('test-workspace'))dismissEntry();
else setTimeout(()=>{if(!entry.classList.contains('skull-playing'))dismissEntry()},15000);
async function startSkullIntro(){if(entryClosed)return;try{const {playSkullIntro}=await import('./skull-intro.js?v=1');if(!entryClosed)stopSkullIntro=playSkullIntro(model,entry,dismissEntry)}catch(error){console.warn("Skull intro unavailable",error);dismissEntry()}}
const regions=[['skull','Skull & face',['skull','ossicles','hyoid']],['spine','Vertebral column',['vertebral_column']],['thorax','Rib cage',['thoracic_cage']],['shoulder','Shoulder girdle',['pectoral_girdle']],['arm','Arms & hands',['upper_limb','hand_wrist']],['pelvis','Pelvis & sacrum',['pelvic_girdle']],['thigh','Thighs & knees',['lower_limb']],['foot','Lower legs & feet',['foot_ankle']]];
let bones=[],model=null,selected=null,activeRegion='',markModelReady;
const modelReady=new Promise(resolve=>{markModelReady=resolve});
const annotations=initAnnotations({getBones:()=>bones});
const regionBones=key=>{if(key==='pelvis')return bones.filter(b=>b.count_group==='pelvic_girdle'||b.bone_id==='sacrum');if(key==='thigh')return bones.filter(b=>['femur','patella'].some(name=>b.bone_id.endsWith(name)));if(key==='foot')return bones.filter(b=>b.count_group==='foot_ankle'||['tibia','fibula'].some(name=>b.bone_id.endsWith(name)));const r=regions.find(r=>r[0]===key);return r?bones.filter(b=>r[2].includes(b.count_group)):bones};
function chooseBone(id){selected=bones.find(b=>b.bone_id===id)||null;model?.select(selected?[id]:[]);if(selected){if(!model?.focus(id))model?.resetCamera();if(innerWidth<=950&&model?.mapped.has(id)&&!stage.classList.contains('full-view'))$('#explorer-stage').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})}renderList();renderInfo();renderStageReview()}
function renderReviewOverview(){const pending=bones.filter(b=>b.validation_status==='anatomy_review_pending').length;$('#review-overview').innerHTML=`<strong>Anatomy review:</strong> ${pending} of ${bones.length} inventory records await expert review. ${model?.mapped.size||0} bones have candidate individual 3D previews; their mesh correspondence is also unreviewed. ${model?.manifest?model.manifest.missing_bone_ids.length+' inventory bones are absent from this asset. ':''}<a href="/anatomy-sources.html">View sources, asset limitations, and missing bones ↗</a>`}
function renderStageReview(){const card=$('#stage-review');card.replaceChildren();card.hidden=!selected;if(!selected)return;const title=document.createElement('strong'),status=document.createElement('span');title.textContent=`${selected.side==='midline'?'':selected.side+' '}${selected.name}`;status.textContent=`${selected.validation_status.replaceAll('_',' ')} · ${model?.mapped.has(selected.bone_id)?'candidate 3D mesh match':'individual 3D mesh unavailable'}`;card.append(title,status)}
function renderInfo(){const panel=$('#bone-info');panel.replaceChildren();if(!selected){panel.innerHTML='<p class="eyebrow">SELECT A STRUCTURE</p><h3>Bone information</h3><p>Choose a bone from the list or select a bone in the 3D preview. The camera will move in when that bone has an individual mesh.</p>';return}const b=selected,hasPreview=Boolean(model?.mapped.has(b.bone_id));const title=document.createElement('h3');title.textContent=b.name;const eyebrow=document.createElement('p');eyebrow.className='eyebrow';eyebrow.textContent=b.bone_id;const grid=document.createElement('dl');grid.className='info-grid';for(const [label,value] of [['Region',b.count_group.replaceAll('_',' ')],['Side',b.side],['Imaging tier',b.imaging_tier.replaceAll('_',' ')],['3D view',hasPreview?'Preview available · awaiting anatomy review':'Individual 3D selection unavailable'],['Landmarks',b.landmarks.join(', ')]]){const dt=document.createElement('dt'),dd=document.createElement('dd');dt.textContent=label;dd.textContent=value;grid.append(dt,dd)}const review=document.createElement('section');review.className='review-detail';review.setAttribute('aria-label','Anatomy review status');const reviewTitle=document.createElement('h4'),reviewState=document.createElement('p'),meshState=document.createElement('p');reviewTitle.textContent='Anatomy review';reviewState.className='review-state';reviewState.textContent=b.validation_status.replaceAll('_',' ');const sourceEntry=model?.manifest?.bones.find(e=>e.bone_id===b.bone_id);meshState.textContent=hasPreview?'BodyParts3D source IDs: '+sourceEntry.sources.map(s=>s.fma+' ('+s.name+')').join(', ')+'. Candidate correspondence awaits expert review.':'Missing from this asset. No replacement geometry has been generated.';review.append(reviewTitle,reviewState,meshState);panel.append(eyebrow,title,grid,review);if(hasPreview){const action=document.createElement('button');action.className='secondary-button';action.textContent='Refocus 3D preview';action.addEventListener('click',()=>{model?.focus(b.bone_id);$('#explorer-stage').scrollIntoView({behavior:reducedMotion?'auto':'smooth',block:'start'})});panel.append(action)}}
function renderList(){const search=$('#bone-search').value.toLowerCase().trim(),list=$('#bone-list');list.replaceChildren();const filtered=regionBones(activeRegion).filter(b=>(b.name+' '+b.bone_id+' '+b.group).toLowerCase().includes(search));$('#selection-count').textContent=`${filtered.length} of ${bones.length} reference bones · ${model?.mapped.size||0} have an individual 3D preview`;for(const b of filtered){const row=document.createElement('button');row.type='button';row.className='bone-row'+(selected?.bone_id===b.bone_id?' active':'');row.setAttribute('role','listitem');row.setAttribute('aria-label',`${b.name}, ${b.side}, ${b.imaging_tier.replaceAll('_',' ')}`);const left=document.createElement('span');left.textContent=`${b.side==='midline'?'':b.side+' '}${b.name}`;const right=document.createElement('small');right.textContent=model?.mapped.has(b.bone_id)?'3D PREVIEW':'INFO ONLY';row.append(left,right);row.addEventListener('click',()=>chooseBone(b.bone_id));list.append(row)}}
function setRegion(key){activeRegion=key;selected=null;$('#region-filter').value=key;for(const button of document.querySelectorAll('#region-nav button'))button.classList.toggle('active',button.dataset.region===key);model?.resetCamera();model?.select(key?regionBones(key).map(b=>b.bone_id):[]);renderList();renderInfo();renderStageReview()}
for(const [key,label] of regions){const button=document.createElement('button');button.textContent=label;button.dataset.region=key;button.addEventListener('click',()=>setRegion(key));$('#region-nav').append(button);const option=document.createElement('option');option.value=key;option.textContent=label;$('#region-filter').append(option)}$('#region-filter').addEventListener('change',e=>setRegion(e.target.value));$('#bone-search').addEventListener('input',renderList);
async function loadAnatomy(){try{const response=await fetch('/api/anatomy');if(!response.ok)throw Error(`Anatomy API ${response.status}`);bones=(await response.json()).bones;renderList();renderReviewOverview();await loadModel()}catch(error){$('#model-status').textContent=`Anatomy inventory unavailable: ${error.message}`}}
async function loadModel(){try{const {SkeletonModel}=await import('./skeleton.js?v=10');model=new SkeletonModel($('#model-surface'),bones,chooseBone,id=>{$('#hover-label').textContent=id?bones.find(b=>b.bone_id===id)?.name||'':''});const result=await model.load();$('#model-fallback').hidden=true;$('#model-surface').classList.add('model-ready');$('#motion-status').textContent=result.hasRig&&result.animations?'Animation review pending':'Static model · no validated walking rig';renderList();renderInfo();renderReviewOverview();renderStageReview();startSkullIntro()}catch(error){$('#model-status').textContent='Licensed 3D asset unavailable. Static reference view shown; no walking animation or mesh selection.';console.warn('3D asset unavailable',error)}finally{markModelReady()}}
const stage=$('#hero-stage'),heroHome=stage.parentElement,explorerHome=$('#explorer-stage');let inExplorer=false;function placeStage(){if(stage.classList.contains('full-view'))return;const now=document.body.classList.contains('compact-workspace')||window.scrollY>$('.hero').offsetHeight-180;if(now===inExplorer)return;inExplorer=now;(now?explorerHome:heroHome).append(stage);model?.resize()}function closeFullView(){stage.classList.remove('full-view');document.body.classList.remove('full-view-open');$('#full-view').setAttribute('aria-pressed','false');model?.resize()}window.addEventListener('scroll',placeStage,{passive:true});window.addEventListener('resize',placeStage);for(const button of document.querySelectorAll('[data-view]'))button.addEventListener('click',()=>model?.setView(button.dataset.view));$('#reset-view').addEventListener('click',()=>{model?.reset();selected=null;setRegion('');renderInfo()});$('#full-view').addEventListener('click',()=>{stage.classList.add('full-view');document.body.classList.add('full-view-open');$('#full-view').setAttribute('aria-pressed','true');model?.resize()});$('#fullview-close').addEventListener('click',closeFullView);window.addEventListener('keydown',event=>{if(event.key==='Escape'&&stage.classList.contains('full-view'))closeFullView()});
placeStage();
let scale=1,tx=0,ty=0,drag=false,px=0,py=0;const layer=$('#image-layer');function transform(){layer.style.transform=`translate(${tx}px,${ty}px) scale(${scale})`}$('#zoom-in').onclick=()=>{scale=Math.min(5,scale*1.25);transform()};$('#zoom-out').onclick=()=>{scale=Math.max(.5,scale/1.25);transform()};$('#zoom-reset').onclick=()=>{scale=1;tx=0;ty=0;transform()};$('#image-viewport').addEventListener('pointerdown',e=>{drag=true;px=e.clientX;py=e.clientY;e.currentTarget.setPointerCapture(e.pointerId)});$('#image-viewport').addEventListener('pointermove',e=>{if(!drag)return;tx+=e.clientX-px;ty+=e.clientY-py;px=e.clientX;py=e.clientY;transform()});$('#image-viewport').addEventListener('pointerup',()=>drag=false);
$('#upload').addEventListener('submit',async event=>{
  event.preventDefault();
  const form=event.currentTarget,button=form.querySelector('button[type="submit"]');
  const file=form.querySelector('input[name="file"]').files?.[0];
  if(!file){$('#status').textContent='Choose a PNG, JPEG, or DICOM study first.';return}
  if(file.size>25*1024*1024){$('#status').textContent='File exceeds the 25 MiB upload limit.';return}
  annotations.reset();button.disabled=true;button.textContent='Processing…';
  $('#presentation-output').hidden=true;document.body.classList.remove('presentation-result');
  $('#status').textContent='Uploading and validating study…';
  $('#findings').replaceChildren();$('#overlays').replaceChildren();$('#bone-summary').textContent='';
  try{
    const response=await fetch('/api/analyze',{method:'POST',body:new FormData(form),signal:AbortSignal.timeout(60000)});
    if(!response.headers.get('content-type')?.includes('application/json'))throw Error(`The local processing API returned an invalid response (HTTP ${response.status}). Restart it with python tools/preview.py.`);
    const data=await response.json();
    if(!response.ok)throw Error(typeof data.detail==='string'?data.detail:`Study validation failed (HTTP ${response.status}).`);
    if(data.image.preview_data_url){$('#xray').src=data.image.preview_data_url;$('#empty-image').hidden=true}
    else{$('#xray').removeAttribute('src');$('#empty-image').hidden=false;$('#empty-image').textContent='DICOM validated. Pixel preview requires the de-identified imaging pipeline.'}
    $('#status').textContent=`${data.image.width} × ${data.image.height} pixels · ${data.image.format}. ${data.reason||`${data.findings.length} findings returned.`} ${data.notice}`;
    const count={};for(const b of data.bones||[])count[b.assessment]=(count[b.assessment]||0)+1;
    $('#bone-summary').textContent=Object.entries(count).map(([k,v])=>`${k.replaceAll('_',' ')}: ${v}`).join(' · ');
    annotations.setStudy({...data,region:new FormData(form).get('region')});
    document.dispatchEvent(new CustomEvent('vitrion:study-ready',{detail:{status:data.status}}));
    if(currentPreset)await showPresentation(currentPreset,file,data);
  }catch(error){$('#status').textContent=error.name==='TimeoutError'?'Study processing timed out. Check the local server and try again.':error instanceof TypeError?'Cannot reach the local processing server. Start python tools/preview.py, then retry. Your study has not been assessed.':error.message}
  finally{button.disabled=false;button.textContent='Process study'}
});
loadAnatomy();
// Local pixel preview stays in the browser even when the analysis API is offline.
let localPreviewUrl=null;
let currentPreset=null,presentationPreview=null;
$('#upload input[name="file"]').addEventListener('change',event=>{
  currentPreset=presentationCase(event.target.files?.[0]?.name);
  $('#presentation-output').hidden=true;document.body.classList.remove('presentation-result');
  annotations.reset();$('#findings').replaceChildren();$('#bone-summary').textContent='';
  if(localPreviewUrl)URL.revokeObjectURL(localPreviewUrl);
  localPreviewUrl=null;
  const file=event.target.files?.[0];
  if(!file)return;
  if(file.type==='image/png'||file.type==='image/jpeg'){
    localPreviewUrl=URL.createObjectURL(file);
    $('#xray').onerror=()=>{$('#xray').removeAttribute('src');$('#empty-image').hidden=false;$('#empty-image').textContent='Invalid image preview';$('#status').textContent='Invalid image file.'};
    $('#xray').src=localPreviewUrl;
    $('#empty-image').hidden=true;
    $('#status').textContent='Image preview ready. Analysis has not run.';
  }else{
    $('#xray').removeAttribute('src');
    $('#empty-image').hidden=false;
    $('#empty-image').textContent='DICOM preview requires the de-identified imaging pipeline.';
    $('#status').textContent='DICOM selected. Analysis has not run.';
  }
  if(currentPreset){
    const form=$('#upload');
    form.elements.region.value=currentPreset.region;
    form.elements.view.value=currentPreset.view;
    form.elements.side.value=currentPreset.side;
    $('#status').textContent='Supplied teaching case recognized. Processing and opening its illustrative 3D presentation…';
    setTimeout(()=>form.requestSubmit(),0);
  }
});

async function showPresentation(preset,file,data){
  const output=$('#presentation-output');
  $('#presentation-title').textContent=preset.title;
  $('#presentation-description').textContent=preset.description;
  $('#presentation-image-caption').textContent=`Uploaded study · ${file.name} · ${data.image.width} × ${data.image.height} pixels`;
  $('#presentation-xray').src=localPreviewUrl||data.image.preview_data_url||'';
  output.hidden=false;document.body.classList.add('presentation-result');
  $('#presentation-status').textContent='Preparing the corresponding atlas bone…';
  await modelReady;
  const source=model?.mapped.get(preset.boneId);
  if(!source){$('#presentation-status').textContent=`No candidate atlas mesh is available for ${preset.boneId}. The X-ray is shown without a 3D split.`;return}
  try{
    const {BrokenBonePreview}=await import('./broken-bone.js?v=5');
    if(!presentationPreview)presentationPreview=new BrokenBonePreview($('#presentation-model'));
    presentationPreview.setBone(source,{bones,boneId:preset.boneId,mapped:model.mapped});
    const cut=presentationPreview.update(preset.split);
    $('#presentation-status').textContent=`API status: ${data.status.replaceAll('_',' ')}. No fracture detector ran. The fracture display is a preset schematic applied to a candidate atlas mesh${cut?.uncapped?' and has uncapped cut edges':''}.`;
  }catch(error){$('#presentation-status').textContent=`The X-ray loaded, but the atlas illustration could not be prepared: ${error.message}`}
}
$('#presentation-upload-another').addEventListener('click',()=>{document.body.classList.remove('presentation-result');$('#presentation-output').hidden=true;$('#upload input[name="file"]').value='';currentPreset=null;$('#upload input[name="file"]').focus()});
