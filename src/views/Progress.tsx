import { useMemo, useState } from 'react';
import { useStore, streakOf, personalRecords, todayISO } from '../state/store';
import { getExercise } from '../data/exercises';
import { formatDate, formatDuration, formatVolume, toDisplay, unitLabel } from '../lib/units';
import { Icon } from '../components/Icon';

type Period = 7 | 30 | 90 | 0;
const PERIODS: { id: Period; label: string }[] = [
  { id: 7, label: '7 jours' },
  { id: 30, label: '30 jours' },
  { id: 90, label: '90 jours' },
  { id: 0, label: 'Tout' },
];

const W = 600;
const H = 150;

export function Progress() {
  const { history, bodyweights, settings, logWeight } = useStore();
  const [period, setPeriod] = useState<Period>(30);
  const [weight, setWeight] = useState('');

  const data = useMemo(() => {
    const from = period === 0 ? '0000-01-01' : todayISO(new Date(Date.now() - (period - 1) * 86400000));
    const sessions = history.filter((h) => h.date >= from);
    const volume = sessions.reduce((a, h) => a + h.volume, 0);
    const days = new Set(sessions.map((h) => h.date)).size;
    const time = sessions.reduce((a, h) => a + h.durationSec, 0);

    // Volume par jour, pour graphique
    const byDay = new Map<string, number>();
    for (const h of sessions) byDay.set(h.date, (byDay.get(h.date) ?? 0) + h.volume);
    const series = Array.from(byDay.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30);

    const weights = bodyweights.filter((b) => b.date >= (period === 0 ? '0000-01-01' : from)).slice(-30);
    return { sessions, volume, days, time, series, weights };
  }, [history, bodyweights, period]);

  const prs = useMemo(() => personalRecords(history), [history]);
  const prList = useMemo(
    () =>
      Object.entries(prs)
        .sort((a, b) => (b[1].weight * 100 + b[1].reps) - (a[1].weight * 100 + a[1].reps))
        .slice(0, 8),
    [prs],
  );

  const maxVol = Math.max(1, ...data.series.map(([, v]) => v));

  /* Courbe de poids */
  const wVals = data.weights.map((w) => w.kg);
  const wMin = wVals.length ? Math.min(...wVals) : 0;
  const wMax = wVals.length ? Math.max(...wVals) : 1;
  const wSpan = Math.max(1, wMax - wMin);
  const points = data.weights
    .map((w, i) => {
      const x = data.weights.length === 1 ? W / 2 : (i / (data.weights.length - 1)) * W;
      const y = H - 10 - ((w.kg - wMin) / wSpan) * (H - 24);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  return (
    <div className="container">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Suivi</div>
          <h1>Historique et progression</h1>
          <p>Tes séances, tes charges et tes records — uniquement des données réellement enregistrées.</p>
        </div>
        <div className="chiprow" role="group" aria-label="Période affichée">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              className={`chip ${period === p.id ? 'chip--on' : ''}`}
              onClick={() => setPeriod(p.id)}
              aria-pressed={period === p.id}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="kpi" style={{ marginBottom: 14 }}>
        <div className="kpi__box">
          <div className="kpi__val">{data.sessions.length}</div>
          <div className="kpi__lab">Séances sur la période</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{data.volume > 0 ? formatVolume(data.volume, settings.units) : '—'}</div>
          <div className="kpi__lab">Volume total</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{streakOf(history)}</div>
          <div className="kpi__lab">Jours d’affilée</div>
        </div>
      </div>

      {/* Volume : barres fines, axe et unité explicites */}
      <div className="card">
        <div className="chart__head">
          <span className="card__title">Volume par séance</span>
          <span className="chart__unit">en {unitLabel(settings.units)}</span>
        </div>
        {data.series.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Aucun volume enregistré</div>
            <p className="empty__text">
              Termine une séance avec des charges renseignées : le volume apparaîtra ici, jour par jour.
            </p>
          </div>
        ) : (
          <>
            <div className="bars__y">
              <span>{Math.round(toDisplay(maxVol, settings.units))}</span>
              <span>0</span>
            </div>
            <div className="bars">
              {data.series.map(([date, v]) => (
                <div className="bars__col" key={date} title={`${formatDate(date)} : ${Math.round(v)} ${unitLabel(settings.units)}`}>
                  <div className="bars__bar" style={{ height: `${Math.max(2, (v / maxVol) * 100)}%` }} />
                  <div className="bars__lab">{formatDate(date)}</div>
                </div>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Poids du corps */}
      <div className="card">
        <div className="chart__head">
          <span className="card__title">Poids du corps</span>
          <span className="chart__unit">en {unitLabel(settings.units)}</span>
        </div>
        {data.weights.length < 2 ? (
          <div className="empty">
            <div className="empty__title">Pas encore assez de points</div>
            <p className="empty__text">
              Enregistre ton poids à plusieurs reprises pour voir apparaître la courbe. Une seule mesure ne fait pas une
              tendance.
            </p>
          </div>
        ) : (
          <>
            <svg className="linechart" viewBox={`0 0 ${W} ${H}`} role="img" aria-label="Évolution du poids du corps">
              <line x1="0" y1={H - 10} x2={W} y2={H - 10} stroke="var(--border)" strokeWidth="1" />
              <polyline
                points={points}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                vectorEffect="non-scaling-stroke"
              />
              {data.weights.map((w, i) => {
                const x = data.weights.length === 1 ? W / 2 : (i / (data.weights.length - 1)) * W;
                const y = H - 10 - ((w.kg - wMin) / wSpan) * (H - 24);
                return <circle key={w.date} cx={x} cy={y} r="2" fill="var(--accent)" />;
              })}
            </svg>
            <div className="row row--between tiny muted-2">
              <span>{formatDate(data.weights[0].date)}</span>
              <span>
                {Math.round(toDisplay(wMin, settings.units))} – {Math.round(toDisplay(wMax, settings.units))}{' '}
                {unitLabel(settings.units)}
              </span>
              <span>{formatDate(data.weights[data.weights.length - 1].date)}</span>
            </div>
          </>
        )}

        <form
          className="row mt14"
          style={{ gap: 8 }}
          onSubmit={(e) => {
            e.preventDefault();
            const kg = Number(weight.replace(',', '.'));
            if (kg > 0) {
              logWeight(kg);
              setWeight('');
            }
          }}
        >
          <div className="field" style={{ flex: '0 1 160px' }}>
            <label htmlFor="bw">Poids du jour ({unitLabel(settings.units)})</label>
            <input
              id="bw"
              inputMode="decimal"
              value={weight}
              placeholder="70"
              onChange={(e) => setWeight(e.target.value.replace(',', '.'))}
            />
          </div>
          <button className="btn" type="submit" style={{ alignSelf: 'flex-end' }} disabled={!weight}>
            Enregistrer
          </button>
        </form>
      </div>

      {/* Records */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Records personnels</span>
        </div>
        {prList.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Aucun record pour l’instant</div>
            <p className="empty__text">
              Les records se calculent à partir des séries que tu as validées en séance. Rien n’est estimé.
            </p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Exercice</th>
                <th style={{ textAlign: 'right' }}>Charge</th>
                <th style={{ textAlign: 'right' }}>Répétitions</th>
                <th style={{ textAlign: 'right' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {prList.map(([id, pr]) => (
                <tr key={id}>
                  <td style={{ fontWeight: 550 }}>{getExercise(id).name}</td>
                  <td className="tbl__num">
                    {pr.weight > 0
                      ? `${Math.round(toDisplay(pr.weight, settings.units) * 10) / 10} ${unitLabel(settings.units)}`
                      : 'poids du corps'}
                  </td>
                  <td className="tbl__num">{pr.reps}</td>
                  <td className="tbl__num muted">{formatDate(pr.date)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Historique */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Séances passées</span>
          <span className="tiny muted-2">{data.sessions.length} sur la période</span>
        </div>
        {data.sessions.length === 0 ? (
          <div className="empty">
            <div className="empty__title">Aucune séance enregistrée</div>
            <p className="empty__text">
              Chaque séance terminée apparaîtra ici avec sa durée, son volume et les exercices réalisés.
            </p>
          </div>
        ) : (
          <table className="tbl">
            <thead>
              <tr>
                <th>Date</th>
                <th>Séance</th>
                <th style={{ textAlign: 'right' }}>Durée</th>
                <th style={{ textAlign: 'right' }}>Volume</th>
              </tr>
            </thead>
            <tbody>
              {[...data.sessions].reverse().map((h) => (
                <tr key={h.id}>
                  <td className="muted">{formatDate(h.date)}</td>
                  <td>
                    <div style={{ fontWeight: 550 }}>{h.sessionName}</div>
                    <div className="tiny muted-2">
                      {h.exercises.map((e) => getExercise(e.exerciseId).name).join(', ')}
                    </div>
                  </td>
                  <td className="tbl__num">{formatDuration(h.durationSec)}</td>
                  <td className="tbl__num">{formatVolume(h.volume, settings.units)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {history.length === 0 ? (
        <p className="tiny muted-2 mt14 row" style={{ gap: 6 }}>
          <Icon name="alert" size={14} />
          Aucune donnée d’exemple n’est affichée : tous les chiffres ci-dessus proviennent de tes séances réelles.
        </p>
      ) : null}
    </div>
  );
}
