export type HolidayKey =
  | 'christmas'
  | 'new-year'
  | 'ramadan'
  | 'eid-al-adha'
  | 'lunar-new-year'
  | 'halloween'
  | null;

export interface HolidayConfig {
  key: HolidayKey;
  name: string;
  emoji: string;
  bannerMessage: string;
  /** Active date range (month is 1-based, day inclusive) */
  ranges: Array<{ startMonth: number; startDay: number; endMonth: number; endDay: number }>;
  /** CSS variable overrides injected into :root */
  cssVars: Record<string, string>;
  /** Decorative particle characters rendered on screen */
  particles: string[];
  particleCount: number;
}

export const HOLIDAYS: HolidayConfig[] = [
  {
    key: 'halloween',
    name: 'Halloween',
    emoji: '🎃',
    bannerMessage: '👻 Trick or treat! Spooky deals await this Halloween! 🦇',
    ranges: [{ startMonth: 10, startDay: 1, endMonth: 10, endDay: 31 }],
    cssVars: {
      '--primary': '28 80% 50%',
      '--primary-foreground': '0 0% 98%',
      '--background': '0 0% 6%',
      '--foreground': '28 80% 90%',
      '--card': '0 0% 9%',
      '--card-foreground': '28 80% 90%',
      '--accent': '28 80% 20%',
      '--accent-foreground': '28 80% 90%',
      '--border': '28 40% 20%',
      '--muted': '0 0% 13%',
      '--muted-foreground': '28 30% 60%',
    },
    particles: ['🦇', '🎃', '👻', '🕷️', '🕸️', '🌙'],
    particleCount: 18,
  },
  {
    key: 'christmas',
    name: 'Christmas',
    emoji: '🎄',
    bannerMessage: '🎄 Ho Ho Ho! Unwrap amazing Christmas deals — free shipping on orders over $50! 🎁',
    ranges: [{ startMonth: 12, startDay: 1, endMonth: 12, endDay: 26 }],
    cssVars: {
      '--primary': '142 60% 30%',
      '--primary-foreground': '0 0% 98%',
      '--background': '0 0% 98%',
      '--foreground': '142 20% 10%',
      '--card': '0 0% 100%',
      '--card-foreground': '142 20% 10%',
      '--accent': '0 72% 45%',
      '--accent-foreground': '0 0% 98%',
      '--border': '142 20% 85%',
      '--muted': '142 10% 94%',
      '--muted-foreground': '142 10% 40%',
    },
    particles: ['❄️', '🎄', '⭐', '🎁', '🔔', '🦌', '❄️', '✨'],
    particleCount: 25,
  },
  {
    key: 'new-year',
    name: "New Year's Eve",
    emoji: '🎆',
    bannerMessage: "🎆 Happy New Year! Ring in {year} with our best deals yet! 🥂",
    ranges: [
      { startMonth: 12, startDay: 27, endMonth: 12, endDay: 31 },
      { startMonth: 1, startDay: 1, endMonth: 1, endDay: 3 },
    ],
    cssVars: {
      '--primary': '240 80% 60%',
      '--primary-foreground': '0 0% 98%',
      '--background': '240 20% 5%',
      '--foreground': '60 80% 90%',
      '--card': '240 20% 8%',
      '--card-foreground': '60 80% 90%',
      '--accent': '45 90% 55%',
      '--accent-foreground': '240 20% 5%',
      '--border': '240 30% 20%',
      '--muted': '240 15% 12%',
      '--muted-foreground': '240 20% 60%',
    },
    particles: ['🎆', '✨', '🥂', '🎇', '⭐', '💫', '🌟', '🎉'],
    particleCount: 30,
  },
  {
    key: 'lunar-new-year',
    name: 'Lunar New Year',
    emoji: '🧧',
    bannerMessage: '🧧 Gong Xi Fa Cai! Celebrate Lunar New Year with exclusive festive offers! 🏮',
    // Approximate — Lunar New Year falls late Jan to mid Feb
    ranges: [{ startMonth: 1, startDay: 20, endMonth: 2, endDay: 20 }],
    cssVars: {
      '--primary': '0 85% 45%',
      '--primary-foreground': '45 90% 90%',
      '--background': '0 0% 98%',
      '--foreground': '0 30% 10%',
      '--card': '0 0% 100%',
      '--card-foreground': '0 30% 10%',
      '--accent': '45 90% 50%',
      '--accent-foreground': '0 30% 10%',
      '--border': '0 30% 85%',
      '--muted': '0 10% 94%',
      '--muted-foreground': '0 15% 45%',
    },
    particles: ['🏮', '🧧', '🐉', '🌸', '✨', '🎊', '🪔', '🌺'],
    particleCount: 20,
  },
  {
    key: 'ramadan',
    name: 'Ramadan',
    emoji: '🌙',
    bannerMessage: '🌙 Ramadan Mubarak! Special savings throughout the holy month. ✨',
    // Approximate — Ramadan shifts ~11 days each year; update yearly
    ranges: [{ startMonth: 2, startDay: 28, endMonth: 3, endDay: 30 }],
    cssVars: {
      '--primary': '220 60% 35%',
      '--primary-foreground': '45 80% 90%',
      '--background': '220 25% 8%',
      '--foreground': '45 80% 90%',
      '--card': '220 25% 11%',
      '--card-foreground': '45 80% 90%',
      '--accent': '45 70% 50%',
      '--accent-foreground': '220 25% 8%',
      '--border': '220 30% 22%',
      '--muted': '220 20% 15%',
      '--muted-foreground': '220 15% 55%',
    },
    particles: ['🌙', '⭐', '🕌', '✨', '🪔', '💫', '🌟'],
    particleCount: 20,
  },
  {
    key: 'eid-al-adha',
    name: 'Eid al-Adha',
    emoji: '🕌',
    bannerMessage: '🕌 Eid al-Adha Mubarak! Celebrate with special blessings and deals! 🌙',
    // Approximate — shifts yearly; roughly June/July
    ranges: [{ startMonth: 6, startDay: 5, endMonth: 6, endDay: 15 }],
    cssVars: {
      '--primary': '155 50% 35%',
      '--primary-foreground': '45 80% 95%',
      '--background': '155 20% 7%',
      '--foreground': '45 70% 90%',
      '--card': '155 20% 10%',
      '--card-foreground': '45 70% 90%',
      '--accent': '45 80% 55%',
      '--accent-foreground': '155 20% 7%',
      '--border': '155 25% 20%',
      '--muted': '155 15% 14%',
      '--muted-foreground': '155 15% 55%',
    },
    particles: ['🌙', '⭐', '🕌', '🌿', '✨', '💚', '🌟'],
    particleCount: 18,
  },
];

/** Returns the active holiday for a given date, or null if none. */
export function detectHoliday(date: Date = new Date()): HolidayConfig | null {
  const month = date.getMonth() + 1; // 1-based
  const day = date.getDate();

  for (const holiday of HOLIDAYS) {
    for (const range of holiday.ranges) {
      const afterStart =
        month > range.startMonth ||
        (month === range.startMonth && day >= range.startDay);
      const beforeEnd =
        month < range.endMonth ||
        (month === range.endMonth && day <= range.endDay);

      // Handle year-wrap (e.g. Dec 27 – Jan 3)
      if (range.startMonth > range.endMonth) {
        if (
          month > range.startMonth ||
          (month === range.startMonth && day >= range.startDay) ||
          month < range.endMonth ||
          (month === range.endMonth && day <= range.endDay)
        ) {
          return holiday;
        }
      } else if (afterStart && beforeEnd) {
        return holiday;
      }
    }
  }

  return null;
}