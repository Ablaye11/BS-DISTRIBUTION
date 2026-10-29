import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { Expense, ExpenseCategory, Invoice, PaymentRecord, Client, AlveoleProduct } from '../../types';
import { 
  DollarSign, TrendingUp, TrendingDown, CreditCard, Wallet, 
  ArrowUpRight, ArrowDownRight, Plus, Calendar, Filter, PieChart,
  FileSpreadsheet, ShieldCheck, Banknote, Clock, AlertTriangle,
  Receipt, CheckCircle2, Phone, MapPin, Building, Search, Download,
  Layers, Package, Sparkles
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart as RechartsPie, Pie, Cell 
} from 'recharts';

export const ComptabiliteFinanciereModule: React.FC = () => {
  const expenses = useLiveQuery(() => db.expenses.orderBy('date').reverse().toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray()) || [];
  const paymentRecords = useLiveQuery(() => db.paymentRecords.orderBy('date').reverse().toArray()) || [];
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const factorySettingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const factorySettings = factorySettingsList[0];

  type FinanceTab = 'SYNTHESE_PL' | 'RECETTES' | 'DEPENSES' | 'CREANCES' | 'RENTABILITE' | 'RAPPROCHEMENT';
  const [activeTab, setActiveTab] = useState<FinanceTab>('SYNTHESE_PL');
  const [showAddExpenseModal, setShowAddExpenseModal] = useState(false);
  const [selectedAccountFilter, setSelectedAccountFilter] = useState<string>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');

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
  const totalFactureCA = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const totalRecettesEncaissees = paymentRecords.length > 0 
    ? paymentRecords.reduce((sum, pay) => sum + pay.montantFCFA, 0)
    : invoices.reduce((sum, inv) => sum + inv.acompteVerse, 0);
  
  // Dépenses brutes (ignorer les flux négatifs s'il s'agissait d'encaissements miroirs)
  const realExpenses = expenses.filter(e => e.montant > 0);
  const totalDepenses = realExpenses.reduce((sum, exp) => sum + exp.montant, 0);
  const resultatNetExploitation = totalRecettesEncaissees - totalDepenses;

  const creancesClientsTotal = invoices.reduce((sum, inv) => sum + inv.soldeRestant, 0);
  const facturesImpayees = invoices.filter(inv => inv.soldeRestant > 0);

  // Soldes estimés par compte
  const soldeBanque = 12500000 + (totalRecettesEncaissees * 0.5) - (totalDepenses * 0.65);
  const soldeCaisse = 1450000 + (totalRecettesEncaissees * 0.15) - (totalDepenses * 0.15);
  const soldeWave = 3200000 + (totalRecettesEncaissees * 0.25) - (totalDepenses * 0.12);
  const soldeOM = 1800000 + (totalRecettesEncaissees * 0.1) - (totalDepenses * 0.08);

  const tresorerieTotale = soldeBanque + soldeCaisse + soldeWave + soldeOM;

  // Répartition des dépenses par catégorie
  const expensesByCategoryMap: Record<string, number> = {};
  realExpenses.forEach(exp => {
    expensesByCategoryMap[exp.categorie] = (expensesByCategoryMap[exp.categorie] || 0) + exp.montant;
  });

  const pieChartData = Object.entries(expensesByCategoryMap).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6', '#06B6D4', '#64748B', '#F97316'];

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
    alert(`✅ Dépense de ${newExpense.montant.toLocaleString()} FCFA enregistrée sur le compte ${newExpense.comptePaiement}.`);
  };

  const filteredExpenses = selectedAccountFilter === 'TOUS'
    ? realExpenses
    : realExpenses.filter(e => e.comptePaiement === selectedAccountFilter);

  // Recherche dans les recettes / paiements
  const filteredPayments = paymentRecords.filter(p => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      p.clientNom?.toLowerCase().includes(term) ||
      p.factureNumero?.toLowerCase().includes(term) ||
      p.modePaiement?.toLowerCase().includes(term) ||
      p.reference?.toLowerCase().includes(term)
    );
  });

  // Calcul Balance Âgée des Créances (< 15j, 15-30j, > 30j)
  const todayMs = Date.now();
  const getAgeDays = (dateStr: string) => {
    const d = new Date(dateStr).getTime();
    return Math.floor((todayMs - d) / (1000 * 60 * 60 * 24));
  };

  const creancesMoins15j = facturesImpayees.filter(i => getAgeDays(i.date) < 15);
  const creances15a30j = facturesImpayees.filter(i => {
    const age = getAgeDays(i.date);
    return age >= 15 && age <= 30;
  });
  const creancesPlus30j = facturesImpayees.filter(i => getAgeDays(i.date) > 30);

  const totalMoins15j = creancesMoins15j.reduce((s, i) => s + i.soldeRestant, 0);
  const total15a30j = creances15a30j.reduce((s, i) => s + i.soldeRestant, 0);
  const totalPlus30j = creancesPlus30j.reduce((s, i) => s + i.soldeRestant, 0);

  // ── Modèle Analytique du Coût de Revient (CDC Section 7.2, 8.3 & Annexe A/B) ──
  // Poids moyen d'une alvéole 30 œufs standard : 75 g = 0.075 kg
  // Prix papier recyclé : 250 FCFA/kg (règle client)
  // Coût matière papier par alvéole = 0.075 kg * 250 FCFA = 18.75 FCFA
  const coutPapierUnitaire = 18.75;
  const coutEnergieGazUnitaire = 4.0;    // Gaz séchoir + électricité Senelec
  const coutMainOeuvreUnitaire = 3.2;    // Shift de 4 personnes
  const coutAdjuvantsEau = 1.3;          // Liants chimiques & traitement eau
  const coutAmortissementLigne = 1.0;    // Entretien et dépréciation moules
  const coutRevientTotalEstime = coutPapierUnitaire + coutEnergieGazUnitaire + coutMainOeuvreUnitaire + coutAdjuvantsEau + coutAmortissementLigne; // ~28.25 FCFA

  const prixVenteContractuel = 30.0;    // 3 000 FCFA / lot de 100
  const prixVenteMarche = 35.0;         // 3 500 FCFA / lot de 100

  const margeContractuelle = prixVenteContractuel - coutRevientTotalEstime;
  const margeMarche = prixVenteMarche - coutRevientTotalEstime;

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Wallet className="w-3.5 h-3.5" />
              Direction Financière & Comptabilité
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">• Pilotage Trésorerie & P&L Usine</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Comptabilité & Gestion Financière
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Suivi des flux financiers, journal des encaissements, décaissements, balance âgée des créances et rentabilité unitaire par alvéole.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddExpenseModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 sm:px-5 sm:py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Enregistrer une Dépense
          </button>
        </div>
      </div>

      {/* Cartes KPIs Trésorerie & Résultat Net */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Trésorerie Disponible */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Trésorerie Disponible</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <Wallet className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{Math.round(tresorerieTotale).toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Banque, Caisse, Wave & OM</p>
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
            <p className="text-xs text-slate-500 mt-1">{paymentRecords.length} versements clients validés</p>
          </div>
        </div>

        {/* Créances en Attente */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Créances Clients Dues</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-amber-600">{creancesClientsTotal.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">{facturesImpayees.length} factures à recouvrer</p>
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
            <p className="text-xs text-slate-500 mt-1">Recettes nettes moins décaissements</p>
          </div>
        </div>
      </div>

      {/* Onglets Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('SYNTHESE_PL')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'SYNTHESE_PL'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📊 Synthèse & P&L Industriel
          </button>
          <button
            onClick={() => setActiveTab('RECETTES')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'RECETTES'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💳 Journal Recettes ({paymentRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('DEPENSES')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'DEPENSES'
                ? 'bg-red-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💸 Journal Dépenses ({realExpenses.length})
          </button>
          <button
            onClick={() => setActiveTab('CREANCES')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'CREANCES'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ⏳ Créances & Recouvrement ({facturesImpayees.length})
          </button>
          <button
            onClick={() => setActiveTab('RENTABILITE')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'RENTABILITE'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📈 Rentabilité & Coût Revient
          </button>
          <button
            onClick={() => setActiveTab('RAPPROCHEMENT')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'RAPPROCHEMENT'
                ? 'bg-sky-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📲 Rapprochement Wave / OM
          </button>
        </div>
      </div>

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 1. ONGLET : SYNTHÈSE & COMPTE DE RÉSULTAT (P&L)               */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'SYNTHESE_PL' && (
        <div className="space-y-6">
          {/* Détail des 4 comptes de trésorerie */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Compte Bancaire Principal</span>
              <div className="text-lg font-black text-amber-400 mt-1">{Math.round(soldeBanque).toLocaleString()} FCFA</div>
              <span className="text-[10px] text-slate-400 block mt-1">Opérations B2B & Grossistes</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Caisse Espèces Usine</span>
              <div className="text-lg font-black text-emerald-400 mt-1">{Math.round(soldeCaisse).toLocaleString()} FCFA</div>
              <span className="text-[10px] text-slate-400 block mt-1">Achat papier direct & menues charges</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Wave Business Pro</span>
              <div className="text-lg font-black text-sky-400 mt-1">{Math.round(soldeWave).toLocaleString()} FCFA</div>
              <span className="text-[10px] text-slate-400 block mt-1">Règlements instantanés fermes</span>
            </div>
            <div className="bg-slate-900 text-white rounded-xl p-4 border border-slate-800">
              <span className="text-xs text-slate-400 font-semibold block">Orange Money Entreprise</span>
              <div className="text-lg font-black text-orange-400 mt-1">{Math.round(soldeOM).toLocaleString()} FCFA</div>
              <span className="text-[10px] text-slate-400 block mt-1">Clients régionaux & inter-région</span>
            </div>
          </div>

          {/* Graphique répartition des dépenses + Compte de résultat simplifié */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2 mb-1">
                <PieChart className="w-5 h-5 text-indigo-600" />
                Répartition des Dépenses Usine
              </h2>
              <p className="text-xs text-slate-500 mb-4">Structure des coûts d'exploitation usine</p>

              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <RechartsPie>
                    <Pie
                      data={pieChartData.length > 0 ? pieChartData : [{ name: 'Matières Premières', value: 250000 }]}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                      label={({ name, percent }) => `${name.slice(0, 10)}... ${(percent * 100).toFixed(0)}%`}
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

            {/* Compte d'Exploitation Simplifié (P&L) */}
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
                    <span className="text-blue-700 text-sm">{totalFactureCA.toLocaleString()} FCFA</span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                    <span>(-) Coût d'Achat des Matières Premières (Papier @ 250 F/kg & Liants)</span>
                    <span className="text-red-600 font-bold">
                      {realExpenses.filter(e => e.categorie.includes('Matières') || e.categorie.includes('Adjuvants')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-200 font-bold text-slate-900">
                    <span>(=) Marge Brute Industrielle</span>
                    <span className="text-emerald-700 text-sm">
                      {(totalFactureCA - realExpenses.filter(e => e.categorie.includes('Matières')).reduce((s, e) => s + e.montant, 0)).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                    <span>(-) Charges d'Énergie & Séchoir (Gaz, Senelec, Eau)</span>
                    <span className="text-red-600 font-bold">
                      {realExpenses.filter(e => e.categorie.includes('Énergie') || e.categorie.includes('Eau')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
                    </span>
                  </div>

                  <div className="flex items-center justify-between p-3 rounded-xl bg-red-50/70 border border-red-100 font-medium text-slate-800">
                    <span>(-) Salaires, Primes & Maintenance Machines</span>
                    <span className="text-red-600 font-bold">
                      {realExpenses.filter(e => e.categorie.includes('Salaires') || e.categorie.includes('Maintenance')).reduce((s, e) => s + e.montant, 0).toLocaleString()} FCFA
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 2. ONGLET : JOURNAL DES RECETTES & RÈGLEMENTS                 */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'RECETTES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Journal des Flux Entrants & Règlements Clients (CDC 7.6)</h3>
              <p className="text-xs text-slate-500">Traçabilité complète des encaissements d'acomptes et de soldes</p>
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder="Filtrer client, reçu, mode..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full text-xs pl-9 pr-3 py-2 bg-slate-50 rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          {filteredPayments.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun encaissement client trouvé.</p>
              <p className="text-xs mt-1">Les règlements validés depuis le module Commercial apparaîtront directement ici.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[700px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date</th>
                      <th className="py-3 px-4">Facture</th>
                      <th className="py-3 px-4">Client B2B</th>
                      <th className="py-3 px-4">Mode Règlement</th>
                      <th className="py-3 px-4">Compte Crédité</th>
                      <th className="py-3 px-4">Référence</th>
                      <th className="py-3 px-4 text-right">Montant Encaissé</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {filteredPayments.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-mono text-slate-600">{pay.date}</td>
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{pay.factureNumero}</td>
                        <td className="py-3 px-4 font-bold text-slate-800">{pay.clientNom}</td>
                        <td className="py-3 px-4">
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            pay.modePaiement === 'Wave' ? 'bg-cyan-100 text-cyan-800' :
                            pay.modePaiement === 'Orange Money' ? 'bg-orange-100 text-orange-800' :
                            pay.modePaiement === 'Virement Bancaire' ? 'bg-indigo-100 text-indigo-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {pay.modePaiement}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-slate-600">{pay.compteCreditee}</td>
                        <td className="py-3 px-4 font-mono text-slate-500 text-[11px]">{pay.reference || '—'}</td>
                        <td className="py-3 px-4 text-right font-black text-emerald-600 text-sm">
                          +{pay.montantFCFA.toLocaleString()} FCFA
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 3. ONGLET : JOURNAL DES DÉPENSES                              */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'DEPENSES' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-sm font-black text-slate-900">Journal des Flux de Dépenses d'Exploitation</h3>
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

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 4. ONGLET : CRÉANCES & BALANCE ÂGÉE                           */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'CREANCES' && (
        <div className="space-y-5">
          {/* En-tête Balance Âgée */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-emerald-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 block">Créances Récentes (&lt; 15 jours)</span>
              <div className="text-2xl font-black text-slate-900 mt-1">{totalMoins15j.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
              <p className="text-xs text-emerald-600 mt-1">{creancesMoins15j.length} factures dans le délai de grâce</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-amber-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-700 block">Créances Échues (15 à 30 jours)</span>
              <div className="text-2xl font-black text-amber-600 mt-1">{total15a30j.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
              <p className="text-xs text-amber-600 mt-1">{creances15a30j.length} factures à relancer en priorité</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-red-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase tracking-wider text-red-700 block">Créances Critiques (&gt; 30 jours)</span>
              <div className="text-2xl font-black text-red-600 mt-1">{totalPlus30j.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
              <p className="text-xs text-red-600 mt-1">{creancesPlus30j.length} factures en retard critique</p>
            </div>
          </div>

          {facturesImpayees.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <CheckCircle2 className="w-12 h-12 mx-auto mb-3 text-emerald-500 opacity-60" />
              <p className="font-semibold text-slate-800">Aucune créance en attente !</p>
              <p className="text-xs mt-1">Toutes les factures d'alvéoles ont été intégralement réglées.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Facture</th>
                      <th className="py-3 px-4">Date Émission</th>
                      <th className="py-3 px-4">Client B2B</th>
                      <th className="py-3 px-4">Ancienneté</th>
                      <th className="py-3 px-4 text-right">Total Facture</th>
                      <th className="py-3 px-4 text-right">Acompte Perçu</th>
                      <th className="py-3 px-4 text-right font-bold text-red-600">Solde Restant Dû</th>
                      <th className="py-3 px-4 text-center">Action Relance</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {facturesImpayees.map((inv) => {
                      const age = getAgeDays(inv.date);
                      const client = clients.find(c => c.id === inv.clientId);

                      return (
                        <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{inv.numero}</td>
                          <td className="py-3.5 px-4 text-slate-600 font-mono">{inv.date}</td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-slate-900">{inv.clientNom}</div>
                            <div className="text-[10px] text-slate-400 flex items-center gap-1">
                              <MapPin className="w-3 h-3" />
                              {inv.clientRegion}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              age < 15 ? 'bg-emerald-100 text-emerald-800' :
                              age <= 30 ? 'bg-amber-100 text-amber-800' :
                              'bg-red-100 text-red-800'
                            }`}>
                              {age} jours
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">{inv.totalTTC.toLocaleString()} F</td>
                          <td className="py-3.5 px-4 text-right text-emerald-600">{inv.acompteVerse.toLocaleString()} F</td>
                          <td className="py-3.5 px-4 text-right font-black text-red-600 text-sm">
                            {inv.soldeRestant.toLocaleString()} FCFA
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            {client?.telephone ? (
                              <a
                                href={`tel:${client.telephone}`}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-bold text-[10px] inline-flex items-center gap-1 transition-all"
                                title="Appeler pour relance téléphonique"
                              >
                                <Phone className="w-3 h-3" />
                                Relancer ({client.telephone})
                              </a>
                            ) : (
                              <span className="text-[10px] text-slate-400">Aucun tél.</span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* 5. ONGLET : RENTABILITÉ ANALYTIQUE & COÛT DE REVIENT          */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'RENTABILITE' && (
        <div className="space-y-6">
          {/* Carte Benchmarking Industriel */}
          <div className="bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-6 rounded-3xl border border-indigo-800/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40">
                  Modèle Économique Industriel (CDC Section 7.2 & 8.3)
                </span>
                <h3 className="font-black text-lg sm:text-xl mt-1">Analyse du Coût de Revient par Alvéole Standard (30 Œufs)</h3>
                <p className="text-xs text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Décomposition analytique des charges directes de moulage : matière papier recyclé (barème fixe 250 FCFA/kg), énergie du séchoir, main d'œuvre de ligne et marge brute par canal de vente.
                </p>
              </div>

              <div className="bg-indigo-900/40 border border-indigo-500/30 rounded-2xl p-4 text-right shrink-0">
                <span className="text-[10px] font-bold text-indigo-300 uppercase tracking-wider block">Coût Revient Estimé</span>
                <div className="text-2xl font-black text-white mt-1">
                  {coutRevientTotalEstime.toFixed(2)} <span className="text-xs font-semibold text-indigo-400">FCFA / alv.</span>
                </div>
                <span className="text-[10px] text-indigo-300">{(coutRevientTotalEstime * 100).toFixed(0)} FCFA / lot de 100</span>
              </div>
            </div>
          </div>

          {/* Décomposition analytique du coût unitaire */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">1. Matière Papier</span>
              <div className="text-xl font-black text-slate-900 mt-1">{coutPapierUnitaire.toFixed(2)} F</div>
              <p className="text-[10px] text-slate-400 mt-0.5">75 g @ 250 F/kg (66%)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">2. Énergie Séchoir</span>
              <div className="text-xl font-black text-slate-900 mt-1">{coutEnergieGazUnitaire.toFixed(2)} F</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Gaz + Senelec (14%)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">3. Main d'Œuvre</span>
              <div className="text-xl font-black text-slate-900 mt-1">{coutMainOeuvreUnitaire.toFixed(2)} F</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Shift 4 ouvriers (11%)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">4. Eau & Liants</span>
              <div className="text-xl font-black text-slate-900 mt-1">{coutAdjuvantsEau.toFixed(2)} F</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Recyclage eau + chimie (5%)</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">5. Amortissement</span>
              <div className="text-xl font-black text-slate-900 mt-1">{coutAmortissementLigne.toFixed(2)} F</div>
              <p className="text-[10px] text-slate-400 mt-0.5">Moules & ligne (4%)</p>
            </div>
          </div>

          {/* Comparatif Prix de Vente & Marge Brute */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Canal Contrat Producteurs */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Canal 1 : Contrats Fermes & Couvoirs</h4>
                  <span className="text-xs text-slate-500">Tarif contractuel garanti (50% de la production)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-indigo-100 text-indigo-800">
                  30 FCFA / unité
                </span>
              </div>

              <div className="p-4 bg-indigo-50/60 rounded-xl border border-indigo-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Prix par paquet de 100 :</span>
                  <span className="font-bold text-slate-900">3 000 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Coût de revient par paquet :</span>
                  <span className="font-bold text-slate-700">{(coutRevientTotalEstime * 100).toFixed(0)} FCFA</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-indigo-200/80 font-bold">
                  <span className="text-indigo-950">Marge Brute Industrielle par Lot :</span>
                  <span className="text-emerald-700">+{((prixVenteContractuel - coutRevientTotalEstime) * 100).toFixed(0)} FCFA ({(((prixVenteContractuel - coutRevientTotalEstime) / prixVenteContractuel) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>

            {/* Canal Marché Ouvert */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-black text-slate-900 text-sm">Canal 2 : Marché Ouvert & Grossistes</h4>
                  <span className="text-xs text-slate-500">Tarif spot plein (50% de la production)</span>
                </div>
                <span className="px-2.5 py-0.5 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                  35 FCFA / unité
                </span>
              </div>

              <div className="p-4 bg-emerald-50/60 rounded-xl border border-emerald-100 space-y-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-600">Prix par paquet de 100 :</span>
                  <span className="font-bold text-slate-900">3 500 FCFA</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-600">Coût de revient par paquet :</span>
                  <span className="font-bold text-slate-700">{(coutRevientTotalEstime * 100).toFixed(0)} FCFA</span>
                </div>
                <div className="flex justify-between pt-1 border-t border-emerald-200/80 font-bold">
                  <span className="text-emerald-950">Marge Brute Industrielle par Lot :</span>
                  <span className="text-emerald-700">+{((prixVenteMarche - coutRevientTotalEstime) * 100).toFixed(0)} FCFA ({(((prixVenteMarche - coutRevientTotalEstime) / prixVenteMarche) * 100).toFixed(1)}%)</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ajout Dépense */}
      {showAddExpenseModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
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

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md flex items-center justify-end gap-3 pt-3 pb-4 sm:pb-2 border-t border-slate-100 z-20 mt-auto">
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

      {/* ──────────────────────────────────────────────────────────────── */}
      {/* 6. ONGLET : RAPPROCHEMENT WAVE & ORANGE MONEY                   */}
      {/* ──────────────────────────────────────────────────────────────── */}
      {activeTab === 'RAPPROCHEMENT' && (
        <div className="space-y-5">
          <div className="bg-gradient-to-r from-sky-900 via-sky-800 to-blue-900 p-5 rounded-3xl text-white">
            <div className="flex items-center gap-3 mb-1">
              <Phone className="w-6 h-6 text-sky-300" />
              <h3 className="text-xl font-black">Rapprochement Mobile Money (Wave / Orange Money)</h3>
            </div>
            <p className="text-xs text-sky-200 max-w-3xl">
              Identifiez les encaissements Wave / Orange Money sans référence de transaction renseignée. Ces paiements doivent être rapprochés avec les relevsé SMS ou l'interface professionnelle avant clôture mensuelle.
            </p>
          </div>

          {/* Comptes Mobile Money */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Wave */}
            <div className="bg-white p-5 rounded-3xl border border-sky-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-sky-100 flex items-center justify-center text-sky-700 font-black text-xs">W</div>
                <div>
                  <div className="font-black text-slate-900 text-sm">Wave Business</div>
                  <div className="text-[11px] text-slate-500 font-mono">+221 76 622 59 79</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-sky-50 rounded-xl p-3">
                  <div className="text-2xl font-black text-sky-700">
                    {paymentRecords.filter(p => p.modePaiement === 'Wave' && p.reference).length}
                  </div>
                  <div className="text-[10px] text-sky-600 font-bold mt-0.5">Avec référence ✅</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-2xl font-black text-red-600">
                    {paymentRecords.filter(p => p.modePaiement === 'Wave' && !p.reference).length}
                  </div>
                  <div className="text-[10px] text-red-600 font-bold mt-0.5">Sans référence ⚠️</div>
                </div>
              </div>
              <div className="mt-3 text-sm font-black text-slate-900">
                Total Wave : {paymentRecords.filter(p => p.modePaiement === 'Wave').reduce((s, p) => s + p.montantFCFA, 0).toLocaleString()} FCFA
              </div>
            </div>

            {/* Orange Money */}
            <div className="bg-white p-5 rounded-3xl border border-orange-200 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <div className="w-8 h-8 rounded-xl bg-orange-100 flex items-center justify-center text-orange-700 font-black text-xs">OM</div>
                <div>
                  <div className="font-black text-slate-900 text-sm">Orange Money Pro</div>
                  <div className="text-[11px] text-slate-500 font-mono">+221 77 792 40 65</div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="bg-orange-50 rounded-xl p-3">
                  <div className="text-2xl font-black text-orange-700">
                    {paymentRecords.filter(p => p.modePaiement === 'Orange Money' && p.reference).length}
                  </div>
                  <div className="text-[10px] text-orange-600 font-bold mt-0.5">Avec référence ✅</div>
                </div>
                <div className="bg-red-50 rounded-xl p-3">
                  <div className="text-2xl font-black text-red-600">
                    {paymentRecords.filter(p => p.modePaiement === 'Orange Money' && !p.reference).length}
                  </div>
                  <div className="text-[10px] text-red-600 font-bold mt-0.5">Sans référence ⚠️</div>
                </div>
              </div>
              <div className="mt-3 text-sm font-black text-slate-900">
                Total OM : {paymentRecords.filter(p => p.modePaiement === 'Orange Money').reduce((s, p) => s + p.montantFCFA, 0).toLocaleString()} FCFA
              </div>
            </div>
          </div>

          {/* Tableau détaillé des paiements non rapprochés */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Encaissements Mobile Money sans référence de transaction
              </h3>
              <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-black">
                {paymentRecords.filter(p => ['Wave', 'Orange Money'].includes(p.modePaiement) && !p.reference).length} à rapprocher
              </span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase text-[10px] tracking-wider font-bold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4 text-left">Date</th>
                    <th className="py-3 px-4 text-left">Client</th>
                    <th className="py-3 px-4 text-left">Facture</th>
                    <th className="py-3 px-4 text-left">Compte</th>
                    <th className="py-3 px-4 text-right">Montant</th>
                    <th className="py-3 px-4 text-center">Référence</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {paymentRecords
                    .filter(p => ['Wave', 'Orange Money'].includes(p.modePaiement))
                    .map(p => (
                      <tr key={p.id} className={`hover:bg-slate-50/80 ${ !p.reference ? 'bg-red-50/30' : ''}`}>
                        <td className="py-3 px-4 font-mono text-slate-600">{p.date}</td>
                        <td className="py-3 px-4 font-bold text-slate-900">{p.clientNom}</td>
                        <td className="py-3 px-4 font-mono text-slate-500">{p.factureNumero}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            p.modePaiement === 'Wave' ? 'bg-sky-100 text-sky-800' : 'bg-orange-100 text-orange-800'
                          }`}>
                            {p.modePaiement}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-right font-black text-slate-900">{p.montantFCFA.toLocaleString()} F</td>
                        <td className="py-3 px-4 text-center">
                          {p.reference ? (
                            <span className="font-mono text-emerald-700 text-[11px] font-bold">{p.reference}</span>
                          ) : (
                            <span className="text-red-500 font-bold text-[10px]">— Non renseignée —</span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                            p.reference ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'
                          }`}>
                            {p.reference ? '✅ Rapproché' : '⚠️ À confirmer'}
                          </span>
                        </td>
                      </tr>
                    ))
                  }
                  {paymentRecords.filter(p => ['Wave', 'Orange Money'].includes(p.modePaiement)).length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 text-xs font-bold">
                        Aucun paiement Wave / Orange Money enregistré pour l'instant.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Guide rapprochement */}
          <div className="bg-sky-50 p-5 rounded-2xl border border-sky-200 text-xs text-sky-900">
            <div className="font-black text-sky-800 mb-2 flex items-center gap-2">
              <Phone className="w-4 h-4" />
              Procédure de Rapprochement (conforme CDC 7.6)
            </div>
            <ol className="list-decimal list-inside space-y-1.5 font-medium">
              <li>Télécharger le relevé de transactions depuis l'appli Wave Business ou Orange Money Pro.</li>
              <li>Identifier chaque versement client par son libellé (nom client + montant).</li>
              <li>Retourner sur la fiche encaissement (onglet « Commandes » → bouton « Régler ») et saisir la référence transaction.</li>
              <li>Les paiements sans référence apparaissent en rouge dans ce tableau jusqu'à confirmation.</li>
              <li>Valider le rapprochement mensuel avant le 5 du mois suivant (clôture comptable).</li>
            </ol>
          </div>
        </div>
      )}
    </div>
  );
};
