import React from 'react';
import { 
  TrendingUp, DollarSign, AlertTriangle, Boxes, 
  Users, Building2, Store, Award, PieChart, Activity 
} from 'lucide-react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, PieChart as RePieChart, Pie, Cell } from 'recharts';
import { Invoice, StockLot, StockLoss, Expense, Prospect, Client, Poulailler } from '../../types';

interface ExecutiveDashboardProps {
  invoices: Invoice[];
  stockLots: StockLot[];
  stockLosses: StockLoss[];
  expenses: Expense[];
  prospects: Prospect[];
  clients: Client[];
  poulaillers: Poulailler[];
  onNavigateTab: (tab: any) => void;
}

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({
  invoices,
  stockLots,
  stockLosses,
  expenses,
  prospects,
  clients,
  poulaillers,
  onNavigateTab
}) => {
  // Calculations for 10 KPIs
  const totalCA = invoices.reduce((acc, inv) => acc + inv.totalFCFA, 0);
  const totalImpayes = invoices.reduce((acc, inv) => acc + inv.soldeDuFCFA, 0);
  const totalExpenses = expenses.reduce((acc, exp) => acc + exp.montantFCFA, 0);
  const beneficeEstime = totalCA - totalExpenses;

  // Stock Calculation (EXCLUSIVELY IN EGGS)
  const totalOeufsRecus = stockLots.reduce((acc, lot) => acc + lot.quantiteOeufsRecus, 0);
  const totalOeufsVendus = invoices.reduce((acc, inv) => 
    acc + inv.items.reduce((sum, item) => sum + item.quantiteOeufs, 0), 0
  );
  const totalOeufsPerdusCat1 = stockLosses
    .filter(l => l.typePerte.includes('Catégorie 1'))
    .reduce((acc, l) => acc + l.quantiteOeufs, 0);
  const totalOeufsPerdusCat2 = stockLosses
    .filter(l => l.typePerte.includes('Catégorie 2'))
    .reduce((acc, l) => acc + l.quantiteOeufs, 0);
  
  const totalOeufsPerdus = totalOeufsPerdusCat1 + totalOeufsPerdusCat2;
  const stockOeufsDisponible = Math.max(0, totalOeufsRecus - totalOeufsVendus - totalOeufsPerdus);
  const tauxPertePercent = totalOeufsRecus > 0 ? ((totalOeufsPerdus / totalOeufsRecus) * 100).toFixed(1) : '0';

  // CRM Conversions
  const totalProspects = prospects.length;
  const prospectsConvertis = prospects.filter(p => p.status === 'Converti').length;
  const tauxConversion = totalProspects > 0 ? Math.round((prospectsConvertis / totalProspects) * 100) : 0;

  // Dynamically compute real revenue by day of week from actual invoices
  const daysOfWeek = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const realCaByDay: Record<string, number> = { Lun: 0, Mar: 0, Mer: 0, Jeu: 0, Ven: 0, Sam: 0, Dim: 0 };
  
  invoices.forEach(inv => {
    if (inv.date) {
      const d = new Date(inv.date);
      const dayName = daysOfWeek[d.getDay()];
      if (realCaByDay[dayName] !== undefined) {
        realCaByDay[dayName] += inv.totalFCFA;
      }
    }
  });

  const caData = [
    { name: 'Lun', ca: realCaByDay['Lun'] },
    { name: 'Mar', ca: realCaByDay['Mar'] },
    { name: 'Mer', ca: realCaByDay['Mer'] },
    { name: 'Jeu', ca: realCaByDay['Jeu'] },
    { name: 'Ven', ca: realCaByDay['Ven'] },
    { name: 'Sam', ca: realCaByDay['Sam'] },
    { name: 'Dim', ca: realCaByDay['Dim'] },
  ];

  const lossesPieData = [
    { name: 'Cat. 1 (Fissurés)', value: totalOeufsPerdusCat1, color: '#f59e0b' },
    { name: 'Cat. 2 (Cassés)', value: totalOeufsPerdusCat2, color: '#ef4444' },
  ];

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Top Banner Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 md:p-6 glass-panel rounded-2xl border border-amber-200 shadow-sm bg-white">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="bg-amber-500 text-white font-extrabold text-[10px] md:text-xs px-2.5 py-0.5 rounded-full uppercase tracking-wider shadow-sm">
              BS DISTRIBUTION SUARL
            </span>
            <span className="text-[10px] md:text-xs text-slate-500 font-bold">Dashboard Exécutif Keur Massar</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-slate-900 mt-1.5 font-display">Tableau de Bord Général</h2>
          <p className="text-[11px] md:text-xs text-slate-600 font-medium">Pilotage financier, commercial et suivi des stocks d'œufs au Sénégal.</p>
        </div>

        <div className="flex items-center gap-3">
          <button 
            onClick={() => onNavigateTab('sales')}
            className="px-4 md:px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md transition-all active:scale-95 flex items-center gap-2"
          >
            <TrendingUp className="w-4 h-4" /> Nouvelle Vente Facturée
          </button>
        </div>
      </div>

      {/* 10 KPIs Mandatory Grid - always 2 cols on mobile, 4 on desktop */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* KPI 1 : CA Global */}
        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">1. Chiffre d'Affaires</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-amber-700 mt-2">{totalCA.toLocaleString('fr-FR')} FCFA</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Ventes d'œufs enregistrées</p>
        </div>

        {/* KPI 2 : Impayés & Crédits */}
        <div className="glass-card p-4 rounded-2xl border border-red-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">2. Impayés & Crédits</span>
            <div className="p-2.5 rounded-xl bg-red-50 text-red-600 border border-red-200">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-red-600 mt-2">{totalImpayes.toLocaleString('fr-FR')} FCFA</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Factures en attente de solde</p>
        </div>

        {/* KPI 3 : Total Dépenses */}
        <div className="glass-card p-4 rounded-2xl border border-blue-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">3. Total Dépenses</span>
            <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 border border-blue-200">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-blue-700 mt-2">{totalExpenses.toLocaleString('fr-FR')} FCFA</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Bénéfice estimé : {beneficeEstime.toLocaleString('fr-FR')} FCFA</p>
        </div>

        {/* KPI 4 : Stock Disponible d'Œufs */}
        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">4. Stock d'Œufs Prêt</span>
            <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-200">
              <Boxes className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-emerald-700 mt-2">{stockOeufsDisponible.toLocaleString('fr-FR')} œufs</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Unité unique : Nombre d'œufs</p>
        </div>

        {/* KPI 5 : Pertes % (Cat 1 & Cat 2) */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">5. Taux de Perte %</span>
            <div className="p-2.5 rounded-xl bg-amber-50 text-amber-600 border border-amber-200">
              <PieChart className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-amber-700 mt-2">{tauxPertePercent} %</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Total perdus: {totalOeufsPerdus.toLocaleString()} œufs</p>
        </div>

        {/* KPI 6 : Conversions Prospects */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">6. Taux Conversion CRM</span>
            <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 border border-purple-200">
              <Users className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-purple-700 mt-2">{tauxConversion} %</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">{prospectsConvertis} clients convertis / {totalProspects} prospects</p>
        </div>

        {/* KPI 7 : Active Poulaillers */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">7. Poulaillers Actifs</span>
            <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-200">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-indigo-700 mt-2">{poulaillers.length} poulaillers</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Fermes partenaires référencées</p>
        </div>

        {/* KPI 8 : Performance Commerciaux */}
        <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-600">8. Performance Terrain</span>
            <div className="p-2.5 rounded-xl bg-teal-50 text-teal-600 border border-teal-200">
              <Award className="w-4 h-4" />
            </div>
          </div>
          <p className="text-lg md:text-2xl font-extrabold text-teal-700 mt-2">{clients.length} Clients</p>
          <p className="text-[10px] text-slate-500 font-medium mt-1">Portefeuille actif Sénégal</p>
        </div>
      </div>

      {/* Visual Analytics Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* CA Evolution Bar Chart */}
        <div className="lg:col-span-2 glass-panel p-4 md:p-6 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
                <Activity className="w-4 h-4 text-amber-600" /> Évolution du Chiffre d'Affaires (Ventes d'Œufs)
              </h3>
              <p className="text-xs text-slate-500 font-medium">Ventes journalières en FCFA sur la période en cours</p>
            </div>
            <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded border border-amber-200">FCFA</span>
          </div>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={caData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#64748b" fontSize={11} />
                <YAxis stroke="#64748b" fontSize={11} tickFormatter={(val) => `${val / 1000}k`} width={35} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px', borderRadius: '8px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} 
                  formatter={(val: any) => [`${val.toLocaleString()} FCFA`, 'Chiffre d\'affaires']}
                />
                <Bar dataKey="ca" fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Loss Recharts Pie Chart */}
        <div className="glass-panel p-6 rounded-2xl border border-slate-200 bg-white flex flex-col justify-between">
          <div>
            <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
              <PieChart className="w-4 h-4 text-red-600" /> Répartition des Pertes d'Œufs
            </h3>
            <p className="text-xs text-slate-500 font-medium mb-4">Catégorie 1 (Fissurés) vs Catégorie 2 (Cassés)</p>

            <div className="h-44 w-full flex items-center justify-center">
              <ResponsiveContainer width="100%" height="100%">
                <RePieChart>
                  <Pie data={lossesPieData} cx="50%" cy="50%" innerRadius={45} outerRadius={70} dataKey="value">
                    {lossesPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a', fontSize: '12px', borderRadius: '8px' }} />
                </RePieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-2 border-t border-slate-100 pt-3 text-xs">
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span> Cat. 1 (Fissurés / Vente bas prix)
              </span>
              <span className="font-extrabold text-amber-700">{totalOeufsPerdusCat1} œufs</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="flex items-center gap-1.5 text-slate-700 font-medium">
                <span className="w-2.5 h-2.5 rounded-full bg-red-500"></span> Cat. 2 (Cassés irrécupérables)
              </span>
              <span className="font-extrabold text-red-600">{totalOeufsPerdusCat2} œufs</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
