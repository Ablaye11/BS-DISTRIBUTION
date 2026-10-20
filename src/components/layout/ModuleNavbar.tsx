import React, { useState } from 'react';
import { ModuleTab } from './Sidebar';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, Users, Store, ShoppingBag, Truck, 
  Map, Boxes, DollarSign, Navigation, Building2, TrendingUp, History, CalendarCheck, ChevronDown, Sparkles, ShieldCheck
} from 'lucide-react';

interface ModuleNavbarProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
}

export const ModuleNavbar: React.FC<ModuleNavbarProps> = ({
  activeTab,
  onSelectTab,
  userRole
}) => {
  const [openCategory, setOpenCategory] = useState<string | null>(null);

  const categories: {
    name: string;
    icon: any;
    modules: { id: ModuleTab; label: string; icon: any; roles: UserRole[]; badge?: string }[];
  }[] = [
    {
      name: 'Pilotage & Stratégie',
      icon: LayoutDashboard,
      modules: [
        { id: 'dashboard', label: '1. Dashboard Exécutif (10 KPIs)', icon: LayoutDashboard, roles: ['ADMIN_GENERAL', 'SUPER_ADMIN', 'COMPTABLE'], badge: '10 KPIs' },
      ]
    },
    {
      name: 'Commercial & Terrain',
      icon: ShoppingBag,
      modules: [
        { id: 'prospection', label: '2. CRM Prospection GPS', icon: Users, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'SUPER_ADMIN'], badge: 'GPS' },
        { id: 'clients', label: '3. Gestion Clients', icon: Store, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'SUPER_ADMIN'] },
        { id: 'sales', label: '4. Ventes & Facturation (FAC/BL)', icon: ShoppingBag, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'], badge: 'FAC / BL' },
        { id: 'delivery', label: '5. Livraisons Terrain', icon: Truck, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'missions', label: '6. Missions Interrégionales', icon: Map, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'], badge: 'Sénégal' },
      ]
    },
    {
      name: 'Stock, Finances & Créances',
      icon: DollarSign,
      modules: [
        { id: 'stock', label: '7. Stock & Pertes (Œufs)', icon: Boxes, roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'finances', label: '8. Finances & P&L', icon: DollarSign, roles: ['ADMIN_GENERAL', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'payments', label: '9. Paiements (Wave/OM)', icon: Boxes, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'creances', label: '📋 Créances — Qui a payé ?', icon: CalendarCheck, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'COMPTABLE', 'SUPER_ADMIN'] },
      ]
    },
    {
      name: 'Cartographie & Audit',
      icon: Navigation,
      modules: [
        { id: 'maps_gps', label: '10. Cartographie & GPS', icon: Navigation, roles: ['ADMIN_GENERAL', 'COMMERCIAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'poulaillers', label: '11. Poulaillers (Fermes)', icon: Building2, roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'COMPTABLE', 'SUPER_ADMIN'] },
        { id: 'performance', label: '12. Commissions & KPIs', icon: TrendingUp, roles: ['ADMIN_GENERAL', 'DEMARCHEUR', 'SUPER_ADMIN'] },
        { id: 'audit_logs', label: '25. Journal d\'Audit Inaltérable', icon: History, roles: ['ADMIN_GENERAL', 'SUPER_ADMIN'], badge: 'Inaltérable' },
      ]
    }
  ];

  // Flatten all accessible modules for quick horizontal tab display
  const accessibleFlat = categories.flatMap(c => c.modules).filter(m => m.roles.includes(userRole));

  return (
    <nav className="bg-slate-900 border-b border-slate-800 text-slate-100 px-3 md:px-6 py-2 flex items-center justify-between shadow-md font-sans sticky top-16 z-[190] overflow-x-auto">
      {/* Horizontal Tabs / Categories */}
      <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto scrollbar-none py-0.5">
        {accessibleFlat.map(mod => {
          const Icon = mod.icon;
          const isActive = activeTab === mod.id;

          return (
            <button
              key={mod.id}
              onClick={() => onSelectTab(mod.id)}
              className={`px-3 py-1.5 rounded-xl text-xs font-extrabold flex items-center gap-2 whitespace-nowrap transition-all shrink-0 ${
                isActive 
                  ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/20 scale-105 border border-amber-400' 
                  : 'bg-slate-800/80 hover:bg-slate-800 text-slate-300 border border-slate-700/60 hover:text-white'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isActive ? 'text-slate-950' : 'text-amber-400'}`} />
              <span>{mod.label}</span>
              {mod.badge && (
                <span className={`text-[9px] px-1.5 py-0.2 rounded font-extrabold uppercase ${
                  isActive ? 'bg-slate-950 text-amber-400' : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                }`}>
                  {mod.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
