import { useEffect, useState } from 'react';
import { useStore, findSessionForToday, weekdayIndex } from './state/store';
import { Onboarding } from './views/Onboarding';
import { Today } from './views/Today';
import { Library } from './views/Library';
import { Plan } from './views/Plan';
import { Stats } from './views/Stats';
import type { Profile } from './data/types';
import { GOAL_SHORT } from './data/programs';

type Tab = 'today' | 'plan' | 'library' | 'stats';

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'today', label: 'Aujourd’hui', icon: '🎯' },
  { id: 'plan', label: 'Planning', icon: '🗓' },
  { id: 'library', label: 'Exercices', icon: '🎬' },
  { id: 'stats', label: 'Suivi', icon: '📈' },
];

export default function App() {
  const { profile, program, saveProfile, active } = useStore();
  const [tab, setTab] = useState<Tab>('today');
  const [editing, setEditing] = useState(false);

  // Raccourcis clavier : 1-4 pour changer d'onglet
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      const idx = ['1', '2', '3', '4'].indexOf(e.key);
      if (idx >= 0) setTab(TABS[idx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  if (!profile || !program || editing) {
    return (
      <Onboarding
        initial={profile}
        onDone={(p: Profile) => {
          saveProfile(p);
          setEditing(false);
          setTab('today');
        }}
      />
    );
  }

  const { session } = findSessionForToday(program);
  const isRestDay = !program.sessions.some((s) => s.weekday === weekdayIndex());
  const remaining = active ? 1 : isRestDay || !session ? 0 : session.items.length;

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <div className="brand__mark">🏋️</div>
          <div>
            <div className="brand__name">IronPath</div>
            <div className="brand__sub">{GOAL_SHORT[profile.goal]} · Niveau {profile.level}</div>
          </div>
        </div>

        <nav className="nav">
          {TABS.map((t) => (
            <button key={t.id} className={`nav__item ${tab === t.id ? 'nav__item--on' : ''}`} onClick={() => setTab(t.id)}>
              <span className="nav__ico">{t.icon}</span>
              <span>{t.label}</span>
              {t.id === 'today' && remaining > 0 ? <span className="nav__badge">{remaining}</span> : null}
            </button>
          ))}
        </nav>

        <div style={{ marginTop: 'auto', display: 'grid', gap: 10 }}>
          <div className="card" style={{ padding: 13 }}>
            <div className="tiny muted">Profil</div>
            <strong style={{ fontSize: 14 }}>{profile.name}</strong>
            <div className="tiny muted">
              {profile.weight} kg · {profile.days} séances/semaine
            </div>
            <button className="chip chip--sm mt8" onClick={() => setEditing(true)}>
              Modifier l’objectif
            </button>
          </div>
          <p className="tiny muted" style={{ padding: '0 6px' }}>
            Astuce : touches <strong>1</strong> à <strong>4</strong> pour naviguer.
          </p>
        </div>
      </aside>

      <main className="main">
        {tab === 'today' ? <Today /> : null}
        {tab === 'plan' ? <Plan /> : null}
        {tab === 'library' ? <Library /> : null}
        {tab === 'stats' ? <Stats /> : null}
      </main>

      <nav className="mobilebar">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mobilebar__item ${tab === t.id ? 'mobilebar__item--on' : ''}`}
            onClick={() => setTab(t.id)}
          >
            <span className="mobilebar__ico">{t.icon}</span>
            <span>{t.label}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
