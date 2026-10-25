import React from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { 
  Gauge, TrendingUp, DollarSign, Boxes, Factory, AlertTriangle, 
  CheckCircle2, Clock, ShoppingBag, ShieldCheck, ArrowUpRight, 
  Layers, Package, Zap, ArrowRight
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line 
} from 'recharts';

interface ExecutiveDashboardProps {
  onNavigateTab: (tab: any) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ onNavigateTab }) => {
  const shifts = useLiveQuery(() => db.productionShifts.toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];

  const today = new Date().toISOString().split('T')[0];
  const todayShifts = shifts.filter(s => s.date === today);

  // Production du jour
  const productionJourAlveoles = todayShifts.reduce((sum, s) => sum + s.alvéolesConformes, 0);
  const productionJourFardeaux = todayShifts.reduce((sum, s) => sum + s.fardeauxEmballes, 0);
  const objectifJournalier = 50000;
  const progressionObjectifPct = Math.min(100, Math.round((productionJourAlveoles / objectifJournalier) * 100));

  // TRS moyen
  const avgTRS = shifts.length > 0
    ? (shifts.reduce((sum, s) => sum + s.trsOEE, 0) / shifts.length).toFixed(1)
    : '84.8';

  // Chiffre d'affaires
  const caTotal = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const caEncaisse = invoices.reduce((sum, inv) => sum + inv.acompteVerse, 0);
  const totalDepenses = expenses.reduce((sum, exp) => sum + exp.montant, 0);
  const resultatNet = caEncaisse - totalDepenses;

  // Stocks
  const totalCartonKg = rawMaterials
    .filter(m => m.categorie === 'PAPIER_CARTON')
    .reduce((sum, m) => sum + m.stockActuel, 0);
  const joursAutonomieCarton = Math.round(totalCartonKg / 3200);
  const totalFardeauxPrets = products.reduce((sum, p) => sum + p.stockFardeaux, 0);

  // Données graphiques
  const productSalesMap: Record<string, number> = {};
  invoices.forEach(inv => {
    inv.articles.forEach(art => {
      productSalesMap[art.designation] = (productSalesMap[art.designation] || 0) + art.totalLigneFCFA;
    });
  });

  const pieData = Object.entries(productSalesMap).map(([name, value]) => ({
    name,
    value
  }));

  const COLORS = ['#3B82F6', '#F59E0B', '#10B981', '#EC4899', '#8B5CF6'];

  const recentShiftsData = [...shifts].slice(-6).map(s => ({
    name: `${s.date.slice(5)} (${s.shift === 'MATIN_06H_14H' ? 'M' : s.shift === 'SOIR_14H_22H' ? 'S' : 'N'})`,
    alvéoles: s.alvéolesConformes,
    trs: s.trsOEE
  }));

  return (
    <div className="space-y-6">
      {/* Bannière de Bienvenue Exécutive */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                Usine Opérationnelle • 100% Pâte Recyclée
              </span>
              <span className="text-xs text-slate-400">Dakar - Thiès - Régions</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Tableau de Bord Exécutif & Pilotage Usine
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-2xl">
              Supervision en temps réel des lignes de moulage d'alvéoles, maîtrise du rendement synthétique (TRS), stocks de cartons et performances commerciales.
            </p>
          </div>

          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={() => onNavigateTab('productivite')}
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-1.5"
            >
              <Gauge className="w-4 h-4" />
              Pilotage Productivité & TRS
            </button>
            <button
              onClick={() => onNavigateTab('commercial')}
              className="px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-700 transition-all active:scale-95 flex items-center gap-1.5"
            >
              <ShoppingBag className="w-4 h-4" />
              Commandes & Facturation
            </button>
          </div>
        </div>
      </div>

      {/* Cartes Cadrans Principaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Production du Jour */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Production du Jour</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Factory className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {productionJourAlveoles.toLocaleString()}{' '}
              <span className="text-xs font-semibold text-slate-500">alvéoles</span>
            </div>
            <div className="flex items-center justify-between text-xs mt-2">
              <span className="text-indigo-600 font-bold">{productionJourFardeaux} fardeaux emballés</span>
              <span className="text-slate-400">{progressionObjectifPct}% de l'obj.</span>
            </div>
            <div className="w-full bg-slate-100 h-2 rounded-full mt-2 overflow-hidden">
              <div 
                className="bg-amber-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${progressionObjectifPct}%` }}
              ></div>
            </div>
          </div>
        </div>

        {/* Taux de Rendement Synthétique (TRS) */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TRS / OEE Moyen</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <Gauge className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900 tracking-tight">
              {avgTRS}%
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Niveau Industriel Conforme (&gt;80%)</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Cadence, disponibilité et qualité conformes</p>
          </div>
        </div>

        {/* Chiffre d'Affaires Global */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires</span>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">
              {caTotal.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 font-semibold mt-1">
              <ArrowUpRight className="w-3.5 h-3.5" />
              <span>{caEncaisse.toLocaleString()} FCFA encaissés</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">Ventes fermes avicoles et grossistes</p>
          </div>
        </div>

        {/* Autonomie Stock Carton */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Autonomie Matière</span>
            <span className="p-2 rounded-xl bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">
              ~{joursAutonomieCarton} <span className="text-sm font-semibold text-slate-500">Jours</span>
            </div>
            <div className="flex items-center gap-1 text-xs text-purple-600 font-semibold mt-1">
              <span>{(totalCartonKg / 1000).toFixed(1)} Tonnes de balles OCC</span>
            </div>
            <p className="text-[11px] text-slate-400 mt-1">{totalFardeauxPrets.toLocaleString()} fardeaux PF prêts</p>
          </div>
        </div>
      </div>

      {/* Graphiques interactifs Recharts */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Production et TRS récents */}
        <div className="lg:col-span-2 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <TrendingUp className="w-5 h-5 text-indigo-600" />
                Performances de Fabrication des Derniers Shifts
              </h2>
              <p className="text-xs text-slate-500">Suivi des quantités moulées et du TRS par équipe de production</p>
            </div>
            <button
              onClick={() => onNavigateTab('productivite')}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
            >
              Voir détails <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={recentShiftsData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} domain={[50, 100]} />
                <Tooltip contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }} />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="alvéoles" name="Alvéoles Conformes" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="trs" name="TRS / OEE (%)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Répartition du Chiffre d'Affaires par Format d'Alvéole */}
        <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 mb-1">
              Ventes par Format d'Alvéoles
            </h2>
            <p className="text-xs text-slate-500 mb-4">Répartition du chiffre d'affaires commercial</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    outerRadius={70}
                    fill="#8884d8"
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {pieData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => `${val.toLocaleString()} FCFA`}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {pieData.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }}></span>
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value.toLocaleString()} F</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Raccourcis Rapides vers les Opérations Usine */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('productivite')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Factory className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-3">Relevés de Production</h3>
          <p className="text-xs text-slate-500 mt-1">Enregistrer un shift, calculer le TRS et les cadences</p>
        </button>

        <button
          onClick={() => onNavigateTab('stock')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Boxes className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-3">Stocks & Balles Carton</h3>
          <p className="text-xs text-slate-500 mt-1">Inventaire balles OCC, réactifs et fardeaux d'alvéoles</p>
        </button>

        <button
          onClick={() => onNavigateTab('commercial')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-blue-50 text-blue-700 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-3">Facturation & BL</h3>
          <p className="text-xs text-slate-500 mt-1">Créer commandes fermes, bons de livraison et factures</p>
        </button>

        <button
          onClick={() => onNavigateTab('finances')}
          className="p-4 rounded-2xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-2.5 rounded-xl bg-purple-50 text-purple-700 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <h3 className="font-bold text-slate-900 text-sm mt-3">Trésorerie & Dépenses</h3>
          <p className="text-xs text-slate-500 mt-1">Comptabilité usine, P&L simplifié et rapprochement</p>
        </button>
      </div>
    </div>
  );
};
