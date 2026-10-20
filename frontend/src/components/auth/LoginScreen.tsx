import React, { useState } from 'react';
import { User } from '../../types';
import { Lock, Mail, ArrowRight, Eye, EyeOff, KeyRound, CheckCircle2, X, Sparkles, Globe } from 'lucide-react';
import { PublicPortalModal } from '../public/PublicPortalModal';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const USERS: (User & { password: string; roleLabel: string })[] = [
  {
    id: 'usr-admin',
    name: 'M. Ndiaye Saliou',
    email: 'admin@bsdistribution.sn',
    password: 'BSD@Admin2025',
    role: 'ADMIN_GENERAL',
    phone: '+221 76 622 59 79',
    roleLabel: 'Administration Générale (Gérant)'
  },
  {
    id: 'usr-com1',
    name: 'Ibrahima Ndiaye',
    email: 'commercial@bsdistribution.sn',
    password: 'BSD@Com2025',
    role: 'COMMERCIAL',
    phone: '+221 77 100 00 01',
    roleLabel: 'Commercial Terrain'
  },
  {
    id: 'usr-dem1',
    name: 'Moussa Kane',
    email: 'demarcheur@bsdistribution.sn',
    password: 'BSD@Dem2025',
    role: 'DEMARCHEUR',
    phone: '+221 78 100 00 02',
    roleLabel: 'Démarcheur & Enrôlement'
  },
  {
    id: 'usr-cpt1',
    name: 'Awa Diop',
    email: 'comptable@bsdistribution.sn',
    password: 'BSD@Cpt2025',
    role: 'COMPTABLE',
    phone: '+221 76 100 00 03',
    roleLabel: 'Comptabilité & Stock'
  },
  {
    id: 'usr-super',
    name: 'Super Administrateur',
    email: 'superadmin@bsdistribution.sn',
    password: 'BSD@Super2025!',
    role: 'SUPER_ADMIN',
    phone: '+221 78 914 88 88',
    roleLabel: 'Super Administration Système'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail]             = useState('');
  const [password, setPassword]       = useState('');
  const [showPwd, setShowPwd]         = useState(false);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);
  
  // Forgot Password & Public Portal Modal State
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [showPublicModal, setShowPublicModal] = useState(false);
  const [forgotEmail, setForgotEmail]         = useState('');
  const [resetSuccessMsg, setResetSuccessMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 400));

    const found = USERS.find(u => u.email.toLowerCase() === email.trim().toLowerCase());

    if (!found || found.password !== password) {
      setError('Identifiants incorrects. Veuillez vérifier votre e-mail et mot de passe.');
      setLoading(false);
      return;
    }

    setLoading(false);
    onLoginSuccess(found);
  };

  const handleQuickSelectUser = (user: typeof USERS[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  const handleForgotPasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const found = USERS.find(u => u.email.toLowerCase() === forgotEmail.trim().toLowerCase() || u.phone.includes(forgotEmail.trim()));
    if (found) {
      setResetSuccessMsg(`Compte trouvé (${found.name}) ! Votre mot de passe actuel est : ${found.password}`);
    } else {
      setResetSuccessMsg('Consigne : Les identifiants ont été envoyés par SMS au gérant M. Ndiaye Saliou (+221 76 622 59 79).');
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-amber-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-0 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
      </div>

      <div className="w-full max-w-md relative z-10 space-y-5">
        {/* Brand Official Logo Display */}
        <div className="text-center">
          <div className="p-4 bg-slate-900/90 border border-amber-500/40 rounded-3xl backdrop-blur-xl shadow-2xl inline-block mb-3">
            <img 
              src="/logo.png" 
              alt="BS DISTRIBUTION Logo Officiel" 
              className="h-20 w-auto object-contain mx-auto"
            />
          </div>
          <h1 className="text-2xl font-extrabold text-slate-100 tracking-tight font-display">BS DISTRIBUTION</h1>
          <p className="text-xs text-amber-400 font-extrabold tracking-widest uppercase mt-0.5">SUARL — KEUR MASSAR</p>
          <p className="text-[11px] text-slate-400 mt-1">Plateforme de Gestion Commerciale & Logistique</p>
        </div>

        {/* Public Access Banner Button */}
        <button
          type="button"
          onClick={() => setShowPublicModal(true)}
          className="w-full p-3.5 bg-gradient-to-r from-amber-500/20 via-amber-500/15 to-amber-600/20 hover:from-amber-500/30 hover:to-amber-600/30 border border-amber-500/40 rounded-2xl text-amber-300 font-extrabold text-xs flex items-center justify-between transition-all group shadow-xl"
        >
          <div className="flex items-center gap-2.5">
            <Globe className="w-4 h-4 text-amber-400 animate-spin-slow" />
            <div className="text-left">
              <p className="text-slate-100 font-extrabold">Accès Public — Clients & Fermes</p>
              <p className="text-[10px] text-amber-400/90 font-medium">Passer une commande ou devenir partenaire</p>
            </div>
          </div>
          <span className="text-[10px] bg-amber-500 text-slate-950 font-extrabold px-2.5 py-1 rounded-xl uppercase tracking-wide group-hover:scale-105 transition-transform shadow-md">
            Ouvrir →
          </span>
        </button>

        {/* Staff Login Card */}
        <div className="bg-slate-900/90 border border-slate-800 rounded-3xl p-6 backdrop-blur-xl shadow-2xl space-y-5">
          <div>
            <h2 className="text-base font-extrabold text-slate-100">Espace Équipe & Personnel</h2>
            <p className="text-xs text-slate-400 mt-0.5">Saisissez vos identifiants ou choisissez un compte ci-dessous</p>
          </div>

          {error && (
            <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs text-slate-300 font-semibold mb-1.5">Adresse e-mail professionnelle</label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type="email"
                  required
                  autoComplete="email"
                  placeholder="prenom.nom@bsdistribution.sn"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-4 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs text-slate-300 font-semibold">Mot de passe</label>
                <button
                  type="button"
                  onClick={() => {
                    setShowForgotModal(true);
                    setForgotEmail(email);
                    setResetSuccessMsg('');
                  }}
                  className="text-[11px] text-amber-400 hover:text-amber-300 font-bold underline"
                >
                  Mot de passe oublié ?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3 top-3 text-slate-500" />
                <input
                  type={showPwd ? 'text' : 'password'}
                  required
                  autoComplete="current-password"
                  placeholder="••••••••••••"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className="w-full bg-slate-950/80 border border-slate-700 rounded-xl pl-9 pr-10 py-2.5 text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors placeholder:text-slate-600 font-medium"
                />
                <button type="button" onClick={() => setShowPwd(s => !s)}
                  className="absolute right-3 top-3 text-slate-500 hover:text-slate-300 transition-colors">
                  {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-sm rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <span className="w-4 h-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                  Vérification...
                </>
              ) : (
                <>
                  Se connecter <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Quick Account Selector */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <p className="text-[11px] text-slate-400 font-bold uppercase tracking-wider">Sélection rapide par profil :</p>
            <div className="grid grid-cols-2 gap-1.5 text-[10px]">
              {USERS.map(u => (
                <button
                  key={u.id}
                  type="button"
                  onClick={() => handleQuickSelectUser(u)}
                  className={`p-2 rounded-xl text-left border transition-all ${
                    email === u.email 
                      ? 'bg-amber-500/20 border-amber-500 text-amber-300 font-extrabold' 
                      : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  <p className="font-extrabold truncate">{u.name}</p>
                  <p className="text-[9px] text-slate-500 truncate">{u.role}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer Info */}
        <div className="text-center text-[10px] text-slate-500">
          <p>BS Distribution D'Œufs SUARL — Keur Massar Villa N° 96</p>
          <p className="text-amber-400 font-mono mt-0.5">+221 76 622 59 79 / +221 78 914 88 88</p>
        </div>
      </div>

      {/* ── Forgot Password Modal ────────────────────────────────────────── */}
      {showForgotModal && (
        <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 w-full max-w-sm rounded-3xl p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <div className="flex items-center gap-2">
                <KeyRound className="w-4 h-4 text-amber-400" />
                <h3 className="text-sm font-extrabold text-slate-100 font-display">Récupération de mot de passe</h3>
              </div>
              <button onClick={() => setShowForgotModal(false)} className="text-slate-400 hover:text-slate-200">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleForgotPasswordSubmit} className="space-y-3 text-xs">
              <p className="text-slate-400">Entrez votre adresse e-mail ou votre numéro de téléphone au Sénégal pour retrouver vos accès.</p>
              
              <div>
                <label className="block text-slate-300 font-semibold mb-1">E-mail ou Téléphone</label>
                <input 
                  type="text"
                  required
                  placeholder="ex: admin@bsdistribution.sn ou 76 622 59 79"
                  value={forgotEmail}
                  onChange={e => setForgotEmail(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-slate-100 font-medium focus:border-amber-500 focus:outline-none"
                />
              </div>

              {resetSuccessMsg && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 text-amber-300 rounded-xl text-xs font-medium space-y-1">
                  <p>{resetSuccessMsg}</p>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
                <button type="button" onClick={() => setShowForgotModal(false)} className="px-3 py-2 bg-slate-800 text-slate-300 font-bold rounded-xl">Fermer</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-slate-950 font-extrabold rounded-xl shadow-md">Vérifier Identifiants</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Public Portal Modal ───────────────────────────────────────────── */}
      {showPublicModal && (
        <PublicPortalModal onClose={() => setShowPublicModal(false)} />
      )}
    </div>
  );
};
