import * as THREE from 'three';
import {copyAlignedBone,copyMeshInWorld,splitSchematicGeometry} from './schematic-cut.js';
import {boneContext} from './bone-context.js';

export class BrokenBonePreview{
  constructor(surface){this.surface=surface;this.scene=new THREE.Scene();this.camera=new THREE.PerspectiveCamera(35,1,.0001,100);this.renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});this.renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));this.renderer.outputColorSpace=THREE.SRGBColorSpace;surface.append(this.renderer.domElement);this.scene.add(new THREE.HemisphereLight(0xe1f1ff,0x32302a,2));const key=new THREE.DirectionalLight(0xfff0df,3);key.position.set(2,4,3);this.scene.add(key);const rim=new THREE.DirectionalLight(0x69c8dc,2);rim.position.set(-3,1,-2);this.scene.add(rim);this.yaw=.15;this.pitch=.1;this.zoom=1;this.target=new THREE.Vector3();this.mode="local";this.transition=null;this.contextMaterial=new THREE.MeshStandardMaterial({color:0x849a9e,roughness:.9});this.bind();new ResizeObserver(()=>this.resize()).observe(surface)}
  setBone(node,{bones,boneId,mapped}){
    this.stopTransition();this.clearPieces();
    if(this.atlas){this.atlas.traverse(obj=>{if(obj.isMesh)obj.geometry.dispose()});this.scene.remove(this.atlas)}
    this.source?.dispose();this.source=copyAlignedBone(node);this.zoom=1;this.yaw=.15;this.pitch=.1;this.mode='local';
    this.context=boneContext(bones,bones.find(b=>b.bone_id===boneId));this.localIds=new Set(this.context.ids);
    this.atlas=new THREE.Group();const matrix=new THREE.Matrix4().fromArray(this.source.userData.worldToDisplay);this.atlasUp=new THREE.Vector3(0,1,0).transformDirection(matrix);
    for(const [id,source] of mapped){if(id===boneId)continue;const group=new THREE.Group();group.userData.boneId=id;
      source.traverse(obj=>{if(obj.isMesh){const geometry=copyMeshInWorld(obj).applyMatrix4(matrix);group.add(new THREE.Mesh(geometry,this.contextMaterial))}});
      this.atlas.add(group);
    }
    this.scene.add(this.atlas);
  }
  clearPieces(){if(!this.fragments)return;this.fragments.traverse(obj=>{if(obj.isMesh){obj.geometry.dispose();obj.material.dispose()}});this.scene.remove(this.fragments);this.fragments=null}
  update({level,gap,angle,tilt}){
    if(!this.source)return;this.stopTransition();
    const box=this.source.boundingBox,length=box.max.y-box.min.y,cut=box.min.y+length*level,normal=new THREE.Vector3(Math.sin(tilt*Math.PI/180),Math.cos(tilt*Math.PI/180),0);
    const geometries=splitSchematicGeometry(this.source,new THREE.Plane(normal,-cut*normal.y),{allowOpenSurface:true});
    this.clearPieces();this.fragments=new THREE.Group();
    for(let i=0;i<2;i++){const pivot=new THREE.Group(),mesh=new THREE.Mesh(geometries[i],new THREE.MeshStandardMaterial({vertexColors:true,roughness:.8,metalness:0,side:THREE.DoubleSide}));mesh.position.y=-cut;pivot.add(mesh);pivot.position.y=cut+(i===0?1:-1)*gap*length/2;if(i===0)pivot.rotation.z=angle*Math.PI/180;this.fragments.add(pivot)}
    this.scene.add(this.fragments);
    const local=new THREE.Box3().setFromObject(this.fragments),body=local.clone();
    for(const group of this.atlas.children){const bounds=new THREE.Box3().setFromObject(group);body.union(bounds);if(this.localIds.has(group.userData.boneId)&&this.context.label.indexOf('knee')<0)local.union(bounds)}
    if(this.context.label.indexOf('knee')>=0)local.expandByScalar(length*.7);
    const frame=bounds=>({center:bounds.getCenter(new THREE.Vector3()),radius:bounds.getSize(new THREE.Vector3()).length()/2});
    this.frames={local:frame(local),body:frame(body)};
    this.applyContext();this.frameTo(this.mode==='body'?'body':'local',false);this.resize();return {uncapped:geometries.some(g=>g.userData.uncapped)};
  }
  applyContext(){for(const group of this.atlas?.children||[])group.visible=this.mode!=='local'||this.localIds.has(group.userData.boneId)}
  setScope(mode){if(!this.frames)return;this.mode=mode;this.applyContext();this.frameTo(mode==='body'?'body':'local')}
  focusFracture(){if(!this.frames)return;this.mode='focus';this.applyContext();this.frameTo('local')}
  stopTransition(){if(this.transition!==null){cancelAnimationFrame(this.transition);this.transition=null}}
  frameTo(name,animated=true){
    this.stopTransition();const frame=this.frames[name],fromCenter=this.target.clone(),fromRadius=(this.radius||frame.radius)*this.zoom;this.zoom=1;
    if(!animated||matchMedia('(prefers-reduced-motion: reduce)').matches){this.target.copy(frame.center);this.radius=frame.radius;this.render();return}
    const start=performance.now();const step=now=>{const t=Math.min(1,(now-start)/1150),ease=t*t*(3-2*t);this.target.lerpVectors(fromCenter,frame.center,ease);this.radius=fromRadius+(frame.radius-fromRadius)*ease;this.render();if(t<1)this.transition=requestAnimationFrame(step);else this.transition=null};this.transition=requestAnimationFrame(step);
  }
  resize(){const rect=this.surface.getBoundingClientRect();if(!rect.width||!rect.height)return;this.renderer.setSize(rect.width,rect.height);this.camera.aspect=rect.width/rect.height;this.camera.updateProjectionMatrix();this.render()}
  render(){if(!this.radius)return;const distance=this.radius/Math.sin(THREE.MathUtils.degToRad(this.camera.fov)/2)*1.25*this.zoom/Math.min(1,this.camera.aspect),flat=Math.cos(this.pitch)*distance;this.camera.position.set(this.target.x+Math.sin(this.yaw)*flat,this.target.y+Math.sin(this.pitch)*distance,this.target.z+Math.cos(this.yaw)*flat);this.camera.up.copy(this.atlasUp||new THREE.Vector3(0,1,0));this.camera.lookAt(this.target);this.renderer.render(this.scene,this.camera)}
  bind(){const canvas=this.renderer.domElement;canvas.style.touchAction='none';let point=null;canvas.onpointerdown=event=>{this.stopTransition();point=[event.clientX,event.clientY];canvas.setPointerCapture(event.pointerId)};canvas.onpointermove=event=>{if(!point)return;this.yaw-=(event.clientX-point[0])*.008;this.pitch=Math.max(-1.5,Math.min(1.5,this.pitch+(event.clientY-point[1])*.008));point=[event.clientX,event.clientY];this.render()};canvas.onpointerup=canvas.onpointercancel=()=>point=null;canvas.addEventListener('wheel',event=>{event.preventDefault();this.stopTransition();this.zoom=Math.max(.008,Math.min(3,this.zoom*(event.deltaY>0?1.12:.89)));if(this.mode==='body'&&this.frames){const end=Math.max(.008,this.frames.local.radius/this.frames.body.radius);const amount=THREE.MathUtils.clamp(Math.log(this.zoom)/Math.log(end),0,1);this.target.lerpVectors(this.frames.body.center,this.frames.local.center,amount)}this.render()},{passive:false})}
}
