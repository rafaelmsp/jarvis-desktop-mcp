/**
 * JARVIS V4 — one WebGL facial renderer, anatomically indexed 468-point mesh.
 * Base geometry: Google MediaPipe canonical face (Apache-2.0).
 * Three.js: MIT. See third_party/ATTRIBUTIONS.md.
 * Preserves original MCP state machine, browser voice and optional microphone.
 */
import * as THREE from 'three';
import {createFacialFinishing} from './face-v4-finishing.js';
import {createFacialRig} from './face-v4-rig.js';

const $ = id => document.getElementById(id);
const stage=$('face3dViewport');
const avatar=$('avatar');
const fallback=$('face3dFallback');
const progress=(percent,phase)=>window.dispatchEvent(new CustomEvent('jarvis-render-progress',{detail:{percent,phase}}));
if(stage && avatar) void start();

async function start(){
 let renderer, raf=0, destroyed=false, firstFrame=true;
 progress(8,'Preparando motor gráfico');
 const showFallback=(reason)=>{
   stage.hidden=true;
   if(fallback){fallback.hidden=false; fallback.querySelector('.reason').textContent=reason;}
   document.documentElement.dataset.faceV4='fallback';
 };
 try{
   if(!window.WebGLRenderingContext) throw Error('WebGL não disponível');
   const response=await fetch('/assets/models/canonical-face.json',{cache:'no-store'});
   if(!response.ok)throw Error('Geometria 3D não encontrada');
   const data=await response.json();
   if(data.vertexCount!==468 || data.triangleCount<800 || data.vertices.length!==468)
     throw Error('Arquivo de malha inválido');
   progress(26,'Malha anatómica carregada');
   const vertices=new Float32Array(data.vertices.flat());
   const tri=new Uint16Array(data.triangles.flat());
   const scene=new THREE.Scene();
   const camera=new THREE.PerspectiveCamera(35,1,.1,130);
   camera.position.set(0,-.7,40);
   camera.lookAt(0,-1.35,0);
   renderer=new THREE.WebGLRenderer({alpha:true,antialias:true,powerPreference:'low-power'});
   renderer.setClearColor(0x000000,0);
   renderer.outputColorSpace=THREE.SRGBColorSpace;
   renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,1.75));
   stage.replaceChildren(renderer.domElement);
   renderer.domElement.setAttribute('aria-hidden','true');

   const root=new THREE.Group();
   scene.add(root);
   const shape=new THREE.BufferGeometry();
   const working=new Float32Array(vertices);
   shape.setAttribute('position',new THREE.BufferAttribute(working,3).setUsage(THREE.DynamicDrawUsage));
   shape.setIndex(new THREE.BufferAttribute(tri,1));
   shape.computeVertexNormals();
   const darkSurface=new THREE.Mesh(shape,new THREE.MeshBasicMaterial({
     color:0x007ba3,side:THREE.DoubleSide,transparent:true,opacity:.105,
     depthWrite:true,polygonOffset:true,polygonOffsetFactor:1,polygonOffsetUnits:1
   }));
   darkSurface.renderOrder=0;
   root.add(darkSurface);

   // Suppress grid segments that visually resemble teeth or filled eyelids.
   // Anatomical eyelid and lip outlines remain visible in the contour layers.
   const detailZone=(a,b)=>{
     const ax=vertices[a*3],ay=vertices[a*3+1];
     const bx=vertices[b*3],by=vertices[b*3+1];
     const x=(ax+bx)*.5,y=(ay+by)*.5;
     const mouth=(x/1.98)**2+((y+4.32)/.34)**2<1;
     const eye=((Math.abs(x)-3.18)/.93)**2+((y-2.61)/.27)**2<1;
     return mouth||eye;
   };
   // Unique topological edges; two line layers share one dynamic set of vertices.
   const edgeSet=new Set();
   const edgeIds=[];
   for(let i=0;i<tri.length;i+=3){
     const a=tri[i],b=tri[i+1],c=tri[i+2];
     for(const [u,v] of [[a,b],[b,c],[c,a]]){
       const low=Math.min(u,v),high=Math.max(u,v),key=low*468+high;
       if(!edgeSet.has(key)){edgeSet.add(key);if(!detailZone(u,v))edgeIds.push(u,v);}
     }
   }
   const edgePositions=new Float32Array(edgeIds.length*3);
   const lineShape=new THREE.BufferGeometry();
   lineShape.setAttribute('position',new THREE.BufferAttribute(edgePositions,3).setUsage(THREE.DynamicDrawUsage));
   const glowLines=new THREE.LineSegments(lineShape,new THREE.LineBasicMaterial({
     color:0x027eae,transparent:true,opacity:.48,depthWrite:false,
     blending:THREE.AdditiveBlending
   }));
   const crispLines=new THREE.LineSegments(lineShape,new THREE.LineBasicMaterial({
     color:0x63e9ff,transparent:true,opacity:.79,depthWrite:false,
     blending:THREE.AdditiveBlending
   }));
   crispLines.renderOrder=2;
   root.add(glowLines,crispLines);
   progress(52,'Estrutura holográfica preparada');

   const dots=new THREE.BufferGeometry();
   dots.setAttribute('position',new THREE.BufferAttribute(working,3));
   const points=new THREE.Points(dots,new THREE.PointsMaterial({
     color:0xb2f6ff,size:.078,sizeAttenuation:true,transparent:true,opacity:.85,
     depthWrite:false,blending:THREE.AdditiveBlending
   }));
   points.renderOrder=3;
   root.add(points);

   // Retro CRT cranial dome, only behind the anatomical face.
   const backGeom=new THREE.SphereGeometry(1,30,19,Math.PI,Math.PI,0,Math.PI);
   const backs=backGeom.getAttribute('position');
   for(let i=0;i<backs.count;i++){
     const x=backs.getX(i),y=backs.getY(i),z=backs.getZ(i);
     const taper=.72+.28*Math.max(0,y);
     backs.setXYZ(i,x*7.2*taper,y*9.45-.15,z*6.35-2.1);
   }
   backGeom.computeVertexNormals();
   const backMesh=new THREE.LineSegments(new THREE.WireframeGeometry(backGeom),
     new THREE.LineBasicMaterial({color:0x179fcb,opacity:.23,transparent:true,depthWrite:false}));
   root.add(backMesh);

   const arc=(pts,color=0x54dfff,alpha=.65)=>{
     const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal');
     const samples=curve.getPoints(32);
     const geom=new THREE.BufferGeometry().setFromPoints(samples);
     const obj=new THREE.Line(geom,new THREE.LineBasicMaterial({
       color,transparent:true,opacity:alpha,blending:THREE.AdditiveBlending,depthWrite:false
     }));
     root.add(obj);return obj;
   };
   // Ear cartilage is provided by the V4.1 anatomical finishing module.

   // Neck: sloped collars and transverse rings, not a spherical base.
   const neckY=[-8.5,-10.4,-12.45];
   const neckX=[2.7,2.65,3.45];
   const neckZ=[-1.2,-1.6,-1.6];
   const neckRZ=[2.55,2.38,2.75];
   for(let row=0;row<neckY.length;row++){
     const ring=[];
     for(let n=0;n<=28;n++){
       const theta=n*Math.PI*2/28;
       ring.push([Math.cos(theta)*neckX[row],neckY[row],Math.sin(theta)*neckRZ[row]+neckZ[row]]);
     }
     arc(ring,0x1cb3d1,.32);
   }
   for(let i=0;i<=9;i++){
     const a=i*Math.PI*2/10;
     arc(neckY.map((y,j)=>[Math.cos(a)*neckX[j],y,Math.sin(a)*neckRZ[j]+neckZ[j]]),
         0x169cc1,.29);
   }
   // Subtle connected diagnostic nodes floating around the mesh.
   const nodePositions=[];
   for(let i=0;i<38;i++){
     const theta=i*2.39996, radius=10+(i%5)*.42;
     nodePositions.push(Math.cos(theta)*radius,Math.sin(theta)*radius*.96-1,(-3+Math.sin(i*4)*2.5));
   }
   const particleGeom=new THREE.BufferGeometry();
   particleGeom.setAttribute('position',new THREE.Float32BufferAttribute(nodePositions,3));
   const halo=new THREE.Points(particleGeom,new THREE.PointsMaterial({
     color:0x5eeaff,size:.08,transparent:true,opacity:.52,depthWrite:false,
     blending:THREE.AdditiveBlending
   }));
   scene.add(halo);

   // Facial feature contours follow the original MediaPipe landmark topology,
   // remaining attached to the deforming face during emotion and speech.
   const contours=[
     {ids:[33,7,163,144,145,153,154,155,133,173,157,158,159,160,161,246,33],color:0xaaf7ff},
     {ids:[263,249,390,373,374,380,381,382,362,398,384,385,386,387,388,466,263],color:0xaaf7ff},
     {ids:[70,63,105,66,107,55,65,52,53,46],color:0x51cae8},
     {ids:[300,293,334,296,336,285,295,282,283,276],color:0x51cae8},
     {ids:[61,146,91,181,84,17,314,405,321,375,291,409,270,269,267,0,37,39,40,185,61],color:0x92eeff},
     {ids:[61,78,95,88,178,87,14,317,402,318,324,308,291,],color:0x42bee0},
     {ids:[168,6,197,195,5,4,1,2],color:0x49d6ef},
     {ids:[127,234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454,356],color:0x3ac5eb}
   ];
   const featureLines=contours.map(({ids,color})=>{
     const pos=new Float32Array(ids.length*3);
     const geo=new THREE.BufferGeometry();
     geo.setAttribute('position',new THREE.BufferAttribute(pos,3).setUsage(THREE.DynamicDrawUsage));
     const line=new THREE.Line(geo,new THREE.LineBasicMaterial({
       color,transparent:true,opacity:.77,depthWrite:false,depthTest:false,
       blending:THREE.AdditiveBlending
     }));
     line.renderOrder=5; root.add(line);
     return {ids,pos,geo,line};
   });
   const finishing=createFacialFinishing(THREE,root,vertices);
   const rig=createFacialRig(vertices);
   progress(81,'Expressões e detalhes faciais preparados');
   const vertexCount=vertices.length/3;
   let w=0,h=0;
   const resize=()=>{
     const b=stage.getBoundingClientRect();
     w=Math.max(1,b.width);h=Math.max(1,b.height);
     camera.aspect=w/h;camera.updateProjectionMatrix();
     renderer.setSize(w,h,false);
   };
   const resizer=new ResizeObserver(resize);
   resizer.observe(stage);resize();
   const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
   let last=0;
   function frame(ms){
     if(destroyed || document.hidden){raf=0;return;}
     raf=requestAnimationFrame(frame);
     if(ms-last<31)return;
     const delta=last ? (ms-last)/1000 : 1/30;
     last=ms;
     if(!avatar.classList.contains('face'))return;
     const t=ms/1000;
     const expr=avatar.dataset.expression||'neutral';
     const speaking=avatar.dataset.speaking==='true';
     // No modo loopback, a amplitude real dirige a abertura (sem fonemas nem gravação).
     // Comando MCP do celular prevalece temporariamente, sem desativar o loopback do PC.
     const audioDriven=avatar.dataset.audioSync==='true' && avatar.dataset.remoteTurnActive!=='true';
     const strength=Math.max(0,Math.min(1,Number(avatar.dataset.audioLevel)||0));
     // Anatomical deformations are smoothed by the reusable V4.4 facial rig.
     const pose=rig.updateInto(working,{time:t,delta,expression:expr,speaking,
       audioDriven,audioLevel:strength,reducedMotion:motion.matches});
     shape.attributes.position.needsUpdate=true;
     dots.attributes.position.needsUpdate=true;
     for(let i=0;i<edgeIds.length;i++){
       const q=i*3,k=edgeIds[i]*3;
       edgePositions[q]=working[k];edgePositions[q+1]=working[k+1];edgePositions[q+2]=working[k+2];
     }
     lineShape.attributes.position.needsUpdate=true;
     for(const f of featureLines){
       for(let j=0;j<f.ids.length;j++){
         const i=f.ids[j]*3,k=j*3;
         f.pos[k]=working[i]; f.pos[k+1]=working[i+1]; f.pos[k+2]=working[i+2]+.075;
       }
       f.geo.attributes.position.needsUpdate=true;
     }
     finishing.update({working,time:t,expression:expr,speaking,
       mouthOpen:pose.mouth,blink:pose.blink,attention:pose.attention,
       thinking:pose.thinking,reducedMotion:motion.matches});
     root.rotation.y= motion.matches ? .10 : .11 + .064*Math.sin(t*.35) + pose.attention*.025;
     root.rotation.x= motion.matches ? 0 : .015*Math.sin(t*.27);
     root.position.y=motion.matches ? 0 : .08*Math.sin(t*.82);
     halo.rotation.z=motion.matches?0:t*.01;
     renderer.render(scene,camera);
     document.documentElement.dataset.faceV4='ready';
     if(firstFrame){firstFrame=false;progress(100,'Rosto V4.4 pronto');}
   }
   const resume=()=>{if(!document.hidden&&!raf)raf=requestAnimationFrame(frame);};
   document.addEventListener('visibilitychange',resume);
   raf=requestAnimationFrame(frame);
   window.__jarvisV4=Object.freeze({
     version:'4.4-refinement',engine:'Three.js/WebGL',
     vertices:vertexCount,triangles:tri.length/3,edges:edgeIds.length/2,
     getStatus:()=>document.documentElement.dataset.faceV4,
     getPose:()=>rig.getPose()
   });
   window.addEventListener('beforeunload',()=>{
     destroyed=true;cancelAnimationFrame(raf);resizer.disconnect();
     shape.dispose();lineShape.dispose();dots.dispose();particleGeom.dispose();
     for(const f of featureLines){f.geo.dispose();f.line.material.dispose();}
     finishing.dispose();
     backGeom.dispose();backMesh.geometry.dispose();
     darkSurface.material.dispose();glowLines.material.dispose();
     crispLines.material.dispose();points.material.dispose();halo.material.dispose();
     renderer.dispose();
   },{once:true});
 }catch(error){
   console.error('JARVIS V4:',error);
   if(renderer)renderer.dispose();
   progress(0,'Falha no motor 3D');
   showFallback(error.message || 'Falha no motor 3D');
 }
}
