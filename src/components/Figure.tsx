import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sampleTimeline, type Pose } from '../lib/pose';
import { renderFigure, GYM_STYLE, type Shape } from '../lib/render';
import type { Exercise } from '../data/exercises';
import { useReducedMotion } from '../hooks/useMotion';
import { Icon } from './Icon';

/** La scène est exprimée directement en unités « corps » : torse = 1. */
const VB = { w: 4.6, h: 4.1, ox: 2.3, oy: 3.68 };

function ShapeEl({ s }: { s: Shape }) {
  switch (s.k) {
    case 'path':
      return (
        <path
          d={s.d}
          fill={s.fill ?? 'none'}
          stroke={s.stroke}
          strokeWidth={s.sw}
          strokeLinecap={s.cap}
          strokeDasharray={s.dash}
          opacity={s.op}
        />
      );
    case 'circle':
      return <circle cx={s.c.x} cy={s.c.y} r={s.r} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} opacity={s.op} />;
    case 'rect':
      return <rect x={s.x} y={s.y} width={s.w} height={s.h} rx={s.rx} fill={s.fill ?? 'none'} stroke={s.stroke} strokeWidth={s.sw} opacity={s.op} />;
    case 'line':
      return <line x1={s.a.x} y1={s.a.y} x2={s.b.x} y2={s.b.y} stroke={s.stroke} strokeWidth={s.sw} strokeLinecap={s.cap} strokeDasharray={s.dash} opacity={s.op} />;
    case 'g':
      return (
        <g opacity={s.op}>
          {s.children.map((c, i) => (
            <ShapeEl key={i} s={c} />
          ))}
        </g>
      );
  }
}

function Frame({
  exercise,
  pose,
  showMuscles,
  className,
  title,
}: {
  exercise: Exercise;
  pose: Pose;
  showMuscles: boolean;
  className?: string;
  title?: string;
}) {
  const shapes = useMemo(
    () =>
      renderFigure({
        pose,
        view: exercise.view,
        gear: exercise.gear,
        highlight: showMuscles ? exercise.muscles : [],
        style: GYM_STYLE,
        pulse: 1,
        floor: exercise.ground !== false,
      }),
    [exercise, pose, showMuscles],
  );

  return (
    <svg
      className={className}
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={title ?? `Démonstration : ${exercise.name}`}
    >
      <g transform={`translate(${VB.ox} ${VB.oy}) scale(1 -1)`}>
        {shapes.map((s, i) => (
          <ShapeEl key={i} s={s} />
        ))}
      </g>
    </svg>
  );
}

/** Figure à une posture donnée. */
export function PoseFigure({
  exercise,
  pose,
  showMuscles = true,
  className,
}: {
  exercise: Exercise;
  pose: Pose;
  showMuscles?: boolean;
  className?: string;
}) {
  return <Frame exercise={exercise} pose={pose} showMuscles={showMuscles} className={className} />;
}

/** Figure à une position du cycle, de 0 à 1. */
export function Figure({
  exercise,
  t,
  showMuscles = true,
  className,
}: {
  exercise: Exercise;
  t: number;
  showMuscles?: boolean;
  className?: string;
}) {
  const pose = useMemo(() => sampleTimeline(exercise.frames, t, true), [exercise.frames, t]);
  return <Frame exercise={exercise} pose={pose} showMuscles={showMuscles} className={className} />;
}

/**
 * Planche de postures clés : alternative statique à l'animation,
 * utilisée quand l'utilisateur préfère réduire les animations.
 */
export function Storyboard({ exercise, showMuscles = true }: { exercise: Exercise; showMuscles?: boolean }) {
  const cells = useMemo(() => {
    const n = exercise.frames.length;
    const count = Math.min(4, Math.max(2, n));
    return Array.from({ length: count }, (_, i) => {
      const idx = Math.round((i * (n - 1)) / (count - 1));
      return { pose: exercise.frames[idx], cue: exercise.frames[idx]?.cue, key: i };
    });
  }, [exercise]);

  return (
    <div className="storyboard">
      {cells.map((c) => (
        <div className="storyboard__cell" key={c.key}>
          <PoseFigure exercise={exercise} pose={c.pose} showMuscles={showMuscles} />
          {c.cue ? <div className="storyboard__cap">{c.cue}</div> : null}
        </div>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Lecteur animé                                                       */
/* ------------------------------------------------------------------ */

export interface AnimatedFigureProps {
  exercise: Exercise;
  /** Vitesse de lecture. */
  speed?: number;
  autoPlay?: boolean;
  showControls?: boolean;
  showMuscles?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function AnimatedFigure({
  exercise,
  speed = 1,
  autoPlay = true,
  showControls = true,
  showMuscles = true,
}: AnimatedFigureProps) {
  const reduced = useReducedMotion();
  const [animated, setAnimated] = useState(!reduced);
  const [playing, setPlaying] = useState(autoPlay && !reduced);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const duration = exercise.tempo;

  // Si le réglage système change en cours de session, on s'y conforme.
  useEffect(() => {
    setAnimated(!reduced);
    setPlaying(autoPlay && !reduced);
  }, [reduced, autoPlay]);

  useEffect(() => {
    setT(0);
  }, [exercise.id]);

  useEffect(() => {
    if (!playing || !animated) return;
    last.current = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last.current) / 1000);
      last.current = now;
      setT((prev) => (prev + (dt * speed) / duration) % 1);
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [playing, animated, speed, duration]);

  const cue = useMemo(() => {
    const frames = exercise.frames;
    if (frames.length < 2) return frames[0]?.cue;
    const pos = t * (frames.length - 1) * 2;
    const idx = pos <= frames.length - 1 ? Math.floor(pos) : Math.ceil(2 * (frames.length - 1) - pos);
    return frames[Math.min(frames.length - 1, Math.max(0, idx))]?.cue;
  }, [t, exercise.frames]);

  const pose = useMemo(() => sampleTimeline(exercise.frames, t, true), [exercise.frames, t]);

  if (!animated) {
    return (
      <div className="player">
        <div className="player__stage">
          <Storyboard exercise={exercise} showMuscles={showMuscles} />
        </div>
        {showControls ? (
          <div className="row row--between">
            <span className="tiny muted">
              Animations réduites — les postures clés sont affichées à la place.
            </span>
            <button className="btn btn--sm" onClick={() => setAnimated(true)}>
              <Icon name="play" size={15} />
              Lire l’animation
            </button>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="player">
      <div className="player__stage">
        <Frame exercise={exercise} pose={pose} showMuscles={showMuscles} />
        {cue ? <div className="player__cue">{cue}</div> : null}
      </div>
      {showControls ? (
        <div className="player__controls">
          <button
            className="btn btn--icon"
            onClick={() => setPlaying((p) => !p)}
            aria-label={playing ? 'Mettre en pause' : 'Lancer l’animation'}
          >
            <Icon name={playing ? 'pause' : 'play'} size={18} />
          </button>
          <input
            className="player__scrub"
            type="range"
            min={0}
            max={1000}
            value={Math.round(t * 1000)}
            onChange={(e) => {
              setPlaying(false);
              setT(Number(e.target.value) / 1000);
            }}
            aria-label="Position dans le mouvement"
          />
          <button className="btn btn--icon" onClick={() => setT(0)} aria-label="Revenir au départ">
            <Icon name="replay" size={17} />
          </button>
        </div>
      ) : null}
      {showControls && reduced ? (
        <button className="btn btn--sm" onClick={() => setAnimated(false)}>
          Réduire les animations
        </button>
      ) : null}
    </div>
  );
}

/** Vignette : animée au survol, statique au repos. Respecte le réglage d'animation. */
export function FigureThumb({ exercise, active }: { exercise: Exercise; active: boolean }) {
  const reduced = useReducedMotion();
  const [t, setT] = useState(0.5);

  useEffect(() => {
    if (!active || reduced) return;
    let raf = 0;
    let last = performance.now();
    const tick = (now: number) => {
      const dt = Math.min(0.1, (now - last) / 1000);
      last = now;
      setT((p) => (p + dt / exercise.tempo) % 1);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [active, reduced, exercise.tempo]);

  return <Figure exercise={exercise} t={active && !reduced ? t : 0.5} showMuscles={false} className="thumb__svg" />;
}

export type { Pose };
