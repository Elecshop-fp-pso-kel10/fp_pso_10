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
    const detected = detectHoliday(new Date()); 

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