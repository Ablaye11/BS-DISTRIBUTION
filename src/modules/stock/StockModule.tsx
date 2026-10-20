import React, { useState } from 'react';
import { StockLot, StockLoss, EggCategoryType } from '../../types';
import { Boxes, Plus, AlertTriangle, Layers } from 'lucide-react';
import { db, generateLotReference } from '../../db/database';

interface StockModuleProps {
  stockLots: StockLot[];
  stockLosses: StockLoss[];
  onRefreshData: () => void;
}

export const StockModule: React.FC<StockModuleProps> = ({ stockLots, stockLosses, onRefreshData }) => {
  const [showAddLotModal, setShowAddLotModal] = useState(false);
  const [showAddLossModal, setShowAddLossModal] = useState(false);

  // Form State Lot
  const [poulaillerNom, setPoulaillerNom] = useState('Poulailler Bio Mounawara');
  const [quantiteOeufsRecus, setQuantiteOeufsRecus] = useState<number>(6000);
  const [prixAchatUnitaireOeuf, setPrixAchatUnitaireOeuf] = useState<number>(85);
  const [typeOeuf, setTypeOeuf] = useState<EggCategoryType>('Œufs Gros Calibre');

  // Form State Loss
  const [typePerte, setTypePerte] = useState<'Catégorie 1 - Fissurés' | 'Catégorie 2 - Cassés irrécupérables'>('Catégorie 1 - Fissurés');
  const [quantitePerteOeufs, setQuantitePerteOeufs] = useState<number>(150);
  const [motifPerte, setMotifPerte] = useState('Vibrations transport Keur Massar');

  const totalOeufsEnStock = stockLots.reduce((acc, lot) => acc + lot.quantiteOeufsRecus, 0);
  const totalPerteCat1 = stockLosses.filter(l => l.typePerte.includes('Catégorie 1')).reduce((acc, l) => acc + l.quantiteOeufs, 0);
  const totalPerteCat2 = stockLosses.filter(l => l.typePerte.includes('Catégorie 2')).reduce((acc, l) => acc + l.quantiteOeufs, 0);

  const handleAddLot = async (e: React.FormEvent) => {
    e.preventDefault();
    const ref = await generateLotReference();
    const newLot: StockLot = {
      id: `lot-${Date.now()}`,
      referenceLot: ref,
      poulaillerNom: poulaillerNom,
      fournisseurNom: poulaillerNom,
      dateReception: new Date().toISOString().split('T')[0],
      quantiteOeufsRecus: Number(quantiteOeufsRecus),
      prixAchatUnitaireOeuf: Number(prixAchatUnitaireOeuf),
      typeOeuf: typeOeuf,
      remarques: 'Lot réceptionné et contrôlé sanitaire OK'
    };

    await db.stockLots.add(newLot);
    setShowAddLotModal(false);
    onRefreshData();
    alert(`Lot d'œufs ${newLot.referenceLot} enregistré en stock !`);
  };

  const handleAddLoss = async (e: React.FormEvent) => {
    e.preventDefault();
    const prixValeur = quantitePerteOeufs * 85;
    const newLoss: StockLoss = {
      id: `loss-${Date.now()}`,
      date: new Date().toISOString().split('T')[0],
      typePerte: typePerte,
      quantiteOeufs: Number(quantitePerteOeufs),
      prixValeurFCFA: prixValeur,
      motif: motifPerte,
      saisiPar: 'Comptable / Gestionnaire Stock'
    };

    await db.stockLosses.add(newLoss);
    setShowAddLossModal(false);
    onRefreshData();
    alert(`Perte d'œufs ${typePerte} comptabilisée (${quantitePerteOeufs} œufs).`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">UNITÉ EXCLUSIVEMENT ŒUFS</span>
            <span className="text-xs text-slate-500 font-bold">Gestion des Entrées par Lot & Traitement des Pertes</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Stock d'Œufs & Casse / Fissures</h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowAddLossModal(true)}
            className="px-3.5 py-2 bg-red-50 hover:bg-red-100 text-red-700 font-extrabold text-xs rounded-xl border border-red-200 shadow-sm flex items-center gap-1.5 transition-all"
          >
            <AlertTriangle className="w-4 h-4 text-red-600" /> Déclarer une Perte / Casse
          </button>
          <button
            onClick={() => setShowAddLotModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all"
          >
            <Plus className="w-4 h-4" /> Réceptionner un Lot d'Œufs
          </button>
        </div>
      </div>

      {/* Stock Cards Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="glass-card p-4 rounded-2xl border border-emerald-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Total Œufs Réceptionnés (Lots)</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1.5">{totalOeufsEnStock.toLocaleString('fr-FR')} œufs</p>
          <span className="text-[10px] text-slate-500 font-medium">Traçabilité par lot fournisseur</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-amber-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Pertes Catégorie 1 (Fissurés)</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1.5">{totalPerteCat1.toLocaleString('fr-FR')} œufs</p>
          <span className="text-[10px] text-amber-800 font-medium">Transférés pour revente au détail bas prix</span>
        </div>

        <div className="glass-card p-4 rounded-2xl border border-red-200 bg-white">
          <span className="text-xs text-slate-600 font-bold">Pertes Catégorie 2 (Cassés)</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1.5">{totalPerteCat2.toLocaleString('fr-FR')} œufs</p>
          <span className="text-[10px] text-red-700 font-medium">Sortie définitive du stock (Perte sèche)</span>
        </div>
      </div>

      {/* Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Lots Table */}
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
            <Layers className="w-4 h-4 text-amber-600" /> Réceptions de Lots par Poulailler
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Réf Lot</th>
                  <th className="p-3">Poulailler Origine</th>
                  <th className="p-3 text-center">Quantité Œufs</th>
                  <th className="p-3 text-right">Prix/Œuf</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLots.map(lot => (
                  <tr key={lot.id} className="hover:bg-slate-50/60">
                    <td className="p-3 font-extrabold text-amber-700">{lot.referenceLot}</td>
                    <td className="p-3 font-bold text-slate-800">{lot.poulaillerNom}</td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{lot.quantiteOeufsRecus.toLocaleString()}</td>
                    <td className="p-3 text-right font-bold text-slate-700">{lot.prixAchatUnitaireOeuf} FCFA</td>
                  </tr>
                ))}
                {stockLots.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">Aucun lot d'œufs enregistré en stock pour le moment.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Losses Table */}
        <div className="glass-panel rounded-2xl border border-slate-200 bg-white p-5 space-y-3 shadow-sm">
          <h3 className="font-extrabold text-slate-900 text-sm flex items-center gap-2 font-display">
            <AlertTriangle className="w-4 h-4 text-red-600" /> Historique des Pertes & Casse
          </h3>
          
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                  <th className="p-3">Date</th>
                  <th className="p-3">Type Perte</th>
                  <th className="p-3 text-center">Œufs Perdus</th>
                  <th className="p-3">Motif / Saisie</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {stockLosses.map(l => (
                  <tr key={l.id} className="hover:bg-slate-50/60">
                    <td className="p-3 text-slate-500 font-medium">{l.date}</td>
                    <td className="p-3">
                      <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                        l.typePerte.includes('Catégorie 1') ? 'bg-amber-100 text-amber-800 border border-amber-300' : 'bg-red-100 text-red-800 border border-red-300'
                      }`}>
                        {l.typePerte}
                      </span>
                    </td>
                    <td className="p-3 text-center font-extrabold text-slate-900">{l.quantiteOeufs.toLocaleString()}</td>
                    <td className="p-3 text-slate-700 font-medium truncate max-w-[140px]">{l.motif}</td>
                  </tr>
                ))}
                {stockLosses.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-slate-400 text-xs">Aucune casse ou perte comptabilisée.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Add Lot */}
      {showAddLotModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Réceptionner un Lot d'Œufs</h3>
            <form onSubmit={handleAddLot} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Poulailler Fournisseur *</label>
                <input 
                  type="text" 
                  required
                  value={poulaillerNom}
                  onChange={(e) => setPoulaillerNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité (ŒUFS) *</label>
                  <input 
                    type="number"
                    required
                    value={quantiteOeufsRecus}
                    onChange={(e) => setQuantiteOeufsRecus(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-amber-700 font-extrabold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Prix Achat/Œuf (FCFA)</label>
                  <input 
                    type="number"
                    required
                    value={prixAchatUnitaireOeuf}
                    onChange={(e) => setPrixAchatUnitaireOeuf(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddLotModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-amber-500 text-white font-extrabold rounded-xl shadow-md">Enregistrer Lot</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Add Loss */}
      {showAddLossModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-red-600 font-display">Déclaration de Perte d'Œufs</h3>
            <form onSubmit={handleAddLoss} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Type de Perte *</label>
                <select 
                  value={typePerte}
                  onChange={(e) => setTypePerte(e.target.value as any)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                >
                  <option value="Catégorie 1 - Fissurés">Catégorie 1 — Fissurés (Revente à prix bas)</option>
                  <option value="Catégorie 2 - Cassés irrécupérables">Catégorie 2 — Cassés irrécupérables (Sortie définitive)</option>
                </select>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Quantité d'Œufs Perdus *</label>
                <input 
                  type="number"
                  required
                  value={quantitePerteOeufs}
                  onChange={(e) => setQuantitePerteOeufs(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-red-600 font-extrabold text-sm"
                />
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Motif de la Perte</label>
                <input 
                  type="text"
                  value={motifPerte}
                  onChange={(e) => setMotifPerte(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddLossModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-red-600 text-white font-extrabold rounded-xl shadow-md">Comptabiliser Perte</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
