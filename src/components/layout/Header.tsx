import React, { useState } from 'react';
import { UserRole, SystemNotification, User as UserType } from '../../types';
import { Wifi, WifiOff, LogOut, X, Globe } from 'lucide-react';
import { NotificationCenter } from '../common/NotificationCenter';

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
  onOpenPublicPortal
}) => {
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  return (
    <header className="h-16 bg-white/95 backdrop-blur-md border-b border-slate-200 px-3 md:px-6 flex items-center justify-between sticky top-0 z-[200] shadow-sm font-sans">
      {/* Brand Identity with Official Logo Image */}
      <div className="flex items-center gap-2.5">
        <div className="h-10 px-2 py-0.5 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center shrink-0 shadow-sm">
          <img 
            src="/logo.png" 
            alt="BS DISTRIBUTION Logo Officiel" 
            className="h-8 w-auto object-contain"
          />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <h1 className="font-extrabold text-slate-900 text-sm md:text-base tracking-tight font-display">BS DISTRIBUTION</h1>
            <span className="text-[9px] md:text-[10px] font-extrabold bg-amber-500/15 text-amber-800 border border-amber-500/30 px-1.5 py-0.2 rounded">SUARL</span>
          </div>
          <p className="text-[9px] md:text-[10px] text-slate-500 font-medium hidden lg:block">Vente d'Œufs & Gestion Financière — Keur Massar</p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2">
        {/* Public Portal Button */}
        {onOpenPublicPortal && (
          <button
            onClick={onOpenPublicPortal}
            className="px-2.5 md:px-3 py-1.5 bg-amber-50 hover:bg-amber-100 border border-amber-300 text-amber-900 font-extrabold text-[11px] md:text-xs rounded-xl shadow-sm flex items-center gap-1.5 transition-all"
            title="Ouvrir le Portail Public de Commandes et Partenariats"
          >
            <Globe className="w-3.5 h-3.5 text-amber-600" />
            <span className="hidden sm:inline">Portail Public</span>
          </button>
        )}

        {/* Real-time Notifications Bell */}
        <NotificationCenter 
          notifications={notifications}
          onRefreshData={onRefreshData}
        />

        {/* Network Status Badge */}
        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-[10px] md:text-xs font-bold border ${
          isOnline 
            ? 'bg-emerald-50 border-emerald-200 text-emerald-700' 
            : 'bg-amber-50 border-amber-200 text-amber-800'
        }`}>
          {isOnline ? <Wifi className="w-3 h-3" /> : <WifiOff className="w-3 h-3 animate-pulse" />}
          <span className="hidden sm:inline">{isOnline ? 'En ligne' : 'Hors-ligne'}</span>
          {pendingSyncCount > 0 && (
            <span className="bg-amber-500 text-white px-1 rounded-full text-[9px] font-extrabold">
              {pendingSyncCount}
            </span>
          )}
        </div>

        {/* Role Switcher Selector — Condition basée sur le rôle RÉEL de connexion (currentUser.role) */}
        {(currentUser?.role === 'ADMIN_GENERAL' || currentUser?.role === 'SUPER_ADMIN') ? (
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-inner">
            <span className="text-xs text-slate-500 font-bold">Vue :</span>
            <select 
              value={currentRole}
              onChange={(e) => onRoleChange(e.target.value as UserRole)}
              className="bg-white text-slate-800 text-xs font-bold rounded-lg px-2.5 py-1 focus:outline-none border border-slate-200 cursor-pointer shadow-sm"
            >
              <option value="ADMIN_GENERAL">Admin Général</option>
              <option value="COMMERCIAL">Commercial</option>
              <option value="DEMARCHEUR">Démarcheur</option>
              <option value="COMPTABLE">Comptable & Stock</option>
              <option value="SUPER_ADMIN">Super Admin</option>
            </select>
            {/* Indicateur visuel si l'Admin simule un autre rôle */}
            {currentRole !== currentUser?.role && (
              <span className="text-[10px] font-extrabold bg-violet-100 text-violet-700 border border-violet-300 px-1.5 py-0.5 rounded-full animate-pulse">
                Simulation
              </span>
            )}
          </div>
        ) : (
          /* Utilisateur non-admin : badge fixe, aucun pivot possible */
          <div className="hidden md:flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1 shadow-inner">
            <span className="text-xs text-slate-500 font-bold">Rôle :</span>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-lg">
              {currentRole === 'COMMERCIAL' ? 'Commercial' :
               currentRole === 'DEMARCHEUR' ? 'Démarcheur' :
               currentRole === 'COMPTABLE' ? 'Comptable' : currentRole}
            </span>
          </div>
        )}

        {/* User Profile Trigger Button (Mobile & Desktop) */}
        <div className="relative">
          <button
            onClick={() => setShowProfileMenu(s => !s)}
            className="flex items-center gap-1.5 p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-all"
          >
            <div className="w-7 h-7 rounded-lg bg-amber-500 text-white font-extrabold text-xs flex items-center justify-center shadow-sm">
              {currentUser?.name ? currentUser.name.charAt(0) : 'U'}
            </div>
            <span className="text-xs font-extrabold text-slate-800 hidden lg:inline max-w-[100px] truncate">
              {currentUser?.name.split(' ')[0]}
            </span>
          </button>

          {/* Profile Dropdown Popover */}
          {showProfileMenu && (
            <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-200 rounded-2xl p-4 shadow-2xl z-[300] space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                <div>
                  <p className="text-xs font-extrabold text-slate-900">{currentUser?.name}</p>
                  <p className="text-[10px] text-amber-700 font-bold">{currentRole}</p>
                </div>
                <button onClick={() => setShowProfileMenu(false)} className="text-slate-400 hover:text-slate-600">
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Role Selector on Mobile */}
              <div className="space-y-1 md:hidden">
                <label className="block text-[10px] text-slate-500 font-bold uppercase">Changer de Rôle :</label>
                <select 
                  value={currentRole}
                  onChange={(e) => {
                    onRoleChange(e.target.value as UserRole);
                    setShowProfileMenu(false);
                  }}
                  className="w-full bg-slate-50 border border-slate-300 text-slate-900 text-xs font-bold rounded-xl p-2"
                >
                  <option value="ADMIN_GENERAL">Admin Général</option>
                  <option value="COMMERCIAL">Commercial</option>
                  <option value="DEMARCHEUR">Démarcheur</option>
                  <option value="COMPTABLE">Comptable & Stock</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>

              <div className="pt-2 border-t border-slate-100">
                <button
                  onClick={() => {
                    setShowProfileMenu(false);
                    onLogout();
                  }}
                  className="w-full py-2 bg-red-50 hover:bg-red-100 text-red-600 font-extrabold text-xs rounded-xl border border-red-200 flex items-center justify-center gap-1.5 transition-all"
                >
                  <LogOut className="w-3.5 h-3.5" /> Se déconnecter
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
