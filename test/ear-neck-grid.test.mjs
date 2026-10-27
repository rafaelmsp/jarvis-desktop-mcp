import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import * as THREE from 'three';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {createEarNeckGrid} from '../src/client/ear-neck-grid.js';
import {createFacialFinishing} from '../src/client/face-v4-finishing.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const model=JSON.parse(await fs.readFile(path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const vertices=new Float32Array(model.vertices.flat());

test('GRID: orelhas esquerda/direita com cartilagem, relevo e anatomia bilateral',()=>{
  const parent=new THREE.Group();
  const anatomy=createEarNeckGrid(THREE,parent);
  const s=anatomy.getStats();
  assert.equal(s.ears,2);
  assert.equal(s.earVertices,480);
  assert.equal(s.earTriangles,768);
  assert.ok(s.anatomicalRidges>=14);
  const left=parent.getObjectByName('ear-left-cartilage-surface');
  const right=parent.getObjectByName('ear-right-cartilage-surface');
  assert.ok(left?.isMesh&&right?.isMesh,'as duas orelhas devem ter superfície 3D');
  for(const ear of [left,right]){
    const a=ear.geometry.getAttribute('position');
    const p=ear.geometry.index;
    assert.equal(a.count,240);
    assert.equal(p.count,384*3);
    assert.ok([...a.array].every(Number.isFinite));
    assert.ok([...p.array].every(i=>i<a.count));
    const uniqueZ=new Set(Array.from({length:a.count},(_,i)=>a.getZ(i).toFixed(2)));
    assert.ok(uniqueZ.size>20,'pavilhao nao deve ser plano');
  }
  const xLeft=left.geometry.getAttribute('position');
  const xRight=right.geometry.getAttribute('position');
  for(let i=0;i<xLeft.count;i++){
    assert.ok(Math.abs(xLeft.getX(i)+xRight.getX(i))<1e-4);
    assert.ok(Math.abs(xLeft.getY(i)-xRight.getY(i))<1e-4);
    assert.ok(Math.abs(xLeft.getZ(i)-xRight.getZ(i))<1e-4);
  }
  for(const term of ['tragus','lobe-jaw-transition','radial-grid']){
    const names=[];
    earTree: for(const side of ['left','right']){
      let found=false;
      parent.traverse(o=>{if(o.name?.includes('ear-'+side)&&o.name.includes(term)){found=true;names.push(o.name);}});
      assert.ok(found,side+' sem detalhe '+term);
    }
  }
  anatomy.dispose();
  assert.equal(parent.children.length,0);
});

test('GRID: pescoço com malha aberta, ligacao inferior e volumes cervicais',()=>{
  const parent=new THREE.Group();
  const anatomy=createEarNeckGrid(THREE,parent);
  const shell=parent.getObjectByName('neck-continuous-front-surface');
  const wire=parent.getObjectByName('neck-cervical-grid');
  assert.ok(shell?.isMesh);
  assert.ok(wire?.isLineSegments);
  const pos=shell.geometry.getAttribute('position');
  assert.equal(pos.count,8*19);
  assert.equal(anatomy.getStats().neckTriangles,7*18*2);
  const xs=[],ys=[],zs=[];
  for(let i=0;i<pos.count;i++){xs.push(pos.getX(i));ys.push(pos.getY(i));zs.push(pos.getZ(i));}
  assert.ok(Math.min(...ys)<-13.4);
  assert.ok(Math.max(...ys)>-8.5);
  assert.ok(Math.max(...xs)>4.5&&Math.min(...xs)<-4.5);
  assert.ok(Math.max(...zs)-Math.min(...zs)>2);
  for(const id of ['sternocleidomastoid','trapezius-outline','lateral-tendon','clavicle-shoulder']){
    for(const side of ['left','right'])
      assert.ok(parent.getObjectByName('neck-'+side+'-'+id),side+' sem '+id);
  }
  anatomy.update({natural:true,time:3,mouthOpen:.7});
  const neck=parent.getObjectByName('jarvis-neck-grid');
  assert.ok(neck.position.z>.003&&neck.position.z<.014);
  anatomy.update({natural:false,reducedMotion:true});
  assert.equal(neck.position.z,0);
  assert.equal(neck.scale.x,1);
  anatomy.dispose();
});

test('GRID: elementos simples sem texturas e liberacao completa da GPU',()=>{
  const parent=new THREE.Group();
  const anatomy=createEarNeckGrid(THREE,parent);
  const geos=new Set(),mats=new Set();
  parent.traverse(o=>{
    if(o.geometry)geos.add(o.geometry);
    if(o.material)mats.add(o.material);
    if(o.isMesh||o.isLine||o.isLineSegments){
      assert.equal(Boolean(o.material.map),false,'textura fotografica inesperada');
    }
  });
  const disposed=new Set();
  for(const v of [...geos,...mats])v.addEventListener('dispose',()=>disposed.add(v));
  anatomy.update({time:4.5,mouthOpen:.9});
  anatomy.dispose();
  assert.equal(parent.children.length,0);
  assert.equal(disposed.size,geos.size+mats.size);
  assert.ok(geos.size>=20,'detalhes insuficientes');
});

test('GRID: acabamento facial conserva o rig original e todos os estados',()=>{
  const parent=new THREE.Group();
  const finish=createFacialFinishing(THREE,parent,vertices);
  assert.ok(finish.getAnatomyStats().neckMuscles>=10);
  for(const expression of ['listening','speaking','happy','thinking','alert','surprised']){
    finish.update({working:vertices,time:4.2,expression,mouthOpen:.7,
      speaking:expression==='speaking',natural:true});
    assert.ok(parent.getObjectByName('jarvis-anatomical-ear-neck-grid'));
  }
  finish.update({working:vertices,natural:false,reducedMotion:true});
  finish.dispose();
  assert.equal(parent.children.length,0);
});
