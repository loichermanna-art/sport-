import { useEffect, useRef, useState } from 'react';
import { beepRestOver, tick } from '../lib/audio';

export function RestTimer({ seconds, label, onClose, onDone }: { seconds: number; label?: string; onClose: () => void; onDone?: () => void }) {
  const [left, setLeft] = useState(seconds);
  const end = useRef(Date.now() + seconds * 1000);
  const doneRef = useRef(false);

  useEffect(() => {
    end.current = Date.now() + seconds * 1000;
    setLeft(seconds);
    doneRef.current = false;
  }, [seconds]);

  useEffect(() => {
    const id = setInterval(() => {
      const remain = Math.max(0, Math.round((end.current - Date.now()) / 1000));
      setLeft(remain);
      if (remain <= 3 && remain > 0) tick();
      if (remain === 0 && !doneRef.current) {
        doneRef.current = true;
        beepRestOver();
        onDone?.();
      }
    }, 250);
    return () => clearInterval(id);
  }, [seconds, onDone]);

  const total = seconds || 1;
  const pct = 1 - left / total;
  const R = 18;
  const C = 2 * Math.PI * R;

  return (
    <div className="timer" role="status" aria-live="polite">
      <div className="timer__ring">
        <svg width="42" height="42" viewBox="0 0 42 42">
          <circle cx="21" cy="21" r={R} fill="none" stroke="rgba(255,255,255,0.12)" strokeWidth="4" />
          <circle
            cx="21"
            cy="21"
            r={R}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={C}
            strokeDashoffset={C * (1 - pct)}
          />
        </svg>
        <div className="timer__num">{left}s</div>
      </div>
      <div className="timer__label">
        {left > 0 ? (label ?? 'Repos') : 'Repos terminé — à toi !'}
      </div>
      <button className="chip" onClick={() => setLeft((l) => Math.min(seconds, l + 15))}>
        +15 s
      </button>
      <button className="iconbtn" onClick={onClose} aria-label="Fermer le minuteur">
        ✕
      </button>
    </div>
  );
}
