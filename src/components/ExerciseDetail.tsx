import { useState } from 'react';
import type { Exercise } from '../data/exercises';
import { EQUIPMENT_LABEL } from '../data/exercises';
import { MUSCLE_LABEL, MUSCLE_GROUP } from '../lib/render';
import { AnimatedFigure } from './Figure';

export function ExerciseDetail({ exercise, onClose, action }: { exercise: Exercise; onClose: () => void; action?: React.ReactNode }) {
  const [speed, setSpeed] = useState(1);
  const [muscles, setMuscles] = useState(true);

  return (
    <div className="modal" onClick={onClose} role="dialog" aria-modal="true" aria-label={exercise.name}>
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal__head">
          <div style={{ flex: 1 }}>
            <div className="row row--wrap" style={{ gap: 8, marginBottom: 6 }}>
              <span className="pill pill--accent">{EQUIPMENT_LABEL[exercise.equip]}</span>
              <span className="pill">Niveau {exercise.level}/3</span>
              {exercise.unilateral ? <span className="pill">Unilatéral</span> : null}
            </div>
            <h3>{exercise.name}</h3>
            {exercise.aka ? <p className="muted small">{exercise.aka}</p> : null}
          </div>
          <button className="iconbtn" onClick={onClose} aria-label="Fermer">
            ✕
          </button>
        </div>

        <div className="exo">
          <div>
            <AnimatedFigure exercise={exercise} speed={speed} showMuscles={muscles} />
            <div className="row row--between mt8">
              <div className="chiprow">
                <button className={`chip chip--sm ${speed === 0.5 ? 'chip--on' : ''}`} onClick={() => setSpeed(0.5)}>
                  0,5×
                </button>
                <button className={`chip chip--sm ${speed === 1 ? 'chip--on' : ''}`} onClick={() => setSpeed(1)}>
                  1×
                </button>
                <button className={`chip chip--sm ${speed === 1.75 ? 'chip--on' : ''}`} onClick={() => setSpeed(1.75)}>
                  1,75×
                </button>
              </div>
              <button className={`chip chip--sm ${muscles ? 'chip--on' : ''}`} onClick={() => setMuscles((m) => !m)}>
                🔥 Muscles
              </button>
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
                Groupes : {[...new Set([...exercise.muscles, ...(exercise.secondary ?? [])].map((m) => MUSCLE_GROUP[m]))].join(' · ')}
              </p>
            </div>

            <div className="sec">
              <h4>Charge conseillée</h4>
              <p className="small">{exercise.load}</p>
            </div>
          </div>

          <div>
            <div className="sec" style={{ marginTop: 0 }}>
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

            {action ? <div className="mt14">{action}</div> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
