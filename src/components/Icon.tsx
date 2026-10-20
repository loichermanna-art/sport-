import type { ReactNode } from 'react';

/**
 * Jeu d'icônes en trait, tracées à la main : aucune dépendance externe.
 * Grille 24 px, épaisseur 1.5, héritage de `currentColor`.
 */
export type IconName =
  | 'dashboard'
  | 'programs'
  | 'library'
  | 'progress'
  | 'settings'
  | 'play'
  | 'pause'
  | 'replay'
  | 'search'
  | 'close'
  | 'chevronRight'
  | 'chevronLeft'
  | 'chevronDown'
  | 'chevronUp'
  | 'check'
  | 'plus'
  | 'minus'
  | 'trash'
  | 'archive'
  | 'grip'
  | 'timer'
  | 'refresh'
  | 'download'
  | 'upload'
  | 'alert'
  | 'arrowRight'
  | 'user'
  | 'target'
  | 'motion';

const P: Record<IconName, ReactNode> = {
  dashboard: (
    <>
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
    </>
  ),
  programs: (
    <>
      <rect x="3.5" y="4.5" width="17" height="16" rx="2" />
      <path d="M3.5 9.5h17M8 2.5v4M16 2.5v4" />
    </>
  ),
  library: (
    <>
      <path d="M6.5 6.5v11M17.5 6.5v11M3.5 9.5v5M20.5 9.5v5M6.5 12h11" />
    </>
  ),
  progress: (
    <>
      <path d="M3.5 20.5h17" />
      <rect x="5" y="12" width="3.5" height="6" rx="1" />
      <rect x="10.25" y="7.5" width="3.5" height="10.5" rx="1" />
      <rect x="15.5" y="4" width="3.5" height="14" rx="1" />
    </>
  ),
  settings: (
    <>
      <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
      <path d="M1.5 14h5M9.5 8h5M17.5 16h5" />
    </>
  ),
  play: <path d="M7.5 4.8v14.4L19 12z" fill="currentColor" stroke="none" />,
  pause: (
    <>
      <path d="M9 5v14M15 5v14" strokeWidth="2" />
    </>
  ),
  replay: (
    <>
      <path d="M3.5 12a8.5 8.5 0 1 0 2.8-6.3" />
      <path d="M3.5 3.5v5h5" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="M20.5 20.5l-4.2-4.2" />
    </>
  ),
  close: <path d="M18 6L6 18M6 6l12 12" />,
  chevronRight: <path d="M9.5 5.5l6.5 6.5-6.5 6.5" />,
  chevronLeft: <path d="M14.5 5.5L8 12l6.5 6.5" />,
  chevronDown: <path d="M5.5 9l6.5 6.5L18.5 9" />,
  chevronUp: <path d="M5.5 15L12 8.5 18.5 15" />,
  check: <path d="M20 6.5L9.2 17.3 4 12.1" />,
  plus: <path d="M12 5.5v13M5.5 12h13" />,
  minus: <path d="M5.5 12h13" />,
  trash: (
    <>
      <path d="M3.5 6.5h17M9 6.5V4h6v2.5" />
      <path d="M6 6.5l1 13.5h10l1-13.5" />
    </>
  ),
  archive: (
    <>
      <rect x="3.5" y="3.5" width="17" height="4" rx="1" />
      <path d="M5.5 7.5V19a1 1 0 001 1h11a1 1 0 001-1V7.5M10 11.5h4" />
    </>
  ),
  grip: (
    <g fill="currentColor" stroke="none">
      <circle cx="9" cy="6" r="1.35" />
      <circle cx="15" cy="6" r="1.35" />
      <circle cx="9" cy="12" r="1.35" />
      <circle cx="15" cy="12" r="1.35" />
      <circle cx="9" cy="18" r="1.35" />
      <circle cx="15" cy="18" r="1.35" />
    </g>
  ),
  timer: (
    <>
      <circle cx="12" cy="13" r="7.5" />
      <path d="M12 9.5v3.8l2.8 1.7M9.5 2.5h5" />
    </>
  ),
  refresh: (
    <>
      <path d="M20.5 12a8.5 8.5 0 1 1-2.8-6.3" />
      <path d="M20.5 3.5v5h-5" />
    </>
  ),
  download: <path d="M12 3.5v11.5M7.5 11l4.5 4.5L16.5 11M4 20.5h16" />,
  upload: <path d="M12 20.5V9M7.5 13.5L12 9l4.5 4.5M4 4h16" />,
  alert: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M12 7.5v5M12 16.2v.2" />
    </>
  ),
  arrowRight: <path d="M4.5 12h14M13 6.5l6 5.5-6 5.5" />,
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 20.5a7.5 7.5 0 0115 0" />
    </>
  ),
  target: (
    <>
      <circle cx="12" cy="12" r="8.5" />
      <circle cx="12" cy="12" r="4.5" />
      <circle cx="12" cy="12" r="1" fill="currentColor" stroke="none" />
    </>
  ),
  motion: <path d="M3 12h3.5l2.5-7 4 14 2.5-7H21" />,
};

export function Icon({
  name,
  size = 20,
  className,
  strokeWidth = 1.5,
}: {
  name: IconName;
  size?: number;
  className?: string;
  strokeWidth?: number;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {P[name]}
    </svg>
  );
}
