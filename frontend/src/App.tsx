import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from './db/database';
import { UserRole, User } from './types';
import { Header } from './components/layout/Header';
import { Sidebar, ModuleTab } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { PublicPortalModal } from './components/public/PublicPortalModal';
import { PublicLandingPage } from './components/public/PublicLandingPage';
import { SecurityAutoLockModal } from './components/auth/SecurityAutoLockModal';

// Modules
import { ExecutiveDashboard } from './modules/dashboard/ExecutiveDashboard';
import { CRMModule } from './modules/crm/CRMModule';
import { ClientsModule } from './modules/crm/ClientsModule';
import { SalesModule } from './modules/sales/SalesModule';
import { DeliveryPlannerModule } from './modules/delivery/DeliveryPlannerModule';
import { MissionsModule } from './modules/missions/MissionsModule';
import { StockModule } from './modules/stock/StockModule';
import { FinancesModule } from './modules/finances/FinancesModule';
import { PaymentsModule } from './modules/payments/PaymentsModule';
import { CreancesModule } from './modules/creances/CreancesModule';
import { PoulaillersModule } from './modules/poulaillers/PoulaillersModule';
import { PerformanceModule } from './modules/performance/PerformanceModule';
import { AuditLogModule } from './modules/audit/AuditLogModule';
import { SenegalMap } from './components/maps/SenegalMap';

// Table de correspondances des rôles et des profils utilisateurs
const ROLE_PROFILES: Record<UserRole, User> = {
  ADMIN_GENERAL: { id: 'usr-admin', name: 'M. Ndiaye Saliou', email: 'admin@bsdistribution.sn', role: 'ADMIN_GENERAL', phone: '+221 76 622 59 79' },
  COMMERCIAL:    { id: 'usr-com1', name: 'Ibrahima Ndiaye', email: 'commercial@bsdistribution.sn', role: 'COMMERCIAL', phone: '+221 77 100 00 01' },
  DEMARCHEUR:    { id: 'usr-dem1', name: 'Moussa Kane', email: 'demarcheur@bsdistribution.sn', role: 'DEMARCHEUR', phone: '+221 78 100 00 02' },
  COMPTABLE:     { id: 'usr-cpt1', name: 'Awa Diop', email: 'comptable@bsdistribution.sn', role: 'COMPTABLE', phone: '+221 76 100 00 03' },
  SUPER_ADMIN:   { id: 'usr-super', name: 'Super Administrateur', email: 'superadmin@bsdistribution.sn', role: 'SUPER_ADMIN', phone: '+221 78 914 88 88' },
};

// Table des accès autorisés par rôle
const ROLE_PERMITTED_TABS: Record<UserRole, ModuleTab[]> = {
  ADMIN_GENERAL: ['dashboard', 'prospection', 'clients', 'sales', 'delivery', 'missions', 'stock', 'finances', 'payments', 'creances', 'maps_gps', 'poulaillers', 'performance', 'audit_logs'],
  SUPER_ADMIN:   ['dashboard', 'prospection', 'clients', 'sales', 'delivery', 'missions', 'stock', 'finances', 'payments', 'creances', 'maps_gps', 'poulaillers', 'performance', 'audit_logs'],
  COMMERCIAL:    ['prospection', 'clients', 'sales', 'delivery', 'missions', 'payments', 'creances', 'maps_gps'],
  DEMARCHEUR:    ['prospection', 'maps_gps', 'poulaillers', 'performance'],
  COMPTABLE:     ['dashboard', 'sales', 'delivery', 'missions', 'stock', 'finances', 'payments', 'creances', 'maps_gps', 'poulaillers']
};

export function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('ADMIN_GENERAL');
  const [activeTab, setActiveTab]     = useState<ModuleTab>('dashboard');
  const [isOnline, setIsOnline]       = useState<boolean>(navigator.onLine);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  // Modals & Security State
  const [showLoginModal, setShowLoginModal]               = useState(false);
  const [showPublicPortalModal, setShowPublicPortalModal] = useState(false);
  const [viewPublicVitrine, setViewPublicVitrine]         = useState(true);
  const [isSessionLocked, setIsSessionLocked]             = useState(false);

  // 15-Minute Inactivity Auto-Lock Security Timer
  useEffect(() => {
    if (!currentUser || viewPublicVitrine || isSessionLocked) return;

    let idleTimer: NodeJS.Timeout;
    const IDLE_TIMEOUT_MS = 15 * 60 * 1000; // 15 minutes

    const resetIdleTimer = () => {
      clearTimeout(idleTimer);
      idleTimer = setTimeout(async () => {
        setIsSessionLocked(true);
        await db.auditLogs.add({
          id: `audit-autolock-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userNom: currentUser.name,
          userRole: currentUser.role,
          action: 'VERROUILLAGE_AUTOMATIQUE',
          entite: 'Sécurité',
          description: `Session verrouillée automatiquement après 15 min d'inactivité.`,
        });
      }, IDLE_TIMEOUT_MS);
    };

    const events = ['mousemove', 'keydown', 'touchstart', 'scroll', 'click'];
    events.forEach(ev => window.addEventListener(ev, resetIdleTimer));
    resetIdleTimer();

    return () => {
      clearTimeout(idleTimer);
      events.forEach(ev => window.removeEventListener(ev, resetIdleTimer));
    };
  }, [currentUser, viewPublicVitrine, isSessionLocked]);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Restore saved session info BUT do NOT auto-navigate to internal app.
    // The user must explicitly click "Connexion Équipe" to enter the internal dashboard.
    const savedUser = localStorage.getItem('bs_current_user');
    if (savedUser) {
      try {
        const user = JSON.parse(savedUser) as User;
        setCurrentUser(user);
        setCurrentRole(user.role);
        const permitted = ROLE_PERMITTED_TABS[user.role] || [];
        if (!permitted.includes(activeTab)) {
          setActiveTab(permitted[0] || 'dashboard');
        }
      } catch {}
    }

    seedInitialDataIfEmpty().then(() => {
      setRefreshTrigger(prev => prev + 1);
    });

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    localStorage.setItem('bs_current_user', JSON.stringify(user));
    setShowLoginModal(false);
    // Leave the public vitrine and enter the internal dashboard
    setViewPublicVitrine(false);

    const permitted = ROLE_PERMITTED_TABS[user.role] || [];
    setActiveTab(permitted[0] || 'dashboard');
  };

  // "Connexion Équipe" from public page: if already have a saved session, go straight in
  const handleOpenLogin = () => {
    const savedUser = localStorage.getItem('bs_current_user');
    if (savedUser && currentUser) {
      // User already logged in — go directly to internal dashboard
      setViewPublicVitrine(false);
    } else {
      setShowLoginModal(true);
    }
  };

  const handleRoleChange = async (newRole: UserRole) => {
    // Sécurité : seuls les admins peuvent pivoter de rôle
    if (!currentUser || (currentUser.role !== 'ADMIN_GENERAL' && currentUser.role !== 'SUPER_ADMIN')) return;

    setCurrentRole(newRole);
    // L'identité réelle de l'Admin (currentUser) est PRÉSERVÉE — seul currentRole change
    // On ne modifie PAS currentUser.role pour que le sélecteur reste toujours visible

    // Audit log de simulation de rôle
    await db.auditLogs.add({
      id: `audit-role-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: currentUser.name,
      userRole: currentUser.role,
      action: newRole === currentUser.role ? 'RETOUR_ROLE_REEL' : 'SIMULATION_ROLE',
      entite: 'Sécurité',
      description: newRole === currentUser.role
        ? `Retour au rôle réel : ${currentUser.role}`
        : `Simulation de vue du rôle : ${newRole} (compte réel : ${currentUser.role})`,
    });

    // Vérifier si l'onglet actif est permis dans le rôle simulé
    const permitted = ROLE_PERMITTED_TABS[newRole] || [];
    if (!permitted.includes(activeTab)) {
      setActiveTab(permitted[0] || 'dashboard');
    }

    setRefreshTrigger(prev => prev + 1);
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem('bs_current_user');
    setActiveTab('dashboard');
    setShowLoginModal(false);
    setViewPublicVitrine(true);
  };

  // Reactive Dexie Live Queries
  const prospects   = useLiveQuery(() => db.prospects.toArray(), [refreshTrigger]) || [];
  const clients     = useLiveQuery(() => db.clients.toArray(), [refreshTrigger]) || [];
  const poulaillers = useLiveQuery(() => db.poulaillers.toArray(), [refreshTrigger]) || [];
  const invoices    = useLiveQuery(() => db.invoices.toArray(), [refreshTrigger]) || [];
  const deliveries  = useLiveQuery(() => db.deliveries.toArray(), [refreshTrigger]) || [];
  const missions    = useLiveQuery(() => db.missions.toArray(), [refreshTrigger]) || [];
  const stockLots   = useLiveQuery(() => db.stockLots.toArray(), [refreshTrigger]) || [];
  const stockLosses = useLiveQuery(() => db.stockLosses.toArray(), [refreshTrigger]) || [];
  const expenses    = useLiveQuery(() => db.expenses.toArray(), [refreshTrigger]) || [];
  const commissions = useLiveQuery(() => db.commissions.toArray(), [refreshTrigger]) || [];
  const notifications = useLiveQuery(() => db.notifications.toArray(), [refreshTrigger]) || [];
  const auditLogs   = useLiveQuery(() => db.auditLogs.toArray(), [refreshTrigger]) || [];

  const handleRefreshData = () => setRefreshTrigger(prev => prev + 1);

  // Always show the public vitrine first — user must explicitly click "Connexion Équipe"
  if (viewPublicVitrine) {
    return (
      <>
        <PublicLandingPage onOpenLogin={handleOpenLogin} />
        {showLoginModal && (
          <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4 font-sans">
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

  const permittedTabs = ROLE_PERMITTED_TABS[currentRole] || [];

  return (
    <div className="h-screen w-screen overflow-hidden bg-[#FAF8F5] text-slate-800 flex flex-col font-sans selection:bg-amber-500 selection:text-white">
      <OfflineBanner isOnline={isOnline} pendingCount={0} />

      <Header
        currentUser={currentUser}
        currentRole={currentRole}
        onRoleChange={handleRoleChange}
        onLogout={handleLogout}
        isOnline={isOnline}
        pendingSyncCount={0}
        notifications={notifications}
        onRefreshData={handleRefreshData}
        onOpenPublicPortal={() => setViewPublicVitrine(true)}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100vh-4rem)]">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentRole}
        />

        <main className="flex-1 p-3 md:p-6 overflow-y-auto h-full max-w-7xl mx-auto w-full space-y-4 md:space-y-6 pb-16 page-transition">
          {activeTab === 'dashboard' && permittedTabs.includes('dashboard') && (
            <ExecutiveDashboard
              invoices={invoices} stockLots={stockLots} stockLosses={stockLosses}
              expenses={expenses} prospects={prospects} clients={clients}
              poulaillers={poulaillers} onNavigateTab={setActiveTab}
            />
          )}

          {activeTab === 'prospection' && permittedTabs.includes('prospection') && (
            <CRMModule prospects={prospects} clients={clients} currentUser={currentUser!} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'clients' && permittedTabs.includes('clients') && (
            <ClientsModule clients={clients} currentUser={currentUser!} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'sales' && permittedTabs.includes('sales') && (
            <SalesModule invoices={invoices} clients={clients} currentUser={currentUser!} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'delivery' && permittedTabs.includes('delivery') && (
            <DeliveryPlannerModule deliveries={deliveries} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'missions' && permittedTabs.includes('missions') && (
            <MissionsModule missions={missions} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'stock' && permittedTabs.includes('stock') && (
            <StockModule stockLots={stockLots} stockLosses={stockLosses} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'finances' && permittedTabs.includes('finances') && (
            <FinancesModule expenses={expenses} invoices={invoices} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'payments' && permittedTabs.includes('payments') && (
            <PaymentsModule invoices={invoices} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'creances' && permittedTabs.includes('creances') && (
            <CreancesModule invoices={invoices} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'maps_gps' && permittedTabs.includes('maps_gps') && (
            <div className="space-y-4">
              <div className="p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
                <h2 className="text-lg font-extrabold text-slate-900 font-display">Cartographie Nationale du Sénégal & GPS Terrain</h2>
                <p className="text-xs text-slate-500 font-medium">Géo-localisation des prospects, clients et poulaillers.</p>
              </div>
              <SenegalMap prospects={prospects} clients={clients} poulaillers={poulaillers} />
            </div>
          )}

          {activeTab === 'poulaillers' && permittedTabs.includes('poulaillers') && (
            <PoulaillersModule poulaillers={poulaillers} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'performance' && permittedTabs.includes('performance') && (
            <PerformanceModule commissions={commissions} onRefreshData={handleRefreshData} />
          )}

          {activeTab === 'audit_logs' && permittedTabs.includes('audit_logs') && (
            <AuditLogModule auditLogs={auditLogs} />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation Bar & Drawer Menu for Smartphones */}
      <MobileNav
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        userRole={currentRole}
      />

      {/* Public Portal Modal */}
      {showPublicPortalModal && (
        <PublicPortalModal onClose={() => setShowPublicPortalModal(false)} />
      )}

      {/* Auto-Lock Security Screen */}
      {isSessionLocked && currentUser && (
        <SecurityAutoLockModal
          currentUser={currentUser}
          onUnlock={() => setIsSessionLocked(false)}
          onLogout={handleLogout}
        />
      )}
    </div>
  );
}
