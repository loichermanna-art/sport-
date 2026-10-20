/** Retours sonores (fin de repos, série validée) sans fichier externe. */
let ctx: AudioContext | null = null;

function audio(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === 'suspended') void ctx.resume();
  return ctx;
}

function tone(freq: number, start: number, duration: number, gain = 0.16) {
  const ac = audio();
  if (!ac) return;
  const osc = ac.createOscillator();
  const g = ac.createGain();
  osc.type = 'sine';
  osc.frequency.value = freq;
  g.gain.setValueAtTime(0, ac.currentTime + start);
  g.gain.linearRampToValueAtTime(gain, ac.currentTime + start + 0.02);
  g.gain.exponentialRampToValueAtTime(0.0001, ac.currentTime + start + duration);
  osc.connect(g).connect(ac.destination);
  osc.start(ac.currentTime + start);
  osc.stop(ac.currentTime + start + duration + 0.05);
}

export function beepSetDone() {
  tone(660, 0, 0.12);
  tone(880, 0.09, 0.16);
}

export function beepRestOver() {
  tone(880, 0, 0.16);
  tone(880, 0.22, 0.16);
  tone(1175, 0.44, 0.3);
}

export function tick() {
  tone(520, 0, 0.06, 0.08);
}

export function buzz() {
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) navigator.vibrate?.(120);
}
