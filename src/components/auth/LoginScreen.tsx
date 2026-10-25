import React, { useState } from 'react';
import { User, UserRole } from '../../types';
import { Lock, Mail, ArrowRight, Eye, EyeOff, Factory, CheckCircle2 } from 'lucide-react';

interface LoginScreenProps {
  onLoginSuccess: (user: User) => void;
}

const USERS: (User & { password: string; roleLabel: string })[] = [
  {
    id: 'usr-dir',
    name: 'M. Ndiaye Saliou',
    email: 'directeur@bsalveoles.sn',
    password: 'BS@Directeur2026!',
    role: 'DIRECTEUR_USINE',
    phone: '+221 76 622 59 79',
    roleLabel: 'Direction Générale d\'Usine'
  },
  {
    id: 'usr-prod',
    name: 'Amadou Bâ',
    email: 'production@bsalveoles.sn',
    password: 'BS@Prod2026!',
    role: 'RESPONSABLE_PRODUCTION',
    phone: '+221 77 450 11 22',
    roleLabel: 'Responsable Production & TRS'
  },
  {
    id: 'usr-stock',
    name: 'Modou Faye',
    email: 'stock@bsalveoles.sn',
    password: 'BS@Stock2026!',
    role: 'RESPONSABLE_STOCK',
    phone: '+221 78 300 44 55',
    roleLabel: 'Responsable Stocks & Approvisionnements Cartons'
  },
  {
    id: 'usr-com',
    name: 'Ibrahima Ndiaye',
    email: 'commercial@bsalveoles.sn',
    password: 'BS@Com2026!',
    role: 'RESPONSABLE_COMMERCIAL',
    phone: '+221 77 100 00 01',
    roleLabel: 'Responsable Commercial & Grands Comptes'
  },
  {
    id: 'usr-cpt',
    name: 'Awa Diop',
    email: 'comptable@bsalveoles.sn',
    password: 'BS@Cpt2026!',
    role: 'COMPTABLE',
    phone: '+221 76 100 00 03',
    roleLabel: 'Comptabilité Générale & Trésorerie'
  },
  {
    id: 'usr-super',
    name: 'Super Administrateur',
    email: 'admin@bsalveoles.sn',
    password: 'BS@Admin2026!',
    role: 'SUPER_ADMIN',
    phone: '+221 78 914 88 88',
    roleLabel: 'Super Administrateur Système'
  }
];

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    setTimeout(() => {
      const found = USERS.find(u => u.email.toLowerCase() === email.toLowerCase().trim() && u.password === password);
      if (found) {
        onLoginSuccess({
          id: found.id,
          name: found.name,
          email: found.email,
          role: found.role,
          phone: found.phone
        });
      } else {
        setError('Email ou mot de passe incorrect. Vous pouvez cliquer sur un profil rapide ci-dessous.');
        setLoading(false);
      }
    }, 400);
  };

  const handleSelectQuickUser = (user: typeof USERS[0]) => {
    setEmail(user.email);
    setPassword(user.password);
    setError('');
  };

  return (
    <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-2xl border border-slate-200">
      <div className="text-center mb-6">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-amber-500/20 text-slate-950">
          <Factory className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-black text-slate-900 tracking-tight">Accès Sécurisé Usine</h2>
        <p className="text-xs text-slate-500 mt-1">BS ALVÉOLES SUARL • Système de Gestion MES & ERP</p>
      </div>

      {error && (
        <div className="mb-4 p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs font-semibold">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Email Professionnel</label>
          <div className="relative">
            <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="email"
              required
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="ex: directeur@bsalveoles.sn"
              className="w-full text-xs pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-700 mb-1">Mot de Passe</label>
          <div className="relative">
            <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type={showPwd ? 'text' : 'password'}
              required
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full text-xs pl-9 pr-10 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
            <button
              type="button"
              onClick={() => setShowPwd(!showPwd)}
              className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
            >
              {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
        >
          {loading ? 'Connexion en cours...' : 'Se Connecter à l\'Usine'}
          <ArrowRight className="w-4 h-4 text-amber-400" />
        </button>
      </form>

      {/* Profils de démonstration rapide */}
      <div className="mt-6 pt-5 border-t border-slate-100">
        <span className="text-[10px] uppercase tracking-wider font-extrabold text-slate-400 block text-center mb-2">
          Connexion Rapide par Rôle (Cliquez pour tester)
        </span>
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          {USERS.slice(0, 4).map(u => (
            <button
              key={u.id}
              type="button"
              onClick={() => handleSelectQuickUser(u)}
              className="p-2 rounded-xl bg-slate-50 hover:bg-amber-50 hover:border-amber-300 border border-slate-200 text-left transition-all"
            >
              <div className="font-bold text-slate-900 truncate">{u.name}</div>
              <div className="text-[10px] text-slate-500 truncate">{u.role.replace('_', ' ')}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
