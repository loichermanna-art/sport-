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
  emoji: string;
  items: PlannedExercise[];
  cardio?: { exerciseId: string; minutes: number };
  /** Jour de la semaine planifié : 0 = lundi … 6 = dimanche. */
  weekday: number;
}

export interface Program {
  goal: Goal;
  level: Level;
  days: number;
  sessions: Session[];
  createdAt: string;
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

export interface AppState {
  profile: Profile | null;
  program: Program | null;
  history: HistoryEntry[];
  bodyweights: BodyWeightPoint[];
  active: ActiveSession | null;
}
