'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { useHolidayTheme } from './holiday-theme-provider';

export function HolidayBanner() {
  const { holiday } = useHolidayTheme();
  const [dismissed, setDismissed] = useState(false);

  if (!holiday || dismissed) return null;

  const currentYear = new Date().getFullYear();
  const message = holiday.bannerMessage.replace('{year}', String(currentYear));

  return (
    <div
      className="holiday-banner"
      role="banner"
      aria-label={`${holiday.name} promotion`}
    >
      <span className="holiday-banner__text">{message}</span>
      <button
        onClick={() => setDismissed(true)}
        className="holiday-banner__close"
        aria-label="Dismiss holiday banner"
      >
        <X className="h-4 w-4" />
      </button>

      <style>{`
        .holiday-banner {
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 10px 48px 10px 16px;
          background: hsl(var(--accent));
          color: hsl(var(--accent-foreground));
          font-size: 0.875rem;
          font-weight: 500;
          text-align: center;
          min-height: 44px;
          overflow: hidden;
          animation: holiday-banner-slide-in 0.4s ease-out;
          z-index: 60;
        }

        .holiday-banner::before {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            90deg,
            transparent 0%,
            hsl(var(--primary) / 0.15) 50%,
            transparent 100%
          );
          animation: holiday-shimmer 3s ease-in-out infinite;
        }

        .holiday-banner__text {
          position: relative;
          z-index: 1;
          letter-spacing: 0.01em;
        }

        .holiday-banner__close {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          display: flex;
          align-items: center;
          justify-content: center;
          width: 28px;
          height: 28px;
          border-radius: 50%;
          background: hsl(var(--accent-foreground) / 0.15);
          color: hsl(var(--accent-foreground));
          border: none;
          cursor: pointer;
          transition: background 0.15s;
          z-index: 1;
        }

        .holiday-banner__close:hover {
          background: hsl(var(--accent-foreground) / 0.25);
        }

        @keyframes holiday-banner-slide-in {
          from { transform: translateY(-100%); opacity: 0; }
          to   { transform: translateY(0);    opacity: 1; }
        }

        @keyframes holiday-shimmer {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%);  }
        }
      `}</style>
    </div>
  );
}