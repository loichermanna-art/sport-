import { useState } from 'react';
import type { Exercise } from '../data/exercises';
import { EQUIPMENT_LABEL } from '../data/exercises';
import { MUSCLE_LABEL, MUSCLE_GROUP } from '../lib/render';
import { AnimatedFigure } from './Figure';
import { Icon } from './Icon';
import { Sheet } from './Sheet';

const SPEEDS = [
  { v: 0.5, label: '0,5×' },
  { v: 1, label: '1×' },
  { v: 1.75, label: '1,75×' },
];

export function ExerciseDetail({
  exercise,
  onClose,
  action,
}: {
  exercise: Exercise;
  onClose: () => void;
  action?: React.ReactNode;
}) {
  const [speed, setSpeed] = useState(1);

  return (
    <Sheet open title={exercise.name} onClose={onClose} footer={action}>
      <div className="row row--wrap" style={{ gap: 6, marginBottom: 14 }}>
        <span className="pill pill--accent">{EQUIPMENT_LABEL[exercise.equip]}</span>
        <span className="pill">Niveau {exercise.level}/3</span>
        {exercise.unilateral ? <span className="pill">Unilatéral</span> : null}
      </div>

      {exercise.aka ? <p className="muted small" style={{ marginBottom: 14 }}>{exercise.aka}</p> : null}

      {/* Le lecteur de démonstration n'existe que dans cette fiche. */}
      <AnimatedFigure exercise={exercise} speed={speed} />

      <div className="row row--between mt14">
        <div className="chiprow" role="group" aria-label="Vitesse de lecture">
          {SPEEDS.map((s) => (
            <button
              key={s.v}
              className={`chip chip--sm ${speed === s.v ? 'chip--on' : ''}`}
              onClick={() => setSpeed(s.v)}
              aria-pressed={speed === s.v}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sec">
        <h4>Muscles sollicités</h4>
        <div className="musclelist">
          {exercise.muscles.map((m) => (
            <span key={m} className="muscle">
              {MUSCLE_LABEL[m]}
            </span>
          ))}
          {(exercise.secondary ?? []).map((m) => (
            <span key={m} className="muscle muscle--sec">
              {MUSCLE_LABEL[m]}
            </span>
          ))}
        </div>
        <p className="tiny muted mt8">
          Groupes :{' '}
          {[...new Set([...exercise.muscles, ...(exercise.secondary ?? [])].map((m) => MUSCLE_GROUP[m]))].join(' · ')}
        </p>
      </div>

      <div className="sec">
        <h4>Charge conseillée</h4>
        <p className="small">{exercise.load}</p>
      </div>

      <div className="sec">
        <h4>Comment faire</h4>
        <ol className="steps">
          {exercise.steps.map((s, i) => (
            <li key={i}>{s}</li>
          ))}
        </ol>
      </div>

      <div className="sec">
        <h4>Points clés</h4>
        <ul className="bullets">
          {exercise.cues.map((c, i) => (
            <li key={i}>{c}</li>
          ))}
        </ul>
      </div>

      <div className="sec">
        <h4>Erreurs fréquentes</h4>
        <ul className="bullets bullets--warn">
          {exercise.mistakes.map((m, i) => (
            <li key={i}>{m}</li>
          ))}
        </ul>
      </div>

      <div className="sec">
        <h4>Respiration</h4>
        <p className="small">{exercise.breathing}</p>
      </div>

      {!action ? (
        <button className="btn btn--primary btn--block mt20" onClick={onClose}>
          <Icon name="check" size={17} />
          J’ai compris
        </button>
      ) : null}
    </Sheet>
  );
}
