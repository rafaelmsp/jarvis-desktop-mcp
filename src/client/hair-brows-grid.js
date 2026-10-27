import {createYouthfulHairProfile} from './hair-youth-profile.js';
import {createHairFauxDepth} from './hair-faux-depth.js';

/**
 * JARVIS V5 — cabelo masculino curto e sobrancelhas volumétricas em grid 3D.
 * Referência: cabelo com topete curto penteado para trás, sem textura/fotografia.
 * As sobrancelhas seguem os landmarks já deformados pelo rig em cada quadro.
 * Construído apenas uma vez, sem cálculos pesados de tesselação por frame.
 */
const lerp=(a,b,t)=>a+(b-a)*t;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const HAIRLINE=[54,103,67,109,10,338,297,332,284];
const BROWS=[
  {side:'left',top:[70,63,105,66,107],bottom:[46,53,52,65,55]},
  {side:'right',top:[300,293,334,296,336],bottom:[276,283,282,295,285]}
];
export function createHairBrowsGrid(THREE,root,baseVertices){
  if(!(baseVertices instanceof Float32Array)||baseVertices.length!==468*3)
    throw Error('Hair/eyebrows exigem 468 landmarks faciais');
  const group=new THREE.Group();group.name='jarvis-hair-brows-grid';root.add(group);
  const hair=new THREE.Group();hair.name='jarvis-short-hair-grid';group.add(hair);
  const eyebrows=new THREE.Group();eyebrows.name='jarvis-expressive-brows-grid';group.add(eyebrows);
  const geometries=new Set(),materials=new Set();
  const geo=g=>(geometries.add(g),g);
  const mat=m=>(materials.add(m),m);
  const wires=(color,opacity)=>mat(new THREE.LineBasicMaterial({
    color,transparent:true,opacity,depthTest:true,depthWrite:false,
    blending:THREE.AdditiveBlending
  }));
  const hairWire=wires(0x41b8dc,.44),hairThreads=wires(0x8feeff,.69);
  const sideWire=wires(0x46cbe8,.43),browWire=wires(0x92edff,.69);
  const hairVolume=mat(new THREE.MeshBasicMaterial({
    color:0x125773,side:THREE.DoubleSide,transparent:true,
    depthWrite:false,opacity:.17
  }));
  const browVolume=mat(new THREE.MeshBasicMaterial({
    color:0x10516d,side:THREE.DoubleSide,transparent:true,
    depthWrite:false,opacity:.25
  }));
  const read=(vertices,i)=>[vertices[i*3],vertices[i*3+1],vertices[i*3+2]];
  const pointOn=(array,t)=>{
    const v=clamp(t,0,1)*(array.length-1),i=Math.min(array.length-2,Math.floor(v));
    const f=v-i;
    return [lerp(array[i][0],array[i+1][0],f),
      lerp(array[i][1],array[i+1][1],f),
      lerp(array[i][2],array[i+1][2],f)];
  };
  const line=(pts,container,material,name,steps=28)=>{
    const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const geometry=geo(new THREE.BufferGeometry().setFromPoints(curve.getPoints(steps)));
    const obj=new THREE.Line(geometry,material);
    obj.name=name;obj.renderOrder=4;container.add(obj);
    return obj;
  };
  const segments=(coords,container,material,name)=>{
    const geometry=geo(new THREE.BufferGeometry());
    geometry.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
    const obj=new THREE.LineSegments(geometry,material);
    obj.name=name;obj.renderOrder=3;container.add(obj);return obj;
  };
  const shell=(positions,indices,container,material,name,dynamic=false)=>{
    const geometry=geo(new THREE.BufferGeometry());
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3).setUsage(
      dynamic?THREE.DynamicDrawUsage:THREE.StaticDrawUsage));
    geometry.setIndex(indices);
    const obj=new THREE.Mesh(geometry,material);
    obj.name=name;obj.renderOrder=1;obj.frustumCulled=false;container.add(obj);
    return obj;
  };
  // Juventude: topete assimetrico de volume leve e mechas com fluxo diagonal.
  const youthfulProfile=createYouthfulHairProfile(baseVertices);
  const hairAt=youthfulProfile.sample;
  // Malha cortical superior: 23 colunas x 13 faixas com triangulação fina.
  const columns=22,rows=12,scalp=[],faces=[],struts=[];
  for(let r=0;r<=rows;r++){
    const v=r/rows;
    for(let c=0;c<=columns;c++){
      const u=2*c/columns-1;
      scalp.push(...hairAt(u,v));
    }
  }
  const join=(i,j)=>{
    struts.push(...scalp.slice(i*3,i*3+3),...scalp.slice(j*3,j*3+3));
  };
  for(let r=0;r<=rows;r++){
    for(let c=0;c<=columns;c++){
      const i=r*(columns+1)+c;
      if(c>0)join(i-1,i);
      if(r>0){
        join(i-(columns+1),i);
        if(c>0){
          const a=i-(columns+2),b=i-(columns+1),d=i-1;
          faces.push(a,b,d,b,i,d);
          if((c+r)%3===0)join(a,i);
        }
      }
    }
  }
  shell(new Float32Array(scalp),faces,hair,hairVolume,'hair-short-swept-scalp-volume');
  segments(struts,hair,hairWire,'hair-anatomical-wiregrid');

  // Discrete filaments follow the skull from the hairline toward the crown.
  // Variations create a brushed-back quiff, not parallel spaghetti strands.
  const filamentCount=37;
  for(let i=0;i<filamentCount;i++){
    const u=-.96+1.92*i/(filamentCount-1);
    const jitter=.016*Math.sin(i*9.13);
    const steps=[0,.13,.29,.48,.66,.87,1];
    const pts=steps.map((t,k)=>{
      return youthfulProfile.filament(
        clamp(u+jitter+.042*Math.sin(i*.47+t*4)*t,-1,1),t,i);
    });
    line(pts,hair,i%4===0?hairThreads:hairWire,'hair-brushed-strand-'+i,36);
  }
  for(let row=1;row<=6;row++){
    const v=row/8,pts=[];
    for(let i=0;i<=16;i++){
      const u=-.95+1.9*i/16;
      const p=hairAt(u,v);
      p[1]+=.06*Math.sin(i*.95+row);
      pts.push(p);
    }
    line(pts,hair,hairWire,'hair-short-layer-'+row,50);
  }
  // Pequenas pontas texturizadas na franja reforcam o topete moderno.
  for(let i=0;i<9;i++){
    const u=-.79+i*.194,pts=[];
    for(let j=0;j<=5;j++){
      const v=j/5*.30,p=hairAt(u+.018*Math.sin(i*1.7+j*.7),v);
      p[1]+=.18*Math.sin(Math.PI*j/5);
      p[2]+=.17*Math.sin(Math.PI*j/5);
      pts.push(p);
    }
    line(pts,hair,hairThreads,'hair-youthful-front-tip-'+i,18);
  }
  // Têmporas limpas e laterais curtas acima das orelhas, sem cobri-las.
  for(const side of [-1,1]){
    const sideName=side<0?'left':'right';
    for(let i=0;i<6;i++){
      const t=i/5;
      line([
        [side*(6.23+.12*t),7.23-.30*t,1.50-1.0*t],
        [side*(6.58+.14*t),6.57-.32*t,1.03-.85*t],
        [side*(6.80+.15*t),5.65-.34*t,.36-.55*t],
        [side*(6.81+.13*t),4.70-.28*t,-.34-.50*t]
      ],hair,sideWire,'hair-'+sideName+'-short-temple-'+i,22);
    }
  }
  // Falso 3D em camadas translucidas: sem texturas, sem shader e sem custos por frame.
  const fauxDepth=createHairFauxDepth(THREE,hair,hairAt);
  // Curved wire-volume eyebrows anchored to upper/lower MediaPipe landmarks.
  // Each expression modifies working landmarks; no separate facial animation.
  const browSets=[];
  const divisions=24,layers=4;
  const connections=[],triangles=[];
  const stride=layers+1;
  for(let i=0;i<=divisions;i++){
    for(let j=0;j<=layers;j++){
      const a=i*stride+j;
      if(i<divisions)connections.push(a,(i+1)*stride+j);
      if(j<layers)connections.push(a,a+1);
      if(i<divisions&&j<layers){
        const b=(i+1)*stride+j;
        triangles.push(a,b,a+1,b,b+1,a+1);
        if((i+j)%3===0)connections.push(a,b+1);
      }
    }
  }
  for(const config of BROWS){
    const positions=new Float32Array((divisions+1)*stride*3);
    const mesh=shell(positions,triangles,eyebrows,browVolume,
      'brow-'+config.side+'-expressive-volume',true);
    const wiresPosition=new Float32Array(connections.length*3);
    const wireGeom=geo(new THREE.BufferGeometry());
    wireGeom.setAttribute('position',new THREE.BufferAttribute(wiresPosition,3)
      .setUsage(THREE.DynamicDrawUsage));
    const wire=new THREE.LineSegments(wireGeom,browWire);
    wire.name='brow-'+config.side+'-swept-wiregrid';
    wire.renderOrder=6;eyebrows.add(wire);
    browSets.push({config,positions,mesh,wiresPosition,wireGeom});
  }
  let lastWorking=baseVertices;
  function update({working=lastWorking,natural=true,reducedMotion=false,
    surprise=0,alert=0,thinking=0}={}){
    if(!(working instanceof Float32Array)||working.length!==baseVertices.length)
      throw Error('Hair/brow update requer a malha facial deformada');
    lastWorking=working;
    hairVolume.opacity=natural?.17:.075;
    hairWire.opacity=natural?.44:.57;
    hairThreads.opacity=natural?.69:.75;
    sideWire.opacity=natural?.43:.59;
    fauxDepth.update({natural});
    browVolume.opacity=natural?.25:.08;
    browWire.opacity=natural?.69:.78;
    for(const b of browSets){
      const tops=b.config.top.map(i=>read(working,i));
      const bottoms=b.config.bottom.map(i=>read(working,i));
      for(let i=0;i<=divisions;i++){
        const t=i/divisions;
        const top=pointOn(tops,t),bottom=pointOn(bottoms,t);
        const taper=clamp(Math.sin(Math.PI*t)*2.7,0,1);
        // Primary pose already bends the brow in facial-rig; only modest extra.
        const lift=reducedMotion?0:surprise*.065-alert*.042+thinking*.020;
        const midY=(top[1]+bottom[1])*.5+lift;
        const thickness=Math.max(.18,top[1]-bottom[1])*.48*taper;
        const frontZ=Math.max(top[2],bottom[2])+.10;
        for(let j=0;j<=layers;j++){
          const v=j/layers,idx=(i*stride+j)*3;
          b.positions[idx]=lerp(top[0],bottom[0],v);
          b.positions[idx+1]=midY+(1-2*v)*thickness;
          b.positions[idx+2]=frontZ+.09*Math.sin(Math.PI*v);
        }
      }
      b.mesh.geometry.attributes.position.needsUpdate=true;
      for(let k=0;k<connections.length;k++){
        const idx=connections[k]*3,dst=k*3;
        b.wiresPosition[dst]=b.positions[idx];
        b.wiresPosition[dst+1]=b.positions[idx+1];
        b.wiresPosition[dst+2]=b.positions[idx+2]+.022;
      }
      b.wireGeom.attributes.position.needsUpdate=true;
    }
  }
  update({working:baseVertices,reducedMotion:true});
  const stats=Object.freeze({
    hairRows:rows+1,hairColumns:columns+1,
    hairVertices:scalp.length/3,hairTriangles:faces.length/3,
    brushedStrands:filamentCount,templeStrands:12,
    youthfulFrontTips:9,style:youthfulProfile.style,
    ...fauxDepth.getStats(),
    brows:2,browVerticesPerSide:(divisions+1)*stride,
    animatedBrowVertices:2*(divisions+1)*stride
  });
  function dispose(){
    fauxDepth.dispose();
    group.parent?.remove(group);
    for(const g of geometries)g.dispose();
    for(const m of materials)m.dispose();
  }
  return {update,dispose,getStats:()=>stats,group};
}
