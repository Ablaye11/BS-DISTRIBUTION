import React from 'react';
import { UserRole } from '../../types';
import {
  LayoutDashboard, Gauge, Boxes, ShoppingBag,
  DollarSign, ShieldCheck, FileText, X, Smartphone, ClipboardCheck,
  Users, Sliders, BookOpen, PackageCheck
} from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { ThemeSwitcher } from '../common/ThemeSwitcher';
import { InstallPwaButton } from '../common/InstallPwaButton';

export type ModuleTab =
  | 'dashboard'
  | 'stock'
  | 'productivite'
  | 'produits_finis'
  | 'commercial'
  | 'finances'
  | 'inventaire'
  | 'cahier_charges'
  | 'users'
  | 'parametres'
  | 'audit_logs';


interface NavItem {
  id: ModuleTab;
  label: string;
  sublabel: string;
  icon: React.ElementType;
  roles: UserRole[];
  color: string;      // couleur de l'icône inactive
  dot?: string;       // petit badge coloré
}

interface SidebarProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
  isOpen?: boolean;
  onClose?: () => void;
}

const NAV_ITEMS: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Tableau de bord',
    sublabel: 'Vue exécutive usine',
    icon: LayoutDashboard,
    roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'RESPONSABLE_PRODUCTION', 'COMPTABLE', 'CONTROLEUR_AUDITEUR'],
    color: 'text-sky-400',
    dot: 'bg-emerald-400',
  },
  {
    id: 'stock',
    label: 'Stock Matière première et additif',
    sublabel: 'Cartons, papiers & additifs',
    icon: Boxes,
    roles: ['DIRECTEUR_USINE', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_COMMERCIAL', 'COMMERCIAL', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-orange-400',
  },
  {
    id: 'productivite',
    label: 'Production',
    sublabel: 'Ligne Shuliy & TRS',
    icon: Gauge,
    roles: ['DIRECTEUR_USINE', 'RESPONSABLE_PRODUCTION', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-amber-400',
  },
  {
    id: 'produits_finis',
    label: 'Stock produit fini',
    sublabel: 'Alvéoles usine & fardeaux',
    icon: PackageCheck,
    roles: ['DIRECTEUR_USINE', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_COMMERCIAL', 'COMMERCIAL', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-blue-400',
  },
  {
    id: 'commercial',
    label: 'Gestion commerciale',
    sublabel: 'Commandes & facturation',
    icon: ShoppingBag,
    roles: ['DIRECTEUR_USINE', 'RESPONSABLE_COMMERCIAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-purple-400',
  },
  {
    id: 'finances',
    label: 'Parti financière',
    sublabel: 'P&L, charges & trésorerie',
    icon: DollarSign,
    roles: ['DIRECTEUR_USINE', 'COMPTABLE', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-emerald-400',
  },
  {
    id: 'inventaire',
    label: 'Inventaires & Audits',
    sublabel: 'Hebdo, mensuel & écarts',
    icon: ClipboardCheck,
    roles: ['DIRECTEUR_USINE', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'COMPTABLE', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-teal-400',
  },
  {
    id: 'audit_logs',
    label: 'Journal d\'Audit',
    sublabel: 'Traçabilité & Sécurité',
    icon: ShieldCheck,
    roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-rose-400',
  },
  {
    id: 'cahier_charges',
    label: 'Normes & CDC',
    sublabel: 'Cahier des charges 28p',
    icon: FileText,
    roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_STOCK', 'RESPONSABLE_COMMERCIAL', 'CONTROLEUR_AUDITEUR'],
    color: 'text-blue-400',
  },
  {
    id: 'users',
    label: 'Collaborateurs',
    sublabel: 'Comptes & Accès Usine',
    icon: Users,
    roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN'],
    color: 'text-indigo-400',
  },
  {
    id: 'parametres',
    label: 'Paramètres Usine',
    sublabel: 'Tarifs, Cadences & Backup',
    icon: Sliders,
    roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'CONTROLEUR_AUDITEUR'],
    color: 'text-amber-400',
  },
];


export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  isOpen = false,
  onClose
}) => {
  const { currentTheme } = useTheme();

  const visibleItems = NAV_ITEMS.filter(item =>
    item.roles.includes(userRole)
  );

  return (
    <>
      {/* Backdrop mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[240] md:hidden"
          aria-hidden="true"
        />
      )}

      <aside
        className={`
          fixed md:relative inset-y-0 md:inset-auto left-0 z-[250]
          w-64 shrink-0 h-full
          flex flex-col
          transition-transform duration-300 ease-in-out
          ${currentTheme.sidebarBg}
          ${isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'}
        `}
      >
        {/* ── Logo Officiel BS Alvéoles ───────────────────── */}
        <div className="px-4 py-3.5 border-b border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="bg-white rounded-xl p-1 shadow-sm shrink-0 flex items-center justify-center">
              <img 
                src="/logo-bs-alveoles.png" 
                alt="BS Alvéoles" 
                className="h-8 w-auto object-contain"
              />
            </div>
            <div>
              <div className="font-black text-xs text-white tracking-tight leading-none">BS ALVÉOLES</div>
              <div className="text-[9px] text-slate-400 mt-0.5 font-medium">Bécaye Saliou · SARL</div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="md:hidden p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* ── Navigation ───────────────────────────────────── */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
          {visibleItems.map(item => {
            const isActive = activeTab === item.id;
            const Icon = item.icon;

            return (
              <button
                key={item.id}
                onClick={() => { onSelectTab(item.id); onClose?.(); }}
                className={`
                  w-full flex items-center gap-3 px-3 py-2.5 rounded-xl
                  text-left transition-all duration-150 group relative
                  ${isActive
                    ? `bg-gradient-to-r ${currentTheme.gradient} text-white shadow-lg`
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                  }
                `}
              >
                {/* Indicateur actif gauche */}
                {isActive && (
                  <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-white/60" />
                )}

                {/* Icône */}
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 transition-all ${
                  isActive
                    ? 'bg-white/20 text-white'
                    : `bg-white/5 ${item.color} group-hover:bg-white/10`
                }`}>
                  <Icon className="w-4 h-4" />
                </div>

                {/* Texte */}
                <div className="flex-1 min-w-0">
                  <div className={`text-xs font-bold leading-tight truncate ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
                    {item.label}
                  </div>
                  <div className={`text-[10px] font-medium truncate mt-0.5 ${isActive ? 'text-white/70' : 'text-slate-500'}`}>
                    {item.sublabel}
                  </div>
                </div>

                {/* Dot live */}
                {item.dot && !isActive && (
                  <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${item.dot} animate-pulse`} />
                )}
              </button>
            );
          })}
        </nav>

        {/* ── Bas de sidebar ────────────────────────────────── */}
        <div className="px-3 pb-4 pt-3 border-t border-white/5 space-y-2 shrink-0">
          {/* Sélecteur de thème */}
          <div className="flex items-center justify-between px-2">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Thème</span>
            <ThemeSwitcher compact={true} />
          </div>

          {/* Installer PWA */}
          <InstallPwaButton
            label="Installer l'application"
            showStatusIfInstalled={true}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md shadow-amber-500/10 transition-all active:scale-95"
          />

          {/* Manuel Utilisateur PDF */}
          <a
            href="/MANUEL_UTILISATEUR_BS_ALVEOLES.html"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-white/5 hover:bg-white/10 text-amber-300 hover:text-amber-200 border border-amber-500/20 text-xs font-bold transition-all"
            title="Consulter le guide et manuel complet de l'application"
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Manuel & Guide (PDF)</span>
          </a>

          <div className="text-[10px] text-center text-slate-600 pt-0.5">
            BS ALVÉOLES · Dakar, Sénégal
          </div>
        </div>
      </aside>
    </>
  );
};
