/**
 * Test de fumée : rend l'application côté serveur pour vérifier qu'aucun
 * composant ne lève d'erreur à l'exécution (données vides puis profil complet).
 *
 *   npx esbuild tools/smoke.tsx --bundle --platform=node --format=esm --outfile=/tmp/smoke.mjs
 *   node /tmp/smoke.mjs
 */
const mem = new Map<string, string>();
(globalThis as unknown as { localStorage: unknown }).localStorage = {
  getItem: (k: string) => mem.get(k) ?? null,
  setItem: (k: string, v: string) => void mem.set(k, v),
  removeItem: (k: string) => void mem.delete(k),
  clear: () => mem.clear(),
};

import { renderToString } from 'react-dom/server';
import { createElement } from 'react';
import { StoreProvider, todayISO, findSessionForToday } from '../src/state/store';
import App from '../src/App';
import { buildProgram } from '../src/data/programs';
import { EXERCISES } from '../src/data/exercises';
import { renderFigure } from '../src/lib/render';
import { sampleTimeline } from '../src/lib/pose';
import { Library } from '../src/views/Library';

function render(label: string) {
  const html = renderToString(createElement(StoreProvider, null, createElement(App)));
  console.log(`✓ ${label} — ${html.length} caractères de HTML`);
  return html;
}

// 1. Premier lancement : onboarding
const a = render('onboarding (aucun profil)');
if (!a.includes('IronPath')) throw new Error('Onboarding : marque absente');

// 2. Profil complet -> séance du jour
const profile = {
  name: 'Test',
  goal: 'seche' as const,
  level: 1 as const,
  days: 4,
  weight: 70,
  age: 25,
  sex: 'x' as const,
  startDate: todayISO(),
  cardio: true,
};
mem.set('ironpath.v2', JSON.stringify({ profile, program: buildProgram(profile), history: [], bodyweights: [], active: null }));
const b = render('tableau de bord (profil sèche / débutant)');
if (!b.includes('Aujourd’hui')) throw new Error('Vue du jour absente');

// 3. Toutes les figures se rendent sans erreur, à 12 instants chacune
let count = 0;
for (const ex of EXERCISES) {
  for (let i = 0; i < 12; i++) {
    const shapes = renderFigure({
      pose: sampleTimeline(ex.frames, i / 12, true),
      view: ex.view,
      gear: ex.gear,
      highlight: ex.muscles,
      pulse: 1,
      floor: ex.ground !== false,
    });
    if (shapes.length === 0) throw new Error(`Aucune forme pour ${ex.id}`);
    count++;
  }
}
console.log(`✓ ${EXERCISES.length} exercices rendus (${count} images) sans erreur`);
// 4. Bibliothèque complète + séance en cours
{ const h = renderToString(createElement(StoreProvider, null, createElement(Library)));
  let n = 0; for (const m of h.matchAll(/<svg/g)) n++;
  console.log(`\u2713 biblioth\u00e8que rendue \u2014 ${n} vignettes SVG, ${h.length} caract\u00e8res`); }

{ const st = { profile, program: buildProgram(profile), history: [], bodyweights: [], active: null };
  const found = findSessionForToday(st.program);
  const s0 = found.session ?? st.program.sessions[0];
  st.active = { date: todayISO(), sessionId: s0.id, startedAt: Date.now(), finished: false,
    sets: Object.fromEntries(s0.items.map((it, i) => [it.exerciseId,
      Array.from({ length: it.sets }, (_, k) => ({ reps: String(10 + k), weight: 20, done: i === 0 && k === 0 }))])) };
  mem.set('ironpath.v2', JSON.stringify(st));
  const h = renderToString(createElement(StoreProvider, null, createElement(App)));
  console.log(`\u2713 s\u00e9ance en cours rendue \u2014 ${h.length} caract\u00e8res`); }

console.log('\nTous les tests de fum\u00e9e sont pass\u00e9s.');
