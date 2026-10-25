import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { RawMaterialStock, AlveoleProduct, StockMovement } from '../../types';
import { 
  Boxes, PackagePlus, AlertTriangle, CheckCircle2, ArrowDownRight, 
  ArrowUpRight, Layers, Scale, DollarSign, Plus, Search, Filter, Warehouse
} from 'lucide-react';

export const StockAlveolesModule: React.FC = () => {
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const movements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().limit(30).toArray()) || [];

  const [activeTab, setActiveTab] = useState<'PRODUITS_FINIS' | 'MATIERES_PREMIERES'>('PRODUITS_FINIS');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddMPModal, setShowAddMPModal] = useState(false);
  const [showAddPFModal, setShowAddPFModal] = useState(false);

  // Formulaire Réception Matières Premières
  const [newReceptionMP, setNewReceptionMP] = useState<{
    mpId: string;
    quantite: number;
    fournisseur: string;
    prixTotalFCFA: number;
    motif: string;
  }>({
    mpId: rawMaterials[0]?.id || 'mp-occ-01',
    quantite: 5000,
    fournisseur: 'Collecteurs Industriels Dakar & Régions',
    prixTotalFCFA: 400000,
    motif: 'Réception de balles de cartons ondulés OCC'
  });

  // Calculs financiers et volumétriques
  const totalFardeauxStock = products.reduce((sum, p) => sum + p.stockFardeaux, 0);
  const totalUnitesStock = products.reduce((sum, p) => sum + p.stockTotalUnites, 0);
  const valorisationPF = products.reduce((sum, p) => sum + (p.stockTotalUnites * p.prixUnitaireFCFA), 0);

  const totalCartonKg = rawMaterials
    .filter(m => m.categorie === 'PAPIER_CARTON')
    .reduce((sum, m) => sum + m.stockActuel, 0);

  const valorisationMP = rawMaterials.reduce((sum, m) => sum + (m.stockActuel * m.coutMoyenAchatFCFA), 0);

  // Estimation jours d'autonomie (sur base de ~3 200 kg carton/jour pour 2 shifts)
  const joursAutonomieCarton = Math.round(totalCartonKg / 3200);

  // Sauvegarde Réception Matières Premières
  const handleSaveReceptionMP = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMP = rawMaterials.find(m => m.id === newReceptionMP.mpId);
    if (!targetMP) return;

    const qty = Number(newReceptionMP.quantite) || 0;
    const today = new Date().toISOString().split('T')[0];

    // Mettre à jour le stock MP
    await db.rawMaterials.update(targetMP.id, {
      stockActuel: targetMP.stockActuel + qty,
      derniereReception: today
    });

    // Enregistrer le mouvement
    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      date: today,
      type: 'ENTREE_RECEPTION',
      articleType: 'MATIERE_PREMIERE',
      articleId: targetMP.id,
      articleNom: targetMP.nom,
      quantite: qty,
      unite: targetMP.unite,
      coutUnitaire: Math.round(Number(newReceptionMP.prixTotalFCFA) / (qty || 1)),
      responsable: 'Responsable Stock Usine',
      motif: `${newReceptionMP.motif} (${newReceptionMP.fournisseur})`
    };
    await db.stockMovements.add(movement);

    // Ajouter la dépense dans les dépenses usine
    await db.expenses.add({
      id: `exp-${Date.now()}`,
      date: today,
      categorie: 'Matières Premières (Balles Cartons)',
      montant: Number(newReceptionMP.prixTotalFCFA),
      beneficiaire: newReceptionMP.fournisseur,
      description: `Achat et réception de ${qty.toLocaleString()} ${targetMP.unite} de ${targetMP.nom}`,
      comptePaiement: 'Banque Principale',
      enregistrePar: 'Responsable Stock'
    });

    setShowAddMPModal(false);
  };

  const filteredProducts = products.filter(p => 
    p.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredRawMaterials = rawMaterials.filter(m => 
    m.nom.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.reference.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-emerald-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Warehouse className="w-3.5 h-3.5" />
              Entrepôt & Matières Premières
            </span>
            <span className="text-xs text-slate-400">• Gestion Industrielle des Stocks</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestion des Stocks & Approvisionnements
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Suivi des balles de cartons recyclés (OCC), réactifs liants et fardeaux d'alvéoles finies prêtes pour expédition.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setShowAddMPModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <PackagePlus className="w-4 h-4" />
            Réceptionner Balles Carton
          </button>
        </div>
      </div>

      {/* Cartes KPIs Stocks */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Alvéoles en Stock */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alvéoles en Stock (PF)</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Boxes className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{totalUnitesStock.toLocaleString()} <span className="text-sm font-semibold text-slate-500">unités</span></div>
            <p className="text-xs text-indigo-600 font-semibold mt-1">{totalFardeauxStock.toLocaleString()} fardeaux prêts</p>
          </div>
        </div>

        {/* Valorisation Produits Finis */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur Stock Alvéoles</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{valorisationPF.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Au prix de vente usine HT</p>
          </div>
        </div>

        {/* Stock Carton Recyclé */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Carton / Papier OCC</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Scale className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{(totalCartonKg / 1000).toFixed(1)} <span className="text-sm font-semibold text-slate-500">Tonnes</span></div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-semibold text-emerald-600">~{joursAutonomieCarton} jours d'autonomie</span>
            </div>
          </div>
        </div>

        {/* Valeur Matières Premières */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Valeur Matières Premières</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{valorisationMP.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-slate-500 mt-1">Balles carton + Adjuvants</p>
          </div>
        </div>
      </div>

      {/* Onglets de navigation : Produits Finis vs Matières Premières */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('PRODUITS_FINIS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'PRODUITS_FINIS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📦 Produits Finis (Alvéoles & Boîtes) ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('MATIERES_PREMIERES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'MATIERES_PREMIERES'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            ♻️ Matières Premières & Cartons Recyclés ({rawMaterials.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher référence, format..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Vue 1 : Produits Finis (Alvéoles & Boîtes) */}
      {activeTab === 'PRODUITS_FINIS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredProducts.map((p) => {
            const isCritique = p.stockFardeaux <= p.seuilAlerteFardeaux;

            return (
              <div 
                key={p.id}
                className="bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all overflow-hidden flex flex-col justify-between"
              >
                <div className="p-5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {p.reference}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1">{p.nom}</h3>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                      isCritique 
                        ? 'bg-red-100 text-red-700 border border-red-200' 
                        : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    }`}>
                      {isCritique ? 'Stock Critique' : 'En Stock'}
                    </span>
                  </div>

                  {/* Caractéristiques */}
                  <div className="grid grid-cols-2 gap-2 my-4 text-xs bg-slate-50 p-3 rounded-xl">
                    <div>
                      <span className="text-slate-400 block text-[10px]">Capacité</span>
                      <span className="font-bold text-slate-800">{p.capaciteOeufs} Œufs</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Poids Moyen</span>
                      <span className="font-bold text-slate-800">{p.poidsMoyenGrammes} g / unité</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prix Unitaire</span>
                      <span className="font-bold text-emerald-600">{p.prixUnitaireFCFA} FCFA</span>
                    </div>
                    <div>
                      <span className="text-slate-400 block text-[10px]">Prix Fardeau</span>
                      <span className="font-bold text-slate-900">{p.prixFardeauFCFA.toLocaleString()} FCFA</span>
                    </div>
                  </div>

                  {/* Compteurs de Stock */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Fardeaux Disponibles</span>
                      <span className="font-extrabold text-slate-900 text-sm">
                        {p.stockFardeaux} <span className="text-xs font-normal text-slate-500">fard. ({p.quantiteParFardeau} pcs/fard.)</span>
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-slate-500">Total Unités Prêtes</span>
                      <span className="font-extrabold text-indigo-600">
                        {p.stockTotalUnites.toLocaleString()} unités
                      </span>
                    </div>
                    {/* Jauge seuil */}
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                      <div 
                        className={`h-full rounded-full ${isCritique ? 'bg-red-500' : 'bg-emerald-500'}`}
                        style={{ width: `${Math.min(100, (p.stockFardeaux / (p.seuilAlerteFardeaux * 3)) * 100)}%` }}
                      ></div>
                    </div>
                    <div className="flex justify-between text-[10px] text-slate-400">
                      <span>Seuil d'alerte: {p.seuilAlerteFardeaux} fard.</span>
                      <span>Valeur: {(p.stockTotalUnites * p.prixUnitaireFCFA).toLocaleString()} FCFA</span>
                    </div>
                  </div>
                </div>

                <div className="px-5 py-3 bg-slate-50/60 border-t border-slate-100 text-xs flex justify-between items-center">
                  <span className="text-slate-500 text-[11px]">Finition: {p.couleur}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Vue 2 : Matières Premières & Cartons Recyclés */}
      {activeTab === 'MATIERES_PREMIERES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="p-5 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-slate-900">Matières Premières pour Pulpeur & Lignes de Séchage</h3>
              <p className="text-xs text-slate-500">Inventaire en direct des balles de cartons, rouleaux de kraft, amidon et additifs</p>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Référence & Désignation</th>
                  <th className="py-3 px-4">Catégorie</th>
                  <th className="py-3 px-4 text-right">Stock Actuel</th>
                  <th className="py-3 px-4 text-right">Seuil Sécurité</th>
                  <th className="py-3 px-4 text-right">Coût Moyen / Unité</th>
                  <th className="py-3 px-4">Emplacement Usine</th>
                  <th className="py-3 px-4">Fournisseur Principal</th>
                  <th className="py-3 px-4 text-center">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {filteredRawMaterials.map((m) => {
                  const isCritique = m.stockActuel <= m.seuilSecurite;

                  return (
                    <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <span className="font-mono text-[10px] text-slate-500 block">{m.reference}</span>
                        <span className="font-bold text-slate-900">{m.nom}</span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-700">
                          {m.categorie.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {m.stockActuel.toLocaleString()} {m.unite}
                      </td>
                      <td className="py-3.5 px-4 text-right text-slate-500">
                        {m.seuilSecurite.toLocaleString()} {m.unite}
                      </td>
                      <td className="py-3.5 px-4 text-right font-bold text-slate-800">
                        {m.coutMoyenAchatFCFA.toLocaleString()} FCFA
                      </td>
                      <td className="py-3.5 px-4 text-slate-600">
                        {m.emplacementStock}
                      </td>
                      <td className="py-3.5 px-4 text-slate-500">
                        {m.fournisseurPrincipal || '—'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          isCritique 
                            ? 'bg-red-100 text-red-700 border border-red-200' 
                            : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                        }`}>
                          {isCritique ? <AlertTriangle className="w-3.5 h-3.5 text-red-600" /> : <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                          {isCritique ? 'Seuil d\'Alerte' : 'Normal'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Réception Matières Premières */}
      {showAddMPModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <PackagePlus className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Réception Matières Premières</h3>
                  <p className="text-xs text-slate-500">Enregistrement d'une livraison de balles de cartons ou réactifs</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddMPModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReceptionMP} className="mt-4 space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Article Matière Première</label>
                <select
                  value={newReceptionMP.mpId}
                  onChange={e => setNewReceptionMP({ ...newReceptionMP, mpId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500"
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.nom} (en {m.unite})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Quantité Pesée</label>
                  <input
                    type="number"
                    value={newReceptionMP.quantite}
                    onChange={e => setNewReceptionMP({ ...newReceptionMP, quantite: Number(e.target.value) })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Montant Total Facturé (FCFA)</label>
                  <input
                    type="number"
                    value={newReceptionMP.prixTotalFCFA}
                    onChange={e => setNewReceptionMP({ ...newReceptionMP, prixTotalFCFA: Number(e.target.value) })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold text-emerald-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Fournisseur / Collecteur</label>
                <input
                  type="text"
                  value={newReceptionMP.fournisseur}
                  onChange={e => setNewReceptionMP({ ...newReceptionMP, fournisseur: e.target.value })}
                  required
                  placeholder="Ex: Collecteurs de Dakar, Papeterie..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motif / N° Bon de Pesée</label>
                <input
                  type="text"
                  value={newReceptionMP.motif}
                  onChange={e => setNewReceptionMP({ ...newReceptionMP, motif: e.target.value })}
                  placeholder="Ex: Bon de pesée pont-bascule #1289"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddMPModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-lg shadow-md transition-all active:scale-95"
                >
                  Valider la Réception en Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
