import React, { useState } from 'react';
import { UserRole, SystemNotification, User as UserType } from '../../types';
import { Wifi, WifiOff, LogOut, Factory, Menu, BookOpen, Database } from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter';
import { InstallPwaButton } from '../common/InstallPwaButton';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';
import { downloadBackupFile } from '../../services/backupService';

interface HeaderProps {
  currentUser: UserType | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  notifications: SystemNotification[];
  onRefreshData: () => void;
  onToggleMobileMenu?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentUser,
  currentRole,
  onRoleChange,
  onLogout,
  isOnline,
  pendingSyncCount,
  notifications,
  onRefreshData,
  onToggleMobileMenu
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentTheme } = useTheme();

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200/80 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-[200] shadow-xs font-sans transition-all">
      {/* Côté Gauche : Hamburger Mobile + Identité Visuelle Usine */}
      <div className="flex items-center gap-2 sm:gap-3 shrink-0">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200/80 active:scale-95 transition-all"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-900" />
          </button>
        )}

        {/* Logo BS Alvéoles officiel */}
        <div className="flex items-center gap-2">
          <div className="h-9 sm:h-10 px-2 py-1 rounded-xl bg-slate-50 border border-slate-200/80 shadow-xs flex items-center justify-center">
            <img 
              src="/logo-bs-alveoles.png" 
              alt="BS Alvéoles" 
              className="h-6 sm:h-7 w-auto object-contain"
            />
          </div>
          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-black text-slate-900 text-xs sm:text-sm tracking-tight">
                BS ALVÉOLES
              </span>
              <span className="text-[9px] font-black bg-slate-900 text-amber-400 px-1.5 py-0.2 rounded-md">
                ERP/MES
              </span>
            </div>
            <span className="text-[10px] text-slate-500 font-medium hidden md:block">
              Unité Industrielle de Pâte Moulée • Dakar
            </span>
          </div>
        </div>
      </div>

      {/* Côté Droit : Rôle, Notifications, Outils & Déconnexion */}
      <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
        {/* Sélecteur de rôle / Supervision (Directeur & Super Admin) */}
        {(currentRole === 'DIRECTEUR_USINE' || currentRole === 'SUPER_ADMIN') ? (
          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 rounded-xl px-2 py-1">
            <span className="text-[10px] text-slate-500 font-black uppercase tracking-wider hidden lg:inline">
              Vue :
            </span>
            <select 
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-transparent text-slate-900 text-xs font-black cursor-pointer focus:outline-none pr-1 max-w-[130px] sm:max-w-[180px] truncate"
            >
              <option value="DIRECTEUR_USINE">Directeur d'Usine</option>
              <option value="RESPONSABLE_PRODUCTION">Chef Production (TRS)</option>
              <option value="RESPONSABLE_STOCK">Magasinier (Stock)</option>
              <option value="COMMERCIAL">Commercial (Terrain)</option>
              <option value="RESPONSABLE_COMMERCIAL">Resp. Commercial</option>
              <option value="COMPTABLE">Responsable Finance</option>
              <option value="CONTROLEUR_AUDITEUR">Auditeur / Contrôle</option>
              <option value="SUPER_ADMIN">Super Administrateur</option>
            </select>
          </div>
        ) : (
          /* Badge Collaborateur verrouillé */
          <div className="flex items-center gap-1.5 bg-slate-100/80 border border-slate-200 rounded-xl px-2.5 py-1">
            <div className="w-5 h-5 rounded-lg bg-slate-900 text-amber-400 font-black text-[9px] flex items-center justify-center shrink-0">
              {currentUser?.name ? currentUser.name.slice(0, 2).toUpperCase() : 'US'}
            </div>
            <div className="text-left max-w-[100px] sm:max-w-[140px] truncate">
              <span className="text-xs font-bold text-slate-900 truncate block">
                {currentUser?.name?.split(' ')[0] || 'Utilisateur'}
              </span>
            </div>
          </div>
        )}

        <div className="hidden sm:block">
          <ThemeSwitcher />
        </div>

        <NotificationCenter 
          notifications={notifications}
          onRefreshData={onRefreshData}
        />

        {/* Bouton Sauvegarde Rapide JSON (Test 12 CDC) */}
        <button
          onClick={async () => {
            try {
              await downloadBackupFile(currentUser?.name || 'Direction Usine', currentRole);
            } catch (e) {
              alert('Erreur lors du téléchargement de la sauvegarde.');
            }
          }}
          className="hidden md:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 text-xs font-bold transition-all shadow-2xs active:scale-95"
          title="Sauvegarde instantanée : Télécharger l'intégralité de la base de données usine au format JSON"
        >
          <Database className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sauvegarder</span>
        </button>

        {/* Bouton Manuel Utilisateur & Guide Opérationnel */}
        <a
          href="/MANUEL_UTILISATEUR_BS_ALVEOLES.html"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-200 text-xs font-bold transition-all shadow-2xs active:scale-95"
          title="Consulter ou imprimer le guide complet d'utilisation (PDF)"
        >
          <BookOpen className="w-3.5 h-3.5 text-amber-700" />
          <span>Manuel PDF</span>
        </a>

        {/* Indicateur En ligne / Hors-ligne discret */}
        <div 
          className={`flex items-center gap-1 px-2 py-1 rounded-xl text-[11px] font-bold border transition-colors ${
            isOnline 
              ? 'bg-emerald-50/80 border-emerald-200 text-emerald-800' 
              : 'bg-amber-50 border-amber-300 text-amber-800 animate-pulse'
          }`}
          title={isOnline ? 'Connecté au réseau' : 'Mode hors-ligne actif (IndexedDB local)'}
        >
          <span className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-amber-500'}`} />
          <span className="hidden md:inline">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
        </div>

        {/* Bouton de déconnexion */}
        <button
          onClick={onLogout}
          className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl text-slate-600 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors active:scale-95"
          title="Se déconnecter de la session"
        >
          <LogOut className="w-4 h-4 text-slate-600" />
          <span className="text-xs font-bold hidden sm:inline text-slate-700">Sortir</span>
        </button>
      </div>
    </header>
  );
};

