import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, INITIAL_FACTORY_USERS } from '../../db/database';
import { User } from '../../types';
import { Lock, Mail, Eye, EyeOff, Factory, AlertCircle, User as UserIcon, HelpCircle } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const { currentTheme } = useTheme();

  // Utilisateurs dynamiques depuis Dexie avec fallback initial
  const dbUsers = useLiveQuery(() => db.users.toArray()) || [];
  const usersList = dbUsers.length > 0 ? dbUsers : INITIAL_FACTORY_USERS;

  const [identifiant, setIdentifiant] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [showDemoList, setShowDemoList] = useState(false);

  // Soumission du formulaire
  const handleDirectSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const cleanId = identifiant.trim().toLowerCase();
    if (!cleanId || !password) {
      setError('Veuillez renseigner votre identifiant et votre mot de passe.');
      return;
    }

    setLoading(true);

    setTimeout(async () => {
      // Recherche de l'utilisateur par email, nom ou préfixe de rôle
      const matchedUser = usersList.find(u =>
        u.email.toLowerCase() === cleanId ||
        u.name.toLowerCase() === cleanId ||
        u.role.toLowerCase() === cleanId ||
        u.email.split('@')[0].toLowerCase() === cleanId
      );

      if (!matchedUser) {
        setLoading(false);
        setError('Identifiant ou email introuvable dans le système usine.');
        return;
      }

      // Vérification compte suspendu
      if (matchedUser.actif === false) {
        setLoading(false);
        setError('Ce compte collaborateur est suspendu. Veuillez contacter la direction d\'usine.');
        return;
      }

      if (password === matchedUser.password) {
        setLoading(false);
        // Mise à jour date dernier accès
        try {
          await db.users.update(matchedUser.id, { dernierAcces: new Date().toISOString().split('T')[0] });
        } catch (_) {}

        onLoginSuccess({
          id: matchedUser.id,
          name: matchedUser.name,
          email: matchedUser.email,
          role: matchedUser.role,
          phone: matchedUser.phone,
          department: matchedUser.department,
          actif: matchedUser.actif
        });
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        setError(
          newAttempts >= 3
            ? 'Trop de tentatives. Contactez l\'administrateur de l\'usine.'
            : `Mot de passe incorrect (${newAttempts}/3 tentative${newAttempts > 1 ? 's' : ''})`
        );
        setLoading(false);
      }
    }, 450);
  };

  // Pré-remplissage rapide en mode démo
  const handleQuickFill = (u: User) => {
    setIdentifiant(u.email);
    setPassword(u.password || 'BS@Alveoles2026!');
    setError('');
  };

  const today = new Date().toLocaleDateString('fr-FR', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric'
  });


  return (
    <div className="w-full max-w-md mx-auto">
      {/* Card principale */}
      <div className="bg-white rounded-3xl shadow-2xl shadow-black/30 border border-slate-200/90 overflow-hidden">
        {/* Accentuation haute couleur officielle */}
        <div className="h-2 w-full bg-gradient-to-r from-[#1E3A5F] via-[#C49B66] to-[#1E3A5F]" />

        {/* En-tête avec le logo officiel BS Alvéoles en grand format net */}
        <div className="pt-8 pb-5 px-7 text-center border-b border-slate-100 bg-gradient-to-b from-slate-50/70 to-white">
          <div className="flex justify-center mb-4">
            <img 
              src="/logo-bs-alveoles.png" 
              alt="BS Alvéoles – Bécaye Saliou" 
              className="h-16 sm:h-20 w-auto object-contain drop-shadow-sm" 
            />
          </div>
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1E3A5F]/10 border border-[#1E3A5F]/20 text-xs font-black text-[#1E3A5F]">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Portail ERP & MES Usine · Dakar</span>
          </div>
          <div className="text-xs font-bold text-slate-600 capitalize mt-2">{today}</div>
        </div>

        <div className="p-7">
          <h2 className="text-xl font-black text-slate-950 mb-1 tracking-tight">Connexion Collaborateur</h2>
          <p className="text-xs font-semibold text-slate-600 mb-6">
            Saisissez vos identifiants pour accéder à votre espace de travail usine
          </p>

          {error && (
            <div className="mb-5 flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs font-bold shadow-xs">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5 text-red-600" />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleDirectSubmit} className="space-y-4">
            {/* Champ Identifiant ou Email */}
            <div>
              <label className="block text-xs font-black text-slate-900 mb-1.5">
                Identifiant ou Email professionnel
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  required
                  autoFocus
                  placeholder="ex: directeur@bsalveoles.sn ou amadou.ba"
                  value={identifiant}
                  onChange={e => setIdentifiant(e.target.value)}
                  disabled={attempts >= 3}
                  className="w-full pl-10 pr-3.5 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-normal focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-slate-50 focus:bg-white shadow-xs"
                />
              </div>
            </div>

            {/* Champ Mot de passe */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-black text-slate-900">
                  Mot de passe
                </label>
                <span className="text-[11px] font-bold text-slate-500">Sensible à la casse</span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  disabled={attempts >= 3}
                  className="w-full pl-10 pr-11 py-3 rounded-xl border border-slate-300 text-sm font-bold text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#1E3A5F] bg-slate-50 focus:bg-white shadow-xs font-mono"
                />
                <button
                  type="button"
                  onClick={() => setShowPwd(!showPwd)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-800 transition-colors"
                >
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Bouton de Connexion Haute Visibilité */}
            <button
              type="submit"
              disabled={loading || attempts >= 3 || !identifiant || !password}
              className="w-full py-3.5 rounded-xl text-white font-black text-sm shadow-xl shadow-[#1E3A5F]/25 hover:shadow-[#1E3A5F]/40 transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed bg-gradient-to-r from-[#1E3A5F] via-[#244570] to-[#142842] border border-[#1E3A5F]"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                  <span>Vérification en cours…</span>
                </>
              ) : (
                <>
                  <UserIcon className="w-4 h-4" />
                  <span>Se Connecter au Système</span>
                </>
              )}
            </button>
          </form>

          {/* Section d'aide démo avec haute lisibilité */}
          <div className="mt-6 pt-5 border-t border-slate-200">
            <button
              type="button"
              onClick={() => setShowDemoList(!showDemoList)}
              className="w-full text-center text-xs font-extrabold text-[#1E3A5F] hover:text-[#142842] transition-colors flex items-center justify-center gap-1.5"
            >
              <HelpCircle className="w-4 h-4 text-[#1E3A5F]" />
              <span>{showDemoList ? 'Masquer l\'aide' : '🔑 Profils de test préconfigurés (Cahier des Charges)'}</span>
            </button>

            {showDemoList && (
              <div className="mt-3.5 space-y-2 p-3 rounded-2xl bg-slate-100 border border-slate-200">
                <p className="text-xs text-slate-700 font-bold mb-2">
                  Cliquez sur un profil pour remplir automatiquement ses identifiants :
                </p>
                {usersList.map(u => (
                  <button
                    key={u.id}
                    type="button"
                    onClick={() => handleQuickFill(u)}
                    className="w-full text-left p-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 shadow-xs transition-all flex items-center justify-between text-xs group"
                  >
                    <span className="font-extrabold text-slate-900 group-hover:text-[#1E3A5F]">{u.name}</span>
                    <span className="text-[11px] font-bold text-slate-600 px-2 py-0.5 rounded-md bg-slate-100">{u.role}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mention de sécurité haute lisibilité */}
      <p className="text-center text-white/90 text-xs mt-4 font-bold flex items-center justify-center gap-2 drop-shadow-sm">
        <span>🔒</span>
        <span>Accès interne sécurisé · BS ALVÉOLES SUARL · Dakar, Sénégal</span>
      </p>
    </div>
  );
};
