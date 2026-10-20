import { createContext, useContext, useEffect, useMemo, useState, useCallback, type ReactNode } from 'react';
import type { AppState, BodyWeightPoint, DoneSet, HistoryEntry, Profile, Program, Session } from '../data/types';
import { buildProgram } from '../data/programs';

const KEY = 'ironpath.v2';

const EMPTY: AppState = { profile: null, program: null, history: [], bodyweights: [], active: null };

function load(): AppState {
  if (typeof localStorage === 'undefined') return EMPTY;
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<AppState>;
    return { ...EMPTY, ...parsed };
  } catch {
    return EMPTY;
  }
}

interface Store extends AppState {
  saveProfile: (p: Profile) => void;
  regenerate: () => void;
  reset: () => void;
  startSession: (sessionId: string) => void;
  updateSet: (exerciseId: string, index: number, patch: Partial<DoneSet>) => void;
  addSet: (exerciseId: string, template: DoneSet) => void;
  /** Pré-remplit les séries d'une séance à partir du plan et de l'historique. */
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

  const saveProfile = useCallback((p: Profile) => {
    setState((s) => ({ ...s, profile: p, program: buildProgram(p), active: null }));
  }, []);

  const regenerate = useCallback(() => {
    setState((s) => (s.profile ? { ...s, program: buildProgram(s.profile), active: null } : s));
  }, []);

  const reset = useCallback(() => setState(EMPTY), []);

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
      if (!s.active || !s.program) return null;
      const session = s.program.sessions.find((x) => x.id === s.active!.sessionId);
      const exercises = Object.entries(s.active.sets)
        .filter(([, sets]) => sets.some((x) => x.done))
        .map(([exerciseId, sets]) => ({ exerciseId, sets: sets.filter((x) => x.done) }));
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
      const parsed = JSON.parse(raw) as AppState;
      setState({ ...EMPTY, ...parsed });
      return true;
    } catch {
      return false;
    }
  }, []);

  const value = useMemo<Store>(
    () => ({
      ...state,
      saveProfile,
      regenerate,
      reset,
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
      saveProfile,
      regenerate,
      reset,
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

export function findSessionForToday(program: Program | null, date = new Date()): { session: Session | null; index: number } {
  if (!program) return { session: null, index: -1 };
  const wd = weekdayIndex(date);
  const idx = program.sessions.findIndex((s) => s.weekday === wd);
  if (idx >= 0) return { session: program.sessions[idx], index: idx };
  // jour de repos : on propose la prochaine séance
  const next = program.sessions.find((s) => s.weekday > wd) ?? program.sessions[0];
  return { session: next, index: program.sessions.indexOf(next) };
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

export function personalRecords(history: HistoryEntry[]): Record<string, { weight: number; reps: number; date: string }> {
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
