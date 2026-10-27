/**
 * Procedural barber-cut details for JARVIS's blue wireframe head.
 * Tall pointy clumps, tight tapered sides and ONE side-shaved curved part.
 * Geometry allocated once. No photos, meshes from uploads or audio work.
 */
export function createUprightHairFade(THREE,hairRoot,sample){
  const group=new THREE.Group();group.name='jarvis-spiky-high-fade-cut';hairRoot.add(group);
  const geos=[],mats=[];
  const mkMaterial=(color,opacity)=>{const m=new THREE.LineBasicMaterial({
    color,opacity,transparent:true,depthTest:true,depthWrite:false,
    blending:THREE.AdditiveBlending
  });mats.push(m);return m};
  const highlights=mkMaterial(0xa5f2ff,.74);
  const shadows=mkMaterial(0x217995,.42);
  const fadeLine=mkMaterial(0x40c6e3,.36);
  const blades=mkMaterial(0x53d5f2,.61);
  const makeSegments=(coords,material,name)=>{
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(coords,3));
    geos.push(geo);
    const lines=new THREE.LineSegments(geo,material);
    lines.name=name;lines.renderOrder=5;group.add(lines);
    return lines;
  };
  const makeCurve=(points,name,material,steps=42)=>{
    const path=new THREE.CatmullRomCurve3(
      points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    const geom=new THREE.BufferGeometry().setFromPoints(path.getPoints(steps));
    geos.push(geom);
    const line=new THREE.Line(geom,material);
    line.name=name;line.renderOrder=6;group.add(line);
    return line;
  };
  // Fine directional spikes with different heights, all projected outward from
  // the same scalp. Triangles and branches avoid flat saw-tooth repetition.
  const spikeEdges=[],spikeHighlights=[];
  for(let i=0;i<39;i++){
    const t=i/38,u=-.91+1.82*t;
    const v=.22+.28*(.5+.5*Math.sin(i*2.91));
    const root=sample(u,v-.085),base=sample(u+.020,v+.075);
    const tip=sample(u-.025+.042*Math.sin(i*1.47),v);
    const height=(.40+.69*Math.pow(Math.sin(i*2.13),2))*(.57+.43*(1-Math.abs(u)));
    tip[1]+=height;tip[0]+=.13*Math.sin(i*1.11);tip[2]+=.07;
    const width=.09+.065*(.5+.5*Math.sin(i*3.15));
    const first=[root[0]-width,root[1]-.04,root[2]-.09];
    const second=[root[0]+width,root[1]-.04,root[2]-.09];
    spikeEdges.push(...first,...tip,...tip,...second,...tip,...base);
    if(i%2===0)spikeHighlights.push(...tip,...base);
  }
  makeSegments(spikeEdges,blades,'hair-upright-spike-clumps');
  makeSegments(spikeHighlights,highlights,'hair-upright-illuminated-tips');

  // Gradient fade: very sparse stubble at ear level, denser near the crown.
  // The wire strands get shorter down the sides, never covering the auricle.
  for(const side of [-1,1]){
    const fade=[],gradients=[];
    for(let band=0;band<12;band++){
      const y=3.42+band*.325;
      const strength=band/11;
      for(let n=0;n<19;n++){
        const depth=n/18,angle=n*1.618+band*.7;
        const radius=6.63+.14*depth+.13*Math.sin(depth*3.1);
        const x=side*(radius+.035*Math.sin(angle));
        const z=1.45-3.9*depth;
        const length=.04+.24*Math.pow(strength,1.6);
        const p=[x,y,z];
        const q=[x+side*.015,y+length,z-.04];
        fade.push(...p,...q);
        if(band>6&&n%4===0)gradients.push(...q,x+side*.02,y+length+.09,z-.09);
      }
    }
    makeSegments(fade,fadeLine,
      'hair-'+(side<0?'left':'right')+'-skin-fade-gradient');
    makeSegments(gradients,shadows,
      'hair-'+(side<0?'left':'right')+'-upper-fade-shadow');
  }
  // The exact photo has a sweeping shaved razor part ABOVE THE RIGHT EAR.
  // This side is deliberately not mirrored, to preserve the asymmetric cut.
  const stripe=[
    [5.90,7.34,1.58],[6.21,7.02,1.34],[6.48,6.80,.92],
    [6.72,6.47,.36],[6.84,6.12,-.30],[6.91,5.80,-.85],
    [7.00,5.60,-1.32]
  ];
  const darkPart=new THREE.MeshBasicMaterial({
    color:0x061826,transparent:true,opacity:.93,
    depthWrite:false,depthTest:false
  });mats.push(darkPart);
  const partCurve=new THREE.CatmullRomCurve3(
    stripe.map(p=>new THREE.Vector3(...p)),false,'centripetal');
  const partGeometry=new THREE.TubeGeometry(partCurve,32,.077,4,false);
  geos.push(partGeometry);
  const strip=new THREE.Mesh(partGeometry,darkPart);
  strip.name='hair-right-shaved-razor-part';
  strip.renderOrder=7;group.add(strip);
  makeCurve(stripe.map(p=>[p[0]-.025,p[1]+.065,p[2]+.01]),
    'hair-right-shaved-part-rim',highlights,38);
  const info=Object.freeze({spikeClumps:39,fadeBands:12,
    shavedSide:'right',shavedPart:true,
    materialType:'cyan-wireframe'});
  function update({natural=true}={}){
    highlights.opacity=natural?.74:.59;
    shadows.opacity=natural?.42:.48;
    fadeLine.opacity=natural?.36:.47;
    blades.opacity=natural?.61:.68;
    darkPart.opacity=natural?.93:.72;
  }
  function dispose(){
    group.parent?.remove(group);
    for(const g of geos)g.dispose();
    for(const m of mats)m.dispose();
  }
  return {update,dispose,getStats:()=>info,group};
}
