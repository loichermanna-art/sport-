import { useEffect, useMemo, useState } from 'react';
import { useStore, lastWeights, findSessionForToday } from '../state/store';
import { getExercise } from '../data/exercises';
import { RestTimer } from '../components/RestTimer';
import { beepSetDone, buzz } from '../lib/audio';
import { Icon } from '../components/Icon';
import { toDisplay, toKg, unitLabel, formatDuration, formatVolume } from '../lib/units';
import { useReducedMotion } from '../hooks/useMotion';

export function Session({ onExit }: { onExit: () => void }) {
  const { active, currentProgram, history, settings, updateSet, finishSession, cancelSession, initSets } = useStore();
  const [rest, setRest] = useState<{ seconds: number; label: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const [done, setDone] = useState<{ exercises: number; volume: number; duration: number } | null>(null);
  const reduced = useReducedMotion();

  const session = useMemo(
    () => currentProgram?.sessions.find((s) => s.id === active?.sessionId) ?? null,
    [currentProgram, active?.sessionId],
  );
  const lastW = useMemo(() => lastWeights(history), [history]);

  useEffect(() => {
    if (!active) return;
    setElapsed(Math.round((Date.now() - active.startedAt) / 1000));
    const id = setInterval(() => setElapsed(Math.round((Date.now() - active.startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active && session) initSets(session.items, lastW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.sessionId, active?.date]);

  if (!active || !session) return null;

  const totalSets = session.items.reduce((a, it) => a + it.sets, 0);
  const doneSets = Object.values(active.sets).reduce((a, sets) => a + sets.filter((s) => s.done).length, 0);
  const pct = Math.min(100, Math.round((doneSets / Math.max(1, totalSets)) * 100));

  function toggleSet(exerciseId: string, index: number, restSeconds: number) {
    const set = active!.sets[exerciseId]?.[index];
    if (!set) return;
    const next = !set.done;
    updateSet(exerciseId, index, { done: next });
    if (next) {
      if (settings.sound) beepSetDone();
      if (settings.vibration) buzz();
      setRest({ seconds: restSeconds, label: `Repos — ${getExercise(exerciseId).name}` });
    } else {
      setRest(null);
    }
  }

  function finish() {
    const entry = finishSession(Math.round((Date.now() - active!.startedAt) / 1000));
    if (entry) {
      setRest(null);
      setDone({ exercises: entry.exercises.length, volume: entry.volume, duration: entry.durationSec });
    }
  }

  /* ------------------------------ Récapitulatif ------------------------------ */
  if (done) {
    return (
      <div className="session">
        <div className="card" style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '50%',
              background: 'var(--success-soft)',
              color: 'var(--success)',
              display: 'grid',
              placeItems: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Icon name="check" size={22} strokeWidth={2} />
          </div>
          <h2 style={{ fontSize: 19, marginBottom: 4 }}>Séance terminée</h2>
          <p className="muted small">
            {done.exercises} exercices · {formatVolume(done.volume, settings.units)} · {formatDuration(done.duration)}
          </p>
          <button className="btn btn--primary btn--block btn--lg mt20" onClick={onExit}>
            Retour au tableau de bord
          </button>
        </div>
      </div>
    );
  }

  /* --------------------------------- Séance --------------------------------- */
  return (
    <div className="session">
      <div className="session__head">
        <div className="session__title">
          <span>{session.name}</span>
          {confirmAbandon ? (
            <span className="row" style={{ gap: 6 }}>
              <button className="btn btn--sm btn--ghost" onClick={() => setConfirmAbandon(false)}>
                Annuler
              </button>
              <button
                className="btn btn--sm btn--danger"
                onClick={() => {
                  cancelSession();
                  onExit();
                }}
              >
                Interrompre
              </button>
            </span>
          ) : (
            <button className="btn btn--sm btn--ghost" onClick={() => setConfirmAbandon(true)}>
              Interrompre
            </button>
          )}
        </div>
        <div className="row row--between" style={{ marginBottom: 6 }}>
          <span className="tiny muted">
            {doneSets}/{totalSets} séries · {formatDuration(elapsed)}
          </span>
          <span className="tiny muted">{pct} %</span>
        </div>
        <div className="progress">
          <div className="progress__bar" style={{ width: `${pct}%` }} />
        </div>
      </div>

      {session.items.map((it) => {
        const ex = getExercise(it.exerciseId);
        const sets = active.sets[it.exerciseId] ?? [];
        const allDone = sets.length > 0 && sets.every((s) => s.done);
        return (
          <div className={`exblock ${allDone ? 'exblock--done' : ''}`} key={it.exerciseId}>
            <div className="exblock__head">
              <div>
                <div className="exblock__name">{ex.name}</div>
                <div className="exblock__target">
                  {it.sets} × {it.reps} · repos {it.rest} s
                </div>
              </div>
              {allDone ? (
                <span className="pill pill--green">
                  <Icon name="check" size={13} strokeWidth={2} /> Terminé
                </span>
              ) : null}
            </div>

            <div className="setrow" aria-hidden="true">
              <span />
              <span className="tiny muted-2" style={{ textAlign: 'center' }}>
                Charge ({unitLabel(settings.units)})
              </span>
              <span className="tiny muted-2" style={{ textAlign: 'center' }}>
                Répétitions
              </span>
              <span />
            </div>

            {sets.map((s, i) => (
              <div className={`setrow ${s.done ? 'setrow--done' : ''}`} key={i}>
                <span className="setrow__idx">{i + 1}</span>
                <input
                  className="setinput"
                  inputMode="decimal"
                  aria-label={`Série ${i + 1} — charge en ${unitLabel(settings.units)}`}
                  value={s.weight === 0 ? '' : String(Math.round(toDisplay(s.weight, settings.units) * 10) / 10)}
                  placeholder="0"
                  onChange={(e) =>
                    updateSet(it.exerciseId, i, {
                      weight: toKg(Number(e.target.value.replace(',', '.')) || 0, settings.units),
                    })
                  }
                />
                <input
                  className="setinput"
                  inputMode="numeric"
                  aria-label={`Série ${i + 1} — répétitions`}
                  value={s.reps === 0 ? '' : String(s.reps)}
                  placeholder="0"
                  onChange={(e) => updateSet(it.exerciseId, i, { reps: Number(e.target.value) || 0 })}
                />
                <button
                  className={`setcheck ${s.done ? 'setcheck--on' : ''}`}
                  onClick={() => toggleSet(it.exerciseId, i, it.rest)}
                  aria-label={s.done ? `Annuler la série ${i + 1}` : `Valider la série ${i + 1}`}
                  aria-pressed={s.done}
                >
                  <Icon name="check" size={20} strokeWidth={2.2} />
                </button>
              </div>
            ))}
          </div>
        );
      })}

      {session.cardio ? (
        <div className="exblock">
          <div className="exblock__head">
            <div>
              <div className="exblock__name">{getExercise(session.cardio.exerciseId).name}</div>
              <div className="exblock__target">Cardio en fin de séance — allure modérée</div>
            </div>
            <span className="pill pill--green">{session.cardio.minutes} min</span>
          </div>
        </div>
      ) : null}

      <button className="btn btn--primary btn--block btn--lg mt14" onClick={finish} disabled={doneSets === 0}>
        Terminer la séance
      </button>
      {doneSets === 0 ? (
        <p className="tiny muted-2 mt8" style={{ textAlign: 'center' }}>
          Valide au moins une série pour enregistrer la séance.
        </p>
      ) : null}

      {rest ? (
        <RestTimer
          seconds={rest.seconds}
          label={rest.label}
          onClose={() => setRest(null)}
          reducedMotion={reduced}
        />
      ) : null}
    </div>
  );
}

/** Utilitaire exposé pour le tableau de bord : la séance du jour sans session active. */
export function useTodaySession() {
  const { currentProgram } = useStore();
  return findSessionForToday(currentProgram);
}
