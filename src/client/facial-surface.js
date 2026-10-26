/**
 * Superficie anatômica Loop subdivision (1 nível) aplicada SOBRE a malha
 * MediaPipe original. O wireframe e os 468 landmarks permanecem intactos.
 * Sem novos assets, shaders externos, APIs ou acesso a áudio.
 */
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function createFacialSurfacePlan(vertices,triangles,{smoothness=.58}={}){
  if(!(vertices instanceof Float32Array)||vertices.length!==468*3)
    throw Error('Malha anatômica de origem inválida');
  if(!(triangles instanceof Uint16Array)||triangles.length%3!==0)
    throw Error('Índices anatômicos inválidos');
  const count=468;
  const neighbors=Array.from({length:count},()=>new Set());
  const boundary=Array.from({length:count},()=>[]);
  const edges=new Map();
  function edge(a,b,opposite){
    const lo=Math.min(a,b),hi=Math.max(a,b),key=lo*count+hi;
    let e=edges.get(key);
    if(!e){e={a:lo,b:hi,opposite:[],index:count+edges.size};edges.set(key,e);}
    e.opposite.push(opposite);
    neighbors[a].add(b);neighbors[b].add(a);
    return e.index;
  }
  const indices=new Uint16Array(triangles.length*4);
  let offset=0;
  for(let i=0;i<triangles.length;i+=3){
    const a=triangles[i],b=triangles[i+1],c=triangles[i+2];
    if(a>=count||b>=count||c>=count)throw Error('Índice facial fora da malha');
    const ab=edge(a,b,c),bc=edge(b,c,a),ca=edge(c,a,b);
    indices.set([a,ab,ca,b,bc,ab,c,ca,bc,ab,bc,ca],offset);
    offset+=12;
  }
  for(const e of edges.values()){
    if(e.opposite.length===1){boundary[e.a].push(e.b);boundary[e.b].push(e.a);}
    if(e.opposite.length>2)throw Error('Triangulação não-manifold');
  }
  const smooth=clamp(Number(smoothness)||0,0,.95);
  const positions=new Float32Array((count+edges.size)*3);
  const edgeList=[...edges.values()];
  const neighborList=neighbors.map(s=>[...s]);
  function update(deformed){
    if(!(deformed instanceof Float32Array)||deformed.length!==vertices.length)
      throw Error('Buffer de deformação incompatível');
    for(let i=0;i<count;i++){
      const n=neighborList[i],k=i*3;
      const b=boundary[i];
      for(let axis=0;axis<3;axis++){
        let shifted=deformed[k+axis];
        if(b.length===2){
          shifted=.75*shifted+.125*(deformed[b[0]*3+axis]+deformed[b[1]*3+axis]);
        }else if(n.length>=3){
          const beta=(5/8-(3/8+.25*Math.cos(2*Math.PI/n.length))**2)/n.length;
          let total=0;for(const j of n)total+=deformed[j*3+axis];
          shifted=(1-n.length*beta)*shifted+beta*total;
        }
        positions[k+axis]=deformed[k+axis]*(1-smooth)+shifted*smooth;
      }
    }
    for(const e of edgeList){
      const k=e.index*3;
      for(let axis=0;axis<3;axis++){
        const pa=deformed[e.a*3+axis],pb=deformed[e.b*3+axis];
        const mid=(pa+pb)*.5;
        const target=e.opposite.length===2?
          .375*(pa+pb)+.125*(deformed[e.opposite[0]*3+axis]+deformed[e.opposite[1]*3+axis]):mid;
        positions[k+axis]=mid*(1-smooth)+target*smooth;
      }
    }
    return positions;
  }
  update(vertices);
  return {
    indices,positions,update,
    getStats:()=>({sourceVertices:count,vertices:positions.length/3,
      triangles:indices.length/3,edges:edgeList.length,smoothness:smooth})
  };
}
