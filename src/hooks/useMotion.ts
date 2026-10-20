import { useEffect, useState } from 'react';
import { useStore } from '../state/store';

const QUERY = '(prefers-reduced-motion: reduce)';

/**
 * Indique si les animations doivent être réduites.
 * Suit le réglage système sauf si l'utilisateur a forcé `on` ou `off`
 * dans les paramètres.
 */
export function useReducedMotion(): boolean {
  const { settings } = useStore();
  const [system, setSystem] = useState(() =>
    typeof window !== 'undefined' && typeof window.matchMedia === 'function' ? window.matchMedia(QUERY).matches : false,
  );

  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return;
    const mq = window.matchMedia(QUERY);
    const onChange = (e: MediaQueryListEvent) => setSystem(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  if (settings.reduceMotion === 'on') return true;
  if (settings.reduceMotion === 'off') return false;
  return system;
}
