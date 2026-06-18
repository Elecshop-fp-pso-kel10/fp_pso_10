'use client';

import { HolidayThemeProvider } from './holiday-theme-provider';
import { HolidayBanner } from './holiday-banner';
import { HolidayParticles } from './holiday-particles';

export function HolidayShell({ children }: { children: React.ReactNode }) {
  return (
    <HolidayThemeProvider>
      <HolidayBanner />
      {children}
      <HolidayParticles />
    </HolidayThemeProvider>
  );
}