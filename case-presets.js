// Presentation-only mappings for the nine supplied synthetic teaching cases.
// These presets select an atlas bone by filename; they do not detect fractures.
const cases=[
  {match:'annotated ap pelvis x-ray showing left fracture.png',title:'Left pelvic ring · anterior column and pubic rami',boneId:'left_hip_bone',region:'hip_pelvis',view:'AP',side:'left',description:'Illustrative split of the left hip-bone atlas mesh.',split:{level:.54,gap:.07,angle:14.5,tilt:12}},
  {match:'annotated chest x-ray rib fracture study.png',title:'Right sixth rib · lateral arc',boneId:'right_rib_6',region:'thorax',view:'PA',side:'right',description:'Illustrative split of the right sixth-rib atlas mesh.',split:{level:.58,gap:.06,angle:-7,tilt:8}},
  {match:'annotated hand x-ray with fifth metacarpal fracture-2.png',title:'Right fifth metacarpal · shaft',boneId:'right_metacarpal_5',region:'wrist_hand',view:'AP',side:'right',description:'Illustrative split of the right fifth-metacarpal atlas mesh.',split:{level:.52,gap:.08,angle:16,tilt:12}},
  {match:'annotated t3 thoracic fracture x-ray.png',title:'T3 · posterior elements',boneId:'thoracic_vertebra_3',region:'spine',view:'AP',side:'midline',description:'Illustrative split of the T3 atlas vertebra.',split:{level:.53,gap:.06,angle:-11,tilt:7}},
  {match:'diagnostic skull x-ray fracture montage.png',title:'Right frontoparietal calvarium',boneId:'right_parietal',region:'skull',view:'AP',side:'right',description:'Illustrative split of the right parietal atlas mesh.',split:{level:.55,gap:.08,angle:-14,tilt:10}},
  {match:'dual-view right clavicle fracture x-ray.png',title:'Right clavicle · midshaft',boneId:'right_clavicle',region:'shoulder',view:'AP',side:'right',description:'Illustrative split of the right clavicle atlas mesh.',split:{level:.60,gap:.07,angle:18,tilt:12}},
  {match:'navicular fracture x-ray montage.png',title:'Left navicular · body',boneId:'left_navicular',region:'ankle_foot',view:'AP',side:'left',description:'Illustrative split of the left navicular atlas mesh.',split:{level:.52,gap:.07,angle:8,tilt:6}},
  {match:'right forearm fracture x-ray study.png',title:'Right radius · shaft',boneId:'right_radius',region:'forearm_elbow',view:'AP',side:'right',description:'Illustrative split of the right radius atlas mesh.',split:{level:.48,gap:.08,angle:12,tilt:10}},
  {match:'right lower leg x-ray fracture.png',title:'Right tibia · distal shaft',boneId:'right_tibia',region:'knee_leg',view:'AP',side:'right',description:'Illustrative split of the right tibia atlas mesh; the fibula remains intact as context.',split:{level:.40,gap:.08,angle:7,tilt:6}}
];

export function presentationCase(filename){
  const name=String(filename||'').trim().toLocaleLowerCase();
  return cases.find(item=>item.match===name)||null;
}
