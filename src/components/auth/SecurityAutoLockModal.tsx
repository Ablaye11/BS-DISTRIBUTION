import React, { useState, useEffect } from 'react';
import { User } from '../../types';
import { Lock, ShieldAlert, ArrowRight, Eye, EyeOff, KeyRound, Sparkles } from 'lucide-react';
import { db } from '../../db/database';

interface SecurityAutoLockModalProps {
  currentUser: User;
  onUnlock: () => void;
  onLogout: () => void;
}

export const SecurityAutoLockModal: React.FC<SecurityAutoLockModalProps> = ({
  currentUser,
  onUnlock,
  onLogout
}) => {
  const [password, setPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleUnlockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    await new Promise(r => setTimeout(r, 400));

    // Verify password match against standard accounts
    const validPasswords: Record<string, string> = {
      'admin@bsdistribution.sn': 'BSD@Admin2025',
      'commercial@bsdistribution.sn': 'BSD@Com2025',
      'demarcheur@bsdistribution.sn': 'BSD@Dem2025',
      'comptable@bsdistribution.sn': 'BSD@Cpt2025',
      'superadmin@bsdistribution.sn': 'BSD@Super2025!'
    };

    const expectedPwd = validPasswords[currentUser.email.toLowerCase()] || 'BSD@Admin2025';

    if (password !== expectedPwd) {
      setError('Mot de passe de sécurité incorrect.');
      await db.auditLogs.add({
        id: `audit-sec-fail-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userNom: currentUser.name,
        userRole: currentUser.role,
        action: 'ECHEC_DEVERROUILLAGE',
        entite: 'Sécurité',
        description: `Tentative infructueuse de déverrouillage de session après inactivité.`,
      });
      setLoading(false);
      return;
    }

    // Audit log successful unlock
    await db.auditLogs.add({
      id: `audit-sec-unlock-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: currentUser.name,
      userRole: currentUser.role,
      action: 'DEVERROUILLAGE_SESSION',
      entite: 'Sécurité',
      description: `Session déverrouillée avec succès après inactivité.`,
    });

    setLoading(false);
    onUnlock();
  };

  return (
    <div className="fixed inset-0 z-[800] bg-slate-950/95 backdrop-blur-2xl flex items-center justify-center p-4 font-sans text-slate-100">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl p-6 md:p-8 space-y-6 shadow-2xl relative overflow-hidden">
        {/* Ambient Glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Lock Icon */}
        <div className="text-center space-y-3">
          <div className="w-16 h-16 bg-amber-500/15 border border-amber-500/30 text-amber-400 rounded-3xl flex items-center justify-center mx-auto shadow-xl">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 px-2.5 py-0.5 rounded-full uppercase tracking-wider">
              SÉCURITÉ AUTOMATIQUE
            </span>
            <h2 className="text-xl font-extrabold text-white mt-2 font-display">Session Verrouillée pour Inactivité</h2>
            <p className="text-xs text-slate-400 mt-1">Par mesure de sécurité, veuillez entrer votre mot de passe pour reprendre votre travail.</p>
          </div>
        </div>

        {/* User Card */}
        <div className="bg-slate-950/80 border border-slate-800 p-3.5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-amber-500 text-slate-950 font-extrabold text-sm flex items-center justify-center shadow-md">
              {currentUser.name.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-extrabold text-white">{currentUser.name}</p>
              <p className="text-[10px] text-amber-400 font-bold">{currentUser.role}</p>
            </div>
          </div>
          <span className="text-[10px] text-emerald-400 bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded-full font-bold">Actif</span>
        </div>

        {error && (
          <div className="p-3 bg-red-500/15 border border-red-500/30 text-red-300 rounded-xl text-xs font-semibold flex items-center gap-2">
            <ShieldAlert className="w-4 h-4 text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleUnlockSubmit} className="space-y-4">
          <div>
            <label className="block text-xs text-slate-300 font-semibold mb-1.5">Mot de passe utilisateur</label>
            <div className="relative">
              <input
                type={showPwd ? 'text' : 'password'}
                required
                autoFocus
                placeholder="••••••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-4 pr-10 py-3 text-slate-100 text-xs focus:outline-none focus:border-amber-500 transition-colors font-mono"
              />
              <button 
                type="button" 
                onClick={() => setShowPwd(s => !s)}
                className="absolute right-3 top-3.5 text-slate-500 hover:text-slate-300"
              >
                {showPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-extrabold text-xs rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-60"
          >
            {loading ? 'Vérification...' : <>Déverrouiller la Session <ArrowRight className="w-4 h-4" /></>}
          </button>
        </form>

        <div className="pt-2 border-t border-slate-800 text-center">
          <button
            type="button"
            onClick={onLogout}
            className="text-xs text-slate-400 hover:text-red-400 font-bold transition-colors underline"
          >
            Changer de compte ou Se Déconnecter
          </button>
        </div>
      </div>
    </div>
  );
};
