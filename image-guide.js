// Maps operator-drawn image guides to display parameters only, not clinical 3D geometry.
export function imageGuideSettings(points,width,height){
  if(points.length!==4||![width,height].every(v=>Number.isFinite(v)&&v>0)||points.some(p=>p.length!==2||p.some(v=>!Number.isFinite(v)||v<0||v>1)))throw Error('Four normalized image points and valid image dimensions are required.');
  const [distal,proximal,a,b]=points.map(p=>[p[0]*width,p[1]*height]);
  const axis=proximal.map((v,i)=>v-distal[i]),length=Math.hypot(...axis),line=b.map((v,i)=>v-a[i]);
  if(length<8||Math.hypot(...line)<4)throw Error('Guide points are too close. Mark the full bone axis and distinct fracture endpoints.');
  const up=axis.map(v=>v/length),right=[-up[1],up[0]],mid=a.map((v,i)=>(v+b[i])/2);
  const level=mid.reduce((sum,v,i)=>sum+(v-distal[i])*up[i],0)/length;
  let tilt=-Math.atan2(line.reduce((sum,v,i)=>sum+v*up[i],0),line.reduce((sum,v,i)=>sum+v*right[i],0))*180/Math.PI;
  while(tilt>90)tilt-=180;while(tilt< -90)tilt+=180;
  if(level<.2||level>.8||Math.abs(tilt)>65)throw Error('Guide lies beyond the current illustrative cut range (20–80%, ±65°). It has not been clamped or applied.');
  return {level,tilt,method:'operator_marked_2d_projection',points:points.map(p=>[...p]),image_dimensions:[width,height],clinical_position_3d:null,clinical_gap_mm:null,clinical_plane_angle:null};
}
