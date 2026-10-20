import { useMemo, useState } from 'react';
import { EXERCISES, EQUIPMENT_LABEL, type Equipment, type Exercise } from '../data/exercises';
import { MUSCLE_GROUP, MUSCLE_LABEL, type MuscleId } from '../lib/render';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { FigureThumb } from '../components/Figure';

const GROUPS = ['Tous', 'Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Abdos', 'Cardio'];
const EQUIPS: (Equipment | 'all')[] = ['all', 'machine', 'dumbbell', 'barbell', 'cable', 'bodyweight', 'kettlebell', 'cardio'];

function groupOf(e: Exercise): string {
  if (e.equip === 'cardio') return 'Cardio';
  return MUSCLE_GROUP[e.muscles[0]];
}

export function Library() {
  const [group, setGroup] = useState('Tous');
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  const [q, setQ] = useState('');
  const [open, setOpen] = useState<Exercise | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const list = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      if (group !== 'Tous' && groupOf(e) !== group) return false;
      if (equip !== 'all' && e.equip !== equip) return false;
      if (!needle) return true;
      return (
        e.name.toLowerCase().includes(needle) ||
        (e.aka ?? '').toLowerCase().includes(needle) ||
        e.muscles.some((m) => MUSCLE_LABEL[m as MuscleId].toLowerCase().includes(needle))
      );
    });
  }, [group, equip, q]);

  return (
    <div>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Bibliothèque</div>
          <h1>{EXERCISES.length} exercices expliqués</h1>
          <p>Animation du mouvement, muscles sollicités, consignes et erreurs à éviter.</p>
        </div>
        <input
          className="setinput"
          style={{ minWidth: 200, textAlign: 'left' }}
          placeholder="🔍 Rechercher…"
          value={q}
          onChange={(e) => setQ(e.target.value)}
        />
      </div>

      <div className="row row--wrap" style={{ gap: 8, marginBottom: 8 }}>
        {GROUPS.map((g) => (
          <button key={g} className={`chip ${group === g ? 'chip--on' : ''}`} onClick={() => setGroup(g)}>
            {g}
          </button>
        ))}
      </div>
      <div className="row row--wrap" style={{ gap: 8, marginBottom: 16 }}>
        {EQUIPS.map((e) => (
          <button key={e} className={`chip chip--sm ${equip === e ? 'chip--on' : ''}`} onClick={() => setEquip(e)}>
            {e === 'all' ? 'Tout l’équipement' : EQUIPMENT_LABEL[e]}
          </button>
        ))}
      </div>

      {list.length === 0 ? (
        <div className="card empty">Aucun exercice ne correspond à cette recherche.</div>
      ) : (
        <div className="grid grid--3">
          {list.map((e) => (
            <button
              key={e.id}
              className="card"
              style={{ padding: 0, overflow: 'hidden', textAlign: 'left' }}
              onClick={() => setOpen(e)}
              onMouseEnter={() => setHover(e.id)}
              onMouseLeave={() => setHover(null)}
            >
              <div style={{ height: 150, background: 'var(--bg-2)', borderBottom: '1px solid var(--border)' }}>
                <FigureThumb exercise={e} active={hover === e.id} />
              </div>
              <div style={{ padding: '11px 13px 13px' }}>
                <div className="row row--between">
                  <strong style={{ fontSize: 14.5 }}>{e.name}</strong>
                  <span className="pill">{EQUIPMENT_LABEL[e.equip]}</span>
                </div>
                <div className="tiny muted mt8">
                  {e.muscles.map((m) => MUSCLE_LABEL[m]).join(' · ')}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {open ? <ExerciseDetail exercise={open} onClose={() => setOpen(null)} /> : null}
    </div>
  );
}
