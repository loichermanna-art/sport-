import { useState } from 'react';
import type { Goal, Level, Profile, Program } from '../data/types';
import { GOAL_LABEL, LEVEL_LABEL, sessionDuration, buildProgram } from '../data/programs';
import { todayISO, findSessionForToday } from '../state/store';
import { Icon } from '../components/Icon';

const STEPS = ['Objectif', 'Niveau', 'Toi'];

export function Onboarding({ onDone, initial }: { onDone: (p: Profile) => void; initial?: Profile | null }) {
  const [step, setStep] = useState(0);
  const [goal, setGoal] = useState<Goal>(initial?.goal ?? 'seche');
  const [level, setLevel] = useState<Level>(initial?.level ?? 1);
  const [days, setDays] = useState(initial?.days ?? 4);
  const [name, setName] = useState(initial?.name ?? '');
  const [weight, setWeight] = useState(String(initial?.weight ?? 70));
  const [age, setAge] = useState(String(initial?.age ?? 25));
  const [sex, setSex] = useState<Profile['sex']>(initial?.sex ?? 'x');
  const [cardio, setCardio] = useState(initial?.cardio ?? true);

  const preview: Program = buildProgram({
    name,
    goal,
    level,
    days,
    weight: Number(weight) || 70,
    age: Number(age) || 25,
    sex,
    startDate: todayISO(),
    cardio,
  });
  const todaySession = findSessionForToday(preview).session;

  function finish() {
    onDone({
      name: name.trim() || 'Athlète',
      goal,
      level,
      days,
      weight: Number(weight) || 70,
      age: Number(age) || 25,
      sex,
      startDate: initial?.startDate ?? todayISO(),
      cardio,
    });
  }

  return (
    <div className="onboard">
      <div className="onboard__hero">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="library" size={18} />
          </span>
          <span>
            <span className="brand__name">GYM OS</span>
            <span className="brand__sub">Musculation guidée</span>
          </span>
        </div>
        <h1>Ton programme de musculation, expliqué mouvement par mouvement</h1>
        <p>
          Choisis un objectif : l’application génère tes séances, t’indique{' '}
          <strong>quoi faire aujourd’hui</strong>, et te montre{' '}
          <strong>en animation comment exécuter chaque exercice</strong>.
        </p>
      </div>

      <div className="row row--between" style={{ marginBottom: 12 }}>
        <div className="chiprow">
          {STEPS.map((s, i) => (
            <span key={s} className={`chip ${i === step ? 'chip--on' : ''}`}>
              {i + 1}. {s}
            </span>
          ))}
        </div>
        <span className="tiny muted">Étape {step + 1}/3</span>
      </div>

      <div className="card">
        {step === 0 ? (
          <>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Quel est ton objectif ?</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>
              Il détermine le nombre de répétitions, les temps de repos et la place du cardio.
            </p>
            <div className="optgrid">
              {(['seche', 'masse', 'force'] as Goal[]).map((g) => (
                <button key={g} className={`opt ${goal === g ? 'opt--on' : ''}`} onClick={() => setGoal(g)}>
                  <div className="opt__title">{GOAL_LABEL[g].split(' — ')[0]}</div>
                  <div className="opt__desc">{GOAL_LABEL[g].split(' — ')[1]}</div>
                </button>
              ))}
            </div>
          </>
        ) : null}

        {step === 1 ? (
          <>
            <h2 style={{ fontSize: 19, marginBottom: 4 }}>Ton niveau et ta fréquence</h2>
            <p className="muted small" style={{ marginBottom: 14 }}>
              Le niveau ajuste le volume et le choix des exercices (machines et haltères pour débuter).
            </p>
            <div className="optgrid" style={{ marginBottom: 18 }}>
              {([1, 2, 3] as Level[]).map((l) => (
                <button key={l} className={`opt ${level === l ? 'opt--on' : ''}`} onClick={() => setLevel(l)}>
                  <div className="opt__title">{LEVEL_LABEL[l].split(' — ')[0]}</div>
                  <div className="opt__desc">{LEVEL_LABEL[l].split(' — ')[1]}</div>
                </button>
              ))}
            </div>

            <h4 className="sec-label">Séances par semaine</h4>
            <div className="chiprow">
              {[3, 4, 5, 6].map((d) => (
                <button key={d} className={`chip ${days === d ? 'chip--on' : ''}`} onClick={() => setDays(d)}>
                  {d} jours
                </button>
              ))}
            </div>

            <div className="card mt14" style={{ background: 'var(--surface-2)', boxShadow: 'none' }}>
              <div className="tiny muted-2" style={{ marginBottom: 4 }}>
                Ce que ça donne
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, marginBottom: 2 }}>
                {days <= 3
                  ? 'Full body'
                  : days === 4
                    ? 'Haut / Bas'
                    : days === 5
                      ? 'Poussée · Tirage · Jambes · Haut · Bas'
                      : 'Poussée / Tirage / Jambes × 2'}
              </div>
              <div className="tiny muted">
                {preview.sessions.map((s) => `${s.name} (${sessionDuration(s)} min)`).join(' · ')}
              </div>
              {todaySession ? (
                <div className="tiny muted mt8">
                  Prochaine séance : <strong>{todaySession.name}</strong>
                </div>
              ) : null}
            </div>
          </>
        ) : null}

        {step === 2 ? (
          <>
            <h2 style={{ fontSize: 19, marginBottom: 14 }}>Pour personnaliser les charges</h2>
            <div className="grid grid--2">
              <div className="field">
                <label htmlFor="ob-name">Prénom</label>
                <input id="ob-name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Athlète" />
              </div>
              <div className="field">
                <label htmlFor="ob-weight">Poids (kg)</label>
                <input
                  id="ob-weight"
                  inputMode="decimal"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value.replace(',', '.'))}
                />
              </div>
              <div className="field">
                <label htmlFor="ob-age">Âge</label>
                <input id="ob-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="field">
                <label>Sexe</label>
                <div className="chiprow">
                  {(
                    [
                      ['f', 'Femme'],
                      ['h', 'Homme'],
                      ['x', 'Non précisé'],
                    ] as [Profile['sex'], string][]
                  ).map(([v, lab]) => (
                    <button key={v} className={`chip ${sex === v ? 'chip--on' : ''}`} onClick={() => setSex(v)}>
                      {lab}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <label className="switch mt14">
              <input type="checkbox" checked={cardio} onChange={(e) => setCardio(e.target.checked)} />
              <span className="switch__text">
                <strong>Ajouter du cardio</strong>
                <span className="tiny muted">Recommandé en sèche : 20-25 min après chaque séance</span>
              </span>
            </label>
          </>
        ) : null}

        <div className="row row--between mt20">
          <button className="btn btn--ghost" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Retour
          </button>
          {step < 2 ? (
            <button className="btn btn--primary" onClick={() => setStep((s) => s + 1)}>
              Continuer
            </button>
          ) : (
            <button className="btn btn--primary" onClick={finish}>
              <Icon name="arrowRight" size={17} />
              Générer mon programme
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
