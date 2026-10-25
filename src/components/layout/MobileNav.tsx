import React, { useState } from 'react';
import { ModuleTab } from './Sidebar';
import { UserRole } from '../../types';
import { 
  LayoutDashboard, Gauge, Boxes, ShoppingBag, DollarSign, 
  ShieldCheck, Menu, X, Factory
} from 'lucide-react';

interface MobileNavProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  userRole: UserRole;
}

export const MobileNav: React.FC<MobileNavProps> = ({ activeTab, onSelectTab, userRole }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const allModules: { id: ModuleTab; label: string; shortLabel: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard Exécutif', shortLabel: 'Accueil', icon: LayoutDashboard },
    { id: 'productivite', label: 'Indicateurs Productivité (TRS)', shortLabel: 'Productivité', icon: Gauge },
    { id: 'stock', label: 'Stocks & Cartons', shortLabel: 'Stocks', icon: Boxes },
    { id: 'commercial', label: 'Gestion Commerciale', shortLabel: 'Ventes', icon: ShoppingBag },
    { id: 'finances', label: 'Comptabilité & P&L', shortLabel: 'Finances', icon: DollarSign },
    { id: 'audit_logs', label: 'Journal d\'Audit', shortLabel: 'Audit', icon: ShieldCheck },
  ];

  const mainTabs = allModules.slice(0, 4);

  return (
    <>
      {/* Mobile Drawer Menu Modal */}
      {isMenuOpen && (
        <div className="fixed inset-0 z-[600] bg-slate-900/70 backdrop-blur-md flex flex-col justify-end p-3 md:hidden font-sans">
          <div className="bg-white rounded-3xl p-5 border border-slate-200 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <Factory className="w-5 h-5 text-amber-500" />
                <h3 className="font-bold text-slate-900 text-sm">Modules de l'Usine</h3>
              </div>
              <button 
                onClick={() => setIsMenuOpen(false)} 
                className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {allModules.map(module => {
                const Icon = module.icon;
                const isActive = activeTab === module.id;

                return (
                  <button
                    key={module.id}
                    onClick={() => {
                      onSelectTab(module.id);
                      setIsMenuOpen(false);
                    }}
                    className={`p-3 rounded-2xl border text-left flex flex-col gap-2 transition-all ${
                      isActive 
                        ? 'bg-amber-500 text-slate-950 font-black border-amber-400' 
                        : 'bg-slate-50 border-slate-200 text-slate-700 font-semibold'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-xs">{module.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Barre de navigation mobile inférieure */}
      <nav className="fixed bottom-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-md border-t border-slate-200 px-3 flex items-center justify-around md:hidden z-[150] shadow-lg">
        {mainTabs.map(tab => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center gap-1 transition-all flex-1 py-1 ${
                isActive ? 'text-amber-600 font-black scale-105' : 'text-slate-400 font-medium'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px]">{tab.shortLabel}</span>
            </button>
          );
        })}

        <button
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center justify-center gap-1 text-slate-500 font-medium flex-1 py-1"
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px]">Plus</span>
        </button>
      </nav>
    </>
  );
};
