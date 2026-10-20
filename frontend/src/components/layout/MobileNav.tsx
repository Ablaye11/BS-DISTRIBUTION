import React, { useState } from 'react';
import { ModuleTab } from './Sidebar';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, Users, Store, ShoppingBag, Truck, 
  Map, Boxes, DollarSign, Navigation, Building2, TrendingUp, History, Menu, X, CalendarCheck, Sparkles
} from 'lucide-react';

interface MobileNavProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab, userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allModules: { id: ModuleTab; label: string; shortLabel: string; category: string; icon: any; roles: UserRole[] }[] = [
    { id: 'dashboard', label: 'Dashboard Exécutif', shortLabel: 'Accueil', category: 'PILOTAGE', icon: LayoutDashboard, roles: ['ADMIN_GENERAL', 'SUPER_ADMIN', 'COMPTABLE'] },
    { id: 'prospection', label: 'CRM Prospection', shortLabel: 'CRM', category: 'COMMERCIAL', icon: Users, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'SUPER_ADMIN'] },
    { id: 'clients', label: 'Gestion Clients', shortLabel: 'Clients', category: 'COMMERCIAL', icon: Store, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'SUPER_ADMIN'] },
    { id: 'sales', label: 'Ventes & Facturation (FAC/BL)', shortLabel: 'Ventes', category: 'COMMERCIAL', icon: ShoppingBag, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'delivery', label: 'Livraisons Terrain', shortLabel: 'Livraisons', category: 'COMMERCIAL', icon: Truck, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'missions', label: 'Missions Interrégionales', shortLabel: 'Missions', category: 'COMMERCIAL', icon: Map, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'stock', label: 'Stock & Pertes (Œufs)', shortLabel: 'Stock', category: 'STOCK & FINANCES', icon: Boxes, roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'finances', label: 'Finances & P&L', shortLabel: 'Finances', category: 'STOCK & FINANCES', icon: DollarSign, roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'payments', label: 'Paiements (Wave/OM)', shortLabel: 'Paiements', category: 'STOCK & FINANCES', icon: Boxes, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'creances', label: 'Créances Clients', shortLabel: 'Créances', category: 'STOCK & FINANCES', icon: CalendarCheck, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'maps_gps', label: 'Cartographie & GPS', shortLabel: 'Carte GPS', category: 'CARTOGRAPHIE', icon: Navigation, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'poulaillers', label: 'Poulaillers (Fermes)', shortLabel: 'Fermes', category: 'CARTOGRAPHIE', icon: Building2, roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] },
    { id: 'performance', label: 'Commissions & KPIs', shortLabel: 'Commissions', category: 'CARTOGRAPHIE', icon: TrendingUp, roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'SUPER_ADMIN'] },
    { id: 'audit_logs', label: 'Journal d\'Audit', shortLabel: 'Audit', category: 'SÉCURITÉ', icon: History, roles: ['ADMIN_GENERAL', 'SUPER_ADMIN'] },
  ];

  // Strictly filter authorized modules for the current role
  const accessibleModules = allModules.filter(m => m.roles.includes(userRole));

  // Dynamic bottom navigation bar items (take top 4 allowed modules for this role)
  const mainNavTabs = accessibleModules.slice(0, 4);

  return (
    <>
      {/* Mobile Drawer Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-900/70 backdrop-blur-md flex flex-col justify-between p-4 md:hidden font-sans">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 shadow-2xl flex-1 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 shrink-0">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500" />
                <h3 className="font-extrabold text-slate-900 text-sm font-display">Espaces Autorisés ({accessibleModules.length})</h3>
              </div>
              <button onClick={() => setIsMenuOpen(false)} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 overflow-y-auto flex-1 pr-1">
              {accessibleModules.map(module => {
                const Icon = module.icon;
                const isActive = activeTab === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      onSelectTab(module.id);
                      setIsMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3 rounded-2xl text-xs font-bold transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-white shadow-md shadow-amber-500/20 font-extrabold' 
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-amber-600'}`} />
                      <span>{module.label}</span>
                    </div>
                    <span className="text-[9px] opacity-75 uppercase font-bold">{module.category}</span>
                  </button>
                );
              })}
            </div>

            <div className="border-t border-slate-100 pt-3 text-center shrink-0">
              <p className="text-[10px] text-slate-500 font-bold">Rôle actif : {userRole}</p>
            </div>
          </div>
        </div>
      )}

      {/* Bottom Fixed Navigation Bar for Smartphones ONLY (md:hidden) */}
      <div className="md:hidden fixed bottom-2 left-3 right-3 z-[400] bg-white/95 backdrop-blur-xl border border-slate-200/80 px-2 py-1.5 rounded-2xl shadow-2xl flex items-center justify-around font-sans">
        {mainNavTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl transition-all ${
                isActive 
                  ? 'bg-amber-500/15 text-amber-700 font-extrabold scale-105' 
                  : 'text-slate-500 font-medium hover:text-slate-800'
              }`}
            >
              <Icon className={`w-5 h-5 ${isActive ? 'text-amber-600' : 'text-slate-400'}`} />
              <span className="text-[10px] tracking-tight">{tab.shortLabel}</span>
            </button>
          );
        })}

        {/* More Modules Toggle */}
        {accessibleModules.length > 4 && (
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center gap-0.5 py-1 px-3 rounded-xl text-slate-500 hover:text-amber-600 font-medium"
          >
            <Menu className="w-5 h-5 text-slate-500" />
            <span className="text-[10px] tracking-tight">Plus...</span>
          </button>
        )}
      </div>
    </>
  );
};
