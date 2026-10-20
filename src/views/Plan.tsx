import { useState } from 'react';
import { useStore, weekdayIndex, todayISO } from '../state/store';
import { GOAL_SHORT, sessionDuration } from '../data/programs';
import { getExercise } from '../data/exercises';
import { ExerciseDetail } from '../components/ExerciseDetail';
import type { Exercise } from '../data/exercises';
import { MUSCLE_LABEL } from '../lib/render';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

export function Plan() {
  const { program, profile, regenerate, history } = useStore();
  const [open, setOpen] = useState<Exercise | null>(null);
  const today = weekdayIndex();

  if (!program || !profile) return null;

  const doneDates = new Set(history.map((h) => h.date));

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Planning</div>
          <h1>Ta semaine type</h1>
          <p>
            {GOAL_SHORT[program.goal]} · niveau {program.level}/3 · {program.days} séances ·{' '}
            {profile.cardio || program.goal === 'seche' ? 'cardio inclus' : 'sans cardio'}
          </p>
        </div>
        <button className="btn btn--ghost" onClick={regenerate}>
          🔄 Régénérer
        </button>
      </div>

      <div className="weekgrid">
        {DAYS.map((d, i) => {
          const session = program.sessions.find((s) => s.weekday === i);
          const isToday = i === today;
          const done = session ? doneDates.has(todayISO()) && isToday : false;
          return (
            <button
              key={d}
              className={`daycard ${isToday ? 'daycard--today' : ''} ${!session ? 'daycard--rest' : ''}`}
              onClick={() => (session ? setOpen(getExercise(session.items[0].exerciseId)) : undefined)}
            >
              <div className="daycard__name">
                {d} {isToday ? '· aujourd’hui' : ''}
              </div>
              {session ? (
                <>
                  <div className="daycard__title">
                    {session.emoji} {session.name}
                  </div>
                  <div className="tiny muted">
                    {session.items.length} exercices · {sessionDuration(session)} min
                  </div>
                  {session.cardio ? <div className="tiny muted">🏃 {session.cardio.minutes} min de cardio</div> : null}
                  {done ? <span className="pill pill--green">Fait</span> : null}
                </>
              ) : (
                <div className="daycard__title">😴 Repos</div>
              )}
            </button>
          );
        })}
      </div>

      {program.sessions.map((s) => (
        <div className="card mt14" key={s.id}>
          <div className="row row--between">
            <div>
              <strong style={{ fontSize: 17 }}>
                {s.emoji} {s.name}
              </strong>
              <div className="small muted">{s.focus}</div>
            </div>
            <span className="pill">{DAYS[s.weekday]}</span>
          </div>
          <div className="divider" />
          <div className="grid grid--2" style={{ gap: 8 }}>
            {s.items.map((it, i) => {
              const ex = getExercise(it.exerciseId);
              return (
                <button
                  key={`${it.exerciseId}-${i}`}
                  className="exorow"
                  onClick={() => setOpen(ex)}
                  style={{ background: 'var(--surface)' }}
                >
                  <span className="pill pill--accent" style={{ minWidth: 62, textAlign: 'center' }}>
                    {it.sets} × {it.reps}
                  </span>
                  <span>
                    <span className="exorow__name">{ex.name}</span>
                    <span className="exorow__meta">
                      {ex.muscles.map((m) => MUSCLE_LABEL[m]).slice(0, 2).join(' · ')} · repos {it.rest}s
                    </span>
                  </span>
                  <span className="muted">›</span>
                </button>
              );
            })}
          </div>
          {s.cardio ? (
            <p className="small muted mt14">
              🏃 Cardio en fin de séance : {getExercise(s.cardio.exerciseId).name} — {s.cardio.minutes} min
            </p>
          ) : null}
        </div>
      ))}

      {open ? <ExerciseDetail exercise={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
