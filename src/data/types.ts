export type Goal = 'seche' | 'masse' | 'force';
export type Level = 1 | 2 | 3;

export interface Profile {
  name: string;
  goal: Goal;
  level: Level;
  /** Nombre de séances de musculation par semaine (3 à 6). */
  days: number;
  weight: number;
  age: number;
  sex: 'f' | 'h' | 'x';
  startDate: string;
  cardio: boolean;
}

export interface PlannedExercise {
  exerciseId: string;
  sets: number;
  reps: string;
  /** Repos en secondes. */
  rest: number;
  note?: string;
}

export interface Session {
  id: string;
  name: string;
  focus: string;
  items: PlannedExercise[];
  cardio?: { exerciseId: string; minutes: number };
  /** Jour de la semaine planifié : 0 = lundi … 6 = dimanche. */
  weekday: number;
}

export type ProgramStatus = 'active' | 'paused' | 'archived';

export interface Program {
  id: string;
  name: string;
  goal: Goal;
  level: Level;
  days: number;
  sessions: Session[];
  createdAt: string;
  status: ProgramStatus;
}

export interface DoneSet {
  reps: number;
  weight: number;
  done: boolean;
}

export interface HistoryEntry {
  id: string;
  date: string;
  sessionId: string;
  sessionName: string;
  durationSec: number;
  exercises: { exerciseId: string; sets: DoneSet[] }[];
  volume: number;
}

export interface BodyWeightPoint {
  date: string;
  kg: number;
}

export interface ActiveSession {
  date: string;
  sessionId: string;
  startedAt: number;
  /** exerciseId -> séries saisies */
  sets: Record<string, DoneSet[]>;
  finished: boolean;
}

export interface Settings {
  /** Unité de charge affichée. */
  units: 'kg' | 'lb';
  /** `auto` suit le réglage système, `on` et `off` le forcent. */
  reduceMotion: 'auto' | 'on' | 'off';
  sound: boolean;
  vibration: boolean;
  /** Repos par défaut proposé après une série, en secondes. */
  defaultRest: number;
}

export interface AppState {
  profile: Profile | null;
  programs: Program[];
  activeProgramId: string | null;
  history: HistoryEntry[];
  bodyweights: BodyWeightPoint[];
  active: ActiveSession | null;
  settings: Settings;
}
