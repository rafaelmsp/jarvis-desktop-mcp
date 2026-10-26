/**
 * JARVIS: cadencia visual sintetica para respostas recebidas pelo MCP.
 * Nao interpreta texto nem audio: movimento labial ARTISTICO, nao fonetico.
 */
const clamp01=value=>Math.max(0,Math.min(1,Number.isFinite(value)?value:0));

export function syntheticSpeechAt(time,{speaking=true,reducedMotion=false}={}){
  if(!speaking)return 0;
  if(reducedMotion)return .32;
  const t=Math.max(0,Number.isFinite(time)?time:0);
  // Harmonicamente irregular e com breves pausas, sem usar aleatoriedade.
  const articulation=.5+.5*Math.sin(12.8*t+.38*Math.sin(2.4*t));
  const secondary=.5+.5*Math.sin(7.3*t+.7);
  const shortPause=Math.pow(Math.max(0,Math.sin(t*1.78+.95)),16);
  const amplitude=(.16+.57*articulation+.16*secondary)*(1-.80*shortPause);
  return clamp01(amplitude);
}
