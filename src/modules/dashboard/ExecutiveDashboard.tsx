import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportDashboardPdf } from '../../services/pdfExport';
import { AlertSettingsModal } from './AlertSettingsModal';
import { User } from '../../types';
import { 
  Gauge, TrendingUp, DollarSign, Boxes, Factory, AlertTriangle, 
  CheckCircle2, Clock, ShoppingBag, ShieldCheck, ArrowUpRight, 
  Layers, Package, Zap, ArrowRight, Calendar, Users, AlertCircle, 
  FileText, Sliders, ChevronDown, ChevronUp, RefreshCw, XCircle,
  Truck, ArrowDownRight, CheckSquare, Scale, Info
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, LineChart, Line,
  AreaChart, Area
} from 'recharts';

interface ExecutiveDashboardProps {
  onNavigateTab: (tab: any) => void;
  currentUser?: User | null;
}

type PeriodMode = 'JOURNEE' | 'SEMAINE' | 'MOIS' | 'TRIMESTRE' | 'ANNEE' | 'PERSONNALISE';

export const ExecutiveDashboard: React.FC<ExecutiveDashboardProps> = ({ 
  onNavigateTab, 
  currentUser 
}) => {
  const { currentTheme } = useTheme();

  // ── Modal de configuration des seuils ──────────────────────────────
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [showCommercialDetailModal, setShowCommercialDetailModal] = useState(false);

  // ── 4.1 Sélection de la période ────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [periodMode, setPeriodMode] = useState<PeriodMode>('MOIS');
  const [selectedDate, setSelectedDate] = useState<string>(todayStr);
  const [selectedMonth, setSelectedMonth] = useState<string>(todayStr.slice(0, 7)); // YYYY-MM
  const [selectedQuarter, setSelectedQuarter] = useState<number>(4); // T4
  const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(d.getDate() - 30);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(todayStr);

  // ── Chargement des données réactives Dexie ─────────────────────────
  const shifts = useLiveQuery(() => db.productionShifts.toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const rawReceptions = useLiveQuery(() => db.rawMaterialReceptions.toArray()) || [];
  const rejectedMaterials = useLiveQuery(() => db.rejectedRawMaterials.toArray()) || [];
  const invoices = useLiveQuery(() => db.invoices.toArray()) || [];
  const expenses = useLiveQuery(() => db.expenses.toArray()) || [];
  const exitVouchers = useLiveQuery(() => db.commercialExitVouchers.toArray()) || [];
  const returnVouchers = useLiveQuery(() => db.commercialReturnVouchers.toArray()) || [];
  const contracts = useLiveQuery(() => db.commercialContracts.toArray()) || [];
  const inventorySessions = useLiveQuery(() => db.inventorySessions.toArray()) || [];
  const factorySettingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const factorySettings = factorySettingsList[0];

  // ── Paramètres d'usine & Seuils d'alertes configurables ───────────
  const CADENCE_CIBLE = factorySettings?.cadenceReelleCible || 1700;
  const CIBLE_MENSUELLE = (factorySettings?.heuresEffectivesParJour || 8) * 
                          (factorySettings?.joursProductionParMois || 26) * 
                          CADENCE_CIBLE; // 353 600 alvéoles
  const OBJECTIF_VENTE_LOTS_MENSUEL = Math.round(CIBLE_MENSUELLE / (factorySettings?.tailleLotCommercial || 100)); // 3 536 lots

  const seuilAutonomiePapier = factorySettings?.seuilAlerteJoursAutonomiePapier ?? 5;
  const seuilCadenceMin = factorySettings?.seuilAlerteCadenceMin ?? 1500;
  const seuilTauxRebutMax = factorySettings?.seuilAlerteTauxRebutMax ?? 5.0;
  const seuilArretProlongeHeures = factorySettings?.seuilAlerteArretMachineProlongeHeures ?? 1.5;
  const seuilStockMinPF = factorySettings?.seuilAlerteStockMinLotsProduitsFinis ?? 200;
  const seuilPlafondStockCommercial = factorySettings?.seuilAlerteStockCommercialPlafondLots ?? 250;
  const seuilCreancesMax = factorySettings?.seuilAlerteCreancesMaxFCFA ?? 1500000;
  const seuilDelaiFactureEchue = factorySettings?.seuilAlerteDelaiFactureEchueJours ?? 15;
  const seuilEcheanceContrat = factorySettings?.seuilAlerteEcheanceContratJours ?? 30;
  const seuilEcartInventaire = factorySettings?.seuilAlerteEcartInventaireValeurFCFA ?? 50000;

  // ── Calcul de l'intervalle de date [startDate, endDate] ────────────
  const { startDate, endDate, periodLabel } = useMemo(() => {
    let start = '';
    let end = '';
    let label = '';

    if (periodMode === 'JOURNEE') {
      start = selectedDate;
      end = selectedDate;
      label = `Journée du ${new Date(selectedDate).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}`;
    } else if (periodMode === 'SEMAINE') {
      const ref = new Date(selectedDate);
      const day = ref.getDay();
      const diffToMonday = ref.getDate() - day + (day === 0 ? -6 : 1);
      const monday = new Date(ref.setDate(diffToMonday));
      const sunday = new Date(monday);
      sunday.setDate(monday.getDate() + 6);
      start = monday.toISOString().split('T')[0];
      end = sunday.toISOString().split('T')[0];
      label = `Semaine du ${monday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })} au ${sunday.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })}`;
    } else if (periodMode === 'MOIS') {
      const [y, m] = selectedMonth.split('-').map(Number);
      start = `${selectedMonth}-01`;
      const lastDay = new Date(y, m, 0).getDate();
      end = `${selectedMonth}-${String(lastDay).padStart(2, '0')}`;
      const monthName = new Date(y, m - 1, 1).toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      label = `Mois de ${monthName}`;
    } else if (periodMode === 'TRIMESTRE') {
      const startMonth = (selectedQuarter - 1) * 3 + 1;
      const endMonth = selectedQuarter * 3;
      start = `${selectedYear}-${String(startMonth).padStart(2, '0')}-01`;
      const lastDay = new Date(selectedYear, endMonth, 0).getDate();
      end = `${selectedYear}-${String(endMonth).padStart(2, '0')}-${String(lastDay).padStart(2, '0')}`;
      label = `Trimestre T${selectedQuarter} ${selectedYear}`;
    } else if (periodMode === 'ANNEE') {
      start = `${selectedYear}-01-01`;
      end = `${selectedYear}-12-31`;
      label = `Année civile ${selectedYear}`;
    } else {
      start = customStartDate;
      end = customEndDate;
      label = `Du ${new Date(customStartDate).toLocaleDateString('fr-FR')} au ${new Date(customEndDate).toLocaleDateString('fr-FR')}`;
    }

    return { startDate: start, endDate: end, periodLabel: label };
  }, [periodMode, selectedDate, selectedMonth, selectedQuarter, selectedYear, customStartDate, customEndDate]);

  // ── Filtrage des données selon la période sélectionnée ──────────────
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => s.date >= startDate && s.date <= endDate);
  }, [shifts, startDate, endDate]);

  const filteredInvoices = useMemo(() => {
    return invoices.filter(i => i.date >= startDate && i.date <= endDate);
  }, [invoices, startDate, endDate]);

  const filteredExpenses = useMemo(() => {
    return expenses.filter(e => e.date >= startDate && e.date <= endDate);
  }, [expenses, startDate, endDate]);

  const filteredReceptions = useMemo(() => {
    return rawReceptions.filter(r => r.date >= startDate && r.date <= endDate);
  }, [rawReceptions, startDate, endDate]);

  // Shifts du jour spécifique
  const todayShifts = useMemo(() => {
    return shifts.filter(s => s.date === todayStr);
  }, [shifts, todayStr]);

  // ══════════════════════════════════════════════════════════════════════
  // 4.2.1 INDICATEURS DE SYNTHÈSE : PRODUCTION
  // ══════════════════════════════════════════════════════════════════════
  const prodJourAlveoles = todayShifts.reduce((sum, s) => sum + s.alvéolesConformes, 0);
  const prodConformePeriode = filteredShifts.reduce((sum, s) => sum + s.alvéolesConformes, 0);
  
  // Rebuts / Non conformes estimés ou enregistrés
  const prodNonConformePeriode = filteredShifts.reduce((sum, s) => {
    if (s.rebutsKilos && s.rebutsKilos > 0) {
      // 1 kg = 35 alvéoles (rendement CDC)
      return sum + Math.round(s.rebutsKilos * 35);
    }
    const totalEstime = (s.cadenceHoraireReelle || 0) * (s.heuresFonctionnement || 0);
    return sum + Math.max(0, totalEstime - s.alvéolesConformes);
  }, 0);

  const totalProduitPeriode = prodConformePeriode + prodNonConformePeriode;
  const tauxRebutPeriode = totalProduitPeriode > 0 
    ? Number(((prodNonConformePeriode / totalProduitPeriode) * 100).toFixed(1))
    : 0;

  const cadenceMoyenneReelle = filteredShifts.length > 0
    ? Math.round(filteredShifts.reduce((sum, s) => sum + s.cadenceHoraireReelle, 0) / filteredShifts.length)
    : (todayShifts.length > 0 ? todayShifts[0].cadenceHoraireReelle : CADENCE_CIBLE);

  // Production cumulée du mois calendaire en cours
  const currentMonthPrefix = todayStr.slice(0, 7);
  const currentMonthShifts = shifts.filter(s => s.date.startsWith(currentMonthPrefix));
  const prodCumulMoisEnCours = currentMonthShifts.reduce((sum, s) => sum + s.alvéolesConformes, 0);
  const ecartCibleMois = prodCumulMoisEnCours - CIBLE_MENSUELLE;

  const totalTempsArretHeures = Number(
    filteredShifts.reduce((sum, s) => sum + (s.heuresArret || 0), 0).toFixed(1)
  );

  // ══════════════════════════════════════════════════════════════════════
  // 4.2.2 INDICATEURS DE SYNTHÈSE : STOCKS
  // ══════════════════════════════════════════════════════════════════════
  // 1. Stock papier-carton brut (reçu avant tri / en vrac)
  const stockPapierBrutKg = rawReceptions
    .filter(r => r.statutTri === 'EN_ATTENTE_DE_TRI')
    .reduce((sum, r) => sum + (r.quantiteBruteReceptionneeKg || 0), 0);

  // 2. Stock de matière première exploitable après tri
  const stockPapierExploitableKg = rawMaterials
    .filter(m => m.categorie === 'PAPIER_CARTON')
    .reduce((sum, m) => sum + m.stockActuel, 0);

  // 3. Stock de produits finis conformes à l'usine
  const stockPFLotsUsine = products.reduce((sum, p) => sum + p.stockFardeaux, 0);
  const stockPFUnitesUsine = products.reduce((sum, p) => sum + p.stockTotalUnites, 0);

  // 4. Stock de produits en attente de contrôle
  const retoursEnAttenteControle = returnVouchers.filter(r => r.statut === 'EN_ATTENTE_CONTROLE');
  const stockEnAttenteControleLots = retoursEnAttenteControle.reduce((sum, r) => sum + r.quantiteLots, 0);

  // 5. Quantité détenue par chaque commercial
  const stockParCommercialMap: Record<string, { nom: string; lots: number; valeurFCFA: number }> = {};
  exitVouchers.forEach(v => {
    if (!stockParCommercialMap[v.commercialId]) {
      stockParCommercialMap[v.commercialId] = { nom: v.commercialNom, lots: 0, valeurFCFA: 0 };
    }
    stockParCommercialMap[v.commercialId].lots += v.quantiteLots;
  });
  returnVouchers.forEach(r => {
    if (stockParCommercialMap[r.commercialId]) {
      stockParCommercialMap[r.commercialId].lots = Math.max(0, stockParCommercialMap[r.commercialId].lots - r.quantiteLots);
    }
  });
  // Déduire les ventes effectives des commerciaux si rattachées
  Object.keys(stockParCommercialMap).forEach(comId => {
    stockParCommercialMap[comId].valeurFCFA = stockParCommercialMap[comId].lots * 3500;
  });

  const listeCommerciaux = Object.entries(stockParCommercialMap).map(([id, val]) => ({
    id,
    ...val
  }));
  const totalStockDetenuCommerciauxLots = listeCommerciaux.reduce((sum, c) => sum + c.lots, 0);

  // 6. Stock bloqué ou déclassé
  const stockMatiereRejeteeKg = rejectedMaterials
    .filter(r => r.statut === 'EN_ATTENTE_DECISION')
    .reduce((sum, r) => sum + r.quantiteKg, 0);
  const stockPFDeclasseLots = returnVouchers
    .filter(r => r.statut === 'NON_CONFORME_RECYCLE')
    .reduce((sum, r) => sum + r.quantiteLots, 0);

  // 7. Jours de couverture estimés de la matière première
  // Besoin quotidien : ~388 kg/jour (pour ~13 600 alv/jour à 35 alv/kg)
  const consommationJourCartonKg = Math.max(50, Math.round((CIBLE_MENSUELLE / 26) / (factorySettings?.rendementMatiereAlvParKg || 35)));
  const joursCouverturePapier = Math.round(stockPapierExploitableKg / consommationJourCartonKg);

  // ══════════════════════════════════════════════════════════════════════
  // 4.2.3 INDICATEURS DE SYNTHÈSE : COMMERCIAL
  // ══════════════════════════════════════════════════════════════════════
  // Ventes du jour
  const todayInvoices = invoices.filter(i => i.date === todayStr);
  const caVentesJour = todayInvoices.reduce((sum, i) => sum + i.totalTTC, 0);
  const lotsVendusJour = todayInvoices.reduce((sum, i) => sum + i.articles.reduce((s2, a) => s2 + a.fardeaux, 0), 0);

  // Ventes de la période
  const caFacturePeriode = filteredInvoices.reduce((sum, i) => sum + i.totalTTC, 0);
  const caEncaissePeriode = filteredInvoices.reduce((sum, i) => sum + i.acompteVerse, 0);
  const creancesClientsGlobales = invoices.reduce((sum, i) => sum + i.soldeRestant, 0);

  const lotsVendusPeriode = filteredInvoices.reduce((sum, i) => {
    return sum + i.articles.reduce((s2, a) => s2 + a.fardeaux, 0);
  }, 0);
  const alveolesVenduesPeriode = filteredInvoices.reduce((sum, i) => {
    return sum + i.articles.reduce((s2, a) => s2 + a.quantiteUnites, 0);
  }, 0);

  // Commandes à préparer et livraisons en attente
  const commandesAPreparer = invoices.filter(i => i.statutCommande === 'CONFIRMEE' || i.statutCommande === 'EN_PRODUCTION');
  const lotsCommandesAPreparer = commandesAPreparer.reduce((sum, i) => sum + i.articles.reduce((s2, a) => s2 + a.fardeaux, 0), 0);

  const livraisonsEnAttente = invoices.filter(i => i.statutCommande === 'PRETE_EXPEDITION' || i.statutCommande === 'EXPEDIEE');
  const lotsLivraisonsEnAttente = livraisonsEnAttente.reduce((sum, i) => sum + i.articles.reduce((s2, a) => s2 + a.fardeaux, 0), 0);

  // Taux de réalisation de l'objectif commercial mensuel
  const tauxRealisationCommercial = Math.min(150, Math.round((lotsVendusPeriode / (OBJECTIF_VENTE_LOTS_MENSUEL || 1)) * 100));

  // Part couverte par les contrats B2B
  const volumeContratsMoisLots = contracts
    .filter(c => c.statut === 'EN_COURS')
    .reduce((sum, c) => sum + c.volumeMensuelLots, 0);
  const partContratsPct = Math.min(100, Math.round((volumeContratsMoisLots / (OBJECTIF_VENTE_LOTS_MENSUEL || 1)) * 100));
  const partMarcheOuvertPct = Math.max(0, 100 - partContratsPct);

  // ══════════════════════════════════════════════════════════════════════
  // 4.2.4 INDICATEURS DE SYNTHÈSE : FINANCE
  // ══════════════════════════════════════════════════════════════════════
  const recettesEncaisseesPeriode = filteredInvoices.reduce((sum, i) => sum + i.acompteVerse, 0);
  const depensesPeriode = filteredExpenses.reduce((sum, e) => sum + e.montant, 0);

  // Dettes fournisseurs suivies (achats cartons non soldés ou factures fournisseurs déclarées)
  const dettesFournisseurs = rawReceptions
    .filter(r => r.coutTotalBrutFCFA && r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON')
    .reduce((sum, r) => sum + (r.coutTotalBrutFCFA || 0), 0);

  // Trésorerie calculée à partir des encaissements réels et dépenses validées
  const capitalInitialTresorerie = 15000000;
  const soldeTresorerieTotal = capitalInitialTresorerie + 
    invoices.reduce((sum, i) => sum + i.acompteVerse, 0) - 
    expenses.reduce((sum, e) => sum + e.montant, 0);

  // Coût unitaire de production estimé
  const coutUnitaireAlveole = prodConformePeriode > 0 
    ? Number((depensesPeriode / prodConformePeriode).toFixed(2))
    : 18.5;
  const coutUnitaireLot = Math.round(coutUnitaireAlveole * 100);

  // Marge estimée de la période
  const margeEstimeeFCFA = caFacturePeriode - depensesPeriode;
  const tauxMargePourcent = caFacturePeriode > 0
    ? Math.round((margeEstimeeFCFA / caFacturePeriode) * 100)
    : 0;

  // Résultat de gestion de la période
  const resultatGestionPeriode = recettesEncaisseesPeriode - depensesPeriode;

  // ══════════════════════════════════════════════════════════════════════
  // 4.3 LES 12 ALERTES AUTOMATIQUES DU CDC
  // ══════════════════════════════════════════════════════════════════════
  const autoAlerts = useMemo(() => {
    const list: Array<{
      id: string;
      level: 'CRITIQUE' | 'AVERTISSEMENT' | 'INFO';
      titre: string;
      message: string;
      valeur: string;
      seuil: string;
      actionLabel: string;
      targetTab: string;
    }> = [];

    // 1. Stock de papier inférieur au seuil critique
    if (joursCouverturePapier < seuilAutonomiePapier) {
      list.push({
        id: 'alt-mp-critique',
        level: 'CRITIQUE',
        titre: 'Stock de papier carton critique',
        message: `Autonomie actuelle estimée à ${joursCouverturePapier} jours. Risque d'arrêt de pulpeur.`,
        valeur: `${joursCouverturePapier} j.`,
        seuil: `< ${seuilAutonomiePapier} j.`,
        actionLabel: 'Réceptionner Matière',
        targetTab: 'stock'
      });
    }

    // 2. Cadence de production inférieure au seuil acceptable
    if (cadenceMoyenneReelle < seuilCadenceMin) {
      list.push({
        id: 'alt-cadence-basse',
        level: 'AVERTISSEMENT',
        titre: 'Cadence machine sous le seuil acceptable',
        message: `Cadence moyenne usine à ${cadenceMoyenneReelle} alv/h (cible nominale ${CADENCE_CIBLE}).`,
        valeur: `${cadenceMoyenneReelle} alv/h`,
        seuil: `< ${seuilCadenceMin} alv/h`,
        actionLabel: 'Vérifier Ligne',
        targetTab: 'productivite'
      });
    }

    // 3. Taux de rebut trop élevé
    if (tauxRebutPeriode > seuilTauxRebutMax) {
      list.push({
        id: 'alt-rebut-eleve',
        level: 'CRITIQUE',
        titre: 'Taux de rebut alvéoles excessif',
        message: `Le taux de rebut atteint ${tauxRebutPeriode}%. Contrôler le séchoir et la pâte.`,
        valeur: `${tauxRebutPeriode}%`,
        seuil: `> ${seuilTauxRebutMax}%`,
        actionLabel: 'Contrôle Qualité',
        targetTab: 'productivite'
      });
    }

    // 4. Arrêt machine prolongé
    const longStops = filteredShifts.filter(s => (s.heuresArret || 0) >= seuilArretProlongeHeures);
    if (longStops.length > 0) {
      list.push({
        id: 'alt-arret-prolonge',
        level: 'AVERTISSEMENT',
        titre: `${longStops.length} arrêt(s) machine prolongé(s)`,
        message: `Dernier arrêt significatif : ${longStops[0].motifArret || 'Non précisé'} (${longStops[0].heuresArret}h).`,
        valeur: `${longStops[0].heuresArret}h`,
        seuil: `≥ ${seuilArretProlongeHeures}h`,
        actionLabel: 'Voir Maintenance',
        targetTab: 'productivite'
      });
    }

    // 5. Quantité de produits finis insuffisante pour honorer les commandes
    if (lotsCommandesAPreparer > stockPFLotsUsine) {
      list.push({
        id: 'alt-pf-insuffisant',
        level: 'CRITIQUE',
        titre: 'Stock produits finis insuffisant pour les commandes',
        message: `${lotsCommandesAPreparer} lots commandés à préparer face à ${stockPFLotsUsine} lots disponibles en usine.`,
        valeur: `${stockPFLotsUsine} lots usine`,
        seuil: `Besoin : ${lotsCommandesAPreparer} lots`,
        actionLabel: 'Planifier Production',
        targetTab: 'productivite'
      });
    }

    // 6. Stock commercial non justifié
    const commerciauxEnSurstock = listeCommerciaux.filter(c => c.lots > seuilPlafondStockCommercial);
    if (commerciauxEnSurstock.length > 0) {
      list.push({
        id: 'alt-com-surstock',
        level: 'AVERTISSEMENT',
        titre: 'Stock commercial dépassant le plafond autorisé',
        message: `${commerciauxEnSurstock.map(c => `${c.nom} (${c.lots} lots)`).join(', ')} dépasse le seuil max.`,
        valeur: `${commerciauxEnSurstock[0].lots} lots`,
        seuil: `> ${seuilPlafondStockCommercial} lots`,
        actionLabel: 'Gérer Bons Sortie',
        targetTab: 'stock'
      });
    }

    // 7. Retour de produits en attente de contrôle
    if (retoursEnAttenteControle.length > 0) {
      list.push({
        id: 'alt-retours-attente',
        level: 'AVERTISSEMENT',
        titre: `${retoursEnAttenteControle.length} bon(s) de retour invendus en attente`,
        message: `${stockEnAttenteControleLots} lots retournés par les commerciaux doivent être vérifiés par le magasinier.`,
        valeur: `${stockEnAttenteControleLots} lots`,
        seuil: `Non validé`,
        actionLabel: 'Contrôler Retours',
        targetTab: 'stock'
      });
    }

    // 8. Facture échue et non réglée
    const facturesEchues = invoices.filter(i => i.soldeRestant > 0 && i.dateEcheance < todayStr);
    const totalEchuFCFA = facturesEchues.reduce((sum, i) => sum + i.soldeRestant, 0);
    if (facturesEchues.length > 0) {
      list.push({
        id: 'alt-factures-echues',
        level: 'CRITIQUE',
        titre: `${facturesEchues.length} facture(s) client échue(s) impayée(s)`,
        message: `Montant total échu à recouvrer d'urgence : ${totalEchuFCFA.toLocaleString()} FCFA.`,
        valeur: `${totalEchuFCFA.toLocaleString()} F`,
        seuil: `Dépassement échéance`,
        actionLabel: 'Relancer Clients',
        targetTab: 'commercial'
      });
    }

    // 9. Contrat approchant de son échéance
    const contratsExpirantBientot = contracts.filter(c => {
      if (c.statut !== 'EN_COURS') return false;
      const diffJours = Math.ceil((new Date(c.dateFin).getTime() - new Date(todayStr).getTime()) / (1000 * 3600 * 24));
      return diffJours >= 0 && diffJours <= seuilEcheanceContrat;
    });
    if (contratsExpirantBientot.length > 0) {
      list.push({
        id: 'alt-contrat-echeance',
        level: 'INFO',
        titre: `${contratsExpirantBientot.length} contrat(s) B2B arrivant à échéance`,
        message: `Ex: ${contratsExpirantBientot[0].clientNom} (Contrat ${contratsExpirantBientot[0].numeroContrat}) expire sous peu.`,
        valeur: `Sous ≤ ${seuilEcheanceContrat} j.`,
        seuil: `Seuil ${seuilEcheanceContrat} jours`,
        actionLabel: 'Renouveler Contrat',
        targetTab: 'commercial'
      });
    }

    // 10. Livraison en retard
    const livraisonsEnRetard = invoices.filter(i => {
      return (i.statutCommande === 'CONFIRMEE' || i.statutCommande === 'PRETE_EXPEDITION') && i.date < todayStr;
    });
    if (livraisonsEnRetard.length > 0) {
      list.push({
        id: 'alt-livraison-retard',
        level: 'AVERTISSEMENT',
        titre: `${livraisonsEnRetard.length} commande(s) en attente de livraison`,
        message: `Commandes enregistrées antérieurement à ce jour nécessitant préparation ou expédition.`,
        valeur: `${livraisonsEnRetard.length} cdes`,
        seuil: `Date dépassée`,
        actionLabel: 'Expédier Commandes',
        targetTab: 'commercial'
      });
    }

    // 11. Écart entre stock théorique et inventaire physique
    const dernieresSessionsAvecEcart = inventorySessions
      .filter(s => s.articlesEnEcart > 0 || Math.abs(s.valeurEcartNetFCFA) > seuilEcartInventaire);
    if (dernieresSessionsAvecEcart.length > 0) {
      const lastSession = dernieresSessionsAvecEcart[dernieresSessionsAvecEcart.length - 1];
      list.push({
        id: 'alt-inventaire-ecart',
        level: 'AVERTISSEMENT',
        titre: 'Écart physique / théorique constaté en inventaire',
        message: `Session du ${lastSession.date} : ${lastSession.articlesEnEcart} article(s) en écart pour ${Math.abs(lastSession.valeurEcartNetFCFA).toLocaleString()} FCFA.`,
        valeur: `${Math.abs(lastSession.valeurEcartNetFCFA).toLocaleString()} F`,
        seuil: `> ${seuilEcartInventaire.toLocaleString()} F`,
        actionLabel: 'Régulariser Inventaire',
        targetTab: 'inventaire'
      });
    }

    // 12. Opération financière nécessitant une validation
    const grossesDepenses = filteredExpenses.filter(e => e.montant > 500000);
    if (grossesDepenses.length > 0) {
      list.push({
        id: 'alt-finance-validation',
        level: 'INFO',
        titre: `${grossesDepenses.length} opération(s) financière(s) importante(s)`,
        message: `Dépense récente de ${grossesDepenses[0].montant.toLocaleString()} FCFA (${grossesDepenses[0].beneficiaire}) à rapprocher.`,
        valeur: `${grossesDepenses[0].montant.toLocaleString()} F`,
        seuil: `> 500 000 FCFA`,
        actionLabel: 'Trésorerie & Dépenses',
        targetTab: 'finances'
      });
    }

    return list;
  }, [
    joursCouverturePapier, seuilAutonomiePapier, cadenceMoyenneReelle, seuilCadenceMin,
    CADENCE_CIBLE, tauxRebutPeriode, seuilTauxRebutMax, filteredShifts, seuilArretProlongeHeures,
    lotsCommandesAPreparer, stockPFLotsUsine, listeCommerciaux, seuilPlafondStockCommercial,
    retoursEnAttenteControle, stockEnAttenteControleLots, invoices, todayStr,
    contracts, seuilEcheanceContrat, inventorySessions, seuilEcartInventaire, filteredExpenses
  ]);

  // ── Données des graphiques ──────────────────────────────────────────
  // 1. Cadence et Production par shift
  const chartShiftsData = useMemo(() => {
    return filteredShifts.slice(-8).map(s => ({
      name: `${s.date.slice(5)} (Shift 8h)`,
      conformes: s.alvéolesConformes,
      rebuts: s.rebutsKilos ? Math.round(s.rebutsKilos * 35) : Math.round(s.alvéolesConformes * 0.03),
      cadenceReelle: s.cadenceHoraireReelle,
      cadenceCible: CADENCE_CIBLE
    }));
  }, [filteredShifts, CADENCE_CIBLE]);

  // 2. Répartition des ventes par format d'alvéoles
  const chartVentesParFormat = useMemo(() => {
    const map: Record<string, number> = {};
    filteredInvoices.forEach(inv => {
      inv.articles.forEach(art => {
        const nom = art.format === 'PLATEAU_30' ? 'Plateau 30 Std' :
                    art.format === 'PLATEAU_30_EXPORT' ? 'Plateau 30 Export' :
                    art.format === 'BOITE_6' ? 'Boîte 6 Œufs' :
                    art.format === 'BOITE_10' ? 'Boîte 10 Œufs' : 'Boîte 12 Œufs';
        map[nom] = (map[nom] || 0) + art.totalLigneFCFA;
      });
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredInvoices]);

  const PIE_COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899'];

  // 3. Répartition des charges et dépenses
  const chartDepensesParCategorie = useMemo(() => {
    const map: Record<string, number> = {};
    filteredExpenses.forEach(e => {
      const catCourte = e.categorie.length > 22 ? e.categorie.slice(0, 20) + '...' : e.categorie;
      map[catCourte] = (map[catCourte] || 0) + e.montant;
    });
    return Object.entries(map).map(([name, montant]) => ({ name, montant }));
  }, [filteredExpenses]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ══════════════════════════════════════════════════════════════════
          4.1 BANNIÈRE DE DIRECTION & SÉLECTEUR DE PÉRIODE
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-7 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex flex-col xl:flex-row xl:items-center xl:justify-between gap-5">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-amber-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
                <Gauge className="w-3.5 h-3.5" />
                MODULE 1 • TABLEAU DE BORD GÉNÉRAL
              </span>
              <span className="text-xs text-slate-300 font-medium">
                Unité de fabrication d'alvéoles • Devise : <strong>FCFA</strong>
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Synthèse Exécutive de Direction
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
              Lecture immédiate à 360° : Production, stocks multi-zones, performance commerciale, situation de trésorerie et alertes critiques en temps réel.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
            {/* Bouton de configuration des seuils sans dev */}
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl bg-slate-800/90 hover:bg-slate-700 text-amber-300 border border-amber-500/30 text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-sm"
              title="Modifier les seuils d'alertes sans développeur"
            >
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>Seuils d'Alertes</span>
            </button>

            {/* Export PDF */}
            <ExportPdfButton onExport={() => exportDashboardPdf(currentTheme.hex)} />
          </div>
        </div>

        {/* BARRE DE SÉLECTION DE PÉRIODE (CDC 4.1) */}
        <div className="mt-6 pt-5 border-t border-slate-700/80 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-amber-400" />
              Période :
            </span>

            {/* Boutons de mode de période (défilement fluide sur mobile) */}
            <div className="bg-slate-800/90 p-1 rounded-2xl border border-slate-700 flex items-center gap-1 text-xs overflow-x-auto no-scrollbar max-w-full">
              {(['JOURNEE', 'SEMAINE', 'MOIS', 'TRIMESTRE', 'ANNEE', 'PERSONNALISE'] as PeriodMode[]).map(mode => (
                <button
                  key={mode}
                  onClick={() => setPeriodMode(mode)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all text-[11px] sm:text-xs whitespace-nowrap shrink-0 ${
                    periodMode === mode
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'text-slate-300 hover:text-white hover:bg-slate-700/60'
                  }`}
                >
                  {mode === 'JOURNEE' ? 'Journée' :
                   mode === 'SEMAINE' ? 'Semaine' :
                   mode === 'MOIS' ? 'Mois' :
                   mode === 'TRIMESTRE' ? 'Trimestre' :
                   mode === 'ANNEE' ? 'Année' : 'Personnalisé'}
                </button>
              ))}
            </div>
          </div>

          {/* Sélecteurs dynamiques selon le mode choisi */}
          <div className="flex items-center gap-2">
            {periodMode === 'JOURNEE' && (
              <input
                type="date"
                value={selectedDate}
                onChange={e => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
              />
            )}

            {periodMode === 'SEMAINE' && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-slate-400">Semaine contenant le :</span>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={e => setSelectedDate(e.target.value)}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {periodMode === 'MOIS' && (
              <input
                type="month"
                value={selectedMonth}
                onChange={e => setSelectedMonth(e.target.value)}
                className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
              />
            )}

            {periodMode === 'TRIMESTRE' && (
              <div className="flex items-center gap-2">
                <select
                  value={selectedQuarter}
                  onChange={e => setSelectedQuarter(Number(e.target.value))}
                  className="px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
                >
                  <option value={1}>T1 (Jan - Mar)</option>
                  <option value={2}>T2 (Avr - Jun)</option>
                  <option value={3}>T3 (Jui - Sep)</option>
                  <option value={4}>T4 (Oct - Déc)</option>
                </select>
                <input
                  type="number"
                  min="2020"
                  max="2030"
                  value={selectedYear}
                  onChange={e => setSelectedYear(Number(e.target.value))}
                  className="w-20 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
                />
              </div>
            )}

            {periodMode === 'ANNEE' && (
              <input
                type="number"
                min="2020"
                max="2030"
                value={selectedYear}
                onChange={e => setSelectedYear(Number(e.target.value))}
                className="w-24 px-3 py-1.5 bg-slate-800 border border-slate-600 rounded-xl text-xs font-bold text-white focus:ring-2 focus:ring-amber-500"
              />
            )}

            {periodMode === 'PERSONNALISE' && (
              <div className="flex items-center gap-1.5 text-xs">
                <input
                  type="date"
                  value={customStartDate}
                  onChange={e => setCustomStartDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-xl font-bold text-white"
                />
                <span className="text-slate-400">au</span>
                <input
                  type="date"
                  value={customEndDate}
                  onChange={e => setCustomEndDate(e.target.value)}
                  className="px-2.5 py-1.5 bg-slate-800 border border-slate-600 rounded-xl font-bold text-white"
                />
              </div>
            )}

            <div className="hidden lg:block px-3 py-1 bg-slate-800/80 rounded-xl text-[11px] font-semibold text-amber-300 border border-slate-700">
              {periodLabel}
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4.3 CENTRE D'ALERTES AUTOMATIQUES (12 SITUATIONS DU CDC)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white rounded-3xl p-5 sm:p-6 border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-red-50 text-red-600">
              <AlertTriangle className="w-5 h-5" />
            </span>
            <div>
              <h2 className="text-base font-black text-slate-900 flex items-center gap-2">
                Alertes Opérationnelles Automatiques
                <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-slate-100 text-slate-700">
                  {autoAlerts.length} active(s)
                </span>
              </h2>
              <p className="text-xs text-slate-500">
                Surveillance automatique des 12 points critiques du CDC (stocks, cadences, rebuts, retards, créances)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs">
            <button
              onClick={() => setIsSettingsModalOpen(true)}
              className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-3 py-1.5 rounded-xl hover:bg-indigo-50 transition-colors"
            >
              <Sliders className="w-3.5 h-3.5" />
              Modifier les seuils
            </button>
          </div>
        </div>

        {autoAlerts.length === 0 ? (
          <div className="p-6 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-800 flex items-center gap-3 text-xs font-bold">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
            <span>Excellente situation opérationnelle : Aucun seuil critique franchi. Tous les indicateurs usine respectent les normes du CDC.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {autoAlerts.map(alert => (
              <div
                key={alert.id}
                className={`p-4 rounded-2xl border flex flex-col justify-between gap-3 transition-all ${
                  alert.level === 'CRITIQUE'
                    ? 'bg-red-50/70 border-red-200 hover:border-red-300'
                    : alert.level === 'AVERTISSEMENT'
                    ? 'bg-amber-50/70 border-amber-200 hover:border-amber-300'
                    : 'bg-blue-50/70 border-blue-200 hover:border-blue-300'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                      alert.level === 'CRITIQUE' ? 'bg-red-200 text-red-900' :
                      alert.level === 'AVERTISSEMENT' ? 'bg-amber-200 text-amber-900' :
                      'bg-blue-200 text-blue-900'
                    }`}>
                      {alert.level}
                    </span>
                    <span className="text-[10px] font-bold text-slate-500">
                      Réf : {alert.seuil}
                    </span>
                  </div>
                  <h4 className="text-xs font-black text-slate-900 mt-1">{alert.titre}</h4>
                  <p className="text-[11px] text-slate-600 mt-1 leading-relaxed">{alert.message}</p>
                </div>

                <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between">
                  <span className="text-xs font-black text-slate-900">
                    Actuel : {alert.valeur}
                  </span>
                  <button
                    onClick={() => onNavigateTab(alert.targetTab)}
                    className={`px-3 py-1.5 rounded-xl text-white text-[11px] font-bold transition-all flex items-center gap-1 shadow-sm ${
                      alert.level === 'CRITIQUE' ? 'bg-red-600 hover:bg-red-700' :
                      alert.level === 'AVERTISSEMENT' ? 'bg-amber-600 hover:bg-amber-700' :
                      'bg-blue-600 hover:bg-blue-700'
                    }`}
                  >
                    {alert.actionLabel} →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          4.2 LES 4 GRANDS BLOCS D'INDICATEURS DU CDC (CARTES DE SYNTHÈSE)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
        
        {/* 1. PRODUCTION (CDC 4.2) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-amber-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-amber-50 text-amber-700 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Factory className="w-3.5 h-3.5" />
                1. Production
              </span>
              <span className="text-[11px] font-bold text-slate-400">Cible: 1 700 alv/h</span>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {prodConformePeriode.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1.5">alvéoles</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Aujourd'hui : <strong className="text-slate-900">{prodJourAlveoles.toLocaleString()} alv.</strong>
              </div>
              <div className="text-xs text-slate-600 mt-1 flex items-center gap-2">
                <span>Non conformes : <strong className="text-red-600">{prodNonConformePeriode.toLocaleString()}</strong></span>
                <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                  tauxRebutPeriode <= 3 ? 'bg-emerald-100 text-emerald-800' :
                  tauxRebutPeriode <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  Rebut {tauxRebutPeriode}%
                </span>
              </div>
              <div className="text-xs text-indigo-600 font-bold mt-1.5">
                Cadence moyenne : {cadenceMoyenneReelle} alv/h
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span>Cumul mois en cours :</span>
              <strong className="text-slate-900">{prodCumulMoisEnCours.toLocaleString()} alv.</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-500">Écart vs Cible mensuelle :</span>
              <span className={`font-black ${ecartCibleMois >= 0 ? 'text-emerald-600' : 'text-amber-600'}`}>
                {ecartCibleMois >= 0 ? `+${ecartCibleMois.toLocaleString()}` : ecartCibleMois.toLocaleString()}
              </span>
            </div>
            <div className="flex items-center justify-between text-slate-500 pt-1">
              <span>Temps d'arrêt machine :</span>
              <strong className="text-slate-800">{totalTempsArretHeures} heures</strong>
            </div>
          </div>
        </div>

        {/* 2. STOCKS & MATIÈRES (CDC 4.2 & 6.1) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <Boxes className="w-3.5 h-3.5" />
                2. Stocks & Matières
              </span>
              <button
                onClick={() => setShowCommercialDetailModal(true)}
                className="text-[10px] font-bold text-emerald-700 hover:underline"
              >
                Détail commerciaux →
              </button>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {stockPFLotsUsine.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1.5">lots usine</span>
              </div>
              <div className="text-xs text-slate-600 mt-0.5">
                Total unités PF usine : <strong className="text-slate-900">{stockPFUnitesUsine.toLocaleString()} alv.</strong>
              </div>
              <div className="text-xs text-indigo-700 font-bold mt-1.5 flex items-center justify-between">
                <span>Détenu commerciaux :</span>
                <span className="bg-indigo-50 px-2 py-0.5 rounded-lg text-indigo-800 font-black">
                  {totalStockDetenuCommerciauxLots} lots (100)
                </span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Papier exploitable : <strong className="text-slate-900">{(stockPapierExploitableKg / 1000).toFixed(1)} T</strong> ({stockPapierExploitableKg.toLocaleString()} kg)
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span>Papier brut avant tri :</span>
              <strong>{stockPapierBrutKg.toLocaleString()} kg</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>En attente de contrôle :</span>
              <strong className={stockEnAttenteControleLots > 0 ? 'text-amber-600' : 'text-slate-800'}>
                {stockEnAttenteControleLots} lots retours
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Stock bloqué / déclassé :</span>
              <strong className="text-slate-700">{stockMatiereRejeteeKg} kg MP • {stockPFDeclasseLots} lots PF</strong>
            </div>
            <div className="flex items-center justify-between pt-1 font-bold">
              <span className="text-slate-600">Jours de couverture estimés :</span>
              <span className={joursCouverturePapier < seuilAutonomiePapier ? 'text-red-600 font-black' : 'text-emerald-700'}>
                ~{joursCouverturePapier} jours
              </span>
            </div>
          </div>
        </div>

        {/* 3. COMMERCIAL (CDC 4.2 & 12.1) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-blue-50 text-blue-700 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <ShoppingBag className="w-3.5 h-3.5" />
                3. Commercial
              </span>
              <span className="text-[11px] font-bold text-slate-400">Lots de 100</span>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-slate-900">
                {caFacturePeriode.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1.5">FCFA</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Ventes du jour : <strong className="text-slate-900">{caVentesJour.toLocaleString()} FCFA ({lotsVendusJour} lots)</strong>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Volume période : <strong className="text-blue-700">{lotsVendusPeriode.toLocaleString()} lots</strong> ({alveolesVenduesPeriode.toLocaleString()} alv.)
              </div>
              <div className="text-xs text-emerald-700 font-bold mt-1.5">
                Encaissements reçus : {caEncaissePeriode.toLocaleString()} FCFA
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Créances clients en cours :</span>
              <strong className={creancesClientsGlobales > seuilCreancesMax ? 'text-red-600' : 'text-slate-900'}>
                {creancesClientsGlobales.toLocaleString()} FCFA
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Commandes à préparer :</span>
              <strong className="text-amber-700">{commandesAPreparer.length} cdes ({lotsCommandesAPreparer} lots)</strong>
            </div>
            <div className="flex items-center justify-between text-slate-600">
              <span>Livraisons en attente :</span>
              <strong className="text-blue-700">{livraisonsEnAttente.length} cdes ({lotsLivraisonsEnAttente} lots)</strong>
            </div>
            <div className="flex items-center justify-between pt-1">
              <span className="text-slate-600">Taux réalisation objectif :</span>
              <span className="font-black text-indigo-700">{tauxRealisationCommercial}%</span>
            </div>
          </div>
        </div>

        {/* 4. FINANCES & TRÉSORERIE (CDC 4.2 & 8.4) */}
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm hover:border-purple-300 transition-all flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <span className="px-2.5 py-1 rounded-xl bg-purple-50 text-purple-700 text-[11px] font-black uppercase tracking-wider flex items-center gap-1.5">
                <DollarSign className="w-3.5 h-3.5" />
                4. Finances
              </span>
              <span className="text-[11px] font-bold text-slate-400">Trésorerie nette</span>
            </div>

            <div className="mt-4">
              <div className="text-2xl sm:text-3xl font-black text-emerald-700">
                {soldeTresorerieTotal.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1.5">FCFA</span>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Recettes encaissées : <strong className="text-emerald-700">{recettesEncaisseesPeriode.toLocaleString()} FCFA</strong>
              </div>
              <div className="text-xs text-slate-600 mt-1">
                Dépenses enregistrées : <strong className="text-slate-900">{depensesPeriode.toLocaleString()} FCFA</strong>
              </div>
              <div className="text-xs text-purple-700 font-bold mt-1.5">
                Coût unitaire : {coutUnitaireAlveole} F / alv. ({coutUnitaireLot} F / lot)
              </div>
            </div>
          </div>

          <div className="mt-5 pt-3 border-t border-slate-100 space-y-1 text-[11px]">
            <div className="flex items-center justify-between text-slate-600">
              <span>Dettes fournisseurs suivies :</span>
              <strong className="text-slate-800">{dettesFournisseurs.toLocaleString()} FCFA</strong>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-slate-600">Marge brute estimée :</span>
              <strong className="text-emerald-700">{margeEstimeeFCFA.toLocaleString()} FCFA ({tauxMargePourcent}%)</strong>
            </div>
            <div className="flex items-center justify-between pt-1 border-t border-slate-50">
              <span className="font-bold text-slate-700">Résultat gestion période :</span>
              <span className={`font-black ${resultatGestionPeriode >= 0 ? 'text-emerald-700' : 'text-red-600'}`}>
                {resultatGestionPeriode >= 0 ? `+${resultatGestionPeriode.toLocaleString()}` : resultatGestionPeriode.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </div>

      </div>

      {/* ══════════════════════════════════════════════════════════════════
          PART DU VOLUME COUVERTE PAR LES CONTRATS (CDC 4.2 & SECTION 12.1)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-2">
              <FileText className="w-4 h-4 text-blue-600" />
              Répartition Stratégique : Contrats B2B Cadres vs Marché Ouvert (CDC 12.1)
            </h3>
            <p className="text-xs text-slate-500">
              Sécurisation de la production mensuelle : Cible recommandée 60% Contrats (30 FCFA/alv) • 40% Marché Libre (35 FCFA/alv)
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs font-bold">
            <span className="flex items-center gap-1.5 text-blue-700 bg-blue-50 px-2.5 py-1 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-600"></span>
              Contrats B2B : {partContratsPct}% ({volumeContratsMoisLots.toLocaleString()} lots/mois)
            </span>
            <span className="flex items-center gap-1.5 text-amber-700 bg-amber-50 px-2.5 py-1 rounded-xl">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
              Marché Libre : {partMarcheOuvertPct}%
            </span>
          </div>
        </div>

        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden flex shadow-inner">
          <div 
            className="bg-blue-600 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-white font-black" 
            style={{ width: `${partContratsPct}%` }}
          >
            {partContratsPct > 10 ? `${partContratsPct}% Contrats` : ''}
          </div>
          <div 
            className="bg-amber-500 h-full transition-all duration-500 flex items-center justify-center text-[10px] text-slate-950 font-black" 
            style={{ width: `${partMarcheOuvertPct}%` }}
          >
            {partMarcheOuvertPct > 10 ? `${partMarcheOuvertPct}% Marché Ouvert` : ''}
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          GRAPHIQUES DE SYNTHÈSE INTERACTIFS (CDC 4.2)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* GRAPHIQUE 1 : Production, Rebuts et Cadences récentes */}
        <div className="lg:col-span-2 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
              <div>
                <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                  <TrendingUp className="w-5 h-5 text-indigo-600" />
                  Cadence Réelle & Volumes Conformes par Shift
                </h3>
                <p className="text-xs text-slate-500">
                  Suivi de la cadence horaire réelle comparée au standard CDC (1 700 alv/h)
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('productivite')}
                className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
              >
                Module Production →
              </button>
            </div>

            <div className="h-72 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartShiftsData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} />
                  <YAxis yAxisId="right" orientation="right" stroke="#F59E0B" fontSize={11} tickLine={false} domain={[1000, 2500]} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px', border: 'none' }}
                  />
                  <Legend wrapperStyle={{ paddingTop: '10px' }} />
                  <Bar yAxisId="left" dataKey="conformes" name="Alvéoles Conformes" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="left" dataKey="rebuts" name="Rebuts Recyclés" fill="#EF4444" radius={[4, 4, 0, 0]} />
                  <Line yAxisId="right" type="monotone" dataKey="cadenceReelle" name="Cadence Réelle (alv/h)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
                  <Line yAxisId="right" type="monotone" dataKey="cadenceCible" name="Cible CDC (1 700 alv/h)" stroke="#10B981" strokeDasharray="5 5" strokeWidth={2} dot={false} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 flex flex-wrap items-center justify-between text-xs text-slate-500">
            <span>Total shifts affichés : {chartShiftsData.length}</span>
            <span className="font-bold text-indigo-700">Moyenne cadence : {cadenceMoyenneReelle} alv/h</span>
          </div>
        </div>

        {/* GRAPHIQUE 2 : Ventes par Format d'Alvéoles */}
        <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-base font-black text-slate-900">
                Ventes par Format d'Alvéoles
              </h3>
              <button
                onClick={() => onNavigateTab('commercial')}
                className="text-xs font-bold text-blue-600 hover:underline"
              >
                Ventes →
              </button>
            </div>
            <p className="text-xs text-slate-500 mb-4">Répartition du chiffre d'affaires sur la période</p>

            <div className="h-56 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={chartVentesParFormat}
                    cx="50%"
                    cy="50%"
                    outerRadius={75}
                    dataKey="value"
                    label={({ percent }) => `${(percent * 100).toFixed(0)}%`}
                  >
                    {chartVentesParFormat.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip 
                    formatter={(val: number) => `${val.toLocaleString()} FCFA`}
                    contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="space-y-1.5 pt-3 border-t border-slate-100 text-xs">
            {chartVentesParFormat.map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="flex items-center gap-1.5 truncate max-w-[170px]">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[i % PIE_COLORS.length] }}></span>
                  <span className="text-slate-700 truncate">{item.name}</span>
                </div>
                <span className="font-bold text-slate-900">{item.value.toLocaleString()} F</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRAPHIQUE 3 : Ventilation des Charges d'Exploitation */}
      <div className="bg-white p-5 sm:p-6 rounded-3xl border border-slate-200 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
              <DollarSign className="w-5 h-5 text-purple-600" />
              Ventilation des Dépenses & Charges Opérationnelles
            </h3>
            <p className="text-xs text-slate-500">
              Cartographie des coûts de production, énergie, maintenance et approvisionnements sur la période
            </p>
          </div>
          <button
            onClick={() => onNavigateTab('finances')}
            className="text-xs font-bold text-purple-600 hover:text-purple-800 flex items-center gap-1"
          >
            Module Trésorerie & Dépenses →
          </button>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartDepensesParCategorie} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#E2E8F0" />
              <XAxis type="number" stroke="#64748B" fontSize={11} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <YAxis dataKey="name" type="category" stroke="#64748B" fontSize={11} tickLine={false} width={120} />
              <Tooltip 
                formatter={(val: number) => `${val.toLocaleString()} FCFA`}
                contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '12px' }}
              />
              <Bar dataKey="montant" name="Montant Dépense" fill="#8B5CF6" radius={[0, 6, 6, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          RACCOURCIS VERS LES AUTRES MODULES DU CDC
          ══════════════════════════════════════════════════════════════════ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          onClick={() => onNavigateTab('productivite')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-amber-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-2xl bg-amber-50 text-amber-700 group-hover:bg-amber-500 group-hover:text-slate-950 transition-colors">
              <Factory className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-amber-500 transition-colors" />
          </div>
          <h4 className="font-black text-slate-900 text-sm mt-3">Production & TRS</h4>
          <p className="text-xs text-slate-500 mt-1">Relevés de shifts, cadences horaires, fardelage et checklists A.2.1</p>
        </button>

        <button
          onClick={() => onNavigateTab('stock')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-emerald-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-2xl bg-emerald-50 text-emerald-700 group-hover:bg-emerald-500 group-hover:text-slate-950 transition-colors">
              <Boxes className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-emerald-500 transition-colors" />
          </div>
          <h4 className="font-black text-slate-900 text-sm mt-3">Approvisionnements & Stocks</h4>
          <p className="text-xs text-slate-500 mt-1">Réceptions triées (250 F/kg), stocks commerciaux et retours</p>
        </button>

        <button
          onClick={() => onNavigateTab('commercial')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-blue-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-2xl bg-blue-50 text-blue-700 group-hover:bg-blue-500 group-hover:text-white transition-colors">
              <ShoppingBag className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-blue-500 transition-colors" />
          </div>
          <h4 className="font-black text-slate-900 text-sm mt-3">Commercial & Contrats</h4>
          <p className="text-xs text-slate-500 mt-1">Contrats B2B, factures, encaissements et livraisons fermes</p>
        </button>

        <button
          onClick={() => onNavigateTab('finances')}
          className="p-5 rounded-3xl bg-white border border-slate-200 hover:border-purple-400 hover:shadow-md transition-all text-left group"
        >
          <div className="flex items-center justify-between">
            <span className="p-3 rounded-2xl bg-purple-50 text-purple-700 group-hover:bg-purple-500 group-hover:text-white transition-colors">
              <DollarSign className="w-5 h-5" />
            </span>
            <ArrowRight className="w-4 h-4 text-slate-300 group-hover:text-purple-500 transition-colors" />
          </div>
          <h4 className="font-black text-slate-900 text-sm mt-3">Finances & Trésorerie</h4>
          <p className="text-xs text-slate-500 mt-1">Comptabilité analytique, coût de revient et rapprochements caisse</p>
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1 : DÉTAIL DU STOCK DÉTENU PAR CHAQUE COMMERCIAL (CDC 4.2)
          ══════════════════════════════════════════════════════════════════ */}
      {showCommercialDetailModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[85dvh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            <div className="bg-slate-900 text-white p-5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-500/20 text-indigo-400">
                  <Users className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black">Stock Détenu par Chaque Commercial</h3>
                  <p className="text-xs text-slate-400">Section 4.2 du Cahier des Charges • Suivi des dotations terrain</p>
                </div>
              </div>
              <button 
                onClick={() => setShowCommercialDetailModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            <div className="p-5 overflow-y-auto flex-1 space-y-4">
              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-2xl flex items-center justify-between text-xs font-bold text-indigo-950">
                <span>Total général en circulation sur le terrain :</span>
                <span className="text-sm font-black text-indigo-700">
                  {totalStockDetenuCommerciauxLots} lots de 100 alvéoles ({ (totalStockDetenuCommerciauxLots * 3500).toLocaleString() } FCFA)
                </span>
              </div>

              {listeCommerciaux.length === 0 ? (
                <p className="text-center py-8 text-xs text-slate-500">Aucun commercial ne détient de stock actuellement.</p>
              ) : (
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-2xl overflow-hidden">
                  {listeCommerciaux.map(com => (
                    <div key={com.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl bg-slate-100 flex items-center justify-center font-black text-xs text-slate-700">
                          {com.nom.slice(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <h4 className="text-xs font-black text-slate-900">{com.nom}</h4>
                          <span className="text-[11px] text-slate-500">Commercial Terrain</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-sm font-black text-slate-900">
                          {com.lots} lots <span className="text-xs font-normal text-slate-500">({com.lots * 100} alv.)</span>
                        </div>
                        <div className="text-[11px] font-bold text-emerald-700">
                          Valeur : {com.valeurFCFA.toLocaleString()} FCFA
                        </div>
                        {com.lots > seuilPlafondStockCommercial && (
                          <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 mt-0.5">
                            Plafond dépassé (&gt; {seuilPlafondStockCommercial} lots)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-3 pb-4 sm:p-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-semibold text-slate-600 z-20 mt-auto">
              <span>Règle : Tout stock confié doit faire l'objet d'un bon de sortie ou d'un retour vérifié.</span>
              <button
                onClick={() => {
                  setShowCommercialDetailModal(false);
                  onNavigateTab('stock');
                }}
                className="px-3.5 py-1.5 rounded-xl bg-indigo-600 text-white font-bold text-xs hover:bg-indigo-700"
              >
                Gérer les Bons de Sortie →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2 : CONFIGURATION DES SEUILS MODIFIABLES SANS DÉVELOPPEUR
          ══════════════════════════════════════════════════════════════════ */}
      <AlertSettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentSettings={factorySettings}
        userRole={currentUser?.role || 'DIRECTEUR_USINE'}
        userName={currentUser?.name || 'Direction Usine'}
      />

    </div>
  );
};
