import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { 
  RawMaterialStock, AlveoleProduct, StockMovement, 
  CommercialExitVoucher, CommercialReturnVoucher, 
  RawMaterialReceptionVoucher, RejectedRawMaterialRecord,
  RawMaterialSupplierReturnVoucher, MaterialExitRequest, ShiftType,
  IntrantSupplier, IntrantStockMovement, RawMaterialCategory
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportStockPdf, exportReceptionPdf } from '../../services/pdfExport';
import { 
  Boxes, PackagePlus, AlertTriangle, CheckCircle2, ArrowDownRight, 
  ArrowUpRight, Layers, Scale, DollarSign, Plus, Search, Filter, Warehouse,
  Truck, RotateCcw, History, Check, X, ShieldAlert, FileText, UserCheck, 
  Trash2, Clock, Split, ShieldCheck, TrendingUp, Info, ShoppingCart, 
  Car, User, Calendar, AlertOctagon, HelpCircle, ClipboardCheck, Building,
  Printer, ArrowRight, CornerDownRight, FileCheck2, Globe, MapPin, Factory, Eye, Award
} from 'lucide-react';

export const StockAlveolesModule: React.FC = () => {
  const { currentTheme } = useTheme();

  // ─── Données Dexie LiveQuery ─────────────────────────────────────────────
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const receptions = useLiveQuery(() => db.rawMaterialReceptions.orderBy('date').reverse().toArray()) || [];
  const movements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().limit(100).toArray()) || [];
  const exitVouchers = useLiveQuery(() => db.commercialExitVouchers.orderBy('date').reverse().toArray()) || [];
  const returnVouchers = useLiveQuery(() => db.commercialReturnVouchers.orderBy('date').reverse().toArray()) || [];
  const rejectedMaterials = useLiveQuery(() => db.rejectedRawMaterials.orderBy('date').reverse().toArray()) || [];
  const inventorySessions = useLiveQuery(() => db.inventorySessions.orderBy('date').reverse().toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const supplierReturns = useLiveQuery(() => db.supplierReturnVouchers.orderBy('date').reverse().toArray()) || [];
  const materialExitRequests = useLiveQuery(() => db.materialExitRequests.orderBy('date').reverse().toArray()) || [];
  const intrantSuppliers = useLiveQuery(() => db.intrantSuppliers.orderBy('nom').toArray()) || [];
  const intrantMovements = useLiveQuery(() => db.intrantMovements.orderBy('date').reverse().limit(200).toArray()) || [];

  // ─── Onglets de Navigation (Conformes aux 7 catégories du CDC 6.1 + Sorties Production) ───
  const [activeTab, setActiveTab] = useState<
    'VUE_ENSEMBLE_7_STOCKS' | 'RECEPTIONS_COLLECTES' | 'MATIERES_EXPLOITABLES' | 'DEMANDES_SORTIES_PRODUCTION' | 'PRODUITS_FINIS' | 'STOCKS_COMMERCIAUX' | 'RETOURS_CONTROLE' | 'MATIERES_REJETEES' | 'INVENTAIRES_MOUVEMENTS'
  >('VUE_ENSEMBLE_7_STOCKS');

  const [searchTerm, setSearchTerm] = useState('');

  // ─── Modals d'actions opérationnelles ─────────────────────────────────────
  const [showReceptionModal, setShowReceptionModal] = useState(false);
  const [showTriModal, setShowTriModal] = useState<RawMaterialReceptionVoucher | null>(null);
  const [showExitVoucherModal, setShowExitVoucherModal] = useState(false);
  const [showReturnVoucherModal, setShowReturnVoucherModal] = useState(false);
  const [showSortieProductionModal, setShowSortieProductionModal] = useState(false);
  const [showDemandeSortieModal, setShowDemandeSortieModal] = useState(false);
  const [showSupplierReturnModal, setShowSupplierReturnModal] = useState<RawMaterialSupplierReturnVoucher | null>(null);
  const [showInventaireModal, setShowInventaireModal] = useState(false);

  // ─── Intrant : modal fiche mouvement (entrée achat / sortie production) & détail bon ───
  const [showIntrantMvtModal, setShowIntrantMvtModal] = useState<'ENTREE_ACHAT' | 'SORTIE_PRODUCTION' | null>(null);
  const [selectedIntrantForMvt, setSelectedIntrantForMvt] = useState<RawMaterialStock | null>(null);
  const [selectedIntrantMvtDetail, setSelectedIntrantMvtDetail] = useState<IntrantStockMovement | null>(null);

  const defaultIntrantMvtState = {
    quantite: 0,
    // Provenance & Fournisseur
    paysProvenance: 'Sénégal',
    villeUsine: '',
    fournisseurId: '',
    fournisseurNom: '',
    fournisseurContact: '',
    fournisseurTelephone: '',
    fournisseurEmail: '',
    fournisseurAdresse: '',
    vehiculeImmatriculation: '',
    chauffeurNom: '',
    transitaire: '',
    // Prix départ Usine & Devises
    deviseOrigine: 'XOF',
    prixEnDeviseOrigine: 0,
    tauxChange: 1,
    prixUsineUnitaireFCFA: 0,
    // Frais d'approche (Transport, Douane, Divers)
    fraisTransportFCFA: 0,
    fraisDedouanementFCFA: 0,
    fraisDiversFCFA: 0,
    prixUnitaireFCFA: 0, // Prix rendu unitaire calculé ou saisi
    // Conditionnement & Pesée
    conditionnement: 'Sacs 25 kg',
    nombreColis: 0,
    poidsDeclareFournisseurKg: 0,
    poidsNetKg: 0,
    poidsBrutKg: 0,
    // Certificats & Documents Qualité
    numeroCertificatAnalyse: '',
    numeroCertificatOrigine: '',
    numeroCertificatPhytosanitaire: '',
    numeroFicheMSDS: '',
    certificationISO: 'ISO 9001',
    lotFabricant: '',
    dateProductionFabricant: '',
    datePeremption: '',
    conformiteQualite: 'CONFORME' as 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVE' | 'EN_ATTENTE_LABO',
    apparenceVisuelleCRT: 'OK' as 'OK' | 'ANOMALIE',
    emballageCRT: 'INTACT' as 'INTACT' | 'ENDOMMAGE' | 'FUITES',
    humiditeMesuree: 0,
    pHMesure: 7,
    echantillonPrelevePourLabo: false,
    remarquesControleQualite: '',
    receptionnaireMagasin: 'Cheikh Ndiaye (Magasinier Usine)',
    // Documents & Paiement
    referenceBonCommande: '',
    referenceFactureFournisseur: '',
    referencePaiement: '',
    modePaiement: 'Wave' as 'Wave' | 'Orange Money' | 'Virement Bancaire' | 'Chèque' | 'Espèces' | 'Crédit' | 'LC (Lettre de Crédit)',
    comptePaiement: 'Wave Business' as 'Wave Business' | 'Orange Money Pro' | 'Banque Principale' | 'Caisse Usine',
    // Production (si sortie)
    ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
    shiftConsommation: 'MATIN_06H_14H',
    observations: ''
  };

  const [intrantMvtForm, setIntrantMvtForm] = useState(defaultIntrantMvtState);
  const [intrantActiveTab, setIntrantActiveTab] = useState<'MOUVEMENTS' | 'FOURNISSEURS'>('MOUVEMENTS');

  // ─── Formulaire Réception Fournisseur & Collecte Usine (CDC 6.2 & Spécifications Client) ──
  const [receptionForm, setReceptionForm] = useState<{
    modeApprovisionnement: 'FOURNISSEUR_LIVRAISON' | 'COLLECTE_USINE';
    mpId: string;
    typePapierCarton: string;
    fournisseurNom: string;
    fournisseurPrenom: string;
    fournisseurContact: string;
    fournisseurAdresse: string;
    transporteur: string;
    chauffeurNom: string;
    chauffeurTel: string;
    chauffeurAdresse: string;
    vehiculeImmatriculation: string;
    vehiculeCouleur: string;
    numeroBonPesee: string;
    numeroFactureFournisseur: string;
    agentCollecteNom: string;
    agentCollecteTel: string;
    siteEntrepriseCollectee: string;
    sitesCollectesMultiples: { usineNom: string; emplacement: string; quantiteKg: number }[];
    vehiculeType: 'VEHICULE_USINE' | 'VEHICULE_LOCATION';
    loueurNom: string;
    coutLocationFCFA: number;
    heureDepart: string;
    heureRetour: string;
    respectNormesQualite: boolean;
    estGratuitDebarras: boolean;
    structureCollecte: string;
    numeroFicheCollecte: string;
    valorisationQuantiteRecueFCFA: number;
    prixUnitaireKg: number;
    quantiteDeclareeKg: number;
    quantiteBruteReceptionneeKg: number;
    uniteMesure: string;
    utilisateurReception: string;
    observations: string;
  }>({
    modeApprovisionnement: 'FOURNISSEUR_LIVRAISON',
    mpId: 'mp-occ-01',
    typePapierCarton: 'Balles Cartons Ondulés (OCC)',
    fournisseurNom: 'Sénégal Carton Récupération SARL',
    fournisseurPrenom: 'Mamadou',
    fournisseurContact: '+221 77 550 12 34',
    fournisseurAdresse: 'Zone Industrielle Mbao, Km 18, Dakar',
    transporteur: 'Transports Ba & Frères',
    chauffeurNom: 'Ousmane Fall',
    chauffeurTel: '+221 70 889 45 12',
    chauffeurAdresse: 'Grand Yoff, Dakar',
    vehiculeImmatriculation: 'DK-4589-BB',
    vehiculeCouleur: 'Blanc / Bleu',
    numeroBonPesee: `PESEE-${Date.now().toString().slice(-4)}`,
    numeroFactureFournisseur: `FAC-${Date.now().toString().slice(-4)}`,
    agentCollecteNom: 'Moussa Diop',
    agentCollecteTel: '+221 77 623 88 90',
    siteEntrepriseCollectee: 'Zone Industrielle Rufisque (Multi-usines)',
    sitesCollectesMultiples: [
      { usineNom: 'Imprimerie Graphique du Cap-Vert', emplacement: 'Rufisque Nord', quantiteKg: 2200 },
      { usineNom: 'Sénégal Emballages Cartonnerie', emplacement: 'Mbao Usine', quantiteKg: 1800 }
    ],
    vehiculeType: 'VEHICULE_USINE',
    loueurNom: '',
    coutLocationFCFA: 0,
    heureDepart: '08:00',
    heureRetour: '12:30',
    respectNormesQualite: true,
    estGratuitDebarras: false,
    structureCollecte: 'Imprimeries et Entreprises Partenaires Dakar',
    numeroFicheCollecte: `COL-${Date.now().toString().slice(-4)}`,
    valorisationQuantiteRecueFCFA: 1250000,
    prixUnitaireKg: 250, // RÈGLE CLIENT : 250 FCFA / kg
    quantiteDeclareeKg: 5000,
    quantiteBruteReceptionneeKg: 5000,
    uniteMesure: 'Kg',
    utilisateurReception: 'Modou Faye (Magasinier Réceptionnaire)',
    observations: 'Réception brute sur quai. Tri obligatoire avant admission en stock utile.'
  });

  // ─── Formulaire Opération de Tri & Déclassement (CDC 6.3 & Spécification Client) ──
  const [triForm, setTriForm] = useState({
    quantiteExploitableKg: 4750,
    quantiteRejeteeKg: 250,
    responsableTri: 'Modou Faye (Chef Tri & Magasin)',
    motifRejet: 'Présence de plastiques non recyclables, agrafes et humidité anormale',
    observations: 'Tri manuel sur table vibrante : fibres conformes admises au pulpeur.',
    genererBonRetourFournisseur: false
  });

  // ─── Formulaire Demande d'Autorisation de Sortie Matière Production (Spécification Client) ──
  const [demandeSortieForm, setDemandeSortieForm] = useState({
    mpId: 'mp-occ-01',
    quantiteKgDemandee: 500,
    shift: 'MATIN_06H_14H' as ShiftType,
    ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
    demandeurNom: 'Amadou Bâ (Chef de Quart)',
    motifBesoins: 'Alimentation du pulpeur pour lot alvéoles 30 standard',
    observations: 'Prévoir également 15 kg de CMC pour dosage liant.'
  });

  // ─── Formulaire Bon de Sortie vers Commercial (CDC 6.6) ──────────────────
  const [exitForm, setExitForm] = useState({
    commercialId: 'usr-com',
    commercialNom: 'Ibrahima Ndiaye',
    produitId: 'prod-alv-30-std',
    quantiteLots: 100, // 100 lots = 10 000 alvéoles
    magasinierNom: 'Modou Faye (Magasinier)',
    observations: 'Dotation tournée commerciale secteur Thiès'
  });

  // ─── Formulaire Retour Invendus Commercial (CDC 6.7) ──────────────────────
  const [returnForm, setReturnForm] = useState({
    commercialId: 'usr-com',
    commercialNom: 'Ibrahima Ndiaye',
    produitId: 'prod-alv-30-std',
    quantiteLots: 10,
    motif: 'Invendus fin de tournée hebdomadaire',
    decision: 'ACCEPTE_CONFORME' as 'ACCEPTE_CONFORME' | 'ACCEPTE_SOUS_RESERVE' | 'NON_CONFORME_RECYCLE' | 'REFUSE',
    magasinierNom: 'Modou Faye (Magasinier)',
    observations: 'Inspection visuelle et comptage unitaire effectués'
  });

  // ─── Formulaire Sortie Matière vers Pulpeur (Demande Production) ──────────
  const [sortieProdForm, setSortieProdForm] = useState({
    mpId: 'mp-occ-01',
    quantiteKg: 400,
    shift: 'MATIN_06H_14H',
    responsableProduction: 'Amadou Bâ (Chef de Quart)',
    magasinierNom: 'Modou Faye (Magasinier)',
    motif: 'Alimentation pulpeur quart matin - Production alvéoles 30'
  });

  // ─── Formulaire Session d'Inventaire Périodique (CDC 6.8) ────────────────
  const [inventaireForm, setInventaireForm] = useState({
    articleType: 'MATIERE_PREMIERE' as 'MATIERE_PREMIERE' | 'PRODUIT_FINI',
    articleId: 'mp-occ-01',
    stockPhysique: 34500,
    responsableComptage: 'Modou Faye & Auditeur Interne',
    justification: 'Pesée physique des balles en magasin'
  });

  // ─── CALCULS INDUSTRIELS & COUVERTURES (CDC 6.1 & 6.4) ────────────────────
  // Catégorie 1 : Matière brute reçue en attente de tri
  const totalMatiereBruteEnAttenteKg = receptions
    .filter(r => r.statutTri === 'EN_ATTENTE_DE_TRI')
    .reduce((sum, r) => sum + r.quantiteBruteReceptionneeKg, 0);

  // Catégorie 2 : Matière première exploitable après tri
  const totalCartonExploitableKg = rawMaterials
    .filter(m => m.categorie === 'PAPIER_CARTON')
    .reduce((sum, m) => sum + m.stockActuel, 0);

  // Catégorie 3 : Matières rejetées ou en attente de décision
  const totalMatieresRejeteesKg = rejectedMaterials
    .filter(r => r.statut === 'EN_ATTENTE_DECISION')
    .reduce((sum, r) => sum + r.quantiteKg, 0);

  // Catégorie 4 : Produits finis conformes usine
  const totalFardeauxUsine = products.reduce((sum, p) => sum + p.stockFardeaux, 0);
  const totalAlveolesUsine = products.reduce((sum, p) => sum + p.stockTotalUnites, 0);
  const valorisationPF = products.reduce((sum, p) => sum + (p.stockTotalUnites * p.prixUnitaireFCFA), 0);

  // Catégorie 5 : Produits confiés aux commerciaux (détaillé par commercial)
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

  // Estimer les ventes validées par commercial (via factures payées/confirmées)
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

  // Catégorie 6 : Produits retournés en attente de contrôle
  const totalLotsEnAttenteControle = returnVouchers
    .filter(r => r.statut === 'EN_ATTENTE_CONTROLE')
    .reduce((sum, r) => sum + r.quantiteLots, 0);

  // Catégorie 7 : Produits et matières déclassés / définitivement évacués
  const totalMatieresEvacueesKg = rejectedMaterials
    .filter(r => r.statut === 'EVACUATION_DEFINITIVE')
    .reduce((sum, r) => sum + r.quantiteKg, 0);

  const shifts = useLiveQuery(() => db.productionShifts.toArray()) || [];
  const factorySettingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const factorySettings = factorySettingsList[0];

  // ─── CALCUL DES JOURS DE COUVERTURE & ALERTES CDC 6.4 ─────────────────────
  // Référence CDC : besoin cible ~10 100 kg/mois sur 26 jours = 388.5 kg/jour
  const CONSOMMATION_REFERENCE_JOUR_KG = 388.5;
  const totalPapierConsommeShifts = shifts.reduce((sum, s) => sum + (s.papierCartonConsommeKg || 0), 0);
  const isDonneesConsommationInsuffisantes = shifts.length === 0 || totalPapierConsommeShifts === 0;

  // Consommation journalière moyenne pertinente (CDC 6.4)
  const consommationMoyenneJourKg = isDonneesConsommationInsuffisantes
    ? CONSOMMATION_REFERENCE_JOUR_KG
    : Math.max(50, Math.round(totalPapierConsommeShifts / Math.max(1, shifts.length)));

  // Jours de couverture = Stock exploitable ÷ Consommation journalière moyenne (sans division par zéro)
  const joursCouvertureMatiere = consommationMoyenneJourKg > 0 
    ? Number((totalCartonExploitableKg / consommationMoyenneJourKg).toFixed(1))
    : 0;

  // Statut d'alerte couverture matière (CDC 6.4 : < 5j = Critique, 5-9.9j = Sécurité visée 7-10j, >= 10j = Confort)
  const alerteCouvertureStatut: 'CONFORT' | 'SECURITE' | 'CRITIQUE' = 
    joursCouvertureMatiere >= 10 ? 'CONFORT' : joursCouvertureMatiere >= 5 ? 'SECURITE' : 'CRITIQUE';

  // Alertes Intrants Chimiques (CMC, Talc, Amidon...) - Règle audio : alerte si stock <= 25% du seuil
  const intrantsChimiques = rawMaterials.filter(m => m.categorie !== 'PAPIER_CARTON');
  const intrantsEnAlerte = intrantsChimiques.filter(m => m.stockActuel <= (m.seuilSecurite * 1.25));

  // Coût Moyen Pondéré d'Achat (PMP)
  const valorisationCarton = rawMaterials
    .filter(m => m.categorie === 'PAPIER_CARTON')
    .reduce((sum, m) => sum + (m.stockActuel * m.coutMoyenAchatFCFA), 0);
  const valorisationIntrants = intrantsChimiques.reduce((sum, m) => sum + (m.stockActuel * m.coutMoyenAchatFCFA), 0);
  const valorisationGlobale = valorisationPF + valorisationCarton + valorisationIntrants;

  // ─── CALCULS SCHÉMA EXPLICATIF : VALEUR DU STOCK ENTRANT & COÛTS MOYENS (p.1 & p.3) ───
  const receptionsAcquisesTriees = receptions.filter(r => r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' && r.statutTri === 'TRI_EFFECTUE');
  const stockAcquisConformeKg = receptionsAcquisesTriees.reduce((s, r) => s + (r.quantiteExploitableKg || 0), 0);
  const coutTotalDepenseAcquis = receptionsAcquisesTriees.reduce((s, r) => s + (r.montantTotalFCFA || (r.quantiteBruteReceptionneeKg * (r.prixUnitaireKg || 250))), 0);
  const coutRevientKgAcquis = stockAcquisConformeKg > 0 ? Number((coutTotalDepenseAcquis / stockAcquisConformeKg).toFixed(1)) : 250;

  const receptionsCollecteesTriees = receptions.filter(r => r.modeApprovisionnement === 'COLLECTE_USINE' && r.statutTri === 'TRI_EFFECTUE');
  const stockCollecteConformeKg = receptionsCollecteesTriees.reduce((s, r) => s + (r.quantiteExploitableKg || 0), 0);
  const coutTotalDepenseCollecte = receptionsCollecteesTriees.reduce((s, r) => s + (r.coutTotalBrutFCFA || (r.coutLocationFCFA || 0)), 0);
  const coutRevientKgCollecte = stockCollecteConformeKg > 0 ? Number((coutTotalDepenseCollecte / stockCollecteConformeKg).toFixed(1)) : 45;

  const totalStockConformeEntrantKg = stockAcquisConformeKg + stockCollecteConformeKg;
  const valeurTotaleStockEntrantFCFA = (stockAcquisConformeKg * coutRevientKgAcquis) + (stockCollecteConformeKg * coutRevientKgCollecte);
  const coutMoyenPondereStockEntrantKg = totalStockConformeEntrantKg > 0 
    ? Number((valeurTotaleStockEntrantFCFA / totalStockConformeEntrantKg).toFixed(1)) 
    : 225;

  // ─── ACTIONS MÉTIER ───────────────────────────────────────────────────────

  // 1. Enregistrement d'une nouvelle réception (Fournisseur ou Collecte Usine)
  const handleSaveReception = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMP = rawMaterials.find(m => m.id === receptionForm.mpId) || rawMaterials[0];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const bonId = `REC-${new Date().getFullYear()}-${(receptions.length + 1).toString().padStart(3, '0')}`;

    const prixUnitaire = receptionForm.estGratuitDebarras ? 0 : Number(receptionForm.prixUnitaireKg) || 250;
    const quantiteBrute = Number(receptionForm.quantiteBruteReceptionneeKg) || 0;
    const coutLocation = receptionForm.modeApprovisionnement === 'COLLECTE_USINE' && receptionForm.vehiculeType === 'VEHICULE_LOCATION'
      ? Number(receptionForm.coutLocationFCFA) || 0
      : 0;
    const coutTotal = (quantiteBrute * prixUnitaire) + coutLocation;

    const newReception: RawMaterialReceptionVoucher = {
      id: `rec-${Date.now()}`,
      numeroBon: bonId,
      date: today,
      heure: nowTime,
      modeApprovisionnement: receptionForm.modeApprovisionnement,
      fournisseurNom: receptionForm.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' 
        ? receptionForm.fournisseurNom 
        : `Collecte : ${receptionForm.siteEntrepriseCollectee}`,
      fournisseurPrenom: receptionForm.fournisseurPrenom,
      fournisseurContact: receptionForm.fournisseurContact,
      fournisseurAdresse: receptionForm.fournisseurAdresse,
      transporteur: receptionForm.transporteur,
      chauffeurNom: receptionForm.chauffeurNom,
      chauffeurTel: receptionForm.chauffeurTel,
      chauffeurAdresse: receptionForm.chauffeurAdresse,
      vehiculeImmatriculation: receptionForm.vehiculeImmatriculation,
      vehiculeCouleur: receptionForm.vehiculeCouleur,
      numeroBonPesee: receptionForm.numeroBonPesee,
      numeroFactureFournisseur: receptionForm.numeroFactureFournisseur,
      agentCollecteNom: receptionForm.agentCollecteNom,
      agentCollecteTel: receptionForm.agentCollecteTel,
      siteEntrepriseCollectee: receptionForm.siteEntrepriseCollectee,
      structureCollecte: receptionForm.structureCollecte,
      numeroFicheCollecte: receptionForm.numeroFicheCollecte,
      sitesCollectesMultiples: receptionForm.sitesCollectesMultiples,
      vehiculeType: receptionForm.vehiculeType,
      loueurNom: receptionForm.loueurNom,
      coutLocationFCFA: coutLocation,
      valorisationQuantiteRecueFCFA: (quantiteBrute * prixUnitaire) + coutLocation,
      heureDepart: receptionForm.heureDepart,
      heureRetour: receptionForm.heureRetour,
      respectNormesQualite: receptionForm.respectNormesQualite,
      mpId: targetMP?.id || 'mp-occ-01',
      mpNom: targetMP?.nom || 'Balles de Cartons Ondulés Recyclés (OCC)',
      typePapierCarton: receptionForm.typePapierCarton,
      estGratuitDebarras: receptionForm.estGratuitDebarras,
      prixUnitaireKg: prixUnitaire,
      quantiteDeclareeKg: Number(receptionForm.quantiteDeclareeKg) || quantiteBrute,
      quantiteBruteReceptionneeKg: quantiteBrute,
      uniteMesure: receptionForm.uniteMesure || 'Kg',
      montantTotalFCFA: coutTotal,
      coutTotalBrutFCFA: coutTotal,
      statutTri: 'EN_ATTENTE_DE_TRI', // RÈGLE ABSOLUE : N'entre PAS directement dans le stock utile !
      utilisateurReception: receptionForm.utilisateurReception || 'Modou Faye (Magasinier Réceptionnaire)',
      magasinierReception: receptionForm.utilisateurReception || 'Modou Faye (Magasinier)',
      observations: receptionForm.observations
    };

    await db.rawMaterialReceptions.add(newReception);

    // Mouvement d'entrée en zone de réception tampon
    await db.stockMovements.add({
      id: `mov-${Date.now()}`,
      date: today,
      type: 'ENTREE_RECEPTION',
      articleType: 'MATIERE_PREMIERE',
      articleId: targetMP?.id || 'mp-occ-01',
      articleNom: targetMP?.nom || 'Cartons Bruts (En Attente de Tri)',
      quantite: quantiteBrute,
      unite: 'Kg',
      coutUnitaire: prixUnitaire,
      responsable: 'Modou Faye (Magasinier)',
      motif: `Bon ${bonId} (${receptionForm.modeApprovisionnement}) - ${quantiteBrute} kg déchargés sur quai de réception (Sous réserve de tri)`
    });

    // Enregistrer la dépense si payant
    if (coutTotal > 0) {
      await db.expenses.add({
        id: `exp-${Date.now()}`,
        date: today,
        categorie: 'Matières Premières (Balles Cartons)',
        montant: coutTotal,
        beneficiaire: receptionForm.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' 
          ? receptionForm.fournisseurNom 
          : `Collecte Usine (${receptionForm.siteEntrepriseCollectee})`,
        description: `Approvisionnement ${bonId} : ${quantiteBrute} kg de papier/carton (P.U : ${prixUnitaire} F/kg, Transport : ${coutLocation} F)`,
        comptePaiement: 'Banque Principale',
        justificatifRef: receptionForm.numeroBonPesee || bonId,
        enregistrePar: 'Comptabilité Usine'
      });
    }

    setShowReceptionModal(false);
  };

  // 2. Validation de l'opération de tri & déclassement (Section 6.3 + Audio Client)
  const handleValidateTri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTriModal) return;

    const brute = showTriModal.quantiteBruteReceptionneeKg;
    const exploitable = Number(triForm.quantiteExploitableKg) || 0;
    const rejetee = Number(triForm.quantiteRejeteeKg) || (brute - exploitable);
    const rendementTri = Number(((exploitable / (brute || 1)) * 100).toFixed(1));
    const coutBrut = showTriModal.coutTotalBrutFCFA;
    const coutRevientReel = exploitable > 0 ? Number((coutBrut / exploitable).toFixed(1)) : 0;
    const today = new Date().toISOString().split('T')[0];

    // Mettre à jour le bon de réception
    await db.rawMaterialReceptions.update(showTriModal.id, {
      statutTri: 'TRI_EFFECTUE',
      dateTri: today,
      responsableTri: triForm.responsableTri,
      quantiteExploitableKg: exploitable,
      quantiteRejeteeKg: rejetee,
      rendementTriPourcent: rendementTri,
      coutRevientReelKg: coutRevientReel,
      motifRejet: triForm.motifRejet,
      observations: `${showTriModal.observations || ''} | ${triForm.observations}`
    });

    // Alimenter le stock exploitable pulpeur (Catégorie 2)
    const targetMP = rawMaterials.find(m => m.id === showTriModal.mpId) || rawMaterials[0];
    if (targetMP) {
      await db.rawMaterials.update(targetMP.id, {
        stockActuel: targetMP.stockActuel + exploitable,
        derniereReception: today
      });
    }

    // Isoler la matière rejetée en Quarantaine (Catégorie 3)
    if (rejetee > 0) {
      await db.rejectedRawMaterials.add({
        id: `rej-${Date.now()}`,
        date: today,
        mpReference: targetMP?.reference || 'MP-OCC-BALL',
        mpNom: targetMP?.nom || 'Cartons Triés',
        quantiteKg: rejetee,
        motifRejet: triForm.motifRejet || 'Impuretés ou non-conformité détectées au tri usine',
        fournisseur: showTriModal.fournisseurNom,
        statut: 'EN_ATTENTE_DECISION',
        responsableTri: triForm.responsableTri,
        observations: `Issu du tri bon n°${showTriModal.numeroBon} (Rendement: ${rendementTri}%)`
      });

      // RÈGLE CLIENT : Émission d'un Bon de Retour Fournisseur si non conforme / demandé
      if (triForm.genererBonRetourFournisseur && showTriModal.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON') {
        const returnBonId = `BRF-${new Date().getFullYear()}-${(supplierReturns.length + 1).toString().padStart(3, '0')}`;
        const montantAvoir = rejetee * (showTriModal.prixUnitaireKg || 250);
        await db.supplierReturnVouchers.add({
          id: `brf-${Date.now()}`,
          numeroBonRetour: returnBonId,
          date: today,
          heure: new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }),
          receptionId: showTriModal.id,
          numeroBonReception: showTriModal.numeroBon,
          fournisseurNom: showTriModal.fournisseurNom,
          fournisseurContact: showTriModal.fournisseurContact,
          fournisseurAdresse: showTriModal.fournisseurAdresse,
          mpNom: showTriModal.mpNom,
          quantiteBruteKg: brute,
          quantiteRejeteeKg: rejetee,
          tauxConformePourcent: rendementTri,
          motifRetour: triForm.motifRejet || 'Taux de conformité matière insatisfaisant au tri usine',
          prixUnitaireKg: showTriModal.prixUnitaireKg || 250,
          montantAvoirFCFA: montantAvoir,
          transporteur: showTriModal.transporteur,
          chauffeurNom: showTriModal.chauffeurNom,
          chauffeurTel: showTriModal.chauffeurTel,
          chauffeurAdresse: showTriModal.chauffeurAdresse,
          vehiculeImmatriculation: showTriModal.vehiculeImmatriculation,
          magasinierNom: triForm.responsableTri,
          statut: 'RETOUR_EMIS',
          observations: `Avoir fournisseur de ${montantAvoir.toLocaleString()} FCFA (${rejetee} kg × 250 F/kg) à déduire de la facturation.`
        });

        await db.rawMaterialReceptions.update(showTriModal.id, {
          bonRetourGenere: true,
          numeroBonRetour: returnBonId
        });
      }
    }

    // Tracer les mouvements dans l'historique
    await db.stockMovements.add({
      id: `mov-tri-${Date.now()}`,
      date: today,
      type: 'ENTREE_RECEPTION',
      articleType: 'MATIERE_PREMIERE',
      articleId: showTriModal.mpId,
      articleNom: targetMP?.nom || 'Carton Exploitable',
      quantite: exploitable,
      unite: 'Kg',
      coutUnitaire: coutRevientReel,
      responsable: triForm.responsableTri,
      motif: `Validation tri bon ${showTriModal.numeroBon} : ${exploitable} kg admis au pulpeur (Rdt: ${rendementTri}%, Coût réel: ${coutRevientReel} F/kg)`
    });

    setShowTriModal(null);
  };

  // ─── WORKFLOW DEMANDE D'AUTORISATION DE SORTIE MATIÈRE (SPÉCIFICATION CLIENT) ───
  // "Chaque sortie aura d'abord une demande au niveau de la production pour qu'il y ait une autorisation de sortie"
  const handleCreateDemandeSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMP = rawMaterials.find(m => m.id === demandeSortieForm.mpId) || rawMaterials[0];
    const today = new Date().toISOString().split('T')[0];
    const nowTime = new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
    const reqId = `DSM-${new Date().getFullYear()}-${(materialExitRequests.length + 1).toString().padStart(3, '0')}`;

    await db.materialExitRequests.add({
      id: `dsm-${Date.now()}`,
      numeroDemande: reqId,
      date: today,
      heure: nowTime,
      mpId: targetMP?.id || 'mp-occ-01',
      mpNom: targetMP?.nom || 'Carton Exploitable',
      quantiteKgDemandee: Number(demandeSortieForm.quantiteKgDemandee) || 0,
      shift: demandeSortieForm.shift,
      ligneProduction: demandeSortieForm.ligneProduction,
      demandeurNom: demandeSortieForm.demandeurNom,
      motifBesoins: demandeSortieForm.motifBesoins,
      statut: 'EN_ATTENTE_AUTORISATION',
      observations: demandeSortieForm.observations
    });

    setShowDemandeSortieModal(false);
  };

  const handleApprouverDemandeSortie = async (demande: MaterialExitRequest) => {
    const targetMP = rawMaterials.find(m => m.id === demande.mpId);
    if (!targetMP) return;

    if (targetMP.stockActuel < demande.quantiteKgDemandee) {
      alert(`⚠️ Stock disponible insuffisant dans le magasin : Disponible ${targetMP.stockActuel.toLocaleString()} ${targetMP.unite}, Demandé ${demande.quantiteKgDemandee.toLocaleString()} ${targetMP.unite}`);
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const bonSortieId = `BSM-${new Date().getFullYear()}-${Date.now().toString().slice(-4)}`;

    // 1. Déstocker de la matière
    await db.rawMaterials.update(targetMP.id, {
      stockActuel: Math.max(0, targetMP.stockActuel - demande.quantiteKgDemandee)
    });

    // 2. Mettre à jour la demande comme approuvée avec Bon officiel
    await db.materialExitRequests.update(demande.id, {
      statut: 'APPROUVEE_DESTOCKEE',
      autorisePar: 'Modou Faye (Magasinier Principal)',
      dateAutorisation: today,
      numeroBonSortieGenere: bonSortieId
    });

    // 3. Mouvement officiel de sortie
    await db.stockMovements.add({
      id: `mov-bsm-${Date.now()}`,
      date: today,
      type: 'SORTIE_PULPEUR',
      articleType: 'MATIERE_PREMIERE',
      articleId: targetMP.id,
      articleNom: targetMP.nom,
      quantite: demande.quantiteKgDemandee,
      unite: targetMP.unite,
      responsable: 'Modou Faye (Magasinier Principal)',
      motif: `Bon de sortie matière ${bonSortieId} (Demande ${demande.numeroDemande}) pour ${demande.demandeurNom} (${demande.shift}) : ${demande.motifBesoins}`
    });
  };

  const handleRefuserDemandeSortie = async (demandeId: string) => {
    const motif = prompt('Veuillez indiquer le motif du refus de l\'autorisation de sortie matière :');
    if (!motif) return;
    await db.materialExitRequests.update(demandeId, {
      statut: 'REJETEE',
      motifRefus: motif,
      autorisePar: 'Modou Faye (Magasinier Principal)'
    });
  };

  // 3. Sortie Matière vers Pulpeur directe (si autorisée)
  const handleSaveSortieProduction = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetMP = rawMaterials.find(m => m.id === sortieProdForm.mpId) || rawMaterials[0];
    if (!targetMP) return;

    const qte = Number(sortieProdForm.quantiteKg) || 0;
    if (qte <= 0 || qte > targetMP.stockActuel) {
      alert('Quantité invalide ou stock exploitable insuffisant.');
      return;
    }

    const today = new Date().toISOString().split('T')[0];

    // Déduire du stock exploitable
    await db.rawMaterials.update(targetMP.id, {
      stockActuel: Math.max(0, targetMP.stockActuel - qte)
    });

    // Enregistrer le mouvement de sortie
    await db.stockMovements.add({
      id: `mov-sp-${Date.now()}`,
      date: today,
      type: 'SORTIE_PULPEUR',
      articleType: 'MATIERE_PREMIERE',
      articleId: targetMP.id,
      articleNom: targetMP.nom,
      quantite: qte,
      unite: 'Kg',
      responsable: sortieProdForm.magasinierNom,
      motif: `Bon de sortie matière vers Pulpeur (${sortieProdForm.shift}) - Demandeur: ${sortieProdForm.responsableProduction} - ${sortieProdForm.motif}`
    });

    setShowSortieProductionModal(false);
  };

  // 4. Sortie de produits finis vers un Commercial (CDC 6.6)
  const handleSaveExitVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find(p => p.id === exitForm.produitId) || products[0];
    if (!targetProduct) return;

    const lots = Number(exitForm.quantiteLots) || 0;
    if (lots <= 0 || lots > targetProduct.stockFardeaux) {
      alert('Quantité insuffisante dans le stock conforme usine.');
      return;
    }

    const unites = lots * (targetProduct.quantiteParFardeau || 100);
    const today = new Date().toISOString().split('T')[0];
    const bonId = `BS-${new Date().getFullYear()}-${(exitVouchers.length + 1).toString().padStart(3, '0')}`;

    const stockUsineAvant = targetProduct.stockFardeaux;
    const stockUsineApres = stockUsineAvant - lots;

    const commercialActuel = commercialsMap[exitForm.commercialNom]?.soldeActuelLots || 0;
    const stockCommercialApres = commercialActuel + lots;

    await db.alveoleProducts.update(targetProduct.id, {
      stockFardeaux: stockUsineApres,
      stockTotalUnites: targetProduct.stockTotalUnites - unites
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
      stockUsineAvant: stockUsineAvant,
      stockUsineApres: stockUsineApres,
      stockCommercialAvant: commercialActuel,
      stockCommercialApres: stockCommercialApres,
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
      unite: 'Fardeaux (lots de 100)',
      responsable: exitForm.magasinierNom,
      motif: `Bon de sortie ${bonId} pour le commercial ${exitForm.commercialNom} (${lots} lots confiés pour tournée)`
    });

    setShowExitVoucherModal(false);
  };

  // 5. Retour Invendus Commercial (CDC 6.7)
  const handleSaveReturnVoucher = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetProduct = products.find(p => p.id === returnForm.produitId) || products[0];
    if (!targetProduct) return;

    const lots = Number(returnForm.quantiteLots) || 0;
    const unites = lots * (targetProduct.quantiteParFardeau || 100);
    const today = new Date().toISOString().split('T')[0];
    const retourId = `BRC-${new Date().getFullYear()}-${(returnVouchers.length + 1).toString().padStart(3, '0')}`;

    if (returnForm.decision === 'ACCEPTE_CONFORME') {
      await db.alveoleProducts.update(targetProduct.id, {
        stockFardeaux: targetProduct.stockFardeaux + lots,
        stockTotalUnites: targetProduct.stockTotalUnites + unites
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
      unite: 'Fardeaux (lots de 100)',
      responsable: returnForm.magasinierNom,
      motif: `Bon de retour ${retourId} (${lots} lots) - Décision: ${returnForm.decision}`
    });

    setShowReturnVoucherModal(false);
  };

  // 6. Action Quarantaine / Matières rejetées (CDC 12.5)
  const handleDecideRejected = async (id: string, decision: 'RECYCLE_PULPEUR' | 'EVACUATION_DEFINITIVE') => {
    const item = rejectedMaterials.find(r => r.id === id);
    if (!item) return;
    const today = new Date().toISOString().split('T')[0];

    await db.rejectedRawMaterials.update(id, {
      statut: decision,
      dateDecision: today
    });

    if (decision === 'RECYCLE_PULPEUR') {
      const targetMP = rawMaterials.find(m => m.reference === item.mpReference) || rawMaterials[0];
      if (targetMP) {
        await db.rawMaterials.update(targetMP.id, {
          stockActuel: targetMP.stockActuel + item.quantiteKg
        });
      }
    }

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: 'Cheikh Ndoye (Chef Production)',
      userRole: 'RESPONSABLE_PRODUCTION',
      action: 'ARBITRAGE_MATIERE_REJETEE',
      entite: 'STOCK_QUARANTAINE',
      description: `Décision sur ${item.quantiteKg} kg de ${item.mpNom} : ${decision === 'RECYCLE_PULPEUR' ? 'Réinjecté au pulpeur (dilution)' : 'Évacuation définitive hors usine'}`
    });
  };

  // 7. Enregistrement d'un Inventaire Physique (CDC 6.8)
  const handleSaveInventaire = async (e: React.FormEvent) => {
    e.preventDefault();
    const today = new Date().toISOString().split('T')[0];
    
    if (inventaireForm.articleType === 'MATIERE_PREMIERE') {
      const mp = rawMaterials.find(m => m.id === inventaireForm.articleId) || rawMaterials[0];
      if (!mp) return;
      const theorique = mp.stockActuel;
      const physique = Number(inventaireForm.stockPhysique) || 0;
      const ecart = physique - theorique;
      const ecartVal = ecart * mp.coutMoyenAchatFCFA;

      await db.rawMaterials.update(mp.id, { stockActuel: physique });

      await db.stockMovements.add({
        id: `mov-inv-${Date.now()}`,
        date: today,
        type: ecart >= 0 ? 'ENTREE_RECEPTION' : 'REBUT_RECYLE',
        articleType: 'MATIERE_PREMIERE',
        articleId: mp.id,
        articleNom: mp.nom,
        quantite: Math.abs(ecart),
        unite: mp.unite,
        responsable: inventaireForm.responsableComptage,
        motif: `Ajustement d'inventaire physique : Théorique = ${theorique}, Physique = ${physique}, Écart = ${ecart > 0 ? '+' : ''}${ecart} ${mp.unite} (${ecartVal.toLocaleString()} FCFA). Motif : ${inventaireForm.justification}`
      });

      await db.inventorySessions.add({
        id: `inv-sess-${Date.now()}`,
        date: today,
        frequence: 'EXCEPTIONNEL',
        titre: `Inventaire Physique - ${mp.nom}`,
        responsable: inventaireForm.responsableComptage,
        totalArticles: 1,
        articlesConformes: ecart === 0 ? 1 : 0,
        articlesEnEcart: ecart !== 0 ? 1 : 0,
        valeurEcartNetFCFA: ecartVal,
        statutValidation: 'VALIDE',
        notes: inventaireForm.justification,
        articles: [{
          articleId: mp.id,
          articleNom: mp.nom,
          articleType: 'MATIERE_PREMIERE',
          unite: mp.unite,
          stockTheorique: theorique,
          stockPhysique: physique,
          ecartQuantite: ecart,
          valeurUnitaireFCFA: mp.coutMoyenAchatFCFA,
          ecartValeurFCFA: ecartVal,
          statut: ecart === 0 ? 'CONFORME' : ecart > 0 ? 'SURPLUS' : 'DEFICIT',
          justification: inventaireForm.justification
        }]
      });
    } else {
      const pf = products.find(p => p.id === inventaireForm.articleId) || products[0];
      if (!pf) return;
      const theorique = pf.stockFardeaux;
      const physique = Number(inventaireForm.stockPhysique) || 0;
      const ecart = physique - theorique;
      const ecartVal = ecart * pf.prixFardeauFCFA;

      await db.alveoleProducts.update(pf.id, { 
        stockFardeaux: physique,
        stockTotalUnites: physique * (pf.quantiteParFardeau || 100)
      });

      await db.stockMovements.add({
        id: `mov-inv-${Date.now()}`,
        date: today,
        type: ecart >= 0 ? 'ENTREE_PRODUCTION_PF' : 'SORTIE_EXPEDITION',
        articleType: 'PRODUIT_FINI',
        articleId: pf.id,
        articleNom: pf.nom,
        quantite: Math.abs(ecart),
        unite: 'Fardeau (100)',
        responsable: inventaireForm.responsableComptage,
        motif: `Ajustement d'inventaire PF : Théorique = ${theorique}, Physique = ${physique}, Écart = ${ecart > 0 ? '+' : ''}${ecart} lots (${ecartVal.toLocaleString()} FCFA). Motif : ${inventaireForm.justification}`
      });

      await db.inventorySessions.add({
        id: `inv-sess-${Date.now()}`,
        date: today,
        frequence: 'EXCEPTIONNEL',
        titre: `Inventaire Physique - ${pf.nom}`,
        responsable: inventaireForm.responsableComptage,
        totalArticles: 1,
        articlesConformes: ecart === 0 ? 1 : 0,
        articlesEnEcart: ecart !== 0 ? 1 : 0,
        valeurEcartNetFCFA: ecartVal,
        statutValidation: 'VALIDE',
        notes: inventaireForm.justification,
        articles: [{
          articleId: pf.id,
          articleNom: pf.nom,
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeau (100)',
          stockTheorique: theorique,
          stockPhysique: physique,
          ecartQuantite: ecart,
          valeurUnitaireFCFA: pf.prixFardeauFCFA,
          ecartValeurFCFA: ecartVal,
          statut: ecart === 0 ? 'CONFORME' : ecart > 0 ? 'SURPLUS' : 'DEFICIT',
          justification: inventaireForm.justification
        }]
      });
    }

    setShowInventaireModal(false);
  };

  return (
    <div className="space-y-6">
      {/* ─── BANNIÈRE ENTREPÔT OFFICIELLE (CDC 6.1 - 7 CATÉGORIES) ───────── */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-950 p-5 sm:p-6 rounded-3xl text-white shadow-xl border border-slate-800">
        <div>
          <div className="flex flex-wrap items-center gap-2 mb-1.5">
            <span className="px-3 py-0.5 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1.5">
              <Warehouse className="w-3.5 h-3.5" />
              Module 3 — Approvisionnements & Gestion des Stocks
            </span>
            <span className="text-xs text-slate-400">• Compartimentation Stricte des 7 Catégories</span>
          </div>
          <h1 className="text-xl sm:text-3xl font-black tracking-tight">
            Stocks Usine & Approvisionnements Papier
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-3xl leading-relaxed">
            Tarif standard d'achat carton brut : <strong>250 FCFA / kg</strong> • Distinction nette entre matière brute reçue, matière exploitable après tri, stocks déportés commerciaux et quarantaine.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <ExportPdfButton onExport={() => exportStockPdf(currentTheme.hex)} />
          <button
            onClick={() => setShowSortieProductionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Split className="w-4 h-4" />
            Sortie Pulpeur
          </button>
          <button
            onClick={() => setShowExitVoucherModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <Truck className="w-4 h-4" />
            Sortie Commercial
          </button>
          <button
            onClick={() => setShowInventaireModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs transition-all shadow-md active:scale-95"
          >
            <ClipboardCheck className="w-4 h-4" />
            Session d'Inventaire
          </button>
          <button
            onClick={() => setShowReceptionModal(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black text-xs transition-all shadow-lg active:scale-95"
          >
            <PackagePlus className="w-4 h-4" />
            + Nouvelle Réception / Collecte
          </button>
        </div>
      </div>

      {/* ─── BANDEAU D'ALERTES CRITIQUES & COUVERTURE MATIÈRE (CDC 6.4) ──── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Jauge Jours de Couverture Matière Première */}
        <div className={`p-5 rounded-2xl border transition-all ${
          alerteCouvertureStatut === 'CRITIQUE'
            ? 'bg-red-50 border-red-300 text-red-950'
            : alerteCouvertureStatut === 'SECURITE'
            ? 'bg-amber-50 border-amber-300 text-amber-950'
            : 'bg-emerald-50 border-emerald-300 text-emerald-950'
        }`}>
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
              <Clock className="w-4 h-4" />
              Jours de Couverture Estimés (CDC 6.4)
            </span>
            <span className={`px-2.5 py-1 rounded-full text-[10px] font-black uppercase ${
              alerteCouvertureStatut === 'CRITIQUE'
                ? 'bg-red-600 text-white animate-pulse'
                : alerteCouvertureStatut === 'SECURITE'
                ? 'bg-amber-500 text-white'
                : 'bg-emerald-600 text-white'
            }`}>
              {alerteCouvertureStatut === 'CRITIQUE' ? '🔴 Moins de 5 Jours' : alerteCouvertureStatut === 'SECURITE' ? '🟠 Seuil de Sécurité (5-9 j)' : '🟢 Stock Confortable'}
            </span>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-3xl font-black">{joursCouvertureMatiere}</span>
            <span className="text-sm font-semibold">jours de production</span>
          </div>
          <p className="text-xs mt-1.5 opacity-85">
            Consommation moyenne : <strong>{consommationMoyenneJourKg} kg/jour</strong> {isDonneesConsommationInsuffisantes && <span className="text-amber-200 block text-[10px] font-bold">⚠️ Données réelles insuffisantes : calcul basé sur la cible mensuelle CDC (~10 100 kg/mois).</span>} • Stock exploitable : <strong>{(totalCartonExploitableKg / 1000).toFixed(1)} T</strong> ({totalCartonExploitableKg.toLocaleString()} kg)
          </p>
        </div>

        {/* Alerte Intrants Chimiques (Règle Audio : Seuil 25%) */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <ShieldAlert className="w-4 h-4 text-purple-600" />
              Intrants & Produits Chimiques (CMC, Amidon, Liants)
            </span>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
              intrantsEnAlerte.length > 0 ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
            }`}>
              {intrantsEnAlerte.length > 0 ? `⚠️ ${intrantsEnAlerte.length} en alerte ≤25%` : '✓ Stocks OK'}
            </span>
          </div>
          <div className="mt-2 text-xs space-y-1">
            {intrantsChimiques.slice(0, 3).map(m => (
              <div key={m.id} className="flex justify-between items-center py-0.5 border-b border-slate-50">
                <span className="text-slate-600 truncate max-w-[160px]">{m.nom}</span>
                <span className="font-bold text-slate-900">{m.stockActuel} {m.unite}</span>
              </div>
            ))}
          </div>
          <div className="mt-2 text-[11px] text-slate-500 italic">
            Alerte automatique dès que le stock descend à 25% du niveau de sécurité.
          </div>
        </div>

        {/* Valorisation Globale Usine */}
        <div className="p-5 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-emerald-600" />
              Valorisation Totale des Stocks
            </span>
            <span className="text-xs font-black text-emerald-700">{valorisationGlobale.toLocaleString()} FCFA</span>
          </div>
          <div className="mt-3 grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-[10px] text-slate-400">Produits Finis</span>
              <strong className="text-slate-800">{valorisationPF.toLocaleString()} F</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-[10px] text-slate-400">Carton (250 F)</span>
              <strong className="text-slate-800">{valorisationCarton.toLocaleString()} F</strong>
            </div>
            <div className="p-2 rounded-xl bg-slate-50">
              <span className="block text-[10px] text-slate-400">Intrants</span>
              <strong className="text-slate-800">{valorisationIntrants.toLocaleString()} F</strong>
            </div>
          </div>
          <div className="mt-2 text-[11px] text-slate-500 text-center">
            Inventaire valorisé au coût moyen pondéré (PMP)
          </div>
        </div>
      </div>

      {/* ─── LES 7 CATÉGORIES DE STOCKS HERMÉTIQUES (CDC 6.1) ────────────── */}
      <div className="bg-slate-900 p-4 sm:p-5 rounded-3xl text-white shadow-lg border border-slate-800">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs sm:text-sm font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Boxes className="w-4 h-4" />
            Les 7 Catégories de Stocks Distinctes (CDC Section 6.1)
          </h2>
          <span className="text-[11px] text-slate-400 hidden sm:inline">« Une quantité n'est jamais disponible à la vente simplement parce qu'elle existe sur site »</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
          {/* 1. Matière brute avant tri */}
          <button
            onClick={() => setActiveTab('RECEPTIONS_COLLECTES')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'RECEPTIONS_COLLECTES' ? 'bg-amber-500/20 border-amber-400 ring-2 ring-amber-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-amber-300 block">1. Brut Reçu (Avant Tri)</span>
            <span className="text-lg font-black text-white">{totalMatiereBruteEnAttenteKg.toLocaleString()} <span className="text-[11px] font-normal text-slate-300">kg</span></span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Quai de déchargement</span>
          </button>

          {/* 2. Matière exploitable après tri */}
          <button
            onClick={() => setActiveTab('MATIERES_EXPLOITABLES')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'MATIERES_EXPLOITABLES' ? 'bg-emerald-500/20 border-emerald-400 ring-2 ring-emerald-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-emerald-300 block">2. Exploitable Pulpeur</span>
            <span className="text-lg font-black text-white">{(totalCartonExploitableKg / 1000).toFixed(1)} <span className="text-[11px] font-normal text-slate-300">T</span></span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Trié et prêt à l'emploi</span>
          </button>

          {/* 3. Matières rejetées / attente décision */}
          <button
            onClick={() => setActiveTab('MATIERES_REJETEES')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'MATIERES_REJETEES' ? 'bg-rose-500/20 border-rose-400 ring-2 ring-rose-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-rose-300 block">3. Matière Rejetée</span>
            <span className="text-lg font-black text-white">{totalMatieresRejeteesKg.toLocaleString()} <span className="text-[11px] font-normal text-slate-300">kg</span></span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Quarantaine / Arbitrage</span>
          </button>

          {/* 4. Produits finis conformes usine */}
          <button
            onClick={() => setActiveTab('PRODUITS_FINIS')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'PRODUITS_FINIS' ? 'bg-blue-500/20 border-blue-400 ring-2 ring-blue-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-blue-300 block">4. PF Conformes Usine</span>
            <span className="text-lg font-black text-white">{totalFardeauxUsine.toLocaleString()} <span className="text-[11px] font-normal text-slate-300">lots</span></span>
            <span className="text-[10px] text-blue-400/80 block mt-0.5">Sortie Production • 3 500 F</span>
          </button>

          {/* 5. Produits confiés aux commerciaux */}
          <button
            onClick={() => setActiveTab('STOCKS_COMMERCIAUX')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'STOCKS_COMMERCIAUX' ? 'bg-indigo-500/20 border-indigo-400 ring-2 ring-indigo-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-indigo-300 block">5. Confiés Commerciaux</span>
            <span className="text-lg font-black text-white">{totalLotsDetenusCommerciaux} <span className="text-[11px] font-normal text-slate-300">lots</span></span>
            <span className="text-[10px] text-indigo-400/80 block mt-0.5">Géré en Commercial</span>
          </button>

          {/* 6. Retours en attente de contrôle */}
          <button
            onClick={() => setActiveTab('RETOURS_CONTROLE')}
            className={`p-3 rounded-2xl text-left border transition-all ${
              activeTab === 'RETOURS_CONTROLE' ? 'bg-purple-500/20 border-purple-400 ring-2 ring-purple-400/30' : 'bg-slate-800/80 border-slate-700 hover:bg-slate-800'
            }`}
          >
            <span className="text-[10px] font-bold text-purple-300 block">6. Retours Invendus</span>
            <span className="text-lg font-black text-white">{totalLotsEnAttenteControle} <span className="text-[11px] font-normal text-slate-300">lots</span></span>
            <span className="text-[10px] text-purple-400/80 block mt-0.5">Géré en Commercial</span>
          </button>

          {/* 7. Produits déclassés ou rebutés */}
          <button
            onClick={() => setActiveTab('MATIERES_REJETEES')}
            className="p-3 rounded-2xl text-left border bg-slate-800/80 border-slate-700 hover:bg-slate-800 transition-all"
          >
            <span className="text-[10px] font-bold text-slate-400 block">7. Déclassés / Rebuts</span>
            <span className="text-lg font-black text-white">{totalMatieresEvacueesKg} <span className="text-[11px] font-normal text-slate-300">kg</span></span>
            <span className="text-[10px] text-slate-400 block mt-0.5">Sortie définitive usine</span>
          </button>
        </div>
      </div>

      {/* ─── NAVIGATION SECONDAIRE PAR ONGLETS FLUIDES (MATIÈRES PREMIÈRES & INTRANTS) ── */}
      <div className="flex items-center gap-2 overflow-x-auto scrollbar-none pb-2 border-b border-slate-200">
        {[
          { key: 'VUE_ENSEMBLE_7_STOCKS', label: '📊 Tableau de Bord Matières' },
          { key: 'RECEPTIONS_COLLECTES', label: `🚚 Réceptions Carton (${receptions.length})` },
          { key: 'MATIERES_EXPLOITABLES', label: `♻️ Matières & Intrants Chimiques (${rawMaterials.length})` },
          { key: 'DEMANDES_SORTIES_PRODUCTION', label: `📑 Sorties Pulpeur & Production (${materialExitRequests.length})` },
          { key: 'MATIERES_REJETEES', label: `🚫 Quarantaine & Rebuts (${rejectedMaterials.length + supplierReturns.length})` },
          { key: 'INVENTAIRES_MOUVEMENTS', label: `📋 Inventaires & Historique Matières (${movements.length})` },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shrink-0 ${
              activeTab === tab.key
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* ─── CONTENU 1 : VUE D'ENSEMBLE 7 STOCKS & MATRICES ──────────────── */}
      {activeTab === 'VUE_ENSEMBLE_7_STOCKS' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Cartons & Matières Premières */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Papier / Carton & Approvisionnements</h3>
                  <p className="text-xs text-slate-500">Flux de la réception brute vers le stock exploitable pulpeur</p>
                </div>
                <button
                  onClick={() => setShowReceptionModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-500"
                >
                  + Réceptionner
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-slate-700 block">1. Réceptions en Quai (Avant Tri)</span>
                    <span className="text-[11px] text-amber-700 font-semibold">Sous réserve de contrôle qualité</span>
                  </div>
                  <span className="text-xl font-black text-slate-900">{totalMatiereBruteEnAttenteKg.toLocaleString()} kg</span>
                </div>

                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-emerald-900 block">2. Stock Exploitable Pulpeur</span>
                    <span className="text-[11px] text-emerald-700 font-semibold">Balles OCC & Journaux utilisables</span>
                  </div>
                  <span className="text-xl font-black text-emerald-700">{totalCartonExploitableKg.toLocaleString()} kg</span>
                </div>

                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-rose-900 block">3. Matières Rejetées (Quarantaine)</span>
                    <span className="text-[11px] text-rose-700 font-semibold">Humides, plastiques, adhésifs</span>
                  </div>
                  <span className="text-xl font-black text-rose-700">{totalMatieresRejeteesKg.toLocaleString()} kg</span>
                </div>
              </div>
            </div>

            {/* Produits Finis & Commerciaux */}
            <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="font-black text-slate-900 text-base">Produits Finis (Lots de 100)</h3>
                  <p className="text-xs text-slate-500">Usine, Commerciaux en tournée et retours invendus</p>
                </div>
                <button
                  onClick={() => setShowExitVoucherModal(true)}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-500"
                >
                  + Bon de Sortie
                </button>
              </div>

              <div className="space-y-3">
                <div className="p-4 rounded-2xl bg-blue-50 border border-blue-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-blue-900 block">4. Stock Conforme Usine</span>
                    <span className="text-[11px] text-blue-700 font-semibold">Vente par paquet de 100 uniquement (3 500 F)</span>
                  </div>
                  <span className="text-xl font-black text-blue-800">{totalFardeauxUsine.toLocaleString()} lots</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-purple-900 block">5. Stock Détenu Commerciaux</span>
                    <span className="text-[11px] text-purple-700 font-semibold">Non considéré comme vendu avant facturation</span>
                  </div>
                  <span className="text-xl font-black text-purple-800">{totalLotsDetenusCommerciaux} lots</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                  <div>
                    <span className="text-xs font-bold text-amber-900 block">6. Retours Invendus (À Contrôler)</span>
                    <span className="text-[11px] text-amber-700 font-semibold">En attente de réintégration ou recyclage</span>
                  </div>
                  <span className="text-xl font-black text-amber-800">{totalLotsEnAttenteControle} lots</span>
                </div>
              </div>
            </div>
          </div>

          {/* Section 1.3 Spécification Client : Registre des Entrées Produits Finis Conformes Validés */}
          <div className="mt-8 pt-6 border-t border-slate-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
              <div>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase inline-flex items-center gap-1 mb-1">
                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                  Directive 1.3 CDC • Produits Finis Conformes
                </span>
                <h3 className="text-sm font-black text-slate-900">
                  Journal des Entrées en Stock Conformes après Validation Production
                </h3>
                <p className="text-xs text-slate-500">
                  Toutes les entrées sont strictement reliées au rapport de production, au lot, au responsable de validation et scellées sous un numéro de pièce unique.
                  <strong className="text-red-700 ml-1">Règle absolue : les produits non conformes (rebuts) ne sont jamais admis au stock commercialisable.</strong>
                </p>
              </div>
            </div>

            <div className="overflow-x-auto border border-slate-200 rounded-2xl">
              <table className="w-full text-left text-xs min-w-[800px]">
                <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">N° Pièce Unique & Date</th>
                    <th className="py-3 px-4">Rapport de Production Associé</th>
                    <th className="py-3 px-4">Lot de Production</th>
                    <th className="py-3 px-4">Produit Conforme</th>
                    <th className="py-3 px-4 text-center">Quantité Conforme (Unités)</th>
                    <th className="py-3 px-4 text-center">Fardeaux (Paquets 100)</th>
                    <th className="py-3 px-4">Responsable Validation</th>
                    <th className="py-3 px-4 text-center">Statut Commercial</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {shifts.filter(s => s.statutValidation === 'VALIDE' || !s.statutValidation).map(shift => {
                    const fardeaux = shift.fardeauxEmballes || Math.floor(shift.alvéolesConformes / 100);
                    return (
                      <tr key={shift.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-slate-900 block">
                            ENT-PF-{shift.date.replace(/-/g, '')}-{shift.id.slice(-4)}
                          </span>
                          <span className="text-[10px] text-slate-400">{shift.date} ({shift.heureArret || '16:00'})</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono text-indigo-700 font-bold">{shift.numeroRapport || shift.id}</span>
                          <span className="text-[10px] text-slate-500 block">Ligne 1 • {shift.shift}</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono bg-slate-100 px-2 py-0.5 rounded text-[11px] font-bold text-slate-700">
                            LOT-{shift.date.replace(/-/g, '')}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <div className="font-bold text-slate-900">{shift.produitNom || 'Plateau 30 Œufs Standard'}</div>
                          <span className="text-[10px] text-slate-400">Poids moyen ~70g • Qualité A</span>
                        </td>
                        <td className="py-3 px-4 text-center font-black text-emerald-700 text-sm">
                          {shift.alvéolesConformes.toLocaleString()} alv.
                        </td>
                        <td className="py-3 px-4 text-center font-black text-slate-900">
                          {fardeaux} lots (100)
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-slate-800">{shift.validePar || shift.responsableShift || 'Direction Production'}</span>
                          <span className="text-[10px] text-emerald-600 block font-semibold">✓ Visa Enregistré</span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                            Disponible Vente
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

      {/* ─── CONTENU 2 : RÉCEPTIONS FOURNISSEURS & COLLECTES USINE ───────── */}
      {activeTab === 'RECEPTIONS_COLLECTES' && (
        <div className="space-y-6">
          {/* ══════════════════════════════════════════════════════════════════════
              PANNEAU OFFICIEL : SCHÉMA EXPLICATIF DU PROCESSUS D'APPROVISIONNEMENT
              (Conforme au Schéma Explicatif Pages 1, 2, 3 & 4 du Client)
              ══════════════════════════════════════════════════════════════════════ */}
          <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 font-black">
                  <Scale className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-amber-300">Schéma Explicatif : Processus Réception, Tri & Valorisation des Stocks</h3>
                  <p className="text-xs text-slate-400">Modèle officiel de calcul du Rendement de tri et de Détermination de la Valeur du Stock Entrant (PMP)</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                PMP Entrants Actuel : ~{coutMoyenPondereStockEntrantKg} FCFA/kg
              </span>
            </div>

            {/* Les 3 Étapes du Schéma (Page 1 & 3) */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Étape 1 : Réception Fournisseur / Collecte */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-amber-400 uppercase">
                  <Truck className="w-4 h-4" />
                  1. Réception Quai (14 Rubriques)
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  Numéro bon, Fournisseur/Agent, Date/Heure, Type matière, Pesée déclarée vs physique pesée pont-bascule, PU, N° Facture, Transporteur, Immatriculation, Observations et Réceptionnaire.
                </p>
                <div className="pt-2 border-t border-slate-800 text-[10px] text-slate-400 flex justify-between">
                  <span>En attente de tri :</span>
                  <strong className="text-amber-400">{totalMatiereBruteEnAttenteKg.toLocaleString()} kg</strong>
                </div>
              </div>

              {/* Étape 2 : Tri et Contrôle de la Matière */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase">
                  <Split className="w-4 h-4" />
                  2. Tri & Contrôle Qualité
                </div>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[10px] font-mono text-emerald-300 space-y-1">
                  <div>Rendement Tri = (Qté exploitable ÷ Qté brute) × 100</div>
                  <div className="text-slate-400">Coût de revient/kg = Montant total ÷ Qté conforme</div>
                </div>
                <p className="text-[11px] text-slate-300">
                  Séparation stricte : Matière conforme orientée pulpeur, matière non conforme isolée en quarantaine / Bon de retour.
                </p>
              </div>

              {/* Étape 3 : Entrée en Stock & Détermination Valeur PMP */}
              <div className="bg-slate-900/90 p-4 rounded-2xl border border-slate-700/80 space-y-2">
                <div className="flex items-center gap-2 text-xs font-black text-sky-400 uppercase">
                  <DollarSign className="w-4 h-4" />
                  3. Entrée en Stock & Valeur PMP
                </div>
                <p className="text-[11px] text-slate-300">
                  Détermination de la valeur du stock entrants selon la formule pondérée :
                </p>
                <div className="bg-slate-950 p-2.5 rounded-xl border border-slate-800 text-[9px] font-mono text-sky-300 leading-relaxed">
                  [ (Stock acquis × Coût Kg acquis) + (Stock collecté × Coût Kg collecté) ] ÷ [ Stock acquis + Stock collecté ]
                </div>
              </div>
            </div>

            {/* Données Industrielles en Direct (Chiffres réels de l'usine) */}
            <div className="mt-4 pt-4 border-t border-slate-800 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Stock Acquis (Fournisseurs 250 F) :</span>
                <strong className="text-white text-sm">{stockAcquisConformeKg.toLocaleString()} kg</strong>
                <span className="text-emerald-400 text-[11px] block mt-0.5">Coût unitaire : ~{coutRevientKgAcquis} FCFA/kg</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Stock Collecté (Usine / Location) :</span>
                <strong className="text-white text-sm">{stockCollecteConformeKg.toLocaleString()} kg</strong>
                <span className="text-purple-400 text-[11px] block mt-0.5">Coût de revient : ~{coutRevientKgCollecte} FCFA/kg</span>
              </div>
              <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80">
                <span className="text-slate-400 block text-[10px]">Coût Moyen Pondéré du Stock Entrant :</span>
                <strong className="text-amber-300 text-sm">~{coutMoyenPondereStockEntrantKg} FCFA / kg</strong>
                <span className="text-slate-400 text-[11px] block mt-0.5">Total conforme : {totalStockConformeEntrantKg.toLocaleString()} kg</span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <div>
                <h2 className="text-base font-black text-slate-900">Bons de Réception Fournisseurs & Collectes Usine</h2>
                <p className="text-xs text-slate-500">Traçabilité des livraisons à 250 FCFA/kg et collectes d'imprimeries/entreprises avec véhicules</p>
              </div>
              <button
                onClick={() => setShowReceptionModal(true)}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
              >
                <Plus className="w-4 h-4" />
                Nouvelle Réception
              </button>
            </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-5">N° Bon & Date</th>
                  <th className="py-3.5 px-4">Mode & Source</th>
                  <th className="py-3.5 px-4">Matière & Type</th>
                  <th className="py-3.5 px-4 text-center">Quantité Brute</th>
                  <th className="py-3.5 px-4 text-right">Tarif / Coût Brut</th>
                  <th className="py-3.5 px-4 text-center">Statut du Tri</th>
                  <th className="py-3.5 px-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {receptions.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-5">
                      <div className="font-bold text-slate-900 font-mono">{r.numeroBon}</div>
                      <div className="text-[10px] text-slate-400">{r.date} à {r.heure}</div>
                      {r.numeroBonPesee && (
                        <span className="text-[9px] bg-slate-100 px-1.5 py-0.5 rounded text-slate-600 font-mono">Pesée: {r.numeroBonPesee}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`inline-block px-2 py-0.5 rounded text-[10px] font-bold mb-1 ${
                        r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                      }`}>
                        {r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' ? '🚚 Fournisseur' : '🚐 Collecte Usine'}
                      </span>
                      <div className="font-bold text-slate-800">{r.fournisseurNom}</div>
                      {r.chauffeurNom && <div className="text-[10px] text-slate-400">Chauffeur: {r.chauffeurNom} ({r.vehiculeImmatriculation})</div>}
                      {r.agentCollecteNom && <div className="text-[10px] text-slate-400">Agent: {r.agentCollecteNom}</div>}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{r.mpNom}</div>
                      <div className="text-[10px] text-slate-500">{r.typePapierCarton}</div>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                      {r.quantiteBruteReceptionneeKg.toLocaleString()} kg
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {r.estGratuitDebarras ? (
                        <div>
                          <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-black">GRATUIT (0 F/kg)</span>
                          <div className="text-[10px] text-slate-400">Transport: {r.coutTotalBrutFCFA.toLocaleString()} F</div>
                        </div>
                      ) : (
                        <div>
                          <span className="font-bold text-slate-900">{r.coutTotalBrutFCFA.toLocaleString()} FCFA</span>
                          <div className="text-[10px] text-slate-500">250 FCFA / kg</div>
                        </div>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {r.statutTri === 'TRI_EFFECTUE' ? (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-700">
                          ✓ Trié ({r.rendementTriPourcent}% rdt)
                        </span>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                          ⏳ En Attente de Tri
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {r.statutTri === 'EN_ATTENTE_DE_TRI' ? (
                          <button
                            onClick={() => {
                              setTriForm({
                                quantiteExploitableKg: Math.round(r.quantiteBruteReceptionneeKg * 0.95),
                                quantiteRejeteeKg: Math.round(r.quantiteBruteReceptionneeKg * 0.05),
                                responsableTri: 'Modou Faye (Chef Tri)',
                                motifRejet: 'Rubans adhésifs et impuretés',
                                observations: '',
                                genererBonRetourFournisseur: false
                              });
                              setShowTriModal(r);
                            }}
                            className="px-2.5 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md active:scale-95"
                          >
                            Procéder au Tri
                          </button>
                        ) : (
                          <span className="text-[11px] text-slate-400 font-semibold">
                            Exploitable : {r.quantiteExploitableKg?.toLocaleString()} kg
                            <br /><span className="text-emerald-600 font-bold">Coût: {r.coutRevientReelKg} F/kg</span>
                          </span>
                        )}
                        <button
                          onClick={() => exportReceptionPdf(r, currentTheme.hex)}
                          title="Imprimer le Bon de Réception Officiel"
                          className="p-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs border border-slate-200 transition-all"
                        >
                          <Printer className="w-4 h-4 text-slate-600" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
      )}

      {/* ─── CONTENU 3 : MATIÈRES PREMIÈRES EXPLOITABLES (STOCK UNIQUE RÉUNI & INTRANTS) ──── */}
      {activeTab === 'MATIERES_EXPLOITABLES' && (
        <div className="space-y-6">
          {/* Section 1 : Stock Unique Papier / Carton Réuni après tri (Spécification Client & CDC 6.4) */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 uppercase">
                    Stock Unique Centralisé
                  </span>
                  <span className="text-xs text-slate-400">• Fournisseurs (250 F/kg) + Collectes Usine (0 F/kg)</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  Stock Papier & Carton Exploitable Réuni
                </h2>
                <p className="text-xs text-slate-500">
                  Une fois le tri validé sur quai, toutes les matières conformes sont réunies dans le stock unique utilisable pour alimenter le pulpeur.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowDemandeSortieModal(true)}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm active:scale-95"
                >
                  <Split className="w-4 h-4" />
                  Demander Sortie Production
                </button>
              </div>
            </div>

            {/* Statistiques Stock Papier Unique */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-5">
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                <span className="text-xs font-bold text-emerald-900 block">Volume Exploitable Total</span>
                <span className="text-2xl font-black text-emerald-800">
                  {(totalCartonExploitableKg / 1000).toFixed(1)} <span className="text-sm font-semibold">Tonnes</span>
                </span>
                <span className="text-[11px] text-emerald-700 block mt-0.5">
                  ({totalCartonExploitableKg.toLocaleString()} kg disponibles au pulpeur)
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Jours de Couverture Estimés (CDC 6.4)</span>
                <span className="text-2xl font-black text-slate-900">
                  {joursCouvertureMatiere} <span className="text-sm font-semibold">jours</span>
                </span>
                <span className={`text-[11px] font-bold block mt-0.5 ${
                  joursCouvertureMatiere >= 10 ? 'text-emerald-600' : joursCouvertureMatiere >= 5 ? 'text-amber-600' : 'text-red-600'
                }`}>
                  {joursCouvertureMatiere >= 10 ? '🟢 Confort (Cible ≥ 10j)' : joursCouvertureMatiere >= 5 ? '🟠 Sécurité (7 à 10j)' : '🔴 Seuil critique (< 5j)'}
                </span>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200">
                <span className="text-xs font-bold text-slate-700 block">Valorisation Réelle (PUMP)</span>
                <span className="text-2xl font-black text-slate-900">
                  {valorisationCarton.toLocaleString()} <span className="text-xs font-bold text-slate-500">FCFA</span>
                </span>
                <span className="text-[11px] text-slate-500 block mt-0.5">
                  PUMP moyen : ~{(valorisationCarton / (totalCartonExploitableKg || 1)).toFixed(1)} FCFA/kg
                </span>
              </div>
            </div>

            {/* Grille des types de papier exploitable */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {rawMaterials.filter(m => m.categorie === 'PAPIER_CARTON').map(m => (
                <div key={m.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start">
                      <span className="text-[10px] font-mono text-slate-400">{m.reference}</span>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                        {m.stockActuel > m.seuilSecurite ? '✓ Stock Conforme' : '⚠️ Réapprovisionner'}
                      </span>
                    </div>
                    <h4 className="font-bold text-slate-900 text-sm mt-1">{m.nom}</h4>
                    <p className="text-[11px] text-slate-500 mt-1">Fournisseur : {m.fournisseurPrincipal}</p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs">
                    <div className="flex justify-between items-baseline">
                      <span className="text-slate-500">Stock Actuel :</span>
                      <span className="text-xl font-black text-slate-900">{m.stockActuel.toLocaleString()} {m.unite}</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Coût d'acquisition :</span>
                      <span className="font-bold text-slate-800">{m.coutMoyenAchatFCFA} FCFA / kg</span>
                    </div>
                    <div className="flex justify-between text-slate-500">
                      <span>Emplacement Hangar :</span>
                      <span className="font-semibold text-slate-700">{m.emplacementStock}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Section 2 : Statut "Intrants" (CMC, Amidon, Calque...) - RÈGLE CLIENT SEUIL 25% */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-purple-100 text-purple-800 uppercase flex items-center gap-1">
                    <ShieldAlert className="w-3.5 h-3.5 text-purple-600" />
                    La liste des additifs qui doivent faire l'objet de gestion du stock (Schéma p.2 & p.4)
                  </span>
                  <span className="text-xs text-purple-700 font-bold">• Seuil d'Alerte 25%</span>
                </div>
                <h2 className="text-base sm:text-lg font-black text-slate-900">
                  1. Eau de Procédé • 2. AKD (Alkyl Ketene Dimer) • 3. Amidon Cationique • 4. CMC • 5. Talc Industriel • 6. Anti-Mousse Defoamer
                </h2>
                <p className="text-xs text-slate-500">
                  Gestion de stock stricte des 6 additifs officiels de formulation de pâte moulée. Alerte de réapprovisionnement automatique dès franchissement du seuil critique de 25% du stock.
                </p>
              </div>
            </div>

            {/* ── Section Mouvements Entrées / Sorties Intrants ────────────────── */}
            <div className="mt-6 border-t border-slate-200 pt-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
                    <span className="text-base">📈</span>
                    Journal des Mouvements Intrants & Prix Fournisseurs
                  </h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">
                    Toutes les entrées achats avec prix unitaire fournisseur et référence de paiement, et sorties de production.
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => { setShowIntrantMvtModal('ENTREE_ACHAT'); setSelectedIntrantForMvt(rawMaterials.find(m => m.estIntrant) || null); }}
                    className="px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Entrée Intrant
                  </button>
                  <button
                    onClick={() => { setShowIntrantMvtModal('SORTIE_PRODUCTION'); setSelectedIntrantForMvt(rawMaterials.find(m => m.estIntrant) || null); }}
                    className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 active:scale-95"
                  >
                    <Split className="w-3.5 h-3.5" />
                    Sortie Production
                  </button>
                </div>
              </div>

              {/* Sous-onglets */}
              <div className="flex gap-2 mb-4">
                {(['MOUVEMENTS', 'FOURNISSEURS'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setIntrantActiveTab(tab)}
                    className={`px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      intrantActiveTab === tab
                        ? 'bg-slate-900 text-white'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                    }`}
                  >
                    {tab === 'MOUVEMENTS' ? '📋 Mouvements (' + intrantMovements.filter(m => m.intrantId === (rawMaterials.find(r => r.estIntrant)?.id || '')).length + ')' : '🏭 Catalogue Fournisseurs (' + intrantSuppliers.length + ')'}
                  </button>
                ))}
              </div>

              {intrantActiveTab === 'MOUVEMENTS' && (
                <div className="overflow-x-auto rounded-2xl border border-slate-200">
                  <table className="w-full text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-semibold">
                      <tr>
                        <th className="text-left py-3 px-3">N° Mouvement / Bon</th>
                        <th className="text-left py-3 px-2">Date / Heure</th>
                        <th className="text-left py-3 px-2">Type</th>
                        <th className="text-left py-3 px-3">Matière Intrant</th>
                        <th className="text-left py-3 px-3">Origine & Fournisseur</th>
                        <th className="text-right py-3 px-3">Quantité</th>
                        <th className="text-right py-3 px-3">Prix Usine / Rendu</th>
                        <th className="text-right py-3 px-3">Coût Total</th>
                        <th className="text-left py-3 px-3">Certificat & Qualité</th>
                        <th className="text-left py-3 px-3">Règlement</th>
                        <th className="text-center py-3 px-2">Fiche / Bon</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {intrantMovements.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-8 text-slate-400 text-xs">
                            {"Aucun mouvement enregistré. Enregistrez une réception ou une sortie d'intrant."}
                          </td>
                        </tr>
                      ) : intrantMovements.map(mvt => {
                        const isEntree = mvt.type === 'ENTREE_ACHAT' || mvt.type === 'ENTREE_RETOUR_PRODUCTION' || mvt.type === 'ENTREE_AJUSTEMENT';
                        const flag = !mvt.paysProvenance ? '🌐' :
                          mvt.paysProvenance.toLowerCase().includes('sénégal') || mvt.paysProvenance.toLowerCase().includes('senegal') ? '🇸🇳' :
                          mvt.paysProvenance.toLowerCase().includes('chine') || mvt.paysProvenance.toLowerCase().includes('china') ? '🇨🇳' :
                          mvt.paysProvenance.toLowerCase().includes('france') ? '🇫🇷' :
                          mvt.paysProvenance.toLowerCase().includes('maroc') ? '🇲🇦' :
                          mvt.paysProvenance.toLowerCase().includes('ivoire') ? '🇨🇮' :
                          mvt.paysProvenance.toLowerCase().includes('inde') ? '🇮🇳' :
                          mvt.paysProvenance.toLowerCase().includes('turquie') ? '🇹🇷' :
                          mvt.paysProvenance.toLowerCase().includes('usa') || mvt.paysProvenance.toLowerCase().includes('états') ? '🇺🇸' : '🌍';

                        return (
                          <tr key={mvt.id} className={`hover:bg-slate-50 transition-colors ${ isEntree ? 'border-l-2 border-l-emerald-500' : 'border-l-2 border-l-indigo-500' }`}>
                            <td className="py-2.5 px-3">
                              <span className="font-mono text-[10px] font-bold text-slate-700">{mvt.numeroMouvement}</span>
                              {mvt.numeroBonGenere && (
                                <p className="text-[9px] text-emerald-600 font-mono font-medium">{mvt.numeroBonGenere}</p>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-slate-600 whitespace-nowrap">
                              <span className="font-medium text-slate-800">{mvt.date}</span>
                              <span className="text-[10px] text-slate-400 block">{mvt.heure}</span>
                            </td>
                            <td className="py-2.5 px-2">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-black uppercase whitespace-nowrap ${
                                mvt.type === 'ENTREE_ACHAT' ? 'bg-emerald-100 text-emerald-800' :
                                mvt.type === 'SORTIE_PRODUCTION' ? 'bg-indigo-100 text-indigo-800' :
                                mvt.type === 'SORTIE_PERTE' ? 'bg-red-100 text-red-800' :
                                mvt.type === 'ENTREE_RETOUR_PRODUCTION' ? 'bg-cyan-100 text-cyan-800' :
                                'bg-slate-100 text-slate-700'
                              }`}>
                                {mvt.type === 'ENTREE_ACHAT' ? '⬆ Réception Achat' :
                                 mvt.type === 'SORTIE_PRODUCTION' ? '⬇ Sortie Prod' :
                                 mvt.type === 'SORTIE_PERTE' ? '⬇ Perte Rebut' :
                                 mvt.type === 'ENTREE_RETOUR_PRODUCTION' ? '⬆ Retour Prod' :
                                 mvt.type}
                              </span>
                            </td>
                            <td className="py-2.5 px-3">
                              <span className="font-bold text-slate-900 block max-w-[150px] truncate">{mvt.intrantNom.split(' — ')[0]}</span>
                              <span className="text-[10px] text-slate-400">{mvt.intrantCategorie}</span>
                            </td>
                            <td className="py-2.5 px-3">
                              {isEntree ? (
                                <div>
                                  <div className="flex items-center gap-1 font-semibold text-slate-800 text-[11px]">
                                    <span>{flag}</span>
                                    <span>{mvt.paysProvenance || 'Non renseigné'}</span>
                                    {mvt.villeUsine && <span className="text-slate-400 font-normal">({mvt.villeUsine})</span>}
                                  </div>
                                  <p className="text-[10px] text-slate-500 max-w-[140px] truncate font-medium">
                                    {mvt.fournisseurNom || 'Fournisseur usine'}
                                  </p>
                                </div>
                              ) : (
                                <div>
                                  <p className="font-semibold text-slate-700 text-[11px]">{mvt.ligneProduction || 'Ligne usine'}</p>
                                  <p className="text-[10px] text-slate-400">{mvt.shiftConsommation ? mvt.shiftConsommation.replace(/_/g, ' ') : 'Shift standard'}</p>
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              <span className={`font-black text-xs ${isEntree ? 'text-emerald-700' : 'text-indigo-700'}`}>
                                {isEntree ? '+' : '-'}{mvt.quantite.toLocaleString()} {mvt.unite}
                              </span>
                              {mvt.conditionnement && (
                                <p className="text-[9px] text-slate-400 truncate max-w-[100px] text-right ml-auto">{mvt.conditionnement}</p>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {isEntree ? (
                                <div>
                                  {mvt.prixUsineUnitaireFCFA ? (
                                    <p className="text-[10px] text-slate-500">
                                      Usine : <span className="font-medium">{mvt.prixUsineUnitaireFCFA.toLocaleString()} F</span>
                                    </p>
                                  ) : null}
                                  <p className="font-black text-slate-900 text-xs">
                                    Rendu : {mvt.prixUnitaireFCFA ? `${mvt.prixUnitaireFCFA.toLocaleString()} F` : '—'}
                                  </p>
                                </div>
                              ) : (
                                <span className="text-slate-300">—</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-right">
                              {mvt.montantTotalFCFA ? (
                                <span className="font-black text-amber-700 text-xs">{mvt.montantTotalFCFA.toLocaleString()} FCFA</span>
                              ) : <span className="text-slate-300">—</span>}
                              {mvt.fraisTransportFCFA ? (
                                <p className="text-[9px] text-slate-400">Fret+D : {(mvt.fraisTransportFCFA + (mvt.fraisDedouanementFCFA || 0)).toLocaleString()} F</p>
                              ) : null}
                            </td>
                            <td className="py-2.5 px-3">
                              {mvt.numeroCertificatAnalyse ? (
                                <div className="space-y-0.5">
                                  <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-800 font-mono text-[9px] font-bold border border-emerald-200">
                                    CoA: {mvt.numeroCertificatAnalyse}
                                  </span>
                                  {mvt.lotFabricant && (
                                    <p className="text-[9px] text-slate-400 font-mono">Lot: {mvt.lotFabricant}</p>
                                  )}
                                  {mvt.conformiteQualite && (
                                    <span className={`inline-block px-1 rounded text-[8px] font-bold ${
                                      mvt.conformiteQualite === 'CONFORME' ? 'bg-emerald-100 text-emerald-800' :
                                      mvt.conformiteQualite === 'CONFORME_RESERVE' ? 'bg-amber-100 text-amber-800' :
                                      mvt.conformiteQualite === 'NON_CONFORME' ? 'bg-red-100 text-red-800' :
                                      'bg-blue-100 text-blue-800'
                                    }`}>
                                      {mvt.conformiteQualite === 'CONFORME' ? '✓ Conforme' : mvt.conformiteQualite}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <span className="text-[10px] text-slate-300 italic">Non certifié</span>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              {mvt.referencePaiement ? (
                                <div>
                                  <span className="font-mono text-[9px] font-semibold text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded block truncate max-w-[110px]">
                                    {mvt.referencePaiement}
                                  </span>
                                  <p className="text-[9px] text-slate-500 mt-0.5">{mvt.modePaiement || mvt.comptePaiement || '—'}</p>
                                </div>
                              ) : (
                                <span className="text-slate-300 text-[10px]">{mvt.comptePaiement || '—'}</span>
                              )}
                            </td>
                            <td className="py-2.5 px-2 text-center">
                              <button
                                type="button"
                                onClick={() => setSelectedIntrantMvtDetail(mvt)}
                                title="Voir la Fiche de Réception & Traçabilité Complète"
                                className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 transition-colors inline-flex items-center gap-1 text-[10px] font-bold shadow-sm"
                              >
                                <Eye className="w-3.5 h-3.5 text-slate-600" />
                                <span className="hidden sm:inline">Fiche</span>
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>

                  {/* Pied de tableau : totaux */}
                  {intrantMovements.length > 0 && (() => {
                    const totalAchats  = intrantMovements.filter(m => m.type === 'ENTREE_ACHAT').reduce((s, m) => s + (m.montantTotalFCFA || 0), 0);
                    const totalSorties = intrantMovements.filter(m => m.type === 'SORTIE_PRODUCTION').reduce((s, m) => s + m.quantite, 0);
                    return (
                      <div className="flex items-center justify-between bg-slate-50 px-4 py-3 border-t border-slate-200">
                        <span className="text-xs text-slate-500">{intrantMovements.length} mouvement(s) au total</span>
                        <div className="flex gap-6 text-xs">
                          <span className="font-bold text-emerald-700">∑ Achats : {totalAchats.toLocaleString()} FCFA</span>
                          <span className="font-bold text-indigo-700">∑ Sorties : {totalSorties.toLocaleString()} unités</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}

              {intrantActiveTab === 'FOURNISSEURS' && (
                <div className="space-y-4">
                  {intrantSuppliers.length === 0 ? (
                    <div className="text-center py-10 text-slate-400 text-sm">Aucun fournisseur enregistré.</div>
                  ) : intrantSuppliers.map(fourn => (
                    <div key={fourn.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
                      <div className="flex items-start justify-between gap-3 mb-3">
                        <div>
                          <span className="text-[10px] font-mono text-slate-400">{fourn.code}</span>
                          <h4 className="font-black text-slate-900 text-sm">{fourn.nom}</h4>
                          <p className="text-[11px] text-slate-500">
                            📞 {fourn.telephone} &nbsp;&bull;&nbsp; {fourn.contact} &nbsp;&bull;&nbsp; 🌍 {fourn.pays}
                          </p>
                        </div>
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          fourn.statut === 'ACTIF' ? 'bg-emerald-100 text-emerald-800' :
                          fourn.statut === 'EN_NEGOCIATION' ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>{fourn.statut}</span>
                      </div>

                      {/* Catalogue de prix */}
                      <div className="overflow-x-auto rounded-xl border border-slate-100">
                        <table className="w-full text-xs">
                          <thead className="bg-slate-50 text-slate-500">
                            <tr>
                              <th className="text-left py-2 px-3">Intrant</th>
                              <th className="text-right py-2 px-3">Prix Catalogue</th>
                              <th className="text-right py-2 px-3">Prix Négocié</th>
                              <th className="text-right py-2 px-3">Remise</th>
                              <th className="text-left py-2 px-3">Unité</th>
                              <th className="text-right py-2 px-3">Qte Min.</th>
                              <th className="text-left py-2 px-3">Délai Livraison</th>
                              <th className="text-left py-2 px-3">Conditions Paiement</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-50">
                            {fourn.prixCatalogue.map((p, i) => (
                              <tr key={i} className="hover:bg-emerald-50/30">
                                <td className="py-2 px-3 font-semibold text-slate-800">{p.intrantNom}</td>
                                <td className="py-2 px-3 text-right text-slate-500">{p.prixUnitaireFCFA.toLocaleString()} F</td>
                                <td className="py-2 px-3 text-right">
                                  <span className="font-black text-emerald-700">{(p.prixNegocie || p.prixUnitaireFCFA).toLocaleString()} F</span>
                                  <span className="text-slate-400"> / {p.unite}</span>
                                </td>
                                <td className="py-2 px-3 text-right">
                                  {p.remisePourcent ? (
                                    <span className="font-bold text-amber-700">{p.remisePourcent}%</span>
                                  ) : <span className="text-slate-300">—</span>}
                                </td>
                                <td className="py-2 px-3">{p.unite}</td>
                                <td className="py-2 px-3 text-right">{p.quantiteMinimaleCommande?.toLocaleString() || '—'} {p.unite}</td>
                                <td className="py-2 px-3">
                                  {p.delaiLivraisonJours ? (
                                    <span className={`font-semibold ${ p.delaiLivraisonJours <= 5 ? 'text-emerald-700' : p.delaiLivraisonJours <= 14 ? 'text-amber-700' : 'text-red-700' }`}>
                                      {p.delaiLivraisonJours}j
                                    </span>
                                  ) : '—'}
                                </td>
                                <td className="py-2 px-3 text-slate-500 text-[10px]">{p.conditionsPaiement || '—'}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>

                      {fourn.notesCommerciales && (
                        <p className="mt-2 text-[11px] text-slate-500 italic bg-amber-50 rounded-lg px-3 py-1.5">
                          💬 {fourn.notesCommerciales}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Modal Enregistrement Mouvement Intrant ───────────────────────────── */}
      {showIntrantMvtModal && (
        <div className="fixed inset-0 z-[400] flex items-center justify-center p-3 sm:p-5 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-5 sm:p-7 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto space-y-6">
            
            {/* Entête Modal */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-lg shadow-md ${
                  showIntrantMvtModal === 'ENTREE_ACHAT' ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
                }`}>
                  {showIntrantMvtModal === 'ENTREE_ACHAT' ? <Warehouse className="w-6 h-6" /> : <Boxes className="w-6 h-6" />}
                </div>
                <div>
                  <h3 className="text-base sm:text-lg font-black text-slate-900">
                    {showIntrantMvtModal === 'ENTREE_ACHAT'
                      ? "⬆ Réception Matière Intrant & Fiche Complète d'Arrivage"
                      : "⬇ Sortie Matière Intrant — Alimentation Production"}
                  </h3>
                  <p className="text-xs text-slate-500 mt-0.5">
                    {showIntrantMvtModal === 'ENTREE_ACHAT'
                      ? "Saisie exhaustive : Pays d'origine, Usine, Fournisseur, Prix Usine, Fret & Douane, Certificats et Contrôle Qualité"
                      : "Enregistrement de la consommation d'intrant par ligne de production et shift"}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIntrantMvtModal(null)}
                className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center text-sm font-bold transition-colors"
              >
                ✕
              </button>
            </div>

            {/* ═══ FORMULAIRE RÉCEPTION ENTRÉE ACHAT (COMPLET SELON EXIGENCES CLIENT) ═══ */}
            {showIntrantMvtModal === 'ENTREE_ACHAT' ? (
              <div className="space-y-6">

                {/* BLOC 1 : MATIÈRE & FOURNISSEUR */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                    <Boxes className="w-4 h-4 text-emerald-600" />
                    <span>1. Matière Intrant & Fournisseur Partenaire</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Choix de l'intrant */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Matière Intrant <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={selectedIntrantForMvt?.id || ''}
                        onChange={e => {
                          const mat = rawMaterials.find(m => m.id === e.target.value) || null;
                          setSelectedIntrantForMvt(mat);
                          if (mat) {
                            setIntrantMvtForm(f => ({
                              ...f,
                              prixUsineUnitaireFCFA: f.prixUsineUnitaireFCFA || mat.coutMoyenAchatFCFA || 0,
                              prixUnitaireFCFA: f.prixUnitaireFCFA || mat.coutMoyenAchatFCFA || 0
                            }));
                          }
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        {rawMaterials.filter(m => m.estIntrant).map(m => (
                          <option key={m.id} value={m.id}>
                            {m.nom} ({m.stockActuel} {m.unite} en stock)
                          </option>
                        ))}
                      </select>
                      {selectedIntrantForMvt && (
                        <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1.5 px-1">
                          <span>Catégorie : <strong className="text-slate-700">{selectedIntrantForMvt.categorie}</strong></span>
                          <span>PMP actuel : <strong className="text-emerald-700">{selectedIntrantForMvt.coutMoyenAchatFCFA.toLocaleString()} FCFA/{selectedIntrantForMvt.unite}</strong></span>
                        </div>
                      )}
                    </div>

                    {/* Choix du fournisseur */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Fournisseur Contractuel <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={intrantMvtForm.fournisseurId}
                        onChange={e => {
                          const fourn = intrantSuppliers.find(f => f.id === e.target.value);
                          if (fourn) {
                            const pc = selectedIntrantForMvt ? fourn.prixCatalogue.find(p => p.intrantId === selectedIntrantForMvt.id) : null;
                            const prixCat = pc?.prixNegocie || pc?.prixUnitaireFCFA;
                            setIntrantMvtForm(f => ({
                              ...f,
                              fournisseurId: fourn.id,
                              fournisseurNom: fourn.nom,
                              paysProvenance: fourn.pays || f.paysProvenance,
                              villeUsine: fourn.ville || f.villeUsine,
                              fournisseurContact: fourn.contact || f.fournisseurContact,
                              fournisseurTelephone: fourn.telephone || f.fournisseurTelephone,
                              fournisseurEmail: fourn.email || f.fournisseurEmail,
                              fournisseurAdresse: fourn.adresse || f.fournisseurAdresse,
                              conditionnement: pc?.conditionnement || f.conditionnement,
                              ...(prixCat ? {
                                prixUsineUnitaireFCFA: Math.round(prixCat * 0.85),
                                prixUnitaireFCFA: prixCat
                              } : {})
                            }));
                          } else {
                            setIntrantMvtForm(f => ({ ...f, fournisseurId: '', fournisseurNom: '' }));
                          }
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-900 shadow-sm focus:ring-2 focus:ring-emerald-500"
                      >
                        <option value="">-- Sélectionnez un fournisseur du catalogue --</option>
                        {intrantSuppliers.map(f => (
                          <option key={f.id} value={f.id}>
                            {f.nom} — {f.pays} ({f.statut})
                          </option>
                        ))}
                      </select>
                      {intrantMvtForm.fournisseurNom && (
                        <p className="text-[10px] text-slate-500 mt-1 italic">
                          Sélectionné : {intrantMvtForm.fournisseurNom} ({intrantMvtForm.paysProvenance})
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Saisie libre Fournisseur si non dans la liste */}
                  {!intrantMvtForm.fournisseurId && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{"Nom de l'entreprise Fournisseur"}</label>
                        <input
                          type="text"
                          value={intrantMvtForm.fournisseurNom}
                          onChange={e => setIntrantMvtForm(f => ({ ...f, fournisseurNom: e.target.value }))}
                          placeholder="Ex: Shanghai Chemical Industries / ChimInter"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Contact & Téléphone Fournisseur</label>
                        <input
                          type="text"
                          value={intrantMvtForm.fournisseurContact}
                          onChange={e => setIntrantMvtForm(f => ({ ...f, fournisseurContact: e.target.value }))}
                          placeholder="Ex: M. Dupont (+33 6... / +221 77...)"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                    </div>
                  )}

                  {/* Pays de provenance & Usine de fabrication */}
                  <div className="pt-2 border-t border-slate-200/60">
                    <label className="block text-xs font-bold text-slate-700 mb-1.5 flex items-center gap-1.5">
                      <Globe className="w-3.5 h-3.5 text-blue-600" />
                      <span>Pays de Provenance de la Matière <span className="text-red-500">*</span></span>
                    </label>

                    {/* Boutons de sélection rapide pays */}
                    <div className="flex flex-wrap gap-1.5 mb-2.5">
                      {[
                        { nom: "Sénégal", flag: "🇸🇳" },
                        { nom: "Chine", flag: "🇨🇳" },
                        { nom: "France", flag: "🇫🇷" },
                        { nom: "Côte d'Ivoire", flag: "🇨🇮" },
                        { nom: "Maroc", flag: "🇲🇦" },
                        { nom: "Inde", flag: "🇮🇳" },
                        { nom: "Turquie", flag: "🇹🇷" },
                        { nom: "Belgique", flag: "🇧🇪" },
                        { nom: "Espagne", flag: "🇪🇸" },
                        { nom: "États-Unis", flag: "🇺🇸" }
                      ].map(p => (
                        <button
                          key={p.nom}
                          type="button"
                          onClick={() => setIntrantMvtForm(f => ({ ...f, paysProvenance: p.nom }))}
                          className={`px-2.5 py-1 rounded-lg text-xs font-semibold flex items-center gap-1 border transition-all ${
                            intrantMvtForm.paysProvenance === p.nom
                              ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          <span>{p.flag}</span>
                          <span>{p.nom}</span>
                        </button>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Pays Saisi</label>
                        <input
                          type="text"
                          value={intrantMvtForm.paysProvenance}
                          onChange={e => setIntrantMvtForm(f => ({ ...f, paysProvenance: e.target.value }))}
                          placeholder="Ex: Sénégal, Chine, France..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 font-semibold"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">{"Ville / Site de l'Usine Productrice"}</label>
                        <input
                          type="text"
                          value={intrantMvtForm.villeUsine}
                          onChange={e => setIntrantMvtForm(f => ({ ...f, villeUsine: e.target.value }))}
                          placeholder="Ex: Shanghai, Lyon, Casablanca, Dakar..."
                          className="w-full text-xs p-2 rounded-lg border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Transporteur / N° Camion / BL</label>
                        <input
                          type="text"
                          value={intrantMvtForm.vehiculeImmatriculation}
                          onChange={e => setIntrantMvtForm(f => ({ ...f, vehiculeImmatriculation: e.target.value }))}
                          placeholder="Ex: DK-4921-AZ / BL-MSC-9921"
                          className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* BLOC 2 : PRIX USINE, FRAIS D'APPROCHE & COÛT TOTAL RENDU DAKAR */}
                <div className="bg-emerald-50/40 rounded-2xl p-4 sm:p-5 border border-emerald-200/80 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 text-emerald-950 font-black text-xs uppercase tracking-wider">
                      <DollarSign className="w-4 h-4 text-emerald-700" />
                      <span>{"2. Décomposition Financière : Prix Usine (EXW) & Coût Rendu Dakar"}</span>
                    </div>
                    <span className="text-[11px] font-mono text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full font-bold">
                      Devise référence : FCFA (XOF)
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        Quantité Reçue ({selectedIntrantForMvt?.unite || 'unité'}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0.1"
                        step="0.1"
                        value={intrantMvtForm.quantite || ''}
                        onChange={e => {
                          const qte = Number(e.target.value);
                          setIntrantMvtForm(f => {
                            const coutUsine = qte * f.prixUsineUnitaireFCFA;
                            const totalApproche = f.fraisTransportFCFA + f.fraisDedouanementFCFA + f.fraisDiversFCFA;
                            const totalRendu = coutUsine + totalApproche;
                            const puRendu = qte > 0 ? Math.round(totalRendu / qte) : f.prixUsineUnitaireFCFA;
                            return { ...f, quantite: qte, prixUnitaireFCFA: puRendu };
                          });
                        }}
                        className="w-full text-sm p-2.5 rounded-xl border border-slate-300 bg-white font-black text-slate-900 shadow-sm"
                        placeholder="Ex: 500"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">
                        🏭 Prix Départ Usine (FCFA/{selectedIntrantForMvt?.unite || 'u'}) <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={intrantMvtForm.prixUsineUnitaireFCFA || ''}
                        onChange={e => {
                          const puUsine = Number(e.target.value);
                          setIntrantMvtForm(f => {
                            const coutUsine = f.quantite * puUsine;
                            const totalApproche = f.fraisTransportFCFA + f.fraisDedouanementFCFA + f.fraisDiversFCFA;
                            const totalRendu = coutUsine + totalApproche;
                            const puRendu = f.quantite > 0 ? Math.round(totalRendu / f.quantite) : puUsine;
                            return { ...f, prixUsineUnitaireFCFA: puUsine, prixUnitaireFCFA: puRendu };
                          });
                        }}
                        className="w-full text-sm p-2.5 rounded-xl border border-blue-300 bg-blue-50/50 font-black text-blue-800 shadow-sm"
                        placeholder="Ex: 1450"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        🚢 Frais Transport / Fret (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={intrantMvtForm.fraisTransportFCFA || ''}
                        onChange={e => {
                          const fret = Number(e.target.value);
                          setIntrantMvtForm(f => {
                            const coutUsine = f.quantite * f.prixUsineUnitaireFCFA;
                            const totalApproche = fret + f.fraisDedouanementFCFA + f.fraisDiversFCFA;
                            const totalRendu = coutUsine + totalApproche;
                            const puRendu = f.quantite > 0 ? Math.round(totalRendu / f.quantite) : f.prixUsineUnitaireFCFA;
                            return { ...f, fraisTransportFCFA: fret, prixUnitaireFCFA: puRendu };
                          });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 shadow-sm"
                        placeholder="Ex: 65000"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        🏛️ Douane & Transitaire (FCFA)
                      </label>
                      <input
                        type="number"
                        min="0"
                        value={intrantMvtForm.fraisDedouanementFCFA || ''}
                        onChange={e => {
                          const douane = Number(e.target.value);
                          setIntrantMvtForm(f => {
                            const coutUsine = f.quantite * f.prixUsineUnitaireFCFA;
                            const totalApproche = f.fraisTransportFCFA + douane + f.fraisDiversFCFA;
                            const totalRendu = coutUsine + totalApproche;
                            const puRendu = f.quantite > 0 ? Math.round(totalRendu / f.quantite) : f.prixUsineUnitaireFCFA;
                            return { ...f, fraisDedouanementFCFA: douane, prixUnitaireFCFA: puRendu };
                          });
                        }}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold text-slate-800 shadow-sm"
                        placeholder="Ex: 38200"
                      />
                    </div>
                  </div>

                  {/* Synthèse Coût Usine vs Rendu */}
                  {(() => {
                    const qte = intrantMvtForm.quantite || 0;
                    const puUsine = intrantMvtForm.prixUsineUnitaireFCFA || 0;
                    const sousTotalUsine = qte * puUsine;
                    const fraisApproche = (intrantMvtForm.fraisTransportFCFA || 0) + (intrantMvtForm.fraisDedouanementFCFA || 0) + (intrantMvtForm.fraisDiversFCFA || 0);
                    const totalRendu = sousTotalUsine + fraisApproche;
                    const puRenduFinal = qte > 0 ? Math.round(totalRendu / qte) : puUsine;

                    return (
                      <div className="bg-white rounded-2xl p-4 border border-emerald-200 shadow-sm grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div className="space-y-0.5">
                          <p className="text-[11px] text-slate-500 font-medium">Sous-total Usine ({qte} × {puUsine.toLocaleString()} F) :</p>
                          <p className="text-sm font-black text-blue-700">{sousTotalUsine.toLocaleString()} FCFA</p>
                          <p className="text-[10px] text-slate-400">{"Total Frais d'approche : "}+{fraisApproche.toLocaleString()} FCFA</p>
                        </div>

                        <div className="space-y-0.5 border-t sm:border-t-0 sm:border-l border-slate-100 sm:pl-4">
                          <p className="text-[11px] text-slate-500 font-medium">Prix Unitaire Rendu Usine Dakar :</p>
                          <p className="text-base font-black text-emerald-700">
                            {puRenduFinal.toLocaleString()} FCFA / {selectedIntrantForMvt?.unite || 'unité'}
                          </p>
                          {puUsine > 0 && puRenduFinal > puUsine && (
                            <p className="text-[10px] text-amber-700 font-bold">
                              Approche : +{Math.round(((puRenduFinal - puUsine) / puUsine) * 100)}% sur prix usine
                            </p>
                          )}
                        </div>

                        <div className="space-y-0.5 bg-emerald-700 text-white rounded-xl p-3 flex flex-col justify-center">
                          <span className="text-[10px] uppercase font-bold text-emerald-200">Coût Total Rendu à Décaisser</span>
                          <span className="text-lg font-black text-white">{totalRendu.toLocaleString()} FCFA</span>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                {/* BLOC 3 : CONDITIONNEMENT & PESÉE À RÉCEPTION */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                    <Scale className="w-4 h-4 text-amber-600" />
                    <span>3. Conditionnement Physique & Contrôle de Pesée Usine</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Conditionnement</label>
                      <select
                        value={intrantMvtForm.conditionnement}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, conditionnement: e.target.value }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-semibold"
                      >
                        <option>Bidons 25 L</option>
                        <option>Sacs 25 kg</option>
                        <option>Sacs 50 kg</option>
                        <option>Big-bag 500 kg</option>
                        <option>Big-bag 1000 kg</option>
                        <option>Fûts 200 L</option>
                        <option>Cuves IBC 1000 L</option>
                        <option>Vrac Citerne</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Nombre de Colis Reçus</label>
                      <input
                        type="number"
                        min="1"
                        value={intrantMvtForm.nombreColis || ''}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, nombreColis: Number(e.target.value) }))}
                        placeholder="Ex: 12 bidons / 20 sacs"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Poids Déclaré Fournisseur (kg)</label>
                      <input
                        type="number"
                        min="0"
                        value={intrantMvtForm.poidsDeclareFournisseurKg || ''}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, poidsDeclareFournisseurKg: Number(e.target.value) }))}
                        placeholder="Ex: 500"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Poids Net Pesé à Réception (kg)</label>
                      <input
                        type="number"
                        min="0"
                        value={intrantMvtForm.poidsNetKg || ''}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, poidsNetKg: Number(e.target.value) }))}
                        placeholder="Ex: 500"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-bold text-slate-900"
                      />
                    </div>
                  </div>

                  {/* Contrôle écart de pesée */}
                  {intrantMvtForm.poidsNetKg > 0 && intrantMvtForm.poidsDeclareFournisseurKg > 0 && (() => {
                    const ecart = intrantMvtForm.poidsNetKg - intrantMvtForm.poidsDeclareFournisseurKg;
                    const pct = ((ecart / intrantMvtForm.poidsDeclareFournisseurKg) * 100).toFixed(1);
                    return (
                      <div className={`p-2.5 rounded-xl text-xs font-bold flex items-center justify-between ${
                        Math.abs(ecart) <= 2 ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                        ecart > 0 ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                        'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}>
                        <span>⚖️ Écart Pesée Usine vs Facture Fournisseur :</span>
                        <span>{ecart > 0 ? `+${ecart}` : ecart} kg ({pct}%) — {Math.abs(ecart) <= 2 ? 'Pesée conforme' : 'Écart à vérifier'}</span>
                      </div>
                    );
                  })()}
                </div>

                {/* BLOC 4 : CERTIFICATS & DOCUMENTS QUALITÉ */}
                <div className="bg-blue-50/40 rounded-2xl p-4 sm:p-5 border border-blue-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-blue-950 font-black text-xs uppercase tracking-wider">
                    <FileCheck2 className="w-4 h-4 text-blue-700" />
                    <span>4. Certificats & Traçabilité Documentaire Obligatoire</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <span>{"📜 N° Certificat d'Analyse (CoA)"}</span>
                        <span className="text-red-500">*</span>
                      </label>
                      <input
                        type="text"
                        value={intrantMvtForm.numeroCertificatAnalyse}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, numeroCertificatAnalyse: e.target.value }))}
                        placeholder="Ex: COA-2026-CSPI-992"
                        className="w-full text-xs p-2.5 rounded-xl border border-blue-300 bg-white font-mono font-bold text-blue-900 shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        {"🌍 N° Certificat d'Origine (CO)"}
                      </label>
                      <input
                        type="text"
                        value={intrantMvtForm.numeroCertificatOrigine}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, numeroCertificatOrigine: e.target.value }))}
                        placeholder="Ex: CO-FR-78219 / CO-CN-SH492"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono shadow-sm"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">
                        🛡️ N° Fiche de Sécurité (MSDS / FDS)
                      </label>
                      <input
                        type="text"
                        value={intrantMvtForm.numeroFicheMSDS}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, numeroFicheMSDS: e.target.value }))}
                        placeholder="Ex: MSDS-AKD-REV4"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-mono shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">N° Lot Fabricant (Batch No)</label>
                      <input
                        type="text"
                        value={intrantMvtForm.lotFabricant}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, lotFabricant: e.target.value }))}
                        placeholder="Ex: LOT-FR-2026-44"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Certificat Phyto / ISO</label>
                      <input
                        type="text"
                        value={intrantMvtForm.certificationISO}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, certificationISO: e.target.value }))}
                        placeholder="Ex: ISO 9001:2015 / Phyto OK"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Date Production Usine</label>
                      <input
                        type="date"
                        value={intrantMvtForm.dateProductionFabricant}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, dateProductionFabricant: e.target.value }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Date Péremption / DLU</label>
                      <input
                        type="date"
                        value={intrantMvtForm.datePeremption}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, datePeremption: e.target.value }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300"
                      />
                    </div>
                  </div>
                </div>

                {/* BLOC 5 : CONTRÔLE QUALITÉ À RÉCEPTION */}
                <div className="bg-slate-50/80 rounded-2xl p-4 sm:p-5 border border-slate-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-slate-800 font-black text-xs uppercase tracking-wider">
                    <ClipboardCheck className="w-4 h-4 text-emerald-600" />
                    <span>5. Contrôle Qualité à Réception Usine</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Décision Qualité Réception</label>
                      <select
                        value={intrantMvtForm.conformiteQualite}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, conformiteQualite: e.target.value as any }))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black bg-white"
                      >
                        <option value="CONFORME">✓ CONFORME (Accepté en stock)</option>
                        <option value="CONFORME_RESERVE">⚠️ CONFORME AVEC RÉSERVE</option>
                        <option value="EN_ATTENTE_LABO">⏳ EN ATTENTE ANALYSE LABO</option>
                        <option value="NON_CONFORME">❌ NON CONFORME (Refusé / Quarantaine)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">État Emballages</label>
                      <select
                        value={intrantMvtForm.emballageCRT}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, emballageCRT: e.target.value as any }))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                      >
                        <option value="INTACT">Intacts & Hermétiques</option>
                        <option value="ENDOMMAGE">Légèrement Endommagés</option>
                        <option value="FUITES">Fuites / Déchirures Constatées</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-slate-700 mb-1">Réceptionnaire Magasin</label>
                      <input
                        type="text"
                        value={intrantMvtForm.receptionnaireMagasin}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, receptionnaireMagasin: e.target.value }))}
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Remarques Contrôle Qualité & Observations Réception</label>
                    <textarea
                      value={intrantMvtForm.remarquesControleQualite}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, remarquesControleQualite: e.target.value, observations: e.target.value }))}
                      placeholder="Conformité visuelle, pH, couleur, certificat de conformité validé, conditions de stockage..."
                      rows={2}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                    />
                  </div>
                </div>

                {/* BLOC 6 : FACTURATION & RÉFÉRENTIEL DE PAIEMENT */}
                <div className="bg-cyan-50/40 rounded-2xl p-4 sm:p-5 border border-cyan-200/80 space-y-4">
                  <div className="flex items-center gap-2 text-cyan-950 font-black text-xs uppercase tracking-wider">
                    <FileText className="w-4 h-4 text-cyan-700" />
                    <span>6. Facturation & Référentiel de Paiement</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">N° Facture Fournisseur</label>
                      <input
                        type="text"
                        value={intrantMvtForm.referenceFactureFournisseur}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, referenceFactureFournisseur: e.target.value }))}
                        placeholder="Ex: CSPI-F-2026-0089"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">N° Bon Commande Interne</label>
                      <input
                        type="text"
                        value={intrantMvtForm.referenceBonCommande}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, referenceBonCommande: e.target.value }))}
                        placeholder="Ex: BC-INT-2026-0142"
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Mode de Paiement</label>
                      <select
                        value={intrantMvtForm.modePaiement}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, modePaiement: e.target.value as any }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-semibold"
                      >
                        <option>Wave</option>
                        <option>Orange Money</option>
                        <option>Virement Bancaire</option>
                        <option>Chèque</option>
                        <option>Espèces</option>
                        <option>Crédit</option>
                        <option>LC (Lettre de Crédit)</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Compte Débité</label>
                      <select
                        value={intrantMvtForm.comptePaiement}
                        onChange={e => setIntrantMvtForm(f => ({ ...f, comptePaiement: e.target.value as any }))}
                        className="w-full text-xs p-2 rounded-lg border border-slate-300 font-semibold"
                      >
                        <option>Wave Business</option>
                        <option>Orange Money Pro</option>
                        <option>Banque Principale</option>
                        <option>Caisse Usine</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-600 mb-0.5">Référence Transactionnelle (N° TX Wave, N° Chèque, Réf Virement...)</label>
                    <input
                      type="text"
                      value={intrantMvtForm.referencePaiement}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, referencePaiement: e.target.value }))}
                      placeholder="Ex: VIR-BNK-2026-0892 / WAVE-TX-9823741 / CHQ-00892"
                      className="w-full text-xs p-2 rounded-lg border border-slate-300 font-mono font-bold text-cyan-800"
                    />
                  </div>
                </div>

              </div>
            ) : (
              /* ═══ FORMULAIRE SORTIE PRODUCTION ═══ */
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Matière Intrant à Sortir</label>
                  <select
                    value={selectedIntrantForMvt?.id || ''}
                    onChange={e => setSelectedIntrantForMvt(rawMaterials.find(m => m.id === e.target.value) || null)}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-semibold"
                  >
                    {rawMaterials.filter(m => m.estIntrant).map(m => (
                      <option key={m.id} value={m.id}>
                        {m.nom} — Stock disponible : {m.stockActuel} {m.unite}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Quantité à Déstocker ({selectedIntrantForMvt?.unite || 'unité'})</label>
                    <input
                      type="number"
                      min="0.1"
                      step="0.1"
                      value={intrantMvtForm.quantite || ''}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, quantite: Number(e.target.value) }))}
                      className="w-full text-sm p-2.5 rounded-xl border border-indigo-300 font-black text-indigo-900"
                      placeholder="Ex: 45"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Ligne de Production Destinataire</label>
                    <select
                      value={intrantMvtForm.ligneProduction}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, ligneProduction: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                    >
                      <option>Ligne 1 - Mouleuse Rotative 4 Faces</option>
                      <option>Ligne 2 - Mouleuse Rotative Compacte</option>
                      <option>Cuve Pulpeur Préparation Pâte</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">Shift de Consommation</label>
                    <select
                      value={intrantMvtForm.shiftConsommation}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, shiftConsommation: e.target.value }))}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                    >
                      <option value="MATIN_06H_14H">Quart Matin (06h - 14h)</option>
                      <option value="SOIR_14H_22H">Quart Soir (14h - 22h)</option>
                      <option value="NUIT_22H_06H">Quart Nuit (22h - 06h)</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-700 mb-1">N° Demande Sortie Matière (DSM)</label>
                    <input
                      type="text"
                      value={intrantMvtForm.referenceBonCommande}
                      onChange={e => setIntrantMvtForm(f => ({ ...f, referenceBonCommande: e.target.value }))}
                      placeholder="Ex: DSM-20261028-01"
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Observations / Dosage spécifique</label>
                  <textarea
                    value={intrantMvtForm.observations}
                    onChange={e => setIntrantMvtForm(f => ({ ...f, observations: e.target.value }))}
                    placeholder="Dosage AKD 1.5% sur lot 30 000 alvéoles, préparation cuve pulpeur..."
                    rows={2}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                  />
                </div>
              </div>
            )}

            {/* Actions Footer */}
            <div className="flex flex-col sm:flex-row gap-3 pt-4 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setShowIntrantMvtModal(null)}
                className="px-5 py-3 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors order-2 sm:order-1"
              >
                Annuler
              </button>

              <button
                type="button"
                onClick={async () => {
                  if (!selectedIntrantForMvt) {
                    alert('Veuillez sélectionner une matière intrant.');
                    return;
                  }
                  if (!intrantMvtForm.quantite || intrantMvtForm.quantite <= 0) {
                    alert('Veuillez saisir une quantité valide (> 0).');
                    return;
                  }

                  const isEntree = showIntrantMvtModal === 'ENTREE_ACHAT';
                  if (isEntree && !intrantMvtForm.prixUsineUnitaireFCFA && !intrantMvtForm.prixUnitaireFCFA) {
                    alert('Veuillez renseigner le prix usine ou le prix unitaire de la matière.');
                    return;
                  }

                  const today = new Date().toISOString().split('T')[0];
                  const heure = new Date().toTimeString().slice(0, 5);
                  const count = await db.intrantMovements.count();

                  const stockApres = isEntree
                    ? selectedIntrantForMvt.stockActuel + intrantMvtForm.quantite
                    : Math.max(0, selectedIntrantForMvt.stockActuel - intrantMvtForm.quantite);

                  const puUsine = intrantMvtForm.prixUsineUnitaireFCFA || 0;
                  const fret = intrantMvtForm.fraisTransportFCFA || 0;
                  const douane = intrantMvtForm.fraisDedouanementFCFA || 0;
                  const divers = intrantMvtForm.fraisDiversFCFA || 0;
                  const totalRendu = isEntree
                    ? (intrantMvtForm.quantite * puUsine) + fret + douane + divers
                    : undefined;
                  const puRenduFinal = isEntree && totalRendu && intrantMvtForm.quantite > 0
                    ? Math.round(totalRendu / intrantMvtForm.quantite)
                    : intrantMvtForm.prixUnitaireFCFA;

                  const numMvt = `${isEntree ? 'ENT' : 'SOR'}-INT-${today.replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;
                  const numBon = `${isEntree ? 'BR' : 'BS'}-INT-${today.replace(/-/g, '')}-${String(count + 1).padStart(3, '0')}`;

                  const newMovement: IntrantStockMovement = {
                    id: `imvt-${Date.now()}`,
                    numeroMouvement: numMvt,
                    numeroBonGenere: numBon,
                    date: today,
                    heure,
                    type: showIntrantMvtModal,
                    intrantId: selectedIntrantForMvt.id,
                    intrantNom: selectedIntrantForMvt.nom,
                    intrantCategorie: selectedIntrantForMvt.categorie as RawMaterialCategory,
                    unite: selectedIntrantForMvt.unite,
                    quantite: intrantMvtForm.quantite,
                    stockAvant: selectedIntrantForMvt.stockActuel,
                    stockApres,
                    // Origine & Fournisseur
                    paysProvenance: isEntree ? (intrantMvtForm.paysProvenance.trim() || 'Sénégal') : undefined,
                    villeUsine: isEntree ? (intrantMvtForm.villeUsine.trim() || undefined) : undefined,
                    fournisseurId: isEntree ? (intrantMvtForm.fournisseurId || undefined) : undefined,
                    fournisseurNom: isEntree ? (intrantMvtForm.fournisseurNom.trim() || 'Fournisseur usine') : undefined,
                    fournisseurContact: isEntree ? intrantMvtForm.fournisseurContact.trim() || undefined : undefined,
                    vehiculeImmatriculation: isEntree ? intrantMvtForm.vehiculeImmatriculation.trim() || undefined : undefined,
                    // Coûts & Devises
                    prixUsineUnitaireFCFA: isEntree ? puUsine : undefined,
                    fraisTransportFCFA: isEntree ? fret : undefined,
                    fraisDedouanementFCFA: isEntree ? douane : undefined,
                    fraisDiversFCFA: isEntree ? divers : undefined,
                    coutTotalRenduFCFA: totalRendu,
                    prixUnitaireFCFA: puRenduFinal,
                    montantTotalFCFA: totalRendu || (intrantMvtForm.quantite * puUsine),
                    // Conditionnement & Pesée
                    conditionnement: isEntree ? intrantMvtForm.conditionnement : undefined,
                    nombreColis: isEntree ? (intrantMvtForm.nombreColis || undefined) : undefined,
                    poidsDeclareFournisseurKg: isEntree ? (intrantMvtForm.poidsDeclareFournisseurKg || undefined) : undefined,
                    poidsNetKg: isEntree ? (intrantMvtForm.poidsNetKg || undefined) : undefined,
                    ecartPeseeKg: isEntree && intrantMvtForm.poidsNetKg && intrantMvtForm.poidsDeclareFournisseurKg
                      ? (intrantMvtForm.poidsNetKg - intrantMvtForm.poidsDeclareFournisseurKg)
                      : undefined,
                    // Certificats
                    numeroCertificatAnalyse: isEntree ? (intrantMvtForm.numeroCertificatAnalyse.trim() || undefined) : undefined,
                    numeroCertificatOrigine: isEntree ? (intrantMvtForm.numeroCertificatOrigine.trim() || undefined) : undefined,
                    numeroFicheMSDS: isEntree ? (intrantMvtForm.numeroFicheMSDS.trim() || undefined) : undefined,
                    certificationISO: isEntree ? (intrantMvtForm.certificationISO.trim() || undefined) : undefined,
                    lotFabricant: isEntree ? (intrantMvtForm.lotFabricant.trim() || undefined) : undefined,
                    dateProductionFabricant: isEntree ? (intrantMvtForm.dateProductionFabricant || undefined) : undefined,
                    datePeremption: isEntree ? (intrantMvtForm.datePeremption || undefined) : undefined,
                    // Contrôle Qualité
                    conformiteQualite: isEntree ? intrantMvtForm.conformiteQualite : undefined,
                    apparenceVisuelleCRT: isEntree ? intrantMvtForm.apparenceVisuelleCRT : undefined,
                    emballageCRT: isEntree ? intrantMvtForm.emballageCRT : undefined,
                    receptionnaireMagasin: isEntree ? (intrantMvtForm.receptionnaireMagasin.trim() || 'Magasinier Usine') : undefined,
                    remarquesControleQualite: intrantMvtForm.remarquesControleQualite.trim() || undefined,
                    // Paiement & Pièces
                    referenceBonCommande: intrantMvtForm.referenceBonCommande.trim() || undefined,
                    referenceFactureFournisseur: isEntree ? (intrantMvtForm.referenceFactureFournisseur.trim() || undefined) : undefined,
                    referencePaiement: isEntree ? (intrantMvtForm.referencePaiement.trim() || undefined) : undefined,
                    modePaiement: isEntree ? intrantMvtForm.modePaiement : undefined,
                    comptePaiement: isEntree ? intrantMvtForm.comptePaiement : undefined,
                    // Production
                    ligneProduction: !isEntree ? intrantMvtForm.ligneProduction : undefined,
                    shiftConsommation: !isEntree ? intrantMvtForm.shiftConsommation : undefined,
                    enregistrePar: 'Utilisateur',
                    observations: (intrantMvtForm.observations || intrantMvtForm.remarquesControleQualite).trim() || undefined,
                    valide: true
                  };

                  await db.intrantMovements.add(newMovement);

                  // Mise à jour stock intrant et recalcul PMP
                  await db.rawMaterials.update(selectedIntrantForMvt.id, {
                    stockActuel: stockApres,
                    derniereReception: isEntree ? today : selectedIntrantForMvt.derniereReception,
                    coutMoyenAchatFCFA: isEntree && puRenduFinal && puRenduFinal > 0
                      ? Math.round((
                          selectedIntrantForMvt.stockActuel * selectedIntrantForMvt.coutMoyenAchatFCFA
                          + intrantMvtForm.quantite * puRenduFinal
                        ) / (selectedIntrantForMvt.stockActuel + intrantMvtForm.quantite))
                      : selectedIntrantForMvt.coutMoyenAchatFCFA
                  });

                  // Écriture dépense de trésorerie si entrée achat
                  if (isEntree && totalRendu && totalRendu > 0) {
                    await db.expenses.add({
                      id: `dep-int-${Date.now()}`,
                      date: today,
                      libelle: `Achat intrant ${selectedIntrantForMvt.nom.split(' — ')[0]} (${intrantMvtForm.quantite} ${selectedIntrantForMvt.unite}) — ${newMovement.fournisseurNom} (${newMovement.paysProvenance})`,
                      categorie: 'MATIERES_PREMIERES' as any,
                      montant: totalRendu,
                      comptePaiement: intrantMvtForm.comptePaiement,
                      justificatifRef: intrantMvtForm.referencePaiement || intrantMvtForm.referenceFactureFournisseur || numBon,
                      valide: true
                    } as any);
                  }

                  // Fermer formulaire et afficher le Bon Officiel
                  setIntrantMvtForm(defaultIntrantMvtState);
                  setShowIntrantMvtModal(null);
                  setSelectedIntrantMvtDetail(newMovement);
                }}
                className={`px-6 py-3 text-xs font-black text-white rounded-xl shadow-lg active:scale-95 flex-1 transition-all order-1 sm:order-2 flex items-center justify-center gap-2 ${
                  showIntrantMvtModal === 'ENTREE_ACHAT'
                    ? 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-500 shadow-indigo-600/20'
                }`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>
                  {showIntrantMvtModal === 'ENTREE_ACHAT'
                    ? '✓ Valider la Réception & Émettre le Bon Officiel'
                    : '✓ Valider la Sortie Production'}
                </span>
              </button>
            </div>

          </div>
        </div>
      )}

      {/* ── Modal Visualisation & Impression Bon de Réception Intrant Officiel ─── */}
      {selectedIntrantMvtDetail && (
        <div className="fixed inset-0 z-[500] flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[92vh] overflow-y-auto my-auto space-y-6 print:m-0 print:p-4 print:shadow-none print:border-none">
            
            {/* Header Document */}
            <div className="flex items-start justify-between border-b-2 border-slate-900 pb-5">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-black uppercase tracking-widest bg-emerald-600 text-white px-2.5 py-0.5 rounded">BS ALVÉOLES SUARL</span>
                  <span className="text-xs text-slate-400 font-mono">Dakar — Sénégal</span>
                </div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 tracking-tight">
                  {selectedIntrantMvtDetail.type === 'ENTREE_ACHAT'
                    ? 'BON DE RÉCEPTION OFFICIEL & TRAÇABILITÉ INTRANT'
                    : 'BON DE SORTIE INTRANT — PRODUCTION'}
                </h2>
                <p className="text-xs text-slate-500 font-mono mt-0.5">
                  Réf. Mouvement : {selectedIntrantMvtDetail.numeroMouvement} &nbsp;|&nbsp; 
                  N° Bon : <strong>{selectedIntrantMvtDetail.numeroBonGenere || 'BR-INT-OFFICIEL'}</strong>
                </p>
              </div>

              <div className="flex items-center gap-2 print:hidden">
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs flex items-center gap-1.5 shadow-md active:scale-95 transition-all"
                >
                  <Printer className="w-3.5 h-3.5" />
                  <span>Imprimer</span>
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedIntrantMvtDetail(null)}
                  className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold text-sm"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Bloc Dates & Magasinier */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 rounded-2xl p-3.5 border border-slate-200 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Date Réception</span>
                <span className="font-bold text-slate-900">{selectedIntrantMvtDetail.date}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Heure Enregistrée</span>
                <span className="font-bold text-slate-900">{selectedIntrantMvtDetail.heure}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Statut Réception</span>
                <span className="font-black text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  {selectedIntrantMvtDetail.conformiteQualite || 'CONFORME'}
                </span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 block font-medium">Réceptionnaire Usine</span>
                <span className="font-bold text-slate-900 truncate block">{selectedIntrantMvtDetail.receptionnaireMagasin || selectedIntrantMvtDetail.enregistrePar}</span>
              </div>
            </div>

            {/* Grille : Matière & Origine Fournisseur */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Matière Intrant Réceptionnée</div>
                <h4 className="text-sm font-black text-slate-900">{selectedIntrantMvtDetail.intrantNom}</h4>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>Catégorie : <strong>{selectedIntrantMvtDetail.intrantCategorie}</strong></p>
                  <p>Quantité : <strong className="text-emerald-700 font-black text-sm">{selectedIntrantMvtDetail.quantite.toLocaleString()} {selectedIntrantMvtDetail.unite}</strong></p>
                  <p>Conditionnement : <strong>{selectedIntrantMvtDetail.conditionnement || 'Standard'}</strong> ({selectedIntrantMvtDetail.nombreColis || '—'} colis)</p>
                  {selectedIntrantMvtDetail.poidsNetKg && (
                    <p>Pesée Usine : <strong>{selectedIntrantMvtDetail.poidsNetKg} kg</strong> (Déclaré: {selectedIntrantMvtDetail.poidsDeclareFournisseurKg || '—'} kg)</p>
                  )}
                </div>
              </div>

              <div className="border border-slate-200 rounded-2xl p-4 space-y-2 bg-white">
                <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Origine & Fournisseur</div>
                <h4 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
                  <span>🌍</span>
                  <span>{selectedIntrantMvtDetail.paysProvenance || 'Non renseigné'}</span>
                  {selectedIntrantMvtDetail.villeUsine && <span className="text-slate-400 font-normal">({selectedIntrantMvtDetail.villeUsine})</span>}
                </h4>
                <div className="text-xs space-y-1 text-slate-600">
                  <p>Entreprise : <strong>{selectedIntrantMvtDetail.fournisseurNom || 'Fournisseur direct usine'}</strong></p>
                  {selectedIntrantMvtDetail.fournisseurContact && <p>Contact : {selectedIntrantMvtDetail.fournisseurContact}</p>}
                  {selectedIntrantMvtDetail.vehiculeImmatriculation && <p>Véhicule / BL : <strong className="font-mono">{selectedIntrantMvtDetail.vehiculeImmatriculation}</strong></p>}
                </div>
              </div>
            </div>

            {/* Structure Financière : Prix Usine vs Frais d'approche vs Coût Rendu */}
            {selectedIntrantMvtDetail.type === 'ENTREE_ACHAT' && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="text-[10px] font-black uppercase text-slate-500 tracking-wider flex items-center justify-between">
                  <span>Structure Tarifaire & Coût de Revient Rendu Dakar</span>
                  <span className="font-mono text-emerald-700 font-bold">Valeur déclarée conforme</span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Prix Départ Usine</span>
                    <span className="font-black text-slate-900">
                      {selectedIntrantMvtDetail.prixUsineUnitaireFCFA ? `${selectedIntrantMvtDetail.prixUsineUnitaireFCFA.toLocaleString()} F` : '—'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Frais Transport / Fret</span>
                    <span className="font-bold text-slate-800">
                      {selectedIntrantMvtDetail.fraisTransportFCFA ? `${selectedIntrantMvtDetail.fraisTransportFCFA.toLocaleString()} F` : '0 F'}
                    </span>
                  </div>
                  <div className="bg-white p-2.5 rounded-xl border border-slate-200">
                    <span className="text-[10px] text-slate-400 block">Droits Douane & Taxes</span>
                    <span className="font-bold text-slate-800">
                      {selectedIntrantMvtDetail.fraisDedouanementFCFA ? `${selectedIntrantMvtDetail.fraisDedouanementFCFA.toLocaleString()} F` : '0 F'}
                    </span>
                  </div>
                  <div className="bg-emerald-600 text-white p-2.5 rounded-xl shadow-sm">
                    <span className="text-[10px] text-emerald-200 block font-bold">Prix Unitaire Rendu</span>
                    <span className="font-black text-sm">
                      {selectedIntrantMvtDetail.prixUnitaireFCFA ? `${selectedIntrantMvtDetail.prixUnitaireFCFA.toLocaleString()} FCFA` : '—'}
                    </span>
                  </div>
                </div>

                <div className="flex justify-between items-center text-xs font-bold pt-1 border-t border-slate-200">
                  <span className="text-slate-600">Montant Total Facturé / Décaissé :</span>
                  <span className="text-base font-black text-emerald-800">
                    {(selectedIntrantMvtDetail.montantTotalFCFA || (selectedIntrantMvtDetail.quantite * (selectedIntrantMvtDetail.prixUnitaireFCFA || 0))).toLocaleString()} FCFA
                  </span>
                </div>
              </div>
            )}

            {/* Certificats & Qualité */}
            <div className="border border-slate-200 rounded-2xl p-4 bg-white space-y-3">
              <div className="text-[10px] font-black uppercase text-slate-400 tracking-wider">
                Certificats Techniques, N° Lot & Traçabilité Qualité
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-400 block">{"Certificat d'Analyse (CoA)"}</span>
                  <span className="font-mono font-bold text-emerald-800 bg-emerald-50 px-1.5 py-0.5 rounded border border-emerald-200 inline-block">
                    {selectedIntrantMvtDetail.numeroCertificatAnalyse || 'Non renseigné'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Certificat Origine</span>
                  <span className="font-mono font-semibold text-slate-800">
                    {selectedIntrantMvtDetail.numeroCertificatOrigine || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">N° Lot Fabricant</span>
                  <span className="font-mono font-black text-slate-900">
                    {selectedIntrantMvtDetail.lotFabricant || '—'}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Date Péremption</span>
                  <span className="font-semibold text-slate-800">
                    {selectedIntrantMvtDetail.datePeremption || 'Non applicable'}
                  </span>
                </div>
              </div>

              {selectedIntrantMvtDetail.observations && (
                <div className="text-xs bg-slate-50 p-2.5 rounded-xl border border-slate-100 italic text-slate-600">
                  💬 Observations : {selectedIntrantMvtDetail.observations}
                </div>
              )}
            </div>

            {/* Référentiel de paiement */}
            {selectedIntrantMvtDetail.type === 'ENTREE_ACHAT' && (
              <div className="border border-slate-200 rounded-2xl p-4 bg-slate-50/50 flex flex-wrap justify-between items-center text-xs gap-3">
                <div>
                  <span className="text-[10px] text-slate-400 block">Facture Fournisseur :</span>
                  <span className="font-mono font-bold text-slate-800">{selectedIntrantMvtDetail.referenceFactureFournisseur || 'Facture jointe'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Mode de Paiement :</span>
                  <span className="font-bold text-slate-800">{selectedIntrantMvtDetail.modePaiement || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Compte Débité :</span>
                  <span className="font-semibold text-slate-800">{selectedIntrantMvtDetail.comptePaiement || '—'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-400 block">Réf. Transactionnelle :</span>
                  <span className="font-mono font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {selectedIntrantMvtDetail.referencePaiement || '—'}
                  </span>
                </div>
              </div>
            )}

            {/* Bloc Signatures */}
            <div className="grid grid-cols-2 gap-8 pt-6 border-t-2 border-slate-200">
              <div className="space-y-12">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Le Magasinier Réceptionnaire</p>
                  <p className="text-[10px] text-slate-400">Date, Nom & Visa</p>
                </div>
                <div className="border-b border-dashed border-slate-400 w-3/4"></div>
              </div>

              <div className="space-y-12 text-right">
                <div>
                  <p className="text-xs font-black text-slate-800 uppercase tracking-wider">Le Responsable Usine / Qualité</p>
                  <p className="text-[10px] text-slate-400">Date, Cachet & Visa officiel</p>
                </div>
                <div className="border-b border-dashed border-slate-400 w-3/4 ml-auto"></div>
              </div>
            </div>

          </div>
        </div>
      )}
{/* ─── CONTENU DEMANDES & AUTORISATIONS DE SORTIES PRODUCTION (SPÉCIFICATION CLIENT) ──── */}
      {activeTab === 'DEMANDES_SORTIES_PRODUCTION' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6 space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-slate-100 pb-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black bg-indigo-100 text-indigo-800 uppercase flex items-center gap-1">
                  <FileCheck2 className="w-3.5 h-3.5 text-indigo-600" />
                  Contrôle Strict des Mouvements
                </span>
                <span className="text-xs text-slate-500">• Traçabilité intégrale avant déstockage</span>
              </div>
              <h2 className="text-base sm:text-lg font-black text-slate-900">
                Demandes d'Autorisation & Bons de Sortie vers Production
              </h2>
              <p className="text-xs text-slate-500">
                Circuit officiel d'approvisionnement : <em>Demande d'expression de besoin &rarr; Bon de sortie validé avec visa &rarr; Déstockage officiel.</em>
              </p>
            </div>
            <button
              onClick={() => setShowDemandeSortieModal(true)}
              className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center gap-2 shadow-lg active:scale-95"
            >
              <Plus className="w-4 h-4" />
              + Émettre une Demande de Sortie Matière
            </button>
          </div>

          {/* 3 Étapes officielles du Circuit d'Approvisionnement (Schéma explicatif p.2 & p.4) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs">
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="font-black text-indigo-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-indigo-100 text-indigo-700 text-xs flex items-center justify-center font-bold">1</span>
                Demande d'Expression de Besoin
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Toute sortie de matière première doit faire l'objet d'une demande d'expression de besoin pour la production, émise par le Responsable de Production et adressée à l'Assistant pour validation.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="font-black text-amber-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold">2</span>
                Bon de Sortie & Attestation
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                La sortie doit être constatée par un bon de sortie après validation de l'Assistant, avec une partie qui atteste la réception effective des matières par le Responsable de Production.
              </p>
            </div>

            <div className="p-3.5 rounded-xl bg-white border border-slate-200 space-y-1">
              <span className="font-black text-emerald-700 flex items-center gap-1.5">
                <span className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-700 text-xs flex items-center justify-center font-bold">3</span>
                Enregistrement de Déstockage
              </span>
              <p className="text-[11px] text-slate-600 leading-relaxed">
                Le bon de sortie signé permettra à l'Assistant d'enregistrer la sortie de matière du stock usine (débit du stock pulpeur et traçabilité audit).
              </p>
            </div>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[850px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3.5 px-4">N° Demande & Date</th>
                  <th className="py-3.5 px-4">Demandeur & Quart</th>
                  <th className="py-3.5 px-4">Matière & Ligne</th>
                  <th className="py-3.5 px-4 text-center">Quantité Demandée</th>
                  <th className="py-3.5 px-4">Motif des Besoins</th>
                  <th className="py-3.5 px-4 text-center">Statut Workflow</th>
                  <th className="py-3.5 px-4 text-center">Action Responsable Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {materialExitRequests.map(req => (
                  <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-slate-900 block">{req.numeroDemande}</span>
                      <span className="text-[10px] text-slate-400">{req.date} à {req.heure}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-800">{req.demandeurNom}</div>
                      <span className="text-[10px] text-slate-500">{req.shift}</span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{req.mpNom}</div>
                      <span className="text-[10px] text-slate-500">{req.ligneProduction}</span>
                    </td>
                    <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                      {req.quantiteKgDemandee.toLocaleString()} kg
                    </td>
                    <td className="py-3.5 px-4 text-slate-600 max-w-xs">
                      {req.motifBesoins}
                      {req.observations && <div className="text-[10px] text-slate-400 italic mt-0.5">{req.observations}</div>}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {req.statut === 'APPROUVEE_DESTOCKEE' ? (
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800 flex items-center justify-center gap-1 mx-auto w-fit">
                            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                            Autorisé & Déstocké
                          </span>
                          <span className="text-[10px] font-mono text-emerald-700 block mt-0.5 font-bold">
                            Bon: {req.numeroBonSortieGenere}
                          </span>
                        </div>
                      ) : req.statut === 'REJETEE' ? (
                        <div>
                          <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-red-100 text-red-800">
                            ✕ Demande Rejetée
                          </span>
                          {req.motifRefus && <div className="text-[10px] text-red-600 mt-0.5 italic">{req.motifRefus}</div>}
                        </div>
                      ) : (
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-black bg-amber-100 text-amber-800 animate-pulse">
                          ⏳ En Attente d'Autorisation
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {req.statut === 'EN_ATTENTE_AUTORISATION' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleApprouverDemandeSortie(req)}
                            className="px-2.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-[10px] shadow-sm flex items-center gap-1 active:scale-95"
                          >
                            <Check className="w-3.5 h-3.5" />
                            Autoriser & Déstocker
                          </button>
                          <button
                            onClick={() => handleRefuserDemandeSortie(req.id)}
                            className="px-2 py-1.5 rounded-xl bg-slate-100 hover:bg-red-50 text-slate-600 hover:text-red-600 font-bold text-[10px] border border-slate-200"
                          >
                            Refuser
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400">
                          Traité par {req.autorisePar || 'Magasinier'}
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

      {/* ─── CONTENU 4 : PRODUITS FINIS CONFORMES USINE ──────────────────── */}
      {activeTab === 'PRODUITS_FINIS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="mb-5 p-4 rounded-2xl bg-blue-50 border border-blue-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span><strong>Organisation Usine & Ventes :</strong> La gestion active des Produits Finis (fabrication, séchage, entrée en stock) est désormais pilotée dans le <strong>Module Productivité (Section 5.2)</strong> et la disponibilité à la vente dans le <strong>Module Gestion Commerciale</strong>. Cette vue est conservée ici comme miroir d'inventaire usine.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Produits Finis Conformes (Stock Usine)</h2>
              <p className="text-xs text-slate-500">Conditionnement : exclusivement par paquet ficelé de 100 unités • 3 500 FCFA le paquet</p>
            </div>
            <button
              onClick={() => setShowExitVoucherModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Truck className="w-4 h-4" />
              Dotation Commercial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map(p => (
              <div key={p.id} className="p-5 rounded-2xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-mono text-slate-400">{p.reference}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700">Format {p.format}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm mt-1">{p.nom}</h4>
                  <p className="text-[11px] text-slate-500 mt-1 line-clamp-2">{p.description}</p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 space-y-2">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-500">Stock Fardeaux :</span>
                    <span className="text-xl font-black text-slate-900">{p.stockFardeaux} <span className="text-xs font-normal">paquets</span></span>
                  </div>
                  <div className="flex justify-between items-center text-xs">
                    <span className="text-slate-500">Unités totales :</span>
                    <span className="font-bold text-slate-800">{p.stockTotalUnites.toLocaleString()} pcs</span>
                  </div>
                  <div className="flex justify-between items-center text-xs pt-1 border-t border-dashed border-slate-200">
                    <span className="text-slate-500">Tarif officiel :</span>
                    <span className="font-black text-emerald-700">3 500 FCFA / lot</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ─── CONTENU 5 : STOCKS CONFIÉS AUX COMMERCIAUX (CDC 6.6) ────────── */}
      {activeTab === 'STOCKS_COMMERCIAUX' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="mb-5 p-4 rounded-2xl bg-indigo-50 border border-indigo-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-indigo-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span><strong>Organisation Commerciale :</strong> La saisie des Bons de Sortie pour tournées et le suivi des stocks détenus par chaque commercial sont désormais directement gérés dans le <strong>Module Gestion Commerciale (onglet 👔 Dotations Commerciaux)</strong> avec calcul automatique des commissions.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Stocks Détenus par chaque Commercial (Catégorie 5)</h2>
              <p className="text-xs text-slate-500">Produits confiés en camionnette ou tournée commerciale (distincts du stock vendu)</p>
            </div>
            <button
              onClick={() => setShowExitVoucherModal(true)}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              Nouveau Bon de Sortie Commercial
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            {Object.values(commercialsMap).map(com => (
              <div key={com.nom} className="p-5 rounded-2xl border-2 border-indigo-100 bg-indigo-50/30">
                <div className="flex items-center gap-2 mb-3">
                  <UserCheck className="w-5 h-5 text-indigo-600" />
                  <h3 className="font-black text-slate-900 text-sm">{com.nom}</h3>
                </div>
                <div className="space-y-1.5 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Lots confiés (sorties usine) :</span>
                    <span className="font-bold text-slate-900">{com.lotsSortis} lots</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Lots vendus & facturés :</span>
                    <span className="font-bold text-emerald-600">{com.lotsVendus} lots</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>Lots retournés à l'usine :</span>
                    <span className="font-bold text-purple-600">{com.lotsRetournes} lots</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-2 border-t border-indigo-200 text-sm">
                    <span className="font-bold text-indigo-950">Solde Détenu en Tournée :</span>
                    <span className="text-xl font-black text-indigo-700">{com.soldeActuelLots} lots</span>
                  </div>
                  <div className="text-[11px] text-slate-400 text-right">
                    soit {(com.soldeActuelLots * 100).toLocaleString()} alvéoles
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Tableau des Bons de Sortie */}
          <h3 className="font-bold text-slate-800 text-sm mb-3">Historique des Bons de Sortie vers Commerciaux</h3>
          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">N° Bon & Date</th>
                  <th className="py-3 px-4">Commercial</th>
                  <th className="py-3 px-4">Produit</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4 text-center">Stock Usine (Avant → Après)</th>
                  <th className="py-3 px-4">Magasinier</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {exitVouchers.map(v => (
                  <tr key={v.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{v.numeroBon} <span className="text-[10px] text-slate-400 font-normal">({v.date})</span></td>
                    <td className="py-3 px-4 font-bold text-indigo-700">{v.commercialNom}</td>
                    <td className="py-3 px-4 text-slate-800">{v.produitNom}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">{v.quantiteLots} lots</td>
                    <td className="py-3 px-4 text-center text-slate-600">{v.stockUsineAvant} → <strong className="text-emerald-600">{v.stockUsineApres}</strong></td>
                    <td className="py-3 px-4 text-slate-500">{v.magasinierNom}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CONTENU 6 : RETOURS INVENDUS & CONTRÔLE (CDC 6.7) ────────────── */}
      {activeTab === 'RETOURS_CONTROLE' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="mb-5 p-4 rounded-2xl bg-purple-50 border border-purple-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-purple-900">
            <div className="flex items-center gap-2">
              <span className="text-xl">ℹ️</span>
              <span><strong>Organisation Logistique Retour :</strong> La saisie des retours d'invendus et le contrôle des tournées sont désormais centralisés dans le <strong>Module Gestion Commerciale (onglet 🔄 Retours Invendus)</strong>. Les alvéoles non conformes sont automatiquement recyclées au pulpeur.</span>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Retours des Invendus & Procédure de Contrôle</h2>
              <p className="text-xs text-slate-500">Contrôle de l'état des alvéoles retournées avant réintégration ou recyclage</p>
            </div>
            <button
              onClick={() => setShowReturnVoucherModal(true)}
              className="px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm"
            >
              <RotateCcw className="w-4 h-4" />
              Nouveau Retour Commercial
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">N° Retour & Date</th>
                  <th className="py-3 px-4">Commercial</th>
                  <th className="py-3 px-4">Produit & Lots</th>
                  <th className="py-3 px-4">Motif</th>
                  <th className="py-3 px-4 text-center">Statut / Décision</th>
                  <th className="py-3 px-4">Magasinier</th>
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
        </div>
      )}

      {/* ─── CONTENU 7 : QUARANTAINE & MATIÈRES REJETÉES (CDC 6.1 #3) ─────── */}
      {activeTab === 'MATIERES_REJETEES' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Matières Premières Rejetées (Quarantaine & Arbitrage)</h2>
              <p className="text-xs text-slate-500">Matières issues du tri sous surveillance : décision entre réinjection diluée au pulpeur ou évacuation</p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-black bg-rose-100 text-rose-800">
              Total en Quarantaine : {totalMatieresRejeteesKg} kg
            </span>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date & Réf</th>
                  <th className="py-3 px-4">Matière & Fournisseur</th>
                  <th className="py-3 px-4 text-center">Quantité Rejetée</th>
                  <th className="py-3 px-4">Motif du Rejet</th>
                  <th className="py-3 px-4 text-center">Statut Décision</th>
                  <th className="py-3 px-4 text-center">Arbitrage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rejectedMaterials.map(rej => (
                  <tr key={rej.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 font-mono font-bold text-slate-900">{rej.date}</td>
                    <td className="py-3 px-4 font-semibold text-slate-800">
                      {rej.mpNom}
                      <div className="text-[10px] text-slate-400">Origine: {rej.fournisseur}</div>
                    </td>
                    <td className="py-3 px-4 text-center font-black text-rose-600">{rej.quantiteKg} kg</td>
                    <td className="py-3 px-4 text-slate-600">{rej.motifRejet}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        rej.statut === 'EN_ATTENTE_DECISION' 
                          ? 'bg-amber-100 text-amber-800' 
                          : rej.statut === 'RECYCLE_PULPEUR' 
                          ? 'bg-emerald-100 text-emerald-800' 
                          : 'bg-slate-200 text-slate-700'
                      }`}>
                        {rej.statut}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {rej.statut === 'EN_ATTENTE_DECISION' ? (
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleDecideRejected(rej.id, 'RECYCLE_PULPEUR')}
                            className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white font-bold text-[10px] hover:bg-emerald-500"
                          >
                            Recycler Pulpeur
                          </button>
                          <button
                            onClick={() => handleDecideRejected(rej.id, 'EVACUATION_DEFINITIVE')}
                            className="px-2.5 py-1 rounded-lg bg-slate-200 text-slate-700 font-bold text-[10px] hover:bg-slate-300"
                          >
                            Évacuer
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-slate-400 italic">Clôturé le {rej.dateDecision}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── CONTENU 8 : INVENTAIRES PHYSIQUES & HISTORIQUE (CDC 6.8) ──────── */}
      {activeTab === 'INVENTAIRES_MOUVEMENTS' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden p-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
            <div>
              <h2 className="text-base font-black text-slate-900">Inventaires & Traçabilité Complète des Mouvements</h2>
              <p className="text-xs text-slate-500">Section 6.8 du CDC : Les écarts d'inventaire ne modifient jamais silencieusement le stock</p>
            </div>
            <button
              onClick={() => setShowInventaireModal(true)}
              className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm hover:bg-slate-800"
            >
              <ClipboardCheck className="w-4 h-4" />
              Enregistrer un Inventaire Physique
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-100 rounded-2xl">
            <table className="w-full text-left text-xs min-w-[700px]">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                <tr>
                  <th className="py-3 px-4">Date & Heure</th>
                  <th className="py-3 px-4">Type de Mouvement</th>
                  <th className="py-3 px-4">Article Concerné</th>
                  <th className="py-3 px-4 text-center">Quantité</th>
                  <th className="py-3 px-4">Responsable</th>
                  <th className="py-3 px-4">Motif / Justification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {movements.map(m => (
                  <tr key={m.id} className="hover:bg-slate-50">
                    <td className="py-3 px-4 text-slate-500 font-mono">{m.date}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                        m.type.includes('ENTREE') ? 'bg-emerald-100 text-emerald-800' : 'bg-indigo-100 text-indigo-800'
                      }`}>
                        {m.type}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-bold text-slate-900">{m.articleNom}</td>
                    <td className="py-3 px-4 text-center font-black text-slate-900">{m.quantite.toLocaleString()} {m.unite}</td>
                    <td className="py-3 px-4 text-slate-600">{m.responsable}</td>
                    <td className="py-3 px-4 text-slate-500 max-w-xs truncate">{m.motif}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ─── MODAL RÉCEPTION FOURNISSEUR OU COLLECTE USINE (CDC 6.2 & AUDIO) ─ */}
      {showReceptionModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-2xl w-full overflow-hidden shadow-2xl border border-slate-200 my-8">
            <div className="bg-gradient-to-r from-emerald-600 to-teal-700 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Réception Matières Premières & Papier Recyclé</h3>
                <p className="text-xs text-white/80">CDC 6.2 — Tarif standard : 250 FCFA/kg • Distinction Fournisseur vs Collecte</p>
              </div>
              <button onClick={() => setShowReceptionModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReception} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
              {/* Choix du mode d'approvisionnement */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setReceptionForm({ ...receptionForm, modeApprovisionnement: 'FOURNISSEUR_LIVRAISON' })}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    receptionForm.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON'
                      ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Truck className="w-5 h-5 text-emerald-600 mb-1" />
                  <span className="block text-xs font-bold">1. Livraison Fournisseur</span>
                  <span className="text-[10px] text-slate-400 font-normal">Chauffeur, transporteur, pesée usine</span>
                </button>

                <button
                  type="button"
                  onClick={() => setReceptionForm({ ...receptionForm, modeApprovisionnement: 'COLLECTE_USINE' })}
                  className={`p-3 rounded-2xl border-2 text-left transition-all ${
                    receptionForm.modeApprovisionnement === 'COLLECTE_USINE'
                      ? 'border-purple-500 bg-purple-50/50 text-purple-950 font-bold'
                      : 'border-slate-200 text-slate-600 hover:border-slate-300'
                  }`}
                >
                  <Car className="w-5 h-5 text-purple-600 mb-1" />
                  <span className="block text-xs font-bold">2. Collecte par l'Usine</span>
                  <span className="text-[10px] text-slate-400 font-normal">Agent usine, véhicule propre ou location</span>
                </button>
              </div>

              {/* Renseignements Fournisseur */}
              {receptionForm.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Informations Fournisseur & Transport</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Fournisseur</label>
                      <input
                        type="text"
                        value={receptionForm.fournisseurNom}
                        onChange={e => setReceptionForm({ ...receptionForm, fournisseurNom: e.target.value })}
                        required
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Transporteur</label>
                      <input
                        type="text"
                        value={receptionForm.transporteur}
                        onChange={e => setReceptionForm({ ...receptionForm, transporteur: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Chauffeur (Nom)</label>
                      <input
                        type="text"
                        value={receptionForm.chauffeurNom}
                        onChange={e => setReceptionForm({ ...receptionForm, chauffeurNom: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Tél Chauffeur</label>
                      <input
                        type="text"
                        value={receptionForm.chauffeurTel}
                        onChange={e => setReceptionForm({ ...receptionForm, chauffeurTel: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Immatriculation Camion</label>
                      <input
                        type="text"
                        value={receptionForm.vehiculeImmatriculation}
                        onChange={e => setReceptionForm({ ...receptionForm, vehiculeImmatriculation: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">N° Bon Pesée Pont-Bascule</label>
                      <input
                        type="text"
                        value={receptionForm.numeroBonPesee}
                        onChange={e => setReceptionForm({ ...receptionForm, numeroBonPesee: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">N° Facture Fournisseur</label>
                      <input
                        type="text"
                        value={receptionForm.numeroFactureFournisseur}
                        onChange={e => setReceptionForm({ ...receptionForm, numeroFactureFournisseur: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Renseignements Collecte Usine */}
              {receptionForm.modeApprovisionnement === 'COLLECTE_USINE' && (
                <div className="p-4 rounded-2xl bg-purple-50/60 border border-purple-200 space-y-3">
                  <h4 className="text-xs font-bold text-purple-900 uppercase tracking-wider">Mission de Collecte Usine</h4>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Agent de Collecte Usine</label>
                      <input
                        type="text"
                        value={receptionForm.agentCollecteNom}
                        onChange={e => setReceptionForm({ ...receptionForm, agentCollecteNom: e.target.value })}
                        required
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Entreprise / Site Collecté</label>
                      <input
                        type="text"
                        value={receptionForm.siteEntrepriseCollectee}
                        onChange={e => setReceptionForm({ ...receptionForm, siteEntrepriseCollectee: e.target.value })}
                        required
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Structure de Collecte (Schéma p.3)</label>
                      <input
                        type="text"
                        value={receptionForm.structureCollecte}
                        onChange={e => setReceptionForm({ ...receptionForm, structureCollecte: e.target.value })}
                        placeholder="ex : Imprimerie, Papeterie, Cartonnerie partenaire"
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">N° Fiche de Collecte (Schéma p.3)</label>
                      <input
                        type="text"
                        value={receptionForm.numeroFicheCollecte}
                        onChange={e => setReceptionForm({ ...receptionForm, numeroFicheCollecte: e.target.value })}
                        placeholder="ex : FC-2026-042"
                        className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Véhicule Utilisé</label>
                      <select
                        value={receptionForm.vehiculeType}
                        onChange={e => setReceptionForm({ ...receptionForm, vehiculeType: e.target.value as any })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      >
                        <option value="VEHICULE_USINE">Véhicule de l'Usine</option>
                        <option value="VEHICULE_LOCATION">Véhicule de Location</option>
                      </select>
                    </div>

                    {receptionForm.vehiculeType === 'VEHICULE_LOCATION' ? (
                      <>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Nom du Loueur</label>
                          <input
                            type="text"
                            value={receptionForm.loueurNom}
                            onChange={e => setReceptionForm({ ...receptionForm, loueurNom: e.target.value })}
                            className="w-full text-xs p-2 rounded-xl border border-slate-300"
                          />
                        </div>
                        <div>
                          <label className="block text-[11px] font-bold text-slate-600 mb-1">Coût Location (FCFA)</label>
                          <input
                            type="number"
                            value={receptionForm.coutLocationFCFA}
                            onChange={e => setReceptionForm({ ...receptionForm, coutLocationFCFA: Number(e.target.value) })}
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                          />
                        </div>
                      </>
                    ) : (
                      <div className="col-span-2">
                        <label className="block text-[11px] font-bold text-slate-600 mb-1">Immatriculation Véhicule Usine</label>
                        <input
                          type="text"
                          value={receptionForm.vehiculeImmatriculation}
                          onChange={e => setReceptionForm({ ...receptionForm, vehiculeImmatriculation: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono"
                        />
                      </div>
                    )}
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Heure Départ</label>
                      <input
                        type="time"
                        value={receptionForm.heureDepart}
                        onChange={e => setReceptionForm({ ...receptionForm, heureDepart: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-600 mb-1">Heure Retour</label>
                      <input
                        type="time"
                        value={receptionForm.heureRetour}
                        onChange={e => setReceptionForm({ ...receptionForm, heureRetour: e.target.value })}
                        className="w-full text-xs p-2 rounded-xl border border-slate-300"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Spécification 1.1 : Quantités, Unité, Prix & Utilisateur Réception */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                  Données de Pesée & Valorisation (Section 1.1 CDC)
                </h4>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Type de Matière (Papier/Carton)</label>
                    <input
                      type="text"
                      value={receptionForm.typePapierCarton}
                      onChange={e => setReceptionForm({ ...receptionForm, typePapierCarton: e.target.value })}
                      required
                      placeholder="ex : Balles OCC, Kraft, Journaux"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité Déclarée Fournisseur</label>
                    <input
                      type="number"
                      value={receptionForm.quantiteDeclareeKg}
                      onChange={e => setReceptionForm({ ...receptionForm, quantiteDeclareeKg: Number(e.target.value) })}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-emerald-950 mb-1">Quantité Physiquement Réceptionnée</label>
                    <input
                      type="number"
                      value={receptionForm.quantiteBruteReceptionneeKg}
                      onChange={e => setReceptionForm({ ...receptionForm, quantiteBruteReceptionneeKg: Number(e.target.value) })}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-emerald-400 bg-emerald-50/50 font-black text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Unité de Mesure</label>
                    <input
                      type="text"
                      value={receptionForm.uniteMesure}
                      onChange={e => setReceptionForm({ ...receptionForm, uniteMesure: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Prix Unitaire (FCFA/Kg)</label>
                    <input
                      type="number"
                      value={receptionForm.prixUnitaireKg}
                      onChange={e => setReceptionForm({ ...receptionForm, prixUnitaireKg: Number(e.target.value) })}
                      disabled={receptionForm.estGratuitDebarras}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Utilisateur ayant Réceptionné</label>
                    <input
                      type="text"
                      value={receptionForm.utilisateurReception}
                      onChange={e => setReceptionForm({ ...receptionForm, utilisateurReception: e.target.value })}
                      required
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Observations Réception</label>
                  <input
                    type="text"
                    value={receptionForm.observations}
                    onChange={e => setReceptionForm({ ...receptionForm, observations: e.target.value })}
                    placeholder="État apparent des balles, humidité, emballage, etc."
                    className="w-full text-xs p-2 rounded-xl border border-slate-300"
                  />
                </div>
              </div>

              {/* Règle Audio : Option Débarras Gratuit (0 F/kg) */}
              <div className="p-3 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="gratuitDebarras"
                    checked={receptionForm.estGratuitDebarras}
                    onChange={e => setReceptionForm({ ...receptionForm, estGratuitDebarras: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <label htmlFor="gratuitDebarras" className="text-xs font-bold text-amber-900 cursor-pointer">
                    Collecte gratuite pour débarras d'entreprise (Prix matière = 0 FCFA)
                  </label>
                </div>
                {!receptionForm.estGratuitDebarras ? (
                  <span className="text-xs font-black text-slate-900">{receptionForm.prixUnitaireKg} FCFA / kg</span>
                ) : (
                  <span className="text-xs font-black text-emerald-700">0 FCFA / kg</span>
                )}
              </div>

              {/* Récapitulatif Coût Total Brut */}
              <div className="p-3 rounded-2xl bg-slate-900 text-white flex justify-between items-center text-xs">
                <span>Montant Total Réception :</span>
                <span className="text-base font-black text-emerald-400">
                  {receptionForm.estGratuitDebarras 
                    ? `${receptionForm.coutLocationFCFA.toLocaleString()} FCFA (Location)`
                    : `${((receptionForm.quantiteBruteReceptionneeKg * (receptionForm.prixUnitaireKg || 250)) + receptionForm.coutLocationFCFA).toLocaleString()} FCFA`
                  }
                </span>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReceptionModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-emerald-500 hover:bg-emerald-400 rounded-xl shadow-lg"
                >
                  Générer Bon de Réception sur Quai
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL OPÉRATION DE TRI & DÉCLASSEMENT (CDC 6.3 & AUDIO) ──────── */}
      {showTriModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-slate-950 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Opération de Tri & Déclassement</h3>
                <p className="text-xs font-semibold opacity-90">Bon n° {showTriModal.numeroBon} • Brut : {showTriModal.quantiteBruteReceptionneeKg} kg</p>
              </div>
              <button onClick={() => setShowTriModal(null)} className="text-slate-950 hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleValidateTri} className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité Exploitable (Kg)</label>
                  <input
                    type="number"
                    value={triForm.quantiteExploitableKg}
                    onChange={e => {
                      const exp = Number(e.target.value);
                      setTriForm({
                        ...triForm,
                        quantiteExploitableKg: exp,
                        quantiteRejeteeKg: Math.max(0, showTriModal.quantiteBruteReceptionneeKg - exp)
                      });
                    }}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-emerald-600 text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Admis au pulpeur (Cat. 2)</span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité Rejetée (Kg)</label>
                  <input
                    type="number"
                    value={triForm.quantiteRejeteeKg}
                    onChange={e => {
                      const rej = Number(e.target.value);
                      setTriForm({
                        ...triForm,
                        quantiteRejeteeKg: rej,
                        quantiteExploitableKg: Math.max(0, showTriModal.quantiteBruteReceptionneeKg - rej)
                      });
                    }}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-rose-600 text-sm"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Zone Quarantaine (Cat. 3)</span>
                </div>
              </div>

              {/* RÈGLE AUDIO : Calcul en direct Rendement & Coût Réel de Revient */}
              <div className="p-3.5 rounded-2xl bg-slate-900 text-white space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-300">Rendement de tri :</span>
                  <span className="font-black text-amber-400 text-sm">
                    {((triForm.quantiteExploitableKg / (showTriModal.quantiteBruteReceptionneeKg || 1)) * 100).toFixed(1)} %
                  </span>
                </div>
                <div className="flex justify-between items-center text-xs pt-1.5 border-t border-slate-800">
                  <span className="text-slate-300">Coût d'acquisition réel (Exploitable) :</span>
                  <span className="font-black text-emerald-400 text-sm">
                    {triForm.quantiteExploitableKg > 0 
                      ? (showTriModal.coutTotalBrutFCFA / triForm.quantiteExploitableKg).toFixed(1)
                      : 0} FCFA / kg
                  </span>
                </div>
                <p className="text-[10px] text-slate-400">
                  {showTriModal.estGratuitDebarras 
                    ? 'Débarras gratuit : Coût ramené uniquement aux frais de déplacement.'
                    : `Base brute : ${showTriModal.coutTotalBrutFCFA.toLocaleString()} FCFA ÷ ${triForm.quantiteExploitableKg} kg utiles.`
                  }
                </p>
              </div>

              {/* Spécification 1.2 CDC : Tri et contrôle de la matière première */}
              <div className="p-3.5 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2.5">
                <span className="text-[11px] font-black text-amber-950 uppercase tracking-wider block">
                  Contrôle & Motifs de Rejet (Section 1.2 CDC)
                </span>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motifs Fréquents de Rejet</label>
                  <select
                    onChange={e => {
                      if (e.target.value) {
                        setTriForm({
                          ...triForm,
                          motifRejet: triForm.motifRejet ? `${triForm.motifRejet}, ${e.target.value}` : e.target.value
                        });
                      }
                    }}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-semibold text-slate-700"
                  >
                    <option value="">-- Ajouter un motif standard de rejet --</option>
                    <option value="Présence de plastiques non recyclables / rubans adhésifs">Plastiques & adhésifs</option>
                    <option value="Humidité anormale excessive (> 18%)">Humidité excessive &gt; 18%</option>
                    <option value="Agrafes métalliques et corps étrangers">Agrafes et corps étrangers</option>
                    <option value="Matières souillées / hydrocarbures / huiles">Souillures / huiles</option>
                    <option value="Papiers paraffinés / siliconés indéfibrables">Papiers siliconés indéfibrables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif(s) de Rejet Détaillé(s)</label>
                  <input
                    type="text"
                    value={triForm.motifRejet}
                    onChange={e => setTriForm({ ...triForm, motifRejet: e.target.value })}
                    placeholder="ex : Présence de plastiques non recyclables, agrafes et humidité anormale"
                    required={triForm.quantiteRejeteeKg > 0}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable du Tri Matière Première</label>
                  <input
                    type="text"
                    value={triForm.responsableTri}
                    onChange={e => setTriForm({ ...triForm, responsableTri: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowTriModal(null)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg"
                >
                  Valider le Tri & Alimenter le Stock Pulpeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL DEMANDE & SORTIE MATIÈRE VERS PULPEUR (PRODUCTION) ──────── */}
      {(showSortieProductionModal || showDemandeSortieModal) && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl border border-slate-200 animate-fadeIn my-8">
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-5 text-slate-950 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-black bg-slate-950/10 uppercase tracking-wide">
                    Workflow CDC 6.2 & Quai
                  </span>
                </div>
                <h3 className="text-base font-black mt-1">Demande & Sortie Matière vers Production</h3>
                <p className="text-xs font-semibold text-slate-900/80">Alimentation du pulpeur pour le cycle de fabrication</p>
              </div>
              <button 
                onClick={() => {
                  setShowSortieProductionModal(false);
                  setShowDemandeSortieModal(false);
                }} 
                className="text-slate-950 hover:bg-black/10 p-1.5 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateDemandeSortie} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Matière Première Exploitable</label>
                <select
                  value={demandeSortieForm.mpId}
                  onChange={e => {
                    setDemandeSortieForm({ ...demandeSortieForm, mpId: e.target.value });
                    setSortieProdForm({ ...sortieProdForm, mpId: e.target.value });
                  }}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                >
                  {rawMaterials.filter(m => m.categorie === 'PAPIER_CARTON').map(m => (
                    <option key={m.id} value={m.id}>
                      {m.nom} — Disponible : {m.stockActuel.toLocaleString()} {m.unite}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité Demandée (Kg)</label>
                  <input
                    type="number"
                    min="1"
                    value={demandeSortieForm.quantiteKgDemandee}
                    onChange={e => {
                      const val = Number(e.target.value);
                      setDemandeSortieForm({ ...demandeSortieForm, quantiteKgDemandee: val });
                      setSortieProdForm({ ...sortieProdForm, quantiteKg: val });
                    }}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                  />
                  <span className="text-[10px] text-slate-500 mt-0.5 block">
                    Besoin indicatif ~388.5 kg / jour de production
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quart / Équipe (Shift)</label>
                  <select
                    value={demandeSortieForm.shift}
                    onChange={e => {
                      setDemandeSortieForm({ ...demandeSortieForm, shift: e.target.value as ShiftType });
                      setSortieProdForm({ ...sortieProdForm, shift: e.target.value });
                    }}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  >
                    <option value="MATIN_06H_14H">Quart Matin (06h - 14h)</option>
                    <option value="SOIR_14H_22H">Quart Soir (14h - 22h)</option>
                    <option value="NUIT_22H_06H">Quart Nuit (22h - 06h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Demandeur (Production)</label>
                  <input
                    type="text"
                    value={demandeSortieForm.demandeurNom}
                    onChange={e => {
                      setDemandeSortieForm({ ...demandeSortieForm, demandeurNom: e.target.value });
                      setSortieProdForm({ ...sortieProdForm, responsableProduction: e.target.value });
                    }}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Ligne de Destination</label>
                  <input
                    type="text"
                    value={demandeSortieForm.ligneProduction}
                    onChange={e => setDemandeSortieForm({ ...demandeSortieForm, ligneProduction: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Motif / Affectation de la Sortie</label>
                <input
                  type="text"
                  value={demandeSortieForm.motifBesoins}
                  onChange={e => {
                    setDemandeSortieForm({ ...demandeSortieForm, motifBesoins: e.target.value });
                    setSortieProdForm({ ...sortieProdForm, motif: e.target.value });
                  }}
                  required
                  placeholder="ex : Alimentation pulpeur pour lot 30 standard"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-[11px] text-amber-900 flex items-start gap-2">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong>Règle de Contrôle des Sorties :</strong> Toute sortie est soumise à traçabilité. Vous pouvez soit émettre une demande pour visa officiel du magasinier, soit valider directement la sortie matière vers le pulpeur.
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => {
                    setShowSortieProductionModal(false);
                    setShowDemandeSortieModal(false);
                  }}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl order-3 sm:order-1"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2.5 text-xs font-black text-indigo-900 bg-indigo-100 hover:bg-indigo-200 border border-indigo-300 rounded-xl shadow-sm flex items-center justify-center gap-1.5 order-2"
                >
                  <FileCheck2 className="w-4 h-4 text-indigo-700" />
                  Demande d'Autorisation (Visa)
                </button>
                <button
                  type="button"
                  onClick={async (e) => {
                    await handleSaveSortieProduction(e);
                    setShowDemandeSortieModal(false);
                  }}
                  className="px-5 py-2.5 text-xs font-black text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-lg flex items-center justify-center gap-1.5 order-1 sm:order-3"
                >
                  <Split className="w-4 h-4" />
                  Sortie Immédiate au Pulpeur
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL SORTIE COMMERCIAL (CDC 6.6) ───────────────────────────── */}
      {showExitVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-indigo-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Bon de Sortie vers Commercial</h3>
                <p className="text-xs text-white/80">Dotation de stock fardeaux pour tournée de vente</p>
              </div>
              <button onClick={() => setShowExitVoucherModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveExitVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial Bénéficiaire</label>
                <input
                  type="text"
                  value={exitForm.commercialNom}
                  onChange={e => setExitForm({ ...exitForm, commercialNom: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-indigo-700"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Produit Confié</label>
                <select
                  value={exitForm.produitId}
                  onChange={e => setExitForm({ ...exitForm, produitId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  {products.map(p => (
                    <option key={p.id} value={p.id}>{p.nom} (Dispo usine: {p.stockFardeaux} lots)</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Quantité (Lots de 100 pièces)</label>
                <input
                  type="number"
                  value={exitForm.quantiteLots}
                  onChange={e => setExitForm({ ...exitForm, quantiteLots: Number(e.target.value) })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Magasinier Remettant</label>
                <input
                  type="text"
                  value={exitForm.magasinierNom}
                  onChange={e => setExitForm({ ...exitForm, magasinierNom: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowExitVoucherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-indigo-600 hover:bg-indigo-500 rounded-xl shadow-lg"
                >
                  Générer Bon de Sortie
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL RETOUR INVENDUS (CDC 6.7) ─────────────────────────────── */}
      {showReturnVoucherModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-purple-600 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Retour des Invendus Commercial</h3>
                <p className="text-xs text-white/80">Contrôle de l'état des alvéoles et décision magasinier</p>
              </div>
              <button onClick={() => setShowReturnVoucherModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveReturnVoucher} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Commercial</label>
                <input
                  type="text"
                  value={returnForm.commercialNom}
                  onChange={e => setReturnForm({ ...returnForm, commercialNom: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-purple-700"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Produit</label>
                  <select
                    value={returnForm.produitId}
                    onChange={e => setReturnForm({ ...returnForm, produitId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nom}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Quantité (Lots de 100)</label>
                  <input
                    type="number"
                    value={returnForm.quantiteLots}
                    onChange={e => setReturnForm({ ...returnForm, quantiteLots: Number(e.target.value) })}
                    required
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Décision après Contrôle</label>
                <select
                  value={returnForm.decision}
                  onChange={e => setReturnForm({ ...returnForm, decision: e.target.value as any })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold text-slate-900"
                >
                  <option value="ACCEPTE_CONFORME">✓ Accepté conforme (Réintégré stock usine)</option>
                  <option value="NON_CONFORME_RECYCLE">♻️ Non conforme (Recyclé au pulpeur)</option>
                  <option value="ACCEPTE_SOUS_RESERVE">⏳ Accepté sous réserve (À isoler)</option>
                  <option value="REFUSE">🚫 Refusé (Détérioration anormale)</option>
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowReturnVoucherModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-purple-600 hover:bg-purple-500 rounded-xl shadow-lg"
                >
                  Valider le Retour
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ─── MODAL INVENTAIRE PHYSIQUE (CDC 6.8) ─────────────────────────── */}
      {showInventaireModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full overflow-hidden shadow-2xl border border-slate-200">
            <div className="bg-slate-900 p-5 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black">Ajustement d'Inventaire Physique</h3>
                <p className="text-xs text-white/80">Traçabilité obligatoire des écarts (CDC Section 6.8)</p>
              </div>
              <button onClick={() => setShowInventaireModal(false)} className="text-white hover:opacity-80">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveInventaire} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Article</label>
                <select
                  value={inventaireForm.articleId}
                  onChange={e => setInventaireForm({ ...inventaireForm, articleId: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold"
                >
                  {rawMaterials.map(m => (
                    <option key={m.id} value={m.id}>{m.nom} (Théorique: {m.stockActuel} {m.unite})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Comptage Physique Réel</label>
                <input
                  type="number"
                  value={inventaireForm.stockPhysique}
                  onChange={e => setInventaireForm({ ...inventaireForm, stockPhysique: Number(e.target.value) })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Justification Obligatoire de l'Écart</label>
                <textarea
                  value={inventaireForm.justification}
                  onChange={e => setInventaireForm({ ...inventaireForm, justification: e.target.value })}
                  required
                  rows={2}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Responsables du Comptage</label>
                <input
                  type="text"
                  value={inventaireForm.responsableComptage}
                  onChange={e => setInventaireForm({ ...inventaireForm, responsableComptage: e.target.value })}
                  required
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowInventaireModal(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-black text-white bg-slate-900 hover:bg-slate-800 rounded-xl shadow-lg"
                >
                  Enregistrer l'Ajustement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
