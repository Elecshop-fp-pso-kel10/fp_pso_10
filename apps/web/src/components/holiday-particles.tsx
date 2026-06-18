'use client';

import { useEffect, useState, useRef } from 'react';
import { useHolidayTheme } from './holiday-theme-provider';

interface Particle {
  id: number;
  emoji: string;
  x: number;       // vw %
  delay: number;   // seconds
  duration: number; // seconds
  size: number;    // px
  sway: number;    // px lateral sway
  rotation: number; // max deg rotation
}

export function HolidayParticles() {
  const { holiday } = useHolidayTheme();
  const [particles, setParticles] = useState<Particle[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!holiday) {
      setParticles([]);
      return;
    }

    // Respect prefers-reduced-motion
    const prefersReduced = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;
    if (prefersReduced) return;

    const count = holiday.particleCount;
    const emojis = holiday.particles;

    const generated: Particle[] = Array.from({ length: count }, (_, i) => ({
      id: i,
      emoji: emojis[i % emojis.length],
      x: Math.random() * 96 + 2,          // 2vw – 98vw
      delay: Math.random() * 8,            // 0 – 8s stagger
      duration: 8 + Math.random() * 10,   // 8 – 18s fall
      size: 16 + Math.random() * 14,      // 16 – 30px
      sway: 30 + Math.random() * 60,      // 30 – 90px
      rotation: 180 + Math.random() * 360,
    }));

    setParticles(generated);
  }, [holiday]);

  if (!holiday || particles.length === 0) return null;

  return (
    <div
      ref={containerRef}
      aria-hidden="true"
      className="holiday-particles"
    >
      {particles.map((p) => (
        <span
          key={p.id}
          className="holiday-particle"
          style={
            {
              left: `${p.x}vw`,
              fontSize: `${p.size}px`,
              '--delay': `${p.delay}s`,
              '--duration': `${p.duration}s`,
              '--sway': `${p.sway}px`,
              '--rotation': `${p.rotation}deg`,
            } as React.CSSProperties
          }
        >
          {p.emoji}
        </span>
      ))}

      <style>{`
        .holiday-particles {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          z-index: 9998;
          overflow: hidden;
        }

        .holiday-particle {
          position: absolute;
          top: -60px;
          display: block;
          user-select: none;
          line-height: 1;
          animation:
            holiday-fall var(--duration) var(--delay) ease-in infinite,
            holiday-sway var(--duration) var(--delay) ease-in-out infinite;
          will-change: transform, opacity;
        }

        @keyframes holiday-fall {
          0% {
            transform: translateY(-60px) rotate(0deg);
            opacity: 0;
          }
          5% {
            opacity: 1;
          }
          90% {
            opacity: 0.8;
          }
          100% {
            transform: translateY(110vh) rotate(var(--rotation));
            opacity: 0;
          }
        }

        @keyframes holiday-sway {
          0%   { margin-left: 0px; }
          25%  { margin-left: var(--sway); }
          75%  { margin-left: calc(var(--sway) * -1); }
          100% { margin-left: 0px; }
        }

        @media (prefers-reduced-motion: reduce) {
          .holiday-particle {
            animation: none;
            display: none;
          }
        }
      `}</style>
    </div>
  );
}