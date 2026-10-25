import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from './db/database';
import { UserRole, User } from './types';
import { Header } from './components/layout/Header';
import { Sidebar, ModuleTab } from './components/layout/Sidebar';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { PublicLandingPage } from './components/public/PublicLandingPage';

// Les 5 Grands Modules Clés de l'Unité de Production d'Alvéoles
import { ExecutiveDashboard } from './modules/dashboard/ExecutiveDashboard';
import { ProductiviteModule } from './modules/production/ProductiviteModule';
import { StockAlveolesModule } from './modules/stock/StockAlveolesModule';
import { GestionCommercialeModule } from './modules/commercial/GestionCommercialeModule';
import { ComptabiliteFinanciereModule } from './modules/finances/ComptabiliteFinanciereModule';
import { AuditLogModule } from './modules/audit/AuditLogModule';

// Profils par défaut de l'équipe usine
const ROLE_PROFILES: Record<UserRole, User> = {
  DIRECTEUR_USINE: { id: 'usr-dir', name: 'M. Ndiaye Saliou', email: 'directeur@bsalveoles.sn', role: 'DIRECTEUR_USINE', phone: '+221 76 622 59 79' },
  RESPONSABLE_PRODUCTION: { id: 'usr-prod', name: 'Amadou Bâ', email: 'production@bsalveoles.sn', role: 'RESPONSABLE_PRODUCTION', phone: '+221 77 450 11 22' },
  RESPONSABLE_STOCK: { id: 'usr-stock', name: 'Modou Faye', email: 'stock@bsalveoles.sn', role: 'RESPONSABLE_STOCK', phone: '+221 78 300 44 55' },
  RESPONSABLE_COMMERCIAL: { id: 'usr-com', name: 'Ibrahima Ndiaye', email: 'commercial@bsalveoles.sn', role: 'RESPONSABLE_COMMERCIAL', phone: '+221 77 100 00 01' },
  COMPTABLE: { id: 'usr-cpt', name: 'Awa Diop', email: 'comptable@bsalveoles.sn', role: 'COMPTABLE', phone: '+221 76 100 00 03' },
  SUPER_ADMIN: { id: 'usr-super', name: 'Super Administrateur', email: 'admin@bsalveoles.sn', role: 'SUPER_ADMIN', phone: '+221 78 914 88 88' },
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(ROLE_PROFILES.DIRECTEUR_USINE);
  const [currentRole, setCurrentRole] = useState<UserRole>('DIRECTEUR_USINE');
  const [activeTab, setActiveTab] = useState<ModuleTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [viewPublicVitrine, setViewPublicVitrine] = useState(false);

  // Données Dexie réactives
  const notifications = useLiveQuery(() => db.notifications.toArray()) || [];
  const auditLogs = useLiveQuery(() => db.auditLogs.orderBy('timestamp').reverse().toArray()) || [];

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Initialiser les données de l'unité de production si la base est neuve
    seedInitialDataIfEmpty();

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    if (ROLE_PROFILES[role]) {
      setCurrentUser(ROLE_PROFILES[role]);
    }
  };

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    setShowLoginModal(false);
    setViewPublicVitrine(false);
  };

  const handleLogout = () => {
    setViewPublicVitrine(true);
  };

  // Affichage Vitrine Publique
  if (viewPublicVitrine) {
    return (
      <>
        <PublicLandingPage onOpenLogin={() => setShowLoginModal(true)} />
        {showLoginModal && (
          <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 font-sans animate-fadeIn">
            <div className="w-full max-w-md relative">
              <button 
                onClick={() => setShowLoginModal(false)}
                className="absolute top-4 right-4 z-50 p-2 text-slate-400 hover:text-white bg-slate-800 rounded-full"
              >
                ✕
              </button>
              <LoginScreen onLoginSuccess={handleLoginSuccess} />
            </div>
          </div>
        )}
      </>
    );
  }

  // Application ERP Interne Usine
  return (
    <div className="h-screen w-screen overflow-hidden bg-slate-100 text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      <OfflineBanner isOnline={isOnline} pendingCount={0} />

      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingSyncCount={0}
        notifications={notifications}
        onRefreshData={() => {}}
        onOpenPublicPortal={() => setViewPublicVitrine(true)}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentRole}
          onBackToVitrine={() => setViewPublicVitrine(true)}
        />

        <main className="flex-1 p-4 md:p-6 lg:p-8 overflow-y-auto h-full max-w-7xl mx-auto w-full pb-16">
          {activeTab === 'dashboard' && (
            <ExecutiveDashboard onNavigateTab={setActiveTab} />
          )}

          {activeTab === 'productivite' && (
            <ProductiviteModule />
          )}

          {activeTab === 'stock' && (
            <StockAlveolesModule />
          )}

          {activeTab === 'commercial' && (
            <GestionCommercialeModule />
          )}

          {activeTab === 'finances' && (
            <ComptabiliteFinanciereModule />
          )}

          {activeTab === 'audit_logs' && (
            <AuditLogModule auditLogs={auditLogs} />
          )}
        </main>
      </div>
    </div>
  );
}
export default App;
