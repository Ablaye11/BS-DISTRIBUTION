import React, { useState } from 'react';
import { Invoice } from '../../types';
import { CreditCard, Search, Download, Sliders, CheckCircle2 } from 'lucide-react';
import { generateInvoicePDF } from '../../components/pdf/InvoicePDFGenerator';
import { PaymentApiConfigModal } from '../../components/common/PaymentApiConfigModal';

interface PaymentsModuleProps {
  invoices: Invoice[];
  onRefreshData: () => void;
}

export const PaymentsModule: React.FC<PaymentsModuleProps> = ({ invoices, onRefreshData }) => {
  const [selectedMethod, setSelectedMethod]   = useState<string>('TOUS');
  const [searchTerm, setSearchTerm]           = useState('');
  const [showConfigModal, setShowConfigModal] = useState(false);

  const filteredInvoices = invoices.filter(inv => 
    (selectedMethod === 'TOUS' || inv.modePaiement === selectedMethod) &&
    (inv.numero.toLowerCase().includes(searchTerm.toLowerCase()) ||
     inv.clientNom.toLowerCase().includes(searchTerm.toLowerCase()) ||
     (inv.referencePaiement && inv.referencePaiement.toLowerCase().includes(searchTerm.toLowerCase())))
  );

  const totalEncaisseWave  = invoices.filter(i => i.modePaiement === 'Wave').reduce((sum, i) => sum + i.acompteFCFA, 0);
  const totalEncaisseOM    = invoices.filter(i => i.modePaiement === 'Orange Money').reduce((sum, i) => sum + i.acompteFCFA, 0);
  const totalEncaisseCash  = invoices.filter(i => i.modePaiement === 'Espèces').reduce((sum, i) => sum + i.acompteFCFA, 0);
  const totalGlobalEncaisse = invoices.reduce((sum, i) => sum + i.acompteFCFA, 0);

  return (
    <div className="space-y-6 font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-slate-950 font-black px-2.5 py-0.5 rounded shadow-xs uppercase tracking-wider">MODULE 9 CDC</span>
            <span className="text-xs text-slate-500 font-bold">API & Guichet de Paiement Sénégal (Wave, OM, Free Money)</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Journal des Encaissements & API Transactions</h2>
        </div>

        <button
          onClick={() => setShowConfigModal(true)}
          className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2 transition-all active:scale-95 border border-slate-700"
        >
          <Sliders className="w-4 h-4 text-amber-400" />
          <span>Configurer API Wave & OM</span>
        </button>
      </div>

      {/* Payment Channel Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-blue-200 bg-white">
          <span className="text-xs font-extrabold text-blue-700 flex items-center gap-1.5">🌊 Wave Mobile Money</span>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{totalEncaisseWave.toLocaleString('fr-FR')} FCFA</p>
          <span className="text-[10px] text-slate-500 font-medium">Transactions validées via QR Code/Push</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-orange-200 bg-white">
          <span className="text-xs font-extrabold text-orange-700 flex items-center gap-1.5">🍊 Orange Money</span>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{totalEncaisseOM.toLocaleString('fr-FR')} FCFA</p>
          <span className="text-[10px] text-slate-500 font-medium">Encaissements marchands OM</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-white">
          <span className="text-xs font-extrabold text-emerald-700 flex items-center gap-1.5">💵 Espèces (Cash)</span>
          <p className="text-xl font-extrabold text-slate-900 mt-2">{totalEncaisseCash.toLocaleString('fr-FR')} FCFA</p>
          <span className="text-[10px] text-slate-500 font-medium">Comptant à la livraison Keur Massar</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <span className="text-xs font-extrabold text-amber-800 flex items-center gap-1.5">📊 Total Général Encaissé</span>
          <p className="text-xl font-extrabold text-amber-700 mt-2">{totalGlobalEncaisse.toLocaleString('fr-FR')} FCFA</p>
          <span className="text-[10px] text-slate-500 font-medium">Recettes réelles en trésorerie</span>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-xs shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Réf transaction, client, N° FAC..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <span className="text-slate-600 font-bold">Support de Paiement :</span>
          <select 
            value={selectedMethod}
            onChange={(e) => setSelectedMethod(e.target.value)}
            className="bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500"
          >
            <option value="TOUS">Tous les supports</option>
            <option value="Wave">Wave Mobile Money</option>
            <option value="Orange Money">Orange Money</option>
            <option value="Free Money">Free Money</option>
            <option value="Espèces">Espèces (Cash)</option>
            <option value="Chèque">Chèque Bancaire</option>
          </select>
        </div>
      </div>

      {/* Transactions Table */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
            <CreditCard className="w-4 h-4 text-amber-600" /> Registre Chronologique des Règlements
          </h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3">Facture N°</th>
                <th className="p-3">Client</th>
                <th className="p-3">Canal Paiement</th>
                <th className="p-3">Réf. Transaction</th>
                <th className="p-3 text-right">Montant Encaissé</th>
                <th className="p-3 text-right">Solde Dû</th>
                <th className="p-3 text-center">Reçu PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-extrabold text-amber-700">{inv.numero}</td>
                  <td className="p-3 font-bold text-slate-900">{inv.clientNom}</td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                      inv.modePaiement === 'Wave' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      inv.modePaiement === 'Orange Money' ? 'bg-orange-50 text-orange-800 border border-orange-200' :
                      'bg-emerald-50 text-emerald-800 border border-emerald-200'
                    }`}>
                      {inv.modePaiement}
                    </span>
                  </td>
                  <td className="p-3 font-mono text-slate-700 font-medium">{inv.referencePaiement || '-'}</td>
                  <td className="p-3 text-right font-extrabold text-emerald-700">
                    +{inv.acompteFCFA.toLocaleString('fr-FR')} FCFA
                  </td>
                  <td className="p-3 text-right font-extrabold">
                    {inv.soldeDuFCFA > 0 ? (
                      <span className="text-red-600">{inv.soldeDuFCFA.toLocaleString('fr-FR')} F</span>
                    ) : (
                      <span className="text-slate-400">0 FCFA</span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => generateInvoicePDF(inv, 'FACTURE')}
                      className="px-2.5 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 font-extrabold text-[10px] rounded-lg border border-amber-200 transition-all flex items-center gap-1 mx-auto"
                    >
                      <Download className="w-3 h-3" /> PDF Reçu
                    </button>
                  </td>
                </tr>
              ))}
              {filteredInvoices.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-slate-400 text-xs">Aucune transaction trouvée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showConfigModal && (
        <PaymentApiConfigModal onClose={() => setShowConfigModal(false)} />
      )}
    </div>
  );
};
