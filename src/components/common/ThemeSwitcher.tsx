import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, ThemeName } from '../../context/ThemeContext';

interface ThemeSwitcherProps {
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ compact = false }) => {
  const { theme, setTheme, currentTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ── Mode compact (sidebar) : 4 pastilles colorées ────────────────
  if (compact) {
    return (
      <div className="flex items-center gap-1.5">
        {(Object.keys(THEMES) as ThemeName[]).map(key => (
          <button
            key={key}
            onClick={() => setTheme(key)}
            title={THEMES[key].name}
            className={`w-5 h-5 rounded-full transition-all hover:scale-110 ${
              theme === key
                ? 'ring-2 ring-white ring-offset-1 ring-offset-slate-900 scale-110'
                : 'opacity-50 hover:opacity-90'
            }`}
            style={{ backgroundColor: THEMES[key].hex }}
          />
        ))}
      </div>
    );
  }

  // ── Mode normal (header) : bouton + dropdown ─────────────────────
  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
        title="Changer les couleurs du logiciel"
      >
        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: currentTheme.hex }} />
        <Palette className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
        <span className="text-[11px] font-bold hidden md:inline">{currentTheme.name.split(' ')[0]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-[350] font-sans">
          <div className="px-2.5 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Charte Graphique
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1 clic</span>
          </div>

          <div className="space-y-1">
            {(Object.keys(THEMES) as ThemeName[]).map(key => {
              const item = THEMES[key];
              const isSelected = theme === key;
              return (
                <button
                  key={key}
                  onClick={() => { setTheme(key); setIsOpen(false); }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    isSelected ? 'bg-slate-100 text-slate-950 shadow-sm' : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span
                      className="w-4 h-4 rounded-full shadow-md shrink-0 border border-white"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {item.name}
                        {key === 'blue' && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#1E3A5F]/15 text-[#1E3A5F] font-black border border-[#1E3A5F]/20">Officiel</span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400">{item.subtitle}</div>
                    </div>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-emerald-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
