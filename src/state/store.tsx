import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type {
  AppState,
  BodyWeightPoint,
  DoneSet,
  HistoryEntry,
  PlannedExercise,
  Profile,
  Program,
  Session,
  Settings,
} from '../data/types';
import { buildProgram, newProgram, PROGRAM_NAME } from '../data/programs';

const KEY = 'gymos.v1';
/** Ancienne clé IronPath, migrée automatiquement au premier chargement. */
const LEGACY_KEY = 'ironpath.v2';

const DEFAULT_SETTINGS: Settings = {
  units: 'kg',
  reduceMotion: 'auto',
  sound: true,
  vibration: true,
  defaultRest: 75,
};

const EMPTY: AppState = {
  profile: null,
  programs: [],
  activeProgramId: null,
  history: [],
  bodyweights: [],
  active: null,
  settings: DEFAULT_SETTINGS,
};

/** Ancien format : un seul programme, sans identifiant ni statut. */
interface LegacyState {
  profile: Profile | null;
  program: Omit<Program, 'id' | 'name' | 'status'> | null;
  history: HistoryEntry[];
  bodyweights: BodyWeightPoint[];
  active: AppState['active'];
}

function migrateLegacy(raw: string): AppState | null {
  try {
    const old = JSON.parse(raw) as Partial<LegacyState>;
    if (!old || typeof old !== 'object') return null;
    const base: AppState = {
      ...EMPTY,
      profile: old.profile ?? null,
      history: old.history ?? [],
      bodyweights: old.bodyweights ?? [],
      active: old.active ?? null,
    };
    if (old.program && old.profile && Array.isArray(old.program.sessions)) {
      const p = newProgram(old.profile, old.program.sessions, `${PROGRAM_NAME[old.program.goal]} (importé)`);
      base.programs = [p];
      base.activeProgramId = p.id;
    }
    return base;
  } catch {
    return null;
  }
}

function load(): AppState {
  if (typeof localStorage === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      return {
        ...EMPTY,
        ...parsed,
        programs: Array.isArray(parsed.programs) ? parsed.programs : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      };
    }
    const legacy = localStorage.getItem(LEGACY_KEY);
    if (legacy) return migrateLegacy(legacy) ?? EMPTY;
    return EMPTY;
  } catch {
    return EMPTY;
  }
}

interface Store extends AppState {
  /** Programme sélectionné (ou le premier par défaut). */
  currentProgram: Program | null;
  saveProfile: (p: Profile) => void;
  regenerate: () => void;
  reset: () => void;
  createProgram: (name: string) => void;
  renameProgram: (id: string, name: string) => void;
  setProgramStatus: (id: string, status: Program['status']) => void;
  deleteProgram: (id: string) => void;
  selectProgram: (id: string) => void;
  /** Déplace une séance vers un autre jour de la semaine. */
  moveSession: (programId: string, sessionId: string, weekday: number) => void;
  replaceSessionItems: (programId: string, sessionId: string, items: PlannedExercise[]) => void;
  updateSettings: (patch: Partial<Settings>) => void;
  startSession: (sessionId: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<DoneSet>) => void;
  addSet: (exerciseId: string, template: DoneSet) => void;
  initSets: (items: { exerciseId: string; sets: number; reps: string }[], lastWeight: Record<string, number>) => void;
  removeSet: (exerciseId: string) => void;
  finishSession: (durationSec: number) => HistoryEntry | null;
  cancelSession: () => void;
  logWeight: (kg: number) => void;
  importState: (raw: string) => boolean;
  exportState: () => string;
}

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(load);

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* quota ou navigation privée : on continue en mémoire */
    }
  }, [state]);

  const currentProgram = useMemo(
    () => state.programs.find((p) => p.id === state.activeProgramId) ?? state.programs[0] ?? null,
    [state.programs, state.activeProgramId],
  );

  const saveProfile = useCallback((p: Profile) => {
    setState((s) => {
      const existing = s.programs;
      if (existing.length > 0) return { ...s, profile: p };
      const prog = buildProgram(p);
      return { ...s, profile: p, programs: [prog], activeProgramId: prog.id };
    });
  }, []);

  const regenerate = useCallback(() => {
    setState((s) => {
      if (!s.profile) return s;
      const prog = buildProgram(s.profile);
      return {
        ...s,
        programs: [...s.programs.filter((p) => p.id !== s.activeProgramId), prog],
        activeProgramId: prog.id,
        active: null,
      };
    });
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

  const createProgram = useCallback((name: string) => {
    setState((s) => {
      if (!s.profile) return s;
      const prog = newProgram(s.profile, buildProgram(s.profile).sessions, name);
      return { ...s, programs: [...s.programs, prog], activeProgramId: prog.id };
    });
  }, []);

  const renameProgram = useCallback((id: string, name: string) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) => (p.id === id ? { ...p, name: name.trim() || p.name } : p)),
    }));
  }, []);

  const setProgramStatus = useCallback((id: string, status: Program['status']) => {
    setState((s) => ({ ...s, programs: s.programs.map((p) => (p.id === id ? { ...p, status } : p)) }));
  }, []);

  const deleteProgram = useCallback((id: string) => {
    setState((s) => {
      const programs = s.programs.filter((p) => p.id !== id);
      return {
        ...s,
        programs,
        activeProgramId: s.activeProgramId === id ? (programs[0]?.id ?? null) : s.activeProgramId,
      };
    });
  }, []);

  const selectProgram = useCallback((id: string) => setState((s) => ({ ...s, activeProgramId: id })), []);

  const moveSession = useCallback((programId: string, sessionId: string, weekday: number) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) =>
        p.id === programId ? { ...p, sessions: p.sessions.map((x) => (x.id === sessionId ? { ...x, weekday } : x)) } : p,
      ),
    }));
  }, []);

  const replaceSessionItems = useCallback((programId: string, sessionId: string, items: PlannedExercise[]) => {
    setState((s) => ({
      ...s,
      programs: s.programs.map((p) =>
        p.id === programId ? { ...p, sessions: p.sessions.map((x) => (x.id === sessionId ? { ...x, items } : x)) } : p,
      ),
    }));
  }, []);

  const updateSettings = useCallback((patch: Partial<Settings>) => {
    setState((s) => ({ ...s, settings: { ...s.settings, ...patch } }));
  }, []);

  const startSession = useCallback((sessionId: string) => {
    setState((s) => ({
      ...s,
      active: { date: todayISO(), sessionId, startedAt: Date.now(), sets: {}, finished: false },
    }));
  }, []);

  const updateSet = useCallback((exerciseId: string, index: number, patch: Partial<DoneSet>) => {
    setState((s) => {
      if (!s.active) return s;
      const sets = [...(s.active.sets[exerciseId] ?? [])];
      if (!sets[index]) return s;
      sets[index] = { ...sets[index], ...patch };
      return { ...s, active: { ...s.active, sets: { ...s.active.sets, [exerciseId]: sets } } };
    });
  }, []);

  const addSet = useCallback((exerciseId: string, template: DoneSet) => {
    setState((s) => {
      if (!s.active) return s;
      const sets = [...(s.active.sets[exerciseId] ?? []), template];
      return { ...s, active: { ...s.active, sets: { ...s.active.sets, [exerciseId]: sets } } };
    });
  }, []);

  const initSets = useCallback(
    (items: { exerciseId: string; sets: number; reps: string }[], lastWeight: Record<string, number>) => {
      setState((s) => {
        if (!s.active) return s;
        const sets: Record<string, DoneSet[]> = { ...s.active.sets };
        for (const it of items) {
          if (sets[it.exerciseId]?.length) continue;
          const target = parseInt(it.reps, 10) || 10;
          const w = lastWeight[it.exerciseId] ?? 0;
          sets[it.exerciseId] = Array.from({ length: it.sets }, () => ({ reps: target, weight: w, done: false }));
        }
        return { ...s, active: { ...s.active, sets } };
      });
    },
    [],
  );

  const removeSet = useCallback((exerciseId: string) => {
    setState((s) => {
      if (!s.active) return s;
      const sets = [...(s.active.sets[exerciseId] ?? [])];
      sets.pop();
      return { ...s, active: { ...s.active, sets: { ...s.active.sets, [exerciseId]: sets } } };
    });
  }, []);

  const finishSession = useCallback(
    (durationSec: number): HistoryEntry | null => {
      const s = state;
      if (!s.active) return null;
      const program = s.programs.find((p) => p.id === s.activeProgramId) ?? s.programs[0];
      const session = program?.sessions.find((x) => x.id === s.active!.sessionId);
      const exercises = Object.entries(s.active.sets)
        .filter(([, sets]) => sets.some((x) => x.done))
        .map(([exerciseId, sets]) => ({ exerciseId, sets: sets.filter((x) => x.done) }));
      if (exercises.length === 0) return null;
      const volume = exercises.reduce(
        (acc, e) => acc + e.sets.reduce((a, x) => a + (x.weight > 0 ? x.weight : 10) * x.reps, 0),
        0,
      );
      const entry: HistoryEntry = {
        id: `${Date.now()}`,
        date: s.active.date,
        sessionId: s.active.sessionId,
        sessionName: session?.name ?? 'Séance',
        durationSec,
        exercises,
        volume,
      };
      setState((prev) => ({ ...prev, history: [...prev.history, entry], active: null }));
      return entry;
    },
    [state],
  );

  const cancelSession = useCallback(() => setState((s) => ({ ...s, active: null })), []);

  const logWeight = useCallback((kg: number) => {
    setState((s) => {
      const date = todayISO();
      const rest = s.bodyweights.filter((b) => b.date !== date);
      return { ...s, bodyweights: [...rest, { date, kg }].sort((a, b) => a.date.localeCompare(b.date)) };
    });
  }, []);

  const exportState = useCallback(() => JSON.stringify(state, null, 2), [state]);

  const importState = useCallback((raw: string) => {
    try {
      const parsed = JSON.parse(raw) as Partial<AppState>;
      if (!parsed || typeof parsed !== 'object') return false;
      setState({
        ...EMPTY,
        ...parsed,
        programs: Array.isArray(parsed.programs) ? parsed.programs : [],
        settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
      });
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      currentProgram,
      saveProfile,
      regenerate,
      reset,
      createProgram,
      renameProgram,
      setProgramStatus,
      deleteProgram,
      selectProgram,
      moveSession,
      replaceSessionItems,
      updateSettings,
      startSession,
      updateSet,
      addSet,
      removeSet,
      initSets,
      finishSession,
      cancelSession,
      logWeight,
      importState,
      exportState,
    }),
    [
      state,
      currentProgram,
      saveProfile,
      regenerate,
      reset,
      createProgram,
      renameProgram,
      setProgramStatus,
      deleteProgram,
      selectProgram,
      moveSession,
      replaceSessionItems,
      updateSettings,
      startSession,
      updateSet,
      addSet,
      removeSet,
      initSets,
      finishSession,
      cancelSession,
      logWeight,
      importState,
      exportState,
    ],
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useStore(): Store {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error('StoreProvider manquant');
  return ctx;
}

/* ----------------------------- utilitaires ----------------------------- */

export function todayISO(d = new Date()): string {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, '0');
  const day = `${d.getDate()}`.padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Index du jour dans la semaine, lundi = 0. */
export function weekdayIndex(d = new Date()): number {
  return (d.getDay() + 6) % 7;
}

export function daysBetween(a: string, b: string): number {
  return Math.round((Date.parse(b) - Date.parse(a)) / 86400000);
}

export function findSessionForToday(
  program: Program | null,
  date = new Date(),
): { session: Session | null; index: number } {
  if (!program) return { session: null, index: -1 };
  const wd = weekdayIndex(date);
  const idx = program.sessions.findIndex((s) => s.weekday === wd);
  if (idx >= 0) return { session: program.sessions[idx], index: idx };
  // jour de repos : on propose la prochaine séance
  const next = program.sessions.find((s) => s.weekday > wd) ?? program.sessions[0];
  return { session: next ?? null, index: next ? program.sessions.indexOf(next) : -1 };
}

export function streakOf(history: HistoryEntry[]): number {
  if (history.length === 0) return 0;
  const days = [...new Set(history.map((h) => h.date))].sort().reverse();
  let streak = 0;
  let cursor = todayISO();
  for (const d of days) {
    if (d === cursor) {
      streak++;
      cursor = todayISO(new Date(Date.parse(cursor) - 86400000));
    } else if (d < cursor) {
      break;
    }
  }
  if (streak === 0 && daysBetween(days[0], todayISO()) <= 1) streak = 1;
  return streak;
}

export function lastWeights(history: HistoryEntry[]): Record<string, number> {
  const out: Record<string, number> = {};
  for (const h of [...history].reverse()) {
    for (const e of h.exercises) {
      for (const s of e.sets) {
        if (s.weight > 0 && out[e.exerciseId] === undefined) out[e.exerciseId] = s.weight;
      }
    }
  }
  return out;
}

export function personalRecords(
  history: HistoryEntry[],
): Record<string, { weight: number; reps: number; date: string }> {
  const pr: Record<string, { weight: number; reps: number; date: string }> = {};
  for (const h of history) {
    for (const e of h.exercises) {
      for (const s of e.sets) {
        const cur = pr[e.exerciseId];
        const score = s.weight * 100 + s.reps;
        if (!cur || score > cur.weight * 100 + cur.reps) {
          pr[e.exerciseId] = { weight: s.weight, reps: s.reps, date: h.date };
        }
      }
    }
  }
  return pr;
}

export { buildProgram };
export type { BodyWeightPoint, DoneSet };
