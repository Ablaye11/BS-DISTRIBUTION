import React, { useState } from 'react';
import { Invoice } from '../../types';
import {
  CheckCircle2, Clock, AlertTriangle, Search,
  Download, ChevronDown, ChevronUp, DollarSign
} from 'lucide-react';
import { generateInvoicePDF } from '../../components/pdf/InvoicePDFGenerator';

interface CreancesModuleProps {
  invoices: Invoice[];
  onRefreshData: () => void;
}

type PaymentStatus = 'TOUS' | 'PAYE' | 'PARTIEL' | 'IMPAYE';

export const CreancesModule: React.FC<CreancesModuleProps> = ({ invoices, onRefreshData }) => {
  const [filter, setFilter] = useState<PaymentStatus>('TOUS');
  const [search, setSearch] = useState('');
  const [expandedClient, setExpandedClient] = useState<string | null>(null);

  // Group invoices by client
  const clientMap: Record<string, { nom: string; invoices: Invoice[] }> = {};
  invoices.forEach(inv => {
    if (!clientMap[inv.clientId]) {
      clientMap[inv.clientId] = { nom: inv.clientNom, invoices: [] };
    }
    clientMap[inv.clientId].invoices.push(inv);
  });

  // Build client summary rows
  const clientRows = Object.entries(clientMap).map(([clientId, data]) => {
    const totalFacture = data.invoices.reduce((s, i) => s + i.totalFCFA, 0);
    const totalEncaisse = data.invoices.reduce((s, i) => s + i.acompteFCFA, 0);
    const totalRestant = data.invoices.reduce((s, i) => s + i.soldeDuFCFA, 0);

    let status: 'PAYE' | 'PARTIEL' | 'IMPAYE';
    if (totalRestant === 0) status = 'PAYE';
    else if (totalEncaisse > 0) status = 'PARTIEL';
    else status = 'IMPAYE';

    return { clientId, nom: data.nom, invoices: data.invoices, totalFacture, totalEncaisse, totalRestant, status };
  });

  // Stats
  const totalDu = clientRows.reduce((s, r) => s + r.totalRestant, 0);
  const totalEncaisse = clientRows.reduce((s, r) => s + r.totalEncaisse, 0);
  const nbPaye = clientRows.filter(r => r.status === 'PAYE').length;
  const nbPartiel = clientRows.filter(r => r.status === 'PARTIEL').length;
  const nbImpaye = clientRows.filter(r => r.status === 'IMPAYE').length;

  const filtered = clientRows.filter(r =>
    (filter === 'TOUS' || r.status === filter) &&
    r.nom.toLowerCase().includes(search.toLowerCase())
  );

  const statusConfig = {
    PAYE:    { label: '✅ Payé intégralement',    bg: 'bg-emerald-50 text-emerald-800', border: 'border-emerald-200', text: 'text-emerald-700' },
    PARTIEL: { label: '⏳ Acompte — Reste dû',    bg: 'bg-amber-50 text-amber-900',     border: 'border-amber-200', text: 'text-amber-700' },
    IMPAYE:  { label: '🔴 Aucun paiement reçu',   bg: 'bg-red-50 text-red-800',         border: 'border-red-200', text: 'text-red-600' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-red-600 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">MODULE CRÉANCES</span>
            <span className="text-xs text-slate-500 font-bold">Suivi des paiements clients en FCFA</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Qui a payé ? Qui doit encore ?</h2>
        </div>
      </div>

      {/* KPI Summary Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span className="text-xs text-slate-600 font-bold">Clients Payés</span>
          </div>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1">{nbPaye}</p>
          <p className="text-[10px] text-slate-500 font-medium">Règlement complet reçu</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-amber-600" />
            <span className="text-xs text-slate-600 font-bold">Paiement Partiel</span>
          </div>
          <p className="text-2xl font-extrabold text-amber-700 mt-1">{nbPartiel}</p>
          <p className="text-[10px] text-slate-500 font-medium">Acompte versé, reste dû</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-red-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <AlertTriangle className="w-4 h-4 text-red-600" />
            <span className="text-xs text-slate-600 font-bold">Impayés Totaux</span>
          </div>
          <p className="text-2xl font-extrabold text-red-600 mt-1">{nbImpaye}</p>
          <p className="text-[10px] text-slate-500 font-medium">Aucun versement reçu</p>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-slate-200 bg-white">
          <div className="flex items-center gap-2 mb-1">
            <DollarSign className="w-4 h-4 text-slate-600" />
            <span className="text-xs text-slate-600 font-bold">Total Créances</span>
          </div>
          <p className="text-xl font-extrabold text-red-600 mt-1">{totalDu.toLocaleString('fr-FR')} F</p>
          <p className="text-[10px] text-emerald-700 font-bold">Encaissé : {totalEncaisse.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-xs shadow-sm">
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Rechercher un client..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {(['TOUS', 'PAYE', 'PARTIEL', 'IMPAYE'] as PaymentStatus[]).map(s => (
            <button
              key={s}
              onClick={() => setFilter(s)}
              className={`px-3.5 py-2 rounded-xl font-extrabold border transition-all ${
                filter === s
                  ? 'bg-amber-500 text-white border-amber-500 shadow-md'
                  : 'bg-slate-50 text-slate-700 border-slate-300 hover:border-amber-500'
              }`}
            >
              {s === 'TOUS' ? 'Tous' : s === 'PAYE' ? '✅ Payés' : s === 'PARTIEL' ? '⏳ Partiels' : '🔴 Impayés'}
            </button>
          ))}
        </div>
      </div>

      {/* Client Rows */}
      <div className="space-y-3">
        {filtered.length === 0 && (
          <div className="text-center py-12 text-slate-400 text-xs">Aucun client trouvé.</div>
        )}
        {filtered.map(row => {
          const cfg = statusConfig[row.status];
          const isExpanded = expandedClient === row.clientId;
          return (
            <div key={row.clientId} className={`glass-card rounded-2xl border ${cfg.border} bg-white overflow-hidden shadow-sm`}>
              {/* Client Summary Row */}
              <button
                onClick={() => setExpandedClient(isExpanded ? null : row.clientId)}
                className="w-full flex items-center justify-between p-4 hover:bg-slate-50 transition-all text-left"
              >
                <div className="flex items-center gap-3">
                  <div className={`w-3 h-3 rounded-full ${
                    row.status === 'PAYE' ? 'bg-emerald-500' :
                    row.status === 'PARTIEL' ? 'bg-amber-500' : 'bg-red-500'
                  }`} />
                  <div>
                    <p className="font-extrabold text-slate-900 text-sm font-display">{row.nom}</p>
                    <p className={`text-[10px] font-extrabold ${cfg.text}`}>{cfg.label}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6 text-right">
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-bold">Total Facturé</p>
                    <p className="text-xs font-extrabold text-slate-800">{row.totalFacture.toLocaleString('fr-FR')} F</p>
                  </div>
                  <div className="hidden sm:block">
                    <p className="text-[10px] text-slate-500 font-bold">Encaissé</p>
                    <p className="text-xs font-extrabold text-emerald-700">+{row.totalEncaisse.toLocaleString('fr-FR')} F</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-slate-500 font-bold">Reste Dû</p>
                    <p className={`text-sm font-extrabold ${row.totalRestant > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                      {row.totalRestant > 0 ? `-${row.totalRestant.toLocaleString('fr-FR')} F` : '0 FCFA'}
                    </p>
                  </div>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </div>
              </button>

              {/* Expanded: Individual Invoices */}
              {isExpanded && (
                <div className="border-t border-slate-200 bg-slate-50/80 divide-y divide-slate-200">
                  <div className="px-4 py-2 bg-slate-100">
                    <p className="text-[10px] text-slate-600 font-extrabold uppercase tracking-wider">Détail des Factures — {row.invoices.length} transaction(s)</p>
                  </div>
                  {row.invoices.map(inv => (
                    <div key={inv.id} className="flex items-center justify-between p-3.5 hover:bg-slate-100/60 text-xs">
                      <div className="flex items-center gap-3">
                        <div>
                          <p className="font-extrabold text-amber-800">{inv.numero}</p>
                          <p className="text-[10px] text-slate-500 font-medium">{inv.date} · {inv.modePaiement}</p>
                        </div>
                        {inv.referencePaiement && (
                          <span className="font-mono text-[10px] text-slate-600 bg-white border border-slate-200 px-2 py-0.5 rounded font-bold">
                            {inv.referencePaiement}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-right">
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold">Facturé</p>
                          <p className="font-bold text-slate-800">{inv.totalFCFA.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold">Payé</p>
                          <p className="font-extrabold text-emerald-700">+{inv.acompteFCFA.toLocaleString('fr-FR')} F</p>
                        </div>
                        <div>
                          <p className="text-[10px] text-slate-500 font-bold">Restant</p>
                          <p className={`font-extrabold ${inv.soldeDuFCFA > 0 ? 'text-red-600' : 'text-slate-400'}`}>
                            {inv.soldeDuFCFA > 0 ? `-${inv.soldeDuFCFA.toLocaleString('fr-FR')} F` : '✓'}
                          </p>
                        </div>
                        <button
                          onClick={() => generateInvoicePDF(inv, 'FACTURE')}
                          className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[10px] rounded-lg shadow-sm transition-all flex items-center gap-1"
                        >
                          <Download className="w-3 h-3" /> PDF
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
