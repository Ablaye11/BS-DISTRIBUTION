import React from 'react';
import { ModuleTab } from './Sidebar';
import { LayoutDashboard, Gauge, Boxes, ShoppingBag, Menu, PackageCheck } from 'lucide-react';

interface MobileBottomNavProps {
  activeTab: ModuleTab;
  onSelectTab: (tab: ModuleTab) => void;
  onToggleMenu: () => void;
  isMenuOpen: boolean;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  activeTab,
  onSelectTab,
  onToggleMenu,
  isMenuOpen
}) => {
  const navItems: { id: ModuleTab | 'menu'; label: string; icon: any }[] = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'stock', label: 'Matières', icon: Boxes },
    { id: 'productivite', label: 'Production', icon: Gauge },
    { id: 'produits_finis', label: 'Prod. Finis', icon: PackageCheck },
    { id: 'commercial', label: 'Ventes', icon: ShoppingBag },
    { id: 'menu', label: 'Plus...', icon: Menu },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-[180] bg-slate-900/95 backdrop-blur-md border-t border-slate-800 text-slate-400 px-2 py-1.5 flex items-center justify-around shadow-2xl safe-area-pb">
      {navItems.map(item => {
        const Icon = item.icon;
        const isActive = item.id === 'menu' ? isMenuOpen : activeTab === item.id;

        return (
          <button
            key={item.id}
            onClick={() => {
              if (item.id === 'menu') {
                onToggleMenu();
              } else {
                onSelectTab(item.id as ModuleTab);
              }
            }}
            className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-xl transition-all duration-150 ${
              isActive
                ? 'text-amber-400 font-bold scale-105'
                : 'text-slate-400 hover:text-white active:scale-95'
            }`}
          >
            <div className={`p-1 rounded-lg ${isActive ? 'bg-amber-500/20 text-amber-400' : ''}`}>
              <Icon className="w-5 h-5" />
            </div>
            <span className="text-[10px] tracking-tight mt-0.5 leading-none">
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
};
