import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeName = 'blue' | 'red' | 'amber' | 'green';

export interface ThemeDefinition {
  id: ThemeName;
  name: string;
  subtitle: string;
  emoji: string;
  hex: string;
  gradient: string;
  buttonClass: string;
  badgeClass: string;
  sidebarActiveClass: string;
  logoBadgeClass: string;
  cardHighlight: string;
  textAccentClass: string;
  ringClass: string;
  bgApp: string;
  bannerBg: string;
  bannerGlow: string;
  bannerBadge: string;
  sidebarBg: string;
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  blue: {
    id: 'blue',
    name: 'Bleu Marine & Kraft (Logo Officiel)',
    subtitle: 'Charte Officielle BS Alvéoles SUARL',
    emoji: '🏛️',
    hex: '#1E3A5F',
    gradient: 'from-[#1E3A5F] via-[#23456F] to-[#142842]',
    buttonClass: 'bg-[#1E3A5F] hover:bg-[#152a45] text-white shadow-[#1E3A5F]/25',
    badgeClass: 'bg-[#1E3A5F]/10 text-[#1E3A5F] border-[#1E3A5F]/20',
    sidebarActiveClass: 'bg-gradient-to-r from-[#1E3A5F] to-[#254b7b] text-white shadow-md shadow-[#1E3A5F]/40 font-bold border-l-2 border-[#C49B66]',
    logoBadgeClass: 'bg-gradient-to-tr from-[#1E3A5F] to-[#254b7b] text-white',
    cardHighlight: 'border-[#1E3A5F]/40 bg-[#1E3A5F]/5',
    textAccentClass: 'text-[#1E3A5F]',
    ringClass: 'ring-[#1E3A5F]',
    bgApp: 'bg-[#f8fafc]',
    bannerBg: 'bg-gradient-to-r from-[#0c1726] via-[#142842] to-[#0c1726] border-[#1E3A5F]/40 shadow-[#0c1726]/40',
    bannerGlow: 'bg-[#1E3A5F]/30',
    bannerBadge: 'bg-[#1E3A5F]/30 text-sky-200 border-[#1E3A5F]/50',
    sidebarBg: 'bg-[#0c1726] border-r border-[#1E3A5F]/20'
  },
  red: {
    id: 'red',
    name: 'Rouge Rubis & Blanc',
    subtitle: 'Dynamique, Énergique & Distinctif',
    emoji: '🔴',
    hex: '#dc2626',
    gradient: 'from-red-600 via-rose-600 to-red-700',
    buttonClass: 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/25',
    badgeClass: 'bg-red-100 text-red-800 border-red-300',
    sidebarActiveClass: 'bg-gradient-to-r from-red-600 to-rose-600 text-white shadow-md shadow-red-500/30 font-black',
    logoBadgeClass: 'bg-gradient-to-tr from-red-600 to-rose-500 text-white',
    cardHighlight: 'border-red-400 bg-red-50/30',
    textAccentClass: 'text-red-600',
    ringClass: 'ring-red-500',
    bgApp: 'bg-[#f8fafc]',
    bannerBg: 'bg-gradient-to-r from-slate-950 via-red-950 to-slate-900 border-red-900/40 shadow-red-950/30',
    bannerGlow: 'bg-red-500/20',
    bannerBadge: 'bg-red-500/25 text-red-300 border-red-400/40',
    sidebarBg: 'bg-[#180a0f] border-r border-slate-800/90'
  },
  amber: {
    id: 'amber',
    name: 'Doré Kraft & Miel Alvéoles',
    subtitle: 'Teinte naturelle du carton recyclé',
    emoji: '🍯',
    hex: '#C49B66',
    gradient: 'from-[#C49B66] via-[#B88E58] to-[#A87E48]',
    buttonClass: 'bg-[#C49B66] hover:bg-[#B88E58] text-slate-950 font-bold shadow-[#C49B66]/25',
    badgeClass: 'bg-[#C49B66]/15 text-[#855e2d] border-[#C49B66]/30',
    sidebarActiveClass: 'bg-gradient-to-r from-[#C49B66] to-[#B88E58] text-slate-950 shadow-md font-bold',
    logoBadgeClass: 'bg-gradient-to-tr from-[#C49B66] to-[#B88E58] text-white',
    cardHighlight: 'border-[#C49B66]/40 bg-[#C49B66]/5',
    textAccentClass: 'text-[#A87E48]',
    ringClass: 'ring-[#C49B66]',
    bgApp: 'bg-[#f8fafc]',
    bannerBg: 'bg-gradient-to-r from-[#14120f] via-[#211d17] to-[#14120f] border-[#C49B66]/30 shadow-[#14120f]/40',
    bannerGlow: 'bg-[#C49B66]/20',
    bannerBadge: 'bg-[#C49B66]/25 text-[#f0dfc8] border-[#C49B66]/40',
    sidebarBg: 'bg-[#14120f] border-r border-[#C49B66]/20'
  },
  green: {
    id: 'green',
    name: 'Vert Écologique',
    subtitle: 'Industrie Verte & Développement Durable',
    emoji: '🟢',
    hex: '#059669',
    gradient: 'from-emerald-600 via-teal-600 to-emerald-700',
    buttonClass: 'bg-emerald-600 hover:bg-emerald-500 text-white shadow-emerald-500/25',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    sidebarActiveClass: 'bg-gradient-to-r from-emerald-600 to-teal-600 text-white shadow-md shadow-emerald-500/30 font-black',
    logoBadgeClass: 'bg-gradient-to-tr from-emerald-600 to-teal-500 text-white',
    cardHighlight: 'border-emerald-400 bg-emerald-50/30',
    textAccentClass: 'text-emerald-600',
    ringClass: 'ring-emerald-500',
    bgApp: 'bg-[#f8fafc]',
    bannerBg: 'bg-gradient-to-r from-slate-950 via-emerald-950 to-slate-900 border-emerald-900/40 shadow-emerald-950/30',
    bannerGlow: 'bg-emerald-500/20',
    bannerBadge: 'bg-emerald-500/25 text-emerald-300 border-emerald-400/40',
    sidebarBg: 'bg-[#091913] border-r border-slate-800/90'
  }
};

interface ThemeContextType {
  theme: ThemeName;
  setTheme: (theme: ThemeName) => void;
  currentTheme: ThemeDefinition;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<ThemeName>(() => {
    const saved = localStorage.getItem('bs_theme') as ThemeName;
    return saved && THEMES[saved] ? saved : 'blue'; // BLEU ROI PAR DÉFAUT !
  });

  const setTheme = (newTheme: ThemeName) => {
    setThemeState(newTheme);
    localStorage.setItem('bs_theme', newTheme);
  };

  useEffect(() => {
    const def = THEMES[theme];
    document.documentElement.setAttribute('data-theme', theme);
    document.documentElement.style.setProperty('--primary', def.hex);
    
    // Mettre à jour theme-color pour le navigateur mobile
    const metaThemeColor = document.querySelector('meta[name="theme-color"]');
    if (metaThemeColor) {
      metaThemeColor.setAttribute('content', def.hex);
    }
  }, [theme]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, currentTheme: THEMES[theme] }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return ctx;
};
