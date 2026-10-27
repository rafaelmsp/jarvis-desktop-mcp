/**
 * High upright spiky quiff based on a side-profile barber haircut reference.
 * Long lifted top with asymmetrical sharp spikes; tight skin fade at the sides.
 * Only holographic geometry, with no photograph, texture, shader or API.
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
    // Strong vertical lift on the FRONT and middle crown: this is not cropped hair.
    // Sinusoidal strands create a broken, naturally spiked silhouette.
    const lift=Math.pow(Math.max(0,Math.sin(Math.PI*v)),.64);
    const crest=Math.exp(-Math.pow((v-.32)/.27,2));
    const crown=Math.sin(Math.PI*v);
    const irregularity=.28*Math.pow(Math.sin(12.5*u+7.0*v),2)+
      .14*Math.pow(Math.sin(24.3*u-4.9*v),2);
    const sway=-.64*v*(.42+.58*center)+.13*Math.sin(7.2*u+3.3*v)*v;
    const x=u*6.21*(1-.074*v)+sway;
    const y=front[1]+.17+(2.90+1.40*center)*lift+
      (.34+.25*center)*crest-.51*v*v+
      irregularity*lift+.10*Math.sin(13*u+4*v)*crown;
    const z=front[2]+.15-(6.96-.30*Math.abs(u))*v+
      .27*crown+.26*crest*center+.06*Math.cos(7*u+4*v)*crown;
    return [x,y,z];
  };
  // Used for dimensional filaments following the same swept hairstyle.
  const filament=(u,v,index=0)=>{
    const phase=index*1.61803;
    const swirl=.10*Math.sin(phase+v*4.2)*v;
    const p=sample(u+swirl,v);
    // Individual hair tips stand UP in peaks, with angled rake towards the back.
    p[1]+=(.17+.53*Math.pow(Math.sin(index*1.37),2))*Math.pow(Math.sin(Math.PI*v),1.2);
    p[0]+=.11*Math.sin(phase+v*2.2)*Math.sin(Math.PI*v);
    p[2]+=.09*Math.sin(phase)*Math.sin(Math.PI*v);
    return p;
  };
  return Object.freeze({sample,filament,style:'high-upright-spiky-fade',
    cutReference:'upright-long-top-sharp-texture-skin-fade-shaved-part'});
}
