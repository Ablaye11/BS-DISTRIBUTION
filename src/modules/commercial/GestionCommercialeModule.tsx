import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateInvoiceNumber } from '../../db/database';
import { Client, Invoice, OrderItem, AlveoleProduct, PaymentMethod, OrderStatus, PaymentStatus } from '../../types';
import { 
  ShoppingBag, Plus, Search, FileText, CheckCircle2, Clock, 
  Truck, DollarSign, UserCheck, Phone, MapPin, Printer, Filter, Building, CreditCard
} from 'lucide-react';

export const GestionCommercialeModule: React.FC = () => {
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];

  const [activeTab, setActiveTab] = useState<'COMMANDES' | 'CLIENTS'>('COMMANDES');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  // Formulaire Nouvelle Commande
  const [orderClientId, setOrderClientId] = useState('');
  const [orderItems, setOrderItems] = useState<{
    produitId: string;
    fardeaux: number;
  }[]>([
    { produitId: products[0]?.id || 'prod-alv-30-std', fardeaux: 100 }
  ]);
  const [acompteVerse, setAcompteVerse] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Wave');
  const [chauffeur, setChauffeur] = useState('');
  const [camion, setCamion] = useState('');
  const [notesLivraison, setNotesLivraison] = useState('');

  // Formulaire Nouveau Client
  const [newClient, setNewClient] = useState<{
    raisonSociale: string;
    contactNom: string;
    telephone: string;
    email: string;
    categorie: any;
    region: any;
    adresse: string;
    delaiPaiementJours: number;
    limiteCreditFCFA: number;
  }>({
    raisonSociale: '',
    contactNom: '',
    telephone: '+221 ',
    email: '',
    categorie: 'Ferme Avicole Ponte',
    region: 'Thiès',
    adresse: '',
    delaiPaiementJours: 15,
    limiteCreditFCFA: 3000000
  });

  // Calcul du Chiffre d'Affaires total et impayés
  const caTotal = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const caEncaisse = invoices.reduce((sum, inv) => sum + inv.acompteVerse, 0);
  const creancesEnAttente = invoices.reduce((sum, inv) => sum + inv.soldeRestant, 0);
  const totalAlveolesVendues = invoices.reduce((sum, inv) => {
    return sum + inv.articles.reduce((sub, a) => sub + a.quantiteUnites, 0);
  }, 0);

  // Ajouter un article à la commande en cours
  const handleAddOrderItemRow = () => {
    setOrderItems([...orderItems, { produitId: products[0]?.id || '', fardeaux: 50 }]);
  };

  const handleRemoveOrderItemRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Calcul du total de la nouvelle commande
  const computedOrderItems: OrderItem[] = orderItems.map(item => {
    const prod = products.find(p => p.id === item.produitId) || products[0];
    const fard = Number(item.fardeaux) || 0;
    const quantiteUnites = fard * (prod?.quantiteParFardeau || 100);
    const prixUnitaire = prod?.prixUnitaireFCFA || 45;
    const total = fard * (prod?.prixFardeauFCFA || 4500);

    return {
      produitId: prod?.id || '',
      reference: prod?.reference || '',
      designation: prod?.nom || '',
      format: prod?.format || 'PLATEAU_30',
      fardeaux: fard,
      quantiteUnites,
      prixUnitaireFCFA: prixUnitaire,
      totalLigneFCFA: total
    };
  });

  const computedTotalHT = computedOrderItems.reduce((sum, item) => sum + item.totalLigneFCFA, 0);
  const computedSoldeRestant = Math.max(0, computedTotalHT - acompteVerse);

  // Sauvegarde Commande / Facture
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    const client = clients.find(c => c.id === orderClientId) || clients[0];
    if (!client) return;

    const { numero, numeroBL } = await generateInvoiceNumber();
    const today = new Date().toISOString().split('T')[0];

    const statutPaiement: PaymentStatus = acompteVerse >= computedTotalHT 
      ? 'PAYE' 
      : acompteVerse > 0 ? 'ACOMPTE' : 'NON_PAYE';

    const invoice: Invoice = {
      id: `inv-${Date.now()}`,
      numero,
      numeroBL,
      date: today,
      dateEcheance: today,
      clientId: client.id,
      clientNom: client.raisonSociale,
      clientRegion: client.region,
      articles: computedOrderItems,
      totalHT: computedTotalHT,
      tvaMontant: 0,
      totalTTC: computedTotalHT,
      acompteVerse: Number(acompteVerse),
      soldeRestant: computedSoldeRestant,
      statutCommande: 'CONFIRMEE',
      statutPaiement,
      modePaiementPrefere: modePaiement,
      chauffeurNom: chauffeur,
      camionImmatriculation: camion,
      notesLivraison
    };

    await db.invoices.add(invoice);

    // Mettre à jour le solde dû du client si reste à payer
    if (computedSoldeRestant > 0) {
      await db.clients.update(client.id, {
        soldeDuFCFA: client.soldeDuFCFA + computedSoldeRestant
      });
    }

    // Déduire les fardeaux du stock
    for (const item of computedOrderItems) {
      const prod = products.find(p => p.id === item.produitId);
      if (prod) {
        await db.alveoleProducts.update(prod.id, {
          stockFardeaux: Math.max(0, prod.stockFardeaux - item.fardeaux),
          stockTotalUnites: Math.max(0, prod.stockTotalUnites - item.quantiteUnites)
        });
      }
    }

    setShowNewOrderModal(false);
    setSelectedInvoiceForView(invoice);
  };

  // Sauvegarde Nouveau Client B2B
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = clients.length + 1;
    const code = `CLI-ALV-${count.toString().padStart(3, '0')}`;

    const client: Client = {
      id: `cli-${Date.now()}`,
      codeClient: code,
      raisonSociale: newClient.raisonSociale,
      contactNom: newClient.contactNom,
      telephone: newClient.telephone,
      email: newClient.email,
      categorie: newClient.categorie,
      region: newClient.region,
      adresse: newClient.adresse,
      soldeDuFCFA: 0,
      limiteCreditFCFA: Number(newClient.limiteCreditFCFA),
      delaiPaiementJours: Number(newClient.delaiPaiementJours)
    };

    await db.clients.add(client);
    setShowNewClientModal(false);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Direction Commerciale & Ventes
            </span>
            <span className="text-xs text-slate-400">• Distribution B2B Nationale</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Gestion Commerciale & Facturation d'Alvéoles
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Commandes en fardeaux, génération de factures et bons de livraison pour les fermes avicoles, couvoirs et grossistes.
          </p>
        </div>

        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => {
              if (clients.length > 0 && !orderClientId) setOrderClientId(clients[0].id);
              setShowNewOrderModal(true);
            }}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Commande d'Alvéoles
          </button>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition-all active:scale-95"
          >
            <Building className="w-4 h-4" />
            Nouveau Client B2B
          </button>
        </div>
      </div>

      {/* KPIs Commerciaux */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Chiffre d'Affaires Réalisé</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <DollarSign className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{caTotal.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-emerald-600 font-semibold mt-1">{caEncaisse.toLocaleString()} FCFA déjà encaissés</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Créances en Attente</span>
            <span className="p-2 rounded-lg bg-amber-50 text-amber-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{creancesEnAttente.toLocaleString()} <span className="text-xs font-semibold text-slate-500">FCFA</span></div>
            <p className="text-xs text-amber-600 font-semibold mt-1">À recouvrer sous 15 jours</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Alvéoles Commercialisées</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <ShoppingBag className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{totalAlveolesVendues.toLocaleString()} <span className="text-xs font-semibold text-slate-500">unités</span></div>
            <p className="text-xs text-slate-500 mt-1">{invoices.length} commandes traitées</p>
          </div>
        </div>

        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Portefeuille Clients</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Building className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-2xl font-black text-slate-900">{clients.length} <span className="text-xs font-semibold text-slate-500">comptes B2B</span></div>
            <p className="text-xs text-purple-600 font-semibold mt-1">Fermes, couvoirs et grossistes</p>
          </div>
        </div>
      </div>

      {/* Onglets Commandes & Factures / Répertoire Clients */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-3">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('COMMANDES')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'COMMANDES'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📑 Commandes & Factures ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'CLIENTS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏢 Répertoire Clients B2B ({clients.length})
          </button>
        </div>

        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          <input
            type="text"
            placeholder="Rechercher client, N° facture..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full text-xs pl-9 pr-3 py-2 bg-white rounded-lg border border-slate-200 focus:outline-none focus:ring-2 focus:ring-amber-500"
          />
        </div>
      </div>

      {/* Vue Commandes & Factures */}
      {activeTab === 'COMMANDES' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">N° Facture / BL</th>
                  <th className="py-3 px-4">Client B2B</th>
                  <th className="py-3 px-4">Articles & Fardeaux</th>
                  <th className="py-3 px-4 text-right">Montant Total</th>
                  <th className="py-3 px-4 text-right">Acompte / Solde</th>
                  <th className="py-3 px-4 text-center">Paiement</th>
                  <th className="py-3 px-4 text-center">Statut Commande</th>
                  <th className="py-3 px-4 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {invoices.map((inv) => {
                  const totalFard = inv.articles.reduce((sum, a) => sum + a.fardeaux, 0);

                  return (
                    <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                      <td className="py-3.5 px-4">
                        <div className="font-mono font-bold text-slate-900">{inv.numero}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{inv.numeroBL} • {inv.date}</div>
                      </td>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-slate-900">{inv.clientNom}</div>
                        <div className="text-slate-400 text-[11px] flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-slate-400" />
                          Région {inv.clientRegion}
                        </div>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-indigo-600">{totalFard} fardeaux</span>
                        <span className="text-[10px] text-slate-400 block">
                          ({inv.articles.map(a => `${a.fardeaux} ${a.format.replace('_', ' ')}`).join(', ')})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                        {inv.totalTTC.toLocaleString()} FCFA
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <span className="font-bold text-emerald-600 block">{inv.acompteVerse.toLocaleString()} FCFA</span>
                        {inv.soldeRestant > 0 ? (
                          <span className="text-[10px] text-red-600 font-semibold block">Reste: {inv.soldeRestant.toLocaleString()} FCFA</span>
                        ) : (
                          <span className="text-[10px] text-emerald-600 font-semibold block">Soldé</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          inv.statutPaiement === 'PAYE'
                            ? 'bg-emerald-100 text-emerald-800'
                            : inv.statutPaiement === 'ACOMPTE'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-red-100 text-red-800'
                        }`}>
                          {inv.statutPaiement} ({inv.modePaiementPrefere})
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-slate-100 text-slate-800 border border-slate-200">
                          {inv.statutCommande}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        <button
                          onClick={() => setSelectedInvoiceForView(inv)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                          title="Voir & Imprimer Facture / BL"
                        >
                          <FileText className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Vue Répertoire Clients B2B */}
      {activeTab === 'CLIENTS' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {clients.map((c) => (
            <div key={c.id} className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-all">
              <div className="flex items-start justify-between">
                <div>
                  <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                    {c.codeClient}
                  </span>
                  <h3 className="font-bold text-slate-900 text-sm mt-1">{c.raisonSociale}</h3>
                  <span className="text-xs text-indigo-600 font-semibold">{c.categorie}</span>
                </div>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                  {c.region}
                </span>
              </div>

              <div className="space-y-1.5 mt-4 text-xs text-slate-600">
                <div className="flex items-center gap-2">
                  <UserCheck className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.contactNom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-semibold text-slate-900">{c.telephone}</span>
                </div>
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-slate-400" />
                  <span>{c.adresse || c.region}</span>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">Solde en cours</span>
                  <span className={`font-bold ${c.soldeDuFCFA > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                    {c.soldeDuFCFA.toLocaleString()} FCFA
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Délai accordé</span>
                  <span className="font-semibold text-slate-800">{c.delaiPaiementJours} jours</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Nouvelle Commande */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <ShoppingBag className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nouvelle Commande d'Alvéoles</h3>
                  <p className="text-xs text-slate-500">Génération automatique du bon de commande, facture et bon de livraison</p>
                </div>
              </div>
              <button onClick={() => setShowNewOrderModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            <form onSubmit={handleCreateOrder} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Sélectionnez le Client B2B</label>
                <select
                  value={orderClientId}
                  onChange={e => setOrderClientId(e.target.value)}
                  required
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500 font-semibold"
                >
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>{c.raisonSociale} ({c.region} - {c.telephone})</option>
                  ))}
                </select>
              </div>

              {/* Lignes d'articles */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-800">Articles / Formats d'Alvéoles Commandés</span>
                  <button
                    type="button"
                    onClick={handleAddOrderItemRow}
                    className="text-xs text-amber-600 hover:text-amber-700 font-bold flex items-center gap-1"
                  >
                    + Ajouter un format
                  </button>
                </div>

                {orderItems.map((item, idx) => {
                  const prod = products.find(p => p.id === item.produitId);
                  const totalLine = (Number(item.fardeaux) || 0) * (prod?.prixFardeauFCFA || 4500);

                  return (
                    <div key={idx} className="flex items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex-1">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Format Alvéole</label>
                        <select
                          value={item.produitId}
                          onChange={e => {
                            const copy = [...orderItems];
                            copy[idx].produitId = e.target.value;
                            setOrderItems(copy);
                          }}
                          className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 font-medium"
                        >
                          {products.map(p => (
                            <option key={p.id} value={p.id}>
                              {p.nom} — {p.prixFardeauFCFA.toLocaleString()} F/fard.
                            </option>
                          ))}
                        </select>
                      </div>

                      <div className="w-28">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Nb Fardeaux</label>
                        <input
                          type="number"
                          min="1"
                          value={item.fardeaux}
                          onChange={e => {
                            const copy = [...orderItems];
                            copy[idx].fardeaux = Number(e.target.value);
                            setOrderItems(copy);
                          }}
                          className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 font-bold text-slate-900"
                        />
                      </div>

                      <div className="w-32 text-right">
                        <span className="block text-[10px] text-slate-400">Total Ligne</span>
                        <span className="font-black text-slate-900 text-xs">{totalLine.toLocaleString()} F</span>
                      </div>

                      {orderItems.length > 1 && (
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItemRow(idx)}
                          className="text-red-500 hover:text-red-700 text-sm font-bold pt-4"
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Récapitulatif Total & Paiement */}
              <div className="p-4 bg-slate-900 rounded-xl text-white space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-300">Total Général HT / TTC</span>
                  <span className="text-xl font-black text-amber-400">{computedTotalHT.toLocaleString()} FCFA</span>
                </div>
                <div className="flex justify-between text-xs text-slate-400">
                  <span>Unités totales d'alvéoles</span>
                  <span>{computedOrderItems.reduce((s, i) => s + i.quantiteUnites, 0).toLocaleString()} unités</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Acompte Versé (FCFA)</label>
                  <input
                    type="number"
                    value={acompteVerse}
                    onChange={e => setAcompteVerse(Number(e.target.value))}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold text-emerald-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Règlement</label>
                  <select
                    value={modePaiement}
                    onChange={e => setModePaiement(e.target.value as PaymentMethod)}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                  >
                    <option value="Wave">Wave</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Virement Bancaire">Virement Bancaire</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Espèces">Espèces</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Chauffeur / Transporteur</label>
                  <input
                    type="text"
                    value={chauffeur}
                    onChange={e => setChauffeur(e.target.value)}
                    placeholder="Ex: Alioune Diouf"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Immatriculation Camion</label>
                  <input
                    type="text"
                    value={camion}
                    onChange={e => setCamion(e.target.value)}
                    placeholder="Ex: DK-4982-BB"
                    className="w-full text-xs p-2 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewOrderModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-all active:scale-95"
                >
                  Valider la Commande & Générer BL
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nouveau Client B2B */}
      {showNewClientModal && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Ajout Nouveau Client B2B</h3>
              <button onClick={() => setShowNewClientModal(false)} className="text-slate-400">✕</button>
            </div>
            <form onSubmit={handleSaveClient} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Raison Sociale / Nom de la Ferme</label>
                <input
                  type="text"
                  required
                  value={newClient.raisonSociale}
                  onChange={e => setNewClient({ ...newClient, raisonSociale: e.target.value })}
                  placeholder="Ex: Ferme Avicole de Sébikotane"
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Contact Référent</label>
                  <input
                    type="text"
                    required
                    value={newClient.contactNom}
                    onChange={e => setNewClient({ ...newClient, contactNom: e.target.value })}
                    placeholder="Nom du responsable"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone</label>
                  <input
                    type="text"
                    required
                    value={newClient.telephone}
                    onChange={e => setNewClient({ ...newClient, telephone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie</label>
                  <select
                    value={newClient.categorie}
                    onChange={e => setNewClient({ ...newClient, categorie: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  >
                    <option value="Ferme Avicole Ponte">Ferme Avicole Ponte</option>
                    <option value="Couvoir Industriel">Couvoir Industriel</option>
                    <option value="Grossiste Distributeur Emballages">Grossiste Emballages</option>
                    <option value="Supermarché / Centrale d'Achat">Supermarché</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Région</label>
                  <select
                    value={newClient.region}
                    onChange={e => setNewClient({ ...newClient, region: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  >
                    <option value="Thiès">Thiès</option>
                    <option value="Dakar">Dakar</option>
                    <option value="Diourbel">Diourbel</option>
                    <option value="Fatick">Fatick</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowNewClientModal(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md"
                >
                  Enregistrer le Client
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Affichage / Impression Facture & Bon de Livraison */}
      {selectedInvoiceForView && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 max-h-[95vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-slate-900 text-amber-400 font-black">BS</span>
                <div>
                  <h3 className="text-lg font-black text-slate-900">BS ALVÉOLES SUARL</h3>
                  <p className="text-xs text-slate-500">Unité Industrielle de Pâte Moulée & Emballages Avicoles</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer
                </button>
                <button onClick={() => setSelectedInvoiceForView(null)} className="text-slate-400 hover:text-slate-600 p-1">✕</button>
              </div>
            </div>

            {/* Document Header */}
            <div className="grid grid-cols-2 gap-6 my-6 text-xs">
              <div>
                <span className="text-slate-400 font-semibold block uppercase text-[10px]">Facturé à</span>
                <div className="text-slate-900 font-extrabold text-sm mt-0.5">{selectedInvoiceForView.clientNom}</div>
                <div className="text-slate-600">Région : {selectedInvoiceForView.clientRegion}</div>
                {selectedInvoiceForView.chauffeurNom && (
                  <div className="text-slate-600 mt-2 bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="font-semibold text-slate-700 block">Bon de Livraison ({selectedInvoiceForView.numeroBL})</span>
                    <span>Chauffeur: {selectedInvoiceForView.chauffeurNom}</span>
                    <span className="block">Camion: {selectedInvoiceForView.camionImmatriculation}</span>
                  </div>
                )}
              </div>
              <div className="text-right">
                <div className="font-mono font-black text-slate-900 text-base">{selectedInvoiceForView.numero}</div>
                <div className="text-slate-500 mt-1">Date: {selectedInvoiceForView.date}</div>
                <div className="text-slate-500">Règlement: {selectedInvoiceForView.modePaiementPrefere}</div>
                <span className="inline-block mt-2 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                  {selectedInvoiceForView.statutPaiement}
                </span>
              </div>
            </div>

            {/* Table des articles */}
            <table className="w-full text-left text-xs mb-6">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-y border-slate-200">
                <tr>
                  <th className="py-2 px-3">Désignation</th>
                  <th className="py-2 px-3 text-right">Fardeaux</th>
                  <th className="py-2 px-3 text-right">Total Unités</th>
                  <th className="py-2 px-3 text-right">Prix Unitaire</th>
                  <th className="py-2 px-3 text-right">Total FCFA</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {selectedInvoiceForView.articles.map((art, i) => (
                  <tr key={i}>
                    <td className="py-2.5 px-3">
                      <div className="font-bold text-slate-900">{art.designation}</div>
                      <span className="text-[10px] text-slate-400 font-mono">{art.reference}</span>
                    </td>
                    <td className="py-2.5 px-3 text-right font-bold text-indigo-600">{art.fardeaux} fard.</td>
                    <td className="py-2.5 px-3 text-right text-slate-800">{art.quantiteUnites.toLocaleString()}</td>
                    <td className="py-2.5 px-3 text-right">{art.prixUnitaireFCFA} F</td>
                    <td className="py-2.5 px-3 text-right font-bold text-slate-900">{art.totalLigneFCFA.toLocaleString()} F</td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Totaux & signatures */}
            <div className="border-t border-slate-200 pt-4 flex flex-col items-end text-xs space-y-1.5">
              <div className="flex justify-between w-64 text-slate-600">
                <span>Total Net HT :</span>
                <span className="font-bold text-slate-900">{selectedInvoiceForView.totalHT.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between w-64 text-slate-600">
                <span>Acompte Versé :</span>
                <span className="font-bold text-emerald-600">{selectedInvoiceForView.acompteVerse.toLocaleString()} FCFA</span>
              </div>
              <div className="flex justify-between w-64 text-sm font-black text-slate-900 border-t border-slate-200 pt-2">
                <span>Solde à Payer :</span>
                <span className="text-amber-600">{selectedInvoiceForView.soldeRestant.toLocaleString()} FCFA</span>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
              <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl">
                <span>Signature & Cachet Usine</span>
                <div className="h-14 flex items-center justify-center font-bold text-slate-400 italic">
                  BS ALVÉOLES SUARL
                </div>
              </div>
              <div className="text-center p-4 border border-dashed border-slate-200 rounded-xl">
                <span>Visa Réception Client / Chauffeur</span>
                <div className="h-14 flex items-center justify-center text-slate-400 italic">
                  Bon pour réception conforme
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
