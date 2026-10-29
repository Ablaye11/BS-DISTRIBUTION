/**
 * ExportPdfButton.tsx
 * Bouton d'export PDF réutilisable pour tous les modules BS ALVÉOLES
 */

import React, { useState } from 'react';
import { FileDown, Loader2, CheckCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ExportPdfButtonProps {
  onExport: () => void;
  label?: string;
  variant?: 'default' | 'ghost' | 'outline';
  size?: 'sm' | 'md';
  className?: string;
}

export const ExportPdfButton: React.FC<ExportPdfButtonProps> = ({
  onExport,
  label = 'Exporter PDF',
  variant = 'default',
  size = 'md',
  className = '',
}) => {
  const { currentTheme } = useTheme();
  const [status, setStatus] = useState<'idle' | 'loading' | 'done'>('idle');

  const handleClick = () => {
    setStatus('loading');
    // Simule un délai de génération
    setTimeout(() => {
      try {
        onExport();
        setStatus('done');
        setTimeout(() => setStatus('idle'), 2500);
      } catch (err) {
        console.error('Erreur export PDF:', err);
        setStatus('idle');
      }
    }, 600);
  };

  const sizeClasses = size === 'sm'
    ? 'px-2.5 py-1.5 text-[11px] gap-1.5'
    : 'px-4 py-2 text-xs gap-2';

  const variantClasses = variant === 'ghost'
    ? 'bg-transparent hover:bg-white/10 text-white border border-white/20'
    : variant === 'outline'
    ? 'bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 shadow-sm'
    : `bg-gradient-to-r ${currentTheme.gradient} text-white shadow-md hover:opacity-90`;

  return (
    <button
      onClick={handleClick}
      disabled={status !== 'idle'}
      className={`
        inline-flex items-center font-bold rounded-xl transition-all
        active:scale-95 disabled:cursor-not-allowed disabled:opacity-70
        ${sizeClasses} ${variantClasses} ${className}
      `}
      title="Exporter en PDF"
    >
      {status === 'loading' ? (
        <>
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
          <span>Génération…</span>
        </>
      ) : status === 'done' ? (
        <>
          <CheckCircle className="w-3.5 h-3.5" />
          <span>Téléchargé !</span>
        </>
      ) : (
        <>
          <FileDown className="w-3.5 h-3.5" />
          <span>{label}</span>
        </>
      )}
    </button>
  );
};
