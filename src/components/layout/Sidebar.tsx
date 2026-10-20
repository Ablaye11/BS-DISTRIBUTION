import React from 'react';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, Users, Store, ShoppingBag, Truck, 
  Map, Boxes, DollarSign, CreditCard, Navigation, 
  Building2, TrendingUp, ShieldCheck, History, CalendarCheck, Sparkles
} from 'lucide-react';

export type ModuleTab = 
  | 'dashboard'
  | 'prospection'
  | 'clients'
  | 'sales'
  | 'delivery'
  | 'missions'
  | 'stock'
  | 'finances'
  | 'payments'
  | 'creances'
  | 'maps_gps'
  | 'poulaillers'
  | 'performance'
  | 'audit_logs';

interface SidebarProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  userRole
}) => {
  const sections: {
    sectionTitle: string;
    modules: { id: ModuleTab; label: string; icon: any; roles: UserRole[]; badge?: string; badgeColor?: string }[];
  }[] = [
    {
      sectionTitle: 'PILOTAGE & STRATÉGIE',
      modules: [
        { 
          id: 'dashboard', 
          label: 'Dashboard Exécutif', 
          icon: LayoutDashboard, 
          roles: ['ADMIN_GENERAL', 'SUPER_ADMIN', 'COMPTABLE'],
          badge: '10 KPIs'
        },
      ]
    },
    {
      sectionTitle: 'COMMERCIAL & TERRAIN',
      modules: [
        { 
          id: 'prospection', 
          label: 'CRM Prospection', 
          icon: Users, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'SUPER_ADMIN'],
          badge: 'GPS'
        },
        { 
          id: 'clients', 
          label: 'Gestion Clients', 
          icon: Store, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'SUPER_ADMIN'] 
        },
        { 
          id: 'sales', 
          label: 'Ventes & Facturation', 
          icon: ShoppingBag, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'],
          badge: 'FAC/BL',
          badgeColor: 'bg-amber-100 text-amber-900 border-amber-300'
        },
        { 
          id: 'delivery', 
          label: 'Livraisons Terrain', 
          icon: Truck, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'missions', 
          label: 'Missions Interrégionales', 
          icon: Map, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'],
          badge: 'Sénégal' 
        },
      ]
    },
    {
      sectionTitle: 'STOCK, FINANCES & RÈGLEMENTS',
      modules: [
        { 
          id: 'stock', 
          label: 'Stock & Pertes (Œufs)', 
          icon: Boxes, 
          roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'finances', 
          label: 'Finances & P&L', 
          icon: DollarSign, 
          roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'payments', 
          label: 'Paiements (Wave/OM)', 
          icon: CreditCard, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'creances', 
          label: 'Créances Clients', 
          icon: CalendarCheck, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
      ]
    },
    {
      sectionTitle: 'CARTOGRAPHIE & PARTENAIRES',
      modules: [
        { 
          id: 'maps_gps', 
          label: 'Cartographie & GPS', 
          icon: Navigation, 
          roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'poulaillers', 
          label: 'Poulaillers (Fermes)', 
          icon: Building2, 
          roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] 
        },
        { 
          id: 'performance', 
          label: 'Commissions & KPIs', 
          icon: TrendingUp, 
          roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'SUPER_ADMIN'] 
        },
        { 
          id: 'audit_logs', 
          label: 'Journal d\'Audit', 
          icon: History, 
          roles: ['ADMIN_GENERAL', 'SUPER_ADMIN'],
          badge: 'Sécurité' 
        },
      ]
    }
  ];

  return (
    <aside className="w-68 md:w-72 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0 hidden md:flex h-full shadow-sm overflow-hidden font-sans">
      <div className="p-3 space-y-3 overflow-y-auto sidebar-scrollbar flex-1 pb-6">
        {sections.map((sec, secIdx) => {
          const visibleMods = sec.modules.filter(m => m.roles.includes(userRole));
          if (visibleMods.length === 0) return null;

          return (
            <div key={secIdx} className="space-y-1">
              <div className="px-2 py-1 text-[11px] font-black tracking-wider text-amber-900 uppercase flex items-center gap-1.5 font-display">
                <Sparkles className="w-3 h-3 text-amber-600" />
                {sec.sectionTitle}
              </div>

              {visibleMods.map(module => {
                const Icon = module.icon;
                const isActive = activeTab === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => onSelectTab(module.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs md:text-sm font-extrabold transition-all relative ${
                      isActive
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20'
                        : 'text-slate-700 hover:text-slate-900 hover:bg-slate-100/90'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-white scale-110' : 'text-slate-500'}`} />
                      <span className="truncate">{module.label}</span>
                    </div>

                    {module.badge && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold border shrink-0 ${
                        isActive
                          ? 'bg-amber-600 text-white border-amber-400'
                          : module.badgeColor || 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}>
                        {module.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
      </div>

      {/* Footer Role Card */}
      <div className="p-3 border-t border-slate-200 bg-slate-50">
        <div className="flex items-center gap-2.5 p-2.5 rounded-xl bg-white border border-slate-200 text-xs shadow-sm">
          <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
          <div className="truncate">
            <p className="text-[10px] text-slate-500 font-bold leading-none">Session Sécurisée</p>
            <p className="font-extrabold text-amber-900 text-xs truncate leading-tight mt-0.5">{userRole}</p>
          </div>
        </div>
      </div>
    </aside>
  );
};
