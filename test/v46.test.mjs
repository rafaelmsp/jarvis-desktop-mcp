import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import * as THREE from 'three';
import {createFacialRig} from '../src/client/face-v4-rig.js';
import {createFacialFinishing} from '../src/client/face-v4-finishing.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const mesh=JSON.parse(await readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const base=new Float32Array(mesh.vertices.flat());
const y=(v,i)=>v[i*3+1];
const lipGap=v=>y(v,13)-y(v,14);
function pose(expression='neutral',opts={}){
 const rig=createFacialRig(base),working=new Float32Array(base.length);
 for(let i=0;i<50;i++)rig.updateInto(working,{time:i/30,delta:1/30,expression,...opts});
 return {working,weights:rig.getPose()};
}
test('V4.6: mouth naturally rests nearly closed, without changing canonical mesh',()=>{
 const reference=Float32Array.from(base);
 const resting=pose();
 assert.ok(lipGap(base)>.5,'canonical mouth baseline unexpectedly changed');
 assert.ok(lipGap(resting.working)>.07&&lipGap(resting.working)<.3,
   'resting lips should form a narrow soft seam, not an open oval');
 assert.deepEqual([...base],[...reference],'source landmark geometry must stay immutable');
});
test('V4.6: audio releases the lip seal, opens mouth, and returns to rest',()=>{
 const idle=pose();
 const talking=pose('speaking',{speaking:true,audioDriven:true,audioLevel:.85});
 assert.ok(lipGap(talking.working)>lipGap(idle.working)+.4);
 assert.ok(talking.weights.mouth>.7);
 const rig=createFacialRig(base),out=new Float32Array(base.length);
 for(let i=0;i<30;i++)rig.updateInto(out,{time:i/30,delta:1/30,speaking:true,audioDriven:true,audioLevel:.85,expression:'speaking'});
 for(let i=0;i<35;i++)rig.updateInto(out,{time:1+i/30,delta:1/30,speaking:false,audioDriven:true,audioLevel:0,expression:'listening'});
 assert.ok(rig.getPose().mouth<.05,'mouth weight did not relax');
 assert.ok(lipGap(out)<.3,'lip seam remained open in silence');
});
test('V4.6: mouth seam follows inner landmarks without translucent fake teeth',()=>{
 const root=new THREE.Group();
 const finishing=createFacialFinishing(THREE,root,base);
 const seam=root.children.find(c=>c.isLine&&c.material?.color?.getHex()===0x46b6dd);
 assert.ok(seam,'dynamic inner contour not present');
 finishing.update({working:base,mouthOpen:0,expression:'listening',reducedMotion:true});
 const closed=seam.material.opacity;
 finishing.update({working:base,mouthOpen:.9,expression:'speaking',speaking:true});
 const opened=seam.material.opacity;
 assert.ok(closed<.2,'inner seam too bright in idle');
 assert.ok(opened>closed+.2,'inner seam does not brighten in speech');
 finishing.dispose();
 assert.equal(root.children.length,0,'finishing leaked geometry');
});
test('V4.6: mobile pixels, GPU recoverability and orbit geometry clean-up',async()=>{
 const renderer=await readFile(path.join(root,'src/client/face-v4.js'),'utf8');
 const html=await readFile(path.join(root,'public/index.html'),'utf8');
 const app=await readFile(path.join(root,'public/app.js'),'utf8');
 assert.match(renderer,/pixelBudget\(\)/);
 assert.match(renderer,/640px/);
 assert.match(renderer,/webglcontextlost/);
 assert.match(renderer,/webglcontextrestored/);
 assert.match(renderer,/orbitalCurves/);
 assert.match(renderer,/curve\.geometry\.dispose/);
 assert.match(renderer,/progress\(100,'Rosto V4\.6 pronto'\)/);
 assert.match(html,/SYNTH-FACE · V4\.6/);
 assert.match(app,/SYNTH-FACE · V4\.6/);
 assert.match(renderer,/avatar\.dataset\.remoteTurnActive!=='true'/);
});
test('V4.6: all facial states remain finite and bounded with mouth closure',()=>{
 const original=Float32Array.from(base);
 for(const expression of ['neutral','listening','thinking','speaking','happy','surprised','alert']){
  const {working}=pose(expression,{speaking:expression==='speaking'});
  assert.ok(working.every(Number.isFinite));
  let max=0;
  for(let i=0;i<working.length;i++)max=Math.max(max,Math.abs(working[i]-base[i]));
  assert.ok(max<1.7,expression+' geometry exceeded bounded deformation: '+max);
 }
 assert.deepEqual([...base],[...original]);
});
