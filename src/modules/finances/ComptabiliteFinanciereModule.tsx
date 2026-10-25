import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Expense, ExpenseCategory, Invoice } from '../../types';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, 
  ArrowUpRight, ArrowDownRight, Plus, Calendar, Filter, PieChart,
  FileSpreadsheet, ShieldCheck
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart as RechartsPie, Pie, Cell 
} from 'recharts';

export const ComptabiliteFinanciereModule: React.FC = () => {
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];

  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('TOUS');

  // Formulaire Nouvelle Dépense
  const [newExpense, setNewExpense] = useState<{
    date: string;
    categorie: ExpenseCategory;
    montant: number;
    beneficiaire: string;
    description: string;
    comptePaiement: 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro';
    justificatifRef: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    categorie: 'Matières Premières (Balles Cartons)',
    montant: 250000,
    beneficiaire: 'Fournisseur Papiers & Cartons',
    description: 'Achat de cartons recyclés pour alimentation pulpeur',
    comptePaiement: 'Banque Principale',
    justificatifRef: ''
  });

  // Calculs Financiers Globaux
  const totalRecettesEncaissees = invoices.reduce((sum, inv) => sum + inv.acompteVerse, 0);
  const totalDepenses = expenses.reduce((sum, exp) => sum + exp.montant, 0);
  const resultatNetExploitation = totalRecettesEncaissees - totalDepenses;

  const creancesClients = invoices.reduce((sum, inv) => sum + inv.soldeRestant, 0);

  // Soldes estimés par compte
  const soldeBanque = 12500000 + (totalRecettesEncaissees * 0.5) - (totalDepenses * 0.7);
  const soldeCaisse = 1450000 + (totalRecettesEncaissees * 0.2) - (totalDepenses * 0.15);
  const soldeWave = 3200000 + (totalRecettesEncaissees * 0.2) - (totalDepenses * 0.1);
  const soldeOM = 1800000 + (totalRecettesEncaissees * 0.1) - (totalDepenses * 0.05);

  const tresorerieTotale = soldeBanque + soldeCaisse + soldeWave + soldeOM;

  // Répartition des dépenses par catégorie pour le graphique
  const expensesByCategoryMap: Record<string, number> = {};
  expenses.forEach(exp => {
    expensesByCategoryMap[exp.categorie] = (expensesByCategoryMap[exp.categorie] || 0) + exp.montant;
  });

  const pieChartData = Object.entries(expensesByCategoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#64748B'];

  // Sauvegarde Dépense Usine
  const handleSaveExpense = async (e: React.FormEvent) => {
    e.preventDefault();
    const exp: Expense = {
      id: `exp-${Date.now()}`,
      date: newExpense.date,
      categorie: newExpense.categorie,
      montant: Number(newExpense.montant),
      beneficiaire: newExpense.beneficiaire,
      description: newExpense.description,
      comptePaiement: newExpense.comptePaiement,
      justificatifRef: newExpense.justificatifRef,
      enregistrePar: 'Comptable Usine'
    };

    await db.expenses.add(exp);
    setShowAddExpenseModal(false);
  };

  const filteredExpenses = selectedAccountFilter === 'TOUS'
    ? expenses
    : expenses.filter(e => e.comptePaiement === selectedAccountFilter);

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Direction Financière & Comptabilité
            </span>
            <span className="text-xs text-slate-400">• Pilotage Trésorerie Usine</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Comptabilité de Base & Gestion Financière
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Suivi des recettes de vente d'alvéoles, charges d'exploitation (énergie, matières premières, salaires) et trésorerie nette.
          </p>
        </div>

        <button
          onClick={() => setShowAddExpenseModal(true)}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Enregistrer une Dépense
        </button>
      </div>

      {/* Cartes KPIs Trésorerie & Résultat Net */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Trésorerie Nette Disponible */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trésorerie Disponible</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{Math.round(tresorerieTotale).toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Banque, caisse usine, Wave & OM</p>
          </div>
        </div>

        {/* Recettes Encaissées */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Recettes Encaissées</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <ArrowUpRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-blue-700">{totalRecettesEncaissees.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Règlements clients perçus</p>
          </div>
        </div>

        {/* Dépenses Usine */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dépenses Exploitation</span>
            <span className="p-2 rounded-lg bg-red-50 text-red-600">
              <ArrowDownRight className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-red-600">{totalDepenses.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Matières, gaz séchoir, énergie</p>
          </div>
        </div>

        {/* Marge / Résultat Net */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Résultat d'Exploitation</span>
            <span className={`p-2 rounded-lg ${resultatNetExploitation >= 0 ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
              <TrendingUp className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${resultatNetExploitation >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
              {resultatNetExploitation.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Recettes nettes moins charges</p>
          </div>
        </div>
      </div>

      {/* Détail des 4 comptes de trésorerie */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Compte Bancaire Principal</span>
          <div className="text-lg font-black text-amber-400 mt-1">{Math.round(soldeBanque).toLocaleString()} FCFA</div>
          <span className="text-[10px] text-slate-400 block mt-1">Opérations B2B & Virements</span>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Caisse Espèces Usine</span>
          <div className="text-lg font-black text-emerald-400 mt-1">{Math.round(soldeCaisse).toLocaleString()} FCFA</div>
          <span className="text-[10px] text-slate-400 block mt-1">Achats directs cartons & menues dépenses</span>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Wave Business Pro</span>
          <div className="text-lg font-black text-sky-400 mt-1">{Math.round(soldeWave).toLocaleString()} FCFA</div>
          <span className="text-[10px] text-slate-400 block mt-1">Acomptes & règlements instantanés</span>
        </div>
        <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
          <span className="text-xs text-slate-400 font-semibold block">Orange Money Entreprise</span>
          <div className="text-lg font-black text-orange-400 mt-1">{Math.round(soldeOM).toLocaleString()} FCFA</div>
          <span className="text-[10px] text-slate-400 block mt-1">Paiements clients régionaux</span>
        </div>
      </div>

      {/* Graphique répartition des dépenses + Compte de résultat simplifié */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
            <PieChart className="w-5 h-5 text-indigo-600" />
            Répartition des Dépenses Usine
          </h2>
          <p className="text-xs text-slate-500 mb-4">Structure des coûts de fabrication des alvéoles</p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsPie>
                <Pie
                  data={pieChartData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${(percent * 100).toFixed(0)}%`}
                >
                  {pieChartData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(val: number) => `${val.toLocaleString()} FCFA`}
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px' }}
                />
              </RechartsPie>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Compte d'Exploitation Simplifié */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
              <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
              Compte de Résultat d'Exploitation Usine (P&L Simplifié)
            </h2>
            <p className="text-xs text-slate-500 mb-4">Synthèse analytique de la rentabilité de production</p>

            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-blue-50/70 border border-blue-100 font-bold text-slate-900">
                <span>(+) Chiffre d'Affaires Ventes d'Alvéoles (Facturé)</span>
                <span className="text-blue-700 text-sm">{invoices.reduce((s, i) => s + i.totalTTC, 0).toLocaleString()} FCFA</span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                <span>(-) Coût d'Achat des Matières Premières (Balles Cartons OCC & Liants)</span>
                <span className="text-red-600 font-bold">
                  {expenses.filter(e => e.categorie.includes('Matières') || e.categorie.includes('Adjuvants')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
                <span>(=) Marge Brute Industrielle</span>
                <span className="text-emerald-700 text-sm">
                  {(invoices.reduce((s, i) => s + i.totalTTC, 0) - expenses.filter(e => e.categorie.includes('Matières')).reduce((s, e) => s + e.montant, 0)).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                <span>(-) Charges d'Énergie & Séchoir (Gaz, Électricité, Eau)</span>
                <span className="text-red-600 font-bold">
                  {expenses.filter(e => e.categorie.includes('Énergie') || e.categorie.includes('Eau')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                <span>(-) Maintenance Machines & Autres Charges d'Exploitation</span>
                <span className="text-red-600 font-bold">
                  {expenses.filter(e => !e.categorie.includes('Matières') && !e.categorie.includes('Énergie')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
                </span>
              </div>

              <div className="flex items-center justify-between p-4 rounded-xl bg-slate-900 text-white font-extrabold text-sm shadow-md">
                <span className="flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-amber-400" />
                  Résultat Net d'Exploitation Périodique
                </span>
                <span className="text-amber-400 text-base">{resultatNetExploitation.toLocaleString()} FCFA</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Journal des Dépenses Usine */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900">Journal des Flux de Dépenses d'Exploitation</h3>
            <p className="text-xs text-slate-500">Traçabilité complète des règlements fournisseurs, énergie et maintenance</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedAccountFilter}
              onChange={(e) => setSelectedAccountFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TOUS">Tous les comptes</option>
              <option value="Banque Principale">Banque Principale</option>
              <option value="Caisse Usine">Caisse Usine</option>
              <option value="Wave Business">Wave Business</option>
              <option value="Orange Money Pro">Orange Money Pro</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Catégorie</th>
                <th className="py-3 px-4">Bénéficiaire & Motif</th>
                <th className="py-3 px-4">Compte Imputé</th>
                <th className="py-3 px-4 text-right">Montant Décaissé</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredExpenses.map((exp) => (
                <tr key={exp.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-bold text-slate-900">{exp.date}</td>
                  <td className="py-3.5 px-4">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                      {exp.categorie}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-bold text-slate-900">{exp.beneficiaire}</div>
                    <div className="text-[11px] text-slate-500">{exp.description}</div>
                  </td>
                  <td className="py-3.5 px-4 font-semibold text-slate-700">
                    {exp.comptePaiement}
                  </td>
                  <td className="py-3.5 px-4 text-right font-black text-red-600 text-sm">
                    -{exp.montant.toLocaleString()} FCFA
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Ajout Dépense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Enregistrer une Dépense Usine</h3>
              <button onClick={() => setShowAddExpenseModal(false)} className="text-slate-400">✕</button>
            </div>

            <form onSubmit={handleSaveExpense} className="mt-4 space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    required
                    value={newExpense.date}
                    onChange={e => setNewExpense({ ...newExpense, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Décaissé (FCFA)</label>
                  <input
                    type="number"
                    required
                    value={newExpense.montant}
                    onChange={e => setNewExpense({ ...newExpense, montant: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold text-red-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Poste de Dépense / Catégorie</label>
                <select
                  value={newExpense.categorie}
                  onChange={e => setNewExpense({ ...newExpense, categorie: e.target.value as ExpenseCategory })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                >
                  <option value="Matières Premières (Balles Cartons)">Matières Premières (Balles Cartons)</option>
                  <option value="Adjuvants & Liants Chimiques">Adjuvants & Liants Chimiques</option>
                  <option value="Électricité & Énergie Séchoir">Électricité & Énergie Séchoir</option>
                  <option value="Maintenance Machines & Pièces">Maintenance Machines & Pièces</option>
                  <option value="Salaires & Primes Usine">Salaires & Primes Usine</option>
                  <option value="Transport & Carburant">Transport & Carburant</option>
                  <option value="Eau & Traitement Recyclage">Eau & Traitement Recyclage</option>
                  <option value="Emballage & Cerclage">Emballage & Cerclage</option>
                  <option value="Charges Administratives & Taxes">Charges Administratives & Taxes</option>
                  <option value="Autre Dépense Usine">Autre Dépense Usine</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Bénéficiaire / Fournisseur</label>
                <input
                  type="text"
                  required
                  value={newExpense.beneficiaire}
                  onChange={e => setNewExpense({ ...newExpense, beneficiaire: e.target.value })}
                  placeholder="Ex: Fournisseur Gaz, Papeterie..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Description / Motif</label>
                <input
                  type="text"
                  required
                  value={newExpense.description}
                  onChange={e => setNewExpense({ ...newExpense, description: e.target.value })}
                  placeholder="Détail de la charge"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Compte de Règlement Imputé</label>
                <select
                  value={newExpense.comptePaiement}
                  onChange={e => setNewExpense({ ...newExpense, comptePaiement: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                >
                  <option value="Banque Principale">Banque Principale</option>
                  <option value="Caisse Usine">Caisse Usine</option>
                  <option value="Wave Business">Wave Business</option>
                  <option value="Orange Money Pro">Orange Money Pro</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddExpenseModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md"
                >
                  Enregistrer le Décaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
