import { useEffect, useState } from 'react';
import { useStore, findSessionForToday } from './state/store';
import { Onboarding } from './views/Onboarding';
import { Dashboard } from './views/Dashboard';
import { Programs } from './views/Programs';
import { Library } from './views/Library';
import { Progress } from './views/Progress';
import { Settings } from './views/Settings';
import { Session } from './views/Session';
import { Icon, type IconName } from './components/Icon';
import { GOAL_SHORT } from './data/programs';
import type { Profile } from './data/types';

type Tab = 'dashboard' | 'programs' | 'library' | 'progress' | 'settings';

const TABS: { id: Tab; label: string; icon: IconName }[] = [
  { id: 'dashboard', label: 'Tableau de bord', icon: 'dashboard' },
  { id: 'programs', label: 'Programmes', icon: 'programs' },
  { id: 'library', label: 'Bibliothèque', icon: 'library' },
  { id: 'progress', label: 'Suivi', icon: 'progress' },
  { id: 'settings', label: 'Paramètres', icon: 'settings' },
];

export default function App() {
  const { profile, currentProgram, active, saveProfile, startSession } = useStore();
  const [tab, setTab] = useState<Tab>('dashboard');
  const [editing, setEditing] = useState(false);
  const [inSession, setInSession] = useState(false);

  // Raccourcis clavier : 1 à 5 pour changer de section.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const idx = ['1', '2', '3', '4', '5'].indexOf(e.key);
      if (idx >= 0) setTab(TABS[idx].id);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // Une séance reprise au reload renvoie directement sur l'écran de séance.
  useEffect(() => {
    if (active) setInSession(true);
  }, [active]);

  if (!profile || !currentProgram || editing) {
    return (
      <Onboarding
        initial={profile}
        onDone={(p: Profile) => {
          saveProfile(p);
          setEditing(false);
          setTab('dashboard');
        }}
      />
    );
  }

  /* L'écran de séance est volontairement sans navigation : on reste concentré. */
  if (inSession && active) {
    return (
      <div className="app">
        <main className="main" style={{ padding: 0 }}>
          <Session
            onExit={() => {
              setInSession(false);
              setTab('dashboard');
            }}
          />
        </main>
      </div>
    );
  }

  const { session } = findSessionForToday(currentProgram);

  function start() {
    if (!session) {
      setTab('programs');
      return;
    }
    startSession(session.id);
    setInSession(true);
  }

  return (
    <div className="app">
      <aside className="sidebar">
        <div className="brand">
          <span className="brand__mark">
            <Icon name="library" size={18} />
          </span>
          <span>
            <span className="brand__name">GYM OS</span>
            <span className="brand__sub">Musculation guidée</span>
          </span>
        </div>

        <nav className="nav" aria-label="Navigation principale">
          <div className="nav__label">Menu</div>
          {TABS.map((t) => (
            <button
              key={t.id}
              className={`nav__item ${tab === t.id ? 'nav__item--on' : ''}`}
              onClick={() => setTab(t.id)}
              aria-current={tab === t.id ? 'page' : undefined}
            >
              <span className="nav__ico">
                <Icon name={t.icon} size={19} />
              </span>
              <span>{t.label}</span>
              {t.id === 'dashboard' && active ? <span className="nav__badge">1</span> : null}
            </button>
          ))}
        </nav>

        <div className="sidebar__foot">
          <div className="card" style={{ padding: 12 }}>
            <div className="tiny muted-2">Profil</div>
            <div style={{ fontSize: 14, fontWeight: 600 }}>{profile.name}</div>
            <div className="tiny muted">
              {profile.weight} kg · {GOAL_SHORT[profile.goal]} · {profile.days} séances/semaine
            </div>
            <button className="btn btn--sm btn--block mt8" onClick={() => setEditing(true)}>
              Modifier le profil
            </button>
          </div>
          <p className="tiny muted-2" style={{ padding: '0 6px' }}>
            Touches <strong>1</strong> à <strong>5</strong> pour naviguer.
          </p>
        </div>
      </aside>

      <main className="main">
        {tab === 'dashboard' ? <Dashboard onStart={start} /> : null}
        {tab === 'programs' ? <Programs /> : null}
        {tab === 'library' ? <Library /> : null}
        {tab === 'progress' ? <Progress /> : null}
        {tab === 'settings' ? <Settings /> : null}
      </main>

      <nav className="mobilebar" aria-label="Navigation principale">
        {TABS.map((t) => (
          <button
            key={t.id}
            className={`mobilebar__item ${tab === t.id ? 'mobilebar__item--on' : ''}`}
            onClick={() => setTab(t.id)}
            aria-current={tab === t.id ? 'page' : undefined}
          >
            <span className="mobilebar__ico">
              <Icon name={t.icon} size={21} />
            </span>
            <span>{t.label.split(' ')[0]}</span>
          </button>
        ))}
      </nav>
    </div>
  );
}
