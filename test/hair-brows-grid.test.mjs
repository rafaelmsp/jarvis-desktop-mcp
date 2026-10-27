import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import path from 'node:path';
import * as THREE from 'three';
import {fileURLToPath} from 'node:url';
import {createHairBrowsGrid} from '../src/client/hair-brows-grid.js';
import {createFacialFinishing} from '../src/client/face-v4-finishing.js';
import {createFacialRig} from '../src/client/face-v4-rig.js';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const model=JSON.parse(await fs.readFile(
  path.join(root,'public/assets/models/canonical-face.json'),'utf8'));
const base=new Float32Array(model.vertices.flat());

test('GRID: cabelo curto em volume 3D com fios penteados e laterais limpas',()=>{
  const parent=new THREE.Group(),detail=createHairBrowsGrid(THREE,parent,base);
  const stats=detail.getStats();
  assert.equal(stats.hairRows,13);
  assert.equal(stats.hairColumns,23);
  assert.ok(stats.brushedStrands>=25);
  assert.equal(stats.templeStrands,12);
  const scalp=parent.getObjectByName('hair-short-swept-scalp-volume');
  const wires=parent.getObjectByName('hair-anatomical-wiregrid');
  assert.ok(scalp?.isMesh&&wires?.isLineSegments);
  assert.equal(scalp.geometry.getAttribute('position').count,stats.hairVertices);
  assert.equal(scalp.geometry.index.count,stats.hairTriangles*3);
  const p=scalp.geometry.getAttribute('position');
  const ys=[],zs=[];
  for(let i=0;i<p.count;i++){ys.push(p.getY(i));zs.push(p.getZ(i));}
  assert.ok(Math.max(...ys)>9.5,'cabelo precisa ter volume sobre o cranio');
  assert.ok(Math.min(...ys)>5.4,'cabelo nao pode cobrir olhos e boca');
  assert.ok(Math.max(...zs)-Math.min(...zs)>5,'cabelo precisa ter profundidade');
  const front=parent.getObjectByName('hair-brushed-strand-0');
  const layer=parent.getObjectByName('hair-short-layer-6');
  assert.ok(front?.isLine&&layer?.isLine);
  for(const side of ['left','right'])
    assert.ok(parent.getObjectByName('hair-'+side+'-short-temple-5'));
  detail.dispose();
  assert.equal(parent.children.length,0);
});

test('GRID: sobrancelhas expressivas com area e linhas reais seguindo landmarks',()=>{
  const parent=new THREE.Group(),detail=createHairBrowsGrid(THREE,parent,base);
  const stats=detail.getStats();
  assert.equal(stats.brows,2);
  assert.equal(stats.animatedBrowVertices,250);
  const left=parent.getObjectByName('brow-left-expressive-volume');
  const right=parent.getObjectByName('brow-right-expressive-volume');
  assert.ok(left?.isMesh&&right?.isMesh);
  const before=[...left.geometry.getAttribute('position').array];
  const rig=createFacialRig(base),working=new Float32Array(base.length);
  for(let n=0;n<25;n++)rig.updateInto(working,{time:n/30,delta:1/30,expression:'surprised'});
  detail.update({working,surprise:rig.getPose().surprise});
  const after=[...left.geometry.getAttribute('position').array];
  assert.notDeepEqual(after,before,'sobrancelhas precisam acompanhar o rig');
  assert.ok(after.every(Number.isFinite));
  const leftXs=[],rightXs=[];
  const l=left.geometry.getAttribute('position'),r=right.geometry.getAttribute('position');
  for(let i=0;i<l.count;i++){leftXs.push(l.getX(i));rightXs.push(r.getX(i));}
  assert.ok(Math.max(...leftXs)<0&&Math.min(...rightXs)>0);
  for(const side of ['left','right']){
    const brow=parent.getObjectByName('brow-'+side+'-swept-wiregrid');
    assert.ok(brow?.isLineSegments);
    assert.ok(brow.geometry.getAttribute('position').count>250);
  }
  detail.dispose();
});

test('GRID: cabelo/brows sem fotos, sem GPU leak e com modo reduzido',()=>{
  const parent=new THREE.Group(),detail=createHairBrowsGrid(THREE,parent,base);
  const geometries=new Set(),materials=new Set(),disposed=new Set();
  parent.traverse(o=>{
    if(o.geometry)geometries.add(o.geometry);
    if(o.material){
      materials.add(o.material);
      assert.equal(o.material.map,null,'a grid nao deve utilizar textura de pele/cabelo');
    }
  });
  for(const g of [...geometries,...materials])
    g.addEventListener('dispose',()=>disposed.add(g));
  detail.update({working:base,natural:false,reducedMotion:true});
  detail.dispose();
  assert.equal(parent.children.length,0);
  assert.equal(disposed.size,geometries.size+materials.size);
  assert.ok(geometries.size>40&&geometries.size<150,'malha precisa ser leve');
});

test('GRID: preserva cabelo, rosto, orelhas e sincronismo por estado',()=>{
  const parent=new THREE.Group(),finish=createFacialFinishing(THREE,parent,base);
  assert.equal(finish.getHairBrowsStats().brows,2);
  assert.equal(finish.getAnatomyStats().ears,2);
  const rig=createFacialRig(base),working=new Float32Array(base.length);
  for(const expression of ['neutral','listening','thinking','happy','alert','surprised','speaking']){
    const speaking=expression==='speaking';
    for(let i=0;i<12;i++)
      rig.updateInto(working,{time:i/30,delta:1/30,expression,speaking,
        audioDriven:true,audioLevel:speaking?.77:0});
    const pose=rig.getPose();
    finish.update({working,time:2,expression,speaking,natural:true,
      mouthOpen:pose.mouth,surprise:pose.surprise,alert:pose.alert,thinking:pose.thinking});
    assert.ok(parent.getObjectByName('jarvis-hair-brows-grid'));
  }
  finish.dispose();
  assert.equal(parent.children.length,0);
});
