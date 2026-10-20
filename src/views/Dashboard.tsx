import { useMemo } from 'react';
import { useStore, findSessionForToday, streakOf, todayISO, weekdayIndex } from '../state/store';
import { getExercise } from '../data/exercises';
import { sessionDuration, GOAL_SHORT } from '../data/programs';
import { MUSCLE_LABEL } from '../lib/render';
import { Icon } from '../components/Icon';
import { formatDate, formatDuration, formatVolume } from '../lib/units';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

function isoDaysAgo(n: number): string {
  return todayISO(new Date(Date.now() - n * 86400000));
}

export function Dashboard({ onStart }: { onStart: () => void }) {
  const { profile, currentProgram, history, active, settings } = useStore();
  const { session } = findSessionForToday(currentProgram);

  const stats = useMemo(() => {
    const from = isoDaysAgo(6);
    const prevFrom = isoDaysAgo(13);
    const inRange = (d: string, a: string, b: string) => d >= a && d <= b;
    const week = history.filter((h) => inRange(h.date, from, todayISO()));
    const prev = history.filter((h) => inRange(h.date, prevFrom, isoDaysAgo(7)));
    const sum = (xs: typeof history) => xs.reduce((a, h) => a + h.volume, 0);
    const weekVolume = sum(week);
    const prevVolume = sum(prev);
    const targets = currentProgram?.days ?? 0;
    return {
      weekSessions: week.length,
      weekVolume,
      prevVolume,
      targets,
      progression: prevVolume > 0 ? Math.round(((weekVolume - prevVolume) / prevVolume) * 100) : null,
      recent: [...history].reverse().slice(0, 3),
    };
  }, [history, currentProgram]);

  if (!profile || !currentProgram) return null;

  const today = weekdayIndex();
  const isRestDay = !currentProgram.sessions.some((s) => s.weekday === today);
  const doneToday = history.some((h) => h.date === todayISO());
  const totalSets = session?.items.reduce((a, it) => a + it.sets, 0) ?? 0;
  const streak = streakOf(history);

  return (
    <div className="container">
      <div className="pagehead">
        <div>
          <div className="eyebrow">{DAYS[today]} · {GOAL_SHORT[currentProgram.goal]}</div>
          <h1>Bonjour {profile.name}</h1>
          <p>
            {active
              ? 'Une séance est en cours — reprends où tu en étais.'
              : doneToday
                ? 'Séance du jour terminée. Prochaine étape : récupérer.'
                : isRestDay
                  ? 'Jour de repos : la récupération fait partie du progrès.'
                  : 'Voici ta séance du jour.'}
          </p>
        </div>
      </div>

      {/* Prochaine séance */}
      <div className="card" style={{ marginBottom: 14 }}>
        <div className="card__head">
          <span className="card__title">{isRestDay ? 'Jour de repos' : 'Séance du jour'}</span>
          {!isRestDay && session ? (
            <span className="pill">
              {session.items.length} exercices · {sessionDuration(session)} min
            </span>
          ) : null}
        </div>

        {session ? (
          <>
            <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 4 }}>{session.name}</div>
            <p className="muted small">{session.focus}</p>

            <div className="musclelist mt14">
              {session.items.slice(0, 4).map((it, i) => (
                <span className="pill" key={`${it.exerciseId}-${i}`}>
                  {getExercise(it.exerciseId).name}
                </span>
              ))}
              {session.items.length > 4 ? (
                <span className="pill">+{session.items.length - 4}</span>
              ) : null}
            </div>

            <button className="btn btn--primary btn--block btn--lg mt14" onClick={onStart} disabled={!!active}>
              <Icon name="play" size={18} />
              {active ? 'Séance en cours' : doneToday ? 'Refaire la séance' : 'Démarrer la séance'}
            </button>
            {isRestDay ? (
              <p className="tiny muted-2 mt8" style={{ textAlign: 'center' }}>
                Repos planifié aujourd’hui — tu peux tout de même faire cette séance.
              </p>
            ) : null}
          </>
        ) : (
          <div className="empty">
            <div className="empty__title">Aucune séance planifiée</div>
            <p className="empty__text">
              Crée un programme depuis l’onglet Programmes pour voir apparaître ta séance du jour ici.
            </p>
          </div>
        )}
      </div>

      {/* Indicateurs : quatre maximum, jamais plus */}
      <div className="kpi" style={{ marginBottom: 14 }}>
        <div className="kpi__box">
          <div className="kpi__val">
            {stats.weekSessions}
            <span style={{ fontSize: 15, color: 'var(--muted-2)', fontWeight: 500 }}> / {stats.targets}</span>
          </div>
          <div className="kpi__lab">Séances cette semaine</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{stats.weekVolume > 0 ? formatVolume(stats.weekVolume, settings.units) : '—'}</div>
          <div className="kpi__lab">Volume sur 7 jours</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{streak}</div>
          <div className="kpi__lab">Jours d’affilée</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">
            {stats.progression === null ? '—' : `${stats.progression > 0 ? '+' : ''}${stats.progression} %`}
          </div>
          <div className="kpi__lab">Volume vs 7 jours précédents</div>
        </div>
      </div>

      <div className="grid grid--2">
        {/* Derniers entraînements */}
        <div className="card">
          <div className="card__head">
            <span className="card__title">Derniers entraînements</span>
          </div>
          {stats.recent.length === 0 ? (
            <div className="empty">
              <div className="empty__title">Aucune séance enregistrée</div>
              <p className="empty__text">
                Tes séances terminées apparaîtront ici avec leur date, leur durée et leur volume.
              </p>
            </div>
          ) : (
            <table className="tbl">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Séance</th>
                  <th style={{ textAlign: 'right' }}>Volume</th>
                </tr>
              </thead>
              <tbody>
                {stats.recent.map((h) => (
                  <tr key={h.id}>
                    <td className="muted">{formatDate(h.date)}</td>
                    <td>
                      <div style={{ fontWeight: 550 }}>{h.sessionName}</div>
                      <div className="tiny muted-2">{formatDuration(h.durationSec)}</div>
                    </td>
                    <td className="tbl__num">{formatVolume(h.volume, settings.units)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Programme actif */}
        <div className="card">
          <div className="card__head">
            <span className="card__title">Programme actif</span>
            <span className={`pill ${currentProgram.status === 'active' ? 'pill--green' : 'pill--warn'}`}>
              {currentProgram.status === 'active' ? 'Actif' : currentProgram.status === 'paused' ? 'En pause' : 'Archivé'}
            </span>
          </div>
          <div style={{ fontSize: 16, fontWeight: 600 }}>{currentProgram.name}</div>
          <p className="muted small">
            {GOAL_SHORT[currentProgram.goal]} · niveau {currentProgram.level}/3 · {currentProgram.days} séances par
            semaine
          </p>
          <div className="divider" />
          <div className="chiprow">
            {currentProgram.sessions.map((s) => (
              <span className={`chip ${s.weekday === today ? 'chip--on' : ''}`} key={s.id}>
                {DAYS[s.weekday].slice(0, 3)} · {s.name}
              </span>
            ))}
          </div>
          <p className="tiny muted-2 mt14">
            {totalSets} séries prévues pour la séance du jour. Les muscles travaillés :{' '}
            {session
              ? Array.from(new Set(session.items.flatMap((it) => getExercise(it.exerciseId).muscles.slice(0, 1))))
                  .map((m) => MUSCLE_LABEL[m])
                  .join(', ')
              : '—'}
            .
          </p>
        </div>
      </div>
    </div>
  );
}
