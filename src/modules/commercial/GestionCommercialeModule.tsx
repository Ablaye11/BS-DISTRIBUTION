import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, generateInvoiceNumber } from '../../db/database';
import { Client, Invoice, OrderItem, AlveoleProduct, PaymentMethod, OrderStatus, PaymentStatus, CommercialContract, CommercialExitVoucher, CommercialReturnVoucher, PaymentRecord, DeliveryNote, DeliveryStatus } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportCommercialPdf, exportInvoicePdf } from '../../services/pdfExport';
import { ImportCsvModal } from '../../components/ImportCsvModal';
import { SENEGAL_GEOGRAPHY } from '../../utils/senegalData';
import { 
  ShoppingBag, Plus, Search, FileText, CheckCircle2, Clock, 
  Truck, DollarSign, UserCheck, Phone, MapPin, Printer, Filter, Building, CreditCard,
  FileSignature, Users2, TrendingUp, TrendingDown, RotateCcw, Target, ArrowRight, Download, Upload,
  Compass, Crosshair, ExternalLink, Banknote, PackageCheck, AlertCircle, Receipt, Send, CheckSquare,
  MessageCircle, Boxes, AlertTriangle, Undo2, Check
} from 'lucide-react';


export const GestionCommercialeModule: React.FC = () => {
  const { currentTheme } = useTheme();
  const clients = useLiveQuery(() => db.clients.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.orderBy('date').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const contracts = useLiveQuery(() => db.commercialContracts.toArray()) || [];
  const exitVouchers = useLiveQuery(() => db.commercialExitVouchers.orderBy('date').reverse().toArray()) || [];
  const returnVouchers = useLiveQuery(() => db.commercialReturnVouchers.orderBy('date').reverse().toArray()) || [];
  const paymentRecords = useLiveQuery(() => db.paymentRecords.orderBy('date').reverse().toArray()) || [];
  const deliveryNotes = useLiveQuery(() => db.deliveryNotes.orderBy('date').reverse().toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const factorySettingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const factorySettings = factorySettingsList[0];

  const REMISE_MAX_POURCENT = factorySettings?.tauxRemiseMaxPourcent || 10; // CDC 9.3 : max 10%

  const [activeTab, setActiveTab] = useState<'COMMANDES' | 'CLIENTS' | 'CONTRATS' | 'COMMERCIAUX' | 'RETOURS_INVENDUS' | 'PRODUITS_FINIS' | 'ENCAISSEMENTS' | 'LIVRAISONS'>('COMMANDES');
  const [searchTerm, setSearchTerm] = useState('');
  const [showNewOrderModal, setShowNewOrderModal] = useState(false);
  const [showNewClientModal, setShowNewClientModal] = useState(false);
  const [showImportClientsModal, setShowImportClientsModal] = useState(false);
  const [showNewContractModal, setShowNewContractModal] = useState(false);
  const [selectedInvoiceForView, setSelectedInvoiceForView] = useState<Invoice | null>(null);

  // ── Modals Sortie Commercial & Retour Invendus (Flux Distribution Outbound) ──
  const [showExitVoucherModal, setShowExitVoucherModal] = useState(false);
  const [exitForm, setExitForm] = useState({
    commercialId: 'COM-001',
    commercialNom: 'Mamadou Diallo',
    produitId: '',
    quantiteLots: 50,
    magasinierNom: 'Magasinier Expéditions Usine',
    observations: ''
  });

  const [showReturnVoucherModal, setShowReturnVoucherModal] = useState(false);
  const [returnForm, setReturnForm] = useState({
    commercialId: 'COM-001',
    commercialNom: 'Mamadou Diallo',
    produitId: '',
    quantiteLots: 10,
    motif: 'Invendus de tournée',
    decision: 'ACCEPTE_CONFORME' as 'ACCEPTE_CONFORME' | 'NON_CONFORME_RECYCLE',
    magasinierNom: 'Contrôleur Réception Commerciale',
    observations: ''
  });

  // ── Modals Paiement & Livraison (CDC 7.6 & 7.7) ─────────────────────────
  const [showPaymentModal, setShowPaymentModal] = useState<Invoice | null>(null);
  const [showDeliveryModal, setShowDeliveryModal] = useState<Invoice | null>(null);

  // ── Formulaire Enregistrement Paiement (CDC 7.6) ────────────────────────
  const [paymentForm, setPaymentForm] = useState({
    montantFCFA: 0,
    modePaiement: 'Wave' as PaymentMethod,
    reference: '',
    compteCreditee: 'Wave Business' as 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro',
    observations: ''
  });

  // ── Formulaire Bon de Livraison (CDC 7.7) ────────────────────────────────
  const [deliveryForm, setDeliveryForm] = useState({
    dateLivraisonPrevue: new Date().toISOString().split('T')[0],
    responsableLivraison: 'Chauffeur Usine',
    chauffeurNom: '',
    camionImmatriculation: '',
    observations: ''
  });

  // Formulaire Nouveau Contrat B2B (CDC Section 7.2)
  const [newContractForm, setNewContractForm] = useState({
    clientId: '',
    dureeMois: 12,
    volumeMensuelLots: 1000,
    prixContractuelLot: 3000, // 30 FCFA/alvéole = 3 000 FCFA/lot contractuel
    frequenceLivraison: 'Hebdomadaire (250 fardeaux)',
    conditionsPaiement: 'Virement bancaire 15 jours fin de mois'
  });

  // Formulaire Nouvelle Commande
  const [orderClientId, setOrderClientId] = useState('');
  const [orderItems, setOrderItems] = useState<{
    produitId: string;
    fardeaux: number;
    remisePourcent?: number;
  }[]>([
    { produitId: products[0]?.id || 'prod-alv-30-std', fardeaux: 100, remisePourcent: 0 }
  ]);
  const [acompteVerse, setAcompteVerse] = useState<number>(0);
  const [modePaiement, setModePaiement] = useState<PaymentMethod>('Wave');
  const [referencePaiement, setReferencePaiement] = useState('');            // Référentiel de paiement (Wave TX, N° chèque...)
  const [compteCrediteeAcompte, setCompteCrediteeAcompte] = useState<'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro'>('Wave Business');
  const [chauffeur, setChauffeur] = useState('');
  const [camion, setCamion] = useState('');
  const [notesLivraison, setNotesLivraison] = useState('');

  // Formulaire Nouveau Client B2B avec Localisation Géographique Précise (Dakar & Thiès)
  const [newClient, setNewClient] = useState<{
    raisonSociale: string;
    contactNom: string;
    telephone: string;
    email: string;
    categorie: any;
    region: 'Dakar' | 'Thiès' | string;
    departement: string;
    commune: string;
    quartier: string;
    adresse: string;
    latitude: string;
    longitude: string;
    delaiPaiementJours: number;
    limiteCreditFCFA: number;
  }>({
    raisonSociale: '',
    contactNom: '',
    telephone: '+221 ',
    email: '',
    categorie: 'Ferme Avicole Ponte',
    region: 'Thiès',
    departement: 'Thiès',
    commune: 'Fandène',
    quartier: '',
    adresse: '',
    latitude: '14.8821',
    longitude: '-17.0234',
    delaiPaiementJours: 15,
    limiteCreditFCFA: 3000000
  });

  const [isCapturingGps, setIsCapturingGps] = useState(false);
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par ce navigateur.");
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setNewClient(prev => ({
          ...prev,
          latitude: pos.coords.latitude.toFixed(6),
          longitude: pos.coords.longitude.toFixed(6)
        }));
        setIsCapturingGps(false);
      },
      (err) => {
        alert("Impossible de récupérer la position GPS de la ferme : " + err.message);
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Calcul du Chiffre d'Affaires total et impayés
  const caTotal = invoices.reduce((sum, inv) => sum + inv.totalTTC, 0);
  const caEncaisse = invoices.reduce((sum, inv) => sum + inv.acompteVerse, 0);
  const creancesEnAttente = invoices.reduce((sum, inv) => sum + inv.soldeRestant, 0);
  const totalAlveolesVendues = invoices.reduce((sum, inv) => {
    return sum + inv.articles.reduce((sub, a) => sub + a.quantiteUnites, 0);
  }, 0);

  // Métriques Contrats B2B
  const totalVolContractuelLots = contracts.reduce((s, c) => s + c.volumeTotalContractuelLots, 0);
  const totalVolLivreLots = contracts.reduce((s, c) => s + c.volumeLivreLots, 0);
  const tauxCouvertureContrats = totalVolContractuelLots > 0
    ? Math.round((totalVolLivreLots / totalVolContractuelLots) * 100)
    : 0;

  // Métriques Suivi des Commerciaux & Commissions (CDC Section 7.8 & Annexe Primes)
  const COMM_PAR_LOT_FCFA = 70; // 70 FCFA par paquet de 100 vendu (2% du CA à 3 500 FCFA conformément au cadrage)
  // Liste des commerciaux actifs (équipe officielle et historique des sorties)
  const baseCommercials = [
    { id: 'COM-001', nom: 'Mamadou Diallo' },
    { id: 'COM-002', nom: 'Awa Ndiaye' },
    { id: 'COM-003', nom: 'Cheikh Sarr' }
  ];
  const allCommerciaux = [
    ...baseCommercials,
    ...exitVouchers
      .filter(v => !baseCommercials.some(b => b.id === v.commercialId))
      .map(v => ({ id: v.commercialId, nom: v.commercialNom }))
  ];
  const uniqueCommerciaux = Array.from(new Map(allCommerciaux.map(c => [c.id, c])).values());

  const commerciauxData = uniqueCommerciaux.map(com => {
    const sorties = exitVouchers.filter(v => v.commercialId === com.id);
    const retours = returnVouchers.filter(v => v.commercialId === com.id);
    const totalSorti = sorties.reduce((s, v) => s + v.quantiteLots, 0);
    const totalRetour = retours.reduce((s, v) => s + v.quantiteLots, 0);
    const stockDetenu = Math.max(0, totalSorti - totalRetour);
    const venteEstimee = Math.max(0, totalSorti - stockDetenu - totalRetour);
    const caEstime = venteEstimee * 3500; // 3 500 FCFA/paquet de 100
    const commissionAcquise = venteEstimee * COMM_PAR_LOT_FCFA;
    return { comId: com.id, nom: com.nom, totalSorti, totalRetour, stockDetenu, venteEstimee, caEstime, commissionAcquise, sorties, retours };
  });

  const totalCommissionsDues = commerciauxData.reduce((s, c) => s + c.commissionAcquise, 0);

  // Ajouter un article à la commande en cours
  const handleAddOrderItemRow = () => {
    setOrderItems([...orderItems, { produitId: products[0]?.id || '', fardeaux: 50, remisePourcent: 0 }]);
  };

  const handleRemoveOrderItemRow = (idx: number) => {
    setOrderItems(orderItems.filter((_, i) => i !== idx));
  };

  // Calcul du total de la nouvelle commande avec prise en compte des remises (CDC 7.3 & 9.3)
  const computedOrderItems: OrderItem[] = orderItems.map(item => {
    const prod = products.find(p => p.id === item.produitId) || products[0];
    const fard = Number(item.fardeaux) || 0;
    const quantiteUnites = fard * (prod?.quantiteParFardeau || 100);
    const prixUnitaire = prod?.prixUnitaireFCFA || 35;
    const prixFardeau = prod?.prixFardeauFCFA || 3500;
    const totalBrut = fard * prixFardeau;
    const remise = Math.min(REMISE_MAX_POURCENT, Math.max(0, Number(item.remisePourcent) || 0));
    const montantRemise = Math.round((totalBrut * remise) / 100);
    const total = totalBrut - montantRemise;

    return {
      produitId: prod?.id || '',
      reference: prod?.reference || '',
      designation: prod?.nom || '',
      format: prod?.format || 'PLATEAU_30',
      fardeaux: fard,
      quantiteUnites,
      prixUnitaireFCFA: prixUnitaire,
      remisePourcent: remise > 0 ? remise : undefined,
      montantRemiseFCFA: montantRemise > 0 ? montantRemise : undefined,
      totalLigneFCFA: total
    };
  });

  const computedTotalHT = computedOrderItems.reduce((sum, item) => sum + item.totalLigneFCFA, 0);
  const computedSoldeRestant = Math.max(0, computedTotalHT - acompteVerse);

  // Confirmation de livraison effective (CDC 7.7)
  const handleConfirmDelivery = async (delivery: DeliveryNote) => {
    const today = new Date().toISOString().split('T')[0];
    await db.deliveryNotes.update(delivery.id, {
      statut: 'LIVREE',
      dateLivraisonEffective: today
    });
    if (delivery.factureId) {
      await db.invoices.update(delivery.factureId, {
        statutCommande: 'LIVREE',
        datelivraison: today
      });
    }
    alert(`✅ Livraison ${delivery.numeroBL} confirmée comme réceptionnée par ${delivery.clientNom} !`);
  };

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
      referencePaiement: referencePaiement.trim() || undefined,           // Référentiel de paiement
      compteCrediteeAcompte: acompteVerse > 0 ? compteCrediteeAcompte : undefined, // Compte crédité si acompte
      chauffeurNom: chauffeur,
      camionImmatriculation: camion,
      notesLivraison
    };

    await db.invoices.add(invoice);

    // ── Enregistrement PaymentRecord si acompte versé ──────────────────
    if (Number(acompteVerse) > 0) {
      await db.paymentRecords.add({
        id: `pay-${Date.now()}`,
        factureId: invoice.id,
        factureNumero: invoice.numero,
        clientId: client.id,
        clientNom: client.raisonSociale,
        date: today,
        montantFCFA: Number(acompteVerse),
        modePaiement: modePaiement,
        reference: referencePaiement.trim() || undefined,
        compteCreditee: compteCrediteeAcompte,
        enregistrePar: 'Système',
        observations: `Acompte à la commande ${invoice.numero}${referencePaiement.trim() ? ` — Réf: ${referencePaiement.trim()}` : ''}`
      } as any);

      // ── Écriture de trésorerie (recette) ─────────────────────────────
      await db.expenses.add({
        id: `rec-${Date.now()}`,
        date: today,
        libelle: `Acompte client — Facture ${invoice.numero} (${client.raisonSociale})`,
        categorie: 'RECETTE_VENTE' as any,
        montant: -Number(acompteVerse),   // négatif = recette dans le modèle de dépenses
        comptePaiement: compteCrediteeAcompte,
        justificatifRef: referencePaiement.trim() || invoice.numero,
        valide: true
      } as any);
    }

    // ── Synchronisation Stock : Déduire + Tracer le mouvement ─────────
    for (const item of computedOrderItems) {
      const prod = products.find(p => p.id === item.produitId);
      if (prod) {
        // 1. Mise à jour du stock produit
        await db.alveoleProducts.update(prod.id, {
          stockFardeaux: Math.max(0, prod.stockFardeaux - item.fardeaux),
          stockTotalUnites: Math.max(0, prod.stockTotalUnites - item.quantiteUnites)
        });
        // 2. Créer un mouvement de stock traçable (entrée/sortie)
        await db.stockMovements.add({
          id: `mvt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
          date: today,
          type: 'SORTIE_VENTE',
          articleId: prod.id,
          articleNom: prod.nom,
          quantite: item.quantiteUnites,
          quantiteFardeaux: item.fardeaux,
          referenceDocument: invoice.numero,
          typeDocument: 'FACTURE',
          montantFCFA: item.totalLigneFCFA,
          destinataireNom: client.raisonSociale,
          destinataireRegion: client.region,
          notes: `Facture ${invoice.numero} - ${item.fardeaux} paquets de 100`
        } as any);
      }
    }

    // ── Mettre à jour le solde dû du client ──────────────────────────
    if (computedSoldeRestant > 0) {
      await db.clients.update(client.id, {
        soldeDuFCFA: (client.soldeDuFCFA || 0) + computedSoldeRestant
      });
    }

    // Réinitialiser les champs de paiement
    setReferencePaiement('');
    setCompteCrediteeAcompte('Wave Business');
    setShowNewOrderModal(false);
    setSelectedInvoiceForView(invoice);
  };

  // Sauvegarde Nouveau Client B2B
  const handleSaveClient = async (e: React.FormEvent) => {
    e.preventDefault();
    const count = clients.length + 1;
    const code = `CLI-ALV-${count.toString().padStart(3, '0')}`;

    const latNum = Number(newClient.latitude) || undefined;
    const lngNum = Number(newClient.longitude) || undefined;

    const client: Client = {
      id: `cli-${Date.now()}`,
      codeClient: code,
      raisonSociale: newClient.raisonSociale,
      contactNom: newClient.contactNom,
      telephone: newClient.telephone,
      email: newClient.email,
      categorie: newClient.categorie,
      region: newClient.region as any,
      departement: newClient.departement,
      commune: newClient.commune,
      quartier: newClient.quartier,
      adresse: newClient.adresse || `${newClient.quartier}, ${newClient.commune}`,
      latitude: latNum,
      longitude: lngNum,
      coordonneesGPS: latNum && lngNum ? { latitude: latNum, longitude: lngNum } : undefined,
      soldeDuFCFA: 0,
      limiteCreditFCFA: Number(newClient.limiteCreditFCFA),
      delaiPaiementJours: Number(newClient.delaiPaiementJours)
    };

    await db.clients.add(client);
    setShowNewClientModal(false);
  };

  // Sauvegarde Nouveau Contrat Commercial B2B (CDC Section 7.2)
  const handleSaveContract = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetClient = clients.find(c => c.id === newContractForm.clientId) || clients[0];
    if (!targetClient) {
      alert("Veuillez sélectionner un client B2B existant.");
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const dFin = new Date();
    dFin.setMonth(dFin.getMonth() + Number(newContractForm.dureeMois));
    const dateFin = dFin.toISOString().split('T')[0];

    const volMensuel = Number(newContractForm.volumeMensuelLots) || 500;
    const volTotal = volMensuel * Number(newContractForm.dureeMois);
    const prixLot = Number(newContractForm.prixContractuelLot) || 3000;
    const prixAlv = Math.round(prixLot / 100);

    const contract: CommercialContract = {
      id: `ctr-${Date.now()}`,
      numeroContrat: `CTR-BS-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`,
      clientId: targetClient.id,
      clientNom: targetClient.raisonSociale,
      dateSignature: today,
      dateDebut: today,
      dateFin,
      dureeMois: Number(newContractForm.dureeMois),
      volumeMensuelLots: volMensuel,
      prixContractuelAlveole: prixAlv,
      prixContractuelLot: prixLot,
      frequenceLivraison: newContractForm.frequenceLivraison,
      volumeTotalContractuelLots: volTotal,
      volumeLivreLots: 0,
      volumeRestantLots: volTotal,
      statut: 'EN_COURS',
      conditionsPaiement: newContractForm.conditionsPaiement
    };

    await db.commercialContracts.add(contract);
    setShowNewContractModal(false);
  };

  // ── Enregistrement d'un Paiement / Encaissement sur une Facture (CDC 7.6) ──
  const handleSavePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showPaymentModal) return;
    const invoice = showPaymentModal;
    const montant = Number(paymentForm.montantFCFA) || 0;

    if (montant <= 0) {
      alert('Le montant du paiement doit être supérieur à 0.');
      return;
    }
    if (montant > invoice.soldeRestant) {
      alert(`⚠️ Le montant saisi (${montant.toLocaleString()} FCFA) dépasse le solde restant (${invoice.soldeRestant.toLocaleString()} FCFA). Veuillez corriger.`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const nouvelAcompte = invoice.acompteVerse + montant;
    const nouveauSolde = Math.max(0, invoice.totalTTC - nouvelAcompte);
    const nouveauStatutPaiement: PaymentStatus = nouveauSolde === 0 ? 'PAYE' : 'ACOMPTE';

    // 1. Enregistrer le paiement distinct (CDC 7.6)
    const payment: PaymentRecord = {
      id: `pay-${Date.now()}`,
      factureId: invoice.id,
      factureNumero: invoice.numero,
      clientId: invoice.clientId,
      clientNom: invoice.clientNom,
      date: today,
      montantFCFA: montant,
      modePaiement: paymentForm.modePaiement,
      reference: paymentForm.reference,
      compteCreditee: paymentForm.compteCreditee,
      enregistrePar: 'Comptabilité Usine',
      observations: paymentForm.observations || `Règlement facture ${invoice.numero}`
    };
    await db.paymentRecords.add(payment);

    // 2. Mettre à jour la facture (solde & statut)
    await db.invoices.update(invoice.id, {
      acompteVerse: nouvelAcompte,
      soldeRestant: nouveauSolde,
      statutPaiement: nouveauStatutPaiement,
      dateEncaissement: nouveauSolde === 0 ? today : undefined
    });

    // 3. Enregistrer la recette dans la trésorerie
    await db.expenses.add({
      id: `rec-${Date.now()}`,
      date: today,
      categorie: 'Matières Premières (Balles Cartons)' as any,
      montant: -montant, // Négatif = recette (entrée de trésorerie)
      beneficiaire: invoice.clientNom,
      description: `Encaissement facture ${invoice.numero} - ${paymentForm.modePaiement}${paymentForm.reference ? ` (Réf: ${paymentForm.reference})` : ''}`,
      comptePaiement: paymentForm.compteCreditee,
      justificatifRef: paymentForm.reference || invoice.numero,
      enregistrePar: 'Comptabilité Usine'
    });

    // 4. Mettre à jour le solde client
    const client = clients.find(c => c.id === invoice.clientId);
    if (client) {
      await db.clients.update(client.id, {
        soldeDuFCFA: Math.max(0, (client.soldeDuFCFA || 0) - montant)
      });
    }

    setShowPaymentModal(null);
    setPaymentForm({ montantFCFA: 0, modePaiement: 'Wave', reference: '', compteCreditee: 'Wave Business', observations: '' });
    alert(`✅ Paiement de ${montant.toLocaleString()} FCFA enregistré avec succès !\nFacture ${invoice.numero} — Solde restant : ${nouveauSolde.toLocaleString()} FCFA`);
  };

  // ── Création d'un Bon de Livraison distinct (CDC 7.7) ─────────────────────
  const handleCreateDeliveryNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showDeliveryModal) return;
    const invoice = showDeliveryModal;

    // Vérifier qu'il n'y a pas déjà un BL officiel qui a sorti le stock
    const existingBL = deliveryNotes.find(d => d.factureId === invoice.id && d.stockSortiOfficiel);
    if (existingBL) {
      alert(`⚠️ Un bon de livraison (${existingBL.numeroBL}) avec sortie de stock a déjà été émis pour cette facture. Éviter le double déstockage (CDC 7.7).`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const blNum = `BL-${new Date().getFullYear()}-${(deliveryNotes.length + 1).toString().padStart(3, '0')}`;
    const totalFardeaux = invoice.articles.reduce((s, a) => s + a.fardeaux, 0);

    const deliveryNote: DeliveryNote = {
      id: `bl-${Date.now()}`,
      numeroBL: blNum,
      factureId: invoice.id,
      factureNumero: invoice.numero,
      clientId: invoice.clientId,
      clientNom: invoice.clientNom,
      date: today,
      dateLivraisonPrevue: deliveryForm.dateLivraisonPrevue,
      articles: invoice.articles,
      quantitePrevueFardeaux: totalFardeaux,
      quantitelivreeFardeaux: totalFardeaux, // Peut être modifié si livraison partielle
      responsableLivraison: deliveryForm.responsableLivraison,
      chauffeurNom: deliveryForm.chauffeurNom || invoice.chauffeurNom,
      camionImmatriculation: deliveryForm.camionImmatriculation || invoice.camionImmatriculation,
      statut: 'EXPEDIEE',
      stockSortiOfficiel: true, // CDC 7.7 : marquer que le stock a été sorti officiellement
      observations: deliveryForm.observations
    };

    await db.deliveryNotes.add(deliveryNote);

    // Mettre à jour le statut de la commande facture
    await db.invoices.update(invoice.id, {
      statutCommande: 'EXPEDIEE',
      numeroBL: blNum,
      datelivraison: deliveryForm.dateLivraisonPrevue
    });

    setShowDeliveryModal(null);
    alert(`✅ Bon de livraison ${blNum} créé avec succès !\nLivraison prévue le ${deliveryForm.dateLivraisonPrevue} pour ${invoice.clientNom}.`);
  };

  // Partage WhatsApp officiel d'une facture / bon de commande B2B
  const handleShareInvoiceWhatsApp = (inv: Invoice) => {
    const client = clients.find(c => c.id === inv.clientId);
    let rawPhone = client?.telephone || '';
    let cleanPhone = rawPhone.replace(/[\s\.\-\(\)]/g, '');
    if (cleanPhone.startsWith('00221')) cleanPhone = cleanPhone.replace('00221', '221');
    else if (cleanPhone.startsWith('+221')) cleanPhone = cleanPhone.replace('+221', '221');
    else if (/^[7][05678]\d{7}$/.test(cleanPhone)) cleanPhone = '221' + cleanPhone;

    const totalFard = inv.articles.reduce((sum, a) => sum + a.fardeaux, 0);
    const msg = 
`🏭 *BS DISTRIBUTION - ALVÉOLES SÉNÉGAL*
📄 *Facture N° ${inv.numero}* (Date: ${inv.date})
👤 *Client :* ${inv.clientNom}
📦 *Volume :* ${totalFard} fardeaux (${(totalFard * 100).toLocaleString('fr-FR')} alvéoles)
💰 *Montant Total :* ${inv.totalTTC.toLocaleString('fr-FR')} FCFA
💵 *Acompte réglé :* ${inv.acompteVerse.toLocaleString('fr-FR')} FCFA
${inv.soldeRestant > 0 ? `⚠️ *Reste à payer :* ${inv.soldeRestant.toLocaleString('fr-FR')} FCFA` : `✅ *Facture Intégralement Soldée*`}
🚚 *Statut Livraison :* ${inv.statutCommande} (BL: ${inv.numeroBL || 'En préparation'})

📲 *Comptes de règlement officiels BS DISTRIBUTION :*
• Wave Business : +221 76 622 59 79
• Orange Money Pro : +221 77 792 40 65

Merci pour votre partenariat !
_BS Distribution • Unité Industrielle d'Alvéoles de Dakar_`;

    const url = cleanPhone
      ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`
      : `https://wa.me/?text=${encodeURIComponent(msg)}`;
    window.open(url, '_blank');
  };

  // ── Sauvegarde Bon de Sortie vers un Commercial (Distribution Outbound) ──
  const handleSaveExitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const prodId = exitForm.produitId || products[0]?.id;
    const targetProduct = products.find(p => p.id === prodId) || products[0];
    if (!targetProduct) {
      alert("Veuillez sélectionner un produit fini.");
      return;
    }

    const lots = Number(exitForm.quantiteLots) || 0;
    if (lots <= 0) {
      alert("Le nombre de lots doit être supérieur à zéro.");
      return;
    }
    if (lots > (targetProduct.stockFardeaux || 0)) {
      alert(`⚠️ Quantité insuffisante en stock usine (${targetProduct.stockFardeaux || 0} fardeaux disponibles pour ${targetProduct.nom}).`);
      return;
    }

    const unites = lots * (targetProduct.quantiteParFardeau || 100);
    const today = new Date().toISOString().split('T')[0];
    const bonId = `BS-${new Date().getFullYear()}-${(exitVouchers.length + 1).toString().padStart(3, '0')}`;

    const stockUsineAvant = targetProduct.stockFardeaux || 0;
    const stockUsineApres = stockUsineAvant - lots;

    await db.alveoleProducts.update(targetProduct.id, {
      stockFardeaux: stockUsineApres,
      stockTotalUnites: Math.max(0, (targetProduct.stockTotalUnites || 0) - unites)
    });

    const exitVoucher: CommercialExitVoucher = {
      id: `exit-${Date.now()}`,
      numeroBon: bonId,
      date: today,
      commercialId: exitForm.commercialId,
      commercialNom: exitForm.commercialNom,
      produitId: targetProduct.id,
      produitNom: targetProduct.nom,
      quantiteLots: lots,
      quantiteUnites: unites,
      stockUsineAvant,
      stockUsineApres,
      stockCommercialAvant: 0,
      stockCommercialApres: lots,
      magasinierNom: exitForm.magasinierNom,
      statut: 'CONFIRME_PAR_COMMERCIAL',
      observations: exitForm.observations
    };

    await db.commercialExitVouchers.add(exitVoucher);

    await db.stockMovements.add({
      id: `mov-${Date.now()}`,
      date: today,
      type: 'SORTIE_COMMERCIAL',
      articleType: 'PRODUIT_FINI',
      articleId: targetProduct.id,
      articleNom: targetProduct.nom,
      quantite: lots,
      unite: 'Fardeaux (100)',
      responsable: exitForm.magasinierNom,
      motif: `Dotation tournée ${bonId} pour ${exitForm.commercialNom} (${lots} lots confiés)`
    });

    setShowExitVoucherModal(false);
    alert(`✅ Bon de Sortie ${bonId} émis avec succès (${lots} fardeaux confiés à ${exitForm.commercialNom}) !`);
  };

  // ── Sauvegarde Retour Invendus Commercial (Contrôle & Réintégration) ──
  const handleSaveReturnVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const prodId = returnForm.produitId || products[0]?.id;
    const targetProduct = products.find(p => p.id === prodId) || products[0];
    if (!targetProduct) return;

    const lots = Number(returnForm.quantiteLots) || 0;
    if (lots <= 0) {
      alert("Le nombre de lots retournés doit être supérieur à zéro.");
      return;
    }

    const unites = lots * (targetProduct.quantiteParFardeau || 100);
    const today = new Date().toISOString().split('T')[0];
    const retourId = `BRC-${new Date().getFullYear()}-${(returnVouchers.length + 1).toString().padStart(3, '0')}`;

    if (returnForm.decision === 'ACCEPTE_CONFORME') {
      await db.alveoleProducts.update(targetProduct.id, {
        stockFardeaux: (targetProduct.stockFardeaux || 0) + lots,
        stockTotalUnites: (targetProduct.stockTotalUnites || 0) + unites
      });
    } else if (returnForm.decision === 'NON_CONFORME_RECYCLE') {
      const occMP = rawMaterials.find(m => m.categorie === 'PAPIER_CARTON') || rawMaterials[0];
      if (occMP) {
        const kgRecycles = Math.round((unites * (targetProduct.poidsMoyenGrammes || 68)) / 1000);
        await db.rawMaterials.update(occMP.id, {
          stockActuel: occMP.stockActuel + kgRecycles
        });
      }
    }

    const retourVoucher: CommercialReturnVoucher = {
      id: `ret-${Date.now()}`,
      numeroRetour: retourId,
      date: today,
      commercialId: returnForm.commercialId,
      commercialNom: returnForm.commercialNom,
      produitId: targetProduct.id,
      produitNom: targetProduct.nom,
      quantiteLots: lots,
      motif: returnForm.motif,
      statut: returnForm.decision,
      magasinierNom: returnForm.magasinierNom,
      dateValidation: today,
      observations: returnForm.observations
    };

    await db.commercialReturnVouchers.add(retourVoucher);

    await db.stockMovements.add({
      id: `mov-${Date.now()}`,
      date: today,
      type: 'RETOUR_COMMERCIAL',
      articleType: 'PRODUIT_FINI',
      articleId: targetProduct.id,
      articleNom: targetProduct.nom,
      quantite: lots,
      unite: 'Fardeaux (100)',
      responsable: returnForm.magasinierNom,
      motif: `Bon de retour invendus ${retourId} (${lots} lots) - Décision: ${returnForm.decision}`
    });

    setShowReturnVoucherModal(false);
    alert(`✅ Retour ${retourId} enregistré (${lots} lots) — Décision : ${returnForm.decision === 'ACCEPTE_CONFORME' ? 'Réintégré au stock usine' : 'Envoyé au recyclage pulpeur'} !`);
  };

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-4 sm:p-6 rounded-2xl sm:rounded-3xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[11px] sm:text-xs font-semibold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <ShoppingBag className="w-3.5 h-3.5" />
              Direction Commerciale & Ventes
            </span>
            <span className="text-[10px] sm:text-xs text-slate-400">• Distribution B2B Nationale</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight">
            Gestion Commerciale & Facturation d'Alvéoles
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Commandes en fardeaux, génération de factures et bons de livraison pour les fermes avicoles, couvoirs et grossistes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportPdfButton onExport={() => exportCommercialPdf(currentTheme.hex)} />
          <button
            onClick={() => {
              if (clients.length > 0 && !orderClientId) setOrderClientId(clients[0].id);
              setShowNewOrderModal(true);
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Commande
          </button>
          <button
            onClick={() => setShowNewClientModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs border border-slate-600 transition-all active:scale-95 shrink-0"
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

      {/* Onglets Navigation avec scroll mobile */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-200 pb-2">
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-nowrap pb-1 max-w-full">
          <button
            onClick={() => setActiveTab('COMMANDES')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'COMMANDES'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📑 Commandes & Factures ({invoices.length})
          </button>
          <button
            onClick={() => setActiveTab('PRODUITS_FINIS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'PRODUITS_FINIS'
                ? 'bg-blue-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <Boxes className="w-3.5 h-3.5" />
            📦 Stock Disponible ({products.length})
          </button>
          <button
            onClick={() => setActiveTab('CLIENTS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'CLIENTS'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🏢 Clients B2B ({clients.length})
          </button>
          <button
            onClick={() => setActiveTab('CONTRATS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'CONTRATS'
                ? 'bg-indigo-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            📋 Contrats B2B ({contracts.length})
          </button>
          <button
            onClick={() => setActiveTab('COMMERCIAUX')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'COMMERCIAUX'
                ? 'bg-emerald-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <UserCheck className="w-3.5 h-3.5" />
            👔 Dotations Commerciaux ({commerciauxData.length})
          </button>
          <button
            onClick={() => setActiveTab('RETOURS_INVENDUS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
              activeTab === 'RETOURS_INVENDUS'
                ? 'bg-purple-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            🔄 Retours Invendus ({returnVouchers.length})
          </button>
          <button
            onClick={() => setActiveTab('ENCAISSEMENTS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'ENCAISSEMENTS'
                ? 'bg-amber-600 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            💳 Règlements ({paymentRecords.length})
          </button>
          <button
            onClick={() => setActiveTab('LIVRAISONS')}
            className={`px-3.5 sm:px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === 'LIVRAISONS'
                ? 'bg-blue-700 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            🚚 Bons Livraison ({deliveryNotes.length})
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
        <div className="space-y-3">
          {/* 1. VUE MOBILE EN CARTES (sm:hidden) */}
          <div className="sm:hidden space-y-3">
            {invoices.map((inv) => {
              const totalFard = inv.articles.reduce((sum, a) => sum + a.fardeaux, 0);

              return (
                <div key={inv.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
                  {/* Ligne 1 : Numéro, date et badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="font-mono font-black text-slate-900 text-sm">{inv.numero}</div>
                      <div className="text-[10px] text-slate-400 font-mono mt-0.5">{inv.numeroBL} • {inv.date}</div>
                    </div>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      inv.statutPaiement === 'PAYE'
                        ? 'bg-emerald-100 text-emerald-800'
                        : inv.statutPaiement === 'ACOMPTE'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {inv.statutPaiement}
                    </span>
                  </div>

                  {/* Ligne 2 : Client & Format */}
                  <div className="p-2.5 rounded-xl bg-slate-50 border border-slate-100 text-xs">
                    <div className="font-bold text-slate-900 flex items-center justify-between">
                      <span>{inv.clientNom}</span>
                      <span className="text-[10px] text-slate-500 font-normal">Région {inv.clientRegion}</span>
                    </div>
                    <div className="mt-1 text-indigo-700 font-semibold flex items-center justify-between">
                      <span>{totalFard} fardeaux (lots de 100)</span>
                      <span className="text-[10px] text-slate-500 font-normal">
                        {inv.articles.map(a => `${a.fardeaux} ${a.format.replace('_', ' ')}`).join(', ')}
                      </span>
                    </div>
                  </div>

                  {/* Ligne 3 : Montant total, acompte et reste */}
                  <div className="flex items-center justify-between text-xs pt-1">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Montant Total</span>
                      <span className="font-black text-slate-900 text-sm font-mono">{inv.totalTTC.toLocaleString()} FCFA</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Acompte / Reste</span>
                      <span className="font-bold text-emerald-600 block">{inv.acompteVerse.toLocaleString()} F</span>
                      {inv.soldeRestant > 0 && (
                        <span className="text-[10px] text-red-600 font-bold block">Reste : {inv.soldeRestant.toLocaleString()} F</span>
                      )}
                    </div>
                  </div>

                  {/* Ligne 4 : Boutons d'action */}
                  <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-1.5">
                    <span className="text-[10px] text-slate-500 font-medium">
                      Mode : <strong className="text-slate-700">{inv.modePaiementPrefere}</strong>
                    </span>
                    <div className="flex items-center gap-1">
                      {inv.soldeRestant > 0 && (
                        <button
                          onClick={() => {
                            setShowPaymentModal(inv);
                            setPaymentForm({
                              montantFCFA: inv.soldeRestant,
                              modePaiement: inv.modePaiementPrefere || 'Wave',
                              reference: '',
                              compteCreditee: 'Wave Business',
                              observations: ''
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                          title="Enregistrer un paiement (CDC 7.6)"
                        >
                          <Banknote className="w-3 h-3" />
                          Régler
                        </button>
                      )}
                      {inv.statutCommande !== 'LIVREE' && (
                        <button
                          onClick={() => {
                            setShowDeliveryModal(inv);
                            setDeliveryForm({
                              dateLivraisonPrevue: new Date().toISOString().split('T')[0],
                              responsableLivraison: 'Chauffeur Usine',
                              chauffeurNom: inv.chauffeurNom || '',
                              camionImmatriculation: inv.camionImmatriculation || '',
                              observations: ''
                            });
                          }}
                          className="px-2 py-1 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs"
                          title="Créer Bon de Livraison (CDC 7.7)"
                        >
                          <Truck className="w-3 h-3" />
                          BL
                        </button>
                      )}
                      <button
                        onClick={() => handleShareInvoiceWhatsApp(inv)}
                        className="px-2 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs active:scale-95"
                        title="Partager par WhatsApp au client"
                      >
                        <MessageCircle className="w-3 h-3 text-white" />
                        WhatsApp
                      </button>
                      <button
                        onClick={() => setSelectedInvoiceForView(inv)}
                        className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 text-white font-bold text-[10px] flex items-center gap-1 shadow-xs active:scale-95"
                      >
                        <FileText className="w-3 h-3 text-amber-400" />
                        Facture
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* 2. VUE BUREAU / TABLETTE (hidden sm:block) */}
          <div className="hidden sm:block bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[700px]">
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
                          <div className="flex items-center justify-center gap-1.5">
                            {inv.soldeRestant > 0 && (
                              <button
                                onClick={() => {
                                  setShowPaymentModal(inv);
                                  setPaymentForm({
                                    montantFCFA: inv.soldeRestant,
                                    modePaiement: inv.modePaiementPrefere || 'Wave',
                                    reference: '',
                                    compteCreditee: 'Wave Business',
                                    observations: ''
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                                title="Enregistrer un Règlement / Paiement (CDC 7.6)"
                              >
                                <Banknote className="w-4 h-4" />
                              </button>
                            )}
                            {inv.statutCommande !== 'LIVREE' && (
                              <button
                                onClick={() => {
                                  setShowDeliveryModal(inv);
                                  setDeliveryForm({
                                    dateLivraisonPrevue: new Date().toISOString().split('T')[0],
                                    responsableLivraison: 'Chauffeur Usine',
                                    chauffeurNom: inv.chauffeurNom || '',
                                    camionImmatriculation: inv.camionImmatriculation || '',
                                    observations: ''
                                  });
                                }}
                                className="p-1.5 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 transition-colors"
                                title="Créer le Bon de Livraison Officiel (CDC 7.7)"
                              >
                                <Truck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleShareInvoiceWhatsApp(inv)}
                              className="p-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 transition-colors"
                              title="Partager le récapitulatif Facture / Reste dû par WhatsApp"
                            >
                              <MessageCircle className="w-4 h-4 text-emerald-600" />
                            </button>
                            <button
                              onClick={() => setSelectedInvoiceForView(inv)}
                              className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                              title="Voir & Imprimer Facture / BL"
                            >
                              <FileText className="w-4 h-4" />
                            </button>
                            <button
                              onClick={async () => {
                                try {
                                  await exportInvoicePdf(inv, currentTheme.hex);
                                } catch (e) {
                                  console.error('Erreur export facture:', e);
                                }
                              }}
                              className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 transition-colors"
                              title="Télécharger directement la Facture PDF A4"
                            >
                              <Download className="w-4 h-4" />
                            </button>
                          </div>
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

      {/* Vue Répertoire Clients B2B */}
      {activeTab === 'CLIENTS' && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
            <div>
              <h3 className="text-sm font-black text-slate-900">Portefeuille Clients Industriels & Grossistes</h3>
              <p className="text-xs text-slate-500">{clients.length} compte(s) client(s) actif(s)</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowImportClientsModal(true)}
                className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-all shadow-xs active:scale-95"
              >
                <Upload className="w-3.5 h-3.5 text-indigo-600" />
                Importer Clients (CSV / Excel)
              </button>
              <button
                type="button"
                onClick={() => setShowNewClientModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-amber-400 text-xs font-black transition-all shadow-md active:scale-95"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                Nouveau Client
              </button>
            </div>
          </div>

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
                  <UserCheck className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-800">{c.contactNom}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                  <span className="font-semibold text-slate-900">{c.telephone}</span>
                </div>
                <div className="flex items-start gap-2">
                  <MapPin className="w-3.5 h-3.5 text-indigo-500 shrink-0 mt-0.5" />
                  <div>
                    <span className="font-medium text-slate-700">
                      {c.quartier ? `${c.quartier}, ` : ''}
                      {c.commune ? `${c.commune} ` : ''}
                      {c.departement ? `(${c.departement})` : c.adresse || c.region}
                    </span>
                    {c.adresse && c.adresse !== c.quartier && (
                      <p className="text-[10px] text-slate-400 mt-0.5">{c.adresse}</p>
                    )}
                  </div>
                </div>

                {/* Coordonnées GPS de la ferme avicole */}
                {(c.coordonneesGPS || c.latitude) && (
                  <div className="pt-1">
                    <a
                      href={`https://maps.google.com/?q=${c.coordonneesGPS?.latitude || c.latitude},${c.coordonneesGPS?.longitude || c.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold border border-indigo-200 transition-colors"
                      title="Localiser la ferme sur Google Maps"
                    >
                      <Compass className="w-3 h-3 text-indigo-600" />
                      <span>GPS: {(c.coordonneesGPS?.latitude || c.latitude)?.toString().slice(0, 7)}, {(c.coordonneesGPS?.longitude || c.longitude)?.toString().slice(0, 8)}</span>
                      <ExternalLink className="w-2.5 h-2.5 opacity-60" />
                    </a>
                  </div>
                )}
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
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Contrats Commerciaux B2B (CDC Section 7.2) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'CONTRATS' && (
        <div className="space-y-5">
          {/* En-tête Contrats & Action Création */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-indigo-950 via-slate-900 to-indigo-900 text-white p-5 rounded-3xl border border-indigo-800/60 shadow-lg">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-500/40 flex items-center gap-1">
                  <FileSignature className="w-3.5 h-3.5" />
                  Section 7.2 du Cahier des Charges
                </span>
                <span className="text-xs text-slate-400">• Points de Contrat B2B & Engagements Fermes</span>
              </div>
              <h2 className="text-lg sm:text-xl font-black">
                Contrats Commerciaux & Objectifs de Couverture
              </h2>
              <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl">
                Suivi des volumes mensuels convenus, livraisons effectuées, solde restant à livrer et taux de couverture des exploitations avicoles partenaires.
              </p>
            </div>
            <button
              onClick={() => setShowNewContractModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouveau Contrat B2B
            </button>
          </div>

          {/* KPIs contrats */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Contrats Actifs</span>
              <div className="text-3xl font-black text-indigo-700 mt-2">{contracts.filter(c => c.statut === 'EN_COURS').length}</div>
              <p className="text-xs text-slate-500 mt-1">{contracts.length} contrats au total</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Volume Livré Total</span>
              <div className="text-3xl font-black text-emerald-600 mt-2">{totalVolLivreLots.toLocaleString()}</div>
              <p className="text-xs text-slate-500 mt-1">lots sur {totalVolContractuelLots.toLocaleString()} contractuels</p>
            </div>
            <div className="bg-white rounded-xl p-5 border border-slate-200 shadow-sm">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">Taux de Couverture</span>
              <div className={`text-3xl font-black mt-2 ${
                tauxCouvertureContrats >= 75 ? 'text-emerald-600' :
                tauxCouvertureContrats >= 50 ? 'text-amber-600' : 'text-red-600'
              }`}>{tauxCouvertureContrats}%</div>
              <div className="w-full bg-slate-100 rounded-full h-1.5 mt-2">
                <div
                  className={`h-1.5 rounded-full ${
                    tauxCouvertureContrats >= 75 ? 'bg-emerald-500' :
                    tauxCouvertureContrats >= 50 ? 'bg-amber-500' : 'bg-red-500'
                  }`}
                  style={{ width: `${Math.min(100, tauxCouvertureContrats)}%` }}
                />
              </div>
            </div>
          </div>

          {/* Table des contrats avec Vue Mobile en Cartes */}
          <div className="space-y-3">
            {/* 1. VUE MOBILE EN CARTES (sm:hidden) */}
            <div className="sm:hidden space-y-3">
              {contracts.map((ctr) => {
                const couv = ctr.volumeTotalContractuelLots > 0
                  ? Math.round((ctr.volumeLivreLots / ctr.volumeTotalContractuelLots) * 100)
                  : 0;

                return (
                  <div key={ctr.id} className="bg-white rounded-2xl p-4 border border-slate-200/90 shadow-sm space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="font-mono font-black text-slate-900 text-sm">{ctr.numeroContrat}</div>
                        <div className="text-[11px] font-bold text-slate-800 mt-0.5">{ctr.clientNom}</div>
                        <div className="text-[10px] text-slate-400">{ctr.dateDebut} → {ctr.dateFin} ({ctr.dureeMois} mois)</div>
                      </div>
                      <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold shrink-0 ${
                        ctr.statut === 'EN_COURS' ? 'bg-emerald-100 text-emerald-800' :
                        ctr.statut === 'EN_RENOUVELLEMENT' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-600'
                      }`}>
                        {ctr.statut}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 p-2.5 bg-slate-50 rounded-xl text-center">
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Vol. Mensuel</span>
                        <span className="font-extrabold text-indigo-700 text-xs">{ctr.volumeMensuelLots.toLocaleString()} lots</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Livré</span>
                        <span className="font-extrabold text-emerald-600 text-xs">{ctr.volumeLivreLots.toLocaleString()} lots</span>
                      </div>
                      <div>
                        <span className="text-[9px] text-slate-400 block uppercase font-medium">Restant</span>
                        <span className="font-extrabold text-amber-600 text-xs">{ctr.volumeRestantLots.toLocaleString()} lots</span>
                      </div>
                    </div>

                    {/* Jauge de couverture */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-[11px]">
                        <span className="text-slate-500 font-medium">Couverture contractuelle :</span>
                        <span className={`font-black ${couv >= 75 ? 'text-emerald-600' : couv >= 50 ? 'text-amber-600' : 'text-red-600'}`}>
                          {couv}%
                        </span>
                      </div>
                      <div className="w-full bg-slate-100 rounded-full h-2">
                        <div
                          className={`h-2 rounded-full ${
                            couv >= 75 ? 'bg-emerald-500' : couv >= 50 ? 'bg-amber-400' : 'bg-red-500'
                          }`}
                          style={{ width: `${Math.min(100, couv)}%` }}
                        />
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[10px] text-slate-500">
                      <span>Tarif : <strong className="text-indigo-600 font-mono">35 F/alv = 3 500 F/paquet 100</strong></span>
                      <span>Livraison : <strong className="text-slate-700">{ctr.frequenceLivraison}</strong></span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* 2. VUE BUREAU / TABLETTE (hidden sm:block) */}
            <div className="hidden sm:block bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-100 flex items-center gap-2">
                <FileSignature className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-slate-900 text-sm">Contrats Commerciaux B2B — Prix Contractuel : 35 FCFA/alvéole = 3 500 FCFA/paquet de 100</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[800px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">N° Contrat</th>
                      <th className="py-3 px-4">Client</th>
                      <th className="py-3 px-4 text-center">Durée</th>
                      <th className="py-3 px-4 text-right">Vol. Mensuel</th>
                      <th className="py-3 px-4 text-right">Livré</th>
                      <th className="py-3 px-4 text-right">Restant</th>
                      <th className="py-3 px-4 text-center">Couverture</th>
                      <th className="py-3 px-4 text-center">Statut</th>
                      <th className="py-3 px-4">Fréquence Livraison</th>
                      <th className="py-3 px-4">Paiement</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {contracts.map((ctr) => {
                      const couv = ctr.volumeTotalContractuelLots > 0
                        ? Math.round((ctr.volumeLivreLots / ctr.volumeTotalContractuelLots) * 100)
                        : 0;
                      return (
                        <tr key={ctr.id} className="hover:bg-slate-50/80">
                          <td className="py-3 px-4">
                            <span className="font-mono font-bold text-slate-900">{ctr.numeroContrat}</span>
                            <span className="block text-[10px] text-slate-400">{ctr.dateDebut} → {ctr.dateFin}</span>
                          </td>
                          <td className="py-3 px-4">
                            <div className="font-bold text-slate-900">{ctr.clientNom}</div>
                            <div className="text-[10px] text-indigo-600 font-mono">{ctr.prixContractuelAlveole} F/alv = {ctr.prixContractuelLot.toLocaleString()} F/lot</div>
                          </td>
                          <td className="py-3 px-4 text-center font-semibold">{ctr.dureeMois} mois</td>
                          <td className="py-3 px-4 text-right">
                            <span className="font-bold text-indigo-700">{ctr.volumeMensuelLots.toLocaleString()} lots</span>
                            <span className="block text-[10px] text-slate-400">{(ctr.volumeMensuelLots * 100).toLocaleString()} alv/mois</span>
                          </td>
                          <td className="py-3 px-4 text-right font-bold text-emerald-600">{ctr.volumeLivreLots.toLocaleString()} lots</td>
                          <td className="py-3 px-4 text-right font-bold text-amber-600">{ctr.volumeRestantLots.toLocaleString()} lots</td>
                          <td className="py-3 px-4 text-center">
                            <div className="flex flex-col items-center gap-1">
                              <span className={`font-black text-sm ${
                                couv >= 75 ? 'text-emerald-600' : couv >= 50 ? 'text-amber-600' : 'text-red-600'
                              }`}>{couv}%</span>
                              <div className="w-16 bg-slate-100 rounded-full h-1.5">
                                <div
                                  className={`h-1.5 rounded-full ${
                                    couv >= 75 ? 'bg-emerald-500' : couv >= 50 ? 'bg-amber-400' : 'bg-red-500'
                                  }`}
                                  style={{ width: `${Math.min(100, couv)}%` }}
                                />
                              </div>
                            </div>
                          </td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                              ctr.statut === 'EN_COURS' ? 'bg-emerald-100 text-emerald-800' :
                              ctr.statut === 'EN_RENOUVELLEMENT' ? 'bg-amber-100 text-amber-800' :
                              'bg-slate-100 text-slate-600'
                            }`}>{ctr.statut}</span>
                          </td>
                          <td className="py-3 px-4 text-xs text-slate-600">{ctr.frequenceLivraison}</td>
                          <td className="py-3 px-4 text-xs text-slate-600">{ctr.conditionsPaiement}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

          {/* Note tarifaire */}
          <div className="bg-indigo-50 border border-indigo-200 rounded-xl p-4 text-xs text-indigo-800">
            <strong>📌 Rappel Tarifaire (CDC Section 7.2) :</strong> Clients contractuels ={' '}
            <strong>35 FCFA/alvéole = 3 500 FCFA/paquet de 100</strong>. Marché spot ={' '}
            <strong>35 FCFA/alvéole = 3 500 FCFA/lot de 100</strong>. Distinction obligatoire sur chaque facture.
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Suivi des Commerciaux & Stocks Détenus (CDC Section 7.8) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'COMMERCIAUX' && (
        <div className="space-y-5">
          {/* En-tête explicatif & Commissions */}
          <div className="bg-gradient-to-r from-emerald-950 via-slate-900 to-emerald-900 text-white p-5 rounded-3xl border border-emerald-800/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                    <Users2 className="w-3.5 h-3.5" />
                    Section 7.8 & Annexe Primes du Cahier des Charges
                  </span>
                  <span className="text-xs text-slate-400">• Force de Vente & Primes de Performance</span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl">Suivi des Commerciaux & Commissions sur Ventes</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Traçabilité du stock individuel confié (Bons de Sortie), déduction des retours contrôlés et calcul automatique des <strong>commissions commerciales</strong> au barème de <strong>70 FCFA par fardeau vendu</strong> (2% du volume facturé à 3 500 FCFA).
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-end sm:items-center gap-3">
                {/* KPI Total Commissions Dues */}
                <div className="bg-emerald-900/40 border border-emerald-500/30 rounded-2xl p-4 text-right shrink-0">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase tracking-wider block">Total Commissions Force de Vente</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {totalCommissionsDues.toLocaleString()} <span className="text-xs font-semibold text-emerald-400">FCFA</span>
                  </div>
                  <span className="text-[10px] text-emerald-300">Sur l'ensemble des lots vendus</span>
                </div>

                <button
                  onClick={() => {
                    setExitForm(prev => ({ ...prev, produitId: products[0]?.id || '' }));
                    setShowExitVoucherModal(true);
                  }}
                  className="px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center gap-2 shadow-lg active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  + Nouveau Bon de Sortie
                </button>
              </div>
            </div>
          </div>

          {commerciauxData.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <Users2 className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun bon de sortie commercial enregistré.</p>
              <p className="text-xs mt-1">Créez des bons de sortie depuis le module Stock → Sorties Commerciaux.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {commerciauxData.map((com) => {
                const sortiesComm = exitVouchers.filter(v => v.commercialId === com.comId);
                const retoursComm = returnVouchers.filter(v => v.commercialId === com.comId);
                return (
                  <div key={com.comId} className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                    {/* Header commercial */}
                    <div className="flex items-center justify-between p-5 bg-slate-50 border-b border-slate-100">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-emerald-600 text-white flex items-center justify-center font-black text-sm">
                          {com.nom.split(' ').map(w => w[0]).slice(0, 2).join('')}
                        </div>
                        <div>
                          <div className="font-black text-slate-900">{com.nom}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{com.comId}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                          com.stockDetenu > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
                        }`}>
                          {com.stockDetenu > 0 ? `${com.stockDetenu} lots en cours` : 'Stock soldé'}
                        </span>
                      </div>
                    </div>

                    {/* KPIs commercial avec Commissions (CDC Section 7.8) */}
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-0 divide-x divide-slate-100">
                      <div className="p-4">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">1. Lots Remis</div>
                        <div className="text-2xl font-black text-indigo-700 mt-1">{com.totalSorti}</div>
                        <div className="text-[10px] text-slate-400">Total sorties usine</div>
                      </div>
                      <div className="p-4">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">2. Retours Invendus</div>
                        <div className="text-2xl font-black text-slate-700 mt-1">{com.totalRetour}</div>
                        <div className="text-[10px] text-slate-400">Lots réintégrés</div>
                      </div>
                      <div className="p-4">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">3. Stock Détenu</div>
                        <div className={`text-2xl font-black mt-1 ${
                          com.stockDetenu > 0 ? 'text-amber-600' : 'text-emerald-600'
                        }`}>{com.stockDetenu}</div>
                        <div className="text-[10px] text-slate-400">En cours terrain</div>
                      </div>
                      <div className="p-4">
                        <div className="text-[10px] font-semibold text-slate-500 uppercase">4. Ventes Réalisées</div>
                        <div className="text-2xl font-black text-emerald-600 mt-1">{com.venteEstimee}</div>
                        <div className="text-[10px] text-slate-400">CA: {com.caEstime.toLocaleString()} F</div>
                      </div>
                      <div className="p-4 bg-emerald-50/50">
                        <div className="text-[10px] font-bold text-emerald-800 uppercase flex items-center justify-between">
                          <span>5. Commission Dûe</span>
                          <span className="text-[9px] px-1.5 py-0.2 bg-emerald-200 text-emerald-900 rounded font-bold">2%</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-700 mt-1">{com.commissionAcquise.toLocaleString()}</div>
                        <div className="text-[10px] text-emerald-600 font-semibold">FCFA @ 70 F/paquet</div>
                      </div>
                    </div>

                    {/* Historique des bons */}
                    {sortiesComm.length > 0 && (
                      <div className="p-4 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          <Truck className="w-3.5 h-3.5" /> Bons de Sortie
                        </div>
                        <div className="space-y-1.5">
                          {sortiesComm.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs bg-indigo-50 px-3 py-2 rounded-lg">
                              <span className="font-mono text-indigo-700 font-bold">{v.numeroBon}</span>
                              <span className="text-slate-600">{v.date}</span>
                              <span className="font-bold text-indigo-900">{v.quantiteLots} lots ({(v.quantiteLots * 100).toLocaleString()} alv)</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.statut === 'CONFIRME_PAR_COMMERCIAL' ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>{v.statut}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {retoursComm.length > 0 && (
                      <div className="p-4 border-t border-slate-100">
                        <div className="text-xs font-bold text-slate-700 mb-2 flex items-center gap-1.5">
                          <RotateCcw className="w-3.5 h-3.5" /> Bons de Retour Invendus
                        </div>
                        <div className="space-y-1.5">
                          {retoursComm.map((v) => (
                            <div key={v.id} className="flex items-center justify-between text-xs bg-amber-50 px-3 py-2 rounded-lg">
                              <span className="font-mono text-amber-700 font-bold">{v.numeroRetour}</span>
                              <span className="text-slate-600">{v.date}</span>
                              <span className="font-bold text-amber-900">{v.quantiteLots} lots retournés</span>
                              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                v.statut === 'ACCEPTE_CONFORME' ? 'bg-emerald-100 text-emerald-700' :
                                v.statut === 'EN_ATTENTE_CONTROLE' ? 'bg-amber-100 text-amber-700' :
                                'bg-red-100 text-red-700'
                              }`}>{v.statut}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Table des Bons de Sortie vers Commerciaux */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <Truck className="w-4.5 h-4.5 text-emerald-600" />
                  Journal des Bons de Sortie (Dotations Tournées Commerciaux)
                </h4>
                <p className="text-xs text-slate-500">Alvéoles sorties du magasin PF et confiées aux commerciaux pour vente directe ou tournée</p>
              </div>
              <button
                onClick={() => {
                  setExitForm(prev => ({ ...prev, produitId: products[0]?.id || '' }));
                  setShowExitVoucherModal(true);
                }}
                className="px-3.5 py-1.5 rounded-xl bg-emerald-100 hover:bg-emerald-200 text-emerald-800 font-bold text-xs flex items-center gap-1.5 self-start sm:self-auto"
              >
                <Plus className="w-3.5 h-3.5" />
                Nouvelle Sortie
              </button>
            </div>

            {exitVouchers.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-xs">
                Aucun bon de sortie commercial enregistré pour le moment.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-2xl border border-slate-100">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-100">
                    <tr>
                      <th className="py-3 px-4">N° Bon & Date</th>
                      <th className="py-3 px-4">Commercial</th>
                      <th className="py-3 px-4">Produit Confié</th>
                      <th className="py-3 px-4 text-center">Quantité Lots</th>
                      <th className="py-3 px-4 text-center">Unités</th>
                      <th className="py-3 px-4">Magasinier</th>
                      <th className="py-3 px-4">Observations</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {exitVouchers.map(v => (
                      <tr key={v.id} className="hover:bg-slate-50/80">
                        <td className="py-3 px-4 font-mono font-bold text-slate-900">{v.numeroBon} <span className="text-[10px] text-slate-400 font-normal">({v.date})</span></td>
                        <td className="py-3 px-4 font-bold text-emerald-700">{v.commercialNom}</td>
                        <td className="py-3 px-4 text-slate-800 font-medium">{v.produitNom}</td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">{v.quantiteLots} lots</td>
                        <td className="py-3 px-4 text-center text-slate-600 font-medium">{(v.quantiteLots * 100).toLocaleString('fr-FR')} pcs</td>
                        <td className="py-3 px-4 text-slate-500">{v.magasinierNom}</td>
                        <td className="py-3 px-4 text-slate-500 text-[11px]">{v.observations || '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Retours des Invendus & Procédure de Contrôle Commercial */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'RETOURS_INVENDUS' && (() => {
        const totalLotsRetournes = returnVouchers.reduce((s, r) => s + (r.quantiteLots || 0), 0);
        const lotsConformesReintegres = returnVouchers.filter(r => r.statut === 'ACCEPTE_CONFORME').reduce((s, r) => s + (r.quantiteLots || 0), 0);
        const lotsRecyclesPulpeur = returnVouchers.filter(r => r.statut === 'NON_CONFORME_RECYCLE').reduce((s, r) => s + (r.quantiteLots || 0), 0);

        return (
          <div className="space-y-5">
            {/* Bannière Header */}
            <div className="bg-gradient-to-r from-purple-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-purple-800/60 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/40 flex items-center gap-1">
                      <RotateCcw className="w-3.5 h-3.5" />
                      Section 6.7 & Logistique Retour
                    </span>
                    <span className="text-xs text-slate-400">• Clôture de Tournée & Régularisation Vente</span>
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-xl">Retours des Invendus de Tournée Commerciale</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Enregistrement des alvéoles non vendues rapportées par les commerciaux. Le contrôle qualité détermine la <strong>réintégration en stock conforme</strong> ou le <strong>recyclage au pulpeur</strong> (matière première).
                  </p>
                </div>

                <button
                  onClick={() => {
                    setReturnForm(prev => ({ ...prev, produitId: products[0]?.id || '' }));
                    setShowReturnVoucherModal(true);
                  }}
                  className="px-4 py-2.5 rounded-2xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs flex items-center gap-2 shadow-md active:scale-95 shrink-0"
                >
                  <Plus className="w-4 h-4" />
                  + Nouveau Retour Commercial
                </button>
              </div>

              {/* 3 Indicateurs Synthétiques */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-purple-800/50">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-purple-300 uppercase block">Total Invendus Rapportés</span>
                  <div className="text-2xl font-black text-white mt-0.5">{totalLotsRetournes.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">lots</span></div>
                  <span className="text-[10px] text-slate-400">{(totalLotsRetournes * 100).toLocaleString('fr-FR')} alvéoles</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase block">Réintégrés Conformes</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">{lotsConformesReintegres.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">lots</span></div>
                  <span className="text-[10px] text-slate-400">Remis en stock usine</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Recyclés au Pulpeur</span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">{lotsRecyclesPulpeur.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">lots</span></div>
                  <span className="text-[10px] text-slate-400">Déclassés ou abîmés</span>
                </div>
              </div>
            </div>

            {/* Table des Retours */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                  <RotateCcw className="w-4.5 h-4.5 text-purple-600" />
                  Journal des Bons de Retour Commercial
                </h4>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {returnVouchers.length} retour(s)
                </span>
              </div>

              {returnVouchers.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aucun bon de retour invendus enregistré. Cliquez sur « + Nouveau Retour Commercial » pour régulariser une fin de tournée.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs min-w-[700px]">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">N° Retour & Date</th>
                        <th className="py-3 px-4">Commercial</th>
                        <th className="py-3 px-4">Produit & Lots</th>
                        <th className="py-3 px-4">Motif</th>
                        <th className="py-3 px-4 text-center">Statut / Décision</th>
                        <th className="py-3 px-4">Contrôleur / Magasinier</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {returnVouchers.map(r => (
                        <tr key={r.id} className="hover:bg-slate-50">
                          <td className="py-3 px-4 font-mono font-bold text-slate-900">{r.numeroRetour} <span className="text-[10px] text-slate-400 font-normal">({r.date})</span></td>
                          <td className="py-3 px-4 font-bold text-purple-700">{r.commercialNom}</td>
                          <td className="py-3 px-4 font-semibold text-slate-800">{r.quantiteLots} lots de {r.produitNom}</td>
                          <td className="py-3 px-4 text-slate-600">{r.motif}</td>
                          <td className="py-3 px-4 text-center">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                              r.statut === 'ACCEPTE_CONFORME' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : r.statut === 'NON_CONFORME_RECYCLE' 
                                ? 'bg-amber-100 text-amber-800' 
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {r.statut === 'ACCEPTE_CONFORME' ? '✓ Conforme (Stock Usine)' : r.statut === 'NON_CONFORME_RECYCLE' ? '♻️ Recyclé au Pulpeur' : r.statut}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-slate-500">{r.magasinierNom}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Stock & Disponibilité Produits Finis pour la Vente */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'PRODUITS_FINIS' && (() => {
        const totalFardeauxDispo = products.reduce((s, p) => s + (p.stockFardeaux || 0), 0);
        const totalAlveolesDispo = products.reduce((s, p) => s + (p.stockTotalUnites || 0), 0);
        const valeurStockVente = totalFardeauxDispo * 3500;

        return (
          <div className="space-y-5">
            {/* Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-blue-800/60 shadow-lg">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5" />
                      Disponibilité Usine en Temps Réel
                    </span>
                    <span className="text-xs text-slate-400">• Catalogue & Délais de Livraison</span>
                  </div>
                  <h3 className="font-extrabold text-lg sm:text-xl">Stock Produits Finis Disponible à la Vente</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Volume de fardeaux d'alvéoles immédiatement livrables aux fermes avicoles et grossistes. Tarif standard : <strong>3 500 FCFA le paquet de 100 unités</strong> (35 FCFA / alvéole).
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      setExitForm(prev => ({ ...prev, produitId: products[0]?.id || '' }));
                      setShowExitVoucherModal(true);
                    }}
                    className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <Truck className="w-4 h-4" />
                    Dotation Commercial
                  </button>
                  <button
                    onClick={() => setShowNewOrderModal(true)}
                    className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs flex items-center gap-2 shadow-md active:scale-95"
                  >
                    <Plus className="w-4 h-4" />
                    Nouvelle Commande
                  </button>
                </div>
              </div>

              {/* KPIs */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-5 pt-4 border-t border-blue-800/50">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-blue-300 uppercase block">Fardeaux Disponibles</span>
                  <div className="text-2xl font-black text-white mt-0.5">{totalFardeauxDispo.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">paquets</span></div>
                  <span className="text-[10px] text-slate-400">Conditionnés par 100</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase block">Alvéoles Livrables</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">{totalAlveolesDispo.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">unités</span></div>
                  <span className="text-[10px] text-slate-400">Prêtes pour expédition</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Valeur Marchande</span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">{valeurStockVente.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">FCFA</span></div>
                  <span className="text-[10px] text-slate-400">Tarif catalogue officiel</span>
                </div>
              </div>
            </div>

            {/* Cartes Produits */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => {
                const fard = p.stockFardeaux || 0;
                const unites = p.stockTotalUnites || 0;
                const alerte = fard <= (p.seuilAlerteFardeaux || 50);

                return (
                  <div key={p.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.reference}</span>
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Format {p.format}</span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-2">{p.nom}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs text-slate-500">Stock Livrable :</span>
                        <span className="text-2xl font-black text-slate-900">{fard.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-400">fardeaux</span></span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Unités totales :</span>
                        <span className="font-bold text-slate-800">{unites.toLocaleString('fr-FR')} pcs</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-1.5 border-t border-dashed border-slate-200">
                        <span className="text-slate-500">Prix de vente :</span>
                        <span className="font-black text-emerald-700">3 500 FCFA / lot</span>
                      </div>

                      <div className="pt-2 flex gap-2">
                        <button
                          onClick={() => {
                            setOrderItems([{ produitId: p.id, fardeaux: 50, remisePourcent: 0 }]);
                            setShowNewOrderModal(true);
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-900 font-bold text-[11px] text-center"
                        >
                          Commander
                        </button>
                        <button
                          onClick={() => {
                            setExitForm(prev => ({ ...prev, produitId: p.id, quantiteLots: 20 }));
                            setShowExitVoucherModal(true);
                          }}
                          className="flex-1 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-900 font-bold text-[11px] text-center"
                        >
                          Doter Commercial
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Journal des Règlements & Encaissements Clients (CDC 7.6) */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'ENCAISSEMENTS' && (
        <div className="space-y-5">
          {/* En-tête Encaissements */}
          <div className="bg-gradient-to-r from-amber-950 via-slate-900 to-amber-900 text-white p-5 rounded-3xl border border-amber-800/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                    <Receipt className="w-3.5 h-3.5" />
                    Section 7.6 du Cahier des Charges
                  </span>
                  <span className="text-xs text-slate-400">• Journal des Recettes & Trésorerie Clients</span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl">Règlements & Encaissements Enregistrés</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Historique de tous les flux financiers entrants : acomptes à la commande, règlements échelonnés et soldes de factures d'alvéoles par mode de paiement.
                </p>
              </div>

              {/* KPI Total Encaissé */}
              <div className="bg-amber-900/40 border border-amber-500/30 rounded-2xl p-4 text-right shrink-0">
                <span className="text-[10px] font-bold text-amber-300 uppercase tracking-wider block">Total Règlements Encaissés</span>
                <div className="text-2xl font-black text-white mt-1">
                  {paymentRecords.reduce((s, p) => s + p.montantFCFA, 0).toLocaleString()} <span className="text-xs font-semibold text-amber-400">FCFA</span>
                </div>
                <span className="text-[10px] text-amber-300">{paymentRecords.length} encaissements validés</span>
              </div>
            </div>
          </div>

          {paymentRecords.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <Banknote className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun règlement client enregistré pour le moment.</p>
              <p className="text-xs mt-1">Cliquez sur "Régler" depuis la liste des commandes pour enregistrer un paiement d'acompte ou de solde.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">Date Règlement</th>
                      <th className="py-3 px-4">Facture Liée</th>
                      <th className="py-3 px-4">Client B2B</th>
                      <th className="py-3 px-4">Mode de Paiement</th>
                      <th className="py-3 px-4">Compte Crédité</th>
                      <th className="py-3 px-4 text-right">Montant Encaissé</th>
                      <th className="py-3 px-4">Référence / Reçu</th>
                      <th className="py-3 px-4">Enregistré Par</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {paymentRecords.map((pay) => (
                      <tr key={pay.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono text-slate-600">{pay.date}</td>
                        <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pay.factureNumero}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">{pay.clientNom}</td>
                        <td className="py-3.5 px-4">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            pay.modePaiement === 'Wave' ? 'bg-cyan-100 text-cyan-800' :
                            pay.modePaiement === 'Orange Money' ? 'bg-orange-100 text-orange-800' :
                            pay.modePaiement === 'Virement Bancaire' ? 'bg-indigo-100 text-indigo-800' :
                            pay.modePaiement === 'Chèque' ? 'bg-purple-100 text-purple-800' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {pay.modePaiement}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">{pay.compteCreditee || 'Caisse Usine'}</td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-600 text-sm">
                          +{pay.montantFCFA.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 font-mono text-[11px] text-slate-500">{pay.reference || '—'}</td>
                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">{pay.enregistrePar}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ────────────────────────────────────────────────────────────── */}
      {/* Vue Bons de Livraison & Expéditions Usine (CDC Section 7.7)   */}
      {/* ────────────────────────────────────────────────────────────── */}
      {activeTab === 'LIVRAISONS' && (
        <div className="space-y-5">
          {/* En-tête Livraisons */}
          <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 text-white p-5 rounded-3xl border border-blue-800/60 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                    <Truck className="w-3.5 h-3.5" />
                    Section 7.7 du Cahier des Charges
                  </span>
                  <span className="text-xs text-slate-400">• Expéditions & Déstockage Officiel</span>
                </div>
                <h3 className="font-extrabold text-lg sm:text-xl">Bons de Livraison & Logistique Usine</h3>
                <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                  Chaque livraison dispose d'un BL distinct. La validation du BL certifie la sortie officielle du stock usine et bloque tout double déstockage.
                </p>
              </div>

              {/* KPIs Expéditions */}
              <div className="flex items-center gap-3">
                <div className="bg-blue-900/40 border border-blue-500/30 rounded-2xl p-4 text-right shrink-0">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Fardeaux Expédiés</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {deliveryNotes.reduce((s, d) => s + d.quantitePrevueFardeaux, 0).toLocaleString()} <span className="text-xs font-semibold text-blue-400">fard.</span>
                  </div>
                  <span className="text-[10px] text-blue-300">{deliveryNotes.length} BL émis</span>
                </div>
              </div>
            </div>
          </div>

          {deliveryNotes.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200 p-10 text-center text-slate-400">
              <Truck className="w-12 h-12 mx-auto mb-3 opacity-30" />
              <p className="font-semibold">Aucun bon de livraison émis pour le moment.</p>
              <p className="text-xs mt-1">Créez un BL officiel depuis l'onglet Commandes & Factures pour déclencher l'expédition.</p>
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[750px]">
                  <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                    <tr>
                      <th className="py-3 px-4">N° Bon Livraison</th>
                      <th className="py-3 px-4">Facture</th>
                      <th className="py-3 px-4">Client Destinataire</th>
                      <th className="py-3 px-4">Date Prévue</th>
                      <th className="py-3 px-4">Fardeaux (Lots 100)</th>
                      <th className="py-3 px-4">Chauffeur & Camion</th>
                      <th className="py-3 px-4 text-center">Statut Logistique</th>
                      <th className="py-3 px-4 text-center">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                    {deliveryNotes.map((dl) => (
                      <tr key={dl.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-4 font-mono font-bold text-blue-700">{dl.numeroBL}</td>
                        <td className="py-3.5 px-4 font-mono text-slate-600">{dl.factureNumero}</td>
                        <td className="py-3.5 px-4 font-bold text-slate-900">{dl.clientNom}</td>
                        <td className="py-3.5 px-4 text-slate-600">{dl.dateLivraisonPrevue}</td>
                        <td className="py-3.5 px-4 font-bold text-indigo-700">
                          {dl.quantitePrevueFardeaux} fardeaux
                          <span className="text-[10px] text-slate-400 block font-normal">
                            ({(dl.quantitePrevueFardeaux * 100).toLocaleString()} alvéoles)
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-slate-800 block">{dl.chauffeurNom || 'Chauffeur interne'}</span>
                          <span className="text-[10px] text-slate-400 block font-mono">{dl.camionImmatriculation || 'Véhicule usine'}</span>
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                            dl.statut === 'LIVREE' ? 'bg-emerald-100 text-emerald-800' :
                            dl.statut === 'EXPEDIEE' ? 'bg-blue-100 text-blue-800' :
                            dl.statut === 'REFUSEE' ? 'bg-red-100 text-red-800' :
                            'bg-amber-100 text-amber-800'
                          }`}>
                            {dl.statut === 'LIVREE' ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <Truck className="w-3 h-3 text-blue-600" />}
                            {dl.statut}
                          </span>
                          {dl.stockSortiOfficiel && (
                            <span className="block text-[9px] text-slate-400 mt-0.5">Stock sorti</span>
                          )}
                        </td>
                        <td className="py-3.5 px-4 text-center">
                          {dl.statut !== 'LIVREE' ? (
                            <button
                              onClick={() => handleConfirmDelivery(dl)}
                              className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] inline-flex items-center gap-1 shadow-xs active:scale-95 transition-all"
                              title="Confirmer la réception par le client"
                            >
                              <CheckCircle2 className="w-3 h-3" />
                              Livré
                            </button>
                          ) : (
                            <span className="text-[10px] text-emerald-600 font-bold">
                              ✓ {dl.dateLivraisonEffective || 'Réceptionné'}
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modal Nouvelle Commande */}
      {showNewOrderModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
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
                  const fard = Number(item.fardeaux) || 0;
                  const prixFardeau = prod?.prixFardeauFCFA || 3500;
                  const totalBrut = fard * prixFardeau;
                  const remise = Math.min(REMISE_MAX_POURCENT, Math.max(0, Number(item.remisePourcent) || 0));
                  const montantRemise = Math.round((totalBrut * remise) / 100);
                  const totalNet = totalBrut - montantRemise;

                  return (
                    <div key={idx} className="flex flex-wrap sm:flex-nowrap items-center gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                      <div className="flex-1 min-w-[160px]">
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

                      <div className="w-24">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Fardeaux</label>
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

                      <div className="w-20">
                        <label className="block text-[10px] text-slate-500 font-semibold mb-0.5">Remise (%)</label>
                        <input
                          type="number"
                          min="0"
                          max={REMISE_MAX_POURCENT}
                          value={item.remisePourcent || 0}
                          onChange={e => {
                            const copy = [...orderItems];
                            copy[idx].remisePourcent = Math.min(REMISE_MAX_POURCENT, Math.max(0, Number(e.target.value)));
                            setOrderItems(copy);
                          }}
                          className="w-full text-xs p-2 bg-white rounded-lg border border-slate-200 font-bold text-indigo-700"
                          title={`Remise max autorisée : ${REMISE_MAX_POURCENT}%`}
                        />
                      </div>

                      <div className="w-28 text-right">
                        <span className="block text-[10px] text-slate-400">Total Net</span>
                        <span className="font-black text-slate-900 text-xs">{totalNet.toLocaleString()} F</span>
                        {remise > 0 && (
                          <span className="block text-[9px] text-emerald-600 font-medium">-{montantRemise.toLocaleString()} F</span>
                        )}
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

              {/* ── Section Paiement & Référentiel ─────────────────────── */}
              <div className="bg-gradient-to-r from-emerald-50 to-cyan-50 rounded-xl p-3 border border-emerald-200 space-y-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-emerald-600 text-sm">💳</span>
                  <span className="text-xs font-bold text-emerald-800 uppercase tracking-wide">Référentiel de Paiement</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Acompte Versé (FCFA)</label>
                    <input
                      type="number"
                      value={acompteVerse}
                      onChange={e => setAcompteVerse(Number(e.target.value))}
                      className="w-full text-xs p-2.5 rounded-lg border border-emerald-200 font-bold text-emerald-600 focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Règlement</label>
                    <select
                      value={modePaiement}
                      onChange={e => setModePaiement(e.target.value as PaymentMethod)}
                      className="w-full text-xs p-2.5 rounded-lg border border-emerald-200 font-medium focus:ring-2 focus:ring-emerald-400"
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
                    <label className="block text-xs font-semibold text-slate-700 mb-1">
                      Référence Transaction
                      {modePaiement === 'Wave' && <span className="text-cyan-500 ml-1">(N° Wave TX)</span>}
                      {modePaiement === 'Orange Money' && <span className="text-orange-500 ml-1">(N° OM SN)</span>}
                      {modePaiement === 'Chèque' && <span className="text-purple-500 ml-1">(N° Chèque)</span>}
                      {modePaiement === 'Virement Bancaire' && <span className="text-indigo-500 ml-1">(N° Virement)</span>}
                    </label>
                    <input
                      type="text"
                      value={referencePaiement}
                      onChange={e => setReferencePaiement(e.target.value)}
                      placeholder={
                        modePaiement === 'Wave' ? 'Ex: WAVE-TX-89213' :
                        modePaiement === 'Orange Money' ? 'Ex: OM-SN-45892' :
                        modePaiement === 'Chèque' ? 'Ex: CHQ-10492' :
                        modePaiement === 'Virement Bancaire' ? 'Ex: VIR-BNK-2024-001' :
                        'Référence ou N° pièce'
                      }
                      className="w-full text-xs p-2.5 rounded-lg border border-emerald-200 font-mono focus:ring-2 focus:ring-emerald-400"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Compte Crédité</label>
                    <select
                      value={compteCrediteeAcompte}
                      onChange={e => setCompteCrediteeAcompte(e.target.value as any)}
                      className="w-full text-xs p-2.5 rounded-lg border border-emerald-200 font-medium focus:ring-2 focus:ring-emerald-400"
                    >
                      <option value="Wave Business">Wave Business</option>
                      <option value="Orange Money Pro">Orange Money Pro</option>
                      <option value="Banque Principale">Banque Principale</option>
                      <option value="Caisse Usine">Caisse Usine</option>
                    </select>
                  </div>
                </div>

                {/* Indicateur visuel si référence saisie */}
                {acompteVerse > 0 && referencePaiement.trim() && (
                  <div className="flex items-center gap-2 bg-emerald-100 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-emerald-800">
                    <span>✅</span>
                    <span>Acompte de {Number(acompteVerse).toLocaleString()} FCFA — Réf: <span className="font-mono">{referencePaiement}</span> → {compteCrediteeAcompte}</span>
                  </div>
                )}
                {acompteVerse > 0 && !referencePaiement.trim() && (
                  <div className="flex items-center gap-2 bg-amber-50 rounded-lg px-3 py-1.5 text-[10px] font-semibold text-amber-700">
                    <span>⚠️</span>
                    <span>Acompte saisi sans référence — pensez à renseigner le N° de transaction pour la traçabilité</span>
                  </div>
                )}
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

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-3 z-20 mt-auto">
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Catégorie Client</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Région Principale</label>
                  <select
                    value={newClient.region}
                    onChange={e => {
                      const reg = e.target.value;
                      const deptList = Object.keys((SENEGAL_GEOGRAPHY as any)[reg] || {});
                      const firstDept = deptList[0] || '';
                      const commList = firstDept ? (SENEGAL_GEOGRAPHY as any)[reg]?.[firstDept] || [] : [];
                      setNewClient({
                        ...newClient,
                        region: reg,
                        departement: firstDept,
                        commune: commList[0] || ''
                      });
                    }}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                  >
                    <option value="Thiès">Thiès (Bassin Avicole)</option>
                    <option value="Dakar">Dakar (Marché Consommation)</option>
                    <option value="Diourbel">Diourbel / Touba</option>
                    <option value="Fatick">Fatick</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                  </select>
                </div>
              </div>

              {/* Localisation Fine : Département, Commune & Quartier (Spécification CDC) */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5 text-indigo-600" />
                    Localisation Détaillée de la Ferme / Client
                  </span>
                  <span className="text-[10px] text-slate-500 font-medium">Zone {newClient.region}</span>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Département</label>
                    <select
                      value={newClient.departement}
                      onChange={e => {
                        const dept = e.target.value;
                        const commList = (SENEGAL_GEOGRAPHY as any)[newClient.region]?.[dept] || [];
                        setNewClient({
                          ...newClient,
                          departement: dept,
                          commune: commList[0] || ''
                        });
                      }}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {Object.keys((SENEGAL_GEOGRAPHY as any)[newClient.region] || {}).map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Commune</label>
                    <select
                      value={newClient.commune}
                      onChange={e => setNewClient({ ...newClient, commune: e.target.value })}
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    >
                      {((SENEGAL_GEOGRAPHY as any)[newClient.region]?.[newClient.departement] || []).map((comm: string) => (
                        <option key={comm} value={comm}>{comm}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Quartier / Village</label>
                    <input
                      type="text"
                      value={newClient.quartier}
                      onChange={e => setNewClient({ ...newClient, quartier: e.target.value })}
                      placeholder="Ex: Keur Madaro, Mbour 4..."
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">Adresse / Repère de Livraison</label>
                    <input
                      type="text"
                      value={newClient.adresse}
                      onChange={e => setNewClient({ ...newClient, adresse: e.target.value })}
                      placeholder="Ex: Route Khombole km 4, près château d'eau"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {/* Coordonnées GPS / Latitude & Longitude */}
                <div className="pt-2 border-t border-slate-200">
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-[11px] font-bold text-slate-700 flex items-center gap-1">
                      <Compass className="w-3.5 h-3.5 text-amber-600" />
                      Position GPS (Latitude & Longitude)
                    </label>
                    <button
                      type="button"
                      onClick={handleCaptureGps}
                      disabled={isCapturingGps}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-[10px] font-bold transition-all active:scale-95"
                    >
                      <Crosshair className="w-3 h-3 text-indigo-600" />
                      {isCapturingGps ? 'Capture en cours...' : '📍 Capturer GPS Ferme'}
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <input
                        type="text"
                        value={newClient.latitude}
                        onChange={e => setNewClient({ ...newClient, latitude: e.target.value })}
                        placeholder="Latitude (ex: 14.8821)"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                    <div>
                      <input
                        type="text"
                        value={newClient.longitude}
                        onChange={e => setNewClient({ ...newClient, longitude: e.target.value })}
                        placeholder="Longitude (ex: -17.0234)"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 bg-white font-mono"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-3 z-20 mt-auto">
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
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[95vh] overflow-y-auto overscroll-contain flex flex-col print-clean">
            <div className="flex items-center justify-between pb-4 border-b border-slate-200">

              <div className="flex items-center gap-3">
                <img
                  src="/logo-bs-alveoles.png"
                  alt="BS ALVÉOLES"
                  className="h-12 w-auto max-w-[120px] object-contain rounded-lg border border-slate-100 bg-white p-0.5"
                  onError={(e) => {
                    // Fallback si l'image ne charge pas
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <div>
                  <h3 className="text-lg font-black text-slate-900 tracking-tight">BS ALVÉOLES SUARL</h3>
                  <p className="text-[11px] text-slate-500">Fabrication d'Alvéoles en Pâte Moulée 100% Recyclée • Sénégal</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleShareInvoiceWhatsApp(selectedInvoiceForView)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black shadow-md transition-all active:scale-95"
                  title="Partager le récapitulatif officiel par WhatsApp au client"
                >
                  <MessageCircle className="w-3.5 h-3.5 text-white" />
                  WhatsApp
                </button>
                <button
                  onClick={async () => {
                    try {
                      await exportInvoicePdf(selectedInvoiceForView, currentTheme.hex);
                    } catch (err) {
                      console.error('Erreur export PDF:', err);
                    }
                  }}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-black shadow-md transition-all active:scale-95"
                  title="Télécharger la facture au format PDF A4 officiel"
                >
                  <Download className="w-3.5 h-3.5 text-amber-300" />
                  Télécharger PDF
                </button>
                <button
                  onClick={() => window.print()}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold transition-colors"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Imprimer
                </button>
                <button onClick={() => setSelectedInvoiceForView(null)} className="text-slate-400 hover:text-slate-600 p-1.5 rounded-lg hover:bg-slate-100">✕</button>
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
                <div className="text-[10px] text-amber-700 font-semibold mt-1">
                  Tarif : 3 500 FCFA / paquet de 100
                </div>
              </div>
            </div>

            {/* Table des articles simplifiée & claire pour le client */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs mb-6">
                <thead className="bg-slate-50 text-slate-600 font-bold border-y border-slate-200">
                  <tr>
                    <th className="py-2.5 px-3">Désignation du Produit</th>
                    <th className="py-2.5 px-3 text-right">Quantité (Paquets de 100)</th>
                    <th className="py-2.5 px-3 text-right">Prix / Paquet</th>
                    <th className="py-2.5 px-3 text-right">Total FCFA</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {selectedInvoiceForView.articles.map((art, i) => (
                    <tr key={i} className="hover:bg-slate-50/50">
                      <td className="py-3 px-3">
                        <div className="font-bold text-slate-900">{art.designation}</div>
                        <span className="text-[10px] text-slate-400 font-mono">{art.reference || 'REF-STD'} • Format 30 œufs</span>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <span className="font-bold text-indigo-700 text-sm">
                          {art.fardeaux} paquet{art.fardeaux > 1 ? 's' : ''}
                        </span>
                        <div className="text-[10px] text-slate-400">({(art.fardeaux * 100).toLocaleString()} alvéoles)</div>
                      </td>
                      <td className="py-3 px-3 text-right font-medium text-slate-700">
                        3 500 FCFA
                      </td>
                      <td className="py-3 px-3 text-right font-black text-slate-900 text-sm">
                        {art.totalLigneFCFA.toLocaleString()} FCFA
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

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

      {/* Modal Nouveau Contrat Commercial B2B (CDC Section 7.2) */}
      {showNewContractModal && (
        <div className="fixed inset-0 z-[250] bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-8 shadow-2xl border border-slate-200 space-y-6 my-4 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-start justify-between">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-700 uppercase tracking-wider">
                  CDC Section 7.2 • Contrats B2B
                </span>
                <h3 className="text-xl font-extrabold text-slate-900 mt-1">
                  Nouveau Contrat Commercial Avicole
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Engagement ferme de volume mensuel avec tarif préférentiel contractuel
                </p>
              </div>
              <button
                onClick={() => setShowNewContractModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all font-bold text-sm"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveContract} className="space-y-4">
              {/* Choix du Client B2B */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Exploitation Avicole / Client B2B *
                </label>
                <select
                  required
                  value={newContractForm.clientId}
                  onChange={(e) => setNewContractForm({ ...newContractForm, clientId: e.target.value })}
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                >
                  <option value="">-- Sélectionner une ferme partenaire --</option>
                  {clients.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.raisonSociale} ({c.commune || c.region} - {c.telephone})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Durée du contrat */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Durée de l'Engagement *
                  </label>
                  <select
                    value={newContractForm.dureeMois}
                    onChange={(e) => setNewContractForm({ ...newContractForm, dureeMois: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={6}>6 mois (Semestriel)</option>
                    <option value={12}>12 mois (Annuel standard)</option>
                    <option value={24}>24 mois (Pluriannuel)</option>
                  </select>
                </div>

                {/* Volume Mensuel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Volume Mensuel Convenu (Paquets de 100) *
                  </label>
                  <input
                    type="number"
                    min="50"
                    step="50"
                    required
                    value={newContractForm.volumeMensuelLots}
                    onChange={(e) => setNewContractForm({ ...newContractForm, volumeMensuelLots: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-bold focus:ring-2 focus:ring-indigo-500"
                  />
                  <span className="text-[10px] text-slate-400">
                    = {(Number(newContractForm.volumeMensuelLots) * 100).toLocaleString()} alvéoles/mois
                  </span>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Tarif Contractuel */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Prix Contractuel / Paquet 100 *
                  </label>
                  <select
                    value={newContractForm.prixContractuelLot}
                    onChange={(e) => setNewContractForm({ ...newContractForm, prixContractuelLot: Number(e.target.value) })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-bold text-indigo-700 focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value={3000}>3 000 FCFA / lot (30 FCFA/alvéole - CDC 7.3)</option>
                    <option value={3500}>3 500 FCFA / lot (35 FCFA/alvéole - Standard)</option>
                  </select>
                </div>

                {/* Fréquence de Livraison */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Fréquence de Livraison Prévue *
                  </label>
                  <select
                    value={newContractForm.frequenceLivraison}
                    onChange={(e) => setNewContractForm({ ...newContractForm, frequenceLivraison: e.target.value })}
                    className="w-full text-xs rounded-xl border border-slate-300 p-2.5 bg-white font-medium focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="Hebdomadaire (Camion Usine)">Hebdomadaire (Camion Usine)</option>
                    <option value="Bi-mensuelle (Tous les 15 jours)">Bi-mensuelle (Tous les 15 jours)</option>
                    <option value="Mensuelle (1 grosse livraison)">Mensuelle (1 grosse livraison)</option>
                    <option value="À la demande du client">À la demande du client</option>
                  </select>
                </div>
              </div>

              {/* Conditions de Paiement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Conditions de Règlement B2B *
                </label>
                <input
                  type="text"
                  required
                  value={newContractForm.conditionsPaiement}
                  onChange={(e) => setNewContractForm({ ...newContractForm, conditionsPaiement: e.target.value })}
                  placeholder="Ex: Virement bancaire sous 15 jours fin de mois"
                  className="w-full text-xs rounded-xl border border-slate-300 p-2.5 font-medium focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              {/* Encadré Synthèse du Contrat */}
              <div className="p-4 bg-indigo-50/80 rounded-2xl border border-indigo-200/80 space-y-1.5 text-xs text-indigo-900">
                <div className="font-extrabold flex items-center justify-between">
                  <span>Volume Global Contractualisé :</span>
                  <span className="text-sm font-black text-indigo-800">
                    {(Number(newContractForm.volumeMensuelLots) * Number(newContractForm.dureeMois)).toLocaleString()} paquets
                  </span>
                </div>
                <div className="flex items-center justify-between text-indigo-700">
                  <span>Chiffre d'Affaires Garanti :</span>
                  <span className="font-bold">
                    {(Number(newContractForm.volumeMensuelLots) * Number(newContractForm.dureeMois) * Number(newContractForm.prixContractuelLot)).toLocaleString()} FCFA
                  </span>
                </div>
                <div className="text-[10px] text-indigo-600 pt-1 border-t border-indigo-200/60">
                  Ce contrat alimentera automatiquement le taux de couverture et l'alerte des échéances sur le tableau de bord de la direction.
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-200 flex items-center justify-end gap-3 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowNewContractModal(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold transition-all"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-indigo-700 hover:bg-indigo-600 text-white text-xs font-extrabold shadow-md active:scale-95 transition-all flex items-center gap-1.5"
                >
                  <FileSignature className="w-4 h-4" />
                  Valider & Signer le Contrat
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal d'importation de fichiers CSV/Excel de Clients */}
      {showImportClientsModal && (
        <ImportCsvModal
          type="CLIENTS"
          onClose={() => setShowImportClientsModal(false)}
        />
      )}

      {/* ── Modal Enregistrement Règlement Client (CDC 7.6) ─────────────────── */}
      {showPaymentModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-800">
                  <Banknote className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Enregistrer un Règlement Client</h3>
                  <p className="text-xs text-slate-500 font-mono">Facture {showPaymentModal.numero} • {showPaymentModal.clientNom}</p>
                </div>
              </div>
              <button onClick={() => setShowPaymentModal(null)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-2 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 block">Total Facture</span>
                <span className="font-bold text-slate-900">{showPaymentModal.totalTTC.toLocaleString()} F</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Déjà Encaissé</span>
                <span className="font-bold text-emerald-600">{showPaymentModal.acompteVerse.toLocaleString()} F</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-500 block">Solde Restant Dû</span>
                <span className="font-black text-red-600">{showPaymentModal.soldeRestant.toLocaleString()} F</span>
              </div>
            </div>

            <form onSubmit={handleSavePayment} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Montant à Encaisser (FCFA) *</label>
                <input
                  type="number"
                  min="1"
                  max={showPaymentModal.soldeRestant}
                  required
                  value={paymentForm.montantFCFA || ''}
                  onChange={e => setPaymentForm({ ...paymentForm, montantFCFA: Number(e.target.value) })}
                  className="w-full text-base font-black p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-emerald-500 text-emerald-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mode de Paiement</label>
                  <select
                    value={paymentForm.modePaiement}
                    onChange={e => setPaymentForm({ ...paymentForm, modePaiement: e.target.value as PaymentMethod })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                  >
                    <option value="Wave">Wave</option>
                    <option value="Orange Money">Orange Money</option>
                    <option value="Virement Bancaire">Virement Bancaire</option>
                    <option value="Chèque">Chèque</option>
                    <option value="Espèces">Espèces</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Compte Crédité</label>
                  <select
                    value={paymentForm.compteCreditee}
                    onChange={e => setPaymentForm({ ...paymentForm, compteCreditee: e.target.value as any })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                  >
                    <option value="Wave Business">Wave Business</option>
                    <option value="Orange Money Pro">Orange Money Pro</option>
                    <option value="Banque Principale">Banque Principale</option>
                    <option value="Caisse Usine">Caisse Usine</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Référence Transaction / N° Chèque</label>
                <input
                  type="text"
                  placeholder="Ex: TX-9842718 / CHQ-002910..."
                  value={paymentForm.reference}
                  onChange={e => setPaymentForm({ ...paymentForm, reference: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observations / Notes</label>
                <input
                  type="text"
                  placeholder="Notes de comptabilité..."
                  value={paymentForm.observations}
                  onChange={e => setPaymentForm({ ...paymentForm, observations: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowPaymentModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── Modal Émission Bon de Livraison (CDC 7.7) ────────────────────────── */}
      {showDeliveryModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-900/70 backdrop-blur-sm animate-fadeIn overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-blue-100 text-blue-800">
                  <Truck className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-bold text-slate-900">Émettre le Bon de Livraison Officiel</h3>
                  <p className="text-xs text-slate-500 font-mono">Facture {showDeliveryModal.numero} • {showDeliveryModal.clientNom}</p>
                </div>
              </div>
              <button onClick={() => setShowDeliveryModal(null)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            <div className="mt-4 p-3 bg-blue-50/60 rounded-xl border border-blue-200/80 text-xs space-y-1">
              <div className="flex justify-between text-blue-900 font-semibold">
                <span>Total Fardeaux à livrer :</span>
                <span className="font-black">{showDeliveryModal.articles.reduce((s, a) => s + a.fardeaux, 0)} fardeaux ({showDeliveryModal.articles.reduce((s, a) => s + a.quantiteUnites, 0).toLocaleString()} alvéoles)</span>
              </div>
              <p className="text-[11px] text-blue-700">
                ⚠️ CDC 7.7 : L'émission du BL valide la sortie définitive des fardeaux finis du stock usine et empêche tout double déstockage.
              </p>
            </div>

            <form onSubmit={handleCreateDeliveryNote} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date Livraison Prévue</label>
                  <input
                    type="date"
                    required
                    value={deliveryForm.dateLivraisonPrevue}
                    onChange={e => setDeliveryForm({ ...deliveryForm, dateLivraisonPrevue: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable Expédition</label>
                  <input
                    type="text"
                    required
                    value={deliveryForm.responsableLivraison}
                    onChange={e => setDeliveryForm({ ...deliveryForm, responsableLivraison: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Chauffeur</label>
                  <input
                    type="text"
                    placeholder="Chauffeur usine ou prestataire"
                    value={deliveryForm.chauffeurNom}
                    onChange={e => setDeliveryForm({ ...deliveryForm, chauffeurNom: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Immatriculation Camion</label>
                  <input
                    type="text"
                    placeholder="Ex: DK-1234-AZ"
                    value={deliveryForm.camionImmatriculation}
                    onChange={e => setDeliveryForm({ ...deliveryForm, camionImmatriculation: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Instructions / Notes Itinéraire</label>
                <textarea
                  rows={2}
                  placeholder="Lieu précis de déchargement, contact à destination..."
                  value={deliveryForm.observations}
                  onChange={e => setDeliveryForm({ ...deliveryForm, observations: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowDeliveryModal(null)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  Générer le BL Officiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL NOUVEAU BON DE SORTIE COMMERCIAL (CDC 6.6) ───────────── */}
      {showExitVoucherModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[250] flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Nouveau Bon de Sortie Commercial</h3>
                  <p className="text-[11px] text-slate-500">Dotation fardeaux pour tournée de vente directe (CDC Section 6.6)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowExitVoucherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveExitVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Destinataire</label>
                <select
                  value={exitForm.commercialId}
                  onChange={e => {
                    const selCom = uniqueCommerciaux.find(c => c.id === e.target.value);
                    setExitForm({ ...exitForm, commercialId: e.target.value, commercialNom: selCom?.nom || e.target.value });
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {uniqueCommerciaux.map(c => (
                    <option key={c.id} value={c.id}>{c.nom} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produit Fini (Fardeaux Usine)</label>
                <select
                  value={exitForm.produitId || products[0]?.id}
                  onChange={e => setExitForm({ ...exitForm, produitId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nom} — Dispo Usine : {p.stockFardeaux} lots ({p.stockTotalUnites.toLocaleString()} pcs)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité (Fardeaux de 100)</label>
                  <input
                    type="number"
                    min="1"
                    max={products.find(p => p.id === (exitForm.produitId || products[0]?.id))?.stockFardeaux || 500}
                    value={exitForm.quantiteLots}
                    onChange={e => setExitForm({ ...exitForm, quantiteLots: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">= {(exitForm.quantiteLots * 100).toLocaleString()} alvéoles</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Magasinier Émetteur</label>
                  <input
                    type="text"
                    value={exitForm.magasinierNom}
                    onChange={e => setExitForm({ ...exitForm, magasinierNom: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Itinéraire / Véhicule / Observations</label>
                <textarea
                  rows={2}
                  placeholder="Ex: Tournée Thiès - Fandène • Camionnette DK-1029-AH..."
                  value={exitForm.observations}
                  onChange={e => setExitForm({ ...exitForm, observations: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowExitVoucherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <Truck className="w-4 h-4" />
                  Valider le Bon de Sortie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL RETOUR INVENDUS COMMERCIAL (CDC 6.7) ──────────────────── */}
      {showReturnVoucherModal && (
        <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[250] flex items-center justify-center p-2 sm:p-4 overflow-y-auto overscroll-contain">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-slate-900 text-base">Enregistrement Retour Invendus</h3>
                  <p className="text-[11px] text-slate-500">Contrôle qualité & régularisation tournée (CDC Section 6.7)</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowReturnVoucherModal(false)}
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 flex items-center justify-center text-xs font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveReturnVoucher} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial qui Décharge</label>
                <select
                  value={returnForm.commercialId}
                  onChange={e => {
                    const selCom = uniqueCommerciaux.find(c => c.id === e.target.value);
                    setReturnForm({ ...returnForm, commercialId: e.target.value, commercialNom: selCom?.nom || e.target.value });
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {uniqueCommerciaux.map(c => (
                    <option key={c.id} value={c.id}>{c.nom} ({c.id})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produit Retourné</label>
                <select
                  value={returnForm.produitId || products[0]?.id}
                  onChange={e => setReturnForm({ ...returnForm, produitId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-200 bg-white font-medium"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nom}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Lots Rapportés (Paquets 100)</label>
                  <input
                    type="number"
                    min="1"
                    value={returnForm.quantiteLots}
                    onChange={e => setReturnForm({ ...returnForm, quantiteLots: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                    required
                  />
                  <p className="text-[10px] text-slate-400 mt-1">= {(returnForm.quantiteLots * 100).toLocaleString()} alvéoles</p>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Motif du Retour</label>
                  <input
                    type="text"
                    value={returnForm.motif}
                    onChange={e => setReturnForm({ ...returnForm, motif: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    placeholder="Invendus tournée, annulation..."
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Décision Contrôle Qualité Réception</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setReturnForm({ ...returnForm, decision: 'ACCEPTE_CONFORME' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      returnForm.decision === 'ACCEPTE_CONFORME'
                        ? 'bg-emerald-50 border-emerald-300 ring-2 ring-emerald-400/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-emerald-800 block">✓ Conforme</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Réintégration immédiate en Stock Usine</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setReturnForm({ ...returnForm, decision: 'NON_CONFORME_RECYCLE' })}
                    className={`p-3 rounded-2xl border text-left transition-all ${
                      returnForm.decision === 'NON_CONFORME_RECYCLE'
                        ? 'bg-amber-50 border-amber-300 ring-2 ring-amber-400/30'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <span className="text-xs font-black text-amber-800 block">♻️ Rebut / Déclassé</span>
                    <span className="text-[10px] text-slate-500 mt-0.5 block">Envoyé au pulpeur (matière recyclée)</span>
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Contrôleur Réception</label>
                  <input
                    type="text"
                    value={returnForm.magasinierNom}
                    onChange={e => setReturnForm({ ...returnForm, magasinierNom: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Observations</label>
                  <input
                    type="text"
                    value={returnForm.observations}
                    onChange={e => setReturnForm({ ...returnForm, observations: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-200"
                    placeholder="État emballages..."
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowReturnVoucherModal(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 hover:bg-slate-50 text-xs font-bold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-black text-xs shadow-md active:scale-95 flex items-center gap-1.5"
                >
                  <RotateCcw className="w-4 h-4" />
                  Valider le Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
