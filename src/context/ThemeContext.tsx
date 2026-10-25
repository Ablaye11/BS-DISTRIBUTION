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
}

export const THEMES: Record<ThemeName, ThemeDefinition> = {
  blue: {
    id: 'blue',
    name: 'Bleu Roi & Blanc',
    subtitle: 'Standard Corporate & Industriel',
    emoji: '🔵',
    hex: '#2563eb',
    gradient: 'from-blue-600 via-indigo-600 to-blue-700',
    buttonClass: 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-500/25',
    badgeClass: 'bg-blue-100 text-blue-800 border-blue-300',
    sidebarActiveClass: 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 font-black',
    logoBadgeClass: 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white',
    cardHighlight: 'border-blue-400 bg-blue-50/30',
    textAccentClass: 'text-blue-600',
    ringClass: 'ring-blue-500'
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
    ringClass: 'ring-red-500'
  },
  amber: {
    id: 'amber',
    name: 'Or Kraft & Ambre',
    subtitle: 'Couleur Carton Recyclé & Alvéoles',
    emoji: '🟡',
    hex: '#f59e0b',
    gradient: 'from-amber-500 via-amber-600 to-amber-700',
    buttonClass: 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/25',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-300',
    sidebarActiveClass: 'bg-gradient-to-r from-amber-500 to-amber-600 text-slate-950 shadow-md shadow-amber-500/30 font-black',
    logoBadgeClass: 'bg-gradient-to-tr from-amber-500 to-amber-400 text-slate-950',
    cardHighlight: 'border-amber-400 bg-amber-50/30',
    textAccentClass: 'text-amber-600',
    ringClass: 'ring-amber-500'
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
    ringClass: 'ring-emerald-500'
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
