import * as THREE from 'three';
import {copyMeshInWorld} from './schematic-cut.js';

// Presentation-only copies of the licensed atlas skull, never generated anatomy.
export function playSkullIntro(model,entry,onComplete){
  const surface=entry.querySelector('.entry-skull'),scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(30,1,.001,20);
  const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});renderer.setPixelRatio(Math.min(devicePixelRatio,1.8));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;surface.append(renderer.domElement);
  const skull=new THREE.Group(),material=new THREE.MeshStandardMaterial({color:0xe8dfd1,roughness:.65});
  for(const bone of model.bones.filter(b=>b.count_group==='skull'))model.mapped.get(bone.bone_id)?.traverse(obj=>{if(obj.isMesh)skull.add(new THREE.Mesh(copyMeshInWorld(obj),material))});
  const bounds=new THREE.Box3().setFromObject(skull),center=bounds.getCenter(new THREE.Vector3()),size=bounds.getSize(new THREE.Vector3());
  for(const mesh of skull.children)mesh.geometry.translate(-center.x,-center.y,-center.z);
  scene.add(skull,new THREE.HemisphereLight(0xffe9df,0x13050a,.7));
  const key=new THREE.DirectionalLight(0xffe8dd,3.3);key.position.set(2,2,3);scene.add(key);
  const rim=new THREE.DirectionalLight(0xff173b,5);rim.position.set(-2,.5,-2);scene.add(rim);
  const fill=new THREE.DirectionalLight(0xaa6670,.5);fill.position.set(-2,0,2);scene.add(fill);
  let frame=null,stopped=false,distance=1;
  const resize=()=>{const r=surface.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();distance=Math.max(size.y,size.x/camera.aspect)/(2*Math.tan(Math.PI/12))*1.35};
  const observer=new ResizeObserver(resize);observer.observe(surface);resize();
  entry.classList.add('skull-playing');entry.querySelector('.entry-loading').textContent='LICENSED ANATOMICAL ATLAS / SKULL';
  const start=performance.now();
  const step=now=>{if(stopped)return;const t=Math.min(1,(now-start)/6500),ease=t*t*(3-2*t);skull.rotation.y=-1.15+ease*(Math.PI*2+1.15);skull.rotation.x=.06*Math.sin(t*Math.PI*2);camera.position.set(0,0,distance*(1.12-.12*ease));camera.lookAt(0,0,0);renderer.render(scene,camera);if(t>.48)entry.classList.add('name-revealed');if(t<1)frame=requestAnimationFrame(step);else onComplete()};frame=requestAnimationFrame(step);
  return ()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();for(const mesh of skull.children)mesh.geometry.dispose();material.dispose();renderer.dispose();renderer.domElement.remove()};
}
