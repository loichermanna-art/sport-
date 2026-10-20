import { useEffect, useMemo, useState } from 'react';
import { useStore, findSessionForToday, lastWeights, todayISO, weekdayIndex } from '../state/store';
import { getExercise } from '../data/exercises';
import { sessionDuration, GOAL_SHORT } from '../data/programs';
import type { Exercise } from '../data/exercises';
import { MUSCLE_LABEL } from '../lib/render';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { AnimatedFigure } from '../components/Figure';
import { RestTimer } from '../components/RestTimer';
import { beepSetDone, buzz } from '../lib/audio';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function Today() {
  const { program, active, history, profile, startSession, initSets, updateSet, finishSession, cancelSession } = useStore();
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [rest, setRest] = useState<{ seconds: number; label: string } | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const { session } = findSessionForToday(program);
  const isRestDay = useMemo(() => {
    if (!program) return true;
    return !program.sessions.some((s) => s.weekday === weekdayIndex());
  }, [program]);

  const lastW = useMemo(() => lastWeights(history), [history]);

  useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setElapsed(Math.round((Date.now() - active.startedAt) / 1000)), 1000);
    return () => clearInterval(id);
  }, [active]);

  useEffect(() => {
    if (active && session) initSets(session.items, lastW);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active?.sessionId, active?.date]);

  if (!program || !profile || !session) return null;

  const totalSets = session.items.reduce((a, it) => a + it.sets, 0);
  const doneSets = active
    ? Object.values(active.sets).reduce((a, sets) => a + sets.filter((s) => s.done).length, 0)
    : 0;
  const pct = Math.min(100, Math.round((doneSets / Math.max(1, totalSets)) * 100));

  /* ------------------------- Séance non démarrée ------------------------- */
  if (!active) {
    return (
      <div>
        <div className="pagehead">
          <div>
            <div className="eyebrow">
              {DAYS[weekdayIndex()]} · {GOAL_SHORT[program.goal]}
            </div>
            <h1>{isRestDay ? 'Jour de repos 😴' : `Aujourd’hui : ${session.name}`}</h1>
            <p>
              {isRestDay
                ? 'La récupération fait partie du progrès. Prochaine séance ci-dessous — tu peux aussi faire une séance de cardio léger.'
                : `${session.items.length} exercices · ${sessionDuration(session)} min · ${totalSets} séries`}
            </p>
          </div>
        </div>

        {isRestDay ? (
          <div className="card" style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 44 }}>🧘</div>
            <p className="muted small mt8">
              Étirements, marche, sommeil : c’est là que le muscle se construit. À demain pour{' '}
              <strong>{session.name}</strong>.
            </p>
            <button className="btn btn--primary btn--block mt14" onClick={() => startSession(session.id)}>
              Faire la séance quand même
            </button>
          </div>
        ) : (
          <div className="card">
            <AnimatedFigure exercise={getExercise(session.items[0].exerciseId)} showControls={false} />
            <div className="row row--between mt14">
              <strong>{session.focus}</strong>
              <span className="pill pill--accent">{session.emoji} {sessionDuration(session)} min</span>
            </div>
            <p className="muted small mt8">
              Regarde l’animation, mémorise le mouvement, puis lance la séance : l’app te guidera série par série avec le
              chronomètre de repos.
            </p>
            <button className="btn btn--primary btn--block mt14" onClick={() => startSession(session.id)}>
              ▶ Commencer la séance
            </button>
          </div>
        )}

        <div className="card mt14">
          <div className="row row--between">
            <strong>Au programme</strong>
            <span className="tiny muted">{totalSets} séries</span>
          </div>
          <div className="divider" />
          <div style={{ display: 'grid', gap: 4 }}>
            {session.items.map((it, i) => {
              const ex = getExercise(it.exerciseId);
              return (
                <button key={`${it.exerciseId}-${i}`} className="exorow" onClick={() => setDetail(ex)}>
                  <span className="pill pill--accent" style={{ minWidth: 62, textAlign: 'center' }}>
                    {it.sets} × {it.reps}
                  </span>
                  <span>
                    <span className="exorow__name">{ex.name}</span>
                    <span className="exorow__meta">
                      {ex.muscles.map((m) => MUSCLE_LABEL[m]).slice(0, 2).join(' · ')} · repos {it.rest}s
                    </span>
                  </span>
                  <span className="muted">voir ›</span>
                </button>
              );
            })}
            {session.cardio ? (
              <div className="exorow" style={{ cursor: 'default' }}>
                <span className="pill pill--green" style={{ minWidth: 62, textAlign: 'center' }}>
                  {session.cardio.minutes} min
                </span>
                <span>
                  <span className="exorow__name">🏃 {getExercise(session.cardio.exerciseId).name}</span>
                  <span className="exorow__meta">Cardio en fin de séance — allure modérée</span>
                </span>
                <span />
              </div>
            ) : null}
          </div>
        </div>

        {detail ? <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} /> : null}
      </div>
    );
  }

  /* --------------------------- Séance en cours --------------------------- */
  const activeSession = program.sessions.find((s) => s.id === active.sessionId) ?? session;

  function toggleSet(exerciseId: string, index: number, restSeconds: number) {
    const set = active!.sets[exerciseId]?.[index];
    if (!set) return;
    const next = !set.done;
    updateSet(exerciseId, index, { done: next });
    if (next) {
      beepSetDone();
      buzz();
      setRest({ seconds: restSeconds, label: `Repos — ${getExercise(exerciseId).name}` });
    }
  }

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Séance en cours</div>
          <h1>
            {activeSession.emoji} {activeSession.name}
          </h1>
          <p>
            {Math.floor(elapsed / 60)} min {elapsed % 60} s · {doneSets}/{totalSets} séries
          </p>
        </div>
        <button className="btn btn--ghost" onClick={() => cancelSession()}>
          Abandonner
        </button>
      </div>

      <div className="card" style={{ padding: 14 }}>
        <div className="row row--between">
          <strong className="small">Progression</strong>
          <strong className="small" style={{ color: 'var(--accent)' }}>
            {pct}%
          </strong>
        </div>
        <div style={{ height: 8, background: 'var(--surface-2)', borderRadius: 999, marginTop: 8, overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--grad)', transition: 'width .3s' }} />
        </div>
      </div>

      {activeSession.items.map((it) => {
        const ex = getExercise(it.exerciseId);
        const sets = active.sets[it.exerciseId] ?? [];
        const allDone = sets.length > 0 && sets.every((s) => s.done);
        const hint = lastW[it.exerciseId];
        return (
          <div className={`card mt14 ${allDone ? 'exorow--done' : ''}`} key={it.exerciseId}>
            <div className="row row--between">
              <div>
                <strong style={{ fontSize: 16 }}>{ex.name}</strong>
                <div className="tiny muted">
                  {it.sets} × {it.reps} · repos {it.rest}s
                  {hint ? ` · dernière séance ${hint.toString().replace('.', ',')} kg` : ''}
                </div>
              </div>
              <button className="chip chip--sm" onClick={() => setDetail(ex)}>
                Démo
              </button>
            </div>

            <table className="settable mt14">
              <thead>
                <tr>
                  <th style={{ width: 58 }}>Série</th>
                  <th>Charge (kg)</th>
                  <th>Répétitions</th>
                  <th style={{ width: 44 }}></th>
                </tr>
              </thead>
              <tbody>
                {sets.map((s, i) => (
                  <tr key={i}>
                    <td className="muted" style={{ fontWeight: 700 }}>
                      {i + 1}
                    </td>
                    <td>
                      <input
                        className="setinput"
                        inputMode="decimal"
                        value={s.weight === 0 ? '' : String(s.weight)}
                        placeholder="0"
                        onChange={(e) => updateSet(it.exerciseId, i, { weight: Number(e.target.value.replace(',', '.')) || 0 })}
                      />
                    </td>
                    <td>
                      <input
                        className="setinput"
                        inputMode="numeric"
                        value={s.reps === 0 ? '' : String(s.reps)}
                        placeholder="0"
                        onChange={(e) => updateSet(it.exerciseId, i, { reps: Number(e.target.value) || 0 })}
                      />
                    </td>
                    <td>
                      <button
                        className={`setcheck ${s.done ? 'setcheck--on' : ''}`}
                        onClick={() => toggleSet(it.exerciseId, i, it.rest)}
                        aria-label={s.done ? 'Annuler la série' : 'Valider la série'}
                      >
                        {s.done ? '✓' : ''}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        );
      })}

      {activeSession.cardio ? (
        <div className="card mt14">
          <div className="row row--between">
            <div>
              <strong>🏃 {getExercise(activeSession.cardio.exerciseId).name}</strong>
              <div className="tiny muted">Cardio en fin de séance</div>
            </div>
            <span className="pill pill--green">{activeSession.cardio.minutes} min</span>
          </div>
        </div>
      ) : null}

      <div className="row" style={{ gap: 10, marginTop: 16 }}>
        <button
          className="btn btn--primary btn--block"
          onClick={() => {
            const entry = finishSession(Math.round((Date.now() - active.startedAt) / 1000));
            if (entry) {
              setCelebrate(`${entry.exercises.length} exercices · ${Math.round(entry.volume)} kg soulevés`);
              setRest(null);
            }
          }}
        >
          ✅ Terminer la séance
        </button>
      </div>

      {celebrate ? (
        <div className="card mt14" style={{ textAlign: 'center', borderColor: 'rgba(52,211,153,.4)' }}>
          <div style={{ fontSize: 40 }}>🎉</div>
          <strong>Séance terminée !</strong>
          <p className="muted small mt8">{celebrate}</p>
          <p className="tiny muted mt8">
            Prochaine séance : {DAYS[program.sessions[(program.sessions.indexOf(activeSession) + 1) % program.sessions.length].weekday]} ·{' '}
            {new Date().toLocaleDateString('fr-FR')} enregistré le {todayISO()}
          </p>
          <button className="btn btn--ghost mt14" onClick={() => setCelebrate(null)}>
            Fermer
          </button>
        </div>
      ) : null}

      {rest ? <RestTimer seconds={rest.seconds} label={rest.label} onClose={() => setRest(null)} /> : null}
      {detail ? <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
