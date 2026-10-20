import { useMemo, useState } from 'react';
import { EXERCISES, EQUIPMENT_LABEL } from '../data/exercises';
import { MUSCLE_LABEL, MUSCLE_GROUP } from '../lib/render';
import type { Equipment, Exercise } from '../data/exercises';

/** Regroupement lisible dérivé du muscle principal de l'exercice. */
function groupOf(e: Exercise): string {
  return MUSCLE_GROUP[e.muscles[0]] ?? 'Autre';
}
import { FigureThumb } from '../components/Figure';
import { ExerciseDetail } from '../components/ExerciseDetail';
import { Icon } from '../components/Icon';

const GROUPS = ['Jambes', 'Pectoraux', 'Dos', 'Épaules', 'Bras', 'Abdominaux', 'Cardio'] as const;

export function Library() {
  const [query, setQuery] = useState('');
  const [group, setGroup] = useState<string>('Tous');
  const [equip, setEquip] = useState<Equipment | 'all'>('all');
  const [detail, setDetail] = useState<Exercise | null>(null);
  const [hover, setHover] = useState<string | null>(null);

  const equipment = useMemo(() => {
    const set = new Set<Equipment>();
    for (const e of EXERCISES) set.add(e.equip);
    return Array.from(set).sort((a, b) => EQUIPMENT_LABEL[a].localeCompare(EQUIPMENT_LABEL[b], 'fr'));
  }, []);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return EXERCISES.filter((e) => {
      // « Cardio » n'est pas un groupe musculaire : on filtre sur le matériel.
      if (group === 'Cardio' ? e.equip !== 'cardio' : group !== 'Tous' && groupOf(e) !== group) return false;
      if (equip !== 'all' && e.equip !== equip) return false;
      if (!q) return true;
      return (
        e.name.toLowerCase().includes(q) ||
        (e.aka ?? '').toLowerCase().includes(q) ||
        e.muscles.some((m) => MUSCLE_LABEL[m].toLowerCase().includes(q))
      );
    });
  }, [query, group, equip]);

  return (
    <div className="container">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Bibliothèque</div>
          <h1>Exercices</h1>
          <p>{EXERCISES.length} exercices avec démonstration animée.</p>
        </div>
      </div>

      <div className="card" style={{ marginBottom: 14 }}>
        <div className="row row--wrap" style={{ gap: 10 }}>
          <div className="search">
            <span className="search__ico">
              <Icon name="search" size={17} />
            </span>
            <input
              className="input"
              type="search"
              value={query}
              placeholder="Rechercher un exercice ou un muscle"
              aria-label="Rechercher un exercice"
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>
        </div>

        <div className="divider" />

        <div className="chiprow" role="group" aria-label="Filtrer par groupe musculaire">
          {['Tous', ...GROUPS].map((g) => (
            <button
              key={g}
              className={`chip ${group === g ? 'chip--on' : ''}`}
              onClick={() => setGroup(g)}
              aria-pressed={group === g}
            >
              {g}
            </button>
          ))}
        </div>

        <div className="chiprow mt8" role="group" aria-label="Filtrer par matériel">
          <button
            className={`chip chip--sm ${equip === 'all' ? 'chip--on' : ''}`}
            onClick={() => setEquip('all')}
            aria-pressed={equip === 'all'}
          >
            Tout matériel
          </button>
          {equipment.map((eq) => (
            <button
              key={eq}
              className={`chip chip--sm ${equip === eq ? 'chip--on' : ''}`}
              onClick={() => setEquip(eq)}
              aria-pressed={equip === eq}
            >
              {EQUIPMENT_LABEL[eq]}
            </button>
          ))}
        </div>
      </div>

      {results.length === 0 ? (
        <div className="empty">
          <div className="empty__title">Aucun exercice ne correspond</div>
          <p className="empty__text">
            Essaie un autre mot-clé, ou élargis les filtres de groupe et de matériel.
          </p>
        </div>
      ) : (
        <>
          <p className="tiny muted-2" style={{ marginBottom: 10 }}>
            {results.length} exercice{results.length > 1 ? 's' : ''}
          </p>
          <div className="grid grid--3">
            {results.map((e) => (
              <button
                key={e.id}
                className="exorow"
                style={{ flexDirection: 'column', alignItems: 'stretch', gap: 10, padding: 10 }}
                onClick={() => setDetail(e)}
                onMouseEnter={() => setHover(e.id)}
                onMouseLeave={() => setHover((h) => (h === e.id ? null : h))}
                onFocus={() => setHover(e.id)}
                onBlur={() => setHover((h) => (h === e.id ? null : h))}
              >
                <FigureThumb exercise={e} active={hover === e.id} />
                <span style={{ textAlign: 'left' }}>
                  <span className="exorow__name">{e.name}</span>
                  <span className="exorow__meta">
                    {e.muscles
                      .slice(0, 2)
                      .map((m) => MUSCLE_LABEL[m])
                      .join(' · ')}
                  </span>
                  <span className="row row--wrap mt8" style={{ gap: 4 }}>
                    <span className="pill">{EQUIPMENT_LABEL[e.equip]}</span>
                    <span className="pill">Niveau {e.level}/3</span>
                  </span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}

      {detail ? <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
