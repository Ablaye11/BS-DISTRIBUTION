import React, { useEffect, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, seedInitialDataIfEmpty } from './db/database';
import { UserRole, User } from './types';
import { Header } from './components/layout/Header';
import { Sidebar, ModuleTab } from './components/layout/Sidebar';
import { OfflineBanner } from './components/layout/OfflineBanner';
import { LoginScreen } from './components/auth/LoginScreen';
import { useTheme } from './context/ThemeContext';
import { Factory } from 'lucide-react';

// Les 5 Grands Modules Clés de l'Unité de Production d'Alvéoles
import { ExecutiveDashboard } from './modules/dashboard/ExecutiveDashboard';
import { ProductiviteModule } from './modules/production/ProductiviteModule';
import { StockMatieresPremieresAdditifsModule } from './modules/stock/StockMatieresPremieresAdditifsModule';
import { StockProduitsFinisModule } from './modules/stock/StockProduitsFinisModule';
import { StockAlveolesModule } from './modules/stock/StockAlveolesModule';
import { InventaireModule } from './modules/inventory/InventaireModule';
import { GestionCommercialeModule } from './modules/commercial/GestionCommercialeModule';
import { ComptabiliteFinanciereModule } from './modules/finances/ComptabiliteFinanciereModule';
import { AuditLogModule } from './modules/audit/AuditLogModule';
import { CahierDesChargesModule } from './modules/cahier_charges/CahierDesChargesModule';
import { GestionCollaborateursModule } from './modules/users/GestionCollaborateursModule';
import { ParametresSystemeModule } from './modules/settings/ParametresSystemeModule';
import { MobileBottomNav } from './components/layout/MobileBottomNav';

// Définition stricte des accès par rôle (CDC Section 3)
const ROLE_ALLOWED_TABS: Record<UserRole, ModuleTab[]> = {
  DIRECTEUR_USINE: ['dashboard', 'stock', 'productivite', 'produits_finis', 'commercial', 'finances', 'inventaire', 'cahier_charges', 'users', 'parametres', 'audit_logs'],
  SUPER_ADMIN: ['dashboard', 'stock', 'productivite', 'produits_finis', 'commercial', 'finances', 'inventaire', 'cahier_charges', 'users', 'parametres', 'audit_logs'],
  RESPONSABLE_PRODUCTION: ['dashboard', 'stock', 'productivite', 'produits_finis', 'inventaire', 'cahier_charges', 'parametres'],
  RESPONSABLE_STOCK: ['stock', 'produits_finis', 'inventaire', 'cahier_charges'],
  COMMERCIAL: ['commercial', 'produits_finis', 'stock'],
  RESPONSABLE_COMMERCIAL: ['commercial', 'produits_finis', 'stock', 'cahier_charges', 'parametres'],
  COMPTABLE: ['dashboard', 'finances', 'commercial', 'inventaire', 'parametres'],
  CONTROLEUR_AUDITEUR: ['dashboard', 'audit_logs', 'stock', 'productivite', 'produits_finis', 'commercial', 'finances', 'inventaire', 'cahier_charges', 'parametres']
};


const ROLE_DEFAULT_TABS: Record<UserRole, ModuleTab> = {
  DIRECTEUR_USINE: 'dashboard',
  SUPER_ADMIN: 'dashboard',
  RESPONSABLE_PRODUCTION: 'productivite',
  RESPONSABLE_STOCK: 'stock',
  COMMERCIAL: 'commercial',
  RESPONSABLE_COMMERCIAL: 'commercial',
  COMPTABLE: 'finances',
  CONTROLEUR_AUDITEUR: 'dashboard'
};

export function App() {
  const { currentTheme } = useTheme();

  // null = non connecté → affiche le login
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentRole, setCurrentRole] = useState<UserRole>('DIRECTEUR_USINE');
  const [activeTab, setActiveTab] = useState<ModuleTab>('dashboard');
  const [isOnline, setIsOnline] = useState<boolean>(navigator.onLine);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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

  // Scroll vers le haut à chaque changement d'onglet
  useEffect(() => {
    const mainEl = document.getElementById('main-content-scroll');
    if (mainEl) {
      mainEl.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, [activeTab]);

  // ── Connexion réussie : oriente directement vers le module du rôle ──
  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    setCurrentRole(user.role);
    const defaultTab = ROLE_DEFAULT_TABS[user.role] || 'dashboard';
    setActiveTab(defaultTab);
  };

  // ── Déconnexion → retour à l'écran de login ──────────────────────
  const handleLogout = () => {
    setCurrentUser(null);
    setIsMobileMenuOpen(false);
  };

  const handleRoleChange = (role: UserRole) => {
    setCurrentRole(role);
    // Vérifie si le nouvel onglet est autorisé pour ce rôle
    const allowed = ROLE_ALLOWED_TABS[role] || [];
    if (!allowed.includes(activeTab)) {
      setActiveTab(ROLE_DEFAULT_TABS[role] || 'dashboard');
    }
  };

  // ══════════════════════════════════════════════════════════════════
  // Écran de connexion (fond fixe, propre et adéquat)
  // ══════════════════════════════════════════════════════════════════
  if (!currentUser) {
    return (
      <div className="min-h-screen w-screen flex flex-col items-center justify-center p-4 bg-gradient-to-br from-[#0a1628] via-[#10243e] to-[#0d1d32] relative overflow-hidden">
        {/* Halos lumineux d'ambiance bleu & doré */}
        <div
          className="absolute -top-32 -left-32 w-[600px] h-[600px] pointer-events-none rounded-full blur-[140px] opacity-40 -z-0"
          style={{
            background: 'radial-gradient(circle, #1E3A5F 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute -bottom-32 -right-32 w-[600px] h-[600px] pointer-events-none rounded-full blur-[140px] opacity-25 -z-0"
          style={{
            background: 'radial-gradient(circle, #C49B66 0%, transparent 70%)'
          }}
        />
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] pointer-events-none rounded-full blur-[180px] opacity-25 -z-0"
          style={{
            background: 'radial-gradient(circle, #1E3A5F 20%, transparent 75%)'
          }}
        />

        {/* Trame subtile en pointillés */}
        <div 
          className="absolute inset-0 pointer-events-none opacity-[0.07] -z-0"
          style={{
            backgroundImage: `radial-gradient(rgba(255, 255, 255, 0.6) 1px, transparent 1px)`,
            backgroundSize: '24px 24px'
          }}
        />

        {/* Formulaire de connexion épuré et centré */}
        <div className="relative z-10 w-full max-w-md">
          <LoginScreen onLoginSuccess={handleLoginSuccess} />
        </div>
      </div>
    );
  }

  // ══════════════════════════════════════════════════════════════════
  // Application ERP Interne (authentifié avec contrôle d'accès strict)
  // ══════════════════════════════════════════════════════════════════
  const allowedTabs = ROLE_ALLOWED_TABS[currentRole] || [];
  const isCurrentTabAllowed = allowedTabs.includes(activeTab);



  return (
    <div
      className={`h-[100dvh] w-screen overflow-hidden ${currentTheme.bgApp} text-slate-800 flex flex-col font-sans transition-colors duration-300`}
      style={{ '--theme-primary': currentTheme.hex } as React.CSSProperties}
    >
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
        onToggleMobileMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      />

      <div className="flex flex-1 overflow-hidden h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)]">
        <Sidebar
          activeTab={activeTab}
          onSelectTab={setActiveTab}
          userRole={currentRole}
          isOpen={isMobileMenuOpen}
          onClose={() => setIsMobileMenuOpen(false)}
        />

        <main 
          id="main-content-scroll"
          className="flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto overscroll-contain h-full max-w-7xl mx-auto w-full pb-24 md:pb-16 transition-all duration-200"
        >

          {!isCurrentTabAllowed ? (
            <div className="bg-white rounded-3xl p-8 border border-slate-200 text-center max-w-md mx-auto mt-12 shadow-sm">
              <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-3">
                <Factory className="w-6 h-6" />
              </div>
              <h2 className="text-base font-black text-slate-900">Accès Restreint</h2>
              <p className="text-xs text-slate-500 mt-1 mb-4">
                Votre profil ({currentUser.role}) n'a pas accès à ce module selon les règles de sécurité de l'usine.
              </p>
              <button
                onClick={() => setActiveTab(ROLE_DEFAULT_TABS[currentRole] || 'dashboard')}
                className={`px-4 py-2 rounded-xl bg-gradient-to-r ${currentTheme.gradient} text-white font-bold text-xs shadow-md`}
              >
                Retour à mon espace
              </button>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && (
                <ExecutiveDashboard onNavigateTab={setActiveTab} currentUser={currentUser} />
              )}
              {activeTab === 'stock' && (
                <StockMatieresPremieresAdditifsModule />
              )}
              {activeTab === 'productivite' && (
                <ProductiviteModule />
              )}
              {activeTab === 'produits_finis' && (
                <StockProduitsFinisModule />
              )}
              {activeTab === 'commercial' && (
                <GestionCommercialeModule />
              )}
              {activeTab === 'finances' && (
                <ComptabiliteFinanciereModule />
              )}
              {activeTab === 'inventaire' && (
                <InventaireModule />
              )}
              {activeTab === 'audit_logs' && (
                <AuditLogModule auditLogs={auditLogs} />
              )}
              {activeTab === 'cahier_charges' && (
                <CahierDesChargesModule />
              )}
              {activeTab === 'users' && (
                <GestionCollaborateursModule currentUser={currentUser} />
              )}
              {activeTab === 'parametres' && (
                <ParametresSystemeModule currentUser={currentUser} />
              )}
            </>

          )}
        </main>
      </div>

      {/* Barre de navigation mobile ancrée en bas */}
      <MobileBottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          setActiveTab(tab);
          setIsMobileMenuOpen(false);
        }}
        onToggleMenu={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isMenuOpen={isMobileMenuOpen}
      />
    </div>
  );
}

export default App;
