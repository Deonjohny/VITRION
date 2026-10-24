// Context is an atlas display choice, never inferred patient anatomy.
export function boneContext(bones,selected){
  const sameSide=b=>b.side===selected.side;
  if(selected.count_group==='hand_wrist')return {label:`${selected.side} hand and wrist`,ids:bones.filter(b=>sameSide(b)&&b.count_group==='hand_wrist'&&b.bone_id!==selected.bone_id).map(b=>b.bone_id)};
  if(selected.count_group==='foot_ankle')return {label:`${selected.side} foot and ankle`,ids:bones.filter(b=>sameSide(b)&&b.count_group==='foot_ankle'&&b.bone_id!==selected.bone_id).map(b=>b.bone_id)};
  if(selected.bone_id.endsWith('_patella'))return {label:`${selected.side} knee`,ids:['femur','tibia','fibula'].map(name=>`${selected.side}_${name}`)};
  const nearby=ids=>({label:'adjacent reference bones',ids:ids.filter(id=>id!==selected.bone_id)});
  if(selected.count_group==='skull'||selected.count_group==='ossicles'||selected.count_group==='hyoid')return nearby(bones.filter(b=>['skull','ossicles','hyoid'].includes(b.count_group)).map(b=>b.bone_id));
  const vertebrae=bones.filter(b=>/^(C|T|L)\d+$/.test(b.bone_id));
  const index=vertebrae.findIndex(b=>b.bone_id===selected.bone_id);
  if(index>=0)return nearby(vertebrae.slice(Math.max(0,index-1),index+2).map(b=>b.bone_id));
  if(selected.bone_id==='coccyx')return nearby(['sacrum']);
  if(selected.bone_id.startsWith('rib_')){const ribs=bones.filter(b=>b.bone_id.startsWith('rib_')&&sameSide(b));const i=ribs.findIndex(b=>b.bone_id===selected.bone_id);return nearby(ribs.slice(Math.max(0,i-1),i+2).map(b=>b.bone_id))}
  return {label:'isolated bone',ids:[]};
}
