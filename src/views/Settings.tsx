import { useRef, useState } from 'react';
import { useStore } from '../state/store';
import { GOAL_LABEL, LEVEL_LABEL } from '../data/programs';
import { Icon } from '../components/Icon';
import type { Goal, Level, Profile } from '../data/types';

export function Settings() {
  const { profile, settings, saveProfile, updateSettings, exportState, importState, reset } = useStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [message, setMessage] = useState<{ text: string; ok: boolean } | null>(null);

  if (!profile) return null;

  function patch(p: Partial<Profile>) {
    saveProfile({ ...profile!, ...p });
    setMessage({ text: 'Profil mis à jour.', ok: true });
  }

  function download() {
    const blob = new Blob([exportState()], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `gymos-sauvegarde-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setMessage({ text: 'Sauvegarde téléchargée.', ok: true });
  }

  async function upload(file: File) {
    const text = await file.text();
    const ok = importState(text);
    setMessage({
      text: ok ? 'Sauvegarde importée.' : 'Fichier illisible : ce n’est pas une sauvegarde GYM OS valide.',
      ok,
    });
  }

  return (
    <div className="container" style={{ maxWidth: 760 }}>
      <div className="pagehead">
        <div>
          <div className="eyebrow">Paramètres</div>
          <h1>Préférences</h1>
          <p>Uniquement des réglages réellement pris en charge par l’application.</p>
        </div>
      </div>

      {message ? (
        <div
          className="card"
          role="status"
          style={{
            marginBottom: 14,
            padding: '11px 14px',
            borderColor: message.ok ? 'var(--success-border)' : 'var(--danger-border)',
            background: message.ok ? 'var(--success-soft)' : 'var(--danger-soft)',
          }}
        >
          <span className="row small" style={{ gap: 8 }}>
            <Icon name={message.ok ? 'check' : 'alert'} size={16} />
            {message.text}
          </span>
        </div>
      ) : null}

      {/* --------------------------------- Profil --------------------------------- */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Profil</span>
          <span className="tiny muted-2">Détermine la génération des programmes</span>
        </div>

        <div className="grid grid--2">
          <div className="field">
            <label htmlFor="set-name">Prénom</label>
            <input
              id="set-name"
              value={profile.name}
              onChange={(e) => patch({ name: e.target.value })}
              placeholder="Athlète"
            />
          </div>
          <div className="field">
            <label htmlFor="set-weight">Poids (kg)</label>
            <input
              id="set-weight"
              inputMode="decimal"
              value={String(profile.weight)}
              onChange={(e) => patch({ weight: Number(e.target.value.replace(',', '.')) || profile.weight })}
            />
          </div>
          <div className="field">
            <label htmlFor="set-age">Âge</label>
            <input
              id="set-age"
              inputMode="numeric"
              value={String(profile.age)}
              onChange={(e) => patch({ age: Number(e.target.value) || profile.age })}
            />
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
                <button key={v} className={`chip ${profile.sex === v ? 'chip--on' : ''}`} onClick={() => patch({ sex: v })}>
                  {lab}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="divider" />

        <div className="sec" style={{ marginTop: 0 }}>
          <h4>Objectif</h4>
          <div className="optgrid">
            {(['seche', 'masse', 'force'] as Goal[]).map((g) => (
              <button key={g} className={`opt ${profile.goal === g ? 'opt--on' : ''}`} onClick={() => patch({ goal: g })}>
                <div className="opt__title">{GOAL_LABEL[g].split(' — ')[0]}</div>
                <div className="opt__desc">{GOAL_LABEL[g].split(' — ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="sec">
          <h4>Niveau</h4>
          <div className="optgrid">
            {([1, 2, 3] as Level[]).map((l) => (
              <button
                key={l}
                className={`opt ${profile.level === l ? 'opt--on' : ''}`}
                onClick={() => patch({ level: l })}
              >
                <div className="opt__title">{LEVEL_LABEL[l].split(' — ')[0]}</div>
                <div className="opt__desc">{LEVEL_LABEL[l].split(' — ')[1]}</div>
              </button>
            ))}
          </div>
        </div>

        <div className="sec">
          <h4>Séances par semaine</h4>
          <div className="chiprow">
            {[3, 4, 5, 6].map((d) => (
              <button key={d} className={`chip ${profile.days === d ? 'chip--on' : ''}`} onClick={() => patch({ days: d })}>
                {d} jours
              </button>
            ))}
          </div>
        </div>

        <label className="switch mt14">
          <input type="checkbox" checked={profile.cardio} onChange={(e) => patch({ cardio: e.target.checked })} />
          <span className="switch__text">
            <strong>Ajouter du cardio en fin de séance</strong>
            <span className="tiny muted">Recommandé en sèche</span>
          </span>
        </label>
      </div>

      {/* -------------------------------- Affichage -------------------------------- */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Affichage</span>
        </div>

        <div className="sec" style={{ marginTop: 0 }}>
          <h4>Unité de charge</h4>
          <div className="chiprow">
            {(
              [
                ['kg', 'Kilogrammes (kg)'],
                ['lb', 'Livres (lb)'],
              ] as [typeof settings.units, string][]
            ).map(([v, lab]) => (
              <button
                key={v}
                className={`chip ${settings.units === v ? 'chip--on' : ''}`}
                onClick={() => updateSettings({ units: v })}
              >
                {lab}
              </button>
            ))}
          </div>
          <p className="tiny muted mt8">
            Les charges sont toujours stockées en kilogrammes ; ce réglage ne change que l’affichage.
          </p>
        </div>

        <div className="sec">
          <h4>Animations</h4>
          <div className="chiprow">
            {(
              [
                ['auto', 'Suivre le système'],
                ['on', 'Toujours réduire'],
                ['off', 'Toujours animer'],
              ] as [typeof settings.reduceMotion, string][]
            ).map(([v, lab]) => (
              <button
                key={v}
                className={`chip ${settings.reduceMotion === v ? 'chip--on' : ''}`}
                onClick={() => updateSettings({ reduceMotion: v })}
              >
                {lab}
              </button>
            ))}
          </div>
          <p className="tiny muted mt8">
            Quand les animations sont réduites, les démonstrations des exercices sont remplacées par une planche de
            postures clés. Aucune information n’est perdue.
          </p>
        </div>
      </div>

      {/* ------------------------------- Entraînement ------------------------------- */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Entraînement</span>
        </div>

        <label className="switch">
          <input type="checkbox" checked={settings.sound} onChange={(e) => updateSettings({ sound: e.target.checked })} />
          <span className="switch__text">
            <strong>Son de fin de repos</strong>
            <span className="tiny muted">Signal sonore à la fin du chronomètre</span>
          </span>
        </label>

        <label className="switch mt14">
          <input
            type="checkbox"
            checked={settings.vibration}
            onChange={(e) => updateSettings({ vibration: e.target.checked })}
          />
          <span className="switch__text">
            <strong>Vibration à la validation d’une série</strong>
            <span className="tiny muted">Sur les appareils compatibles</span>
          </span>
        </label>

        <div className="sec">
          <h4>Repos par défaut</h4>
          <div className="chiprow">
            {[45, 60, 75, 90, 120].map((r) => (
              <button
                key={r}
                className={`chip ${settings.defaultRest === r ? 'chip--on' : ''}`}
                onClick={() => updateSettings({ defaultRest: r })}
              >
                {r} s
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --------------------------------- Données --------------------------------- */}
      <div className="card">
        <div className="card__head">
          <span className="card__title">Données</span>
          <span className="tiny muted-2">Stockées localement dans ce navigateur</span>
        </div>

        <div className="row row--wrap">
          <button className="btn" onClick={download}>
            <Icon name="download" size={17} />
            Exporter (JSON)
          </button>
          <button className="btn" onClick={() => fileRef.current?.click()}>
            <Icon name="upload" size={17} />
            Importer une sauvegarde
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            className="sr"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void upload(f);
              e.target.value = '';
            }}
          />
        </div>

        <div className="divider" />

        {confirmReset ? (
          <div className="row row--wrap" style={{ gap: 8 }}>
            <span className="small" style={{ flex: '1 1 240px' }}>
              Toutes tes séances, ton historique et tes programmes seront effacés. Cette action est irréversible.
            </span>
            <button className="btn btn--ghost" onClick={() => setConfirmReset(false)}>
              Annuler
            </button>
            <button
              className="btn btn--danger"
              onClick={() => {
                reset();
                setConfirmReset(false);
                setMessage({ text: 'Application réinitialisée.', ok: true });
              }}
            >
              Tout supprimer
            </button>
          </div>
        ) : (
          <button className="btn btn--ghost" onClick={() => setConfirmReset(true)}>
            <Icon name="trash" size={17} />
            Réinitialiser l’application
          </button>
        )}
      </div>
    </div>
  );
}
