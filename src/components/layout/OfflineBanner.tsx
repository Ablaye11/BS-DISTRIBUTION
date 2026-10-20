import React from 'react';
import { WifiOff, RefreshCw } from 'lucide-react';

interface OfflineBannerProps {
  isOnline: boolean;
  pendingCount: number;
}

export const OfflineBanner: React.FC<OfflineBannerProps> = ({ isOnline, pendingCount }) => {
  if (isOnline && pendingCount === 0) return null;

  return (
    <div className={`w-full py-2 px-4 text-xs font-semibold flex items-center justify-between shadow-md transition-all ${
      !isOnline 
        ? 'bg-amber-500 text-slate-950' 
        : 'bg-emerald-600 text-white'
    }`}>
      <div className="flex items-center gap-2 max-w-7xl mx-auto w-full justify-between">
        <div className="flex items-center gap-2">
          {!isOnline ? (
            <>
              <WifiOff className="w-4 h-4 animate-bounce" />
              <span>
                <strong>Mode Hors-ligne Actif :</strong> Vous pouvez continuer à saisir des prospects, ventes et dépenses. Les données sont sauvegardées en local sur cet appareil.
              </span>
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>
                <strong>Reconnexion réseau :</strong> Synchronisation automatique en cours des {pendingCount} opération(s) en attente...
              </span>
            </>
          )}
        </div>
        <span className="text-[10px] uppercase tracking-wider font-extrabold bg-slate-950/20 px-2 py-0.5 rounded">
          PWA Offline Engine
        </span>
      </div>
    </div>
  );
};
