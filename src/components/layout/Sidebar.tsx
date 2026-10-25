import React from 'react';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, Gauge, Boxes, ShoppingBag, 
  DollarSign, ShieldCheck, Factory, Building, ArrowLeft, FileText, X
} from 'lucide-react';
import { InstallPwaButton } from '../common/InstallPwaButton';
import { useTheme } from '../../context/ThemeContext';

export type ModuleTab = 
  | 'dashboard'
  | 'productivite'
  | 'stock'
  | 'commercial'
  | 'finances'
  | 'audit_logs'
  | 'cahier_charges';

interface SidebarProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
  onBackToVitrine?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole,
  onBackToVitrine,
  isOpen = false,
  onClose
}) => {
  const { currentTheme } = useTheme();
  const sections: {
    sectionTitle: string;
    modules: { id: ModuleTab; label: string; icon: any; roles: UserRole[]; badge?: string; badgeColor?: string }[];
  }[] = [
    {
      sectionTitle: 'PILOTAGE USINE & PRODUCTION',
      modules: [
        { 
          id: 'dashboard', 
          label: 'Tableau de Bord Exécutif', 
          icon: LayoutDashboard, 
          roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'COMPTABLE', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_COMMERCIAL', 'RESPONSABLE_STOCK'],
          badge: 'Temps Réel'
        },
        { 
          id: 'productivite', 
          label: 'Indicateurs de Productivité', 
          icon: Gauge, 
          roles: ['DIRECTEUR_USINE', 'RESPONSABLE_PRODUCTION', 'SUPER_ADMIN', 'COMPTABLE'],
          badge: 'TRS / OEE',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
        },
      ]
    },
    {
      sectionTitle: 'STOCKS & FLUX MATIÈRES',
      modules: [
        { 
          id: 'stock', 
          label: 'Gestion des Stocks', 
          icon: Boxes, 
          roles: ['DIRECTEUR_USINE', 'RESPONSABLE_STOCK', 'RESPONSABLE_PRODUCTION', 'COMPTABLE', 'SUPER_ADMIN'],
          badge: 'Cartons & PF'
        },
      ]
    },
    {
      sectionTitle: 'COMMERCIAL & FINANCES',
      modules: [
        { 
          id: 'commercial', 
          label: 'Gestion Commerciale', 
          icon: ShoppingBag, 
          roles: ['DIRECTEUR_USINE', 'RESPONSABLE_COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'],
          badge: 'Factures / BL'
        },
        { 
          id: 'finances', 
          label: 'Comptabilité & Trésorerie', 
          icon: DollarSign, 
          roles: ['DIRECTEUR_USINE', 'COMPTABLE', 'SUPER_ADMIN'],
          badge: 'P&L Usine'
        },
      ]
    },
    {
      sectionTitle: 'CONFORMITÉ & SÉCURITÉ',
      modules: [
        { 
          id: 'cahier_charges', 
          label: 'Cahier des Charges & Normes', 
          icon: FileText, 
          roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN', 'COMPTABLE', 'RESPONSABLE_PRODUCTION', 'RESPONSABLE_COMMERCIAL', 'RESPONSABLE_STOCK'],
          badge: '28 Pages CDC',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
        },
        { 
          id: 'audit_logs', 
          label: 'Journal d\'Audit & Sécurité', 
          icon: ShieldCheck, 
          roles: ['DIRECTEUR_USINE', 'SUPER_ADMIN'],
          badge: 'Traçabilité'
        },
      ]
    }
  ];

  return (
    <>
      {/* Backdrop sombre sur mobile */}
      {isOpen && (
        <div
          onClick={onClose}
          className="fixed inset-0 bg-slate-950/70 backdrop-blur-sm z-[240] md:hidden transition-opacity animate-fadeIn"
          aria-hidden="true"
        />
      )}

      <aside className={`fixed md:sticky top-0 left-0 z-[250] w-72 md:w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen text-white select-none transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0 shadow-2xl' : '-translate-x-full md:translate-x-0'
      }`}>
        {/* Haut de la sidebar : Logo usine + bouton fermer mobile */}
        <div className="p-4 sm:p-5 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${currentTheme.logoBadgeClass} flex items-center justify-center font-black text-lg shadow-lg shrink-0 transition-colors`}>
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="font-extrabold text-base tracking-tight text-white flex items-center gap-1.5">
                BS ALVÉOLES
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-white/20 text-white font-black">
                  ERP
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-medium">Unité de Production d'Alvéoles</div>
            </div>
          </div>

          {onClose && (
            <button
              onClick={onClose}
              className="md:hidden p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 border border-slate-700/60 transition-colors"
              title="Fermer le menu"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Navigation des modules */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-6">
          {sections.map((sec, sIdx) => (
            <div key={sIdx}>
              <div className="px-3 mb-2 text-[10px] font-bold tracking-wider text-slate-500 uppercase">
                {sec.sectionTitle}
              </div>
              <div className="space-y-1">
                {sec.modules.map(mod => {
                  const isActive = activeTab === mod.id;
                  const Icon = mod.icon;

                  return (
                    <button
                      key={mod.id}
                      onClick={() => {
                        onSelectTab(mod.id);
                        onClose?.();
                      }}
                      className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all duration-150 ${
                        isActive
                          ? currentTheme.sidebarActiveClass
                          : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <Icon className="w-4 h-4" />
                        <span>{mod.label}</span>
                      </div>
                      {mod.badge && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold border ${
                          isActive
                            ? 'bg-slate-950/20 text-slate-950 border-slate-950/30'
                            : mod.badgeColor || 'bg-slate-800 text-slate-400 border-slate-700'
                        }`}>
                          {mod.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

      {/* Bas de sidebar : Bouton retour vitrine / info session / install PWA */}
      <div className="p-4 border-t border-slate-800 space-y-2">
        <InstallPwaButton className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 text-xs font-black shadow-md transition-all active:scale-95" />

        {onBackToVitrine && (
          <button
            onClick={onBackToVitrine}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs font-semibold border border-slate-700/80 transition-all"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voir Vitrine / Catalogue
          </button>
        )}
        <div className="text-[10px] text-center text-slate-500">
          BS ALVÉOLES SÉNÉGAL • v2.0 MES
        </div>
      </div>
    </aside>
  </>
  );
};
