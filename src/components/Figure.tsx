import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react';
import { sampleTimeline, type Pose } from '../lib/pose';
import { renderFigure, IRON_STYLE, type Shape, type MuscleId } from '../lib/render';
import type { Exercise } from '../data/exercises';

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

export interface FigureProps {
  exercise: Exercise;
  /** Position dans le cycle, de 0 à 1. */
  t: number;
  highlight?: MuscleId[];
  showMuscles?: boolean;
  className?: string;
  style?: CSSProperties;
}

export function Figure({ exercise, t, highlight, showMuscles = true, className, style }: FigureProps) {
  const shapes = useMemo(() => {
    const pose = sampleTimeline(exercise.frames, t, true);
    return renderFigure({
      pose,
      view: exercise.view,
      gear: exercise.gear,
      highlight: showMuscles ? (highlight ?? exercise.muscles) : [],
      style: IRON_STYLE,
      pulse: 1,
      floor: exercise.ground !== false,
    });
  }, [exercise, t, highlight, showMuscles]);

  return (
    <svg
      className={className}
      style={style}
      viewBox={`0 0 ${VB.w} ${VB.h}`}
      preserveAspectRatio="xMidYMid meet"
      role="img"
      aria-label={`Démonstration animée : ${exercise.name}`}
    >
      <g transform={`translate(${VB.ox} ${VB.oy}) scale(1 -1)`}>
        {shapes.map((s, i) => (
          <ShapeEl key={i} s={s} />
        ))}
      </g>
    </svg>
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
  onCue?: (cue: string) => void;
}

export function AnimatedFigure({
  exercise,
  speed = 1,
  autoPlay = true,
  showControls = true,
  showMuscles = true,
  className,
  style,
  onCue,
}: AnimatedFigureProps) {
  const [playing, setPlaying] = useState(autoPlay);
  const [t, setT] = useState(0);
  const raf = useRef<number | null>(null);
  const last = useRef<number>(0);
  const duration = exercise.tempo;

  useEffect(() => {
    setT(0);
  }, [exercise.id]);

  useEffect(() => {
    if (!playing) return;
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
  }, [playing, speed, duration]);

  // respiration de la mise en évidence musculaire : léger pulsement
  const [pulsePhase, setPulsePhase] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setPulsePhase((p) => (p + 1) % 100), 60);
    return () => clearInterval(id);
  }, []);

  const cue = useMemo(() => {
    const frames = exercise.frames;
    if (frames.length < 2) return frames[0]?.cue;
    const pos = t * (frames.length - 1) * 2;
    const idx = pos <= frames.length - 1 ? Math.floor(pos) : Math.ceil(2 * (frames.length - 1) - pos);
    return frames[Math.min(frames.length - 1, Math.max(0, idx))]?.cue;
  }, [t, exercise.frames]);

  useEffect(() => {
    if (onCue && cue) onCue(cue);
  }, [cue, onCue]);

  return (
    <div className="player">
      <div className="player__stage">
        <Figure
          exercise={exercise}
          t={t}
          showMuscles={showMuscles}
          className={className}
          style={style}
          highlight={pulsePhase >= 0 ? exercise.muscles : exercise.muscles}
        />
        {cue ? <div className="player__cue">{cue}</div> : null}
      </div>
      {showControls ? (
        <div className="player__controls">
          <button className="iconbtn" onClick={() => setPlaying((p) => !p)} aria-label={playing ? 'Pause' : 'Lecture'}>
            {playing ? '⏸' : '▶'}
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
          <button className="chip chip--sm" onClick={() => setT(0)} title="Revenir au départ">
            ↺
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** Vignette animée (listes, grilles) : lecture au survol pour économiser le CPU. */
export function FigureThumb({ exercise, active }: { exercise: Exercise; active: boolean }) {
  const [t, setT] = useState(0);
  useEffect(() => {
    if (!active) return;
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
  }, [active, exercise.tempo]);
  return <Figure exercise={exercise} t={active ? t : 0.5} showMuscles={false} className="thumb__svg" />;
}

export type { Pose };
