import * as THREE from 'three';

// A planar cut of a COPY of atlas geometry. This is never image reconstruction.
export function splitSchematicGeometry(source,plane,{allowOpenSurface=false}={}){
  const position=source.getAttribute('position'),normal=source.getAttribute('normal'),index=source.index;
  const box=new THREE.Box3().setFromBufferAttribute(position),epsilon=box.getSize(new THREE.Vector3()).length()*1e-6;
  const pieces=[{p:[],n:[],c:[]},{p:[],n:[],c:[]}],segments=[];
  const vertex=i=>({p:new THREE.Vector3().fromBufferAttribute(position,i),n:normal?new THREE.Vector3().fromBufferAttribute(normal,i):new THREE.Vector3(0,1,0)});
  function emit(piece,vertices,color){for(const v of vertices){piece.p.push(...v.p.toArray());piece.n.push(...v.n.toArray());piece.c.push(...color)}}
  function clip(vertices,sign){const result=[];for(let i=0;i<vertices.length;i++){const a=vertices[i],b=vertices[(i+1)%vertices.length],da=plane.distanceToPoint(a.p)*sign,db=plane.distanceToPoint(b.p)*sign;if(da>=0)result.push(a);if((da>0&&db<0)||(da<0&&db>0)){const t=da/(da-db);result.push({p:a.p.clone().lerp(b.p,t),n:a.n.clone().lerp(b.n,t).normalize()})}}return result}
  for(let i=0;i<(index?index.count:position.count);i+=3){const triangle=[0,1,2].map(j=>vertex(index?index.getX(i+j):i+j));const intersections=[];
    for(let j=0;j<3;j++){const a=triangle[j].p,b=triangle[(j+1)%3].p,da=plane.distanceToPoint(a),db=plane.distanceToPoint(b);if(Math.abs(da)<epsilon)intersections.push(a.clone());if(da*db<0)intersections.push(a.clone().lerp(b,da/(da-db)))}
    const unique=intersections.filter((p,j)=>!intersections.slice(0,j).some(q=>q.distanceTo(p)<epsilon));if(unique.length===2&&unique[0].distanceTo(unique[1])>epsilon)segments.push(unique);
    for(let side=0;side<2;side++){const polygon=clip(triangle,side===0?1:-1);for(let j=1;j+1<polygon.length;j++)emit(pieces[side],[polygon[0],polygon[j],polygon[j+1]],[.86,.85,.78])}
  }
  let uncapped=false;
  try{
  const key=p=>p.toArray().map(v=>Math.round(v/epsilon)).join(','),points=new Map(),adjacency=new Map(),edges=new Set();
  for(const [a,b] of segments){const ka=key(a),kb=key(b);if(ka===kb)continue;const edge=[ka,kb].sort().join('|');if(edges.has(edge))continue;edges.add(edge);points.set(ka,a);points.set(kb,b);for(const [x,y] of [[ka,kb],[kb,ka]]){if(!adjacency.has(x))adjacency.set(x,[]);adjacency.get(x).push(y)}}
  if(!points.size||[...adjacency.values()].some(neighbors=>neighbors.length!==2))throw Error('This cut does not form a closed contour. Move the cut position.');
  const first=points.keys().next().value,loop=[];let current=first,previous=null;
  do{if(loop.length>points.size)throw Error('Ambiguous cut contour. Choose another cut position.');loop.push(points.get(current));const next=adjacency.get(current).find(k=>k!==previous);previous=current;current=next}while(current!==first);
  if(loop.length!==points.size)throw Error('This cut crosses multiple surfaces. Choose a shaft position.');
  const u=new THREE.Vector3(1,0,0).projectOnPlane(plane.normal).normalize(),v=new THREE.Vector3().crossVectors(plane.normal,u).normalize();
  const contour=loop.map(p=>new THREE.Vector2(p.dot(u),p.dot(v))),triangles=THREE.ShapeUtils.triangulateShape(contour,[]);
  for(let side=0;side<2;side++){const capNormal=plane.normal.clone().multiplyScalar(side===0?-1:1);for(const face of triangles){const vertices=face.map(i=>({p:loop[i],n:capNormal}));const cross=new THREE.Vector3().crossVectors(vertices[1].p.clone().sub(vertices[0].p),vertices[2].p.clone().sub(vertices[0].p));if(cross.dot(capNormal)<0)[vertices[1],vertices[2]]=[vertices[2],vertices[1]];emit(pieces[side],vertices,[1,.48,.17])}}
  }catch(error){if(!allowOpenSurface)throw error;uncapped=true}
  return pieces.map(piece=>{if(!piece.p.length)throw Error('Cut lies outside the bone.');const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(piece.p,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(piece.n,3));geometry.setAttribute('color',new THREE.Float32BufferAttribute(piece.c,3));geometry.computeBoundingBox();geometry.userData.uncapped=uncapped;return geometry});
}

export function copyMeshInWorld(mesh){
  mesh.updateWorldMatrix(true,false);
  const geometry=mesh.geometry.clone();
  for(const name of ['position','normal']){const attribute=geometry.getAttribute(name);if(!attribute)continue;const values=[];for(let i=0;i<attribute.count;i++)values.push(attribute.getX(i),attribute.getY(i),attribute.getZ(i));geometry.setAttribute(name,new THREE.Float32BufferAttribute(values,3))}
  geometry.applyMatrix4(mesh.matrixWorld);
  return geometry;
}

export function copyAlignedBone(node){
  const meshes=[];node.updateWorldMatrix(true,true);node.traverse(child=>{if(child.isMesh)meshes.push(child)});
  if(!meshes.length)throw Error('Individual atlas geometry is unavailable for this bone.');
  let geometry;
  if(meshes.length===1)geometry=copyMeshInWorld(meshes[0]);
  else{
    const positions=[],normals=[];
    for(const mesh of meshes){const world=copyMeshInWorld(mesh);const flat=world.index?world.toNonIndexed():world;if(!flat.getAttribute('normal'))flat.computeVertexNormals();for(const v of flat.getAttribute('position').array)positions.push(v);for(const v of flat.getAttribute('normal').array)normals.push(v);if(flat!==world)flat.dispose();world.dispose()}
    geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  }
  const positions=geometry.getAttribute('position'),center=new THREE.Vector3();
  for(let i=0;i<positions.count;i++)center.add(new THREE.Vector3().fromBufferAttribute(positions,i));center.divideScalar(positions.count);
  const covariance=Array(9).fill(0);for(let i=0;i<positions.count;i++){const p=new THREE.Vector3().fromBufferAttribute(positions,i).sub(center).toArray();for(let r=0;r<3;r++)for(let c=0;c<3;c++)covariance[r*3+c]+=p[r]*p[c]}
  let axis=new THREE.Vector3(1,1,1).normalize();for(let i=0;i<32;i++){const a=axis.toArray();axis.set(...[0,1,2].map(r=>[0,1,2].reduce((sum,c)=>sum+covariance[r*3+c]*a[c],0))).normalize()}
  if(axis.y<0)axis.negate();const rotation=new THREE.Quaternion().setFromUnitVectors(axis,new THREE.Vector3(0,1,0));
  const worldToDisplay=new THREE.Matrix4().makeRotationFromQuaternion(rotation).multiply(new THREE.Matrix4().makeTranslation(-center.x,-center.y,-center.z));
  geometry.applyMatrix4(worldToDisplay);geometry.computeBoundingBox();
  geometry.userData.worldToDisplay=worldToDisplay.toArray();
  geometry.userData.displayToWorld=worldToDisplay.clone().invert().toArray();
  return geometry;
}
