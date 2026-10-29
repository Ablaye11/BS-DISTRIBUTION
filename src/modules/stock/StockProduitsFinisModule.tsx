import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { 
  AlveoleProduct, CommercialExitVoucher, CommercialReturnVoucher 
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportStockPdf } from '../../services/pdfExport';
import { 
  PackageCheck, Boxes, Truck, RotateCcw, Plus, Search, 
  DollarSign, CheckCircle2, AlertTriangle, Layers, Calendar, 
  User, ShieldCheck, ArrowRight, CornerDownRight, Check, X, FileText
} from 'lucide-react';

export const StockProduitsFinisModule: React.FC = () => {
  const { currentTheme } = useTheme();

  // ─── Données réactives Dexie ──────────────────────────────────────────────
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const exitVouchers = useLiveQuery(() => db.commercialExitVouchers.orderBy('date').reverse().toArray()) || [];
  const returnVouchers = useLiveQuery(() => db.commercialReturnVouchers.orderBy('date').reverse().toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const shifts = useLiveQuery(() => db.productionShifts.toArray()) || [];

  // ─── Navigation sous-onglets ──────────────────────────────────────────────
  type TabType = 'STOCK_USINE' | 'PAR_COMMERCIAL' | 'RETOURS_INVENDUS' | 'HISTORIQUE_SORTIES';
  const [activeTab, setActiveTab] = useState<TabType>('STOCK_USINE');
  const [searchTerm, setSearchTerm] = useState('');

  // ─── Modals d'actions ─────────────────────────────────────────────────────
  const [showExitModal, setShowExitModal] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [selectedReturnForDecision, setSelectedReturnForDecision] = useState<CommercialReturnVoucher | null>(null);

  // Formulaire Bon de Sortie Commercial
  const [exitForm, setExitForm] = useState({
    commercialId: 'com-01',
    commercialNom: 'Ibrahima Ndiaye',
    produitId: 'prod-alv-30-std',
    produitNom: 'Plateau 30 Œufs Standard (Gris)',
    quantiteLots: 15, // fardeaux de 100
    destinationZone: 'Zone Dakar & Périphérie',
    magasinierNom: 'Modou Faye (Magasinier Usine)',
    vehiculeImmatriculation: 'DK-8942-BC (Fourgon Usine)',
    observations: 'Dotation tournée commerciale du matin'
  });

  // Formulaire Bon de Retour Invendus
  const [returnForm, setReturnForm] = useState({
    commercialId: 'com-01',
    commercialNom: 'Ibrahima Ndiaye',
    produitId: 'prod-alv-30-std',
    produitNom: 'Plateau 30 Œufs Standard (Gris)',
    quantiteLots: 2, // fardeaux
    motif: 'Invendus fin de tournée hebdomadaire',
    decision: 'ACCEPTE_CONFORME' as 'ACCEPTE_CONFORME' | 'ACCEPTE_SOUS_RESERVE' | 'NON_CONFORME_RECYCLE' | 'REFUSE',
    magasinierNom: 'Modou Faye (Magasinier Usine)',
    observations: 'Alvéoles intactes et propres sous film'
  });

  // ─── Calculs Industriels & KPIs ───────────────────────────────────────────
  const totalFardeauxUsine = products.reduce((sum, p) => sum + (p.stockFardeaux || 0), 0);
  const totalAlveolesUsine = products.reduce((sum, p) => sum + (p.stockTotalUnites || 0), 0);
  const valorisationPF = products.reduce((sum, p) => sum + (p.stockTotalUnites * p.prixUnitaireFCFA), 0);

  // Synthèse par commercial
  const commercialsMap: Record<string, { nom: string; lotsSortis: number; lotsRetournes: number; lotsVendus: number; soldeActuelLots: number }> = {};

  exitVouchers.forEach(v => {
    if (!commercialsMap[v.commercialNom]) {
      commercialsMap[v.commercialNom] = { nom: v.commercialNom, lotsSortis: 0, lotsRetournes: 0, lotsVendus: 0, soldeActuelLots: 0 };
    }
    commercialsMap[v.commercialNom].lotsSortis += v.quantiteLots;
  });

  returnVouchers.forEach(r => {
    if (commercialsMap[r.commercialNom]) {
      commercialsMap[r.commercialNom].lotsRetournes += r.quantiteLots;
    }
  });

  invoices.forEach(inv => {
    const com = (inv as any).commercialNom || 'Ibrahima Ndiaye';
    if (commercialsMap[com]) {
      const lotsVendus = inv.articles.reduce((sum, item) => sum + (item.fardeaux || Math.floor((item.quantiteUnites || 0) / 100)), 0);
      commercialsMap[com].lotsVendus += lotsVendus;
    }
  });

  Object.values(commercialsMap).forEach(com => {
    com.soldeActuelLots = Math.max(0, com.lotsSortis - com.lotsRetournes - com.lotsVendus);
  });

  const totalLotsDetenusCommerciaux = Object.values(commercialsMap).reduce((sum, c) => sum + c.soldeActuelLots, 0);

  // Retours en attente
  const retoursEnAttente = returnVouchers.filter(r => r.statut === 'EN_ATTENTE_CONTROLE');

  // ─── Handlers Actions ─────────────────────────────────────────────────────
  const handleCreateExitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === exitForm.produitId) || products[0];
    const quantiteLots = Number(exitForm.quantiteLots);
    const quantiteUnites = quantiteLots * (prod?.quantiteParFardeau || 100);

    if (prod && prod.stockFardeaux < quantiteLots) {
      alert(`Stock insuffisant en magasin : ${prod.stockFardeaux} fardeaux disponibles.`);
      return;
    }

    const todayStr = new Date().toISOString().split('T')[0];
    const voucherId = `BS-${Date.now()}`;
    const voucherNum = `BSC-${todayStr.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;

    const newVoucher: CommercialExitVoucher = {
      id: voucherId,
      numeroBon: voucherNum,
      date: todayStr,
      heure: new Date().toTimeString().slice(0, 5),
      commercialId: exitForm.commercialId,
      commercialNom: exitForm.commercialNom,
      produitId: prod.id,
      produitNom: prod.nom,
      quantiteLots: quantiteLots,
      quantiteUnites: quantiteUnites,
      destinationZone: exitForm.destinationZone,
      magasinierNom: exitForm.magasinierNom,
      vehiculeImmatriculation: exitForm.vehiculeImmatriculation,
      statut: 'VALIDE',
      observations: exitForm.observations
    };

    await db.commercialExitVouchers.add(newVoucher);

    // Décrémenter le stock usine
    if (prod) {
      await db.alveoleProducts.update(prod.id, {
        stockFardeaux: Math.max(0, prod.stockFardeaux - quantiteLots),
        stockTotalUnites: Math.max(0, prod.stockTotalUnites - quantiteUnites)
      });

      await db.stockMovements.add({
        id: `mvt-pf-${Date.now()}`,
        date: todayStr,
        type: 'SORTIE_COMMERCIALE',
        articleType: 'PRODUIT_FINI',
        articleId: prod.id,
        articleNom: prod.nom,
        quantite: quantiteLots,
        unite: 'Fardeau (100)',
        responsable: exitForm.magasinierNom,
        motif: `Sortie commerciale pour ${exitForm.commercialNom} (${voucherNum})`
      });
    }

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: exitForm.magasinierNom,
      userRole: 'RESPONSABLE_STOCK',
      action: 'CREATION_BON_SORTIE_COMMERCIAL',
      entite: 'STOCK',
      description: `Bon de sortie ${voucherNum} validé : ${quantiteLots} fardeaux confiés à ${exitForm.commercialNom}.`
    });

    setShowExitModal(false);
  };

  const handleCreateReturnVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === returnForm.produitId) || products[0];
    const quantiteLots = Number(returnForm.quantiteLots);
    const quantiteUnites = quantiteLots * (prod?.quantiteParFardeau || 100);
    const todayStr = new Date().toISOString().split('T')[0];
    const returnId = `RET-${Date.now()}`;
    const returnNum = `BRC-${todayStr.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`;

    const newReturn: CommercialReturnVoucher = {
      id: returnId,
      numeroRetour: returnNum,
      date: todayStr,
      heure: new Date().toTimeString().slice(0, 5),
      commercialId: returnForm.commercialId,
      commercialNom: returnForm.commercialNom,
      produitId: prod.id,
      produitNom: prod.nom,
      quantiteLots: quantiteLots,
      quantiteUnites: quantiteUnites,
      motif: returnForm.motif,
      decision: returnForm.decision,
      statut: returnForm.decision === 'ACCEPTE_CONFORME' ? 'TRAITE' : 'EN_ATTENTE_CONTROLE',
      magasinierNom: returnForm.magasinierNom,
      observations: returnForm.observations
    };

    await db.commercialReturnVouchers.add(newReturn);

    // Si accepté conforme -> réintégration au stock
    if (returnForm.decision === 'ACCEPTE_CONFORME' && prod) {
      await db.alveoleProducts.update(prod.id, {
        stockFardeaux: prod.stockFardeaux + quantiteLots,
        stockTotalUnites: prod.stockTotalUnites + quantiteUnites
      });

      await db.stockMovements.add({
        id: `mvt-ret-${Date.now()}`,
        date: todayStr,
        type: 'RETOUR_INVENDU_CONFORME',
        articleType: 'PRODUIT_FINI',
        articleId: prod.id,
        articleNom: prod.nom,
        quantite: quantiteLots,
        unite: 'Fardeau (100)',
        responsable: returnForm.magasinierNom,
        motif: `Réintégration invendus conformes de ${returnForm.commercialNom} (${returnNum})`
      });
    }

    setShowReturnModal(false);
  };

  const handleValidateReturnDecision = async (returnVoucher: CommercialReturnVoucher, decision: 'ACCEPTE_CONFORME' | 'NON_CONFORME_RECYCLE') => {
    const prod = products.find(p => p.id === returnVoucher.produitId) || products[0];
    
    await db.commercialReturnVouchers.update(returnVoucher.id, {
      decision: decision,
      statut: 'TRAITE',
      dateTraitement: new Date().toISOString().split('T')[0]
    });

    if (decision === 'ACCEPTE_CONFORME' && prod) {
      await db.alveoleProducts.update(prod.id, {
        stockFardeaux: prod.stockFardeaux + returnVoucher.quantiteLots,
        stockTotalUnites: prod.stockTotalUnites + (returnVoucher.quantiteUnites || (returnVoucher.quantiteLots * 100))
      });
      await db.stockMovements.add({
        id: `mvt-ret-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'RETOUR_INVENDU_CONFORME',
        articleType: 'PRODUIT_FINI',
        articleId: prod.id,
        articleNom: prod.nom,
        quantite: returnVoucher.quantiteLots,
        unite: 'Fardeau (100)',
        responsable: 'Magasinier Usine',
        motif: `Validation retour conforme ${returnVoucher.numeroRetour}`
      });
    } else if (decision === 'NON_CONFORME_RECYCLE') {
      // Rebut recyclé au pulpeur
      await db.stockMovements.add({
        id: `mvt-ret-rebut-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        type: 'AJUSTEMENT_INVENTAIRE',
        articleType: 'PRODUIT_FINI',
        articleId: prod?.id || 'prod-alv-30-std',
        articleNom: prod?.nom || 'Plateau 30 Œufs',
        quantite: returnVoucher.quantiteLots,
        unite: 'Fardeau (100)',
        responsable: 'Contrôleur Qualité',
        motif: `Déclassement retour ${returnVoucher.numeroRetour} vers pulpeur recyclage`
      });
    }

    setSelectedReturnForDecision(null);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ── Header ──────────────────────────────────────────────────────── */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex items-center gap-4">
          <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white shadow-md">
            <PackageCheck className="w-7 h-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                Stock Produits Finis Usine
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-black bg-indigo-50 text-indigo-700 border border-indigo-200">
                Alvéoles 30 Œufs
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Gestion du magasin central • Fardeaux ficelés (100 unités) • Dotations et retours commerciaux
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setShowReturnModal(true)}
            className="px-3.5 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center gap-1.5 transition-colors"
          >
            <RotateCcw className="w-4 h-4 text-purple-600" />
            Réceptionner Retour Invendus
          </button>

          <button
            onClick={() => setShowExitModal(true)}
            className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouveau Bon de Sortie Commercial
          </button>
        </div>
      </div>

      {/* ── 4 Cartouches Synthèse Industrielle ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Stock Usine */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Stock Magasin Usine
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {totalFardeauxUsine.toLocaleString()} <span className="text-xs font-bold text-slate-500">fardeaux</span>
            </div>
            <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
              = {totalAlveolesUsine.toLocaleString()} alvéoles prêtes
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
            <Boxes className="w-6 h-6" />
          </div>
        </div>

        {/* Stock Détenu par les Commerciaux */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Confié aux Commerciaux
            </span>
            <div className="text-2xl font-black text-indigo-700 mt-1">
              {totalLotsDetenusCommerciaux.toLocaleString()} <span className="text-xs font-bold text-slate-500">fardeaux</span>
            </div>
            <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">
              En camionnettes / tournées ({totalLotsDetenusCommerciaux * 100} alv.)
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
            <Truck className="w-6 h-6" />
          </div>
        </div>

        {/* Retours Invendus en Contrôle */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Retours en Contrôle
            </span>
            <div className="text-2xl font-black text-amber-600 mt-1">
              {retoursEnAttente.reduce((s, r) => s + r.quantiteLots, 0)} <span className="text-xs font-bold text-slate-500">fardeaux</span>
            </div>
            <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
              {retoursEnAttente.length} bon(s) en attente d'agrément
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-amber-50 text-amber-600">
            <RotateCcw className="w-6 h-6" />
          </div>
        </div>

        {/* Valorisation Financière du Stock */}
        <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
          <div>
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Valorisation Stock Magasin
            </span>
            <div className="text-2xl font-black text-slate-900 mt-1">
              {valorisationPF.toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span>
            </div>
            <span className="text-[11px] text-slate-500 font-semibold block mt-0.5">
              Prix unitaire catalogue : ~37 FCFA/alvéole
            </span>
          </div>
          <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
            <DollarSign className="w-6 h-6" />
          </div>
        </div>

      </div>

      {/* ── Navigation sous-onglets ─────────────────────────────────────── */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto">
        <button
          onClick={() => setActiveTab('STOCK_USINE')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'STOCK_USINE'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          Stock Usine par Format ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('PAR_COMMERCIAL')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'PAR_COMMERCIAL'
              ? 'bg-indigo-600 text-white shadow-md'
              : 'bg-indigo-50 text-indigo-900 hover:bg-indigo-100 border border-indigo-200'
          }`}
        >
          <Truck className="w-4 h-4" />
          Détail Confié par Commercial ({Object.keys(commercialsMap).length})
        </button>

        <button
          onClick={() => setActiveTab('RETOURS_INVENDUS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'RETOURS_INVENDUS'
              ? 'bg-purple-600 text-white shadow-md'
              : 'bg-purple-50 text-purple-900 hover:bg-purple-100 border border-purple-200'
          }`}
        >
          <RotateCcw className="w-4 h-4" />
          Retours Invendus & Contrôle ({returnVouchers.length})
          {retoursEnAttente.length > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black">
              {retoursEnAttente.length}
            </span>
          )}
        </button>

        <button
          onClick={() => setActiveTab('HISTORIQUE_SORTIES')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all flex items-center gap-2 shrink-0 ${
            activeTab === 'HISTORIQUE_SORTIES'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <FileText className="w-4 h-4" />
          Bons de Sortie Commerciaux ({exitVouchers.length})
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU 1 : STOCK USINE PAR FORMAT
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'STOCK_USINE' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Catalogue des Produits Finis & État du Magasin</h3>
                <p className="text-xs text-slate-500">Unité de base : Fardeau de 100 alvéoles ficelé sous film</p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Réf & Format</th>
                    <th className="py-3 px-4">Désignation</th>
                    <th className="py-3 px-4 text-center">Fardeaux Disponibles</th>
                    <th className="py-3 px-4 text-center">Total Alvéoles</th>
                    <th className="py-3 px-4 text-right">Prix Unitaire</th>
                    <th className="py-3 px-4 text-right">Valeur Stock</th>
                    <th className="py-3 px-5 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {products.map(p => {
                    const valeur = p.stockTotalUnites * p.prixUnitaireFCFA;
                    return (
                      <tr key={p.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 font-mono">{p.reference}</span>
                          <div className="text-[10px] text-slate-400">30 Œufs</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {p.nom}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-indigo-700 text-sm">
                          {p.stockFardeaux} fardeaux
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                          {p.stockTotalUnites.toLocaleString()} alv.
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          {p.prixUnitaireFCFA} FCFA / alv
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                          {valeur.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            p.stockFardeaux >= 50
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.stockFardeaux > 10
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {p.stockFardeaux >= 50 ? '✓ DISPONIBLE' : p.stockFardeaux > 10 ? '⚠️ SEUIL BAS' : '🔴 RUPTURE'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU 2 : DÉTAIL PAR COMMERCIAL
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PAR_COMMERCIAL' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">Situation des Stocks Détenus par Commercial</h3>
              <p className="text-xs text-slate-500">Lots sortis usine − Lots vendus facturés − Retours invendus enregistrés = Solde restant en camionnette</p>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Commercial</th>
                    <th className="py-3 px-4 text-center">Lots Sortis (Dotations)</th>
                    <th className="py-3 px-4 text-center">Lots Facturés / Vendus</th>
                    <th className="py-3 px-4 text-center">Lots Retournés Usine</th>
                    <th className="py-3 px-4 text-center">Solde Détenu Actuel</th>
                    <th className="py-3 px-4 text-right">Valeur Détenue (FCFA)</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {Object.values(commercialsMap).length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun mouvement commercial enregistré.
                      </td>
                    </tr>
                  ) : (
                    Object.values(commercialsMap).map(c => {
                      const valeurDetenue = c.soldeActuelLots * 100 * 37;
                      return (
                        <tr key={c.nom} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-5">
                            <div className="font-bold text-slate-900 flex items-center gap-2">
                              <User className="w-4 h-4 text-indigo-600" />
                              {c.nom}
                            </div>
                            <span className="text-[10px] text-slate-400">Commercial Terrain</span>
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                            {c.lotsSortis} fardeaux
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-emerald-700">
                            {c.lotsVendus} fardeaux
                          </td>
                          <td className="py-3.5 px-4 text-center font-bold text-purple-700">
                            {c.lotsRetournes} fardeaux
                          </td>
                          <td className="py-3.5 px-4 text-center">
                            <span className="px-3 py-1 rounded-full text-xs font-black bg-indigo-100 text-indigo-800">
                              {c.soldeActuelLots} fardeaux ({c.soldeActuelLots * 100} alv.)
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-black text-slate-900">
                            {valeurDetenue.toLocaleString()} FCFA
                          </td>
                          <td className="py-3.5 px-5 text-center">
                            <button
                              onClick={() => {
                                setReturnForm(prev => ({ ...prev, commercialNom: c.nom }));
                                setShowReturnModal(true);
                              }}
                              className="px-3 py-1.5 rounded-xl bg-purple-50 text-purple-700 hover:bg-purple-100 font-bold text-[11px] border border-purple-200 transition-colors"
                            >
                              Retour Invendus →
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU 3 : RETOURS INVENDUS & CONTRÔLE QUALITÉ
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'RETOURS_INVENDUS' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Journal des Retours d'Invendus Commerciaux</h3>
                <p className="text-xs text-slate-500">Inspection visuelle obligatoire avant réintégration au stock ou déclassement vers le pulpeur</p>
              </div>
              <button
                onClick={() => setShowReturnModal(true)}
                className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau Bon de Retour
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">N° Bon & Date</th>
                    <th className="py-3 px-4">Commercial</th>
                    <th className="py-3 px-4">Produit & Quantité</th>
                    <th className="py-3 px-4">Motif Déclaré</th>
                    <th className="py-3 px-4 text-center">Décision Qualité</th>
                    <th className="py-3 px-4 text-center">Statut Traitement</th>
                    <th className="py-3 px-5 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {returnVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun retour d'invendu enregistré.
                      </td>
                    </tr>
                  ) : (
                    returnVouchers.map(r => (
                      <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 font-mono">{r.numeroRetour}</span>
                          <div className="text-[10px] text-slate-400">{r.date} à {r.heure}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {r.commercialNom}
                        </td>
                        <td className="py-3.5 px-4">
                          <div className="font-bold text-slate-900">{r.quantiteLots} fardeaux</div>
                          <div className="text-[10px] text-slate-400">{r.quantiteUnites} alvéoles ({r.produitNom})</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600 max-w-[200px] truncate">
                          {r.motif}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            r.decision === 'ACCEPTE_CONFORME'
                              ? 'bg-emerald-100 text-emerald-800'
                              : r.decision === 'NON_CONFORME_RECYCLE'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.decision === 'ACCEPTE_CONFORME' ? '✓ RÉINTÉGRÉ STOCK' :
                             r.decision === 'NON_CONFORME_RECYCLE' ? '♻️ DÉCLASSÉ PULPEUR' : '⏳ EN ATTENTE'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            r.statut === 'TRAITE' ? 'bg-slate-100 text-slate-700' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {r.statut}
                          </span>
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          {r.statut === 'EN_ATTENTE_CONTROLE' ? (
                            <div className="flex items-center justify-center gap-1">
                              <button
                                onClick={() => handleValidateReturnDecision(r, 'ACCEPTE_CONFORME')}
                                className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold"
                                title="Accepter et réintégrer au stock"
                              >
                                ✓ Conforme
                              </button>
                              <button
                                onClick={() => handleValidateReturnDecision(r, 'NON_CONFORME_RECYCLE')}
                                className="px-2 py-1 bg-red-600 hover:bg-red-500 text-white rounded text-[10px] font-bold"
                                title="Rebuter et renvoyer au pulpeur"
                              >
                                ♻️ Rebut
                              </button>
                            </div>
                          ) : (
                            <span className="text-[10px] text-slate-400">Traité</span>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU 4 : HISTORIQUE DES BONS DE SORTIE COMMERCIAUX
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'HISTORIQUE_SORTIES' && (
        <div className="space-y-4">
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">Bons de Sortie Commerciaux Délivrés</h3>
                <p className="text-xs text-slate-500">Décharge signée pour chaque camionnette partant en tournée</p>
              </div>
              <button
                onClick={() => setShowExitModal(true)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouveau Bon de Sortie
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">N° Bon & Date</th>
                    <th className="py-3 px-4">Commercial Bénéficiaire</th>
                    <th className="py-3 px-4">Quantité Délivrée</th>
                    <th className="py-3 px-4">Véhicule / Zone</th>
                    <th className="py-3 px-4">Magasinier</th>
                    <th className="py-3 px-4 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {exitVouchers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400">
                        Aucun bon de sortie commercial enregistré.
                      </td>
                    </tr>
                  ) : (
                    exitVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 font-mono">{v.numeroBon}</span>
                          <div className="text-[10px] text-slate-400">{v.date} à {v.heure}</div>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {v.commercialNom}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-black text-indigo-700 text-sm">{v.quantiteLots} fardeaux</span>
                          <div className="text-[10px] text-slate-400">= {v.quantiteUnites} alvéoles</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          <div>{v.destinationZone}</div>
                          <div className="text-[10px] text-slate-400">{v.vehiculeImmatriculation}</div>
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {v.magasinierNom}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                            ✓ {v.statut}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* ── MODAL 1 : NOUVEAU BON DE SORTIE COMMERCIAL ────────────────────── */}
      {showExitModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white font-black">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Bon de Sortie Produits Finis</h3>
                  <p className="text-xs text-slate-500">Dotation pour tournée commerciale</p>
                </div>
              </div>
              <button onClick={() => setShowExitModal(false)} className="text-slate-400 p-2">✕</button>
            </div>

            <form onSubmit={handleCreateExitVoucher} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Commercial Destinataire</label>
                <select
                  value={exitForm.commercialNom}
                  onChange={e => setExitForm({ ...exitForm, commercialNom: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="Ibrahima Ndiaye">Ibrahima Ndiaye (Dakar & Banlieue)</option>
                  <option value="Fatou Sow">Fatou Sow (Thiès & Mbour)</option>
                  <option value="Cheikh Diop">Cheikh Diop (Zones Avicoles Niayes)</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Produit</label>
                  <select
                    value={exitForm.produitId}
                    onChange={e => setExitForm({ ...exitForm, produitId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nom} ({p.stockFardeaux} dispo)</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité (Fardeaux de 100)</label>
                  <input
                    type="number"
                    min="1"
                    max="500"
                    value={exitForm.quantiteLots}
                    onChange={e => setExitForm({ ...exitForm, quantiteLots: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                  <span className="text-[10px] text-indigo-600 block mt-0.5">
                    = {exitForm.quantiteLots * 100} alvéoles
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Zone de Destination</label>
                  <input
                    type="text"
                    value={exitForm.destinationZone}
                    onChange={e => setExitForm({ ...exitForm, destinationZone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Véhicule Utilisé</label>
                  <input
                    type="text"
                    value={exitForm.vehiculeImmatriculation}
                    onChange={e => setExitForm({ ...exitForm, vehiculeImmatriculation: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Magasinier Délivrant</label>
                <input
                  type="text"
                  value={exitForm.magasinierNom}
                  onChange={e => setExitForm({ ...exitForm, magasinierNom: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowExitModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Valider & Déduire du Stock
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── MODAL 2 : NOUVEAU BON DE RETOUR INVENDUS ─────────────────────── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-purple-600 text-white font-black">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Bon de Retour Invendus Commercial</h3>
                  <p className="text-xs text-slate-500">Réintégration en magasin après inspection</p>
                </div>
              </div>
              <button onClick={() => setShowReturnModal(false)} className="text-slate-400 p-2">✕</button>
            </div>

            <form onSubmit={handleCreateReturnVoucher} className="mt-4 space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Commercial Émetteur</label>
                <select
                  value={returnForm.commercialNom}
                  onChange={e => setReturnForm({ ...returnForm, commercialNom: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="Ibrahima Ndiaye">Ibrahima Ndiaye</option>
                  <option value="Fatou Sow">Fatou Sow</option>
                  <option value="Cheikh Diop">Cheikh Diop</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Produit Retourné</label>
                  <select
                    value={returnForm.produitId}
                    onChange={e => setReturnForm({ ...returnForm, produitId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité (Fardeaux)</label>
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={returnForm.quantiteLots}
                    onChange={e => setReturnForm({ ...returnForm, quantiteLots: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                  <span className="text-[10px] text-purple-600 block mt-0.5">
                    = {returnForm.quantiteLots * 100} alvéoles
                  </span>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Décision Qualité Immédiate</label>
                <select
                  value={returnForm.decision}
                  onChange={e => setReturnForm({ ...returnForm, decision: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="ACCEPTE_CONFORME">✓ Conforme & Intact (Réintégration immédiate en stock)</option>
                  <option value="ACCEPTE_SOUS_RESERVE">⏳ En attente de contrôle qualité approfondi</option>
                  <option value="NON_CONFORME_RECYCLE">♻️ Non conforme / Déformé (Déclassement vers pulpeur)</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif du Retour</label>
                <input
                  type="text"
                  value={returnForm.motif}
                  onChange={e => setReturnForm({ ...returnForm, motif: e.target.value })}
                  placeholder="Ex: Invendus de fin de journée, alvéoles intactes"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  required
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowReturnModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs shadow-md"
                >
                  Enregistrer le Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
