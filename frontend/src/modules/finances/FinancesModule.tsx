import React, { useState } from 'react';
import { Expense, Invoice } from '../../types';
import { DollarSign, Plus, Receipt } from 'lucide-react';
import { db } from '../../db/database';

interface FinancesModuleProps {
  expenses: Expense[];
  invoices: Invoice[];
  onRefreshData: () => void;
}

export const FinancesModule: React.FC<FinancesModuleProps> = ({ expenses, invoices, onRefreshData }) => {
  const [showAddExpense, setShowAddExpense] = useState(false);

  // Form State
  const [categorie, setCategorie] = useState<'Transport' | 'Carburant' | 'Repas' | 'Communication' | 'Hébergement' | 'Divers'>('Carburant');
  const [montantFCFA, setMontantFCFA] = useState<number>(12000);
  const [description, setDescription] = useState('Plein carburant livraison Keur Massar');

  const totalCA = invoices.reduce((acc, i) => acc + i.totalFCFA, 0);
  const totalEncaisse = invoices.reduce((acc, i) => acc + i.acompteFCFA, 0);
  const totalExpenses = expenses.reduce((acc, e) => acc + e.montantFCFA, 0);
  const beneficeNet = totalCA - totalExpenses;

  const handleAddExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const newExp: Expense = {
      id: `exp-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      categorie: categorie,
      montantFCFA: Number(montantFCFA),
      description: description,
      commercialNom: 'Ibrahima Ndiaye'
    };

    await db.expenses.add(newExp);
    setShowAddExpense(false);
    onRefreshData();
    alert(`Dépense de ${montantFCFA.toLocaleString()} FCFA enregistrée !`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-blue-500 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">COMPTABILITÉ SIMPLIFIÉE</span>
            <span className="text-xs text-slate-500 font-bold">P&L (CA - Dépenses) & Encaissements Wave / Orange Money</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Gestion Financière, Dépenses & Recettes</h2>
        </div>

        <button
          onClick={() => setShowAddExpense(true)}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Saisir une Dépense
        </button>
      </div>

      {/* Financial Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Total CA Facturé</span>
          <p className="text-xl font-extrabold text-emerald-700 mt-1.5">{totalCA.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-teal-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Total Réel Encaissé</span>
          <p className="text-xl font-extrabold text-teal-700 mt-1.5">{totalEncaisse.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-red-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Total Dépenses Enregistrées</span>
          <p className="text-xl font-extrabold text-red-600 mt-1.5">{totalExpenses.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Résultat Simplifié (Bénéfice)</span>
          <p className="text-xl font-extrabold text-amber-700 mt-1.5">{beneficeNet.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Expenses List */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
        <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
          <Receipt className="w-4 h-4 text-blue-600" /> Journal des Dépenses & Charges
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3">Date</th>
                <th className="p-3">Catégorie</th>
                <th className="p-3">Description</th>
                <th className="p-3">Responsable</th>
                <th className="p-3 text-right">Montant (FCFA)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {expenses.map(exp => (
                <tr key={exp.id} className="hover:bg-slate-50/60">
                  <td className="p-3 text-slate-500 font-medium">{exp.date}</td>
                  <td className="p-3">
                    <span className="bg-blue-50 text-blue-800 border border-blue-200 font-extrabold px-2.5 py-0.5 rounded text-[10px]">
                      {exp.categorie}
                    </span>
                  </td>
                  <td className="p-3 text-slate-800 font-semibold">{exp.description}</td>
                  <td className="p-3 text-slate-600 font-medium">{exp.commercialNom}</td>
                  <td className="p-3 text-right font-extrabold text-red-600">
                    -{exp.montantFCFA.toLocaleString('fr-FR')} FCFA
                  </td>
                </tr>
              ))}
              {expenses.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-slate-400 text-xs">Aucune dépense enregistrée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Expense */}
      {showAddExpense && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Saisir une Dépense / Charge</h3>
            <form onSubmit={handleAddExpense} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Catégorie de Dépense *</label>
                <select 
                  value={categorie}
                  onChange={(e) => setCategorie(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="Carburant">Carburant</option>
                  <option value="Transport">Transport</option>
                  <option value="Repas">Repas / Restauration</option>
                  <option value="Communication">Communication (Pass Internet/Appels)</option>
                  <option value="Hébergement">Hébergement</option>
                  <option value="Divers">Divers</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Montant en FCFA *</label>
                <input 
                  type="number"
                  required
                  value={montantFCFA}
                  onChange={(e) => setMontantFCFA(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-red-600 font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Description / Motif *</label>
                <input 
                  type="text"
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddExpense(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-blue-600 text-white font-extrabold rounded-xl shadow-md">Enregistrer Dépense</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
