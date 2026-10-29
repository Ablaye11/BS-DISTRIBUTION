import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { User, UserRole } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Users, UserPlus, Shield, KeyRound, CheckCircle2,
  XCircle, Search, Filter, Phone, Mail,
  Building2, Edit2, Lock, Eye, EyeOff, AlertTriangle,
  UserCheck, RefreshCw, FileText, Clock, QrCode, Timer, Calendar, Check
} from 'lucide-react';

interface GestionCollaborateursModuleProps {
  currentUser?: User | null;
}

const ROLES_INFO: Record<UserRole, { label: string; badgeBg: string; textCol: string; desc: string }> = {
  DIRECTEUR_USINE: {
    label: "Directeur d'Usine",
    badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
    textCol: 'text-purple-700',
    desc: "Accès total décisionnel, supervision de tous les modules et validation stratégique."
  },
  RESPONSABLE_PRODUCTION: {
    label: "Chef de Production (TRS)",
    badgeBg: 'bg-amber-100 text-amber-800 border-amber-200',
    textCol: 'text-amber-700',
    desc: "Gestion des shifts, lignes de thermoformage, calcul TRS/OEE et arrêts machines."
  },
  RESPONSABLE_STOCK: {
    label: "Responsable Stock & Cartons",
    badgeBg: 'bg-orange-100 text-orange-800 border-orange-200',
    textCol: 'text-orange-700',
    desc: "Gestion des réceptions balles de carton, dotations commerciales et traçabilité."
  },
  RESPONSABLE_COMMERCIAL: {
    label: "Responsable Commercial",
    badgeBg: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    textCol: 'text-indigo-700',
    desc: "Supervision contrats B2B (30 FCFA), marché ouvert (35 FCFA) et encaissements."
  },
  COMMERCIAL: {
    label: "Commercial Terrain",
    badgeBg: 'bg-sky-100 text-sky-800 border-sky-200',
    textCol: 'text-sky-700',
    desc: "Prise de commandes clients avicoles, encaissements et bons de retour invendus."
  },
  COMPTABLE: {
    label: "Responsable Financier",
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    textCol: 'text-emerald-700',
    desc: "Suivi des charges réelles, trésorerie, TVA 18%, seuil de rentabilité et marges."
  },
  CONTROLEUR_AUDITEUR: {
    label: "Contrôleur / Auditeur",
    badgeBg: 'bg-rose-100 text-rose-800 border-rose-200',
    textCol: 'text-rose-700',
    desc: "Audit de conformité au CDC (28 pages), contrôle des écarts et journal infalsifiable."
  },
  SUPER_ADMIN: {
    label: "Administrateur Technique",
    badgeBg: 'bg-slate-900 text-white border-slate-700',
    textCol: 'text-slate-900',
    desc: "Maintenance système, base de données Dexie.js, PWA et configuration avancée."
  }
};

const DEPARTMENTS = [
  'Direction Générale',
  'Production & TRS',
  'Magasin & Matières Premières',
  'Direction Commerciale',
  'Force de Vente Terrain',
  'Finance & Trésorerie',
  'Audit & Conformité CDC',
  'Système & IT'
];

export const GestionCollaborateursModule: React.FC<GestionCollaborateursModuleProps> = ({ currentUser }) => {
  const { currentTheme } = useTheme();

  // Liste des utilisateurs depuis Dexie
  const users = useLiveQuery(() => db.users.toArray()) || [];

  // Sous-onglets (Collaborateurs / Système de Pointage RH)
  const [subTab, setSubTab] = useState<'COLLABORATEURS' | 'POINTAGE_RH'>('COLLABORATEURS');
  const [pointageSimule, setPointageSimule] = useState<{
    dernierBadge: string | null;
    heure: string | null;
    type: 'ARRIVEE' | 'DEPART' | null;
  }>({
    dernierBadge: null,
    heure: null,
    type: null
  });

  // États filtres & recherche
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modals
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [passwordResetUser, setPasswordResetUser] = useState<User | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Formulaire d'ajout / modification
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '+221 ',
    role: 'COMMERCIAL' as UserRole,
    department: 'Force de Vente Terrain',
    password: '',
    actif: true
  });

  const [formError, setFormError] = useState('');

  // Filtrage
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || '').toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === 'ALL' || user.role === roleFilter;
    const matchesStatus = 
      statusFilter === 'ALL' || 
      (statusFilter === 'ACTIVE' && user.actif !== false) || 
      (statusFilter === 'INACTIVE' && user.actif === false);

    return matchesSearch && matchesRole && matchesStatus;
  });

  // Statistiques
  const totalUsers = users.length;
  const activeUsers = users.filter(u => u.actif !== false).length;
  const inactiveUsers = totalUsers - activeUsers;
  const distinctRoles = new Set(users.map(u => u.role)).size;

  // Ouvrir modal ajout
  const handleOpenAdd = () => {
    setEditingUser(null);
    setFormData({
      name: '',
      email: '',
      phone: '+221 ',
      role: 'COMMERCIAL',
      department: 'Force de Vente Terrain',
      password: `BS@${Math.floor(1000 + Math.random() * 9000)}!`,
      actif: true
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Ouvrir modal édition
  const handleOpenEdit = (user: User) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      phone: user.phone || '+221 ',
      role: user.role,
      department: user.department || 'Production & TRS',
      password: '',
      actif: user.actif !== false
    });
    setFormError('');
    setIsAddModalOpen(true);
  };

  // Sauvegarder (Création ou Mise à jour)
  const handleSaveUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!formData.name.trim()) {
      setFormError('Le nom du collaborateur est obligatoire.');
      return;
    }
    if (!formData.email.trim() || !formData.email.includes('@')) {
      setFormError('Veuillez saisir une adresse e-mail valide.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    try {
      if (editingUser) {
        // Mise à jour
        const updatedData: Partial<User> = {
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          phone: formData.phone.trim(),
          role: formData.role,
          department: formData.department,
          actif: formData.actif
        };

        if (formData.password.trim()) {
          updatedData.password = formData.password.trim();
        }

        await db.users.update(editingUser.id, updatedData);

        // Audit log
        await db.auditLogs.add({
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userNom: currentUser?.name || 'Administrateur',
          userRole: currentUser?.role || 'DIRECTEUR_USINE',
          action: 'MODIFICATION_UTILISATEUR',
          entite: 'Collaborateurs',
          description: `Mise à jour du profil de ${formData.name} (${ROLES_INFO[formData.role].label})`,
          nouvelleValeur: JSON.stringify({ role: formData.role, actif: formData.actif, dept: formData.department })
        });
      } else {
        // Création
        const existingEmail = users.find(u => u.email.toLowerCase() === formData.email.trim().toLowerCase());
        if (existingEmail) {
          setFormError('Un collaborateur avec cette adresse e-mail existe déjà.');
          return;
        }

        const newId = `usr-${Date.now().toString(36)}`;
        const newUser: User = {
          id: newId,
          name: formData.name.trim(),
          email: formData.email.trim().toLowerCase(),
          password: formData.password.trim() || 'BS@Alveoles2026!',
          phone: formData.phone.trim(),
          role: formData.role,
          department: formData.department,
          actif: formData.actif,
          dateCreation: today,
          dernierAcces: today
        };

        await db.users.add(newUser);

        // Audit log
        await db.auditLogs.add({
          id: `audit-${Date.now()}`,
          timestamp: new Date().toISOString(),
          userNom: currentUser?.name || 'Administrateur',
          userRole: currentUser?.role || 'DIRECTEUR_USINE',
          action: 'CREATION_UTILISATEUR',
          entite: 'Collaborateurs',
          description: `Création du compte collaborateur : ${formData.name} en tant que ${ROLES_INFO[formData.role].label}`
        });
      }

      setIsAddModalOpen(false);
      setEditingUser(null);
    } catch (err: any) {
      setFormError(`Erreur lors de l'enregistrement : ${err?.message || 'Erreur inconnue'}`);
    }
  };

  // Basculer Statut Actif/Inactif
  const handleToggleStatus = async (user: User) => {
    const newStatus = user.actif === false;
    const actionLabel = newStatus ? 'ACTIVATION_COMPTE' : 'DESACTIVATION_COMPTE';

    await db.users.update(user.id, { actif: newStatus });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: currentUser?.name || 'Administrateur',
      userRole: currentUser?.role || 'DIRECTEUR_USINE',
      action: actionLabel,
      entite: 'Collaborateurs',
      description: `${newStatus ? 'Réactivation' : 'Suspension'} du compte de ${user.name}`
    });
  };

  // Réinitialiser le mot de passe
  const handleResetPassword = async () => {
    if (!passwordResetUser || !newPassword.trim()) return;

    await db.users.update(passwordResetUser.id, { password: newPassword.trim() });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: currentUser?.name || 'Administrateur',
      userRole: currentUser?.role || 'DIRECTEUR_USINE',
      action: 'REINITIALISATION_MDP',
      entite: 'Collaborateurs',
      description: `Réinitialisation du mot de passe pour ${passwordResetUser.name} (${passwordResetUser.email})`
    });

    setPasswordResetUser(null);
    setNewPassword('');
    alert(`Le mot de passe de ${passwordResetUser.name} a été mis à jour avec succès.`);
  };

  return (
    <div className="space-y-6">
      {/* ── En-tête du module ─────────────────────────────────── */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-sm shrink-0">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Gestion des Collaborateurs & Accès
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase bg-indigo-100 text-indigo-800">
                Usine Dakar
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Annuaire officiel, gestion des identifiants et permissions des 8 postes de l'usine selon le Cahier des Charges.
            </p>
          </div>
        </div>

        <button
          onClick={handleOpenAdd}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all active:scale-95 bg-gradient-to-r ${currentTheme.gradient}`}
        >
          <UserPlus className="w-4 h-4" />
          Nouveau Collaborateur
        </button>
      </div>

      {/* ── Barre d'onglets Sous-modules (RH & Pointage) ─────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap pb-1 max-w-full">
          <button
            onClick={() => setSubTab('COLLABORATEURS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              subTab === 'COLLABORATEURS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            👥 Comptes & Rôles Usine ({users.length})
          </button>
          <button
            onClick={() => setSubTab('POINTAGE_RH')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-2 ${
              subTab === 'POINTAGE_RH'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-white text-slate-700 hover:bg-slate-100 border border-indigo-200'
            }`}
          >
            <Clock className="w-3.5 h-3.5 text-indigo-500" />
            <span>🕒 Système de Pointage 3x8</span>
            <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-amber-400 text-slate-950 uppercase tracking-wider">
              Cadré • Bientôt Actif
            </span>
          </button>
        </div>
      </div>

      {subTab === 'COLLABORATEURS' && (
        <div className="space-y-6">
          {/* ── Cartes KPIs Équipe ────────────────────────────────── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Effectif Usine</span>
            <Users className="w-4 h-4 text-indigo-500" />
          </div>
          <div className="text-2xl font-black text-slate-900">{totalUsers}</div>
          <div className="text-[11px] text-slate-500 mt-0.5">Collaborateurs enregistrés</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comptes Actifs</span>
            <UserCheck className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-emerald-600">{activeUsers}</div>
          <div className="text-[11px] text-emerald-700/80 mt-0.5">Autorisés à se connecter</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Comptes Suspendus</span>
            <XCircle className="w-4 h-4 text-rose-500" />
          </div>
          <div className="text-2xl font-black text-rose-600">{inactiveUsers}</div>
          <div className="text-[11px] text-rose-700/80 mt-0.5">Accès bloqué</div>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-slate-400 mb-1">
            <span className="text-[11px] font-bold uppercase tracking-wider">Postes CDC</span>
            <Shield className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-2xl font-black text-amber-600">{distinctRoles}/8</div>
          <div className="text-[11px] text-amber-700/80 mt-0.5">Matrice RBAC complète</div>
        </div>
      </div>

      {/* ── Filtres & Barre de recherche ──────────────────────── */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Rechercher par nom, email, téléphone ou département..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 md:pb-0">
          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les postes</option>
              {Object.entries(ROLES_INFO).map(([key, info]) => (
                <option key={key} value={key}>{info.label}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 shrink-0 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-xs font-bold text-slate-700 focus:outline-none cursor-pointer"
            >
              <option value="ALL">Tous les statuts</option>
              <option value="ACTIVE">Actifs uniquement</option>
              <option value="INACTIVE">Suspendus</option>
            </select>
          </div>
        </div>
      </div>

      {/* ── Liste des utilisateurs (Vue Hybride Desktop / Mobile) ─ */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[850px]">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Collaborateur</th>
                <th className="py-3.5 px-4">Poste & Permissions CDC</th>
                <th className="py-3.5 px-4">Département</th>
                <th className="py-3.5 px-4">Téléphone</th>
                <th className="py-3.5 px-4">Statut</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-slate-400">
                    Aucun collaborateur ne correspond à vos critères de recherche.
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => {
                  const roleConfig = ROLES_INFO[user.role] || ROLES_INFO.COMMERCIAL;
                  const isUserActive = user.actif !== false;
                  const initials = user.name
                    .split(' ')
                    .map(n => n[0])
                    .join('')
                    .slice(0, 2)
                    .toUpperCase();

                  return (
                    <tr key={user.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow-sm bg-gradient-to-br ${currentTheme.gradient}`}>
                            {initials}
                          </div>
                          <div>
                            <div className="font-bold text-slate-900">{user.name}</div>
                            <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                              <Mail className="w-3 h-3" />
                              {user.email}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-bold border ${roleConfig.badgeBg}`}>
                          {roleConfig.label}
                        </span>
                        <div className="text-[10px] text-slate-400 line-clamp-1 max-w-xs mt-1">
                          {roleConfig.desc}
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-slate-700">
                          <Building2 className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.department || 'Usine'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 font-mono text-slate-700">
                          <Phone className="w-3.5 h-3.5 text-slate-400" />
                          <span>{user.phone || 'Non renseigné'}</span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        {isUserActive ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            Actif
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                            <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                            Suspendu
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => handleOpenEdit(user)}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                            title="Modifier les informations"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => {
                              setPasswordResetUser(user);
                              setNewPassword(`BS@${Math.floor(1000 + Math.random() * 9000)}!`);
                            }}
                            className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                            title="Changer le mot de passe"
                          >
                            <KeyRound className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleToggleStatus(user)}
                            className={`p-1.5 rounded-lg transition-colors ${
                              isUserActive 
                                ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50' 
                                : 'text-slate-400 hover:text-emerald-600 hover:bg-emerald-50'
                            }`}
                            title={isUserActive ? "Suspendre l'accès" : "Réactiver l'accès"}
                          >
                            {isUserActive ? <XCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Cards View (Optimisé écran smartphone) */}
        <div className="md:hidden divide-y divide-slate-100 p-3 space-y-3">
          {filteredUsers.length === 0 ? (
            <div className="py-8 text-center text-slate-400 text-xs">
              Aucun collaborateur trouvé.
            </div>
          ) : (
            filteredUsers.map(user => {
              const roleConfig = ROLES_INFO[user.role] || ROLES_INFO.COMMERCIAL;
              const isUserActive = user.actif !== false;
              const initials = user.name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();

              return (
                <div key={user.id} className="bg-slate-50/70 p-4 rounded-2xl border border-slate-200/80 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-2.5">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs text-white shrink-0 shadow bg-gradient-to-br ${currentTheme.gradient}`}>
                        {initials}
                      </div>
                      <div>
                        <div className="font-extrabold text-sm text-slate-900">{user.name}</div>
                        <div className="text-[11px] text-slate-500">{user.email}</div>
                      </div>
                    </div>
                    {isUserActive ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 shrink-0">
                        Actif
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800 shrink-0">
                        Suspendu
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 pt-1 text-xs text-slate-600">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Poste :</span>
                      <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold border ${roleConfig.badgeBg}`}>
                        {roleConfig.label}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Département :</span>
                      <span className="font-semibold text-slate-800 text-[11px]">{user.department || 'Usine'}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-slate-400 text-[11px]">Téléphone :</span>
                      <span className="font-mono text-slate-800 text-[11px]">{user.phone}</span>
                    </div>
                  </div>

                  {/* Actions mobile */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-200">
                    <button
                      onClick={() => handleOpenEdit(user)}
                      className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <Edit2 className="w-3.5 h-3.5 text-indigo-500" />
                      Modifier
                    </button>
                    <button
                      onClick={() => {
                        setPasswordResetUser(user);
                        setNewPassword(`BS@${Math.floor(1000 + Math.random() * 9000)}!`);
                      }}
                      className="py-1.5 px-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-bold flex items-center justify-center gap-1 shadow-sm"
                    >
                      <KeyRound className="w-3.5 h-3.5 text-amber-500" />
                      MDP
                    </button>
                    <button
                      onClick={() => handleToggleStatus(user)}
                      className={`py-1.5 px-2 rounded-xl border text-xs font-bold flex items-center justify-center gap-1 shadow-sm ${
                        isUserActive 
                          ? 'bg-rose-50 border-rose-200 text-rose-700' 
                          : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                      }`}
                    >
                      {isUserActive ? 'Suspendre' : 'Activer'}
                    </button>
                  </div>
                </div>
              );
            })
          )}
          </div>
        </div>
      </div>
      )}

      {/* ── Sous-Module : Système de Pointage RH (Shifts 3x8) ───── */}
      {subTab === 'POINTAGE_RH' && (
        <div className="space-y-6">
          {/* Bannière de Cadrage Fonctionnel CDC Section 1.3 #6 */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 sm:p-6 rounded-3xl border border-indigo-800/60 shadow-xl">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-400 text-slate-950 uppercase tracking-wider flex items-center gap-1">
                <Clock className="w-3.5 h-3.5" />
                Cadrage CDC Section 1.3 #6 & 5.1
              </span>
              <span className="text-xs text-indigo-300">• Module Système de Pointage RH & Shifts 3x8</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight">
              Système de Pointage & Temps de Travail Opérationnel
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
              Ce module est spécialement cadré pour l'enregistrement numérique des prises et fins de poste des opérateurs d'usine. Il assurera la corrélation infalsifiable entre les <strong>heures de fonctionnement des machines</strong> (cadence réelle 1 700 alv/h), les arrêts techniques et le calcul automatique des <strong>primes de rendement</strong> (Annexe Primes Contrôle Performance Automatisée).
            </p>
          </div>

          {/* Les 3 Shifts Industriels de Référence */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-amber-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-600">Shift 1 • Matin</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-amber-100 text-amber-800">06h00 – 14h00</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Équipe Production Matin</h3>
              <p className="text-xs text-slate-500 mt-1">Démarrage ligne pulpeur, montée en température séchoir et premier cycle thermoformage.</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Durée théorique :</span>
                <span className="font-mono text-indigo-700 font-bold">8h effectives</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-indigo-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">Shift 2 • Après-midi</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800">14h00 – 22h00</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Équipe Production Soir</h3>
              <p className="text-xs text-slate-500 mt-1">Cadence nominale continue, contrôle qualité rebuts et alimentation continue en pâte.</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Durée théorique :</span>
                <span className="font-mono text-indigo-700 font-bold">8h effectives</span>
              </div>
            </div>

            <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm relative overflow-hidden">
              <div className="absolute top-0 right-0 w-2 h-full bg-purple-500" />
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-purple-600">Shift 3 • Nuit</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800">22h00 – 06h00</span>
              </div>
              <h3 className="font-extrabold text-slate-900 text-base">Équipe Production Nuit</h3>
              <p className="text-xs text-slate-500 mt-1">Thermoformage grande cadence, cerclage fardeaux 100 unités et nettoyage de maintenance.</p>
              <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-slate-700">
                <span>Durée théorique :</span>
                <span className="font-mono text-indigo-700 font-bold">8h effectives</span>
              </div>
            </div>
          </div>

          {/* Démonstrateur Interactif de Badgeage */}
          <div className="bg-white rounded-3xl border border-slate-200/90 p-5 sm:p-6 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-600" />
                  Simulateur de Badgeage & Pointage (Validation Client)
                </h3>
                <p className="text-xs text-slate-500">
                  Testez en direct l'enregistrement d'une prise de poste ou fin de shift opérateur.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                ● Pointeuse connectée (Horloge réseau)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Collaborateur à pointer
                </label>
                <select
                  id="select-pointage-user"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium"
                >
                  {users.map(u => (
                    <option key={u.id} value={u.name}>
                      {u.name} ({ROLES_INFO[u.role]?.label || u.role})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Shift affecté
                </label>
                <select className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium">
                  <option>Shift 1 (Matin • 06h00 – 14h00)</option>
                  <option>Shift 2 (Après-midi • 14h00 – 22h00)</option>
                  <option>Shift 3 (Nuit • 22h00 – 06h00)</option>
                  <option>Équipe Commerciale Terrain</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    const sel = (document.getElementById('select-pointage-user') as HTMLSelectElement)?.value || 'Opérateur';
                    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    setPointageSimule({
                      dernierBadge: sel,
                      heure: time,
                      type: 'ARRIVEE'
                    });
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Check className="w-4 h-4" />
                  Prise de Poste
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const sel = (document.getElementById('select-pointage-user') as HTMLSelectElement)?.value || 'Opérateur';
                    const time = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
                    setPointageSimule({
                      dernierBadge: sel,
                      heure: time,
                      type: 'DEPART'
                    });
                  }}
                  className="flex-1 py-2.5 px-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-extrabold text-xs flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all"
                >
                  <Clock className="w-4 h-4" />
                  Fin de Shift
                </button>
              </div>
            </div>

            {/* Notification de pointage réussi */}
            {pointageSimule.dernierBadge && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  <div>
                    <span className="font-extrabold">Pointage enregistré avec succès : </span>
                    <span>{pointageSimule.dernierBadge} ({pointageSimule.type === 'ARRIVEE' ? 'Arrivée / Prise de poste' : 'Départ / Fin de poste'}) à <strong>{pointageSimule.heure}</strong></span>
                  </div>
                </div>
                <span className="font-mono text-[10px] font-bold bg-emerald-200/80 text-emerald-950 px-2.5 py-1 rounded-full">
                  Horodatage Certifié
                </span>
              </div>
            )}
          </div>

          {/* Registre des Pointages Journaliers de l'Usine */}
          <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="font-extrabold text-slate-900 text-base">
                  Registre des Pointages d'Usine du Jour
                </h3>
                <p className="text-xs text-slate-500">Horaires constatés et cumul des heures travaillées</p>
              </div>
              <span className="text-xs font-semibold text-slate-500">
                Période : Semaine en cours (26 jours/mois)
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Collaborateur</th>
                    <th className="py-3 px-4">Poste / Affectation</th>
                    <th className="py-3 px-4">Shift Prévu</th>
                    <th className="py-3 px-4 text-center">Badge Arrivée</th>
                    <th className="py-3 px-4 text-center">Badge Départ</th>
                    <th className="py-3 px-4 text-right">Heures Effectives</th>
                    <th className="py-3 px-4 text-center">Statut Présence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">Moussa Ndiaye</td>
                    <td className="py-3.5 px-4 text-slate-600">Chef de Production / TRS</td>
                    <td className="py-3.5 px-4 font-semibold text-indigo-700">Shift 1 (Matin)</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">05:52</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-700">14:08</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">8h 16m</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        Poste Accompli
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">Modou Faye</td>
                    <td className="py-3.5 px-4 text-slate-600">Responsable Stock & Cartons</td>
                    <td className="py-3.5 px-4 font-semibold text-amber-700">Magasin Journée</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">07:45</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">En cours</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">En cours</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">
                        ● Présent au Poste
                      </span>
                    </td>
                  </tr>
                  <tr className="hover:bg-slate-50/80">
                    <td className="py-3.5 px-4 font-bold text-slate-900">Fatou Sow</td>
                    <td className="py-3.5 px-4 text-slate-600">Responsable Commerciale</td>
                    <td className="py-3.5 px-4 font-semibold text-purple-700">Portefeuille Clients</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-emerald-600">08:02</td>
                    <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-400">En cours</td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900">En cours</td>
                    <td className="py-3.5 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        ● En Mission Client
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── Modal d'Ajout / Édition Collaborateur ──────────────── */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-[250] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 text-slate-900 shadow-2xl space-y-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  {editingUser ? <Edit2 className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
                </div>
                <h3 className="font-extrabold text-base text-slate-900">
                  {editingUser ? `Modifier : ${editingUser.name}` : 'Nouveau Collaborateur Usine'}
                </h3>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                ✕
              </button>
            </div>

            {formError && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveUser} className="space-y-4 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-slate-700">Nom & Prénom *</label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="ex: M. Abdoulaye Seck"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">E-mail Professionnel *</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="nom@bsalveoles.sn"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Téléphone (Sénégal) *</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    placeholder="+221 77 000 00 00"
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Poste & Droits d'Accès CDC *</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {Object.entries(ROLES_INFO).map(([key, info]) => (
                      <option key={key} value={key}>{info.label}</option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Département *</label>
                  <select
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-bold text-slate-800 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {DEPARTMENTS.map((dept) => (
                      <option key={dept} value={dept}>{dept}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Description du rôle sélectionné */}
              <div className="p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-indigo-900 text-[11px] leading-relaxed">
                <strong>Périmètre du poste :</strong> {ROLES_INFO[formData.role].desc}
              </div>

              {/* Mot de passe initial (si création) ou modification facultative */}
              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">
                    {editingUser ? 'Nouveau Mot de Passe (laisser vide si inchangé)' : 'Mot de Passe Initial *'}
                  </label>
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, password: `BS@${Math.floor(1000 + Math.random() * 9000)}!` })}
                    className="text-[10px] text-indigo-600 font-bold hover:underline"
                  >
                    Générer automatique
                  </button>
                </div>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    placeholder={editingUser ? '••••••••' : 'ex: BS@Alveoles2026!'}
                    className="w-full pl-3 pr-10 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Statut du compte */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="userActif"
                  checked={formData.actif}
                  onChange={(e) => setFormData({ ...formData, actif: e.target.checked })}
                  className="rounded text-indigo-600 focus:ring-indigo-500 w-4 h-4"
                />
                <label htmlFor="userActif" className="font-bold text-slate-800 cursor-pointer text-xs">
                  Compte actif et autorisé à se connecter à l'ERP
                </label>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md flex items-center justify-end gap-2 pt-3 pb-4 sm:pb-2 border-t border-slate-100 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-5 py-2 rounded-xl text-white font-bold text-xs shadow-md bg-gradient-to-r ${currentTheme.gradient}`}
                >
                  {editingUser ? 'Enregistrer les modifications' : 'Créer le collaborateur'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Réinitialisation Mot de Passe ───────────────── */}
      {passwordResetUser && (
        <div className="fixed inset-0 z-[250] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-sm w-full p-4 sm:p-5 text-slate-900 shadow-2xl space-y-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                  <KeyRound className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm text-slate-900">Changer Mot de Passe</h3>
                  <p className="text-[10px] text-slate-400">{passwordResetUser.name}</p>
                </div>
              </div>
              <button
                onClick={() => setPasswordResetUser(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <p className="text-slate-600 text-[11px]">
                Définissez un nouveau mot de passe pour <strong>{passwordResetUser.email}</strong>.
              </p>

              <div className="space-y-1">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-slate-700">Nouveau mot de passe</label>
                  <button
                    type="button"
                    onClick={() => setNewPassword(`BS@${Math.floor(1000 + Math.random() * 9000)}!`)}
                    className="text-[10px] text-amber-600 font-bold hover:underline"
                  >
                    Générer
                  </button>
                </div>
                <input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl font-mono text-xs font-bold focus:bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="p-2.5 bg-amber-50 rounded-xl text-amber-800 text-[10px] leading-relaxed">
                Ce mot de passe sera immédiatement effectif et enregistré dans le journal d'audit de sécurité.
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md flex items-center justify-end gap-2 pt-2 pb-4 sm:pb-2 border-t border-slate-100 z-20 mt-auto">
                <button
                  onClick={() => setPasswordResetUser(null)}
                  className="px-3 py-1.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResetPassword}
                  className="px-4 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-white font-bold text-xs shadow-md"
                >
                  Valider le mot de passe
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
