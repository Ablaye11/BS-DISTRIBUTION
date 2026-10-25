import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check } from 'lucide-react';
import { useTheme, THEMES, ThemeName } from '../../context/ThemeContext';

export const ThemeSwitcher: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
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

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 text-xs font-bold rounded-xl shadow-sm transition-all active:scale-95"
        title="Changer les couleurs du logiciel"
      >
        <span className="w-3.5 h-3.5 rounded-full shrink-0 shadow-inner" style={{ backgroundColor: currentTheme.hex }}></span>
        <Palette className="w-3.5 h-3.5 text-slate-600 hidden sm:inline" />
        <span className="text-[11px] font-bold hidden md:inline">{currentTheme.name.split(' ')[0]}</span>
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 p-2.5 z-[350] animate-fadeIn font-sans">
          <div className="px-2.5 py-1.5 mb-1.5 border-b border-slate-100 flex items-center justify-between">
            <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500">
              Couleur & Charte Graphique
            </span>
            <span className="text-[10px] text-slate-400 font-medium">1 clic</span>
          </div>

          <div className="space-y-1">
            {(Object.keys(THEMES) as ThemeName[]).map((key) => {
              const item = THEMES[key];
              const isSelected = theme === key;

              return (
                <button
                  key={key}
                  onClick={() => {
                    setTheme(key);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-all ${
                    isSelected
                      ? 'bg-slate-100 font-black text-slate-950 shadow-sm'
                      : 'hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <span 
                      className="w-4 h-4 rounded-full shadow-md shrink-0 flex items-center justify-center border border-white"
                      style={{ backgroundColor: item.hex }}
                    />
                    <div>
                      <div className="text-xs font-bold flex items-center gap-1.5">
                        {item.name}
                        {key === 'blue' && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-blue-100 text-blue-800 font-black">
                            Recommandé
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        {item.subtitle}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
