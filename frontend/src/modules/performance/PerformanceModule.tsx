import React from 'react';
import { CommissionRecord } from '../../types';
import { Award } from 'lucide-react';
import { db } from '../../db/database';

interface PerformanceModuleProps {
  commissions: CommissionRecord[];
  onRefreshData: () => void;
}

export const PerformanceModule: React.FC<PerformanceModuleProps> = ({ commissions, onRefreshData }) => {
  const handlePayCommission = async (id: string) => {
    await db.commissions.update(id, { statut: 'Payée' });
    onRefreshData();
    alert('Commission marquée comme payée au démarcheur !');
  };

  const totalCommissions = commissions.reduce((acc, c) => acc + c.montantCommissionFCFA, 0);
  const totalCommissionsAPayer = commissions.filter(c => c.statut === 'À payer').reduce((acc, c) => acc + c.montantCommissionFCFA, 0);

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">MODULE 12 CDC</span>
            <span className="text-xs text-slate-500 font-bold">Commissions Démarcheurs (Calcul % sur 12 mois)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Suivi des Performances & Commissions</h2>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-purple-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Total Commissions Générées</span>
          <p className="text-2xl font-extrabold text-purple-700 mt-1.5">{totalCommissions.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Commissions en Attente de Versement</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1.5">{totalCommissionsAPayer.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Commissions Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
          <Award className="w-4 h-4 text-amber-600" /> Registre des Commissions Attribuées
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3">Démarcheur</th>
                <th className="p-3">Poulailler Origine</th>
                <th className="p-3">N° Facture</th>
                <th className="p-3 text-right">Vente FCFA</th>
                <th className="p-3 text-center">Taux %</th>
                <th className="p-3 text-right">Commission (FCFA)</th>
                <th className="p-3 text-center">Statut</th>
                <th className="p-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {commissions.map(c => (
                <tr key={c.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-extrabold text-slate-900">{c.demarcheurNom}</td>
                  <td className="p-3 text-slate-700 font-medium">{c.poulaillerNom}</td>
                  <td className="p-3 text-amber-800 font-extrabold">{c.factureNumero}</td>
                  <td className="p-3 text-right text-slate-800 font-bold">{c.montantVenteFCFA.toLocaleString('fr-FR')} F</td>
                  <td className="p-3 text-center font-extrabold text-purple-700">{c.tauxPercent}%</td>
                  <td className="p-3 text-right font-extrabold text-amber-700">
                    +{c.montantCommissionFCFA.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="p-3 text-center">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                      c.statut === 'Payée' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {c.statut}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    {c.statut === 'À payer' && (
                      <button
                        onClick={() => handlePayCommission(c.id)}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] rounded-lg transition-all shadow-sm"
                      >
                        Payer Commission
                      </button>
                    )}
                  </td>
                </tr>
              ))}
              {commissions.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">Aucune commission enregistrée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
