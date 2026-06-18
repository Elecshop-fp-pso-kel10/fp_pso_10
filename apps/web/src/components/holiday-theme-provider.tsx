'use client';

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from 'react';
import { HolidayConfig, detectHoliday } from '@/lib/holidays';

interface HolidayThemeContextType {
  holiday: HolidayConfig | null;
  isActive: boolean;
}

const HolidayThemeContext = createContext<HolidayThemeContextType>({
  holiday: null,
  isActive: false,
});

export function HolidayThemeProvider({ children }: { children: ReactNode }) {
  const [holiday, setHoliday] = useState<HolidayConfig | null>(null);

  useEffect(() => {
    // TESTING — hardcode tanggal, ganti sesuai holiday yang mau ditest:
    const detected = detectHoliday(new Date('2026-6-18')); // 🎃 Halloween
    // const detected = detectHoliday(new Date('2024-12-10')); // 🎄 Christmas
    // const detected = detectHoliday(new Date('2024-12-28')); // 🎆 New Year
    // const detected = detectHoliday(new Date('2024-06-10')); // 🕌 Eid al-Adha

    setHoliday(detected);

    if (detected) {
        const root = document.documentElement;
        Object.entries(detected.cssVars).forEach(([key, value]) => {
        root.style.setProperty(key, value);
        });
    }

    return () => {
        if (detected) {
        const root = document.documentElement;
        Object.keys(detected.cssVars).forEach((key) => {
            root.style.removeProperty(key);
        });
        }
    };
    }, []);

  return (
    <HolidayThemeContext.Provider value={{ holiday, isActive: !!holiday }}>
      {children}
    </HolidayThemeContext.Provider>
  );
}

export function useHolidayTheme() {
  return useContext(HolidayThemeContext);
}