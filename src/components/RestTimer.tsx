import { useEffect, useState } from 'react';
import { Icon } from './Icon';
import { beepRestOver } from '../lib/audio';

/**
 * Chronomètre de repos en bandeau discret : n'interrompt jamais la séance.
 * Le compte à rebours reste annoncé aux lecteurs d'écran.
 */
export function RestTimer({
  seconds,
  label,
  onClose,
  reducedMotion = false,
}: {
  seconds: number;
  label: string;
  onClose: () => void;
  reducedMotion?: boolean;
}) {
  const [left, setLeft] = useState(seconds);
  const total = seconds;

  useEffect(() => {
    setLeft(seconds);
  }, [seconds]);

  useEffect(() => {
    if (left <= 0) {
      beepRestOver();
      return;
    }
    const id = setInterval(() => setLeft((s) => Math.max(0, s - 1)), 1000);
    return () => clearInterval(id);
  }, [left]);

  const pct = total > 0 ? 1 - left / total : 0;
  const R = 20;
  const C = 2 * Math.PI * R;

  return (
    <div className="restbar" role="region" aria-label="Chronomètre de repos">
      <div className="restbar__inner">
        <svg
          className="restbar__ring"
          width="46"
          height="46"
          viewBox="0 0 46 46"
          aria-hidden="true"
          style={reducedMotion ? undefined : undefined}
        >
          <circle cx="23" cy="23" r={R} fill="none" stroke="var(--surface-3)" strokeWidth="4" />
          <circle
            cx="23"
            cy="23"
            r={R}
            fill="none"
            stroke={left === 0 ? 'var(--success)' : 'var(--accent)'}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
            transform="rotate(-90 23 23)"
          />
          {left === 0 ? (
            <path
              d="M16 23.5l4.5 4.5L30 19"
              fill="none"
              stroke="var(--success)"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          ) : null}
        </svg>

        <div style={{ minWidth: 0 }}>
          <div className="restbar__label">{label}</div>
          <div className="restbar__time" aria-live="polite">
            {left > 0 ? `${left} s` : 'Repos terminé'}
          </div>
        </div>

        <div className="restbar__actions">
          <button className="btn btn--sm" onClick={() => setLeft((s) => s + 15)}>
            +15 s
          </button>
          <button className="btn btn--sm btn--ghost" onClick={onClose}>
            <Icon name="close" size={16} />
            Fermer
          </button>
        </div>
      </div>
    </div>
  );
}
