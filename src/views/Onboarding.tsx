import { useState } from 'react';
import type { Goal, Level, Profile, Program } from '../data/types';
import { GOAL_LABEL, LEVEL_LABEL, sessionDuration, buildProgram } from '../data/programs';
import { todayISO, findSessionForToday } from '../state/store';
import { AnimatedFigure } from '../components/Figure';
import { getExercise } from '../data/exercises';

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
  const hero = getExercise(goal === 'force' ? 'souleve-de-terre' : goal === 'masse' ? 'dev-couche' : 'squat-barre');

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
        <div className="brand" style={{ justifyContent: 'center', marginBottom: 14 }}>
          <div className="brand__mark">🏋️</div>
          <div style={{ textAlign: 'left' }}>
            <div className="brand__name">IronPath</div>
            <div className="brand__sub">Musculation guidée</div>
          </div>
        </div>
        <h1>Ton programme de musculation, animé et expliqué</h1>
        <p>
          Choisis un objectif : l’app génère tes séances, t’indique <strong>quoi faire aujourd’hui</strong>, et te montre{' '}
          <strong>en animation comment exécuter chaque exercice</strong>.
        </p>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <AnimatedFigure exercise={hero} showControls={false} />
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
                  <div className="opt__title">
                    {g === 'seche' ? '🔥' : g === 'masse' ? '💪' : '⚙️'} {GOAL_LABEL[g].split(' — ')[0]}
                  </div>
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
            <div className="optgrid" style={{ marginBottom: 16 }}>
              {([1, 2, 3] as Level[]).map((l) => (
                <button key={l} className={`opt ${level === l ? 'opt--on' : ''}`} onClick={() => setLevel(l)}>
                  <div className="opt__title">{LEVEL_LABEL[l].split(' — ')[0]}</div>
                  <div className="opt__desc">{LEVEL_LABEL[l].split(' — ')[1]}</div>
                </button>
              ))}
            </div>
            <h4 className="tiny" style={{ textTransform: 'uppercase', letterSpacing: '0.13em', color: 'var(--muted-2)', marginBottom: 8 }}>
              Séances par semaine
            </h4>
            <div className="chiprow">
              {[3, 4, 5, 6].map((d) => (
                <button key={d} className={`chip ${days === d ? 'chip--on' : ''}`} onClick={() => setDays(d)}>
                  {d} jours
                </button>
              ))}
            </div>
            <p className="tiny muted mt14">
              {days <= 3 ? 'Full body' : days === 4 ? 'Upper / Lower' : days === 5 ? 'Push · Pull · Legs · Upper · Lower' : 'Push / Pull / Legs × 2'} —{' '}
              {preview.sessions.map((s) => `${s.emoji} ${sessionDuration(s)} min`).join(' · ')}
              {preview.sessions.length ? (
                <>
                  <br />
                  Aujourd'hui :{' '}
                  <b>
                    {preview.sessions[findSessionForToday(preview).index].emoji}{' '}
                    {preview.sessions[findSessionForToday(preview).index].name}
                  </b>
                </>
              ) : null}
            </p>
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
                <input id="ob-weight" inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value.replace(',', '.'))} />
              </div>
              <div className="field">
                <label htmlFor="ob-age">Âge</label>
                <input id="ob-age" inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
              </div>
              <div className="field">
                <label>Sexe (pour l’estimation calorique)</label>
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
              <span>
                <strong>Ajouter du cardio</strong>
                <div className="tiny muted">Recommandé en sèche : 20-25 min après chaque séance</div>
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
              Générer mon programme 🚀
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
