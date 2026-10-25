import React, { useState } from 'react';
import { UserRole, SystemNotification, User as UserType } from '../../types';
import { Wifi, WifiOff, LogOut, Globe, Factory, Menu } from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter';
import { InstallPwaButton } from '../common/InstallPwaButton';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { useTheme } from '../../context/ThemeContext';

interface HeaderProps {
  currentUser: UserType | null;
  currentRole: UserRole;
  onRoleChange: (role: UserRole) => void;
  onLogout: () => void;
  isOnline: boolean;
  pendingSyncCount: number;
  notifications: SystemNotification[];
  onRefreshData: () => void;
  onOpenPublicPortal?: () => void;
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
  onOpenPublicPortal,
  onToggleMobileMenu
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const { currentTheme } = useTheme();

  return (
    <header className="h-14 sm:h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 sm:px-4 md:px-6 flex items-center justify-between sticky top-0 z-[200] shadow-sm font-sans">
      {/* Bouton Hamburger Mobile + Identité Usine */}
      <div className="flex items-center gap-2 sm:gap-3">
        {onToggleMobileMenu && (
          <button
            onClick={onToggleMobileMenu}
            className="md:hidden p-2 rounded-xl text-slate-700 hover:text-slate-950 hover:bg-slate-100 border border-slate-200 active:scale-95 transition-all"
            aria-label="Ouvrir le menu"
          >
            <Menu className="w-5 h-5 text-slate-800" />
          </button>
        )}

        <div className={`h-9 sm:h-10 px-2 sm:px-2.5 py-1 rounded-xl ${currentTheme.logoBadgeClass} font-black flex items-center gap-1.5 shadow-sm shrink-0 transition-colors`}>
          <Factory className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="text-[11px] sm:text-xs font-black tracking-wider">BS ALVÉOLES</span>
        </div>

        <div className="min-w-0">
          <div className="flex items-center gap-1 sm:gap-1.5 truncate">
            <h1 className="font-extrabold text-slate-900 text-xs sm:text-sm md:text-base tracking-tight truncate">
              Unité Pâte Moulée
            </h1>
            <span className="text-[9px] sm:text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 px-1.5 py-0.2 rounded-full shrink-0">
              SN
            </span>
          </div>
          <p className="text-[10px] text-slate-500 font-medium hidden md:block">
            Production d'Alvéoles 30 Œufs & Boîtes 6/10/12 • 100% Recyclé
          </p>
        </div>
      </div>

      {/* Contrôles droits */}
      <div className="flex items-center gap-1.5 sm:gap-2.5">
        <ThemeSwitcher />
        <InstallPwaButton compact={true} />

        {onOpenPublicPortal && (
          <button
            onClick={onOpenPublicPortal}
            className="px-2.5 sm:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-bold text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            title="Ouvrir la Vitrine Publique et Catalogue"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Vitrine</span>
          </button>
        )}

        <NotificationCenter 
          notifications={notifications}
          onRefreshData={onRefreshData}
        />

        {/* Statut connexion */}
        <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold border ${
          isOnline 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
          <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
        </div>

        {/* Sélecteur de rôle / profil usine */}
        <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1">
          <span className="text-[11px] text-slate-500 font-bold">Rôle :</span>
          <select 
            value={currentRole}
            onChange={(e) => onRoleChange(e.target.value as UserRole)}
            className="bg-white text-slate-800 text-xs font-bold rounded-lg px-2 py-0.5 border border-slate-200 cursor-pointer shadow-sm focus:outline-none"
          >
            <option value="DIRECTEUR_USINE">Directeur d'Usine</option>
            <option value="RESPONSABLE_PRODUCTION">Chef de Production (TRS)</option>
            <option value="RESPONSABLE_STOCK">Responsable Stocks & Cartons</option>
            <option value="RESPONSABLE_COMMERCIAL">Responsable Commercial</option>
            <option value="COMPTABLE">Comptabilité & Finances</option>
            <option value="SUPER_ADMIN">Super Administrateur</option>
          </select>
        </div>

        {/* Bouton déconnexion */}
        <button
          onClick={onLogout}
          className="p-2 rounded-xl text-slate-500 hover:text-red-600 hover:bg-red-50 border border-slate-200 transition-colors"
          title="Déconnexion"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
