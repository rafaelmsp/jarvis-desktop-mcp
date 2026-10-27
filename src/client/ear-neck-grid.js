/**
 * JARVIS — malha auricular e cervical procedural.
 * Grid 3D azul, não foto, textura nem skin humano fotorrealista.
 * Orelhas: hélice, anti-hélice, concha, trago, antítrago e lóbulo.
 * Pescoço: superfície frontal, músculos ECM, tendões, trapézio e clavículas.
 * Geometry built once; all geometry and materials are explicitly disposed.
 */
const lerp=(a,b,t)=>a+(b-a)*t;
export function createEarNeckGrid(THREE,root){
  const group=new THREE.Group();
  group.name='jarvis-anatomical-ear-neck-grid';
  root.add(group);
  const earGroup=new THREE.Group(),neckGroup=new THREE.Group();
  earGroup.name='jarvis-ear-grid';neckGroup.name='jarvis-neck-grid';
  group.add(earGroup,neckGroup);
  const geometries=new Set(),materials=new Set();
  const geometry=g=>(geometries.add(g),g);
  const material=m=>(materials.add(m),m);
  const cyan=(color,opacity)=>
    material(new THREE.LineBasicMaterial({color,transparent:true,opacity,
      depthTest:true,depthWrite:false,blending:THREE.AdditiveBlending}));
  const earLines=cyan(0x76e7ff,.69);
  const earDetails=cyan(0x3abada,.50);
  const neckLines=cyan(0x3ab9da,.34);
  const neckDetails=cyan(0x79e5f6,.49);
  const earSkin=material(new THREE.MeshStandardMaterial({
    color:0x17718c,emissive:0x073249,emissiveIntensity:.30,
    roughness:.74,metalness:.04,side:THREE.DoubleSide,
    transparent:true,opacity:.19,depthWrite:false
  }));
  const neckSkin=material(new THREE.MeshStandardMaterial({
    color:0x166782,emissive:0x042f43,emissiveIntensity:.22,
    roughness:.82,metalness:.02,side:THREE.DoubleSide,
    transparent:true,opacity:.13,depthWrite:false
  }));
  const lineSegments=(positions,into,mat,name)=>{
    const g=geometry(new THREE.BufferGeometry());
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    const line=new THREE.LineSegments(g,mat);
    line.name=name;line.renderOrder=3;
    into.add(line);return line;
  };
  const lineCurve=(positions,into,mat,name,closed=false,steps=40)=>{
    const spline=new THREE.CatmullRomCurve3(positions.map(p=>new THREE.Vector3(...p)),closed,'centripetal');
    const g=geometry(new THREE.BufferGeometry().setFromPoints(spline.getPoints(steps)));
    const line=new THREE.Line(g,mat);
    line.name=name;line.renderOrder=4;
    into.add(line);return line;
  };
  const surface=(points,faces,into,mat,name)=>{
    const g=geometry(new THREE.BufferGeometry());
    g.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
    g.setIndex(faces);
    g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,mat);
    mesh.name=name;mesh.renderOrder=1;mesh.frustumCulled=false;
    into.add(mesh);
    return mesh;
  };

  // Shell: measured-like asymmetric silhouette. All layers follow one closed 3D
  // anatomical profile, not flat decorative elliptical circles.
  const earOutline=[
    [6.85,2.40,-1.12],[7.08,2.87,-1.16],[7.53,3.18,-1.10],
    [7.95,3.09,-.94],[8.28,2.75,-.82],[8.47,2.13,-.76],
    [8.57,1.25,-.68],[8.54,.30,-.57],[8.41,-.70,-.48],
    [8.20,-1.54,-.43],[7.96,-2.30,-.32],[7.59,-2.98,-.25],
    [7.21,-2.95,-.17],[6.97,-2.47,-.13],[6.87,-1.65,-.30],
    [6.86,-.67,-.52],[6.82,.48,-.80],[6.77,1.57,-1.00]
  ];
  for(const side of [-1,1]){
    const mirror=coords=>coords.map(p=>[side*p[0],p[1],p[2]]);
    const outerCurve=new THREE.CatmullRomCurve3(
      mirror(earOutline).map(p=>new THREE.Vector3(...p)),true,'centripetal');
    const segments=48,layers=[
      {sx:1,sy:1,dz:0},{sx:.86,sy:.90,dz:.30},
      {sx:.62,sy:.71,dz:.40},{sx:.36,sy:.48,dz:-.01},
      {sx:.12,sy:.18,dz:-.40}
    ];
    const vertices=[],faces=[],web=[],contours=[];
    for(const layer of layers){
      const ring=[];
      for(let j=0;j<segments;j++){
        const p=outerCurve.getPoint(j/segments);
        const x=side*lerp(7.43,Math.abs(p.x),layer.sx);
        const y=lerp(-.08,p.y,layer.sy);
        const z=p.z+layer.dz;
        ring.push([x,y,z]);vertices.push(x,y,z);
      }
      contours.push(ring);
    }
    for(let k=0;k<layers.length;k++){
      const ring=contours[k];
      for(let j=0;j<segments;j++){
        const a=ring[j],b=ring[(j+1)%segments];
        web.push(...a,...b);
      }
      if(k<layers.length-1){
        for(let j=0;j<segments;j++){
          const a=k*segments+j,b=k*segments+(j+1)%segments;
          const c=(k+1)*segments+j,dd=(k+1)*segments+(j+1)%segments;
          faces.push(a,b,c,b,dd,c);
          if(j%3===0)web.push(...contours[k][j],...contours[k+1][j]);
        }
      }
    }
    const which=side<0?'left':'right';
    surface(vertices,faces,earGroup,earSkin,'ear-'+which+'-cartilage-surface');
    lineSegments(web,earGroup,earLines,'ear-'+which+'-radial-grid');
    // The antihelix forks near the superior crus, curls around the concha.
    const details=[
      [[6.96,2.15,-.68],[7.40,2.48,-.35],[7.74,2.12,-.18],
       [7.93,1.41,-.12],[7.70,.73,.03],[7.88,-.05,.16],
       [7.66,-.88,.27],[7.45,-1.63,.15],[7.37,-2.19,-.05]],
      [[7.24,1.80,-.23],[7.15,1.22,-.10],[7.05,.55,-.02],
       [7.23,-.10,.14],[7.48,-.62,.21]],
      [[7.10,.48,.17],[7.37,.61,.37],[7.52,.09,.41],
       [7.38,-.67,.18],[7.16,-1.18,.06]],
      // Tragus and antitragus, with a concha opening between them.
      [[6.87,-.45,-.35],[7.13,-.62,.23],[7.31,-.97,.32],
       [7.11,-1.29,.17]],
      [[7.46,-1.92,.04],[7.69,-2.19,.21],[7.59,-2.50,.08],
       [7.30,-2.75,-.07]]
    ];
    const detailNames=['antihelix','superior-crus','concha-bowl','tragus','antitragus'];
    details.forEach((coords,i)=>lineCurve(mirror(coords),earGroup,earDetails,
      'ear-'+which+'-'+detailNames[i],false,24));
    lineCurve(mirror([
      [6.55,2.65,-1.55],[6.87,2.35,-1.03],[6.94,1.73,-.74]
    ]),earGroup,earDetails,'ear-'+which+'-temple-attachment',false,16);
    lineCurve(mirror([
      [6.72,-1.85,-.66],[6.92,-2.24,-.22],[7.20,-2.93,-.15],
      [7.04,-3.20,-.53],[6.61,-3.55,-.91]
    ]),earGroup,earDetails,'ear-'+which+'-lobe-jaw-transition',false,22);
  }

  // An open anterior cervical shell avoids the old synthetic cylinder;
  // six different cross-sections taper below the jaw and fan toward shoulders.
  const profiles=[
    {y:-8.22,rx:2.28,zc:-1.49,rz:2.70},
    {y:-8.87,rx:2.35,zc:-1.56,rz:2.73},
    {y:-9.63,rx:2.41,zc:-1.64,rz:2.76},
    {y:-10.40,rx:2.53,zc:-1.76,rz:2.79},
    {y:-11.20,rx:2.70,zc:-1.83,rz:2.79},
    {y:-12.03,rx:3.05,zc:-1.90,rz:2.76},
    {y:-12.90,rx:3.65,zc:-2.02,rz:2.57},
    {y:-13.51,rx:4.72,zc:-2.24,rz:2.21}
  ];
  const columns=18,neckVertices=[],neckFaces=[],neckWeb=[];
  for(let i=0;i<profiles.length;i++){
    const p=profiles[i];
    for(let j=0;j<=columns;j++){
      const a=Math.PI*j/columns;
      const x=p.rx*Math.cos(a);
      const shape=.10*Math.cos(2*a)-.055*Math.cos(4*a);
      const z=p.zc+Math.sin(a)*p.rz+shape;
      neckVertices.push(x,p.y,z);
      if(j>0){
        const a0=neckVertices.slice(neckVertices.length-6,neckVertices.length-3);
        neckWeb.push(...a0,x,p.y,z);
      }
      if(i>0){
        const prev=(i-1)*(columns+1)+j,now=i*(columns+1)+j;
        if(j%2===0)neckWeb.push(...neckVertices.slice(prev*3,prev*3+3),x,p.y,z);
        if(j>0){
          const pa=(i-1)*(columns+1)+j-1,pb=pa+1,na=i*(columns+1)+j-1,nb=na+1;
          neckFaces.push(pa,na,pb,pb,na,nb);
        }
      }
    }
  }
  surface(neckVertices,neckFaces,neckGroup,neckSkin,'neck-continuous-front-surface');
  lineSegments(neckWeb,neckGroup,neckLines,'neck-cervical-grid');
  for(const side of [-1,1]){
    const m=p=>[side*p[0],p[1],p[2]];
    const trace=(pts,name,mat=neckDetails,steps=30)=>
      lineCurve(pts.map(m),neckGroup,mat,'neck-'+(side<0?'left':'right')+'-'+name,false,steps);
    trace([
      [6.62,-3.38,-.84],[6.03,-4.85,-.95],[5.16,-6.87,-.44],
      [4.26,-8.63,.21],[3.05,-10.70,.90],[2.24,-12.60,1.0]
    ],'sternocleidomastoid',neckDetails,38);
    trace([
      [6.36,-3.46,-1.06],[5.94,-5.35,-1.02],[5.55,-7.58,-1.16],
      [5.53,-10.50,-1.35],[6.58,-12.91,-1.18],[8.26,-14.06,-1.39]
    ],'trapezius-outline',neckLines,36);
    trace([
      [2.30,-8.35,1.17],[2.48,-9.48,1.04],[2.67,-10.73,1.06],
      [3.20,-12.14,.75],[4.75,-13.20,.37]
    ],'lateral-tendon',neckDetails,30);
    trace([
      [.12,-12.77,.77],[1.26,-12.86,.83],[2.75,-13.02,.79],
      [4.80,-13.33,.31],[6.53,-13.92,-.57],[8.05,-14.09,-1.37]
    ],'clavicle-shoulder',neckDetails,40);
    trace([
      [1.00,-9.00,1.22],[1.16,-10.06,1.23],
      [1.08,-11.31,1.15],[.71,-12.68,.85]
    ],'laryngeal-sheath',neckLines,22);
  }
  lineCurve([
    [-.52,-9.35,1.33],[0,-9.47,1.42],[.52,-9.35,1.33]
  ],neckGroup,neckDetails,'neck-thyroid-cartilage',false,14);
  lineCurve([
    [-.63,-10.38,1.28],[0,-10.43,1.37],[.63,-10.38,1.28]
  ],neckGroup,neckLines,'neck-laryngeal-ring',false,14);

  const stats=Object.freeze({
    ears:2,earVertices:2*48*5,neckVertices:neckVertices.length/3,
    anatomicalRidges:2*7,neckMuscles:2*5+2,
    earTriangles:2*48*4*2,neckTriangles:neckFaces.length/3
  });
  function update({natural=true,time=0,reducedMotion=false,mouthOpen=0}={}){
    earSkin.opacity=natural?.19:.065;
    neckSkin.opacity=natural?.13:.055;
    earLines.opacity=natural?.69:.76;
    earDetails.opacity=natural?.50:.57;
    neckLines.opacity=natural?.34:.37;
    neckDetails.opacity=natural?.49:.53;
    // 0.3% throat movement; no new allocations or geometry tessellation.
    neckGroup.scale.x=reducedMotion?1:1+.003*Math.sin(time*1.27);
    neckGroup.position.z=reducedMotion?0:.013*Math.min(1,Math.max(0,mouthOpen));
  }
  function dispose(){
    group.parent?.remove(group);
    for(const g of geometries)g.dispose();
    for(const m of materials)m.dispose();
  }
  return {update,dispose,getStats:()=>stats,group};
}
