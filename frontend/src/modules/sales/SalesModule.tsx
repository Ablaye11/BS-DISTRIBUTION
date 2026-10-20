import React, { useState } from 'react';
import { Invoice, Client, EggCategoryType, PaymentMethod, PaymentStatus, OrderStatus, User } from '../../types';
import { ShoppingBag, Plus, FileText, Download, Truck } from 'lucide-react';
import { db, generateInvoiceNumber } from '../../db/database';
import { generateInvoicePDF } from '../../components/pdf/InvoicePDFGenerator';

interface SalesModuleProps {
  invoices: Invoice[];
  clients: Client[];
  currentUser?: User;
  onRefreshData: () => void;
}

export const SalesModule: React.FC<SalesModuleProps> = ({ invoices, clients, currentUser, onRefreshData }) => {
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form State
  const [clientId, setClientId] = useState('');
  const [typeOeuf, setTypeOeuf] = useState<EggCategoryType>('Œufs Gros Calibre');
  const [quantiteOeufs, setQuantiteOeufs] = useState<number>(1500); // 1500 œufs
  const [prixUnitaireOeuf, setPrixUnitaireOeuf] = useState<number>(110); // 110 FCFA par œuf
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Wave');
  const [referencePaiement, setReferencePaiement] = useState('');
  const [acompteFCFA, setAcompteFCFA] = useState<number>(165000);
  const [livreurNom, setLivreurNom] = useState('Amadou Sow');

  const totalCalculatedFCFA = quantiteOeufs * prixUnitaireOeuf;

  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!clientId) {
      alert('Veuillez sélectionner un client.');
      return;
    }

    const clientObj = clients.find(c => c.id === clientId);
    if (!clientObj) return;

    const { numero, numeroBL } = await generateInvoiceNumber();

    const soldeDu = Math.max(0, totalCalculatedFCFA - acompteFCFA);
    const statutPaiement: PaymentStatus = soldeDu === 0 ? 'Payée' : acompteFCFA > 0 ? 'Acompte' : 'Non Payée / Crédit';

    const newInvoice: Invoice = {
      id: `inv-${Date.now()}`,
      numero: numero,
      numeroBL: numeroBL,
      clientId: clientObj.id,
      clientNom: clientObj.raisonSociale,
      commercialId: currentUser?.id || 'c-1',
      commercialNom: currentUser?.name || 'Ibrahima Ndiaye',
      items: [
        {
          typeOeuf: typeOeuf,
          quantiteOeufs: Number(quantiteOeufs),
          prixUnitaireOeuf: Number(prixUnitaireOeuf),
          totalFCFA: totalCalculatedFCFA
        }
      ],
      totalFCFA: totalCalculatedFCFA,
      acompteFCFA: Number(acompteFCFA),
      soldeDuFCFA: soldeDu,
      modePaiement: modePaiement,
      referencePaiement: referencePaiement || `${modePaiement.toUpperCase()}-${Date.now().toString().slice(-6)}`,
      statutPaiement: statutPaiement,
      statutVente: 'Livrée',
      date: new Date().toISOString().split('T')[0],
      livreurNom: livreurNom,
    };

    await db.invoices.add(newInvoice);

    // Update Client Debt if credit remains
    if (soldeDu > 0) {
      await db.clients.update(clientObj.id, {
        soldeCreance: (clientObj.soldeCreance || 0) + soldeDu,
        totalAchatsFCFA: (clientObj.totalAchatsFCFA || 0) + totalCalculatedFCFA
      });
    } else {
      await db.clients.update(clientObj.id, {
        totalAchatsFCFA: (clientObj.totalAchatsFCFA || 0) + totalCalculatedFCFA
      });
    }

    setShowCreateModal(false);
    onRefreshData();
    alert(`Facture ${numero} créée avec succès ! Solde restant : ${soldeDu.toLocaleString()} FCFA.`);
  };

  return (
    <div className="space-y-4">
      {/* Header Bar - Mobile Optimized */}
      <div className="p-4 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1.5">
              <span className="whitespace-nowrap text-[10px] bg-amber-500 text-white font-extrabold px-2 py-0.5 rounded uppercase tracking-wide">Ventes</span>
              <span className="text-[10px] text-slate-500 font-medium hidden md:block">FAC-YYMM-#### & BL-YYMM-####</span>
            </div>
            <h2 className="text-base md:text-xl font-extrabold text-slate-900 font-display leading-tight">Facturation & Ventes d'Œufs</h2>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="shrink-0 px-3 md:px-5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" /><span className="hidden sm:inline">Nouvelle </span>Vente
          </button>
        </div>
      </div>

      {/* Invoice Header bar */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
            <FileText className="w-4 h-4 text-amber-600" />
            <span>Factures</span>
          </h3>
          <span className="text-xs text-slate-500 font-bold">{invoices.length} générées</span>
        </div>

        {/* ── MOBILE: Card layout ─────────────────────────────────── */}
        <div className="md:hidden divide-y divide-slate-100">
          {invoices.map(inv => (
            <div key={inv.id} className="p-4 space-y-3">
              {/* Top row */}
              <div className="flex items-start justify-between gap-2">
                <div>
                  <span className="text-[11px] font-extrabold text-amber-800 block">{inv.numero}</span>
                  <span className="text-xs font-bold text-slate-900">{inv.clientNom}</span>
                </div>
                <span className={`text-[10px] font-extrabold px-2 py-0.5 rounded shrink-0 ${
                  inv.statutPaiement === 'Payée' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  inv.statutPaiement === 'Acompte' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                  'bg-red-50 text-red-800 border border-red-200'
                }`}>
                  {inv.statutPaiement}
                </span>
              </div>
              {/* Info row */}
              <div className="flex items-center justify-between text-xs">
                <div className="space-y-0.5">
                  <p className="text-slate-500 font-medium">{inv.items.reduce((sum, i) => sum + i.quantiteOeufs, 0).toLocaleString()} œufs</p>
                  <span className="text-[10px] bg-amber-50 text-amber-800 border border-amber-200 font-bold px-1.5 py-0.2 rounded">{inv.modePaiement}</span>
                </div>
                <div className="text-right">
                  <p className="font-extrabold text-slate-900">{inv.totalFCFA.toLocaleString('fr-FR')} F</p>
                  {inv.soldeDuFCFA > 0 ? (
                    <p className="text-red-600 font-bold text-[11px]">Reste: {inv.soldeDuFCFA.toLocaleString('fr-FR')} F</p>
                  ) : (
                    <p className="text-emerald-700 font-bold text-[11px]">✓ Soldé</p>
                  )}
                </div>
              </div>
              {/* PDF Buttons */}
              <div className="flex gap-2">
                <button onClick={() => generateInvoicePDF(inv, 'FACTURE')}
                  className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-[11px] rounded-xl flex items-center justify-center gap-1.5 shadow-sm active:scale-95 transition-all">
                  <Download className="w-3.5 h-3.5" /> Facture PDF
                </button>
                <button onClick={() => generateInvoicePDF(inv, 'BL')}
                  className="flex-1 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-[11px] rounded-xl border border-slate-200 flex items-center justify-center gap-1.5 active:scale-95 transition-all">
                  <Truck className="w-3.5 h-3.5 text-slate-600" /> BL PDF
                </button>
              </div>
            </div>
          ))}
          {invoices.length === 0 && (
            <p className="p-8 text-center text-slate-400 text-xs">Aucune facture enregistrée pour le moment.</p>
          )}
        </div>

        {/* ── DESKTOP: Full Table ──────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3">Numéro FAC</th>
                <th className="p-3">Client</th>
                <th className="p-3 text-center">Qté Œufs</th>
                <th className="p-3 text-right">Montant</th>
                <th className="p-3 text-right">Reste Dû</th>
                <th className="p-3">Mode Paiement</th>
                <th className="p-3">Statut</th>
                <th className="p-3 text-center">PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {invoices.map(inv => (
                <tr key={inv.id} className="hover:bg-slate-50/60 transition-all">
                  <td className="p-3 font-extrabold text-amber-800">{inv.numero}</td>
                  <td className="p-3 font-bold text-slate-900">{inv.clientNom}</td>
                  <td className="p-3 text-center font-extrabold text-slate-800">
                    {inv.items.reduce((sum, i) => sum + i.quantiteOeufs, 0).toLocaleString()} œufs
                  </td>
                  <td className="p-3 text-right font-extrabold text-slate-900">
                    {inv.totalFCFA.toLocaleString('fr-FR')} F
                  </td>
                  <td className="p-3 text-right font-extrabold">
                    {inv.soldeDuFCFA > 0 ? (
                      <span className="text-red-600">{inv.soldeDuFCFA.toLocaleString('fr-FR')} F</span>
                    ) : (
                      <span className="text-emerald-700">0 FCFA</span>
                    )}
                  </td>
                  <td className="p-3">
                    <span className="bg-amber-50 text-amber-800 border border-amber-200 font-bold px-2 py-0.5 rounded text-[10px]">
                      {inv.modePaiement}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                      inv.statutPaiement === 'Payée' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      inv.statutPaiement === 'Acompte' ? 'bg-amber-50 text-amber-800 border border-amber-200' :
                      'bg-red-50 text-red-800 border border-red-200'
                    }`}>
                      {inv.statutPaiement}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex items-center justify-center gap-1.5">
                    <button onClick={() => generateInvoicePDF(inv, 'FACTURE')}
                      className="p-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-all font-extrabold text-[10px] flex items-center gap-1 shadow-sm">
                      <Download className="w-3.5 h-3.5" /> FAC
                    </button>
                    <button onClick={() => generateInvoicePDF(inv, 'BL')}
                      className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-lg transition-all font-bold text-[10px] border border-slate-200 flex items-center gap-1">
                      <Truck className="w-3.5 h-3.5 text-slate-600" /> BL
                    </button>
                    </div>
                  </td>
                </tr>
              ))}
              {invoices.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center text-slate-400 text-xs">Aucune facture enregistrée pour le moment.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Add Sale */}
      {showCreateModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-end md:items-center justify-center md:p-4">
        <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl md:rounded-2xl rounded-b-none md:rounded-b-2xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-amber-600" /> Enregistrer une Vente Facturée d'Œufs
            </h3>

            <form onSubmit={handleCreateInvoice} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Sélectionner Client *</label>
                <select 
                  required
                  value={clientId}
                  onChange={(e) => setClientId(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="">-- Choisir un client --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.raisonSociale} ({c.commune}, {c.region})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Type d'Œufs *</label>
                  <select 
                    value={typeOeuf}
                    onChange={(e) => setTypeOeuf(e.target.value as EggCategoryType)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  >
                    <option value="Œufs Gros Calibre">Œufs Gros Calibre</option>
                    <option value="Œufs Poulettes">Œufs Poulettes</option>
                    <option value="Œufs Fissurés (Cat 1)">Œufs Fissurés (Cat 1)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité (EXCLUSIVEMENT EN ŒUFS) *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={quantiteOeufs}
                    onChange={(e) => setQuantiteOeufs(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-amber-700 font-extrabold text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prix Unitaire par Œuf (FCFA) *</label>
                  <input 
                    type="number"
                    required
                    min={1}
                    value={prixUnitaireOeuf}
                    onChange={(e) => setPrixUnitaireOeuf(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Montant Total Calculé</label>
                  <div className="w-full bg-amber-50 border border-amber-200 rounded-xl p-2.5 text-amber-800 font-extrabold text-sm">
                    {totalCalculatedFCFA.toLocaleString('fr-FR')} FCFA
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-100">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Mode de Paiement *</label>
                  <select 
                    value={modePaiement}
                    onChange={(e) => setModePaiement(e.target.value as PaymentMethod)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="Wave">🌊 Wave Mobile Money</option>
                    <option value="Orange Money">🍊 Orange Money</option>
                    <option value="Free Money">🟣 Free Money</option>
                    <option value="Espèces">💵 Espèces (Cash)</option>
                    <option value="Chèque">🏦 Chèque Bancaire</option>
                    <option value="Virement Bancaire">🏦 Virement Bancaire</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Montant Versé / Acompte (FCFA)</label>
                  <input 
                    type="number"
                    value={acompteFCFA}
                    onChange={(e) => setAcompteFCFA(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-emerald-700 font-extrabold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Référence Transaction / Chèque</label>
                <input 
                  type="text"
                  placeholder="ex: WAVE-987654321 ou Numéro Chèque"
                  value={referencePaiement}
                  onChange={(e) => setReferencePaiement(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-5 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 text-white font-extrabold rounded-xl shadow-md"
                >
                  Générer Facture & BL (Tampon Inclus)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
