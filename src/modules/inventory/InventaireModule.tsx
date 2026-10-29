import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { InventorySession, InventoryFrequency, InventoryItemResult } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportInventairePdf } from '../../services/pdfExport';
import {
  ClipboardCheck, Calendar, TrendingUp, AlertTriangle, CheckCircle2,
  Plus, Search, Filter, Eye, ArrowUpRight, ArrowDownRight,
  Package, Boxes, BarChart3, Scale, Clock, X, Check
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, Legend, LineChart, Line
} from 'recharts';

export const InventaireModule: React.FC = () => {
  const { currentTheme } = useTheme();

  const sessions = useLiveQuery(() => db.inventorySessions.orderBy('date').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];

  const [filterFreq, setFilterFreq] = useState<'TOUS' | 'HEBDOMADAIRE' | 'MENSUEL'>('TOUS');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSession, setSelectedSession] = useState<InventorySession | null>(null);
  const [showNewModal, setShowNewModal] = useState(false);

  // Formulaire Nouvel Inventaire
  const [newFreq, setNewFreq] = useState<InventoryFrequency>('HEBDOMADAIRE');
  const [newTitre, setNewTitre] = useState(`Inventaire Hebdomadaire S${Math.ceil(new Date().getDate() / 7)} - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`);

  const [newResponsable, setNewResponsable] = useState('Modou Faye (Resp. Stock)');
  const [newSuperviseur, setNewSuperviseur] = useState('Amadou Bâ (Resp. Production)');
  const [newNotes, setNewNotes] = useState('');

  // Saisie physique des articles
  const [countedItems, setCountedItems] = useState<Record<string, { physique: number; motif: string }>>({});

  const handleOpenNewModal = () => {
    // Initialise les valeurs physiques avec le théorique par défaut
    const initialCounts: Record<string, { physique: number; motif: string }> = {};
    rawMaterials.forEach(m => {
      initialCounts[m.id] = { physique: m.stockActuel, motif: '' };
    });
    products.forEach(p => {
      initialCounts[p.id] = { physique: p.stockFardeaux, motif: '' };
    });
    setCountedItems(initialCounts);
    setShowNewModal(true);
  };

  const handleSaveInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];

    const items: InventoryItemResult[] = [];
    let netEcartFCFA = 0;
    let articlesConformes = 0;
    let articlesEnEcart = 0;

    // Traiter les matières premières
    rawMaterials.forEach(m => {
      const counted = countedItems[m.id]?.physique ?? m.stockActuel;
      const motif = countedItems[m.id]?.motif ?? '';
      const ecart = counted - m.stockActuel;
      const ecartVal = ecart * m.coutMoyenAchatFCFA;
      netEcartFCFA += ecartVal;

      if (ecart === 0) articlesConformes++;
      else articlesEnEcart++;

      items.push({
        articleId: m.id,
        articleNom: m.nom,
        articleType: 'MATIERE_PREMIERE',
        unite: m.unite,
        stockTheorique: m.stockActuel,
        stockPhysique: counted,
        ecartQuantite: ecart,
        valeurUnitaireFCFA: m.coutMoyenAchatFCFA,
        ecartValeurFCFA: ecartVal,
        statut: ecart === 0 ? 'CONFORME' : ecart > 0 ? 'SURPLUS' : 'DEFICIT',
        justification: motif
      });
    });

    // Traiter les produits finis (en fardeaux)
    products.forEach(p => {
      const counted = countedItems[p.id]?.physique ?? p.stockFardeaux;
      const motif = countedItems[p.id]?.motif ?? '';
      const ecart = counted - p.stockFardeaux;
      const ecartVal = ecart * p.prixFardeauFCFA;
      netEcartFCFA += ecartVal;

      if (ecart === 0) articlesConformes++;
      else articlesEnEcart++;

      items.push({
        articleId: p.id,
        articleNom: p.nom,
        articleType: 'PRODUIT_FINI',
        unite: 'Fardeaux',
        stockTheorique: p.stockFardeaux,
        stockPhysique: counted,
        ecartQuantite: ecart,
        valeurUnitaireFCFA: p.prixFardeauFCFA,
        ecartValeurFCFA: ecartVal,
        statut: ecart === 0 ? 'CONFORME' : ecart > 0 ? 'SURPLUS' : 'DEFICIT',
        justification: motif
      });
    });

    const newSession: InventorySession = {
      id: `inv-${Date.now()}`,
      date: today,
      frequence: newFreq,
      titre: newTitre,
      responsable: newResponsable,
      supervisePar: newSuperviseur,
      totalArticles: items.length,
      articlesConformes,
      articlesEnEcart,
      valeurEcartNetFCFA: netEcartFCFA,
      statutValidation: 'VALIDE',
      notes: newNotes,
      articles: items
    };

    await db.inventorySessions.add(newSession);

    // Notification système
    await db.notifications.add({
      id: `notif-${Date.now()}`,
      type: 'stock',
      title: `Nouvel Inventaire ${newFreq} Enregistré`,
      message: `${newTitre} validé avec ${articlesConformes}/${items.length} articles conformes. Écart net : ${netEcartFCFA.toLocaleString()} FCFA.`,
      date: today,
      isRead: false
    });

    setShowNewModal(false);
  };

  // Filtrage
  const filteredSessions = sessions.filter(s => {
    const matchFreq = filterFreq === 'TOUS' || s.frequence === filterFreq;
    const matchSearch = s.titre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.responsable.toLowerCase().includes(searchTerm.toLowerCase());
    return matchFreq && matchSearch;
  });

  // Métriques globales
  const totalSessions = sessions.length;
  const totalConformesArticles = sessions.reduce((sum, s) => sum + s.articlesConformes, 0);
  const totalArticlesInventories = sessions.reduce((sum, s) => sum + s.totalArticles, 0);
  const tauxConformite = totalArticlesInventories > 0
    ? Math.round((totalConformesArticles / totalArticlesInventories) * 100)
    : 98;

  const totalEcartNetCumule = sessions.reduce((sum, s) => sum + s.valeurEcartNetFCFA, 0);

  // Données Graphiques Recharts
  const chartEcartsParSession = [...sessions].reverse().map(s => ({
    nom: s.frequence === 'HEBDOMADAIRE' ? `Hebdo ${s.date.slice(5)}` : `Mensuel ${s.date.slice(0, 7)}`,
    conforme: s.articlesConformes,
    ecart: s.articlesEnEcart,
    valeurEcartFCFA: s.valeurEcartNetFCFA
  }));

  // Graphique de comparaison Théorique vs Physique (dernière session)
  const lastSession = sessions[0];
  const chartComparatifArticles = lastSession ? lastSession.articles.map(a => ({
    nom: a.articleNom.length > 18 ? a.articleNom.slice(0, 16) + '…' : a.articleNom,
    theorique: a.stockTheorique,
    physique: a.stockPhysique,
    ecart: a.ecartQuantite,
    unite: a.unite
  })) : [];

  return (
    <div className="space-y-6">
      {/* ─── En-tête du Module Inventaires ────────────────────────────── */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-7 rounded-3xl text-white shadow-xl border border-slate-800 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1.5">
                <ClipboardCheck className="w-3.5 h-3.5 text-blue-400" />
                Audits Physiques & Rapprochements
              </span>
              <span className="text-xs text-slate-400">Contrôle Hebdomadaire & Mensuel</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">
              État des Inventaires & Écarts de Stocks
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 max-w-2xl">
              Rapprochement du stock physique constaté face au stock théorique (cartons OCC et fardeaux d'alvéoles), analyse des écarts et certification d'inventaire.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            <ExportPdfButton onExport={() => exportInventairePdf(currentTheme.hex, lastSession?.titre)} />
            <button
              onClick={handleOpenNewModal}
              className={`px-4 py-2.5 rounded-xl bg-gradient-to-r ${currentTheme.gradient} text-white font-bold text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2`}
            >
              <Plus className="w-4 h-4" />
              Réaliser un Inventaire
            </button>
          </div>
        </div>
      </div>

      {/* ─── Cartes KPIs d'Inventaire ──────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Taux de Conformité</span>
            <span className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{tauxConformite}%</div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">Concordance physique / théorique</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Écart Net Global</span>
            <span className={`p-2 rounded-xl ${totalEcartNetCumule < 0 ? 'bg-rose-50 text-rose-600' : 'bg-emerald-50 text-emerald-600'}`}>
              <Scale className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className={`text-2xl font-black ${totalEcartNetCumule < 0 ? 'text-rose-600' : 'text-slate-900'}`}>
              {totalEcartNetCumule.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span>
            </div>
            <p className="text-xs text-slate-500 mt-1">Sur l'ensemble des sessions</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Sessions Réalisées</span>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <Calendar className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{totalSessions}</div>
            <p className="text-xs text-indigo-600 font-semibold mt-1">
              {sessions.filter(s => s.frequence === 'HEBDOMADAIRE').length} hebdos · {sessions.filter(s => s.frequence === 'MENSUEL').length} mensuels
            </p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Dernière Clôture</span>
            <span className="p-2 rounded-xl bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-base font-black text-slate-900 truncate">
              {lastSession?.titre.slice(0, 26) || 'Aucun inventaire'}…
            </div>
            <p className="text-xs text-slate-500 mt-1">Le {lastSession?.date || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* ─── Représentations Graphiques Recharts ───────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Graphique 1 : Articles Conformes vs Écarts */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Rapprochement par Session</h2>
              <p className="text-xs text-slate-500">Articles 100% conformes vs articles avec écart</p>
            </div>
            <span className="p-2 rounded-xl bg-blue-50 text-blue-600">
              <BarChart3 className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartEcartsParSession} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nom" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="conforme" name="Articles Conformes" fill="#10B981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="ecart" name="Articles en Écart" fill="#F59E0B" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Graphique 2 : Comparatif Théorique vs Physique Dernier Inventaire */}
        <div className="bg-white rounded-3xl p-6 border border-slate-200/90 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-black text-slate-900">Comptage Physique vs Théorique</h2>
              <p className="text-xs text-slate-500">Dernier inventaire certifié ({lastSession?.date})</p>
            </div>
            <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600">
              <TrendingUp className="w-4 h-4" />
            </span>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartComparatifArticles} margin={{ top: 10, right: 10, left: -10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="nom" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#1e293b', borderRadius: '12px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="theorique" name="Stock Théorique" fill="#64748B" radius={[4, 4, 0, 0]} />
                <Bar dataKey="physique" name="Stock Physique" fill="#2563EB" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ─── Liste des Sessions d'Inventaire ───────────────────────────── */}
      <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
        {/* Barre d'outils et filtres */}
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded-2xl w-fit">
            {(['TOUS', 'HEBDOMADAIRE', 'MENSUEL'] as const).map(freq => (
              <button
                key={freq}
                onClick={() => setFilterFreq(freq)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  filterFreq === freq
                    ? 'bg-white text-slate-900 shadow-sm'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {freq === 'TOUS' ? 'Tous les Inventaires' : freq === 'HEBDOMADAIRE' ? '📅 Hebdomadaires' : '📆 Mensuels'}
              </button>
            ))}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Rechercher inventaire…"
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* Table des sessions — Dual View Mobile / Desktop */}

        {/* 1. VUE MOBILE EN CARTES (sm:hidden) */}
        <div className="sm:hidden divide-y divide-slate-100">
          {filteredSessions.length === 0 ? (
            <p className="py-10 text-center text-slate-400 text-xs">
              Aucun inventaire trouvé correspondant aux filtres.
            </p>
          ) : (
            filteredSessions.map(session => (
              <div key={session.id} className="p-4 space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900 text-sm">{session.titre}</div>
                    <div className="text-[10px] text-slate-400 mt-0.5">{session.date} • {session.responsable}</div>
                  </div>
                  <span className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0 ${
                    session.frequence === 'HEBDOMADAIRE' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                  }`}>
                    {session.frequence}
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[9px] text-slate-400 uppercase font-medium block">Conformité</span>
                    <span className="font-bold text-emerald-600">{session.articlesConformes}</span>
                    <span className="text-slate-400"> / {session.totalArticles}</span>
                    {session.articlesEnEcart > 0 && (
                      <span className="text-[10px] text-amber-600 font-semibold block">
                        {session.articlesEnEcart} écart{session.articlesEnEcart > 1 ? 's' : ''}
                      </span>
                    )}
                  </div>
                  <div className="bg-slate-50 rounded-xl p-2.5">
                    <span className="text-[9px] text-slate-400 uppercase font-medium block">Écart Net</span>
                    <span className={`font-bold ${session.valeurEcartNetFCFA < 0 ? 'text-rose-600' : session.valeurEcartNetFCFA > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                      {session.valeurEcartNetFCFA > 0 ? '+' : ''}{session.valeurEcartNetFCFA.toLocaleString()} F
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedSession(session)}
                  className="w-full py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Eye className="w-3.5 h-3.5" />
                  Voir le Détail
                </button>
              </div>
            ))
          )}
        </div>

        {/* 2. VUE BUREAU / TABLETTE (hidden sm:block) */}
        <div className="hidden sm:block overflow-x-auto">
          <table className="w-full text-left text-xs min-w-[700px]">
            <thead className="bg-slate-50/80 text-slate-500 border-b border-slate-100 uppercase tracking-wider font-semibold">
              <tr>
                <th className="py-3.5 px-5">Date & Périodicité</th>
                <th className="py-3.5 px-4">Titre de l'Inventaire</th>
                <th className="py-3.5 px-4">Responsable</th>
                <th className="py-3.5 px-4 text-center">Conformité</th>
                <th className="py-3.5 px-4 text-right">Écart Net (FCFA)</th>
                <th className="py-3.5 px-4 text-center">Statut</th>
                <th className="py-3.5 px-5 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
              {filteredSessions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    Aucun inventaire trouvé correspondant aux filtres.
                  </td>
                </tr>
              ) : (
                filteredSessions.map(session => (
                  <tr key={session.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5">
                      <div className="font-bold text-slate-900">{session.date}</div>
                      <span className={`inline-block mt-0.5 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        session.frequence === 'HEBDOMADAIRE'
                          ? 'bg-blue-100 text-blue-700'
                          : 'bg-purple-100 text-purple-700'
                      }`}>
                        {session.frequence}
                      </span>
                    </td>
                    <td className="py-4 px-4 font-bold text-slate-900 max-w-xs truncate">
                      {session.titre}
                      {session.notes && (
                        <div className="text-[11px] font-normal text-slate-500 truncate mt-0.5">
                          {session.notes}
                        </div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-slate-600">
                      <div>{session.responsable}</div>
                      {session.supervisePar && (
                        <div className="text-[10px] text-slate-400">Sup : {session.supervisePar}</div>
                      )}
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="font-bold text-emerald-600">{session.articlesConformes}</span>
                      <span className="text-slate-400"> / {session.totalArticles}</span>
                      {session.articlesEnEcart > 0 && (
                        <span className="ml-1 text-[11px] text-amber-600 font-semibold">
                          ({session.articlesEnEcart} écart{session.articlesEnEcart > 1 ? 's' : ''})
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-4 text-right">
                      <span className={`font-bold ${session.valeurEcartNetFCFA < 0 ? 'text-rose-600' : session.valeurEcartNetFCFA > 0 ? 'text-emerald-600' : 'text-slate-600'}`}>
                        {session.valeurEcartNetFCFA > 0 ? '+' : ''}{session.valeurEcartNetFCFA.toLocaleString()} FCFA
                      </span>
                    </td>
                    <td className="py-4 px-4 text-center">
                      <span className="px-2.5 py-1 rounded-full text-[11px] font-bold bg-emerald-100 text-emerald-700 inline-flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Validé
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <button
                        onClick={() => setSelectedSession(session)}
                        className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        Détail
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Modal Détail d'une Session d'Inventaire ────────────────────── */}
      {selectedSession && (
        <div className="fixed inset-0 z-[250] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85dvh] sm:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200">
            {/* Header modal */}
            <div className={`bg-gradient-to-r ${currentTheme.gradient} p-5 text-white flex items-center justify-between`}>
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  {selectedSession.frequence}
                </span>
                <h3 className="text-lg font-black mt-1">{selectedSession.titre}</h3>
                <div className="text-xs text-white/80">Date : {selectedSession.date} · Responsable : {selectedSession.responsable}</div>
              </div>
              <button
                onClick={() => setSelectedSession(null)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Corps modal : tableau des articles */}
            <div className="p-6 overflow-y-auto space-y-4 flex-1">
              {selectedSession.notes && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-2xl text-xs text-blue-900">
                  <span className="font-bold">Observations :</span> {selectedSession.notes}
                </div>
              )}

              <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full min-w-[600px] text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-2.5 px-3">Article</th>
                      <th className="py-2.5 px-3">Unité</th>
                      <th className="py-2.5 px-3 text-right">Théorique</th>
                      <th className="py-2.5 px-3 text-right">Physique</th>
                      <th className="py-2.5 px-3 text-center">Écart Qté</th>
                      <th className="py-2.5 px-3 text-right">Écart FCFA</th>
                      <th className="py-2.5 px-3">Motif / Justification</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {selectedSession.articles.map((item, idx) => (
                      <tr key={idx} className={item.ecartQuantite !== 0 ? 'bg-amber-50/40' : ''}>
                        <td className="py-2.5 px-3 font-bold text-slate-900">{item.articleNom}</td>
                        <td className="py-2.5 px-3 text-slate-500">{item.unite}</td>
                        <td className="py-2.5 px-3 text-right font-medium">{item.stockTheorique.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-right font-bold text-slate-900">{item.stockPhysique.toLocaleString()}</td>
                        <td className="py-2.5 px-3 text-center font-bold">
                          <span className={item.ecartQuantite === 0 ? 'text-emerald-600' : item.ecartQuantite > 0 ? 'text-blue-600' : 'text-rose-600'}>
                            {item.ecartQuantite > 0 ? `+${item.ecartQuantite}` : item.ecartQuantite}
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-right font-bold">
                          <span className={item.ecartValeurFCFA === 0 ? 'text-slate-500' : item.ecartValeurFCFA > 0 ? 'text-emerald-600' : 'text-rose-600'}>
                            {item.ecartValeurFCFA > 0 ? '+' : ''}{item.ecartValeurFCFA.toLocaleString()} F
                          </span>
                        </td>
                        <td className="py-2.5 px-3 text-[11px] text-slate-500 italic">
                          {item.justification || '—'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-3 pb-5 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 z-20 mt-auto">
              <div className="text-xs text-center sm:text-left">
                <span className="font-bold text-slate-700">Écart net total : </span>
                <span className={`font-black ${selectedSession.valeurEcartNetFCFA < 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                  {selectedSession.valeurEcartNetFCFA > 0 ? '+' : ''}{selectedSession.valeurEcartNetFCFA.toLocaleString()} FCFA
                </span>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                <ExportPdfButton
                  onExport={() => exportInventairePdf(currentTheme.hex, selectedSession.titre, selectedSession.articles.map(a => ({
                    article: a.articleNom,
                    unite: a.unite,
                    theo: a.stockTheorique.toLocaleString(),
                    reel: a.stockPhysique.toLocaleString(),
                    ecart: a.ecartQuantite.toString(),
                    ecartVal: `${a.ecartValeurFCFA.toLocaleString()} FCFA`,
                    statut: a.statut === 'CONFORME' ? 'Conforme' : a.statut === 'SURPLUS' ? 'Surplus' : 'Déficit'
                  })))}
                  label="Exporter PV"
                />
                <button
                  onClick={() => setSelectedSession(null)}
                  className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ─── Modal Réaliser un Nouvel Inventaire ────────────────────────── */}
      {showNewModal && (
        <div className="fixed inset-0 z-[250] bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <form
            onSubmit={handleSaveInventory}
            className="bg-white rounded-3xl max-w-3xl w-full max-h-[85dvh] sm:max-h-[92vh] overflow-hidden flex flex-col shadow-2xl border border-slate-200"
          >
            <div className={`bg-gradient-to-r ${currentTheme.gradient} p-5 text-white flex items-center justify-between`}>
              <div className="flex items-center gap-2.5">
                <ClipboardCheck className="w-6 h-6" />
                <div>
                  <h3 className="text-lg font-black">Nouveau Relevé d'Inventaire Physique</h3>
                  <p className="text-xs text-white/80">Saisie du comptage sur site et calcul instantané des écarts</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 flex items-center justify-center text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 flex-1">
              {/* Paramètres de l'inventaire */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Périodicité</label>
                  <select
                    value={newFreq}
                    onChange={e => {
                      const f = e.target.value as InventoryFrequency;
                      setNewFreq(f);
                      setNewTitre(
                        f === 'HEBDOMADAIRE'
                          ? `Inventaire Hebdomadaire S${Math.ceil(new Date().getDate() / 7)} - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`
                          : `Clôture & Inventaire Général Mensuel - ${new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}`

                      );
                    }}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="HEBDOMADAIRE">📅 Hebdomadaire (Fin de Semaine)</option>
                    <option value="MENSUEL">📆 Mensuel (Clôture Générale)</option>
                    <option value="EXCEPTIONNEL">⚠️ Exceptionnel / Audit Spécial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Responsable Inventaire</label>
                  <input
                    type="text"
                    value={newResponsable}
                    onChange={e => setNewResponsable(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Supervisé par</label>
                  <input
                    type="text"
                    value={newSuperviseur}
                    onChange={e => setNewSuperviseur(e.target.value)}
                    className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Titre de l'Inventaire</label>
                <input
                  type="text"
                  value={newTitre}
                  onChange={e => setNewTitre(e.target.value)}
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              {/* Tableau de comptage physique */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">
                    Articles à Contrôler (Matières & Produits Finis)
                  </h4>
                  <span className="text-[11px] text-slate-500">Saisissez les quantités constatées</span>
                </div>

                <div className="rounded-2xl border border-slate-200 overflow-hidden">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3">Article</th>
                        <th className="py-2.5 px-3">Unité</th>
                        <th className="py-2.5 px-3 text-right">Théorique</th>
                        <th className="py-2.5 px-3 text-right w-28">Physique Constaté</th>
                        <th className="py-2.5 px-3 text-center">Écart</th>
                        <th className="py-2.5 px-3">Motif Écart</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {/* Matières Premières */}
                      {rawMaterials.map(m => {
                        const count = countedItems[m.id]?.physique ?? m.stockActuel;
                        const ecart = count - m.stockActuel;
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/50">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {m.nom} <span className="text-[10px] text-slate-400">({m.reference})</span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">{m.unite}</td>
                            <td className="py-2 px-3 text-right font-medium">{m.stockActuel.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={count}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setCountedItems(prev => ({
                                    ...prev,
                                    [m.id]: { ...prev[m.id], physique: val }
                                  }));
                                }}
                                className="w-24 p-1.5 text-right font-bold rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              <span className={ecart === 0 ? 'text-emerald-600' : ecart > 0 ? 'text-blue-600' : 'text-rose-600'}>
                                {ecart > 0 ? `+${ecart}` : ecart}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder={ecart !== 0 ? 'Justification requise…' : 'RAS'}
                                value={countedItems[m.id]?.motif ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCountedItems(prev => ({
                                    ...prev,
                                    [m.id]: { ...prev[m.id], motif: val }
                                  }));
                                }}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-[11px] focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}

                      {/* Produits Finis */}
                      {products.map(p => {
                        const count = countedItems[p.id]?.physique ?? p.stockFardeaux;
                        const ecart = count - p.stockFardeaux;
                        return (
                          <tr key={p.id} className="hover:bg-slate-50/50 bg-slate-50/20">
                            <td className="py-2 px-3 font-semibold text-slate-800">
                              {p.nom} <span className="text-[10px] text-slate-400">({p.reference})</span>
                            </td>
                            <td className="py-2 px-3 text-slate-500">Fardeaux</td>
                            <td className="py-2 px-3 text-right font-medium">{p.stockFardeaux.toLocaleString()}</td>
                            <td className="py-2 px-3 text-right">
                              <input
                                type="number"
                                value={count}
                                onChange={e => {
                                  const val = Number(e.target.value);
                                  setCountedItems(prev => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], physique: val }
                                  }));
                                }}
                                className="w-24 p-1.5 text-right font-bold rounded-lg border border-slate-300 text-xs focus:ring-2 focus:ring-blue-500"
                              />
                            </td>
                            <td className="py-2 px-3 text-center font-bold">
                              <span className={ecart === 0 ? 'text-emerald-600' : ecart > 0 ? 'text-blue-600' : 'text-rose-600'}>
                                {ecart > 0 ? `+${ecart}` : ecart}
                              </span>
                            </td>
                            <td className="py-2 px-3">
                              <input
                                type="text"
                                placeholder={ecart !== 0 ? 'Justification requise…' : 'RAS'}
                                value={countedItems[p.id]?.motif ?? ''}
                                onChange={e => {
                                  const val = e.target.value;
                                  setCountedItems(prev => ({
                                    ...prev,
                                    [p.id]: { ...prev[p.id], motif: val }
                                  }));
                                }}
                                className="w-full p-1.5 rounded-lg border border-slate-200 text-[11px] focus:ring-1 focus:ring-blue-500"
                              />
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Notes & Observations Générales</label>
                <textarea
                  rows={2}
                  value={newNotes}
                  onChange={e => setNewNotes(e.target.value)}
                  placeholder="État des lieux, conditions de stockage, présence d'humidité, recommandation de réapprovisionnement…"
                  className="w-full p-2.5 rounded-xl border border-slate-300 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-3 pb-5 sm:p-4 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
              <button
                type="button"
                onClick={() => setShowNewModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs"
              >
                Annuler
              </button>
              <button
                type="submit"
                className={`px-5 py-2 rounded-xl bg-gradient-to-r ${currentTheme.gradient} text-white font-bold text-xs shadow-md hover:opacity-90`}
              >
                Valider & Enregistrer l'Inventaire
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
