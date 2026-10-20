/**
 * Outils de développement : validation géométrique + planches de contrôle.
 *
 *   npx esbuild tools/preview.ts --bundle --platform=node --format=esm --outfile=/tmp/pv.mjs
 *   node /tmp/pv.mjs check                     # validation de tous les exercices
 *   node /tmp/pv.mjs sheet out.svg [cols]      # planche SVG
 *   node /tmp/pv.mjs one out.svg <id> [steps]  # un exercice en détail
 */
import { writeFileSync } from 'node:fs';
import { sampleTimeline, solve, SEG, type Pose, pt } from '../src/lib/pose';
import { renderFigure, shapesToSvgString, IRON_STYLE } from '../src/lib/render';
import { EXERCISES, type Exercise } from '../src/data/exercises';

const REACH_ARM = SEG.upperArm + SEG.foreArm;
const REACH_LEG = SEG.thigh + SEG.shin;

interface Issue {
  id: string;
  kind: string;
  detail: string;
}

function validate(ex: Exercise): Issue[] {
  const issues: Issue[] = [];
  const N = 12;
  for (let i = 0; i <= N; i++) {
    const u = i / N;
    const p = sampleTimeline(ex.frames, u * 0.999, false);
    for (const [k, v] of Object.entries(p)) {
      if (typeof v === 'number' && !Number.isFinite(v)) issues.push({ id: ex.id, kind: 'NaN', detail: `${k} à u=${u.toFixed(2)}` });
    }
    const f = solve(p);
    const pts: [string, { x: number; y: number }][] = Object.entries(f) as [string, { x: number; y: number }][];
    for (const [k, v] of pts) {
      if (!Number.isFinite(v.x) || !Number.isFinite(v.y)) issues.push({ id: ex.id, kind: 'NaN', detail: `figure.${k}` });
      if (v.y < -0.12 && ex.ground !== false) issues.push({ id: ex.id, kind: 'sous le sol', detail: `${k} y=${v.y.toFixed(2)}` });
      if (Math.abs(v.x) > 3) issues.push({ id: ex.id, kind: 'hors cadre', detail: `${k} x=${v.x.toFixed(2)}` });
    }
    // portée des cibles IK
    const check = (name: string, target: [number, number] | undefined, root: { x: number; y: number }, reach: number) => {
      if (!target) return;
      const d = Math.hypot(target[0] - root.x, target[1] - root.y);
      const tol = reach > 1.4 ? 0.03 : 0.008; // une jambe « verrouillée » tolère 2 mm d'écart
      if (d > reach + tol) {
        issues.push({ id: ex.id, kind: 'cible hors de portée', detail: `${name} d=${d.toFixed(2)} > ${reach}` });
      }
    };
    check('main', p.handNear, f.shoulder, REACH_ARM);
    check('mainLoin', p.handFar, f.shoulder, REACH_ARM);
    check('cheville', p.ankleNear, f.hip, REACH_LEG);
    check('chevilleLoin', p.ankleFar, f.hip, REACH_LEG);
  }
  return issues;
}

function figureShapes(ex: Exercise, u: number) {
  const p = sampleTimeline(ex.frames, u * 0.999, false);
  return renderFigure({ pose: p, view: ex.view, gear: ex.gear, highlight: ex.muscles, style: IRON_STYLE, pulse: 1, floor: ex.ground !== false });
}

/** Planche de tous les exercices. */
export function sheet(outSvg: string, cols = 8) {
  const cw = 250;
  const ch = 360;
  const scale = 92;
  const rows = Math.ceil(EXERCISES.length / cols);
  const W = cw * cols;
  const H = ch * rows;
  let body = '';
  EXERCISES.forEach((ex, i) => {
    const cx = (i % cols) * cw;
    const cy = Math.floor(i / cols) * ch;
    const shapes = figureShapes(ex, 0.5);
    const g = shapesToSvgString(shapes, { width: cw, height: ch, scale, ox: cw / 2, oy: ch - 46, viewBox: `0 0 ${cw} ${ch}` });
    body += `<g transform="translate(${cx} ${cy})">${g.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}`;
    body += `<text x="10" y="24" fill="#c9d6ef" font-family="system-ui" font-size="14">${ex.name}</text></g>`;
  });
  writeFileSync(outSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><rect width="100%" height="100%" fill="#0d1220"/>${body}</svg>`);
  return { W, H };
}

/** Un exercice, plusieurs positions. */
export function one(outSvg: string, ex: Exercise, steps = 4) {
  const cw = 250;
  const ch = 360;
  const scale = 100;
  const W = cw * steps;
  let body = '';
  for (let s = 0; s < steps; s++) {
    const u = steps === 1 ? 0 : s / (steps - 1);
    const shapes = figureShapes(ex, u * 0.999);
    const g = shapesToSvgString(shapes, { width: cw, height: ch, scale, ox: cw / 2, oy: ch - 46, viewBox: `0 0 ${cw} ${ch}` });
    body += `<g transform="translate(${s * cw} 0)">${g.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '')}</g>`;
  }
  writeFileSync(outSvg, `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${ch}" viewBox="0 0 ${W} ${ch}"><rect width="100%" height="100%" fill="#0d1220"/>${body}</svg>`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const cmd = process.argv[2] ?? 'check';
  if (cmd === 'check') {
    let all: Issue[] = [];
    for (const ex of EXERCISES) all = all.concat(validate(ex));
    if (all.length === 0) {
      console.log(`✓ ${EXERCISES.length} exercices validés, aucun problème géométrique.`);
    } else {
      const byId = new Map<string, Issue[]>();
      for (const i of all) {
        const arr = byId.get(i.id) ?? [];
        arr.push(i);
        byId.set(i.id, arr);
      }
      console.log(`${all.length} problème(s) sur ${byId.size} exercice(s) :`);
      for (const [id, arr] of byId) {
        const uniq = [...new Set(arr.map((a) => `${a.kind}: ${a.detail}`))];
        console.log(`  ${id}\n    ${uniq.slice(0, 4).join('\n    ')}`);
      }
    }
  } else if (cmd === 'sheet') {
    const r = sheet(process.argv[3] ?? '/tmp/sheet.svg', Number(process.argv[4] ?? 8));
    console.log('écrit', process.argv[3], r);
  } else if (cmd === 'one') {
    const ex = EXERCISES.find((e) => e.id === process.argv[4]);
    if (!ex) {
      console.log('exercices:', EXERCISES.map((e) => e.id).join(', '));
    } else {
      one(process.argv[3] ?? '/tmp/one.svg', ex, Number(process.argv[5] ?? 4));
      console.log('écrit', process.argv[3], '->', ex.name);
    }
  }
}
