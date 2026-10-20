/**
 * Bibliothèque d'exercices d'IronPath.
 *
 * Chaque exercice porte :
 *  - ses muscles travaillés (utilisés pour la coloration de la silhouette),
 *  - ses keyframes d'animation (voir `src/lib/pose.ts`),
 *  - son équipement (dessiné par `src/lib/render.ts`),
 *  - des consignes d'exécution, de respiration et les erreurs classiques.
 */
import { pose, pt, SEG, type Pose } from '../lib/pose';
import type { GearSpec, MuscleId } from '../lib/render';

const RAD = Math.PI / 180;

export type Equipment = 'barbell' | 'dumbbell' | 'machine' | 'cable' | 'bodyweight' | 'cardio' | 'band' | 'kettlebell';
export type Level = 1 | 2 | 3;

export interface Exercise {
  id: string;
  name: string;
  aka?: string;
  muscles: MuscleId[];
  secondary?: MuscleId[];
  equip: Equipment;
  level: Level;
  view: 'side' | 'front';
  /** Secondes pour un cycle complet (aller-retour). */
  tempo: number;
  frames: Pose[];
  gear?: GearSpec[];
  steps: string[];
  cues: string[];
  mistakes: string[];
  breathing: string;
  load: string;
  unilateral?: boolean;
  /** Masque le sol (exercices suspendus). */
  ground?: false;
  /** Vue de face : mettre à false si les deux bras sont décrits séparément. */
  mirror?: boolean;
}

/* ------------------------------------------------------------------ */
/* Petites aides de construction                                        */
/* ------------------------------------------------------------------ */

const HY = 1.86;

function shoulderOf(hip: [number, number], torso: number) {
  return pt({ x: hip[0], y: hip[1] }, SEG.torso, torso);
}

/** Barre posée sur les trapèzes (squat). */
function onTraps(hip: [number, number], torso: number, dist = 0.24, off = 58): [number, number] {
  const s = shoulderOf(hip, torso);
  const a = (torso + off) * RAD;
  return [+(s.x + Math.cos(a) * dist).toFixed(3), +(s.y + Math.sin(a) * dist).toFixed(3)];
}

/** Debout, bras le long du corps. */
function stand(o: Partial<Pose> = {}): Pose {
  return pose({
    hip: [0, HY],
    torso: 90,
    head: 0,
    armNear: [-90, -90],
    armFar: [-93, -93],
    legNear: [-90, -90],
    legFar: [-92, -92],
    footNear: 0,
    footFar: 0,
    ...o,
  });
}

/* ------------------------------------------------------------------ */
/* JAMBES                                                               */
/* ------------------------------------------------------------------ */

const squatBarre: Exercise = {
  id: 'squat-barre',
  name: 'Squat à la barre',
  aka: 'Back squat',
  equip: 'barbell',
  level: 3,
  view: 'side',
  tempo: 3.6,
  muscles: ['quads', 'glutes'],
  secondary: ['hamstrings', 'calves', 'abs'],
  frames: [
    stand({
      hip: [0.05, HY],
      torso: 88,
      ankleNear: [0.18, 0.16],
      ankleFar: [-0.08, 0.16],
      handNear: onTraps([0.05, HY], 88),
      handFar: [onTraps([0.05, HY], 88)[0] - 0.07, onTraps([0.05, HY], 88)[1] - 0.03],
      elbow: 'down',
    }),
    pose({
      hip: [-0.27, 0.95],
      torso: 52,
      head: 13,
      ankleNear: [0.6, 0.16],
      ankleFar: [0.33, 0.16],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: onTraps([-0.27, 0.95], 52),
      handFar: [onTraps([-0.27, 0.95], 52)[0] - 0.07, onTraps([-0.27, 0.95], 52)[1] - 0.03],
      elbow: 'down',
    }),
  ],
  gear: [{ kind: 'barbell', at: 'hands', behind: true }],
  steps: [
    'Barre posée sur les trapèzes, mains un peu plus larges que les épaules, coudes bas.',
    'Inspire, verrouille le gainage, puis recule les hanches et plie les genoux en même temps.',
    'Descends jusqu’à ce que les cuisses passent sous la parallèle, genoux dans l’axe des orteils.',
    'Pousse dans les talons et les hanches pour remonter, buste gainé, sans arrondir le dos.',
  ],
  cues: ['Regarde droit devant toi', 'Pousse les genoux vers l’extérieur', 'Talons bien à plat au sol'],
  mistakes: [
    'Dos qui s’arrondit en bas du mouvement (bassin qui part en rétroversion).',
    'Genoux qui rentrent vers l’intérieur.',
    'Talons qui décollent : chevilles trop raides ou barre trop en avant.',
  ],
  breathing: 'Inspire en descendant (prise d’air dans le ventre), expire fort en poussant.',
  load: 'Vide (20 kg) pour apprendre le mouvement, puis 5 séries × 8-10 reps.',
};

const gobletSquat: Exercise = {
  id: 'goblet-squat',
  name: 'Squat gobelet',
  aka: 'Goblet squat',
  equip: 'kettlebell',
  level: 1,
  view: 'side',
  tempo: 3.4,
  muscles: ['quads', 'glutes'],
  secondary: ['abs', 'calves'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.12, 0.16], handNear: [0.3, 2.05], handFar: [0.24, 2.0], elbow: 'down' }),
    pose({
      hip: [-0.26, 0.98],
      torso: 64,
      head: 8,
      ankleNear: [0.56, 0.16],
      ankleFar: [0.28, 0.16],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: [0.44, 1.34],
      handFar: [0.36, 1.3],
      elbow: 'down',
    }),
  ],
  gear: [{ kind: 'kettlebell', hand: 'both' }],
  steps: [
    'Tiens la kettlebell contre la poitrine, coudes collés au buste.',
    'Descends en écartant les genoux, les coudes passent à l’intérieur des cuisses.',
    'Marque une pause d’une seconde en bas, puis remonte en poussant sur les talons.',
  ],
  cues: ['Buste bien droit', 'Le poids te sert de contrepoids', 'Descends aussi bas que ta mobilité le permet'],
  mistakes: ['Lâcher la charge vers l’avant (le buste s’écrase).', 'Genoux qui rentrent.', 'Descendre trop vite et rebondir en bas.'],
  breathing: 'Inspire en bas, expire en poussant.',
  load: '12 à 20 kg, 3 à 4 séries × 10-12 reps.',
};

const presseCuisses: Exercise = {
  id: 'presse-cuisses',
  name: 'Presse à cuisses',
  aka: 'Leg press',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3.2,
  muscles: ['quads', 'glutes'],
  secondary: ['hamstrings'],
  frames: [
    pose({
      hip: [-0.3, 0.72],
      torso: 136,
      head: -46,
      ankleNear: [0.36, 1.16],
      ankleFar: [0.2, 1.18],
      knee: 'up',
      footNear: 35,
      footFar: 35,
      armNear: [-38, -66],
      armFar: [-42, -70],
    }),
    pose({
      hip: [-0.34, 0.72],
      torso: 136,
      head: -46,
      ankleNear: [0.9, 1.72],
      ankleFar: [0.76, 1.74],
      knee: 'up',
      footNear: 45,
      footFar: 45,
      armNear: [-38, -66],
      armFar: [-42, -70],
    }),
  ],
  gear: [{ kind: 'machine', variant: 'legpress' }],
  steps: [
    'Dos et fessiers plaqués contre le dossier, pieds à largeur d’épaules sur le plateau.',
    'Déverrouille la sécurité et descends le plateau en pliant les genoux, sans décoller le bassin.',
    'Descends jusqu’à 90° de flexion, puis pousse sans verrouiller brutalement les genoux.',
  ],
  cues: ['Ne décolle jamais le bas du dos', 'Genoux alignés avec les orteils', 'Amplitude complète mais confortable'],
  mistakes: [
    'Fessiers qui décollent du dossier en bas (amplitude trop grande).',
    'Verrouiller les genoux violemment en haut.',
    'Pieds trop hauts sur le plateau : cela surcharge les fessiers et le dos.',
  ],
  breathing: 'Inspire en descendant, expire en poussant.',
  load: 'Charge modérée, 4 séries × 12 reps, tempo contrôlé.',
};

const fentesAvant: Exercise = {
  id: 'fentes-avant',
  name: 'Fentes avant',
  aka: 'Walking lunges',
  equip: 'dumbbell',
  level: 2,
  view: 'side',
  tempo: 3.6,
  muscles: ['quads', 'glutes'],
  secondary: ['hamstrings', 'calves'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.14, 0.16], ankleFar: [-0.14, 0.16], armNear: [-88, -88], armFar: [-92, -92] }),
    pose({
      hip: [0.02, 1.05],
      torso: 88,
      head: 0,
      ankleNear: [0.88, 0.19],
      ankleFar: [-0.78, 0.16],
      kneeNear: 'up',
      kneeFar: 'down',
      footNear: 0,
      footFar: -12,
      armNear: [-88, -88],
      armFar: [-92, -92],
    }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Debout, haltères le long du corps, fais un grand pas en avant.',
    'Descends jusqu’à ce que le genou arrière frôle le sol, buste bien vertical.',
    'Pousse fort dans le talon avant pour revenir en position debout, puis enchaîne de l’autre côté.',
  ],
  cues: ['Buste droit, regard loin devant', 'Le genou avant ne dépasse pas trop les orteils', 'Grand écart de pas pour bien charger la fesse'],
  mistakes: ['Pas trop court (le genou avant part très loin devant).', 'Buste qui bascule en avant.', 'Genou arrière qui tape le sol.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: '2 haltères légers, 3 séries × 10 reps par jambe.',
};

const fentesBulgares: Exercise = {
  id: 'fentes-bulgares',
  name: 'Fentes bulgares',
  aka: 'Bulgarian split squat',
  equip: 'dumbbell',
  level: 2,
  view: 'side',
  tempo: 3.6,
  muscles: ['quads', 'glutes'],
  secondary: ['hamstrings', 'calves'],
  unilateral: true,
  frames: [
    pose({
      hip: [0, 1.32],
      torso: 88,
      head: 0,
      ankleNear: [0.64, 0.16],
      ankleFar: [-0.66, 0.56],
      kneeNear: 'up',
      kneeFar: 'down',
      footNear: 0,
      footFar: -18,
      armNear: [-88, -88],
      armFar: [-92, -92],
    }),
    pose({
      hip: [0, 1.02],
      torso: 88,
      head: 0,
      ankleNear: [0.64, 0.16],
      ankleFar: [-0.66, 0.56],
      kneeNear: 'up',
      kneeFar: 'down',
      footNear: 0,
      footFar: -18,
      armNear: [-88, -88],
      armFar: [-92, -92],
    }),
  ],
  gear: [
    { kind: 'bench', x: -0.86, y: 0.5, w: 1.1 },
    { kind: 'dumbbell', hand: 'both' },
  ],
  steps: [
    'Pied arrière posé sur le banc, pied avant assez loin pour que le genou reste au-dessus de la cheville.',
    'Descends verticalement jusqu’à ce que la cuisse avant soit parallèle au sol.',
    'Remonte en poussant dans le talon avant, sans te pencher.',
  ],
  cues: ['Buste vertical', 'Le genou arrière descend vers le sol', 'Garde l’équilibre avec le regard'],
  mistakes: ['Pied avant trop près (le genou surcharge).', 'Se pencher vers l’avant pour compenser.', 'Rebondir en bas du mouvement.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: '2 haltères légers, 3 séries × 8-10 reps par jambe.',
};

const legExtension: Exercise = {
  id: 'leg-extension',
  name: 'Extension des jambes',
  aka: 'Leg extension',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['quads'],
  frames: [
    pose({ hip: [-0.28, 0.98], torso: 100, head: -12, legNear: [4, -72], legFar: [6, -70], footNear: -40, footFar: -40, armNear: [-52, -74], armFar: [-56, -78] }),
    pose({ hip: [-0.28, 0.98], torso: 100, head: -12, legNear: [2, 4], legFar: [4, 6], footNear: -6, footFar: -6, armNear: [-52, -74], armFar: [-56, -78] }),
  ],
  gear: [{ kind: 'machine', variant: 'legext' }],
  steps: [
    'Assis, dos plaqué, le rouleau posé juste au-dessus des chevilles.',
    'Étends les jambes jusqu’à l’extension complète en contractant les quadriceps.',
    'Redescends lentement sous contrôle, sans laisser le poids claquer.',
  ],
  cues: ['Contracte la cuisse une seconde en haut', 'Ne te penche pas en arrière', 'Mouvement lent et contrôlé'],
  mistakes: ['Utiliser l’élan et balancer la charge.', 'Décoller les fessiers de l’assise.', 'Charge trop lourde pour les genoux.'],
  breathing: 'Expire en étendant, inspire en revenant.',
  load: 'Charge moyenne, 3 séries × 12-15 reps.',
};

const legCurl: Exercise = {
  id: 'leg-curl',
  name: 'Flexion des jambes (ischio)',
  aka: 'Leg curl',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['hamstrings'],
  secondary: ['calves'],
  frames: [
    pose({ hip: [-0.28, 1.05], torso: 100, head: -12, legNear: [6, -8], legFar: [8, -6], footNear: -30, footFar: -30, armNear: [-52, -74], armFar: [-56, -78] }),
    pose({ hip: [-0.28, 1.05], torso: 100, head: -12, legNear: [6, -132], legFar: [8, -130], footNear: -80, footFar: -80, armNear: [-52, -74], armFar: [-56, -78] }),
  ],
  gear: [{ kind: 'machine', variant: 'legcurl' }],
  steps: [
    'Assis (ou allongé), le rouleau calé derrière les chevilles.',
    'Ramène les talons vers les fessiers en contractant les ischio-jambiers.',
    'Contrôle le retour jusqu’à l’extension presque complète.',
  ],
  cues: ['Ne cambre pas le dos', 'Serre une seconde en position haute', 'Le bassin reste immobile'],
  mistakes: ['Décoller les genoux du coussin.', 'Utiliser le dos pour tirer la charge.', 'Retour brutal en position basse.'],
  breathing: 'Expire en tirant, inspire en revenant.',
  load: 'Charge moyenne, 3 séries × 12 reps.',
};

const rdl: Exercise = {
  id: 'rdl',
  name: 'Soulevé de terre roumain',
  aka: 'Romanian deadlift',
  equip: 'barbell',
  level: 2,
  view: 'side',
  tempo: 3.8,
  muscles: ['hamstrings', 'glutes'],
  secondary: ['lowerBack', 'traps'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.22, 0.18], ankleFar: [0.02, 0.18], knee: 'up', handNear: [0.2, 1.68], handFar: [0.08, 1.68], elbow: 'down' }),
    pose({
      hip: [-0.1, 1.4],
      torso: 30,
      head: -5,
      ankleNear: [0.24, 0.18],
      ankleFar: [0.04, 0.18],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: [0.32, 0.86],
      handFar: [0.24, 0.9],
      elbow: 'down',
    }),
  ],
  gear: [{ kind: 'barbell', at: 'hands' }],
  steps: [
    'Debout, barre au niveau des cuisses, genoux très légèrement fléchis.',
    'Recule les hanches comme pour toucher un mur derrière toi, la barre rase les jambes.',
    'Descends jusqu’à sentir l’étirement des ischio-jambiers, puis remonte en poussant les hanches vers l’avant.',
  ],
  cues: ['Dos toujours neutre', 'Ce sont les hanches qui reculent, pas le buste qui s’arrondit', 'Barre collée aux jambes'],
  mistakes: [
    'Arrondir le dos en bas du mouvement.',
    'Transformer le mouvement en squat (trop de flexion de genoux).',
    'Éloigner la barre du corps : les lombaires trinquent.',
  ],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Charge modérée, 3 séries × 10 reps, tempo lent.',
};

const souleveTerre: Exercise = {
  id: 'souleve-de-terre',
  name: 'Soulevé de terre',
  aka: 'Deadlift',
  equip: 'barbell',
  level: 3,
  view: 'side',
  tempo: 4,
  muscles: ['hamstrings', 'glutes', 'lowerBack', 'traps'],
  secondary: ['quads', 'forearms'],
  frames: [
    pose({
      hip: [-0.05, 1.0],
      torso: 45,
      head: -25,
      ankleNear: [0.26, 0.18],
      ankleFar: [0.06, 0.18],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: [0.36, 0.52],
      handFar: [0.28, 0.56],
      elbow: 'down',
    }),
    stand({ hip: [0, HY], torso: 92, ankleNear: [0.18, 0.18], ankleFar: [-0.02, 0.18], handNear: [0.16, 1.62], handFar: [0.04, 1.64], elbow: 'down' }),
  ],
  gear: [{ kind: 'barbell', at: 'hands' }],
  steps: [
    'Pieds sous la barre (à mi-pied), tibias à 2 cm de la barre, mains juste à l’extérieur des genoux.',
    'Inspire, gonfle le ventre, recule les hanches puis pousse dans les talons.',
    'La barre monte en rasant les jambes ; verrouille en haut en poussant les hanches vers l’avant.',
    'Repose la barre en inversant le mouvement, sans lâcher la charge.',
  ],
  cues: ['Dos neutre et gainé', 'Pousse les pieds à travers le sol', 'Épaules légèrement devant la barre au départ'],
  mistakes: ['Démarrer avec les hanches trop basses ou trop hautes.', 'Tirer à bout de bras en arrondissant le dos.', 'Barre qui s’éloigne du corps.'],
  breathing: 'Inspire et bloque avant de décoller, expire une fois la barre verrouillée.',
  load: 'Apprends d’abord au RDL. 4 séries × 5 reps lourdes mais propres.',
};

const hipThrust: Exercise = {
  id: 'hip-thrust',
  name: 'Hip thrust',
  aka: 'Hip thrust à la barre',
  equip: 'barbell',
  level: 2,
  view: 'side',
  tempo: 3,
  muscles: ['glutes'],
  secondary: ['hamstrings', 'abs'],
  frames: [
    pose({
      hip: [0.1, 0.62],
      torso: 172,
      head: 8,
      ankleNear: [0.86, 0.16],
      ankleFar: [0.66, 0.16],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: [0.28, 0.74],
      handFar: [0.16, 0.74],
      elbow: 'down',
    }),
    pose({
      hip: [0.05, 1.15],
      torso: 135,
      head: -35,
      ankleNear: [0.86, 0.16],
      ankleFar: [0.66, 0.16],
      knee: 'up',
      footNear: 0,
      footFar: 0,
      handNear: [0.24, 1.27],
      handFar: [0.12, 1.27],
      elbow: 'down',
    }),
  ],
  gear: [
    { kind: 'bench', x: -1.0, y: 0.5, w: 1.1 },
    { kind: 'barbell', at: 'hands' },
  ],
  steps: [
    'Haut du dos posé sur le banc, barre sur les hanches (protège-la avec un coussin).',
    'Descends le bassin sans poser les fessiers au sol, puis pousse les hanches vers le plafond.',
    'En haut, contracte fort les fessiers et aligne bassin, tronc et cuisses.',
  ],
  cues: ['Menton rentré, regard vers l’avant', 'Contracte les fessiers une seconde en haut', 'Genoux dans l’axe des orteils'],
  mistakes: ['Creuser les lombaires en haut (compenser avec le dos).', 'Pousser sur les orteils au lieu des talons.', 'Amplitude incomplète.'],
  breathing: 'Inspire en bas, expire en montant.',
  load: 'Charge modérée, 4 séries × 12 reps.',
};

const molletsDebout: Exercise = {
  id: 'mollets-debout',
  name: 'Mollets debout à la machine',
  aka: 'Standing calf raise',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 2.6,
  muscles: ['calves'],
  secondary: ['calvesSoleus'],
  frames: [
    pose({ hip: [0, HY], torso: 90, head: 0, legNear: [-90, -90], legFar: [-92, -92], footNear: 8, footFar: 8, armNear: [-86, -86], armFar: [-90, -90] }),
    pose({ hip: [0, 2.11], torso: 90, head: 0, legNear: [-90, -90], legFar: [-92, -92], footNear: -46, footFar: -46, armNear: [-86, -86], armFar: [-90, -90] }),
  ],
  gear: [{ kind: 'machine', variant: 'calf' }, { kind: 'box', x: 0.3, y: 0, w: 0.6, h: 0.16 }],
  steps: [
    'Épaules sous les coussins, orteils sur le rebord, talons libres dans le vide.',
    'Descends lentement pour étirer le mollet, marque un arrêt.',
    'Monte sur la pointe des pieds le plus haut possible en contractant les mollets.',
  ],
  cues: ['Amplitude complète', 'Une seconde de contraction en haut', 'Ne triche pas avec les genoux'],
  mistakes: ['Rebondir en bas (risque pour le tendon d’Achille).', 'Plier les genoux pour aider.', 'Amplitude minuscule.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: 'Charge modérée, 4 séries × 15-20 reps.',
};

const fentesLaterales: Exercise = {
  id: 'fentes-laterales',
  name: 'Fentes latérales',
  aka: 'Side lunges',
  equip: 'bodyweight',
  level: 2,
  view: 'front',
  tempo: 3.2,
  muscles: ['adductors', 'glutes', 'quads'],
  secondary: ['hamstrings'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.24, 0.18], ankleFar: [-0.24, 0.18], knee: 'auto', footNear: -10, footFar: -10, armNear: [-84, -80], armFar: [-84, -80] }),
    pose({
      hip: [0, 1.45],
      torso: 92,
      head: 0,
      ankleNear: [0.56, 0.18],
      ankleFar: [-1.11, 0.18],
      kneeNear: 'up',
      kneeFar: 'auto',
      footNear: -14,
      footFar: -14,
      armNear: [-52, -30],
      armFar: [-52, -30],
    }),
  ],
  steps: [
    'Debout, pieds écartés, buste droit et gainage engagé.',
    'Déplace le poids sur une jambe en poussant le bassin vers l’arrière, genou dans l’axe du pied.',
    'L’autre jambe reste tendue. Pousse dans le talon pour revenir au centre, puis alterne.',
  ],
  cues: ['Genou aligné avec les orteils', 'Buste droit, ne te penche pas', 'Pousse fort dans le talon'],
  mistakes: ['Genou qui part vers l’intérieur.', 'Buste qui bascule sur le côté.', 'Pied d’appui trop loin.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Poids du corps, 3 séries × 10 reps de chaque côté. Ajoute des haltères ensuite.',
};

const squatSumo: Exercise = {
  id: 'squat-sumo',
  name: 'Squat sumo',
  aka: 'Sumo squat',
  equip: 'kettlebell',
  level: 1,
  view: 'front',
  tempo: 3.4,
  muscles: ['adductors', 'glutes', 'quads'],
  secondary: ['hamstrings', 'calves'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.3, 0.18], ankleFar: [-0.3, 0.18], knee: 'auto', footNear: -25, footFar: -25, handNear: [0.22, 1.9], handFar: [-0.22, 1.9], elbow: 'down' }),
    pose({
      hip: [0, 1.33],
      torso: 90,
      head: 0,
      ankleNear: [0.95, 0.18],
      ankleFar: [-0.95, 0.18],
      knee: 'up',
      footNear: -30,
      footFar: -30,
      handNear: [0.24, 1.72],
      handFar: [-0.24, 1.72],
      elbow: 'down',
    }),
  ],
  gear: [{ kind: 'kettlebell', hand: 'both' }],
  steps: [
    'Pieds bien plus larges que les épaules, pointes tournées vers l’extérieur (30 à 45°).',
    'Tiens la kettlebell devant la poitrine, buste droit.',
    'Descends en poussant les genoux vers l’extérieur, puis remonte en contractant les fessiers.',
  ],
  cues: ['Genoux ouverts vers les orteils', 'Buste vertical', 'Serre les fessiers en haut'],
  mistakes: ['Genoux qui rentrent vers l’intérieur.', 'Se pencher en avant.', 'Pieds pas assez écartés.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Kettlebell 12-20 kg, 3 séries × 12 reps.',
};

/* ------------------------------------------------------------------ */
/* PECTORAUX                                                            */
/* ------------------------------------------------------------------ */

const devCouche: Exercise = {
  id: 'dev-couche',
  name: 'Développé couché à la barre',
  aka: 'Bench press',
  equip: 'barbell',
  level: 2,
  view: 'side',
  tempo: 3.4,
  muscles: ['chest'],
  secondary: ['triceps', 'frontDelt'],
  frames: [
    pose({ hip: [0, 0.72], torso: 178, head: 0, ankleNear: [0.7, 0.16], ankleFar: [0.52, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.5, 1.05], handFar: [-0.62, 1.05], elbow: 'down' }),
    pose({ hip: [0, 0.72], torso: 178, head: 0, ankleNear: [0.7, 0.16], ankleFar: [0.52, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.5, 1.46], handFar: [-0.62, 1.46], elbow: 'down' }),
  ],
  gear: [
    { kind: 'bench', x: -0.62, y: 0.55, w: 2.3 },
    { kind: 'barbell', at: 'hands', plate: 0.36 },
  ],
  steps: [
    'Allongé, yeux sous la barre, pieds à plat, omoplates serrées et enfoncées dans le banc.',
    'Déverrouille et descends la barre jusqu’au bas de la poitrine, coudes à 45° du buste.',
    'Marque un arrêt d’une seconde puis pousse en ligne droite vers le plafond.',
  ],
  cues: ['Omoplates serrées', 'Poignets au-dessus des coudes', 'La barre touche la poitrine, pas la gorge'],
  mistakes: [
    'Décoller les fessiers du banc.',
    'Coudes complètement à 90° (épaules en danger) — vise 45°.',
    'Rebondir la barre sur la poitrine.',
  ],
  breathing: 'Inspire en descendant, expire en poussant.',
  load: '4 séries × 8-10 reps, charge qui laisse 2 reps en réserve.',
};

const devCoucheHalteres: Exercise = {
  id: 'dev-couche-halteres',
  name: 'Développé couché aux haltères',
  aka: 'Dumbbell bench press',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 3.2,
  muscles: ['chest'],
  secondary: ['triceps', 'frontDelt'],
  frames: [
    pose({ hip: [0, 0.72], torso: 178, head: 0, ankleNear: [0.7, 0.16], ankleFar: [0.52, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.45, 1.02], handFar: [-0.6, 1.06], elbow: 'down' }),
    pose({ hip: [0, 0.72], torso: 178, head: 0, ankleNear: [0.7, 0.16], ankleFar: [0.52, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.45, 1.44], handFar: [-0.6, 1.48], elbow: 'down' }),
  ],
  gear: [{ kind: 'bench', x: -0.62, y: 0.55, w: 2.3 }, { kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Allongé, un haltère dans chaque main au-dessus de la poitrine, paumes vers l’avant.',
    'Descends les haltères de chaque côté de la poitrine en contrôlant la trajectoire.',
    'Remonte en rapprochant légèrement les haltères au sommet, sans les cogner.',
  ],
  cues: ['Amplitude plus grande qu’à la barre', 'Coudes à 45°', 'Descends bien au niveau de la poitrine'],
  mistakes: ['Descendre les haltères trop bas (épaule en danger).', 'Cogner les haltères en haut en perdant l’équilibre.', 'Cambrer excessivement.'],
  breathing: 'Inspire en descendant, expire en poussant.',
  load: '3-4 séries × 10-12 reps.',
};

const devIncline: Exercise = {
  id: 'dev-incline',
  name: 'Développé incliné aux haltères',
  aka: 'Incline dumbbell press',
  equip: 'dumbbell',
  level: 2,
  view: 'side',
  tempo: 3.2,
  muscles: ['chest', 'frontDelt'],
  secondary: ['triceps'],
  frames: [
    pose({ hip: [0.05, 0.72], torso: 158, head: -22, ankleNear: [0.72, 0.16], ankleFar: [0.54, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.5, 1.2], handFar: [-0.64, 1.24], elbow: 'down' }),
    pose({ hip: [0.05, 0.72], torso: 158, head: -22, ankleNear: [0.72, 0.16], ankleFar: [0.54, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.5, 1.62], handFar: [-0.64, 1.66], elbow: 'down' }),
  ],
  gear: [{ kind: 'bench', x: -0.7, y: 0.5, w: 2.4, h: 0.18, angle: 30 }, { kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Banc réglé à 30° maximum (au-delà, ce sont les épaules qui travaillent).',
    'Descends les haltères de chaque côté du haut de la poitrine.',
    'Pousse en gardant les omoplates serrées contre le banc.',
  ],
  cues: ['Banc à 30° pas plus', 'Coudes légèrement rentrés', 'Ne cambre pas le bas du dos'],
  mistakes: ['Banc trop incliné (douleurs d’épaule).', 'Descendre derrière les épaules.', 'Décoller la tête du banc.'],
  breathing: 'Inspire en descendant, expire en poussant.',
  load: '3 séries × 10-12 reps.',
};

const ecartesMachine: Exercise = {
  id: 'ecartes-machine',
  name: 'Écartés à la machine',
  aka: 'Pec deck / butterfly',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['chest'],
  secondary: ['frontDelt'],
  frames: [
    pose({ hip: [-0.3, 0.95], torso: 98, head: -8, legNear: [-2, -88], legFar: [-6, -90], footNear: 0, footFar: 0, handNear: [0.42, 1.12], handFar: [0.3, 1.08], elbow: 'down' }),
    pose({ hip: [-0.3, 0.95], torso: 98, head: -8, legNear: [-2, -88], legFar: [-6, -90], footNear: 0, footFar: 0, handNear: [0.05, 1.14], handFar: [-0.08, 1.1], elbow: 'down' }),
  ],
  gear: [{ kind: 'machine', variant: 'pecdeck' }],
  steps: [
    'Assis, avant-bras posés sur les coussins, coudes à hauteur de poitrine.',
    'Rapproche les coussins en contractant les pectoraux, sans hausser les épaules.',
    'Reviens lentement jusqu’à sentir un étirement, sans dépasser ta mobilité d’épaule.',
  ],
  cues: ['Pectoraux contractés au centre', 'Épaules basses', 'Mouvement lent'],
  mistakes: ['Hausser les épaules pour compenser.', 'Amplitude arrière excessive (épaule en danger).', 'Aller trop vite.'],
  breathing: 'Expire en rapprochant, inspire en ouvrant.',
  load: '3 séries × 12-15 reps, tempo lent.',
};

const pompes: Exercise = {
  id: 'pompes',
  name: 'Pompes',
  aka: 'Push-ups',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['chest'],
  secondary: ['triceps', 'frontDelt', 'abs'],
  frames: [
    pose({ hip: [0.1, 0.86], torso: 6, head: -11, ankleNear: [-1.45, 0.18], ankleFar: [-1.3, 0.18], knee: 'up', handNear: [1.09, 0.2], handFar: [0.94, 0.2], elbow: 'down', footNear: -16, footFar: -16 }),
    pose({ hip: [0.1, 0.56], torso: 6, head: -11, ankleNear: [-1.45, 0.18], ankleFar: [-1.3, 0.18], knee: 'up', handNear: [1.09, 0.2], handFar: [0.94, 0.2], elbow: 'down', footNear: -16, footFar: -16 }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'Mains un peu plus larges que les épaules, corps gainé de la tête aux talons.',
    'Descends jusqu’à ce que la poitrine frôle le sol, coudes à 45° du buste.',
    'Pousse en gardant le corps bien aligné, fessiers contractés.',
  ],
  cues: ['Corps gainé, fessiers serrés', 'Regarde légèrement devant tes mains', 'Coudes à 45°'],
  mistakes: ['Laisser le bassin s’affaisser.', 'Coudes complètement écartés à 90°.', 'Amplitude partielle.'],
  breathing: 'Inspire en descendant, expire en poussant.',
  load: 'Poids du corps, 3 séries au maximum de reps propres. Sur les genoux si besoin.',
};

const dips: Exercise = {
  id: 'dips',
  name: 'Dips',
  aka: 'Chest dips',
  equip: 'bodyweight',
  level: 3,
  view: 'front',
  ground: false,
  tempo: 3.4,
  muscles: ['chest', 'triceps'],
  secondary: ['frontDelt'],
  frames: [
    pose({ hip: [0, 1.28], torso: 82, head: 0, legNear: [-96, -84], legFar: [-96, -84], footNear: -70, footFar: -70, handNear: [0.34, 1.32], handFar: [0.34, 1.32], elbow: 'down' }),
    pose({ hip: [0, 0.86], torso: 82, head: 0, legNear: [-104, -76], legFar: [-104, -76], footNear: -70, footFar: -70, handNear: [0.34, 1.32], handFar: [0.34, 1.32], elbow: 'down' }),
  ],
  gear: [{ kind: 'bar', y: 1.32, x: 0, w: 1.3 }],
  steps: [
    'En appui sur les barres, bras tendus, épaules basses et en arrière.',
    'Descends en penchant légèrement le buste en avant (pour cibler les pecs).',
    'Remonte sans verrouiller brutalement les coudes.',
  ],
  cues: ['Épaules basses, ne hausse pas', 'Buste légèrement penché en avant', 'Amplitude contrôlée'],
  mistakes: ['Descendre trop bas si les épaules sont raides.', 'Hausser les épaules en haut.', 'Donner des à-coups.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Poids du corps, 3 séries × 6-10 reps. Assistance élastique si besoin.',
};

const ecartesPoulie: Exercise = {
  id: 'ecartes-poulie',
  name: 'Écartés à la poulie basse',
  aka: 'Cable fly',
  equip: 'cable',
  level: 2,
  view: 'side',
  tempo: 3.2,
  muscles: ['chest'],
  secondary: ['frontDelt'],
  frames: [
    stand({ hip: [0, HY], torso: 86, ankleNear: [0.34, 0.18], ankleFar: [-0.34, 0.18], handNear: [0.85, 1.85], handFar: [0.7, 1.83], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 86, ankleNear: [0.34, 0.18], ankleFar: [-0.34, 0.18], handNear: [0.6, 2.3], handFar: [0.44, 2.28], elbow: 'down' }),
  ],
  gear: [{ kind: 'cable', x: 1.3, y: 0.25, hand: 'both', attach: 'handle' }],
  steps: [
    'Debout au centre, une poignée dans chaque main, buste légèrement penché en avant.',
    'Ramène les mains l’une vers l’autre en décrivant un arc, coudes légèrement fléchis et fixes.',
    'Contracte les pectoraux une seconde puis reviens en contrôlant l’étirement.',
  ],
  cues: ['Coudes fixes, léger flexion', 'Buste penché, gainage solide', 'Ne transforme pas en développé'],
  mistakes: ['Plier beaucoup les coudes (ça devient un press).', 'Se balancer d’avant en arrière.', 'Charge trop lourde.'],
  breathing: 'Expire en rapprochant, inspire en ouvrant.',
  load: 'Charge légère, 3 séries × 12-15 reps.',
};

/* ------------------------------------------------------------------ */
/* DOS                                                                  */
/* ------------------------------------------------------------------ */

const tirageVertical: Exercise = {
  id: 'tirage-vertical',
  name: 'Tirage vertical à la poulie',
  aka: 'Lat pulldown',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3.2,
  muscles: ['lats'],
  secondary: ['biceps', 'traps', 'rearDelt'],
  frames: [
    pose({ hip: [-0.32, 0.95], torso: 96, head: -6, legNear: [-4, -84], legFar: [-8, -86], footNear: 0, footFar: 0, handNear: [0.34, 2.3], handFar: [0.22, 2.3], elbow: 'down' }),
    pose({ hip: [-0.32, 0.95], torso: 96, head: -6, legNear: [-4, -84], legFar: [-8, -86], footNear: 0, footFar: 0, handNear: [0.34, 1.42], handFar: [0.22, 1.42], elbow: 'down' }),
  ],
  gear: [{ kind: 'machine', variant: 'latpulldown' }],
  steps: [
    'Cuisses calées sous les coussins, barre saisie un peu plus large que les épaules.',
    'Tire la barre vers le haut de la poitrine en abaissant les omoplates.',
    'Reviens en contrôlant la remontée jusqu’à l’étirement complet des dorsaux.',
  ],
  cues: ['Tire avec les coudes, pas avec les mains', 'Buste léger en arrière (~10°)', 'Omoplates vers le bas d’abord'],
  mistakes: ['Tirer derrière la nuque (épaules en danger).', 'Se pencher très en arrière pour balancer la charge.', 'Arrêter la descente à mi-course.'],
  breathing: 'Expire en tirant, inspire en remontant.',
  load: '4 séries × 10-12 reps.',
};

const tractions: Exercise = {
  id: 'tractions',
  name: 'Tractions',
  aka: 'Pull-ups',
  equip: 'bodyweight',
  level: 3,
  view: 'front',
  ground: false,
  tempo: 3.6,
  muscles: ['lats'],
  secondary: ['biceps', 'traps', 'forearms'],
  frames: [
    pose({ hip: [0, 1.42], torso: 88, head: 0, legNear: [-94, -86], legFar: [-94, -86], footNear: -60, footFar: -60, handNear: [0.52, 2.6], handFar: [0.52, 2.6], elbow: 'down' }),
    pose({ hip: [0, 1.86], torso: 88, head: 0, legNear: [-98, -82], legFar: [-98, -82], footNear: -60, footFar: -60, handNear: [0.52, 2.6], handFar: [0.52, 2.6], elbow: 'down' }),
  ],
  gear: [{ kind: 'bar', y: 2.72, x: 0, w: 1.6 }],
  steps: [
    'Suspension bras tendus, omoplates actives, prise un peu plus large que les épaules.',
    'Tire en amenant les coudes vers les hanches et la poitrine vers la barre.',
    'Redescends bras tendus en contrôlant, sans te laisser tomber.',
  ],
  cues: ['Coudes vers le bas et l’arrière', 'Corps gainé, pas de balancement', 'Amplitude complète'],
  mistakes: ['Tricher avec un coup de reins (kipping).', 'Amplitude partielle en bas.', 'Tirer uniquement avec les bras.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: 'Poids du corps, 3 séries au max. Élastique ou tirage poulie si < 4 reps.',
};

const rowingPoulie: Exercise = {
  id: 'rowing-poulie',
  name: 'Rowing assis à la poulie',
  aka: 'Seated cable row',
  equip: 'machine',
  level: 1,
  view: 'side',
  tempo: 3.2,
  muscles: ['lats', 'traps'],
  secondary: ['biceps', 'rearDelt', 'lowerBack'],
  frames: [
    pose({ hip: [-0.3, 0.92], torso: 84, head: -14, legNear: [4, -78], legFar: [0, -80], footNear: 20, footFar: 20, handNear: [0.72, 1.06], handFar: [0.6, 1.02], elbow: 'down' }),
    pose({ hip: [-0.3, 0.92], torso: 96, head: -6, legNear: [4, -78], legFar: [0, -80], footNear: 20, footFar: 20, handNear: [0.3, 1.06], handFar: [0.16, 1.02], elbow: 'down' }),
  ],
  gear: [{ kind: 'machine', variant: 'seatedrow' }],
  steps: [
    'Assis, pieds calés, genoux souples, poitrine contre le coussin si la machine en a un.',
    'Tire la poignée vers le bas du ventre en serrant les omoplates.',
    'Reviens bras tendus en laissant les dorsaux s’étirer, buste stable.',
  ],
  cues: ['Buste fixe, pas de coup de rein', 'Omoplates serrées à l’arrivée', 'Coudes près du corps'],
  mistakes: ['Se pencher en arrière pour tirer plus lourd.', 'Tirer avec les épaules en avant.', 'Arrondir le dos.'],
  breathing: 'Expire en tirant, inspire en revenant.',
  load: '4 séries × 10-12 reps.',
};

const rowingHaltere: Exercise = {
  id: 'rowing-haltere',
  name: 'Rowing haltère un bras',
  aka: 'One-arm dumbbell row',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['lats'],
  secondary: ['traps', 'biceps', 'rearDelt'],
  unilateral: true,
  frames: [
    pose({ hip: [0.1, 1.2], torso: 28, head: 30, ankleNear: [0.55, 0.16], ankleFar: [0.2, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [0.9, 0.72], handFar: [0.45, 1.16], elbow: 'down' }),
    pose({ hip: [0.1, 1.24], torso: 30, head: 28, ankleNear: [0.55, 0.16], ankleFar: [0.2, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [0.9, 1.26], handFar: [0.45, 1.16], elbow: 'down' }),
  ],
  gear: [{ kind: 'bench', x: -0.15, y: 0.5, w: 1.5 }, { kind: 'dumbbell', hand: 'near' }],
  steps: [
    'Un genou et une main sur le banc, dos parallèle au sol et neutre.',
    'Tire l’haltère vers la hanche en amenant le coude vers le plafond.',
    'Redescends en étirant le dorsal, sans rotation du buste.',
  ],
  cues: ['Dos parallèle au sol', 'Coude vers le plafond', 'Ne tourne pas le buste'],
  mistakes: ['Tourner les épaules pour monter plus haut.', 'Dos arrondi en position basse.', 'Tirer avec le biceps uniquement.'],
  breathing: 'Expire en tirant, inspire en descendant.',
  load: '3 séries × 10-12 reps par bras.',
};

const rowingBarre: Exercise = {
  id: 'rowing-barre',
  name: 'Rowing barre buste penché',
  aka: 'Barbell row',
  equip: 'barbell',
  level: 3,
  view: 'side',
  tempo: 3.4,
  muscles: ['lats', 'traps'],
  secondary: ['lowerBack', 'biceps', 'rearDelt'],
  frames: [
    pose({ hip: [0.05, 1.16], torso: 26, head: 32, ankleNear: [0.36, 0.16], ankleFar: [0.14, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [0.7, 0.66], handFar: [0.56, 0.66], elbow: 'down' }),
    pose({ hip: [0.05, 1.2], torso: 28, head: 30, ankleNear: [0.36, 0.16], ankleFar: [0.14, 0.16], knee: 'up', footNear: 0, footFar: 0, handNear: [0.66, 1.16], handFar: [0.52, 1.16], elbow: 'down' }),
  ],
  gear: [{ kind: 'barbell', at: 'hands' }],
  steps: [
    'Pieds largeur de hanches, buste penché à 45°, dos neutre et gainé.',
    'Tire la barre vers le nombril en serrant les omoplates.',
    'Repose la barre au sol à chaque répétition si la charge est lourde.',
  ],
  cues: ['Dos verrouillé', 'Tirer vers le nombril', 'Pas d’à-coups'],
  mistakes: ['Se redresser à chaque répétition (triche).', 'Arrondir le bas du dos.', 'Tirer trop haut vers la poitrine.'],
  breathing: 'Expire en tirant, inspire en reposant.',
  load: '4 séries × 8-10 reps, charge maîtrisée.',
};

const facePull: Exercise = {
  id: 'face-pull',
  name: 'Face pull à la corde',
  aka: 'Face pull',
  equip: 'cable',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['rearDelt', 'traps'],
  secondary: ['rearDelt', 'forearms'],
  frames: [
    stand({ hip: [0, HY], torso: 84, ankleNear: [0.22, 0.18], ankleFar: [-0.02, 0.18], handNear: [0.56, 1.74], handFar: [0.44, 1.72], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 88, ankleNear: [0.22, 0.18], ankleFar: [-0.02, 0.18], handNear: [0.36, 2.18], handFar: [0.24, 2.16], elbow: 'up' }),
  ],
  gear: [{ kind: 'cable', x: 1.25, y: 2.05, hand: 'both', attach: 'rope' }],
  steps: [
    'Poulie réglée en hauteur, corde saisie par les extrémités.',
    'Tire vers le visage en écartant les mains et en montant les coudes.',
    'Termine avec les mains de chaque côté des oreilles, coudes hauts.',
  ],
  cues: ['Coudes hauts et en arrière', 'Tire vers les yeux, pas vers le cou', 'Charge légère'],
  mistakes: ['Tirer vers la poitrine (ça devient un rowing).', 'Charge trop lourde : le dos compense.', 'Hausser les épaules.'],
  breathing: 'Expire en tirant, inspire en revenant.',
  load: 'Charge légère, 3 séries × 15 reps (santé des épaules).',
};

const shrugs: Exercise = {
  id: 'shrugs',
  name: 'Haussements d’épaules',
  aka: 'Shrugs',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 2.6,
  muscles: ['traps'],
  secondary: ['forearms'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.14, 0.16], ankleFar: [-0.1, 0.16], handNear: [0.16, 1.62], handFar: [0.04, 1.62], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.14, 0.16], ankleFar: [-0.1, 0.16], handNear: [0.2, 1.86], handFar: [0.08, 1.86], elbow: 'down' }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Debout, haltères le long du corps, bras tendus.',
    'Monte les épaules le plus haut possible comme pour toucher les oreilles.',
    'Marque une seconde en haut puis redescends lentement.',
  ],
  cues: ['Mouvement vertical uniquement', 'Ne roule pas les épaules', 'Charge modérée'],
  mistakes: ['Rouler les épaules (risque d’irritation).', 'Utiliser les bras pour soulever.', 'Charge trop lourde avec une amplitude ridicule.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: '3 séries × 12-15 reps.',
};

const hyperextensions: Exercise = {
  id: 'hyperextensions',
  name: 'Hyperextensions lombaires',
  aka: 'Back extension',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['lowerBack', 'glutes'],
  secondary: ['hamstrings'],
  frames: [
    pose({ hip: [0.1, 0.98], torso: -52, head: 30, ankleNear: [0.62, 0.16], ankleFar: [0.44, 0.16], knee: 'up', footNear: 0, footFar: 0, armNear: [70, 80], armFar: [66, 76], handNear: undefined }),
    pose({ hip: [0.1, 0.98], torso: 8, head: -10, ankleNear: [0.62, 0.16], ankleFar: [0.44, 0.16], knee: 'up', footNear: 0, footFar: 0, armNear: [40, 60], armFar: [36, 56] }),
  ],
  gear: [{ kind: 'pad', x: 0.1, y: 0.86, w: 0.7, h: 0.3 }],
  steps: [
    'Bassin posé sur le coussin, talons calés, corps aligné.',
    'Descends le buste en gardant le dos droit, jusqu’à l’horizontale.',
    'Remonte en contractant les fessiers, sans te cambrer excessivement.',
  ],
  cues: ['Ce sont les fessiers qui remontent', 'Dos neutre', 'Regarde le sol'],
  mistakes: ['Se cambrer en hyperextension en haut.', 'Descendre en arrondissant le dos.', 'Donner des à-coups.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Poids du corps, 3 séries × 12-15 reps.',
};

/* ------------------------------------------------------------------ */
/* ÉPAULES                                                              */
/* ------------------------------------------------------------------ */

const devMilitaire: Exercise = {
  id: 'dev-militaire',
  name: 'Développé militaire à la barre',
  aka: 'Overhead press',
  equip: 'barbell',
  level: 2,
  view: 'side',
  tempo: 3.4,
  muscles: ['frontDelt', 'sideDelt'],
  secondary: ['triceps', 'traps', 'abs'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.06, 0.16], handNear: [0.26, 2.34], handFar: [0.12, 2.34], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 92, ankleNear: [0.16, 0.16], ankleFar: [-0.06, 0.16], handNear: [0.16, 3.06], handFar: [0.02, 3.06], elbow: 'down' }),
  ],
  gear: [{ kind: 'barbell', at: 'hands' }],
  steps: [
    'Debout, barre sur les clavicules, mains à largeur d’épaules, coudes devant la barre.',
    'Gainage serré, fessiers contractés : pousse la barre vers le plafond en reculant légèrement la tête.',
    'Verrouille en haut, barre au-dessus de la nuque, puis redescends sous contrôle.',
  ],
  cues: ['Fessiers et abdos contractés', 'La tête recule puis repasse sous la barre', 'Poignets au-dessus des coudes'],
  mistakes: ['Cambrer les lombaires pour passer la charge.', 'Pousser la barre en avant du corps.', 'Coudes trop bas.'],
  breathing: 'Inspire avant de pousser, expire en haut.',
  load: '4 séries × 6-8 reps.',
};

const devHalteres: Exercise = {
  id: 'dev-halteres',
  name: 'Développé haltères assis',
  aka: 'Seated dumbbell press',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 3.2,
  muscles: ['frontDelt', 'sideDelt'],
  secondary: ['triceps', 'traps'],
  frames: [
    pose({ hip: [-0.28, 0.92], torso: 98, head: -8, legNear: [-2, -88], legFar: [-6, -90], footNear: 0, footFar: 0, handNear: [0.3, 1.92], handFar: [0.16, 1.9], elbow: 'down' }),
    pose({ hip: [-0.28, 0.92], torso: 98, head: -8, legNear: [-2, -88], legFar: [-6, -90], footNear: 0, footFar: 0, handNear: [0.22, 2.66], handFar: [0.08, 2.64], elbow: 'down' }),
  ],
  gear: [{ kind: 'bench', x: -0.42, y: 0.6, w: 1.2 }, { kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Assis, dossier légèrement incliné, haltères à hauteur d’épaules, paumes vers l’avant.',
    'Pousse les haltères vers le plafond en les rapprochant légèrement.',
    'Redescends à hauteur d’oreilles en contrôlant la trajectoire.',
  ],
  cues: ['Ne cambre pas le bas du dos', 'Amplitude complète', 'Coudes légèrement devant'],
  mistakes: ['Cambrer excessivement le dos.', 'Descendre seulement à mi-hauteur.', 'Écarter trop les coudes.'],
  breathing: 'Expire en poussant, inspire en descendant.',
  load: '3 séries × 8-12 reps.',
};

const elevationsLaterales: Exercise = {
  id: 'elevations-laterales',
  name: 'Élévations latérales',
  aka: 'Lateral raise',
  equip: 'dumbbell',
  level: 1,
  view: 'front',
  tempo: 2.8,
  muscles: ['sideDelt'],
  secondary: ['traps'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.16, 0.16], armNear: [-86, -86], armFar: [-86, -86] }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.16, 0.16], armNear: [-8, -2], armFar: [-8, -2] }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Debout, haltères le long du corps, coudes très légèrement fléchis.',
    'Monte les bras sur les côtés jusqu’à hauteur d’épaules, paumes vers le sol.',
    'Redescends lentement en contrôlant la descente.',
  ],
  cues: ['Petits poids, grosse technique', 'Monter à hauteur d’épaule maximum', 'Le coude guide le mouvement'],
  mistakes: ['Monter au-dessus de l’horizontale (conflit d’épaule).', 'Utiliser l’élan du buste.', 'Rotation des poignets vers le haut.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: 'Charge très légère, 3-4 séries × 12-15 reps.',
};

const elevationsFrontales: Exercise = {
  id: 'elevations-frontales',
  name: 'Élévations frontales',
  aka: 'Front raise',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['frontDelt'],
  secondary: ['traps'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], handNear: [0.24, 1.66], handFar: [0.1, 1.66], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], handNear: [0.72, 2.36], handFar: [0.58, 2.36], elbow: 'down' }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Debout, haltères devant les cuisses, bras tendus.',
    'Monte un haltère (ou les deux) devant toi jusqu’à hauteur d’épaules.',
    'Redescends lentement sans balancer le buste.',
  ],
  cues: ['Bras quasi tendu', 'Ne dépasse pas l’horizontale', 'Buste immobile'],
  mistakes: ['Se pencher en arrière pour monter.', 'Charge trop lourde.', 'Monter au-dessus des épaules.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: 'Charge légère, 3 séries × 12 reps.',
};

const oiseau: Exercise = {
  id: 'oiseau',
  name: 'Oiseau à la machine (deltoïde postérieur)',
  aka: 'Reverse pec deck',
  equip: 'machine',
  level: 1,
  view: 'front',
  tempo: 2.8,
  muscles: ['rearDelt'],
  secondary: ['traps'],
  frames: [
    pose({ hip: [-0.28, 0.95], torso: 96, head: -6, legNear: [-4, -86], legFar: [-4, -86], footNear: 0, footFar: 0, armNear: [-40, -14], armFar: [-40, -14] }),
    pose({ hip: [-0.28, 0.95], torso: 96, head: -6, legNear: [-4, -86], legFar: [-4, -86], footNear: 0, footFar: 0, armNear: [-84, -90], armFar: [-84, -90] }),
  ],
  gear: [{ kind: 'machine', variant: 'pecdeck' }],
  steps: [
    'Assis face à la machine, poitrine contre le coussin, bras tendus sur les poignées.',
    'Écarte les bras en arrière en serrant les omoplates.',
    'Reviens lentement sans laisser la machine claquer.',
  ],
  cues: ['Poitrine plaquée', 'Serrer les omoplates', 'Charge légère'],
  mistakes: ['Se reculer du coussin pour tricher.', 'Utiliser les bras plutôt que les épaules.', 'Mouvement trop rapide.'],
  breathing: 'Expire en écartant, inspire en revenant.',
  load: 'Charge légère, 3 séries × 15 reps.',
};

/* ------------------------------------------------------------------ */
/* BRAS                                                                 */
/* ------------------------------------------------------------------ */

const curlBarre: Exercise = {
  id: 'curl-barre',
  name: 'Curl à la barre',
  aka: 'Barbell curl',
  equip: 'barbell',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['biceps'],
  secondary: ['forearms'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.08, 0.16], handNear: [0.2, 1.7], handFar: [0.06, 1.7], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.08, 0.16], handNear: [0.44, 2.2], handFar: [0.3, 2.2], elbow: 'down' }),
  ],
  gear: [{ kind: 'barbell', at: 'hands', plate: 0.3 }],
  steps: [
    'Debout, barre en mains (prise en supination), coudes collés au buste.',
    'Monte la barre en pliant uniquement les coudes, sans balancer.',
    'Serre les biceps une seconde en haut, puis redescends lentement.',
  ],
  cues: ['Coudes fixes le long du corps', 'Ne balance pas le buste', 'Poignets neutres/droits'],
  mistakes: ['Donner un coup de reins pour monter.', 'Avancer les coudes vers l’avant.', 'Descente non contrôlée.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: '3 séries × 8-12 reps.',
};

const curlHalteres: Exercise = {
  id: 'curl-halteres',
  name: 'Curl haltères alterné',
  aka: 'Alternating dumbbell curl',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['biceps'],
  secondary: ['forearms'],
  unilateral: true,
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], armNear: [-88, -84], armFar: [-92, -60] }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], armNear: [-84, -20], armFar: [-92, -88] }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Debout, un haltère dans chaque main, bras tendus le long du corps.',
    'Monte un haltère en tournant la paume vers l’épaule (supination).',
    'Redescends lentement puis enchaîne de l’autre côté.',
  ],
  cues: ['Coude immobile', 'Rotation du poignet en montant', 'Pas de balancement'],
  mistakes: ['Monter l’épaule pour aider.', 'Descendre trop vite.', 'Coude qui part vers l’avant.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: '3 séries × 10-12 reps par bras.',
};

const curlMarteau: Exercise = {
  id: 'curl-marteau',
  name: 'Curl marteau',
  aka: 'Hammer curl',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['biceps', 'forearms'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], armNear: [-88, -84], armFar: [-92, -88] }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.16, 0.16], ankleFar: [-0.1, 0.16], armNear: [-84, -18], armFar: [-88, -22] }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'both' }],
  steps: [
    'Haltères en prise neutre (paumes face à face).',
    'Monte les haltères en gardant les poignets dans cette position.',
    'Redescends en contrôlant.',
  ],
  cues: ['Paumes toujours face à face', 'Coudes collés au buste', 'Mouvement propre'],
  mistakes: ['Rotation du poignet en fin de course.', 'Balancer les haltères.', 'Monter les épaules.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: '3 séries × 10-12 reps.',
};

const curlPoulie: Exercise = {
  id: 'curl-poulie',
  name: 'Curl à la poulie basse',
  aka: 'Cable curl',
  equip: 'cable',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['biceps'],
  secondary: ['forearms'],
  frames: [
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.2, 0.16], ankleFar: [-0.02, 0.16], handNear: [0.36, 1.62], handFar: [0.22, 1.62], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 90, ankleNear: [0.2, 0.16], ankleFar: [-0.02, 0.16], handNear: [0.5, 2.16], handFar: [0.36, 2.16], elbow: 'down' }),
  ],
  gear: [{ kind: 'cable', x: 1.15, y: 0.25, hand: 'both', attach: 'bar' }],
  steps: [
    'Debout face à la poulie basse, barre ou corde en mains, coudes le long du buste.',
    'Fléchis les coudes pour amener la barre vers le haut, sans reculer les coudes.',
    'Redescends lentement : la tension reste constante, c’est l’intérêt de la poulie.',
  ],
  cues: ['Coudes fixes', 'Tension continue', 'Serre en haut'],
  mistakes: ['Reculer les coudes en montant.', 'Se pencher pour aider.', 'Descente trop rapide.'],
  breathing: 'Expire en montant, inspire en descendant.',
  load: '3 séries × 12 reps.',
};

const extensionPoulie: Exercise = {
  id: 'extension-poulie',
  name: 'Extension triceps à la poulie',
  aka: 'Triceps pushdown',
  equip: 'cable',
  level: 1,
  view: 'side',
  tempo: 2.8,
  muscles: ['triceps'],
  frames: [
    stand({ hip: [0, HY], torso: 84, ankleNear: [0.22, 0.18], ankleFar: [-0.02, 0.18], handNear: [0.62, 2.18], handFar: [0.48, 2.16], elbow: 'down' }),
    stand({ hip: [0, HY], torso: 84, ankleNear: [0.22, 0.18], ankleFar: [-0.02, 0.18], handNear: [0.48, 1.68], handFar: [0.34, 1.66], elbow: 'down' }),
  ],
  gear: [{ kind: 'cable', x: 1.2, y: 2.3, hand: 'both', attach: 'bar' }],
  steps: [
    'Debout, coudes collés au buste et fléchis à 90°, barre haute saisie en pronation.',
    'Tends les bras vers le bas en gardant les coudes immobiles.',
    'Remonte en contrôlant jusqu’à 90°, sans écarter les coudes.',
  ],
  cues: ['Coudes rivés au buste', 'Pousse jusqu’à l’extension complète', 'Buste légèrement penché'],
  mistakes: ['Écarter les coudes en poussant.', 'Utiliser les épaules.', 'Amplitude partielle.'],
  breathing: 'Expire en poussant, inspire en remontant.',
  load: '3 séries × 10-12 reps.',
};

const extensionNuque: Exercise = {
  id: 'extension-nuque',
  name: 'Extension triceps au-dessus de la tête',
  aka: 'Overhead triceps extension',
  equip: 'dumbbell',
  level: 2,
  view: 'side',
  tempo: 3,
  muscles: ['triceps'],
  frames: [
    stand({ hip: [0, HY], torso: 92, ankleNear: [0.16, 0.16], ankleFar: [-0.08, 0.16], handNear: [0.06, 3.18], handFar: [-0.06, 3.18], elbow: 'up' }),
    stand({ hip: [0, HY], torso: 92, ankleNear: [0.16, 0.16], ankleFar: [-0.08, 0.16], handNear: [0.1, 2.42], handFar: [-0.02, 2.42], elbow: 'up' }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'near' }],
  steps: [
    'Debout (ou assis), un haltère tenu à deux mains au-dessus de la tête, bras tendus.',
    'Descends l’haltère derrière la tête en pliant les coudes, coudes pointés vers le plafond.',
    'Remonte en tendant les bras, sans écarter les coudes.',
  ],
  cues: ['Coudes vers le plafond et serrés', 'Buste droit, abdos gainés', 'Étire bien en bas'],
  mistakes: ['Écarter les coudes sur les côtés.', 'Cambrer le dos.', 'Descendre trop vite.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: '3 séries × 10-12 reps.',
};

const dipsBanc: Exercise = {
  id: 'dips-banc',
  name: 'Dips sur banc',
  aka: 'Bench dips',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 3,
  muscles: ['triceps'],
  secondary: ['chest', 'frontDelt'],
  frames: [
    pose({ hip: [-0.75, 0.8], torso: 92, head: 0, ankleNear: [0.55, 0.18], ankleFar: [0.36, 0.18], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.55, 0.62], handFar: [-0.66, 0.62], elbow: 'down' }),
    pose({ hip: [-0.75, 0.46], torso: 92, head: 0, ankleNear: [0.55, 0.18], ankleFar: [0.36, 0.18], knee: 'up', footNear: 0, footFar: 0, handNear: [-0.55, 0.62], handFar: [-0.66, 0.62], elbow: 'down' }),
  ],
  gear: [{ kind: 'bench', x: -0.55, y: 0.5, w: 1.2 }],
  steps: [
    'Mains sur le bord du banc derrière toi, talons au sol, fessiers décollés.',
    'Descends en pliant les coudes jusqu’à 90°, dos près du banc.',
    'Remonte en poussant sur les talons des mains.',
  ],
  cues: ['Coudes vers l’arrière, pas sur les côtés', 'Dos près du banc', 'Amplitude contrôlée'],
  mistakes: ['Descendre trop bas (épaules en danger).', 'Coudes qui partent sur les côtés.', 'S’asseoir sur le banc entre les reps.'],
  breathing: 'Inspire en descendant, expire en remontant.',
  load: 'Poids du corps, 3 séries × 10-15 reps.',
};

const kickback: Exercise = {
  id: 'kickback',
  name: 'Kickback triceps',
  aka: 'Triceps kickback',
  equip: 'dumbbell',
  level: 1,
  view: 'side',
  tempo: 2.6,
  muscles: ['triceps'],
  unilateral: true,
  frames: [
    pose({ hip: [0.05, 1.28], torso: 34, head: 26, ankleNear: [0.52, 0.16], ankleFar: [0.2, 0.16], knee: 'up', footNear: 0, footFar: 0, armNear: [-58, -96], armFar: [0, -40] }),
    pose({ hip: [0.05, 1.28], torso: 34, head: 26, ankleNear: [0.52, 0.16], ankleFar: [0.2, 0.16], knee: 'up', footNear: 0, footFar: 0, armNear: [-30, -30], armFar: [0, -40] }),
  ],
  gear: [{ kind: 'dumbbell', hand: 'near' }, { kind: 'bench', x: -0.2, y: 0.5, w: 1.3 }],
  steps: [
    'Un genou et une main sur le banc, dos à peu près horizontal.',
    'Le bras libre est plié à 90°, coude collé au buste et pointé vers l’arrière.',
    'Tends le bras vers l’arrière, puis reviens en contrôlant.',
  ],
  cues: ['Coude immobile et haut', 'Extension complète', 'Charge légère'],
  mistakes: ['Baisser le coude pendant le mouvement.', 'Balancer le bras.', 'Dos arrondi.'],
  breathing: 'Expire en tendant, inspire en revenant.',
  load: '3 séries × 12 reps par bras.',
};

/* ------------------------------------------------------------------ */
/* ABDOS & CORE                                                         */
/* ------------------------------------------------------------------ */

const crunch: Exercise = {
  id: 'crunch',
  name: 'Crunch au sol',
  aka: 'Crunch',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 2.6,
  muscles: ['abs'],
  secondary: ['obliques'],
  frames: [
    pose({ hip: [-0.35, 0.28], torso: 178, head: 2, legNear: [30, -50], legFar: [26, -50], footNear: 0, footFar: 0, handNear: [-2.0, 0.5], handFar: [-1.92, 0.42], elbow: 'up' }),
    pose({ hip: [-0.35, 0.28], torso: 155, head: 10, legNear: [30, -50], legFar: [26, -50], footNear: 0, footFar: 0, handNear: [-1.9, 0.88], handFar: [-1.82, 0.8], elbow: 'up' }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'Allongé sur le dos, genoux pliés, pieds à plat, mains près des tempes.',
    'Décolle les omoplates en enroulant le buste vers le bassin, sans tirer sur la nuque.',
    'Redescends en contrôlant sans reposer complètement les épaules.',
  ],
  cues: ['Ce sont les abdos qui enroulent', 'Ne tire pas sur la nuque', 'Expire en montant'],
  mistakes: ['Tirer sur la nuque avec les mains.', 'Décoller les lombaires du sol.', 'Faire des "sit-ups" complets trop vite.'],
  breathing: 'Expire fort en montant, inspire en descendant.',
  load: 'Poids du corps, 3 séries × 15-20 reps.',
};

const planche: Exercise = {
  id: 'planche',
  name: 'Gainage planche',
  aka: 'Plank',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 4,
  muscles: ['abs'],
  secondary: ['obliques', 'frontDelt', 'glutes'],
  frames: [
    pose({ hip: [0.3, 0.62], torso: 6, head: -1, ankleNear: [-1.33, 0.18], ankleFar: [-1.16, 0.18], knee: 'auto', footNear: -16, footFar: -16, handNear: [1.29, 0.2], handFar: [1.14, 0.2], elbow: 'down' }),
    pose({ hip: [0.3, 0.56], torso: 6, head: -1, ankleNear: [-1.33, 0.18], ankleFar: [-1.16, 0.18], knee: 'auto', footNear: -16, footFar: -16, handNear: [1.29, 0.2], handFar: [1.14, 0.2], elbow: 'down' }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'En appui sur les avant-bras et la pointe des pieds, coudes sous les épaules.',
    'Aligne nuque, dos, bassin et talons : une ligne droite.',
    'Contracte les abdos et les fessiers, respire normalement et tiens la position.',
  ],
  cues: ['Bassin en rétroversion', 'Regarde le sol entre tes mains', 'Respire, ne bloque pas'],
  mistakes: ['Laisser le bassin s’affaisser.', 'Pousser les fesses vers le plafond.', 'Bloquer la respiration.'],
  breathing: 'Respiration normale, lente et continue.',
  load: '3 séries de 30 à 60 s (ou accumulate : 3 × max).',
};

const gainageLateral: Exercise = {
  id: 'gainage-lateral',
  name: 'Gainage latéral',
  aka: 'Side plank',
  equip: 'bodyweight',
  level: 1,
  view: 'side',
  tempo: 4,
  muscles: ['obliques'],
  secondary: ['abs', 'abductors'],
  frames: [
    pose({ hip: [0.2, 0.62], torso: 4, head: -4, ankleNear: [-1.43, 0.18], ankleFar: [-1.26, 0.18], knee: 'auto', footNear: -16, footFar: -16, handNear: [1.19, 0.2], armFar: [80, 95], elbow: 'down' }),
    pose({ hip: [0.2, 0.56], torso: 4, head: -4, ankleNear: [-1.43, 0.18], ankleFar: [-1.26, 0.18], knee: 'auto', footNear: -16, footFar: -16, handNear: [1.19, 0.2], armFar: [80, 95], elbow: 'down' }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'Couché sur le côté, coude sous l’épaule, pieds l’un sur l’autre.',
    'Soulève le bassin pour aligner tête, épaules, hanches et pieds.',
    'Tiens la position en contractant les obliques, puis change de côté.',
  ],
  cues: ['Hanches hautes', 'Corps aligné dans un plan', 'Respire normalement'],
  mistakes: ['Laisser la hanche tomber.', 'Tourner le buste vers l’avant.', 'S’appuyer sur l’épaule (reste actif).'],
  breathing: 'Respiration normale, continue.',
  load: '3 séries de 20 à 40 s par côté.',
};

const releveGenoux: Exercise = {
  id: 'releve-genoux',
  name: 'Relevé de genoux suspendu',
  aka: 'Hanging knee raise',
  equip: 'bodyweight',
  level: 2,
  view: 'side',
  ground: false,
  tempo: 3.4,
  muscles: ['abs', 'hipFlexors'],
  secondary: ['forearms', 'obliques'],
  frames: [
    pose({ hip: [0, 1.42], torso: 88, head: 0, legNear: [-94, -86], legFar: [-90, -90], footNear: -60, footFar: -60, handNear: [0.1, 2.62], handFar: [-0.04, 2.62], elbow: 'down' }),
    pose({ hip: [0, 1.42], torso: 88, head: 0, legNear: [-24, -104], legFar: [-18, -108], footNear: -60, footFar: -60, handNear: [0.1, 2.62], handFar: [-0.04, 2.62], elbow: 'down' }),
  ],
  gear: [{ kind: 'bar', y: 2.66, x: 0, w: 0.9 }],
  steps: [
    'Suspendu à la barre, bras tendus, épaules basses et gainage engagé.',
    'Ramène les genoux vers la poitrine en enroulant le bassin.',
    'Redescends lentement les jambes sans te balancer.',
  ],
  cues: ['Bassin qui s’enroule', 'Pas de balancement', 'Contrôle la descente'],
  mistakes: ['Se balancer pour monter les genoux.', 'Descendre les jambes trop vite.', 'Hausser les épaules.'],
  breathing: 'Expire en montant les genoux, inspire en descendant.',
  load: '3 séries × 8-12 reps.',
};

const russianTwist: Exercise = {
  id: 'russian-twist',
  name: 'Russian twist',
  aka: 'Russian twist',
  equip: 'bodyweight',
  level: 2,
  view: 'front',
  mirror: false,
  tempo: 2.6,
  muscles: ['obliques'],
  secondary: ['abs'],
  frames: [
    pose({ hip: [-0.2, 0.3], torso: 135, head: -45, legNear: [40, -40], legFar: [34, -46], footNear: -20, footFar: -20, handNear: [-0.25, 0.35], handFar: [-0.42, 0.32], elbow: 'down' }),
    pose({ hip: [-0.2, 0.3], torso: 135, head: -45, legNear: [40, -40], legFar: [34, -46], footNear: -20, footFar: -20, handNear: [-1.55, 0.35], handFar: [-1.38, 0.32], elbow: 'down' }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'Assis, genoux pliés, pieds légèrement décollés, buste incliné à 45°.',
    'Fais pivoter le buste de gauche à droite en touchant le sol à côté de la hanche.',
    'Garde le dos droit et le mouvement contrôlé.',
  ],
  cues: ['Dos droit, buste gainé', 'Rotation, pas balancement des bras', 'Pieds stables'],
  mistakes: ['Arrondir le dos.', 'Tourner seulement les bras.', 'Aller trop vite.'],
  breathing: 'Expire à chaque rotation.',
  load: '3 séries × 20 rotations (10 de chaque côté).',
};

const mountainClimbers: Exercise = {
  id: 'mountain-climbers',
  name: 'Mountain climbers',
  aka: 'Mountain climbers',
  equip: 'bodyweight',
  level: 2,
  view: 'side',
  tempo: 1.6,
  muscles: ['abs', 'hipFlexors'],
  secondary: ['frontDelt', 'quads'],
  frames: [
    pose({ hip: [0.1, 0.9], torso: 6, head: -11, ankleNear: [-1.42, 0.18], ankleFar: [-1.26, 0.18], knee: 'up', handNear: [1.09, 0.2], handFar: [0.94, 0.2], elbow: 'down', footNear: -16, footFar: -16 }),
    pose({ hip: [0.1, 0.9], torso: 6, head: -11, ankleNear: [0.1, 0.18], ankleFar: [-1.26, 0.18], knee: 'up', handNear: [1.09, 0.2], handFar: [0.94, 0.2], elbow: 'down', footNear: -16, footFar: -16 }),
    pose({ hip: [0.1, 0.9], torso: 6, head: -11, ankleNear: [-1.42, 0.18], ankleFar: [0.26, 0.18], knee: 'up', handNear: [1.09, 0.2], handFar: [0.94, 0.2], elbow: 'down', footNear: -16, footFar: -16 }),
  ],
  gear: [{ kind: 'mat' }],
  steps: [
    'En position de pompes, mains sous les épaules, corps gainé.',
    'Ramène un genou vers la poitrine, puis l’autre, en alternant rapidement.',
    'Garde le bassin bas et les épaules au-dessus des mains.',
  ],
  cues: ['Bassin bas, fessiers serrés', 'Rythme rapide mais contrôlé', 'Respire par petits coups'],
  mistakes: ['Lever les fesses (le bassin monte).', 'Rebondir sur les orteils.', 'Perdre l’alignement des épaules.'],
  breathing: 'Respiration courte et régulière, ne bloque pas.',
  load: '3 à 4 séries de 30 à 45 s.',
};

/* ------------------------------------------------------------------ */
/* CARDIO (sèche)                                                       */
/* ------------------------------------------------------------------ */

const tapisIncline: Exercise = {
  id: 'tapis-incline',
  name: 'Marche inclinée sur tapis',
  aka: 'Incline treadmill walk',
  equip: 'cardio',
  level: 1,
  view: 'side',
  tempo: 1.2,
  muscles: ['calves', 'quads', 'glutes'],
  secondary: ['hamstrings'],
  frames: [
    stand({ hip: [0.1, 1.84], torso: 86, ankleNear: [0.34, 0.42], ankleFar: [-0.15, 0.2], knee: 'up', footNear: 14, footFar: -6, armNear: [-60, -40], armFar: [-100, -70] }),
    stand({ hip: [0.1, 1.84], torso: 86, ankleNear: [-0.15, 0.2], ankleFar: [0.34, 0.42], knee: 'up', footNear: -6, footFar: 14, armNear: [-100, -70], armFar: [-60, -40] }),
  ],
  gear: [{ kind: 'cardio', variant: 'treadmill' }],
  steps: [
    'Règle le tapis sur une pente de 8 à 12 % et une vitesse de marche rapide (4-6 km/h).',
    'Marche sans tenir les rampes, buste droit, regard devant.',
    'Vise 30 à 45 minutes, à une allure où tu peux encore parler.',
  ],
  cues: ['Ne te tiens pas aux rampes', 'Buste droit', 'Allure constante'],
  mistakes: ['Se tenir aux rampes (ça annule le travail).', 'Courir à forte inclinaison sans habitude.', 'Monter la vitesse au lieu de la pente.'],
  breathing: 'Respiration nasale si possible, rythme régulier.',
  load: '30-45 min en zone 2, 3 à 5 fois par semaine en sèche.',
};

const elliptique: Exercise = {
  id: 'elliptique',
  name: 'Elliptique',
  aka: 'Elliptical trainer',
  equip: 'cardio',
  level: 1,
  view: 'side',
  tempo: 1.3,
  muscles: ['quads', 'calves'],
  secondary: ['glutes', 'hamstrings', 'chest'],
  frames: [
    stand({ hip: [0.05, 1.8], torso: 84, ankleNear: [0.42, 0.34], ankleFar: [-0.24, 0.2], knee: 'up', footNear: 12, footFar: -4, armNear: [-40, -28], armFar: [-80, -60] }),
    stand({ hip: [0.05, 1.8], torso: 84, ankleNear: [-0.24, 0.2], ankleFar: [0.42, 0.34], knee: 'up', footNear: -4, footFar: 12, armNear: [-80, -60], armFar: [-40, -28] }),
  ],
  gear: [{ kind: 'cardio', variant: 'elliptical' }],
  steps: [
    'Pieds bien à plat sur les pédales, posture droite.',
    'Pousse et tire en même temps avec les bras pour un mouvement fluide.',
    'Garde une résistance qui permet 20-30 min à allure constante.',
  ],
  cues: ['Dos droit, épaules basses', 'Mouvement fluide', 'Respiration régulière'],
  mistakes: ['Se pencher sur la console.', 'Aller trop vite avec une résistance nulle.', 'Fréquence cardiaque trop haute pour tenir 20 min.'],
  breathing: 'Respiration régulière et ample.',
  load: '20-40 min en zone 2, les jours sans séance de musculation.',
};

const rameur: Exercise = {
  id: 'rameur',
  name: 'Rameur',
  aka: 'Rowing machine',
  equip: 'cardio',
  level: 2,
  view: 'side',
  tempo: 2.2,
  muscles: ['lats', 'quads'],
  secondary: ['traps', 'glutes', 'biceps'],
  frames: [
    pose({ hip: [-0.25, 0.55], torso: 120, head: -30, ankleNear: [1.35, 0.34], ankleFar: [1.2, 0.34], knee: 'up', footNear: 34, footFar: 34, handNear: [-0.05, 1.2], handFar: [-0.18, 1.16], elbow: 'down' }),
    pose({ hip: [-0.25, 0.55], torso: 25, head: 35, ankleNear: [0.75, 0.34], ankleFar: [0.6, 0.34], knee: 'up', footNear: 34, footFar: 34, handNear: [1.62, 1.0], handFar: [1.5, 0.96], elbow: 'down' }),
  ],
  gear: [{ kind: 'cardio', variant: 'rower' }],
  steps: [
    'Pieds sanglés, genoux fléchis, buste légèrement penché en avant, dos droit.',
    'Pousse d’abord avec les jambes, puis incline le buste, enfin tire avec les bras.',
    'Reviens dans l’ordre inverse : bras, buste, jambes.',
  ],
  cues: ['Les jambes commandent le mouvement', 'Dos toujours droit', 'Rythme régulier (20-24 coups/min)'],
  mistakes: ['Tirer avec les bras avant de pousser les jambes.', 'Arrondir le dos à chaque coup.', 'Tirer la chaîne trop haut vers la poitrine.'],
  breathing: 'Expire pendant la poussée, inspire au retour.',
  load: '15-30 min, ou intervalles 30 s rapide / 30 s lent.',
};

const velo: Exercise = {
  id: 'velo',
  name: 'Vélo d’appartement',
  aka: 'Stationary bike',
  equip: 'cardio',
  level: 1,
  view: 'side',
  tempo: 1.1,
  muscles: ['quads', 'calves'],
  secondary: ['hamstrings', 'glutes'],
  frames: [
    pose({ hip: [-0.28, 0.95], torso: 56, head: -14, ankleNear: [0.18, 0.86], ankleFar: [0.02, 0.5], knee: 'up', footNear: 20, footFar: 20, handNear: [0.6, 1.42], handFar: [0.48, 1.4], elbow: 'down' }),
    pose({ hip: [-0.28, 0.95], torso: 56, head: -14, ankleNear: [0.18, 0.5], ankleFar: [0.02, 0.86], knee: 'up', footNear: 20, footFar: 20, handNear: [0.6, 1.42], handFar: [0.48, 1.4], elbow: 'down' }),
  ],
  gear: [{ kind: 'cardio', variant: 'bike' }],
  steps: [
    'Selle réglée : genou légèrement fléchi quand la pédale est en bas.',
    'Pédale à 80-100 tours/minute avec une résistance modérée.',
    'Garde le buste stable, sans te crisper sur le guidon.',
  ],
  cues: ['Cadence régulière', 'Genou qui ne part pas sur le côté', 'Buste détendu'],
  mistakes: ['Selle trop basse (genoux douloureux).', 'Résistance trop forte et cadence trop lente.', 'Se dandiner sur la selle.'],
  breathing: 'Respiration ample et régulière.',
  load: '20-40 min en zone 2, très utile en récupération.',
};

const cordeSauter: Exercise = {
  id: 'corde-sauter',
  name: 'Corde à sauter',
  aka: 'Jump rope',
  equip: 'cardio',
  level: 2,
  view: 'side',
  tempo: 0.9,
  muscles: ['calves'],
  secondary: ['quads', 'forearms'],
  frames: [
    stand({ hip: [0, 1.9], torso: 88, ankleNear: [0.12, 0.4], ankleFar: [-0.06, 0.4], knee: 'up', footNear: -30, footFar: -30, armNear: [-40, -20], armFar: [-46, -26] }),
    stand({ hip: [0, 1.78], torso: 88, ankleNear: [0.12, 0.16], ankleFar: [-0.06, 0.16], knee: 'up', footNear: 10, footFar: 10, armNear: [-40, -20], armFar: [-46, -26] }),
  ],
  gear: [{ kind: 'cardio', variant: 'rope' }],
  steps: [
    'Corde dimensionnée, coudes près du corps, poignets qui font tourner la corde.',
    'Saute juste assez pour laisser passer la corde (2-3 cm), sur l’avant-pied.',
    'Enchaîne 30 à 60 s, récupère, puis recommence.',
  ],
  cues: ['Petits sauts', 'Ce sont les poignets qui tournent', 'Regarde devant toi'],
  mistakes: ['Sauter trop haut (impact sur les genoux).', 'Tourner la corde avec les épaules.', 'Atterrir à plat sur les talons.'],
  breathing: 'Respiration par le nez, rythme régulier.',
  load: '5 à 10 min en intervalles : 40 s de travail / 20 s de repos.',
};

/* ------------------------------------------------------------------ */
/* Export                                                               */
/* ------------------------------------------------------------------ */

export const EXERCISES: Exercise[] = [
  squatBarre,
  gobletSquat,
  presseCuisses,
  fentesAvant,
  fentesBulgares,
  legExtension,
  legCurl,
  rdl,
  souleveTerre,
  hipThrust,
  molletsDebout,
  fentesLaterales,
  squatSumo,
  devCouche,
  devCoucheHalteres,
  devIncline,
  ecartesMachine,
  pompes,
  dips,
  ecartesPoulie,
  tirageVertical,
  tractions,
  rowingPoulie,
  rowingHaltere,
  rowingBarre,
  facePull,
  shrugs,
  hyperextensions,
  devMilitaire,
  devHalteres,
  elevationsLaterales,
  elevationsFrontales,
  oiseau,
  curlBarre,
  curlHalteres,
  curlMarteau,
  curlPoulie,
  extensionPoulie,
  extensionNuque,
  dipsBanc,
  kickback,
  crunch,
  planche,
  gainageLateral,
  releveGenoux,
  russianTwist,
  mountainClimbers,
  tapisIncline,
  elliptique,
  rameur,
  velo,
  cordeSauter,
];

export const EXERCISE_BY_ID: Record<string, Exercise> = Object.fromEntries(EXERCISES.map((e) => [e.id, e]));

export function getExercise(id: string): Exercise {
  return EXERCISE_BY_ID[id] ?? EXERCISES[0];
}

export const EQUIPMENT_LABEL: Record<Equipment, string> = {
  barbell: 'Barre',
  dumbbell: 'Haltères',
  machine: 'Machine',
  cable: 'Poulie',
  bodyweight: 'Poids du corps',
  cardio: 'Cardio',
  band: 'Élastique',
  kettlebell: 'Kettlebell',
};
