/**
 * V4.4 — anatomical finishing pass for the canonical human wireframe.
 * Adds expressive eyes, contoured ears, cheekbones and neck/shoulder silhouette.
 * All geometry is local; no assets, external calls or audio capture.
 */
export function createFacialFinishing(THREE, root, faceVertices) {
  const objects = [];
  const materials = [];
  const geometries = [];
  const addGeometry = g => {geometries.push(g);return g;};
  const addMaterial = m => {materials.push(m);return m;};
  const rgba = (color, opacity=.65, depthTest=true) =>
    addMaterial(new THREE.LineBasicMaterial({
      color,transparent:true,opacity,depthTest,depthWrite:false,
      blending:THREE.AdditiveBlending
    }));
  const curve = (coords, {color=0x55dffc, opacity=.5, steps=32, depthTest=true}={}) => {
    const pts=coords.map(p=>new THREE.Vector3(...p));
    const path=new THREE.CatmullRomCurve3(pts,false,'centripetal');
    const geometry=addGeometry(new THREE.BufferGeometry().setFromPoints(path.getPoints(steps)));
    const line=new THREE.Line(geometry,rgba(color,opacity,depthTest));
    line.renderOrder=4;root.add(line);objects.push(line);
    return line;
  };
  const dynamicLine = (ids,color,opacity=.6) => {
    const pts=new Float32Array(ids.length*3);
    const geo=addGeometry(new THREE.BufferGeometry());
    geo.setAttribute('position',new THREE.BufferAttribute(pts,3).setUsage(THREE.DynamicDrawUsage));
    const line=new THREE.Line(geo,rgba(color,opacity,false));
    line.renderOrder=6;root.add(line);objects.push(line);
    return {ids,pts,geo,line};
  };
  const dynamicContours=[
    // Brow sweeps refine the forehead and reinforce eye placement.
    dynamicLine([70,63,105,66,107],0x75e7ff,.43),
    dynamicLine([300,293,334,296,336],0x75e7ff,.43),
    // Upper cheeks and nasolabial lines: anatomical mesh landmarks.
    dynamicLine([116,117,118,119,120,121,128],0x4fcce9,.34),
    dynamicLine([345,346,347,348,349,350,357],0x4fcce9,.34),
    // Jaw and chin ridge, stronger silhouette than cheek triangulation.
    dynamicLine([234,93,132,58,172,136,150,149,176,148,152,377,400,378,379,365,397,288,361,323,454],0x6feeff,.48),
    // Side profile from temples to cheekbones.
    dynamicLine([127,234,93,132,58],0x2ebae0,.28),
    dynamicLine([356,454,323,361,288],0x2ebae0,.28),
    // Outer lip ridges and inner seam follow the deformed mouth landmarks.
    dynamicLine([61,40,39,37,0,267,269,270,291],0xb0f7ff,.66),
    dynamicLine([61,146,91,181,17,405,321,375,291],0x66d9fa,.64),
    dynamicLine([78,95,88,178,87,14,317,402,318,324,308],0x46b6dd,.28),
    // Temple, cheekbone and forehead depth cues (no additional solid surface).
    dynamicLine([162,21,54,103,67,109,10,338,297,332,284,251],0x39bfe6,.20),
    dynamicLine([123,116,117,118,119,120,121,128],0x2caaca,.30),
    dynamicLine([352,345,346,347,348,349,350,357],0x2caaca,.30)
  ];

  // Procedural auricles based on proper ocular/nasal height, rather than flat circles.
  // Each ear has helix, antihelix, concha, and lower lobe.
  for (const side of [-1,1]) {
    const xy=(x,y,z=-.75)=>[x*side,y,z];
    curve([
      xy(6.83,2.48),xy(7.28,3.14,-1.12),xy(8.04,2.94,-1.35),
      xy(8.40,2.12,-1.18),xy(8.54,.68,-1.04),xy(8.30,-.52,-.98),
      xy(8.28,-1.86,-.75),xy(7.88,-2.95,-.55),xy(7.19,-3.10,-.30),
      xy(6.83,-2.38,-.17)
    ],{color:0x6cecff,opacity:.78,steps:54});
    curve([
      xy(7.17,2.12,-.62),xy(7.78,1.95,-.72),xy(7.98,1.23,-.53),
      xy(7.67,.36,-.35),xy(7.95,-.23,-.46),xy(7.78,-1.54,-.47),
      xy(7.39,-2.22,-.24)
    ],{color:0x41c7ef,opacity:.51});
    curve([
      xy(7.36,.95,-.33),xy(7.23,-.01,-.17),xy(7.54,-.67,-.22),
      xy(7.17,-1.32,-.17),xy(7.06,-1.81,-.21)
    ],{color:0x4ee9fa,opacity:.40});
    curve([
      xy(6.83,-.35,.05),xy(7.02,-.68,.07),xy(7.12,-1.1,-.02)
    ],{color:0x8ce8fa,opacity:.38,steps:14});
  }

  // Refined neck with medial tendons and low-profile collarbones.
  for(const side of [-1,1]) {
    curve([
      [side*2.45,-8.14,1.08],[side*2.59,-8.87,.83],
      [side*3.01,-10.12,.72],[side*3.66,-12.22,.22],
      [side*6.45,-13.46,-.05],[side*8.65,-13.95,-1.45]
    ],{color:0x45d2f3,opacity:.46,steps:38});
    curve([
      [side*1.28,-8.86,1.65],[side*1.62,-10.30,1.51],
      [side*1.90,-11.75,1.13],[side*3.02,-12.65,.80]
    ],{color:0x249ebf,opacity:.36,steps:30});
    curve([
      [side*.23,-12.34,1.2],[side*1.3,-12.70,.98],
      [side*3.55,-12.80,.46],[side*5.55,-13.42,-.13]
    ],{color:0x56def3,opacity:.33});
  }

  // Iris rings are finer than the 3D mesh, but sit over the anatomical eye sockets.
  // Each eye is drawn on its own plane at the local face depth.
  const eyes=[];
  for(const side of [-1,1]){
    const cx=side*3.22, cy=2.64, cz=4.14;
    const iris=new THREE.Group();
    iris.position.set(cx,cy,cz+.22);
    const ring=(radiusX,radiusY,color,alpha)=>{
      const pts=[];
      for(let i=0;i<=40;i++){
        const t=i*Math.PI*2/40;
        pts.push(new THREE.Vector3(Math.cos(t)*radiusX,Math.sin(t)*radiusY,0));
      }
      const geo=addGeometry(new THREE.BufferGeometry().setFromPoints(pts));
      const line=new THREE.Line(geo,rgba(color,alpha,false));
      iris.add(line);objects.push(line);return line;
    };
    ring(.43,.34,0x7dedff,.78);
    ring(.26,.25,0x32bfe7,.65);
    ring(.10,.10,0xc0faff,.48);
    const glint=addGeometry(new THREE.SphereGeometry(.08,6,6));
    const dot=new THREE.Mesh(glint,addMaterial(new THREE.MeshBasicMaterial({
      color:0xc2f9ff,transparent:true,opacity:.86,depthWrite:false
    })));
    dot.position.set(-.095,.10,.08);iris.add(dot);objects.push(dot);
    root.add(iris);objects.push(iris);
    eyes.push(iris);
  }

  // Nose bridge accent follows the actual landmark positions, not a drawn triangle.
  const noseHighlight=dynamicLine([168,6,197,195,5,4,1],0x70dfff,.35);
  const eyeSocketGlow = addMaterial(new THREE.MeshBasicMaterial({
    color:0x41ddff,transparent:true,opacity:.04,depthWrite:false,
    blending:THREE.AdditiveBlending,side:THREE.DoubleSide
  }));
  for (const side of [-1,1]){
    const patch=addGeometry(new THREE.CircleGeometry(.78,24));
    const mesh=new THREE.Mesh(patch,eyeSocketGlow);
    mesh.position.set(side*3.20,2.62,3.98);
    root.add(mesh);objects.push(mesh);
  }

  function update({working, time=0, expression='neutral', speaking=false,
    mouthOpen=0, blink=0, attention=0, thinking=0, reducedMotion=false}) {
    for(const f of [...dynamicContours,noseHighlight]){
      for(let j=0;j<f.ids.length;j++){
        const idx=f.ids[j]*3,k=j*3;
        f.pts[k]=working[idx];f.pts[k+1]=working[idx+1];f.pts[k+2]=working[idx+2]+.052;
      }
      f.geo.attributes.position.needsUpdate=true;
    }
    // Iris remains within the eye socket; subtle attention/gaze changes.
    const gaze=reducedMotion?0:Math.sin(time*.53)*.045;
    for (const [i,eye] of eyes.entries()) {
      eye.scale.y=Math.max(.12,1-.86*blink-(expression==='happy'?.12:0));
      eye.position.y=2.64+(expression==='surprised'?.06:0)+(attention*.028);
      eye.position.x=(i===0?-3.22:3.22)+gaze;
      eye.rotation.y= (i===0 ? .025:-.025) + thinking*.028;
      eye.scale.x=1+attention*.023;
    }
    eyeSocketGlow.opacity=expression==='listening'?.10:.046;
    // Mouth contour luminance follows actual opening and helps read speech.
    const lipBrightness=.06+mouthOpen*.08;
    for(const lip of dynamicContours.slice(7,10)) lip.line.material.opacity=.44+lipBrightness;
  }
  function dispose() {
    for(const o of objects)o.parent?.remove(o);
    for(const g of geometries)g.dispose();
    for(const m of materials)m.dispose();
  }
  return {update,dispose};
}
