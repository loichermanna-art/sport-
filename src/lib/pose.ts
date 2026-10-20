/**
 * Moteur de silhouettes animées — IronPath
 * ---------------------------------------------------------------
 * Le corps est décrit par une chaîne articulaire simple (hanche, épaule,
 * coude, main, genou, cheville) pilotée par des angles absolus en degrés.
 *
 * Convention des angles : 0° = vers la droite (+x), 90° = vers le haut,
 * 180° = vers la gauche, -90° (270°) = vers le bas.
 * Le repère est « y vers le haut » ; la conversion vers le repère SVG
 * (y vers le bas) se fait au moment du rendu.
 */

export type Pt = { x: number; y: number };

/** Longueurs des segments, exprimées en « unités de corps » (torse = 1). */
export const SEG = {
  torso: 1.0,
  neck: 0.26,
  head: 0.3,
  upperArm: 0.68,
  foreArm: 0.62,
  hand: 0.15,
  thigh: 0.84,
  shin: 0.86,
  foot: 0.34,
} as const;

/** Demi-épaisseurs des membres (vue de face). */
export const WIDTH = {
  shoulder: 0.3,
  waist: 0.21,
  hip: 0.23,
  upperArm: 0.115,
  foreArm: 0.09,
  thigh: 0.155,
  shin: 0.11,
  neck: 0.08,
} as const;

const RAD = Math.PI / 180;

export function pt(from: Pt, len: number, deg: number): Pt {
  const a = deg * RAD;
  return { x: from.x + Math.cos(a) * len, y: from.y + Math.sin(a) * len };
}

/** Interpole deux angles en prenant le chemin le plus court. */
export function lerpAngle(a: number, b: number, t: number): number {
  const d = ((b - a + 540) % 360) - 180;
  return a + d * t;
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t;
}

/* ------------------------------------------------------------------ */
/* Description d'une posture                                            */
/* ------------------------------------------------------------------ */

export interface Pose {
  /** Position de la hanche (ancre du corps), sol à y = 0. */
  hip: [number, number];
  /**
   * Cible de la main côté caméra : les angles du bras sont alors calculés
   * par cinématique inverse pour que la main atteigne exactement ce point
   * (indispensable pour coller les mains à une barre, une poignée, un sol…).
   */
  handNear?: [number, number];
  handFar?: [number, number];
  /** Cible de la cheville (pied calé sur une machine, sur un banc…). */
  ankleNear?: [number, number];
  ankleFar?: [number, number];
  /** Sens de pliage du coude / du genou pour lever l'ambiguïté de l'IK. */
  elbow?: 'up' | 'down' | 'auto';
  elbowNear?: 'up' | 'down' | 'auto';
  elbowFar?: 'up' | 'down' | 'auto';
  knee?: 'up' | 'down' | 'auto';
  kneeNear?: 'up' | 'down' | 'auto';
  kneeFar?: 'up' | 'down' | 'auto';
  /** Angle absolu hanche -> épaule. */
  torso: number;
  /** Inclinaison de la tête, relative au torse. */
  head?: number;
  /** Bras côté caméra : [épaule->coude, coude->main]. */
  armNear: [number, number];
  /** Bras opposé. */
  armFar: [number, number];
  /** Jambe côté caméra : [hanche->genou, genou->cheville]. */
  legNear: [number, number];
  /** Jambe opposée. */
  legFar: [number, number];
  /** Angles absolus des pieds (cheville -> orteils). */
  footNear?: number;
  footFar?: number;
  /** Poids relatif de la keyframe dans le cycle (1 par défaut). */
  hold?: number;
  /** Indice affiché à ce moment précis du mouvement. */
  cue?: string;
}

export type PoseLike = Partial<Pose> & { hip: [number, number]; torso: number };

const STANDING: Pose = {
  hip: [0, 1.86],
  torso: 90,
  head: 0,
  armNear: [-90, -90],
  armFar: [-92, -92],
  legNear: [-90, -90],
  legFar: [-92, -92],
  footNear: 0,
  footFar: 0,
};

/** Construit une posture en complétant les champs manquants. */
export function pose(p: PoseLike): Pose {
  return { ...STANDING, ...p } as Pose;
}

/** Ancre debout standard (les hanches à 1,86 unité du sol). */
export const STAND_Y = 1.86;

/* ------------------------------------------------------------------ */
/* Cinématique                                                         */
/* ------------------------------------------------------------------ */

export interface Figure {
  hip: Pt;
  shoulder: Pt;
  neck: Pt;
  head: Pt;
  elbowNear: Pt;
  handNear: Pt;
  fingertipNear: Pt;
  elbowFar: Pt;
  handFar: Pt;
  fingertipFar: Pt;
  kneeNear: Pt;
  ankleNear: Pt;
  toeNear: Pt;
  kneeFar: Pt;
  ankleFar: Pt;
  toeFar: Pt;
}

/**
 * Cinématique inverse à deux os.
 * Retourne les angles absolus des deux segments pour atteindre `target`,
 * en choisissant la solution dont l'articulation intermédiaire est la plus
 * haute (`up`) ou la plus basse (`down`).
 */
export function ik2(
  root: Pt,
  target: Pt,
  l1: number,
  l2: number,
  hint: 'up' | 'down' | 'auto' = 'auto',
): [number, number] {
  const dx = target.x - root.x;
  const dy = target.y - root.y;
  const dRaw = Math.hypot(dx, dy);
  const d = Math.min(l1 + l2 - 0.005, Math.max(Math.abs(l1 - l2) + 0.005, dRaw));
  const base = (Math.atan2(dy, dx) * 180) / Math.PI;
  const cosA = (l1 * l1 + d * d - l2 * l2) / (2 * l1 * d);
  const alpha = (Math.acos(Math.min(1, Math.max(-1, cosA))) * 180) / Math.PI || 0;
  const cands: number[] = [base + alpha, base - alpha];
  let best = cands[0];
  if (hint === 'auto') {
    // privilégie le coude bas / le genou vers l'avant
    const score = (a: number) => Math.abs(norm180(a - -90));
    best = score(cands[0]) <= score(cands[1]) ? cands[0] : cands[1];
  } else {
    const y = (a: number) => Math.sin((a * Math.PI) / 180);
    best = hint === 'up' ? (y(cands[0]) >= y(cands[1]) ? cands[0] : cands[1]) : y(cands[0]) <= y(cands[1]) ? cands[0] : cands[1];
  }
  const elbow = pt(root, l1, best);
  const dir = (Math.atan2(target.y - elbow.y, target.x - elbow.x) * 180) / Math.PI;
  return [best, dir];
}

function norm180(a: number): number {
  return ((a + 540) % 360) - 180;
}

/** Miroir d'une posture par rapport à l'axe vertical du corps (vue de face). */
export function mirrorPose(p: Pose): Pose {
  const m = (a: number) => 180 - a;
  const mx = (v?: [number, number]): [number, number] | undefined => (v ? [-v[0], v[1]] : undefined);
  return {
    ...p,
    hip: [-p.hip[0], p.hip[1]],
    torso: m(p.torso),
    head: -(p.head ?? 0),
    armNear: [m(p.armFar[0]), m(p.armFar[1])],
    armFar: [m(p.armNear[0]), m(p.armNear[1])],
    legNear: [m(p.legFar[0]), m(p.legFar[1])],
    legFar: [m(p.legNear[0]), m(p.legNear[1])],
    footNear: p.footFar !== undefined ? m(p.footFar) : undefined,
    footFar: p.footNear !== undefined ? m(p.footNear) : undefined,
    handNear: mx(p.handFar),
    handFar: mx(p.handNear),
    ankleNear: mx(p.ankleFar),
    ankleFar: mx(p.ankleNear),
  };
}

export function solve(p: Pose): Figure {
  const hip = { x: p.hip[0], y: p.hip[1] };
  const torsoDir = p.torso;
  const shoulder = pt(hip, SEG.torso, torsoDir);
  const headDir = torsoDir + (p.head ?? 0);
  const neck = pt(shoulder, SEG.neck, headDir);
  const head = pt(shoulder, SEG.neck + SEG.head * 0.62, headDir);

  const armNear = p.handNear
    ? ik2(shoulder, { x: p.handNear[0], y: p.handNear[1] }, SEG.upperArm, SEG.foreArm, p.elbowNear ?? p.elbow ?? 'auto')
    : p.armNear;
  const armFar = p.handFar
    ? ik2(shoulder, { x: p.handFar[0], y: p.handFar[1] }, SEG.upperArm, SEG.foreArm, p.elbowFar ?? p.elbow ?? 'auto')
    : p.armFar;

  const elbowNear = pt(shoulder, SEG.upperArm, armNear[0]);
  const handNear = pt(elbowNear, SEG.foreArm, armNear[1]);
  const fingertipNear = pt(handNear, SEG.hand, armNear[1]);
  const elbowFar = pt(shoulder, SEG.upperArm, armFar[0]);
  const handFar = pt(elbowFar, SEG.foreArm, armFar[1]);
  const fingertipFar = pt(handFar, SEG.hand, armFar[1]);

  const legNear = p.ankleNear
    ? ik2(hip, { x: p.ankleNear[0], y: p.ankleNear[1] }, SEG.thigh, SEG.shin, p.kneeNear ?? p.knee ?? 'auto')
    : p.legNear;
  const legFar = p.ankleFar
    ? ik2(hip, { x: p.ankleFar[0], y: p.ankleFar[1] }, SEG.thigh, SEG.shin, p.kneeFar ?? p.knee ?? 'auto')
    : p.legFar;

  const kneeNear = pt(hip, SEG.thigh, legNear[0]);
  const ankleNear = pt(kneeNear, SEG.shin, legNear[1]);
  const toeNear = pt(ankleNear, SEG.foot, p.footNear ?? 0);
  const kneeFar = pt(hip, SEG.thigh, legFar[0]);
  const ankleFar = pt(kneeFar, SEG.shin, legFar[1]);
  const toeFar = pt(ankleFar, SEG.foot, p.footFar ?? 0);

  return {
    hip,
    shoulder,
    neck,
    head,
    elbowNear,
    handNear,
    fingertipNear,
    elbowFar,
    handFar,
    fingertipFar,
    kneeNear,
    ankleNear,
    toeNear,
    kneeFar,
    ankleFar,
    toeFar,
  };
}

/* ------------------------------------------------------------------ */
/* Interpolation entre keyframes                                        */
/* ------------------------------------------------------------------ */

function mixTarget(a: [number, number] | undefined, b: [number, number] | undefined, t: number): [number, number] | undefined {
  if (!a) return b;
  if (!b) return a;
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t)];
}

export function blendPose(a: Pose, b: Pose, t: number): Pose {
  const mix = (x: number, y: number) => lerp(x, y, t);
  const ang = (x: number, y: number) => lerpAngle(x, y, t);
  return {
    hip: [mix(a.hip[0], b.hip[0]), mix(a.hip[1], b.hip[1])],
    torso: ang(a.torso, b.torso),
    head: mix(a.head ?? 0, b.head ?? 0),
    armNear: [ang(a.armNear[0], b.armNear[0]), ang(a.armNear[1], b.armNear[1])],
    armFar: [ang(a.armFar[0], b.armFar[0]), ang(a.armFar[1], b.armFar[1])],
    legNear: [ang(a.legNear[0], b.legNear[0]), ang(a.legNear[1], b.legNear[1])],
    legFar: [ang(a.legFar[0], b.legFar[0]), ang(a.legFar[1], b.legFar[1])],
    footNear: mix(a.footNear ?? 0, b.footNear ?? 0),
    footFar: mix(a.footFar ?? 0, b.footFar ?? 0),
    handNear: mixTarget(a.handNear, b.handNear, t),
    handFar: mixTarget(a.handFar, b.handFar, t),
    ankleNear: mixTarget(a.ankleNear, b.ankleNear, t),
    ankleFar: mixTarget(a.ankleFar, b.ankleFar, t),
    elbow: a.elbow ?? b.elbow,
    knee: a.knee ?? b.knee,
    elbowNear: a.elbowNear ?? b.elbowNear,
    elbowFar: a.elbowFar ?? b.elbowFar,
    kneeNear: a.kneeNear ?? b.kneeNear,
    kneeFar: a.kneeFar ?? b.kneeFar,
  };
}

/**
 * Découpe un cycle de keyframes en une timeline normalisée [0, 1].
 * `hold` permet de marquer un temps d'arrêt sur une position.
 */
export function buildTimeline(frames: Pose[]): { keys: Pose[]; marks: number[] } {
  const marks: number[] = [];
  let total = 0;
  for (let i = 0; i < frames.length - 1; i++) {
    marks.push(total);
    total += frames[i].hold ?? 1;
  }
  marks.push(total);
  return { keys: frames, marks: marks.map((m) => m / total) };
}

/** Évalue la timeline à l'instant `u` (0 -> 1, bouclage aller-retour). */
export function sampleTimeline(frames: Pose[], u: number, pingPong = true): Pose {
  if (frames.length === 0) return STANDING;
  if (frames.length === 1) return frames[0];
  const { keys, marks } = buildTimeline(frames);
  const cycle = pingPong ? 2 * (marks.length - 1) : marks.length - 1;
  let pos = ((u % 1) + 1) % 1;
  pos = pos * cycle;
  let idx = Math.floor(pos);
  let local = pos - idx;
  let a: Pose;
  let b: Pose;
  if (idx >= marks.length - 1) {
    // demi-retour
    const back = idx - (marks.length - 1);
    a = keys[keys.length - 1 - back];
    b = keys[keys.length - 2 - back] ?? keys[0];
    idx = keys.length - 2 - back;
  } else {
    a = keys[idx];
    b = keys[idx + 1];
  }
  const span = marks[idx + 1] - marks[idx];
  const raw = span === 0 ? 0 : local / Math.max(span, 1e-6);
  const eased = easeInOut(Math.min(1, Math.max(0, raw)));
  return blendPose(a, b, eased);
}

export function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
}

/* ------------------------------------------------------------------ */
/* Utilitaires de rendu                                                 */
/* ------------------------------------------------------------------ */

/**
 * Toutes les formes sont exprimées en unités « monde » (y vers le haut).
 * Le rendu final enveloppe la scène dans un groupe SVG
 * `translate(ox, oy) scale(s, -s)`, ce qui évite toute conversion manuelle.
 * Les épaisseurs de trait suivent donc naturellement l'échelle du corps.
 */

const f = (n: number) => (Math.round(n * 100) / 100).toFixed(2);

/**
 * Capsule fuselée : trait reliant A à B avec un rayon différent à chaque
 * extrémité (utilisé pour le torse, les cuisses, les bras).
 */
export function taperedCapsule(a: Pt, b: Pt, ra: number, rb: number): string {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  const d = Math.hypot(dx, dy) || 1e-6;
  const ux = dx / d;
  const uy = dy / d;
  const nx = -uy;
  const ny = ux;
  const k = Math.min(0.98, Math.max(-0.98, (ra - rb) / d));
  const s = Math.sqrt(1 - k * k);
  const m1 = { x: k * ux + s * nx, y: k * uy + s * ny };
  const m2 = { x: k * ux - s * nx, y: k * uy - s * ny };
  const p1 = { x: a.x + ra * m1.x, y: a.y + ra * m1.y };
  const p2 = { x: b.x + rb * m1.x, y: b.y + rb * m1.y };
  const p3 = { x: b.x + rb * m2.x, y: b.y + rb * m2.y };
  const p4 = { x: a.x + ra * m2.x, y: a.y + ra * m2.y };
  const sweep = ra > rb ? 0 : 1;
  return [
    `M ${f(p1.x)} ${f(p1.y)}`,
    `L ${f(p2.x)} ${f(p2.y)}`,
    `A ${f(rb)} ${f(rb)} 0 0 ${sweep} ${f(p3.x)} ${f(p3.y)}`,
    `L ${f(p4.x)} ${f(p4.y)}`,
    `A ${f(ra)} ${f(ra)} 0 0 ${sweep} ${f(p1.x)} ${f(p1.y)}`,
    'Z',
  ].join(' ');
}

/** Capsule simple (rayon constant) : membres. */
export function capsule(a: Pt, b: Pt, r: number): string {
  return taperedCapsule(a, b, r, r);
}

/** Cercle sous forme de chemin. */
export function circlePath(c: Pt, r: number): string {
  return `M ${f(c.x - r)} ${f(c.y)} a ${f(r)} ${f(r)} 0 1 0 ${f(2 * r)} 0 a ${f(r)} ${f(r)} 0 1 0 ${f(-2 * r)} 0 Z`;
}

/** Rectangle à coins arrondis sous forme de chemin. */
export function roundRectPath(x: number, y: number, w: number, h: number, r: number): string {
  const rr = Math.min(r, w / 2, h / 2);
  return `M ${f(x + rr)} ${f(y)} H ${f(x + w - rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w)} ${f(y + rr)} V ${f(y + h - rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + w - rr)} ${f(y + h)} H ${f(x + rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x)} ${f(y + h - rr)} V ${f(y + rr)} A ${f(rr)} ${f(rr)} 0 0 1 ${f(x + rr)} ${f(y)} Z`;
}

/** Ellipse sous forme de chemin (rx/ry + rotation en degrés). */
export function ellipsePath(c: Pt, rx: number, ry: number, rot = 0): string {
  const a = rot * RAD;
  return `M ${f(c.x - rx * Math.cos(a))} ${f(c.y - rx * Math.sin(a))} a ${f(rx)} ${f(ry)} ${f(rot)} 1 0 ${f(2 * rx * Math.cos(a))} ${f(2 * rx * Math.sin(a))} a ${f(rx)} ${f(ry)} ${f(rot)} 1 0 ${f(-2 * rx * Math.cos(a))} ${f(-2 * rx * Math.sin(a))} Z`;
}

/** Avance de `len` depuis `from` selon l'angle `deg`. */
export function along(from: Pt, dirDeg: number, len: number): Pt {
  return pt(from, len, dirDeg);
}

/** Point situé à la fraction `t` du segment a->b. */
export function onSegment(a: Pt, b: Pt, t: number): Pt {
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

/** Angle du segment a->b, en degrés. */
export function angleOf(a: Pt, b: Pt): number {
  return (Math.atan2(b.y - a.y, b.x - a.x) * 180) / Math.PI;
}

/** Perpendiculaire au segment a->b (rotation de +90°). */
export function perpOf(a: Pt, b: Pt): number {
  return angleOf(a, b) + 90;
}
