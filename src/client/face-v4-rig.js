/**
 * JARVIS V4.7 — expressive gaze, blinks, vocal accents and resting-lip correction.
 * Canonical topology (468 landmarks) remains unchanged.
 * Local weighted regions are calculated ONCE, not every animation frame.
 * Lip movement is driven by amplitude, not phoneme identification.
 */
import {blinkAt,gazeAt} from './face-v4-dynamics.js';
import {syntheticSpeechAt} from './speech-motion.js';

export const clamp01 = n => Math.min(1, Math.max(0, Number.isFinite(n) ? n : 0));
const gauss=(x,y,cx,cy,sx,sy)=>
  Math.exp(-1.65*(((x-cx)/sx)**2+((y-cy)/sy)**2));
const mix=(a,b,t)=>a+(b-a)*t;
const ease=(start,end,value)=>{
  const t=clamp01((value-start)/(end-start));
  return t*t*(3-2*t);
};

export function createFacialRig(vertices) {
  if (!(vertices instanceof Float32Array) || vertices.length !== 468*3)
    throw Error('Malha facial inválida: 468 vértices obrigatórios');

  // All masks use canonical mesh coordinates. Never change the source array.
  const regions=Array.from({length:468},(_,i)=>{
    const k=i*3,x=vertices[k],y=vertices[k+1],z=vertices[k+2];
    const front=ease(.7,3.5,z), absX=Math.abs(x);
    const lip=gauss(x,y,0,-4.33,2.85,.94)*front;
    const corner=gauss(absX,y,2.28,-4.28,.95,.85)*front;
    const cheek=gauss(absX,y,3.55,-2.5,2.15,2.5)*front;
    const jaw=gauss(x,y,0,-6.05,4.35,3.3)*front;
    const eye=gauss(absX,y,3.16,2.64,1.58,.9)*front;
    const brow=gauss(absX,y,3.18,3.55,2.05,.78)*front;
    const midline=gauss(x,y,0,2.8,1.8,1.6)*front;
    // The canonical inner lip gap is visible even in silence. Seal it gently
    // in neutral/idle; release the seal as the audio mouth target opens.
    const innerLip=gauss(x,y,0,-4.27,2.45,.80)*front;
    const noseBridge=gauss(x,y,0,.7,1.22,3.0)*front;
    const noseTip=gauss(x,y,0,-1.24,1.25,1.12)*front;
    const noseWing=gauss(absX,y,1.3,-1.67,.80,.78)*front;
    const cheekbone=gauss(absX,y,4.05,-1.48,2.08,1.65)*front;
    const cheekHollow=gauss(absX,y,3.9,-3.85,1.75,1.5)*front;
    const chin=gauss(x,y,0,-7.5,2.35,1.9)*front;
    const jawWing=gauss(absX,y,4.8,-5.5,2.0,2.5)*front;
    return {
      front,lip,corner,cheek,jaw,eye,brow,midline,jawWing,innerLip,
      upper:y>=-4.32,center:1-ease(1.45,3.1,absX),sign:Math.sign(x),
      baseDepth:.065*noseBridge+.105*noseTip+.07*noseWing+
        .115*cheekbone-.052*cheekHollow+.055*chin
    };
  });
  const state={
    mouth:0,smile:0,attention:0,thinking:0,alert:0,surprise:0,
    blink:0,gaze:0,gazeVertical:0,squint:0,speechAccent:0
  };
  const pose={...state};

  function updateInto(out,{time=0,delta=1/30,expression='neutral',mood='neutral',speaking=false,
    audioDriven=false,audioLevel=0,reducedMotion=false}={}) {
    if (!(out instanceof Float32Array) || out.length!==vertices.length)
      throw Error('Buffer de deformação inválido');

    const d=Math.max(1/240,Math.min(.2,Number.isFinite(delta)?delta:1/30));
    const intensity=clamp01(Number(audioLevel));
    const vocal=audioDriven
      ? (speaking ? .1+.85*Math.pow(intensity,.72) : 0)
      : syntheticSpeechAt(time,{speaking,reducedMotion});
    const visual=(mood!=='neutral' && ['happy','alert','surprised','thinking'].includes(mood)) ? mood : expression;
    const gazeTarget=gazeAt(time,visual,reducedMotion);
    const targets={
      mouth:Math.max(vocal,visual==='surprised'?.66:0),
      smile:visual==='happy'?1:0,
      attention:visual==='listening'?1:0,
      thinking:visual==='thinking'?1:0,
      alert:visual==='alert'?1:0,
      surprise:visual==='surprised'?1:0,
      blink:blinkAt(time,reducedMotion),
      gaze:gazeTarget.x,
      gazeVertical:gazeTarget.y,
      speechAccent:speaking?clamp01(vocal*.76):0,
      squint:visual==='happy'?.23:visual==='listening'?.13:
        visual==='thinking'?.10:0
    };
    for(const key of Object.keys(state)){
      const attack=key==='mouth'?.055:key==='blink'?.028:
        key==='speechAccent'?.12:
        key==='gaze'||key==='gazeVertical'?.11:.17;
      const release=key==='mouth'?.095:key==='blink'?.042:
        key==='speechAccent'?.22:
        key==='gaze'||key==='gazeVertical'?.16:.23;
      const tau=targets[key]>state[key]?attack:release;
      state[key]=mix(state[key],targets[key],1-Math.exp(-d/tau));
    }

    const mouth=state.mouth,attention=state.attention,thought=state.thinking;
    const blink=state.blink,smile=state.smile,surprise=state.surprise;
    for(let i=0;i<468;i++){
      const k=i*3,x=vertices[k],y=vertices[k+1],z=vertices[k+2],w=regions[i];
      // Center opens more than the corners; the mandible moves independently.
      const lipMotion=mouth*w.lip*(.72+.28*w.center);
      const lipDy=w.upper?lipMotion*.34:-lipMotion*.49;
      // Resting inner lip contour closes without affecting outer lip silhouette.
      const lipSeal=w.innerLip*(1-mouth)*(w.upper?-.23:.23);
      const jawDrop=-mouth*w.jaw*.19;
      const smileLift=smile*(w.corner*.34+w.cheek*.07);
      const eyelid=w.eye*(blink*(y>2.64?-.35:.12)-
        state.squint*(y>2.64?.06:-.028));
      const focusEye=w.eye*(attention*.048-thought*.055);
      const browMove=w.brow*(attention*.13+thought*.09+
        surprise*.32-state.alert*.17+state.speechAccent*.052);
      // Shape shifts remain subtle; audio intensity does not invent phonemes.
      out[k]=x+w.sign*(w.corner*(smile*.12-mouth*.04)+w.jawWing*.034);
      out[k+1]=y+lipSeal+lipDy+jawDrop+smileLift+eyelid+focusEye+browMove+
        w.corner*state.speechAccent*.040+
        state.gazeVertical*w.eye*.22;
      out[k+2]=z+w.baseDepth+lipMotion*(w.upper?.045:.085)+
        w.cheek*(smile*.045+attention*.018+state.speechAccent*.045)+
        w.midline*thought*.025;
    }
    Object.assign(pose,state);
    return pose;
  }
  return {updateInto,getPose:()=>({...pose})};
}
