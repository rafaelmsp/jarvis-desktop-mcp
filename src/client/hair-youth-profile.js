/**
 * Young short textured quiff. Pure coordinate sampler; no WebGL allocations.
 * The shorter sides and asymmetric front swirl evoke youthful brushed-up hair.
 * The canonical face landmarks remain immutable.
 */
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const lerp=(a,b,t)=>a+(b-a)*t;
const HAIRLINE=[54,103,67,109,10,338,297,332,284];
export function createYouthfulHairProfile(vertices){
  if(!(vertices instanceof Float32Array)||vertices.length!==468*3)
    throw Error('Amostrador de cabelo exige 468 landmarks');
  const anchors=HAIRLINE.map(id=>[vertices[id*3],vertices[id*3+1],vertices[id*3+2]]);
  const sample=(u,v)=>{
    u=clamp(u,-1,1);v=clamp(v,0,1);
    const a=clamp((u+1)*.5*(anchors.length-1),0,anchors.length-1);
    const low=Math.min(anchors.length-2,Math.floor(a)),f=a-low;
    const front=anchors[low].map((n,i)=>lerp(n,anchors[low+1][i],f));
    const center=1-Math.pow(Math.abs(u),1.45);
    // Parting and diagonally swept crest: subtle asymmetry, not a helmet cap.
    const lift=Math.pow(Math.max(0,Math.sin(Math.PI*v)),.79);
    const crest=Math.exp(-Math.pow((v-.23)/.17,2));
    const crown=Math.sin(Math.PI*v);
    const sway=-.50*v*(.48+.52*center)+.12*Math.sin(7.2*u+3.3*v)*v;
    const x=u*6.30*(1-.076*v)+sway;
    const y=front[1]+.18+(1.65+1.00*center)*lift+
      (.47+.23*center)*crest*(.6+.4*center)-.70*v*v+
      .12*Math.sin(11*u+5*v)*crown;
    const z=front[2]+.18-(6.96-.3*Math.abs(u))*v+
      .27*crown+.22*crest*center+.08*Math.cos(7*u+4*v)*crown;
    return [x,y,z];
  };
  // Used for dimensional filaments following the same swept hairstyle.
  const filament=(u,v,index=0)=>{
    const phase=index*1.61803;
    const swirl=.08*Math.sin(phase+v*4.2)*v;
    const p=sample(u+swirl,v);
    p[1]+=(.08+.19*Math.sin(index*1.37)**2)*Math.sin(Math.PI*v);
    p[2]+=.065*Math.sin(phase)*Math.sin(Math.PI*v);
    return p;
  };
  return Object.freeze({sample,filament,style:'short-asymmetric-textured-quiff'});
}
