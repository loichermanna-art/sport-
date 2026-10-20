import { useMemo, useState } from 'react';
import { useStore, streakOf, personalRecords, todayISO } from '../state/store';
import { getExercise } from '../data/exercises';
import { MUSCLE_LABEL } from '../lib/render';

function lastDays(n: number): string[] {
  const out: string[] = [];
  for (let i = n - 1; i >= 0; i--) out.push(todayISO(new Date(Date.now() - i * 86400000)));
  return out;
}

export function Stats() {
  const { history, bodyweights, profile, logWeight, exportState, importState } = useStore();
  const [weightInput, setWeightInput] = useState('');

  const prs = useMemo(() => personalRecords(history), [history]);
  const streak = useMemo(() => streakOf(history), [history]);

  const week = lastDays(7);
  const byDay = week.map((d) => history.filter((h) => h.date === d).reduce((a, h) => a + h.volume, 0));
  const maxVol = Math.max(1, ...byDay);

  const totalVolume = history.reduce((a, h) => a + h.volume, 0);
  const totalTime = history.reduce((a, h) => a + h.durationSec, 0);
  const thisWeek = byDay.reduce((a, b) => a + b, 0);

  const prList = Object.entries(prs)
    .sort((a, b) => b[1].weight * 100 + b[1].reps - (a[1].weight * 100 + a[1].reps))
    .slice(0, 8);

  const lastWeight = bodyweights[bodyweights.length - 1];

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Suivi</div>
          <h1>Tes progrès</h1>
          <p>Volume, régularité, records et courbe de poids.</p>
        </div>
      </div>

      <div className="kpi">
        <div className="kpi__box">
          <div className="kpi__val">{streak}</div>
          <div className="kpi__lab">Jours d’affilée</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{history.length}</div>
          <div className="kpi__lab">Séances faites</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{(thisWeek / 1000).toFixed(1)}t</div>
          <div className="kpi__lab">Volume 7 jours</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{(totalTime / 3600).toFixed(1)}h</div>
          <div className="kpi__lab">Temps total</div>
        </div>
        <div className="kpi__box">
          <div className="kpi__val">{(totalVolume / 1000).toFixed(1)}t</div>
          <div className="kpi__lab">Volume cumulé</div>
        </div>
      </div>

      <div className="card mt14">
        <div className="row row--between">
          <strong>Volume des 7 derniers jours</strong>
          <span className="tiny muted">kg soulevés</span>
        </div>
        <div className="bars mt14">
          {byDay.map((v, i) => (
            <div className="bars__col" key={week[i]}>
              <div className="bars__bar" style={{ height: `${(v / maxVol) * 100}%` }} title={`${Math.round(v)} kg`} />
              <div className="bars__lab">{['L', 'M', 'M', 'J', 'V', 'S', 'D'][(new Date(week[i]).getDay() + 6) % 7]}</div>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid--2 mt14">
        <div className="card">
          <div className="row row--between">
            <strong>Poids du corps</strong>
            <span className="pill">{lastWeight ? `${lastWeight.kg} kg` : '—'}</span>
          </div>
          <div className="bars mt14" style={{ height: 96 }}>
            {(bodyweights.length ? bodyweights.slice(-12) : []).map((b) => {
              const min = Math.min(...bodyweights.map((x) => x.kg)) - 1;
              const max = Math.max(...bodyweights.map((x) => x.kg)) + 1;
              const h = ((b.kg - min) / Math.max(1, max - min)) * 100;
              return (
                <div className="bars__col" key={b.date} title={`${b.date} : ${b.kg} kg`}>
                  <div className="bars__bar" style={{ height: `${Math.max(6, h)}%`, background: 'var(--cyan)' }} />
                  <div className="bars__lab">{b.date.slice(5)}</div>
                </div>
              );
            })}
            {bodyweights.length === 0 ? <div className="empty small" style={{ width: '100%' }}>Note ton poids pour voir la courbe.</div> : null}
          </div>
          <div className="row mt14" style={{ gap: 8 }}>
            <input
              className="setinput"
              inputMode="decimal"
              placeholder={String(profile?.weight ?? 70)}
              value={weightInput}
              onChange={(e) => setWeightInput(e.target.value.replace(',', '.'))}
            />
            <button
              className="btn"
              onClick={() => {
                const kg = Number(weightInput);
                if (kg > 20 && kg < 400) {
                  logWeight(kg);
                  setWeightInput('');
                }
              }}
            >
              Enregistrer
            </button>
          </div>
        </div>

        <div className="card">
          <strong>Records personnels</strong>
          {prList.length === 0 ? (
            <p className="muted small mt14">Termine ta première séance pour voir tes records ici.</p>
          ) : (
            <div className="mt14" style={{ display: 'grid', gap: 7 }}>
              {prList.map(([id, pr]) => (
                <div className="row row--between" key={id}>
                  <span className="small">{getExercise(id).name}</span>
                  <span className="pill pill--accent">
                    {pr.weight > 0 ? `${String(pr.weight).replace('.', ',')} kg` : 'poids du corps'} × {pr.reps}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="card mt14">
        <strong>Historique</strong>
        {history.length === 0 ? (
          <p className="muted small mt14">Aucune séance enregistrée pour l’instant.</p>
        ) : (
          <div className="mt14" style={{ display: 'grid', gap: 7 }}>
            {[...history]
              .slice()
              .reverse()
              .slice(0, 12)
              .map((h) => (
                <div className="row row--between" key={h.id}>
                  <span className="small">
                    {new Date(h.date).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' })} · {h.sessionName}
                  </span>
                  <span className="row" style={{ gap: 8 }}>
                    <span className="tiny muted">{Math.round(h.durationSec / 60)} min</span>
                    <span className="pill">{Math.round(h.volume)} kg</span>
                  </span>
                </div>
              ))}
          </div>
        )}
      </div>

      <div className="card mt14">
        <strong>Données</strong>
        <p className="muted small mt8">
          Tes données restent sur cet appareil (stockage local du navigateur). Exporte-les pour les sauvegarder ou les transférer.
        </p>
        <div className="row mt14" style={{ gap: 8, flexWrap: 'wrap' }}>
          <button
            className="btn btn--ghost"
            onClick={() => {
              const blob = new Blob([exportState()], { type: 'application/json' });
              const url = URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = `ironpath-${todayISO()}.json`;
              a.click();
              URL.revokeObjectURL(url);
            }}
          >
            ⬇ Exporter
          </button>
          <label className="btn btn--ghost">
            ⬆ Importer
            <input
              type="file"
              accept="application/json"
              className="sr"
              onChange={async (e) => {
                const f = e.target.files?.[0];
                if (!f) return;
                const text = await f.text();
                if (importState(text)) alert('Données importées ✅');
                else alert('Fichier invalide');
              }}
            />
          </label>
        </div>
      </div>
      <p className="tiny muted mt14">
        Astuce : plus tu renseignes tes charges, plus l’app peut te proposer des records fiables et des séances adaptées.
      </p>
      <p className="tiny muted">{Object.keys(prs).length} exercices avec un record · muscles suivis : {Object.keys(MUSCLE_LABEL).length}</p>
    </div>
  );
}
