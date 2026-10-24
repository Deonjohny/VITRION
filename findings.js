export function eligibleAnnotationBones(bones,study){
  return bones.filter(b=>b.radiographic_regions.includes(study.region)&&b.imaging_tier!=='ct_only'&&(b.side==='midline'||study.side==='bilateral'||b.side===study.side));
}
// Operator annotations are distinct from released model predictions.
export function createResearchAnnotation(study,bone,landmark,bbox=null){
  if(!study?.study_id)throw Error('Process a study first.');
  if(!bone||!bone.radiographic_regions.includes(study.region))throw Error('Bone does not belong to the selected study region.');
  if(bone.side!=='midline'&&study.side!=='bilateral'&&bone.side!==study.side)throw Error('Select the study side and process it again before annotating.');
  if(!bone.landmarks.includes(landmark))throw Error('Choose a registered anatomical sub-region.');
  if(bone.imaging_tier==='ct_only')throw Error('This bone cannot be assessed on this X-ray.');
  if(bbox&& (bbox.length!==4||bbox.some(v=>!Number.isFinite(v)||v<0||v>1)||bbox[2]<=0||bbox[3]<=0||bbox[0]+bbox[2]>1.000001||bbox[1]+bbox[3]>1.000001))throw Error('The annotation box must lie inside the image.');
  return {finding_id:crypto.randomUUID(),study_id:study.study_id,modality:'XR',anatomy:{bone_id:bone.bone_id,side:bone.side,region:landmark,group:bone.group},finding:{type:'suspected_fracture',image_bbox:bbox,localization_method:bbox?'operator_drawn_unreviewed':null,confidence:null,pattern:null},mapping:{skeleton_mesh_id:null,coordinate_frame:'bone_local',position_3d:null,geometry_status:'not_reconstructed'},evidence_status:'research_annotation_unreviewed',model:{name:null,version:null,training_data_summary:null},review:{status:'awaiting_clinician_review'},atlas_preview:{status:'candidate_bone_highlight_only',landmark_position:null,patient_specific:false}};
}
