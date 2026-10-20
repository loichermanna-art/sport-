/**
 * Générateur de programmes.
 * Objectif, niveau, et nombre de séances par semaine déterminent le volume,
 * les amplitudes de répétitions, les temps de repos et le choix des exercices.
 */
import type { Goal, Level, PlannedExercise, Profile, Program, Session } from './types';

interface Scheme {
  main: { sets: number; reps: string; rest: number };
  accessory: { sets: number; reps: string; rest: number };
  isolation: { sets: number; reps: string; rest: number };
  core: { sets: number; reps: string; rest: number };
}

const SCHEMES: Record<Goal, Scheme> = {
  seche: {
    main: { sets: 4, reps: '10-12', rest: 75 },
    accessory: { sets: 3, reps: '12-15', rest: 60 },
    isolation: { sets: 3, reps: '15', rest: 45 },
    core: { sets: 3, reps: '30 s', rest: 45 },
  },
  masse: {
    main: { sets: 4, reps: '8-12', rest: 120 },
    accessory: { sets: 3, reps: '10-12', rest: 90 },
    isolation: { sets: 3, reps: '12-15', rest: 60 },
    core: { sets: 3, reps: '12', rest: 60 },
  },
  force: {
    main: { sets: 5, reps: '5', rest: 180 },
    accessory: { sets: 4, reps: '6-8', rest: 150 },
    isolation: { sets: 3, reps: '10-12', rest: 90 },
    core: { sets: 3, reps: '10', rest: 90 },
  },
};

type Kind = keyof Scheme;

/** Exercices par famille, du plus « débutant » au plus avancé. */
const POOL = {
  squat: ['presse-cuisses', 'goblet-squat', 'squat-barre'],
  hinge: ['hip-thrust', 'rdl', 'souleve-de-terre'],
  lunge: ['fentes-avant', 'fentes-bulgares', 'fentes-laterales'],
  quadIso: ['leg-extension', 'squat-sumo'],
  hamIso: ['leg-curl'],
  calves: ['mollets-debout'],
  chestPress: ['dev-couche-halteres', 'dev-couche', 'pompes'],
  chestIncline: ['dev-incline', 'dev-couche-halteres'],
  chestIso: ['ecartes-machine', 'ecartes-poulie', 'dips'],
  pullV: ['tirage-vertical', 'tractions'],
  pullH: ['rowing-poulie', 'rowing-haltere', 'rowing-barre'],
  backIso: ['face-pull', 'shrugs', 'oiseau'],
  lowerBack: ['hyperextensions', 'souleve-de-terre'],
  shoulderPress: ['dev-halteres', 'dev-militaire'],
  deltIso: ['elevations-laterales', 'elevations-frontales'],
  biceps: ['curl-halteres', 'curl-poulie', 'curl-barre', 'curl-marteau'],
  triceps: ['extension-poulie', 'extension-nuque', 'dips-banc', 'kickback'],
  abs: ['crunch', 'planche', 'gainage-lateral', 'releve-genoux', 'russian-twist', 'mountain-climbers'],
  cardio: ['tapis-incline', 'elliptique', 'velo', 'rameur', 'corde-sauter'],
} as const;

function pick(level: Level, pool: readonly string[], offset = 0): string {
  const idx = Math.min(pool.length - 1, Math.max(0, (level === 1 ? 0 : level === 2 ? 1 : 1) + offset));
  return pool[idx];
}

function ex(s: Scheme, id: string, kind: Kind, note?: string): PlannedExercise {
  const cfg = s[kind];
  return { exerciseId: id, sets: cfg.sets, reps: cfg.reps, rest: cfg.rest, note };
}

/** Réduit le volume pour les débutants. */
function tune(level: Level, p: PlannedExercise): PlannedExercise {
  if (level !== 1) return p;
  return { ...p, sets: Math.max(2, p.sets - 1) };
}

const WEEKDAYS: Record<number, number[]> = {
  3: [0, 2, 4],
  4: [0, 1, 3, 4],
  5: [0, 1, 2, 4, 5],
  6: [0, 1, 2, 3, 4, 5],
};

interface Blueprint {
  name: string;
  focus: string;
  emoji: string;
  build: (level: Level, s: Scheme) => PlannedExercise[];
}

function makeBlueprints(days: number, goal: Goal): Blueprint[] {
  const L = (level: Level, s: Scheme) => ({ level, s });
  const core = (level: Level, s: Scheme, offset = 0) =>
    tune(level, ex(s, POOL.abs[offset % POOL.abs.length], 'core'));

  const legDay = (offset = 0): Blueprint => ({
    name: 'Jambes & fessiers',
    focus: 'Quadriceps, ischio-jambiers, fessiers',
    emoji: '🦵',
    build: (level, s) => [
      tune(level, ex(s, pick(level, POOL.squat), 'main', 'Le mouvement le plus complet')),
      ex(s, pick(level, POOL.hinge), 'accessory'),
      ex(s, pick(level, POOL.lunge), 'accessory'),
      ex(s, POOL.hamIso[0], 'isolation'),
      ex(s, POOL.quadIso[offset % POOL.quadIso.length], 'isolation'),
      ex(s, POOL.calves[0], 'isolation'),
    ],
  });

  const pushDay = (_offset = 0): Blueprint => ({
    name: 'Poussée — pecs, épaules, triceps',
    focus: 'Pectoraux, deltoïdes, triceps',
    emoji: '💪',
    build: (level, s) => [
      tune(level, ex(s, pick(level, POOL.chestPress), 'main')),
      ex(s, pick(level, POOL.chestIncline), 'accessory'),
      ex(s, pick(level, POOL.shoulderPress), 'accessory'),
      ex(s, POOL.deltIso[0], 'isolation'),
      ex(s, pick(level, POOL.triceps), 'isolation'),
    ],
  });

  const pullDay = (_offset = 0): Blueprint => ({
    name: 'Tirage — dos, biceps',
    focus: 'Dorsaux, trapèzes, biceps',
    emoji: '🔙',
    build: (level, s) => [
      tune(level, ex(s, pick(level, POOL.pullV), 'main')),
      ex(s, pick(level, POOL.pullH), 'accessory'),
      ex(s, POOL.backIso[0], 'isolation'),
      ex(s, POOL.backIso[1], 'isolation'),
      ex(s, pick(level, POOL.biceps), 'isolation'),
      ex(s, pick(level, POOL.biceps, 1), 'isolation'),
    ],
  });

  const upperDay = (_offset = 0): Blueprint => ({
    name: 'Haut du corps',
    focus: 'Pectoraux, dos, épaules, bras',
    emoji: '🏋️',
    build: (level, s) => [
      tune(level, ex(s, pick(level, POOL.chestPress), 'main')),
      ex(s, pick(level, POOL.pullH), 'accessory'),
      ex(s, pick(level, POOL.chestIncline), 'accessory'),
      ex(s, pick(level, POOL.shoulderPress), 'accessory'),
      ex(s, POOL.deltIso[0], 'isolation'),
      ex(s, pick(level, POOL.biceps), 'isolation'),
      ex(s, pick(level, POOL.triceps), 'isolation'),
    ],
  });

  const lowerDay = (offset = 0): Blueprint => ({
    name: 'Bas du corps & abdos',
    focus: 'Jambes, fessiers, gainage',
    emoji: '🦿',
    build: (level, s) => [
      tune(level, ex(s, pick(level, POOL.squat), 'main')),
      ex(s, pick(level, POOL.hinge), 'accessory'),
      ex(s, pick(level, POOL.lunge), 'accessory'),
      ex(s, POOL.hamIso[0], 'isolation'),
      ex(s, POOL.calves[0], 'isolation'),
      core(level, s, offset),
    ],
  });

  const fullDay = (variant: 0 | 1 | 2): Blueprint => {
    const names = [
      { name: 'Full body A', focus: 'Corps entier — force', emoji: '🔥' },
      { name: 'Full body B', focus: 'Corps entier — volume', emoji: '⚡' },
      { name: 'Full body C', focus: 'Corps entier — hypertrophie', emoji: '🎯' },
    ][variant];
    return {
      ...names,
      build: (level, s) => [
        tune(
          level,
          ex(s, variant === 0 ? pick(level, POOL.squat) : variant === 1 ? pick(level, POOL.chestPress) : pick(level, POOL.hinge), 'main'),
        ),
        ex(s, variant === 0 ? pick(level, POOL.pullH) : variant === 1 ? pick(level, POOL.pullV) : pick(level, POOL.squat), 'accessory'),
        ex(s, variant === 0 ? pick(level, POOL.chestPress) : variant === 1 ? pick(level, POOL.squat, 1) : pick(level, POOL.shoulderPress), 'accessory'),
        ex(s, variant === 0 ? POOL.hamIso[0] : variant === 1 ? pick(level, POOL.lunge) : POOL.backIso[0], 'accessory'),
        ex(s, pick(level, POOL.biceps), 'isolation'),
        ex(s, pick(level, POOL.triceps), 'isolation'),
        core(level, s, variant),
      ],
    };
  };

  void L;
  void goal;

  if (days <= 3) return [fullDay(0), fullDay(1), fullDay(2)];
  if (days === 4) return [upperDay(0), lowerDay(0), upperDay(1), lowerDay(1)];
  if (days === 5) return [pushDay(0), pullDay(0), legDay(0), upperDay(1), lowerDay(1)];
  return [pushDay(0), pullDay(0), legDay(0), pushDay(1), pullDay(1), legDay(1)];
}

export function buildProgram(p: Profile): Program {
  const s = SCHEMES[p.goal];
  const blueprints = makeBlueprints(p.days, p.goal);
  const weekdays = WEEKDAYS[Math.min(6, Math.max(3, p.days))] ?? WEEKDAYS[3];
  const cardioId = p.goal === 'seche' ? 'tapis-incline' : p.goal === 'masse' ? 'velo' : 'velo';

  const sessions: Session[] = blueprints.map((b, i) => {
    const items = b.build(p.level, s);
    const session: Session = {
      id: `s${i + 1}`,
      name: b.name,
      focus: b.focus,
      items,
      weekday: weekdays[i] ?? i,
    };
    void b.emoji;
    if (p.cardio || p.goal === 'seche') {
      session.cardio = {
        exerciseId: p.goal === 'seche' ? 'tapis-incline' : cardioId,
        minutes: p.goal === 'seche' ? 25 : 15,
      };
    }
    return session;
  });

  return newProgram(p, sessions);
}

export const PROGRAM_NAME: Record<Goal, string> = {
  seche: 'Sèche',
  masse: 'Prise de masse',
  force: 'Force',
};

let seq = 0;

/** Fabrique un programme complet et actif à partir d'un profil. */
export function newProgram(p: Profile, sessions: Session[], name?: string): Program {
  seq += 1;
  const id = `p${Date.now().toString(36)}${seq}`;
  return {
    id,
    name: name?.trim() || PROGRAM_NAME[p.goal],
    goal: p.goal,
    level: p.level,
    days: p.days,
    // Les identifiants de séance sont préfixés par le programme : deux
    // programmes peuvent coexister sans collision.
    sessions: sessions.map((s, i) => ({ ...s, id: `${id}-s${i + 1}` })),
    createdAt: new Date().toISOString(),
    status: 'active',
  };
}

export const GOAL_LABEL: Record<Goal, string> = {
  seche: 'Sèche — perdre du gras en gardant le muscle',
  masse: 'Prise de masse — construire du muscle',
  force: 'Force — soulever plus lourd',
};

export const GOAL_SHORT: Record<Goal, string> = { seche: 'Sèche', masse: 'Masse', force: 'Force' };

export const LEVEL_LABEL: Record<Level, string> = {
  1: 'Débutant — moins de 6 mois de pratique',
  2: 'Intermédiaire — 6 mois à 2 ans',
  3: 'Avancé — plus de 2 ans',
};

export function sessionDuration(session: Session): number {
  const work = session.items.reduce((acc, it) => acc + it.sets * (it.rest + 40), 0);
  const cardio = (session.cardio?.minutes ?? 0) * 60;
  return Math.round((work + cardio) / 60);
}
