import React, { useEffect, useState } from 'react';
import { Smartphone, Download, Check } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export const InstallPwaButton: React.FC<{ className?: string; compact?: boolean }> = ({ 
  className = '', 
  compact = false 
}) => {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showIosGuide, setShowIosGuide] = useState(false);

  useEffect(() => {
    // Vérifier si déjà en mode standalone
    if (window.matchMedia('(display-mode: standalone)').matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);

    window.addEventListener('appinstalled', () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    });

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
    };
  }, []);

  const handleInstallClick = async () => {
    // Si Android / Chrome avec prompt natif
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const choice = await deferredPrompt.userChoice;
      if (choice.outcome === 'accepted') {
        setIsInstalled(true);
      }
      setDeferredPrompt(null);
      return;
    }

    // Si iOS / Safari ou déjà installé ou pas de prompt automatique
    const isIos = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    if (isIos) {
      setShowIosGuide(true);
    } else {
      alert("Pour installer l'application sur votre écran d'accueil :\n1. Ouvrez le menu de votre navigateur (les 3 points en haut à droite)\n2. Cliquez sur 'Installer l'application' ou 'Ajouter à l'écran d'accueil'.");
    }
  };

  if (isInstalled) {
    return null;
  }

  return (
    <>
      <button
        onClick={handleInstallClick}
        className={className || `flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all active:scale-95`}
        title="Installer l'application sur votre smartphone"
      >
        <Smartphone className="w-4 h-4 text-slate-950 animate-pulse" />
        <span>{compact ? 'Installer App' : '📲 Installer sur Mobile'}</span>
      </button>

      {/* Guide d'installation iOS Safari */}
      {showIosGuide && (
        <div className="fixed inset-0 z-[400] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 text-slate-900 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-extrabold text-sm flex items-center gap-2">
                <Smartphone className="w-5 h-5 text-amber-500" />
                Installer sur iPhone / iPad
              </h3>
              <button onClick={() => setShowIosGuide(false)} className="text-slate-400 hover:text-slate-600 p-1">
                ✕
              </button>
            </div>
            <div className="text-xs space-y-2 text-slate-600">
              <p>Pour l'installer comme une vraie application sur votre iPhone :</p>
              <div className="p-3 bg-slate-50 rounded-xl space-y-1.5 font-medium">
                <div>1. Appuyez sur le bouton <strong>Partager</strong> en bas de Safari (icône carré avec flèche vers le haut 📤).</div>
                <div>2. Faites défiler vers le bas et sélectionnez <strong>« Sur l'écran d'accueil »</strong> ➕.</div>
                <div>3. Appuyez sur <strong>Ajouter</strong> en haut à droite.</div>
              </div>
              <p className="text-[11px] text-emerald-600 font-semibold">
                L'icône BS ALVÉOLES apparaîtra sur votre écran d'accueil et s'ouvrira en plein écran sans barre Safari !
              </p>
            </div>
            <button
              onClick={() => setShowIosGuide(false)}
              className="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-bold"
            >
              J'ai compris
            </button>
          </div>
        </div>
      )}
    </>
  );
};
