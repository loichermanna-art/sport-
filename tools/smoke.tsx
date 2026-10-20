/**
 * Test de fumée : rend l'application côté serveur pour vérifier qu'aucun
 * composant ne lève d'erreur à l'exécution (données vides puis profil complet).
 *
 *   npx esbuild tools/smoke.tsx --bundle --platform=node --format=cjs --outfile=/tmp/smoke.cjs --jsx=automatic
 *   node /tmp/smoke.cjs
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
import { Progress } from '../src/views/Progress';
import { Programs } from '../src/views/Programs';
import { Session } from '../src/views/Session';

const KEY = 'gymos.v1';

function render(label: string, node: React.ReactElement) {
  const html = renderToString(createElement(StoreProvider, null, node));
  console.log(`\u2713 ${label} — ${html.length} caractères de HTML`);
  return html;
}

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

// 1. Premier lancement : onboarding
const a = render('onboarding (aucun profil)', createElement(App));
if (!a.includes('GYM OS')) throw new Error('Onboarding : marque absente');

// 2. Profil complet -> tableau de bord
const program = buildProgram(profile);
mem.set(
  KEY,
  JSON.stringify({ profile, programs: [program], activeProgramId: program.id, history: [], bodyweights: [], active: null }),
);
const b = render('tableau de bord (profil sèche / débutant)', createElement(App));
if (!b.includes('Bonjour')) throw new Error('Tableau de bord absent — début du rendu : ' + b.slice(0, 700));

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
console.log(`\u2713 ${EXERCISES.length} exercices rendus (${count} images) sans erreur`);

// 4. Bibliothèque complète
{
  const h = renderToString(createElement(StoreProvider, null, createElement(Library)));
  let n = 0;
  for (const _m of h.matchAll(/<svg/g)) n++;
  console.log(`\u2713 biblioth\u00e8que rendue — ${n} vignettes SVG, ${h.length} caractères`);
}

// 5. Programmes (CRUD)
render('programmes', createElement(Programs));

// 6. Suivi
render('suivi', createElement(Progress));

// 7. Séance en cours
{
  const found = findSessionForToday(program);
  const s0 = found.session ?? program.sessions[0];
  mem.set(
    KEY,
    JSON.stringify({
      profile,
      programs: [program],
      activeProgramId: program.id,
      history: [],
      bodyweights: [],
      active: {
        date: todayISO(),
        sessionId: s0.id,
        startedAt: Date.now(),
        finished: false,
        sets: Object.fromEntries(
          s0.items.map((it, i) => [
            it.exerciseId,
            Array.from({ length: it.sets }, (_, k) => ({
              reps: 10 + k,
              weight: 20,
              done: i === 0 && k === 0,
            })),
          ]),
        ),
      },
    }),
  );
  const h = renderToString(createElement(StoreProvider, null, createElement(Session, { onExit: () => undefined })));
  console.log(`\u2713 s\u00e9ance en cours rendue — ${h.length} caractères`);
}

console.log('\nTous les tests de fum\u00e9e sont pass\u00e9s.');
