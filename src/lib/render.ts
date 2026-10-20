/**
 * Rendu des silhouettes animées.
 * Toutes les formes sont produites en unités « monde » (y vers le haut) ;
 * le groupe racine applique `translate(ox,oy) scale(s,-s)`.
 */
import {
  Pt,
  Pose,
  mirrorPose,
  Figure,
  solve,
  SEG,
  taperedCapsule,
  capsule,
  circlePath,
  roundRectPath,
  ellipsePath,
  onSegment,
  angleOf,
  perpOf,
  pt,
  lerp,
} from './pose';

export type Shape =
  | { k: 'path'; d: string; fill?: string; stroke?: string; sw?: number; op?: number; cap?: 'round' | 'butt'; dash?: string }
  | { k: 'circle'; c: Pt; r: number; fill?: string; stroke?: string; sw?: number; op?: number }
  | { k: 'rect'; x: number; y: number; w: number; h: number; rx?: number; fill?: string; stroke?: string; sw?: number; op?: number }
  | { k: 'line'; a: Pt; b: Pt; stroke: string; sw: number; op?: number; cap?: 'round'; dash?: string }
  | { k: 'g'; children: Shape[]; op?: number; cls?: string };

/* ------------------------------------------------------------------ */
/* Muscles                                                             */
/* ------------------------------------------------------------------ */

export type MuscleId =
  | 'chest'
  | 'lats'
  | 'traps'
  | 'lowerBack'
  | 'frontDelt'
  | 'sideDelt'
  | 'rearDelt'
  | 'biceps'
  | 'triceps'
  | 'forearms'
  | 'abs'
  | 'obliques'
  | 'glutes'
  | 'quads'
  | 'hamstrings'
  | 'adductors'
  | 'abductors'
  | 'calves'
  | 'hipFlexors'
  | 'calvesSoleus';

export const MUSCLE_LABEL: Record<MuscleId, string> = {
  chest: 'Pectoraux',
  lats: 'Dorsaux (grands dorsaux)',
  traps: 'Trapèzes',
  lowerBack: 'Lombaires',
  frontDelt: 'Deltoïde antérieur',
  sideDelt: 'Deltoïde latéral',
  rearDelt: 'Deltoïde postérieur',
  biceps: 'Biceps',
  triceps: 'Triceps',
  forearms: 'Avant-bras',
  abs: 'Abdominaux',
  obliques: 'Obliques',
  glutes: 'Fessiers',
  quads: 'Quadriceps',
  hamstrings: 'Ischio-jambiers',
  adductors: 'Adducteurs',
  abductors: 'Fessiers moyen (abducteurs)',
  calves: 'Mollets',
  hipFlexors: 'Psoas / fléchisseurs de hanche',
  calvesSoleus: 'Soléaire',
};

export const MUSCLE_GROUP: Record<MuscleId, string> = {
  chest: 'Pectoraux',
  lats: 'Dos',
  traps: 'Dos',
  lowerBack: 'Dos',
  frontDelt: 'Épaules',
  sideDelt: 'Épaules',
  rearDelt: 'Épaules',
  biceps: 'Bras',
  triceps: 'Bras',
  forearms: 'Bras',
  abs: 'Abdos',
  obliques: 'Abdos',
  glutes: 'Jambes',
  quads: 'Jambes',
  hamstrings: 'Jambes',
  adductors: 'Jambes',
  abductors: 'Jambes',
  calves: 'Jambes',
  hipFlexors: 'Jambes',
  calvesSoleus: 'Jambes',
};

type SegId = 'torso' | 'upperArm' | 'foreArm' | 'thigh' | 'shin' | 'hip' | 'neck';

interface MusclePart {
  seg: SegId;
  /** Position le long du segment (0 = origine, 1 = extrémité). */
  t: number;
  /** Décalage positif = vers l'avant du corps (côté regardé en vue de profil). */
  off: number;
  rx: number;
  ry: number;
  /** Vrai si le décalage se fait en profondeur (invisible de face). */
  depth?: boolean;
  /** Dessiner aussi sur le membre opposé. */
  both?: boolean;
}

const MUSCLE_PARTS: Record<MuscleId, MusclePart[]> = {
  chest: [{ seg: 'torso', t: 0.78, off: 0.1, rx: 0.15, ry: 0.2, depth: true }],
  lats: [{ seg: 'torso', t: 0.68, off: -0.09, rx: 0.14, ry: 0.26, depth: true }],
  traps: [{ seg: 'neck', t: 0.35, off: -0.02, rx: 0.2, ry: 0.13, depth: true }],
  lowerBack: [{ seg: 'torso', t: 0.2, off: -0.08, rx: 0.13, ry: 0.2, depth: true }],
  frontDelt: [{ seg: 'upperArm', t: 0.03, off: 0.02, rx: 0.13, ry: 0.13, both: true }],
  sideDelt: [{ seg: 'upperArm', t: 0.06, off: 0, rx: 0.13, ry: 0.15, both: true }],
  rearDelt: [{ seg: 'upperArm', t: 0.03, off: -0.05, rx: 0.12, ry: 0.13, both: true, depth: true }],
  biceps: [{ seg: 'upperArm', t: 0.52, off: 0.03, rx: 0.1, ry: 0.19, both: true }],
  triceps: [{ seg: 'upperArm', t: 0.5, off: -0.03, rx: 0.1, ry: 0.19, both: true }],
  forearms: [{ seg: 'foreArm', t: 0.5, off: 0, rx: 0.1, ry: 0.22, both: true }],
  abs: [{ seg: 'torso', t: 0.33, off: 0.09, rx: 0.13, ry: 0.22, depth: true }],
  obliques: [
    { seg: 'torso', t: 0.4, off: 0.13, rx: 0.09, ry: 0.18 },
    { seg: 'torso', t: 0.4, off: -0.13, rx: 0.09, ry: 0.18 },
  ],
  glutes: [{ seg: 'hip', t: 0, off: -0.1, rx: 0.19, ry: 0.17, depth: true }],
  quads: [{ seg: 'thigh', t: 0.45, off: 0.03, rx: 0.14, ry: 0.31, both: true }],
  hamstrings: [{ seg: 'thigh', t: 0.5, off: -0.03, rx: 0.13, ry: 0.3, both: true }],
  adductors: [{ seg: 'thigh', t: 0.55, off: -0.07, rx: 0.09, ry: 0.26, both: true }],
  abductors: [{ seg: 'hip', t: 0, off: 0.06, rx: 0.14, ry: 0.14 }],
  calves: [{ seg: 'shin', t: 0.55, off: -0.02, rx: 0.11, ry: 0.26, both: true }],
  calvesSoleus: [{ seg: 'shin', t: 0.35, off: -0.04, rx: 0.09, ry: 0.16, both: true }],
  hipFlexors: [{ seg: 'torso', t: 0.1, off: 0.08, rx: 0.11, ry: 0.14, depth: true }],
};

/* ------------------------------------------------------------------ */
/* Style                                                               */
/* ------------------------------------------------------------------ */

export interface FigureStyle {
  near: string;
  far: string;
  head: string;
  outline: string;
  gear: string;
  gearDark: string;
  glow: string;
  glowSoft: string;
  shadow: string;
}

export const IRON_STYLE: FigureStyle = {
  near: '#e9eefb',
  far: '#7f8dad',
  head: '#f4f7ff',
  outline: '#0d1220',
  gear: '#8a9ab5',
  gearDark: '#3d4a63',
  glow: '#ff7a1a',
  glowSoft: 'rgba(255,122,26,0.35)',
  shadow: 'rgba(4,8,18,0.45)',
};

/* ------------------------------------------------------------------ */
/* Équipement                                                          */
/* ------------------------------------------------------------------ */

export type GearSpec =
  | { kind: 'barbell'; at?: 'hands' | 'back' | 'shoulders' | 'hip'; plate?: number; x?: number; y?: number; behind?: boolean }
  | { kind: 'dumbbell'; hand?: 'near' | 'far' | 'both'; size?: number }
  | { kind: 'kettlebell'; hand?: 'near' | 'far' | 'both' }
  | { kind: 'bench'; x: number; y: number; w: number; h?: number; angle?: number }
  | { kind: 'bar'; y: number; x?: number; w?: number }
  | { kind: 'cable'; x: number; y: number; hand?: 'near' | 'far' | 'both'; attach?: 'bar' | 'rope' | 'handle'; both?: boolean }
  | { kind: 'pad'; x: number; y: number; w: number; h?: number; angle?: number; r?: number }
  | { kind: 'machine'; variant: MachineVariant; seat?: Pt }
  | { kind: 'box'; x: number; y: number; w: number; h: number }
  | { kind: 'mat' }
  | { kind: 'ground' }
  | { kind: 'cardio'; variant: 'treadmill' | 'bike' | 'rower' | 'elliptical' | 'rope' }
  | { kind: 'band'; x: number; y: number; hand?: 'near' | 'far' | 'both' };

export type MachineVariant =
  | 'legpress'
  | 'legext'
  | 'legcurl'
  | 'pecdeck'
  | 'latpulldown'
  | 'seatedrow'
  | 'smith'
  | 'calf'
  | 'hipthrust'
  | 'abductor'
  | 'chestpress'
  | 'shoulderpress';

/* ------------------------------------------------------------------ */
/* Rendu principal                                                     */
/* ------------------------------------------------------------------ */

export interface RenderInput {
  pose: Pose;
  view?: 'side' | 'front';
  highlight?: MuscleId[];
  gear?: GearSpec[];
  style?: FigureStyle;
  /** 0 -> 1 : intensité de la mise en évidence musculaire. */
  pulse?: number;
  /** Affiche la trajectoire du mouvement. */
  showPath?: boolean;
  groundY?: number;
  /** Masque le sol (exercices suspendus : tractions, dips…). */
  floor?: boolean;
}

const V = { side: 0.82, front: 1 } as const;

export function renderFigure(input: RenderInput): Shape[] {
  const st = input.style ?? IRON_STYLE;
  const view = input.view ?? 'side';
  const vf = V[view];
  const pose = input.pose;
  // En vue de face, les membres opposés sont le miroir des membres proches.
  const farPose = view === 'front' ? mirrorPose(pose) : pose;
  const fig = solve(pose);
  const figFar = view === 'front' ? solve(farPose) : fig;
  const out: Shape[] = [];

  const wShoulder = (view === 'side' ? 0.21 : 0.3) * 1;
  const wHip = (view === 'side' ? 0.19 : 0.235) * 1;
  const wUpper = 0.115 * (view === 'side' ? 0.94 : 1);
  const wFore = 0.09 * (view === 'side' ? 0.94 : 1);
  const wThigh = 0.16 * (view === 'side' ? 1 : 0.96);
  const wShin = 0.115 * (view === 'side' ? 1 : 0.96);

  const groundY = input.groundY ?? 0;

  /* --- sol --- */
  if (input.floor !== false) {
    out.push({ k: 'rect', x: -3.2, y: groundY - 0.62, w: 6.4, h: 0.62, fill: 'rgba(255,255,255,0.035)' });
    out.push({ k: 'line', a: { x: -3.2, y: groundY }, b: { x: 3.2, y: groundY }, stroke: 'rgba(255,255,255,0.18)', sw: 0.02 });
    // ombre au sol
    const shadowX = (fig.ankleNear.x + fig.ankleFar.x) / 2;
    out.push({ k: 'path', d: ellipsePath({ x: shadowX, y: groundY + 0.02 }, 0.7, 0.075), fill: st.shadow });
  }

  /* --- équipement en arrière-plan --- */
  const back: Shape[] = [];
  const front: Shape[] = [];
  for (const g of input.gear ?? []) {
    const shapes = renderGear(g, fig, pose, st, view);
    const inFront =
      (g.kind === 'dumbbell' || g.kind === 'kettlebell' || g.kind === 'cable' || g.kind === 'band') ||
      (g.kind === 'barbell' && g.at !== 'back' && !g.behind);
    if (inFront) {
      front.push(...shapes);
    } else {
      back.push(...shapes);
    }
  }
  out.push(...back);

  /* --- membres du côté opposé (assombris) --- */
  const farColor = st.far;
  out.push(...limb(fig.hip, figFar.kneeFar, figFar.ankleFar, wThigh * 0.92, wShin * 0.92, farColor, st.outline, 1, 0.95));
  out.push(
    ...limb(fig.shoulder, figFar.elbowFar, figFar.handFar, wUpper * 0.92, wFore * 0.92, farColor, st.outline, 1, 0.95),
  );

  /* --- torse --- */
  out.push({ k: 'path', d: taperedCapsule(fig.hip, fig.shoulder, wHip + 0.035, wShoulder + 0.035), fill: st.outline });
  out.push({ k: 'path', d: taperedCapsule(fig.hip, fig.shoulder, wHip, wShoulder), fill: st.near });
  // cou
  out.push({ k: 'path', d: capsule(fig.shoulder, fig.neck, 0.085), fill: st.near });

  /* --- tête --- */
  const headDir = pose.torso + (pose.head ?? 0);
  const headC = pt(fig.shoulder, SEG.neck + SEG.head * 0.55, headDir);
  const faceTilt = headDir - 90;
  out.push({
    k: 'path',
    d: ellipsePath(headC, view === 'side' ? 0.31 : 0.3, view === 'side' ? 0.33 : 0.33, -faceTilt * (view === 'side' ? 1 : 0.35)),
    fill: st.outline,
  });
  out.push({
    k: 'path',
    d: ellipsePath(headC, view === 'side' ? 0.27 : 0.27, 0.29, -faceTilt * (view === 'side' ? 1 : 0.35)),
    fill: st.head,
  });
  // nez / regard (repère d'orientation)
  if (view === 'side') {
    const nose = pt(headC, 0.31, headDir - 90);
    out.push({ k: 'path', d: circlePath(nose, 0.06), fill: st.outline, op: 0.85 });
  }

  /* --- fessiers / bassin --- */
  out.push({ k: 'path', d: circlePath(fig.hip, wHip * 0.98), fill: st.near });

  /* --- muscles : membres côté caméra puis opposé --- */
  const pulse = input.pulse ?? 1;
  const hl = input.highlight ?? [];
  out.push(...muscleShapes(fig, pose, hl, st, 'near', view, pulse * vf));
  out.push(...muscleShapes(figFar, farPose, hl, st, 'far', view, pulse * vf * 0.7));

  /* --- membres côté caméra --- */
  out.push(...limb(fig.hip, fig.kneeNear, fig.ankleNear, wThigh, wShin, st.near, st.outline, 1, 1));
  out.push(...limb(fig.shoulder, fig.elbowNear, fig.handNear, wUpper, wFore, st.near, st.outline, 1, 1));

  /* --- mains / pieds --- */
  out.push({ k: 'path', d: circlePath(fig.handNear, 0.105), fill: st.near });
  out.push({ k: 'path', d: circlePath(figFar.handFar, 0.1), fill: st.far });
  out.push({ k: 'path', d: capsule(fig.ankleNear, fig.toeNear, 0.075), fill: st.near });
  out.push({ k: 'path', d: capsule(figFar.ankleFar, figFar.toeFar, 0.07), fill: st.far });

  /* --- équipement au premier plan --- */
  out.push(...front);

  return out;
}

/** Dessine une jambe ou un bras (deux segments + articulations). */
function limb(root: Pt, mid: Pt, end: Pt, r1: number, r2: number, color: string, outline: string, sign: number, op: number): Shape[] {
  const s: Shape[] = [];
  const d1 = taperedCapsule(root, mid, r1 + 0.035, r1 * 0.82 + 0.035);
  const d2 = taperedCapsule(mid, end, r2 + 0.035, r2 * 0.78 + 0.035);
  s.push({ k: 'path', d: d1, fill: outline, op });
  s.push({ k: 'path', d: d2, fill: outline, op });
  s.push({ k: 'path', d: taperedCapsule(root, mid, r1, r1 * 0.82), fill: color, op });
  s.push({ k: 'path', d: taperedCapsule(mid, end, r2, r2 * 0.78), fill: color, op });
  s.push({ k: 'path', d: circlePath(mid, Math.max(r1, r2) * 0.92), fill: color, op });
  void sign;
  return s;
}

function segPoints(fig: Figure, seg: SegId, side: 'near' | 'far'): [Pt, Pt] {
  switch (seg) {
    case 'torso':
      return [fig.hip, fig.shoulder];
    case 'neck':
      return [fig.shoulder, fig.neck];
    case 'upperArm':
      return side === 'near' ? [fig.shoulder, fig.elbowNear] : [fig.shoulder, fig.elbowFar];
    case 'foreArm':
      return side === 'near' ? [fig.elbowNear, fig.handNear] : [fig.elbowFar, fig.handFar];
    case 'thigh':
      return side === 'near' ? [fig.hip, fig.kneeNear] : [fig.hip, fig.kneeFar];
    case 'shin':
      return side === 'near' ? [fig.kneeNear, fig.ankleNear] : [fig.kneeFar, fig.ankleFar];
    case 'hip':
      return [fig.hip, fig.shoulder];
  }
}

function muscleShapes(
  fig: Figure,
  pose: Pose,
  highlight: MuscleId[],
  st: FigureStyle,
  side: 'near' | 'far',
  view: 'side' | 'front',
  pulse: number,
): Shape[] {
  if (highlight.length === 0 || pulse <= 0.01) return [];
  const s: Shape[] = [];
  for (const m of highlight) {
    const parts = MUSCLE_PARTS[m];
    if (!parts) continue;
    for (const p of parts) {
      if (p.both !== true && side === 'far') continue;
      const [a, b] = segPoints(fig, p.seg, side);
      let off = p.off;
      if (view === 'front' && p.depth) off = 0;
      if (view === 'front' && side === 'near') off = -off;
      const base = onSegment(a, b, p.t);
      const ang = perpOf(a, b);
      const c = pt(base, -off, ang);
      const rot = angleOf(a, b);
      s.push({
        k: 'path',
        d: ellipsePath(c, p.rx, p.ry, rot + 90),
        fill: st.glow,
        op: 0.34 * pulse * (side === 'far' ? 0.75 : 1),
      });
      s.push({
        k: 'path',
        d: ellipsePath(c, p.rx * 0.72, p.ry * 0.82, rot + 90),
        fill: st.glow,
        op: 0.5 * pulse * (side === 'far' ? 0.75 : 1),
      });
    }
  }
  void pose;
  return s;
}

/* ------------------------------------------------------------------ */
/* Équipement                                                          */
/* ------------------------------------------------------------------ */

function renderGear(g: GearSpec, fig: Figure, pose: Pose, st: FigureStyle, view: 'side' | 'front'): Shape[] {
  const s: Shape[] = [];
  const metal = st.gear;
  const dark = st.gearDark;

  switch (g.kind) {
    case 'ground':
      return [];

    case 'mat': {
      s.push({ k: 'path', d: roundRectPath(-1.1, -0.06, 2.2, 0.12, 0.06), fill: 'rgba(120,140,180,0.35)' });
      break;
    }

    case 'barbell': {
      const plate = g.plate ?? 0.38;
      const at = g.at ?? 'hands';
      let c: Pt;
      if (at === 'back') c = pt(fig.shoulder, 0.26, pose.torso);
      else if (at === 'shoulders') c = pt(fig.shoulder, 0.2, pose.torso);
      else if (at === 'hip') c = { x: fig.hip.x - 0.1, y: fig.hip.y };
      else c = fig.handNear;
      if (g.x !== undefined || g.y !== undefined) c = { x: g.x ?? c.x, y: g.y ?? c.y };
      // barre vue de bout + disques
      s.push({ k: 'path', d: circlePath(c, plate), fill: dark });
      s.push({ k: 'path', d: circlePath(c, plate * 0.82), fill: metal });
      s.push({ k: 'path', d: circlePath(c, plate * 0.44), fill: dark });
      s.push({ k: 'path', d: circlePath(c, 0.1), fill: '#c9d4e8' });
      break;
    }

    case 'dumbbell': {
      const size = g.size ?? 0.3;
      const hands: Pt[] = [];
      if (g.hand !== 'far') hands.push(fig.handNear);
      if (g.hand === 'both' || g.hand === 'far') hands.push(fig.handFar);
      for (const h of hands) {
        s.push({ k: 'path', d: roundRectPath(h.x - 0.1, h.y - 0.09, 0.2, 0.18, 0.05), fill: '#c9d4e8' });
        s.push({ k: 'path', d: circlePath({ x: h.x - 0.14, y: h.y }, size * 0.62), fill: dark });
        s.push({ k: 'path', d: circlePath({ x: h.x + 0.14, y: h.y }, size * 0.62), fill: dark });
        s.push({ k: 'path', d: circlePath({ x: h.x - 0.14, y: h.y }, size * 0.5), fill: metal });
        s.push({ k: 'path', d: circlePath({ x: h.x + 0.14, y: h.y }, size * 0.5), fill: metal });
      }
      break;
    }

    case 'kettlebell': {
      const hands: Pt[] = [];
      if (g.hand !== 'far') hands.push(fig.handNear);
      if (g.hand === 'both' || g.hand === 'far') hands.push(fig.handFar);
      for (const h of hands) {
        s.push({ k: 'path', d: `M ${h.x - 0.12} ${h.y + 0.02} A 0.13 0.13 0 0 1 ${h.x + 0.12} ${h.y + 0.02}`, fill: 'none', stroke: metal, sw: 0.06 });
        s.push({ k: 'path', d: circlePath({ x: h.x, y: h.y - 0.2 }, 0.26), fill: dark });
        s.push({ k: 'path', d: circlePath({ x: h.x, y: h.y - 0.2 }, 0.2), fill: metal });
      }
      break;
    }

    case 'bench': {
      const h = g.h ?? 0.14;
      const top = g.y;
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2, top, g.w, h, 0.06), fill: dark });
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2, top + h * 0.6, g.w, h * 0.4, 0.05), fill: metal, op: 0.5 });
      // pieds
      const legW = 0.1;
      for (const lx of [g.x - g.w / 2 + 0.18, g.x + g.w / 2 - 0.18]) {
        s.push({ k: 'path', d: roundRectPath(lx - legW / 2, Math.max(0, top - 0.42), legW, top - Math.max(0, top - 0.42), 0.03), fill: dark });
      }
      break;
    }

    case 'bar': {
      const w = g.w ?? 2.4;
      const x = g.x ?? 0;
      s.push({ k: 'path', d: roundRectPath(x - w / 2, g.y - 0.045, w, 0.09, 0.045), fill: metal });
      // montants
      s.push({ k: 'path', d: roundRectPath(x - w / 2 - 0.05, 0, 0.1, g.y, 0.03), fill: dark });
      s.push({ k: 'path', d: roundRectPath(x + w / 2 - 0.05, 0, 0.1, g.y, 0.03), fill: dark });
      if (view === 'front') s.push({ k: 'path', d: roundRectPath(x - w / 2, g.y - 0.5, w, 0.06, 0.03), fill: dark, op: 0.6 });
      break;
    }

    case 'cable':
    case 'band': {
      const hands: Pt[] = [];
      if (g.kind === 'cable') {
        if (g.hand !== 'far') hands.push(fig.handNear);
        if (g.hand === 'both') hands.push(fig.handFar);
      } else {
        if (g.hand !== 'far') hands.push(fig.handNear);
        if (g.hand === 'both') hands.push(fig.handFar);
      }
      const anchor = { x: g.x, y: g.y };
      if (g.kind === 'cable') {
        // tour de poulie
        s.push({ k: 'path', d: roundRectPath(anchor.x - 0.09, 0, 0.18, anchor.y, 0.05), fill: dark });
        s.push({ k: 'path', d: circlePath(anchor, 0.16), fill: metal });
        s.push({ k: 'path', d: circlePath(anchor, 0.07), fill: dark });
      } else {
        s.push({ k: 'path', d: roundRectPath(anchor.x - 0.06, 0, 0.12, anchor.y, 0.04), fill: dark });
        s.push({ k: 'path', d: circlePath(anchor, 0.1), fill: metal });
      }
      for (const h of hands) {
        s.push({ k: 'line', a: anchor, b: h, stroke: g.kind === 'band' ? '#4b5a75' : '#aab7cf', sw: g.kind === 'band' ? 0.05 : 0.045, cap: 'round' });
      }
      const attach = g.kind === 'cable' ? g.attach : undefined;
      for (const h of hands) {
        if (attach === 'bar' || attach === 'handle') {
          const len = attach === 'bar' ? 0.5 : 0.16;
          const dir = attach === 'bar' ? (view === 'front' ? 0 : 8) : 0;
          s.push({ k: 'path', d: roundRectPath(h.x - 0.04, h.y - len / 2, 0.08, len, 0.04), fill: metal, op: 0.9, stroke: 'none' });
          void dir;
        }
        if (attach === 'rope') {
          s.push({ k: 'path', d: capsule({ x: h.x - 0.1, y: h.y - 0.3 }, { x: h.x - 0.05, y: h.y }, 0.05), fill: metal });
          s.push({ k: 'path', d: capsule({ x: h.x + 0.1, y: h.y - 0.3 }, { x: h.x + 0.05, y: h.y }, 0.05), fill: metal });
        }
        if (attach === 'handle') {
          s.push({ k: 'path', d: circlePath(h, 0.11), fill: dark });
        }
      }
      break;
    }

    case 'pad': {
      const h = g.h ?? 0.16;
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2, g.y - h / 2, g.w, h, g.r ?? 0.07), fill: dark });
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2 + 0.03, g.y - h / 2 + 0.03, g.w - 0.06, h - 0.06, 0.05), fill: metal, op: 0.45 });
      break;
    }

    case 'box': {
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2, 0, g.w, g.h, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(g.x - g.w / 2, g.h - 0.08, g.w, 0.08, 0.03), fill: metal, op: 0.5 });
      break;
    }

    case 'cardio': {
      s.push(...cardioGear(g.variant, fig, st));
      break;
    }

    case 'machine': {
      s.push(...machineGear(g.variant, fig, pose, st, view));
      break;
    }
  }
  return s;
}

function cardioGear(v: GearSpec extends { kind: 'cardio' } ? never : 'treadmill' | 'bike' | 'rower' | 'elliptical' | 'rope', fig: Figure, st: FigureStyle): Shape[] {
  const s: Shape[] = [];
  const dark = st.gearDark;
  const metal = st.gear;
  switch (v) {
    case 'treadmill': {
      s.push({ k: 'path', d: roundRectPath(-1.5, 0.12, 3, 0.16, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(-1.5, 0.24, 0.12, 1.1, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(-1.6, 1.3, 0.7, 0.1, 0.05), fill: metal });
      s.push({ k: 'path', d: roundRectPath(-1.6, 1.38, 0.18, 0.5, 0.06), fill: dark });
      void fig;
      break;
    }
    case 'bike': {
      s.push({ k: 'path', d: roundRectPath(-0.85, 0.36, 1.5, 0.11, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(-0.2, 0.2, 0.12, 0.9, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(0.4, 0.9, 0.12, 0.7, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(0.1, 1.55, 0.7, 0.1, 0.05), fill: metal });
      s.push({ k: 'path', d: circlePath({ x: -0.1, y: 0.72 }, 0.55), fill: 'none', stroke: dark, sw: 0.08 });
      s.push({ k: 'line', a: { x: -0.1, y: 0.72 }, b: { x: 0.3, y: 1.1 }, stroke: metal, sw: 0.07, cap: 'round' });
      break;
    }
    case 'rower': {
      s.push({ k: 'path', d: roundRectPath(-1.9, 0.05, 3.4, 0.12, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(1.2, 0.1, 0.14, 0.55, 0.05), fill: dark });
      s.push({ k: 'path', d: circlePath({ x: 1.27, y: 0.72 }, 0.2), fill: metal, op: 0.6 });
      break;
    }
    case 'elliptical': {
      s.push({ k: 'path', d: roundRectPath(-1.4, 0.05, 2.6, 0.12, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(0.7, 0.1, 0.14, 1.1, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(0.2, 1.15, 0.6, 0.1, 0.05), fill: metal });
      break;
    }
    case 'rope': {
      s.push({ k: 'path', d: `M -0.9 ${fig.handNear.y + 0.05} Q 0 ${fig.handNear.y + 0.75} 0.9 ${fig.handNear.y + 0.05}`, fill: 'none', stroke: metal, sw: 0.05 });
      break;
    }
  }
  return s;
}

function machineGear(v: MachineVariant, fig: Figure, pose: Pose, st: FigureStyle, view: 'side' | 'front'): Shape[] {
  const s: Shape[] = [];
  const dark = st.gearDark;
  const metal = st.gear;
  const hipY = fig.hip.y;
  const seat = { x: fig.hip.x - 0.35, y: Math.max(0.34, hipY - 0.24) };

  const frame = (x: number, y: number, w: number, h: number, r = 0.05) =>
    s.push({ k: 'path', d: roundRectPath(x, y, w, h, r), fill: dark });

  switch (v) {
    case 'legext':
    case 'legcurl': {
      // assise + dossier
      frame(seat.x - 0.5, seat.y, 0.95, 0.14);
      const backAng = v === 'legext' ? -1 : 1;
      const bx = seat.x - 0.42 + (backAng < 0 ? -0.1 : 0.1);
      frame(bx, seat.y + 0.1, 0.14, 0.95);
      frame(seat.x - 0.5, 0, 0.14, seat.y);
      // levier + rouleau
      const ankle = v === 'legext' ? fig.ankleNear : fig.ankleNear;
      const pivot = { x: seat.x + 0.62, y: seat.y + (v === 'legext' ? 0.5 : 0.42) };
      s.push({ k: 'line', a: pivot, b: ankle, stroke: metal, sw: 0.09, cap: 'round' });
      s.push({ k: 'path', d: circlePath(ankle, 0.13), fill: metal });
      s.push({ k: 'path', d: circlePath(pivot, 0.1), fill: dark });
      void backAng;
      break;
    }
    case 'legpress': {
      frame(seat.x - 0.55, seat.y, 1.0, 0.15);
      frame(seat.x - 0.6, seat.y + 0.1, 0.16, 1.0);
      frame(seat.x - 0.55, 0, 0.16, seat.y);
      // plateau
      const footX = Math.max(fig.toeNear.x, fig.toeFar.x) + 0.06;
      frame(footX, 0.1, 0.14, 1.5);
      s.push({ k: 'line', a: { x: seat.x + 0.2, y: seat.y + 0.05 }, b: { x: footX, y: 0.85 }, stroke: metal, sw: 0.1, cap: 'round' });
      break;
    }
    case 'pecdeck':
    case 'chestpress': {
      frame(seat.x - 0.45, seat.y, 0.9, 0.14);
      frame(seat.x - 0.5, seat.y + 0.1, 0.15, 0.9);
      frame(seat.x - 0.45, 0, 0.15, seat.y);
      for (const h of [fig.handNear, fig.handFar]) {
        s.push({ k: 'line', a: { x: seat.x + 0.05, y: seat.y + 0.1 }, b: h, stroke: metal, sw: 0.08, cap: 'round' });
        s.push({ k: 'path', d: roundRectPath(h.x - 0.09, h.y - 0.3, 0.18, 0.6, 0.08), fill: metal, op: 0.85 });
      }
      break;
    }
    case 'latpulldown': {
      frame(seat.x - 0.45, seat.y, 0.9, 0.14);
      frame(seat.x - 0.5, seat.y + 0.1, 0.15, 0.9);
      frame(seat.x - 0.45, 0, 0.15, seat.y);
      // coussin de cuisses
      const thighMid = onSegment(fig.hip, fig.kneeNear, 0.5);
      s.push({ k: 'path', d: roundRectPath(thighMid.x - 0.22, thighMid.y, 0.44, 0.16, 0.07), fill: dark });
      // câble + barre
      const top = { x: fig.handNear.x, y: fig.handNear.y + 1.1 };
      s.push({ k: 'line', a: top, b: fig.handNear, stroke: '#aab7cf', sw: 0.045, cap: 'round' });
      s.push({ k: 'path', d: roundRectPath(fig.handNear.x - 0.05, fig.handNear.y - 0.45, 0.1, 0.9, 0.05), fill: metal });
      void view;
      break;
    }
    case 'seatedrow': {
      frame(seat.x - 0.45, seat.y, 0.9, 0.14);
      frame(seat.x - 0.5, 0, 0.15, seat.y + 0.1);
      // appui poitrine
      const chest = pt(fig.hip, 0.75, pose.torso);
      s.push({ k: 'path', d: roundRectPath(chest.x - 0.1, chest.y - 0.3, 0.22, 0.6, 0.09), fill: metal, op: 0.8 });
      s.push({ k: 'line', a: { x: chest.x - 0.35, y: chest.y + 0.1 }, b: { x: chest.x + 0.05, y: chest.y + 0.05 }, stroke: dark, sw: 0.09, cap: 'round' });
      const anchor = { x: fig.handNear.x + 1.0, y: fig.handNear.y - 0.3 };
      s.push({ k: 'line', a: anchor, b: fig.handNear, stroke: '#aab7cf', sw: 0.045, cap: 'round' });
      s.push({ k: 'path', d: circlePath(anchor, 0.14), fill: metal });
      break;
    }
    case 'smith': {
      s.push({ k: 'path', d: roundRectPath(-1.25, 0, 0.12, 2.5, 0.05), fill: dark });
      s.push({ k: 'path', d: roundRectPath(1.13, 0, 0.12, 2.5, 0.05), fill: dark });
      const by = fig.handNear.y;
      s.push({ k: 'path', d: roundRectPath(-1.3, by - 0.04, 2.6, 0.08, 0.04), fill: metal });
      s.push({ k: 'path', d: circlePath({ x: -1.19, y: by }, 0.2), fill: dark });
      s.push({ k: 'path', d: circlePath({ x: 1.19, y: by }, 0.2), fill: dark });
      break;
    }
    case 'calf': {
      frame(seat.x - 0.5, seat.y, 1.0, 0.15);
      frame(seat.x - 0.5, 0, 0.15, seat.y);
      const sh = pt(fig.shoulder, 0.2, pose.torso);
      s.push({ k: 'path', d: roundRectPath(sh.x - 0.3, sh.y - 0.1, 0.6, 0.2, 0.09), fill: metal, op: 0.85 });
      s.push({ k: 'path', d: roundRectPath(fig.toeNear.x - 0.3, 0, 0.55, 0.12, 0.04), fill: dark });
      break;
    }
    case 'hipthrust': {
      s.push({ k: 'path', d: roundRectPath(fig.hip.x - 0.85, 0, 0.5, 0.55, 0.08), fill: dark });
      s.push({ k: 'path', d: roundRectPath(fig.hip.x - 0.9, 0.5, 0.6, 0.13, 0.06), fill: metal, op: 0.6 });
      const bar = { x: fig.hip.x + 0.12, y: fig.hip.y + 0.16 };
      s.push({ k: 'path', d: circlePath(bar, 0.42), fill: dark });
      s.push({ k: 'path', d: circlePath(bar, 0.33), fill: metal });
      s.push({ k: 'path', d: circlePath(bar, 0.12), fill: '#c9d4e8' });
      break;
    }
    case 'abductor': {
      frame(seat.x - 0.45, seat.y, 0.9, 0.14);
      frame(seat.x - 0.5, seat.y + 0.1, 0.15, 0.9);
      frame(seat.x - 0.45, 0, 0.15, seat.y);
      for (const k of [fig.kneeNear, fig.kneeFar]) {
        s.push({ k: 'path', d: roundRectPath(k.x - 0.12, k.y - 0.3, 0.24, 0.55, 0.1), fill: metal, op: 0.8 });
      }
      break;
    }
    case 'shoulderpress': {
      frame(seat.x - 0.45, seat.y, 0.9, 0.14);
      frame(seat.x - 0.5, seat.y + 0.1, 0.15, 0.9);
      frame(seat.x - 0.45, 0, 0.15, seat.y);
      for (const h of [fig.handNear, fig.handFar]) {
        s.push({ k: 'line', a: { x: seat.x, y: seat.y + 0.1 }, b: h, stroke: metal, sw: 0.08, cap: 'round' });
        s.push({ k: 'path', d: roundRectPath(h.x - 0.1, h.y - 0.08, 0.2, 0.16, 0.06), fill: metal });
      }
      break;
    }
  }
  return s;
}

/* ------------------------------------------------------------------ */
/* Sérialisation SVG (utile pour l'export et les tests)                */
/* ------------------------------------------------------------------ */

export function shapesToSvgString(
  shapes: Shape[],
  opts: { width: number; height: number; scale: number; ox: number; oy: number; bg?: string; viewBox?: string },
): string {
  const inner = shapesToMarkup(shapes);
  const vb = opts.viewBox ?? `0 0 ${opts.width} ${opts.height}`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${opts.width}" height="${opts.height}" viewBox="${vb}">${
    opts.bg ? `<rect width="100%" height="100%" fill="${opts.bg}"/>` : ''
  }<g transform="translate(${opts.ox} ${opts.oy}) scale(${opts.scale} ${-opts.scale})">${inner}</g></svg>`;
}

export function shapesToMarkup(shapes: Shape[]): string {
  return shapes
    .map((s) => {
      const op = s.op !== undefined && s.op !== 1 ? ` opacity="${s.op}"` : '';
      switch (s.k) {
        case 'path': {
          const attrs = [`d="${s.d}"`];
          attrs.push(`fill="${s.fill ?? 'none'}"`);
          if (s.stroke) attrs.push(`stroke="${s.stroke}"`, `stroke-width="${s.sw ?? 1}"`, `stroke-linecap="${s.cap ?? 'round'}"`);
          if (s.dash) attrs.push(`stroke-dasharray="${s.dash}"`);
          return `<path ${attrs.join(' ')}${op}/>`;
        }
        case 'circle': {
          const attrs = [`cx="${s.c.x.toFixed(2)}"`, `cy="${s.c.y.toFixed(2)}"`, `r="${s.r.toFixed(3)}"`];
          attrs.push(`fill="${s.fill ?? 'none'}"`);
          if (s.stroke) attrs.push(`stroke="${s.stroke}"`, `stroke-width="${s.sw ?? 1}"`);
          return `<circle ${attrs.join(' ')}${op}/>`;
        }
        case 'rect': {
          const y = s.y;
          const attrs = [
            `x="${s.x.toFixed(2)}"`,
            `y="${y.toFixed(2)}"`,
            `width="${s.w.toFixed(2)}"`,
            `height="${s.h.toFixed(2)}"`,
            ...(s.rx ? [`rx="${s.rx.toFixed(2)}"`] : []),
          ];
          attrs.push(`fill="${s.fill ?? 'none'}"`);
          if (s.stroke) attrs.push(`stroke="${s.stroke}"`, `stroke-width="${s.sw ?? 1}"`);
          return `<rect ${attrs.join(' ')}${op}/>`;
        }
        case 'line': {
          const attrs = [
            `x1="${s.a.x.toFixed(2)}"`,
            `y1="${s.a.y.toFixed(2)}"`,
            `x2="${s.b.x.toFixed(2)}"`,
            `y2="${s.b.y.toFixed(2)}"`,
            `stroke="${s.stroke}"`,
            `stroke-width="${s.sw.toFixed(3)}"`,
            `stroke-linecap="${s.cap ?? 'round'}"`,
          ];
          if (s.dash) attrs.push(`stroke-dasharray="${s.dash}"`);
          return `<line ${attrs.join(' ')}${op}/>`;
        }
        case 'g':
          return `<g${op}>${shapesToMarkup(s.children)}</g>`;
      }
    })
    .join('');
}

export { lerp };
