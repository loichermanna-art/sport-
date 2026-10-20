import { useState } from 'react';
import { useStore } from '../state/store';
import { getExercise } from '../data/exercises';
import { GOAL_SHORT, PROGRAM_NAME, sessionDuration } from '../data/programs';
import { MUSCLE_LABEL } from '../lib/render';
import { Icon } from '../components/Icon';
import type { Exercise } from '../data/exercises';
import type { Program } from '../data/types';
import { ExerciseDetail } from '../components/ExerciseDetail';

const DAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];
const STATUS_LABEL: Record<Program['status'], string> = {
  active: 'Actif',
  paused: 'En pause',
  archived: 'Archivé',
};

export function Programs() {
  const {
    programs,
    activeProgramId,
    currentProgram,
    profile,
    selectProgram,
    createProgram,
    renameProgram,
    setProgramStatus,
    deleteProgram,
    moveSession,
  } = useStore();

  const [detail, setDetail] = useState<Exercise | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const [dragId, setDragId] = useState<string | null>(null);
  const [dropDay, setDropDay] = useState<number | null>(null);

  if (!profile || !currentProgram) return null;

  function submitCreate() {
    createProgram(newName.trim() || PROGRAM_NAME[profile!.goal]);
    setNewName('');
    setCreating(false);
  }

  function shiftWeekday(sessionId: string, current: number, delta: number) {
    const next = (current + delta + 7) % 7;
    moveSession(currentProgram!.id, sessionId, next);
  }

  return (
    <div className="container">
      <div className="pagehead">
        <div>
          <div className="eyebrow">Programmes</div>
          <h1>Mes programmes</h1>
          <p>
            {programs.length} programme{programs.length > 1 ? 's' : ''} · {currentProgram.days} séances par semaine
          </p>
        </div>
        <button className="btn btn--primary" onClick={() => setCreating((v) => !v)}>
          <Icon name="plus" size={18} />
          Nouveau programme
        </button>
      </div>

      {creating ? (
        <div className="card" style={{ marginBottom: 14 }}>
          <div className="field" style={{ marginBottom: 12 }}>
            <label htmlFor="prog-name">Nom du programme</label>
            <input
              id="prog-name"
              value={newName}
              placeholder={PROGRAM_NAME[profile.goal]}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? submitCreate() : undefined)}
            />
          </div>
          <p className="tiny muted" style={{ marginBottom: 12 }}>
            Le programme est généré à partir de ton profil actuel : {GOAL_SHORT[profile.goal]}, niveau{' '}
            {profile.level}/3, {profile.days} séances par semaine.
          </p>
          <div className="row">
            <button className="btn btn--primary" onClick={submitCreate}>
              Créer
            </button>
            <button className="btn btn--ghost" onClick={() => setCreating(false)}>
              Annuler
            </button>
          </div>
        </div>
      ) : null}

      {/* Liste des programmes */}
      <div className="grid grid--2" style={{ marginBottom: 20 }}>
        {programs.map((p) => {
          const isCurrent = p.id === activeProgramId;
          return (
            <div className={`progcard ${isCurrent ? 'progcard--on' : ''}`} key={p.id}>
              <div className="row row--between" style={{ marginBottom: 6 }}>
                {editingId === p.id ? (
                  <input
                    className="input"
                    value={editingName}
                    aria-label="Nouveau nom du programme"
                    onChange={(e) => setEditingName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        renameProgram(p.id, editingName);
                        setEditingId(null);
                      }
                      if (e.key === 'Escape') setEditingId(null);
                    }}
                    autoFocus
                  />
                ) : (
                  <span style={{ fontSize: 16, fontWeight: 600 }}>{p.name}</span>
                )}
                <span
                  className={`pill ${p.status === 'active' ? 'pill--green' : p.status === 'paused' ? 'pill--warn' : ''}`}
                >
                  {STATUS_LABEL[p.status]}
                </span>
              </div>

              <p className="muted small">
                {GOAL_SHORT[p.goal]} · niveau {p.level}/3 · {p.sessions.length} séances
              </p>

              <div className="row row--wrap mt14" style={{ gap: 6 }}>
                {editingId === p.id ? (
                  <button
                    className="btn btn--sm btn--primary"
                    onClick={() => {
                      renameProgram(p.id, editingName);
                      setEditingId(null);
                    }}
                  >
                    Enregistrer
                  </button>
                ) : (
                  <button
                    className="btn btn--sm"
                    onClick={() => {
                      setEditingId(p.id);
                      setEditingName(p.name);
                    }}
                  >
                    Modifier
                  </button>
                )}

                {!isCurrent ? (
                  <button className="btn btn--sm" onClick={() => selectProgram(p.id)}>
                    Sélectionner
                  </button>
                ) : null}

                {p.status === 'active' ? (
                  <button className="btn btn--sm" onClick={() => setProgramStatus(p.id, 'paused')}>
                    <Icon name="pause" size={14} />
                    Mettre en pause
                  </button>
                ) : (
                  <button className="btn btn--sm" onClick={() => setProgramStatus(p.id, 'active')}>
                    <Icon name="play" size={14} />
                    Réactiver
                  </button>
                )}

                <button
                  className="btn btn--sm"
                  onClick={() => setProgramStatus(p.id, p.status === 'archived' ? 'active' : 'archived')}
                >
                  <Icon name="archive" size={14} />
                  {p.status === 'archived' ? 'Désarchiver' : 'Archiver'}
                </button>

                {pendingDelete === p.id ? (
                  <span className="row" style={{ gap: 6 }}>
                    <button
                      className="btn btn--sm btn--danger"
                      onClick={() => {
                        deleteProgram(p.id);
                        setPendingDelete(null);
                      }}
                    >
                      Supprimer « {p.name} »
                    </button>
                    <button className="btn btn--sm btn--ghost" onClick={() => setPendingDelete(null)}>
                      Annuler
                    </button>
                  </span>
                ) : (
                  <button
                    className="btn btn--sm btn--ghost"
                    onClick={() => setPendingDelete(p.id)}
                    disabled={programs.length === 1}
                    title={programs.length === 1 ? 'Garde au moins un programme' : undefined}
                  >
                    <Icon name="trash" size={14} />
                    Supprimer
                  </button>
                )}
              </div>

              {pendingDelete === p.id ? (
                <p className="tiny muted mt8">
                  La suppression est définitive. Ton historique de séances reste conservé.
                </p>
              ) : null}
            </div>
          );
        })}
      </div>

      {/* Semaine du programme sélectionné */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Semaine de « {currentProgram.name} »</span>
          <span className="tiny muted-2">Glisse une séance sur un autre jour, ou utilise les flèches</span>
        </div>

        <div className="weekgrid">
          {DAYS.map((d, i) => {
            const s = currentProgram.sessions.find((x) => x.weekday === i);
            const isDrop = dropDay === i && dragId !== null;
            return (
              <div
                key={d}
                className={`daycard ${isDrop ? 'daycard__drop' : ''} ${!s ? 'daycard--rest' : ''}`}
                onDragOver={(e) => {
                  if (!dragId) return;
                  e.preventDefault();
                  setDropDay(i);
                }}
                onDragLeave={() => setDropDay((x) => (x === i ? null : x))}
                onDrop={(e) => {
                  e.preventDefault();
                  if (dragId) moveSession(currentProgram.id, dragId, i);
                  setDragId(null);
                  setDropDay(null);
                }}
              >
                <div className="daycard__name">{d}</div>
                {s ? (
                  <>
                    <div className="daycard__title">{s.name}</div>
                    <div className="tiny muted-2">
                      {s.items.length} ex. · {sessionDuration(s)} min
                    </div>
                    <div className="row" style={{ gap: 2, marginTop: 'auto' }}>
                      <button
                        className="btn btn--icon"
                        style={{ width: 24, minHeight: 24 }}
                        onClick={() => shiftWeekday(s.id, s.weekday, -1)}
                        aria-label={`Déplacer ${s.name} au jour précédent`}
                      >
                        <Icon name="chevronLeft" size={14} />
                      </button>
                      <button
                        className="btn btn--ghost"
                        style={{ width: 24, minHeight: 24, cursor: 'grab' }}
                        draggable
                        onDragStart={() => setDragId(s.id)}
                        onDragEnd={() => {
                          setDragId(null);
                          setDropDay(null);
                        }}
                        aria-label={`Déplacer la séance ${s.name}`}
                      >
                        <Icon name="grip" size={14} />
                      </button>
                      <button
                        className="btn btn--icon"
                        style={{ width: 24, minHeight: 24 }}
                        onClick={() => shiftWeekday(s.id, s.weekday, 1)}
                        aria-label={`Déplacer ${s.name} au jour suivant`}
                      >
                        <Icon name="chevronRight" size={14} />
                      </button>
                    </div>
                  </>
                ) : (
                  <div className="daycard__title" style={{ color: 'var(--muted-2)', fontWeight: 500 }}>
                    Repos
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {currentProgram.sessions.map((s) => (
          <div className="card mt14" key={s.id}>
            <div className="row row--between">
              <div>
                <strong style={{ fontSize: 16 }}>{s.name}</strong>
                <div className="small muted">{s.focus}</div>
              </div>
              <span className="pill">{DAYS[s.weekday]}</span>
            </div>
            <div className="divider" />
            <div className="grid grid--2" style={{ gap: 6 }}>
              {s.items.map((it, i) => {
                const ex = getExercise(it.exerciseId);
                return (
                  <button className="exorow" key={`${it.exerciseId}-${i}`} onClick={() => setDetail(ex)}>
                    <span className="pill pill--accent" style={{ minWidth: 60, justifyContent: 'center' }}>
                      {it.sets} × {it.reps}
                    </span>
                    <span>
                      <span className="exorow__name">{ex.name}</span>
                      <span className="exorow__meta">
                        {ex.muscles
                          .slice(0, 2)
                          .map((m) => MUSCLE_LABEL[m])
                          .join(' · ')}{' '}
                        · repos {it.rest} s
                      </span>
                    </span>
                    <Icon name="chevronRight" size={16} className="muted-2" />
                  </button>
                );
              })}
            </div>
            {s.cardio ? (
              <p className="small muted mt14">
                Cardio en fin de séance : {getExercise(s.cardio.exerciseId).name} — {s.cardio.minutes} min
              </p>
            ) : null}
          </div>
        ))}
      </div>

      {detail ? <ExerciseDetail exercise={detail} onClose={() => setDetail(null)} /> : null}
    </div>
  );
}
