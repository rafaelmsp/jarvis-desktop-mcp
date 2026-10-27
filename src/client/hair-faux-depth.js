/**
 * Low-cost faux 3D: translucent depth sheets, a darker root silhouette,
 * and separated cyan glints give visual thickness without hair textures.
 * Geometry is allocated once; no shader, texture, audio or frame-time rebuild.
 */
export function createHairFauxDepth(THREE,parent,sample){
  if(typeof sample!=='function')throw Error('Sample function required');
  const group=new THREE.Group();group.name='jarvis-hair-faux-3d';
  parent.add(group);
  const geos=[],mats=[],layers=[];
  const gridColumns=18,gridRows=8;
  function layer(name,offset,color,opacity,renderOrder){
    const vertices=[],indices=[];
    for(let row=0;row<=gridRows;row++){
      const v=row/gridRows;
      for(let col=0;col<=gridColumns;col++){
        const u=col/gridColumns*2-1;
        const p=sample(u,v);
        vertices.push(p[0]*(1+offset*.004),p[1]+offset*.13,p[2]+offset);
      }
    }
    for(let row=0;row<gridRows;row++){
      for(let col=0;col<gridColumns;col++){
        const a=row*(gridColumns+1)+col,b=a+gridColumns+1;
        indices.push(a,b,a+1,a+1,b,b+1);
      }
    }
    const geom=new THREE.BufferGeometry();
    geom.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));
    geom.setIndex(indices);geom.computeVertexNormals();geos.push(geom);
    const material=new THREE.MeshBasicMaterial({
      color,transparent:true,opacity,depthWrite:false,
      side:THREE.DoubleSide,polygonOffset:true,
      polygonOffsetFactor:1,polygonOffsetUnits:1
    });mats.push(material);
    const mesh=new THREE.Mesh(geom,material);
    mesh.name=name;mesh.renderOrder=renderOrder;mesh.frustumCulled=false;
    group.add(mesh);layers.push({mesh,material,baseOpacity:opacity});
  }
  // Shadow under the grid, mid-tone body and very transparent clear cyan top.
  layer('hair-faux-depth-shadow',-.36,0x05324a,.33,0);
  layer('hair-faux-depth-midtone',-.09,0x126b87,.13,1);
  layer('hair-faux-depth-cyan-sheen',.13,0x69d9ed,.055,2);
  const highlights=new THREE.LineBasicMaterial({
    color:0x8deaff,transparent:true,opacity:.40,
    depthWrite:false,blending:THREE.AdditiveBlending
  });mats.push(highlights);
  const shadowStrokes=new THREE.LineBasicMaterial({
    color:0x064566,transparent:true,opacity:.30,depthWrite:false
  });mats.push(shadowStrokes);
  for(let i=0;i<12;i++){
    const u=-.88+1.76*i/11,pts=[],shadow=[];
    for(let j=0;j<=18;j++){
      const v=.09+.67*j/18;
      const p=sample(u+.038*Math.sin(i*.59+v*2)*v,v);
      pts.push(new THREE.Vector3(p[0],p[1]+.055,p[2]+.21));
      shadow.push(new THREE.Vector3(p[0]+.07,p[1]-.07,p[2]-.23));
    }
    for(const [kind,coords,material,order] of [
      ['highlight',pts,highlights,5],
      ['root-shadow',shadow,shadowStrokes,2]
    ]){
      const g=new THREE.BufferGeometry().setFromPoints(coords);geos.push(g);
      const line=new THREE.Line(g,material);
      line.name='hair-faux-'+kind+'-'+i;line.renderOrder=order;group.add(line);
    }
  }
  function update({natural=true}={}){
    for(const {material,baseOpacity} of layers)
      material.opacity=baseOpacity*(natural?1:.38);
    highlights.opacity=natural?.40:.26;
    shadowStrokes.opacity=natural?.30:.24;
  }
  function dispose(){
    group.parent?.remove(group);
    for(const geom of geos)geom.dispose();
    for(const material of mats)material.dispose();
  }
  return {update,dispose,group,getStats:()=>({
    fauxLayers:layers.length,highlightPairs:12,
    triangles:3*gridRows*gridColumns*2,textureFree:true
  })};
}
