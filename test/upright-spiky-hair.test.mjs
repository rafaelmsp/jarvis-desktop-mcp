import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import {fileURLToPath} from 'node:url';
import {createYouthfulHairProfile} from '../src/client/hair-youth-profile.js';
import {createUprightHairFade} from '../src/client/upright-hair-fade.js';
import {createHairBrowsGrid} from '../src/client/hair-brows-grid.js';
import {createFacialFinishing} from '../src/client/face-v4-finishing.js';
import {createFacialRig} from '../src/client/face-v4-rig.js';

const home=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const canonical=JSON.parse(await fs.readFile(
  path.join(home,'public/assets/models/canonical-face.json'),'utf8'));
const base=new Float32Array(canonical.vertices.flat());

test('Barber grid: topete realmente alto, pontudo e acima das laterais',()=>{
  const before=base.slice(),profile=createYouthfulHairProfile(base);
  assert.equal(profile.style,'high-upright-spiky-fade');
  const tall=profile.sample(0,.40);
  const side=profile.sample(.92,.40);
  assert.ok(tall[1]>=13,'topete central deveria ficar vertical e alto');
  assert.ok(tall[1]-side[1]>2.2,'laterais devem ficar curtas e em degradê');
  const h=[];
  for(let u=-1;u<=1.001;u+=.02)
    for(let v=0;v<=1.001;v+=.02){
      const pos=profile.sample(u,v);
      assert.ok(pos.every(Number.isFinite));
      h.push(pos[1]);
    }
  assert.ok(Math.max(...h)>13.2,'corte deveria passar acima do crânio');
  assert.ok(Math.max(...h)<15.1,'não pode atravessar a borda da tela');
  assert.deepEqual(base,before,'o rosto de origem é imutável');
});

test('Barber grid: pontas individuais, degradê bilateral e risca raspada unilateral',()=>{
  const root=new THREE.Group();
  const profile=createYouthfulHairProfile(base);
  const details=createUprightHairFade(THREE,root,profile.sample);
  const stats=details.getStats();
  assert.equal(stats.spikeClumps,39);
  assert.equal(stats.fadeBands,12);
  assert.equal(stats.shavedSide,'right');
  assert.ok(root.getObjectByName('hair-upright-spike-clumps')?.isLineSegments);
  assert.ok(root.getObjectByName('hair-upright-illuminated-tips')?.isLineSegments);
  assert.ok(root.getObjectByName('hair-left-skin-fade-gradient')?.isLineSegments);
  assert.ok(root.getObjectByName('hair-right-skin-fade-gradient')?.isLineSegments);
  assert.ok(root.getObjectByName('hair-right-shaved-razor-part')?.isMesh);
  assert.equal(root.getObjectByName('hair-left-shaved-razor-part'),undefined);
  assert.ok(root.getObjectByName('hair-right-shaved-part-rim')?.isLine);
  const disposeables=new Set(),disposed=new Set();
  root.traverse(o=>{
    if(o.geometry)disposeables.add(o.geometry);
    if(o.material){
      disposeables.add(o.material);
      assert.equal(o.material.map,null,'sem texturas ou fotografia');
    }
  });
  for(const obj of disposeables)obj.addEventListener('dispose',()=>disposed.add(obj));
  details.update({natural:false});
  details.update({natural:true});
  details.dispose();
  assert.equal(root.children.length,0);
  assert.equal(disposeables.size,disposed.size,'não deve vazar recursos gráficos');
});

test('Barber grid: cabelos, sobrancelhas e FACS coexistem com lipsync',()=>{
  const root=new THREE.Group();
  const finish=createFacialFinishing(THREE,root,base);
  const details=finish.getHairBrowsStats();
  assert.equal(details.style,'high-upright-spiky-fade');
  assert.equal(details.shavedSide,'right');
  assert.equal(details.spikeClumps,39);
  const rig=createFacialRig(base),working=new Float32Array(base.length);
  for(const expression of ['neutral','happy','thinking','alert','surprised','speaking']){
    for(let i=0;i<12;i++){
      rig.updateInto(working,{time:1+i/30,delta:1/30,expression,
        speaking:expression==='speaking',audioDriven:true,
        audioLevel:expression==='speaking'?.70:0});
    }
    const pose=rig.getPose();
    finish.update({working,natural:true,expression,thinking:pose.thinking,
      surprise:pose.surprise,alert:pose.alert,mouthOpen:pose.mouth});
    assert.ok(working.every(Number.isFinite));
  }
  finish.dispose();
  assert.equal(root.children.length,0);
});

test('Barber grid: perspectiva 37° enquadra topete e pescoço sem corte',async()=>{
  const src=await fs.readFile(path.join(home,'src/client/face-v4.js'),'utf8');
  assert.match(src,/PerspectiveCamera\(37,1,\.1,130\)/);
  assert.match(src,/camera\.position\.set\(0,-\.72,50\)/);
  const camera=new THREE.PerspectiveCamera(37,1,.1,130);
  camera.position.set(0,-.72,50);
  camera.lookAt(0,-.12,0);camera.updateMatrixWorld();camera.updateProjectionMatrix();
  const profile=createYouthfulHairProfile(base);
  const raised=profile.sample(0,.35);
  const tip=new THREE.Vector3(raised[0],raised[1]+1.07,raised[2]).project(camera);
  const neck=new THREE.Vector3(0,-14,0).project(camera);
  assert.ok(tip.y<.97,'topete deveria caber na tela');
  assert.ok(neck.y>-.97,'pescoço deveria continuar visível');
});
