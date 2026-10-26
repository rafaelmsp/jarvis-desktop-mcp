/**
 * Movimentos de cabeça discretos e biomecanicamente plausíveis.
 * Acompanha direção do olhar, respiração e a intenção VISUAL explicitada.
 * Não interpreta áudio nem rastreia câmera/microfone.
 */
export function naturalHeadAt(time,pose={},reducedMotion=false){
  if(reducedMotion)return {yaw:0.055,pitch:0,roll:0,y:0};
  const t=Math.max(0,Number.isFinite(time)?time:0);
  const gaze=Number.isFinite(pose.gaze)?pose.gaze:0;
  const vertical=Number.isFinite(pose.gazeVertical)?pose.gazeVertical:0;
  const thinking=Math.max(0,Math.min(1,pose.thinking||0));
  const surprise=Math.max(0,Math.min(1,pose.surprise||0));
  const smile=Math.max(0,Math.min(1,pose.smile||0));
  const speech=Math.max(0,Math.min(1,pose.speechAccent||0));
  // Silhueta em leve 3/4, sem balanço senoidal robótico constante.
  const yaw=.055+.59*gaze+.015*Math.sin(t*.23+.45);
  const pitch=-.017*thinking+.021*surprise+.36*vertical+
    .008*Math.sin(t*.31+.8)+.009*speech;
  const roll=.008*Math.sin(t*.19+.5)+.011*smile;
  // Expiração sutil, com intervalo de ~4,8 s.
  const y=.029*Math.sin(t*1.31-.40)+.013*speech;
  return {yaw,pitch,roll,y};
}
