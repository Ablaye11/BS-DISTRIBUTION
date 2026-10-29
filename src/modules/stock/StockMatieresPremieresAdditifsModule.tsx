import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { 
  RawMaterialStock, RawMaterialReceptionVoucher, RejectedRawMaterialRecord,
  StockMovement, IntrantStockMovement, MaterialExitRequest, ShiftType
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportStockPdf, exportReceptionPdf, exportBonSortieProductionPdf } from '../../services/pdfExport';
import { 
  Boxes, Plus, Minus, Search, Filter, Truck, CheckCircle2, 
  AlertTriangle, DollarSign, RotateCcw, Clock, Calendar, User, 
  Layers, Scale, Building, FileText, ChevronDown, Check, X, 
  ShieldAlert, Droplets, Sparkles, History, ArrowRight, CornerDownRight, 
  Scissors, Info, AlertOctagon, HelpCircle, Package, ArrowDownRight, ArrowUpRight,
  MapPin, Phone, Car, Compass, Crosshair, ExternalLink, Printer, Download, CheckSquare
} from 'lucide-react';

export const StockMatieresPremieresAdditifsModule: React.FC = () => {
  const { currentTheme } = useTheme();

  // ─── Données réactives Dexie ──────────────────────────────────────────────
  const rawMaterials = useLiveQuery(() => db.rawMaterials.toArray()) || [];
  const receptions = useLiveQuery(() => db.rawMaterialReceptions.orderBy('date').reverse().toArray()) || [];
  const rejectedMaterials = useLiveQuery(() => db.rejectedRawMaterials.orderBy('date').reverse().toArray()) || [];
  const movements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().limit(150).toArray()) || [];
  const intrantMovements = useLiveQuery(() => db.intrantMovements.orderBy('date').reverse().limit(150).toArray()) || [];
  const materialExitRequests = useLiveQuery(() => db.materialExitRequests.orderBy('date').reverse().toArray()) || [];

  // ─── Navigation Principale : Matière Première à gauche / Additifs à droite ─
  type MainSectionType = 'MATIERE_PREMIERE' | 'ADDITIFS';
  const [activeSection, setActiveSection] = useState<MainSectionType>('MATIERE_PREMIERE');

  // Sous-onglets Matière Première (4 onglets selon le schéma officiel)
  type MpTabType = 'ETAT_ET_HISTORIQUE' | 'TRIAGE_EN_COURS' | 'COUT_ET_VALEUR' | 'SORTIES_PRODUCTION';
  const [activeMpTab, setActiveMpTab] = useState<MpTabType>('ETAT_ET_HISTORIQUE');

  // ─── Modals Matière Première ──────────────────────────────────────────────
  const [showMpEntreeModal, setShowMpEntreeModal] = useState(false);
  const [showMpSortieModal, setShowMpSortieModal] = useState(false);
  const [showTriModal, setShowTriModal] = useState<RawMaterialReceptionVoucher | null>(null);
  const [lastGeneratedSortie, setLastGeneratedSortie] = useState<MaterialExitRequest | null>(null);

  // ─── Formulaire ENTRÉE Matière Première (Fournisseur OU Collectée) ─────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const currentTimeStr = useMemo(() => new Date().toTimeString().slice(0, 5), []);

  const [mpEntreeMode, setMpEntreeMode] = useState<'FOURNISSEUR' | 'COLLECTEE'>('FOURNISSEUR');
  const [collecteType, setCollecteType] = useState<'GRATUITE' | 'PAYANTE'>('GRATUITE');

  const [mpEntreeForm, setMpEntreeForm] = useState({
    date: todayStr,
    heure: currentTimeStr,
    // Fournisseur ou Source
    fournisseurNom: 'SONACOS Dakar',
    fournisseurPrenom: 'Mamadou Ndiaye',
    fournisseurContact: '+221 77 654 32 10',
    fournisseurAdresse: 'Zone Industrielle Mbao, Km 18, Dakar',
    transporteur: 'Transports Ba & Frères',
    chauffeurNom: 'Alioune Badara Fall',
    chauffeurTel: '+221 70 889 45 12',
    chauffeurAdresse: 'Grand Yoff, Dakar',
    vehiculeImmatriculation: 'DK-4581-BB',
    vehiculeCouleur: 'Blanc / Bleu',
    numeroBonPesee: 'PONT-2026-1045',
    numeroFactureFournisseur: 'FAC-FOURN-781',
    // Collecte Interne par l'Usine
    agentCollecteNom: 'Moussa Diop',
    agentCollecteTel: '+221 77 623 88 90',
    siteEntrepriseCollectee: 'Imprimerie Tandian & Cie',
    siteCollecteAdresse: 'Km 24, Boulevard de la République, Rufisque',
    structureCollecte: 'Imprimerie Partenaire',
    numeroFicheCollecte: 'COL-2026-089',
    heureDepart: '08:00',
    heureRetour: '12:30',
    // Prise en charge transport / Flotte
    priseEnChargeTransport: true,
    coutTransportFCFA: 35000,
    vehiculeType: 'VEHICULE_LOCATION' as 'VEHICULE_USINE' | 'VEHICULE_LOCATION',
    loueurNom: 'Transport Ndiaye Frères',
    // Caractéristiques Matière & Pesée
    typePapierCarton: 'Balles OCC (Carton ondulé recyclé standard)',
    quantiteDeclareeKg: 2000,
    quantiteBruteReceptionneeKg: 2000,
    prixUnitaireKg: 250, // Standard fournisseur ou négocié
    uniteMesure: 'Kg',
    magasinierReception: 'Modou Faye (Magasinier Usine)',
    observations: 'Réception brute sur quai. Tri obligatoire avant admission en stock utile.',
    // Géolocalisation & Itinéraire GPS (CDC & Audio Client)
    latitude: '14.716700',
    longitude: '-17.467700',
    altitude: '24 m'
  });

  const [isCapturingGps, setIsCapturingGps] = useState(false);

  // Capture GPS avec calcul de l'altitude et localisation de l'itinéraire
  const handleCaptureGps = () => {
    if (!navigator.geolocation) {
      alert("La géolocalisation n'est pas supportée par votre navigateur.");
      return;
    }
    setIsCapturingGps(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude.toFixed(6);
        const lng = pos.coords.longitude.toFixed(6);
        // Altitude en mètres : calcul réel du capteur GPS ou estimation altimétrique Dakar
        const alt = pos.coords.altitude != null 
          ? `${Math.round(pos.coords.altitude)} m` 
          : `${Math.round(20 + Math.random() * 10)} m`;
        setMpEntreeForm(prev => ({
          ...prev,
          latitude: lat,
          longitude: lng,
          altitude: alt
        }));
        setIsCapturingGps(false);
      },
      (err) => {
        alert("Information GPS : " + err.message + ". Des coordonnées par défaut (Dakar) sont appliquées.");
        setIsCapturingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  // ─── Formulaire SORTIE Matière Première vers Production / Pulpeur ─────────
  const [mpSortieForm, setMpSortieForm] = useState({
    date: todayStr,
    heure: currentTimeStr,
    mpId: 'mp-occ-01',
    mpNom: 'Balles de Carton Récupéré (OCC)',
    quantiteKg: 400,
    demandeurNom: 'Amadou Bâ',
    demandeurPoste: 'Chef de Quart Production',
    destinationLigne: 'Ligne Shuliy 4 faces - Hydrapulpeur N°1',
    shift: 'MATIN_06H_14H' as ShiftType,
    magasinierNom: 'Modou Faye (Magasinier)',
    motifSortie: 'Alimentation continue hydrapulpeur - Quart de production'
  });

  // ─── Formulaire TRIAGE Matière Première ───────────────────────────────────
  const [triForm, setTriForm] = useState({
    quantiteConformeKg: 1900,
    quantiteRejeteeKg: 100,
    motifRejet: 'Cartons souillés d\'huile et morceaux plastifiés inexploitables',
    responsableTri: 'Cheikh Ndiaye (Chef Équipe Tri)',
    observations: 'Matière triée orientée directement vers zone stockage pulpeur'
  });

  // ─── Module Déroulant ADDITIFS CHIMIQUES ──────────────────────────────────
  const [selectedAdditifId, setSelectedAdditifId] = useState<string>('mp-amidon-cat-04');
  const [showAdditifEntreeModal, setShowAdditifEntreeModal] = useState(false);
  const [showAdditifSortieModal, setShowAdditifSortieModal] = useState(false);
  const [editingPriceAdditif, setEditingPriceAdditif] = useState<RawMaterialStock | null>(null);
  const [newPriceValue, setNewPriceValue] = useState<number>(650);
  const [motifPriceChange, setMotifPriceChange] = useState<string>('Ajustement coût officiel');

  // Formulaire Entrée Additif
  const [additifEntreeForm, setAdditifEntreeForm] = useState({
    date: todayStr,
    heure: currentTimeStr,
    fournisseurNom: 'Omnichem Industries Sénégal',
    fournisseurContact: '+221 33 820 45 60',
    paysProvenance: 'Sénégal / Import Europe',
    referenceFactureBL: 'BL-OMN-2026-088',
    quantite: 500, // kg ou L
    prixUnitaireFCFA: 650,
    fraisTransportFCFA: 25000,
    lotFabricant: 'LOT-AKD-2610-A',
    datePeremption: '2027-10-31',
    numeroCertificatAnalyse: 'COA-8849-OK',
    magasinierReception: 'Modou Faye (Magasinier)',
    observations: 'Sacs étanches de 25kg intacts, conformité visuelle validée'
  });

  // Formulaire Sortie Additif
  const [additifSortieForm, setAdditifSortieForm] = useState({
    date: todayStr,
    heure: currentTimeStr,
    demandeurNom: 'Amadou Bâ',
    demandeurPoste: 'Chef de Quart / Opérateur Dosage',
    quantite: 25,
    destination: 'Cuve d\'Homogénéisation Shuliy (Concentration 2.0% - 3.0%)',
    shift: 'MATIN_06H_14H' as ShiftType,
    magasinierNom: 'Modou Faye (Magasinier)',
    motifSortie: 'Dosage régulateur de pâte & résistance à l\'eau'
  });

  // ─── Calculs Matière Première & Stock Réel ────────────────────────────────
  const cartonExploitableStock = rawMaterials.find(m => m.categorie === 'PAPIER_CARTON') || rawMaterials[0];
  const stockActuelCartonKg = cartonExploitableStock ? cartonExploitableStock.stockActuel : 0;

  // Réceptions en attente de tri
  const receptionsEnAttenteTri = receptions.filter(r => r.statutTri === 'EN_ATTENTE_DE_TRI');
  const totalKgEnAttenteTri = receptionsEnAttenteTri.reduce((sum, r) => sum + r.quantiteBruteReceptionneeKg, 0);

  // Réceptions triées
  const receptionsTriees = receptions.filter(r => r.statutTri === 'TRI_EFFECTUE');
  const totalConformeTrieKg = receptionsTriees.reduce((sum, r) => sum + (r.quantiteExploitableKg || 0), 0);
  const totalRejetTrieKg = receptionsTriees.reduce((sum, r) => sum + (r.quantiteRejeteeKg || 0), 0);

  // Sorties vers pulpeur
  const sortiesPulpeurMovements = movements.filter(m => m.type === 'SORTIE_PULPEUR');
  const totalSortiesPulpeurKg = sortiesPulpeurMovements.reduce((sum, m) => sum + m.quantite, 0);

  // ─── Calculs de Valorisation & Coût du Stock (Conformité, Tri, Gratuit vs Payant)
  // 1. Matières Gratuites Collectées
  const collectesGratuitesTriees = receptionsTriees.filter(r => r.modeApprovisionnement === 'COLLECTE_USINE' && r.estGratuitDebarras);
  const kgConformeGratuit = collectesGratuitesTriees.reduce((s, r) => s + (r.quantiteExploitableKg || 0), 0);
  const depenseTransportGratuit = collectesGratuitesTriees.reduce((s, r) => s + (r.coutLocationFCFA || r.coutTransportPrisEnChargeFCFA || 0), 0);
  const coutRevientKgGratuit = kgConformeGratuit > 0 ? Number((depenseTransportGratuit / kgConformeGratuit).toFixed(1)) : 0;
  const valeurStockGratuit = kgConformeGratuit * coutRevientKgGratuit;

  // 2. Matières Payantes Collectées
  const collectesPayantesTriees = receptionsTriees.filter(r => r.modeApprovisionnement === 'COLLECTE_USINE' && !r.estGratuitDebarras);
  const kgConformePayantCollecte = collectesPayantesTriees.reduce((s, r) => s + (r.quantiteExploitableKg || 0), 0);
  const depenseAchatEtTransportCollectePayante = collectesPayantesTriees.reduce((s, r) => s + (r.coutTotalBrutFCFA || 0), 0);
  const coutRevientKgPayantCollecte = kgConformePayantCollecte > 0 ? Number((depenseAchatEtTransportCollectePayante / kgConformePayantCollecte).toFixed(1)) : 160;
  const valeurStockPayantCollecte = kgConformePayantCollecte * coutRevientKgPayantCollecte;

  // 3. Matières Fournisseurs Achetées
  const livraisonsFournisseursTriees = receptionsTriees.filter(r => r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON');
  const kgConformeFournisseur = livraisonsFournisseursTriees.reduce((s, r) => s + (r.quantiteExploitableKg || 0), 0);
  const depenseAchatEtTransportFournisseur = livraisonsFournisseursTriees.reduce((s, r) => {
    const achat = r.montantTotalFCFA || (r.quantiteBruteReceptionneeKg * (r.prixUnitaireKg || 250));
    const transport = r.coutTransportPrisEnChargeFCFA || 0;
    return s + achat + transport;
  }, 0);
  const coutRevientKgFournisseur = kgConformeFournisseur > 0 ? Number((depenseAchatEtTransportFournisseur / kgConformeFournisseur).toFixed(1)) : 250;
  const valeurStockFournisseur = kgConformeFournisseur * coutRevientKgFournisseur;

  // Total Stock Entrant Conforme Exploitable & Valeur Globale
  const totalKgConformeGlobal = kgConformeGratuit + kgConformePayantCollecte + kgConformeFournisseur;
  const valeurTotaleStockMatiereFCFA = valeurStockGratuit + valeurStockPayantCollecte + valeurStockFournisseur;
  const coutMoyenPondereKg = totalKgConformeGlobal > 0 ? Number((valeurTotaleStockMatiereFCFA / totalKgConformeGlobal).toFixed(1)) : 210;

  // Pertes Financières induites par les matières rejetées après tri
  const pertesFinancieresRebutsFCFA = receptionsTriees.reduce((s, r) => {
    const prixUnitaireEstime = r.prixUnitaireKg || 250;
    const kgRejet = r.quantiteRejeteeKg || 0;
    return s + (kgRejet * prixUnitaireEstime);
  }, 0);

  // ─── Calculs Additifs Chimiques ───────────────────────────────────────────
  const listeAdditifs = rawMaterials.filter(m => m.categorie !== 'PAPIER_CARTON');
  const currentAdditif = listeAdditifs.find(a => a.id === selectedAdditifId) || listeAdditifs[0];

  // Synthèse globale de tous les additifs
  const valeurGlobaleTousAdditifsFCFA = listeAdditifs.reduce((sum, a) => sum + (a.stockActuel * (a.coutMoyenAchatFCFA || 650)), 0);
  const totalKgLitresTousAdditifs = listeAdditifs.reduce((sum, a) => sum + a.stockActuel, 0);

  // ─── Actions Métier Matière Première ───────────────────────────────────────
  
  // 1. Enregistrement Entrée Matière
  const handleSaveMpEntree = async (e: React.FormEvent) => {
    e.preventDefault();
    const qteBrute = Number(mpEntreeForm.quantiteBruteReceptionneeKg);
    const prixKg = mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE' ? 0 : Number(mpEntreeForm.prixUnitaireKg);
    const transportFCFA = mpEntreeForm.priseEnChargeTransport ? Number(mpEntreeForm.coutTransportFCFA) : 0;
    const coutTotal = (qteBrute * prixKg) + transportFCFA;

    const todayStrClean = mpEntreeForm.date.replace(/-/g, '');
    const newId = `REC-${Date.now()}`;
    const bonNum = `BR-${todayStrClean}-${Math.floor(100 + Math.random() * 900)}`;

    const newVoucher: RawMaterialReceptionVoucher = {
      id: newId,
      numeroBon: bonNum,
      date: mpEntreeForm.date,
      heure: mpEntreeForm.heure,
      modeApprovisionnement: mpEntreeMode === 'FOURNISSEUR' ? 'FOURNISSEUR_LIVRAISON' : 'COLLECTE_USINE',
      
      // Données Fournisseur ou Collecte
      fournisseurNom: mpEntreeMode === 'FOURNISSEUR' ? mpEntreeForm.fournisseurNom : `Collecte : ${mpEntreeForm.siteEntrepriseCollectee || mpEntreeForm.structureCollecte}`,
      fournisseurPrenom: mpEntreeMode === 'FOURNISSEUR' ? mpEntreeForm.fournisseurPrenom : undefined,
      fournisseurContact: mpEntreeMode === 'FOURNISSEUR' ? mpEntreeForm.fournisseurContact : mpEntreeForm.agentCollecteTel,
      fournisseurAdresse: mpEntreeMode === 'FOURNISSEUR' ? mpEntreeForm.fournisseurAdresse : mpEntreeForm.siteCollecteAdresse,
      
      // Transport & Véhicule
      transporteur: mpEntreeForm.transporteur,
      chauffeurNom: mpEntreeForm.chauffeurNom,
      chauffeurTel: mpEntreeForm.chauffeurTel,
      chauffeurAdresse: mpEntreeForm.chauffeurAdresse,
      vehiculeImmatriculation: mpEntreeForm.vehiculeImmatriculation,
      vehiculeCouleur: mpEntreeForm.vehiculeCouleur,
      numeroBonPesee: mpEntreeForm.numeroBonPesee,
      numeroFactureFournisseur: mpEntreeForm.numeroFactureFournisseur,

      // Géolocalisation & Itinéraire GPS (CDC & Spécification Client)
      latitude: mpEntreeForm.latitude,
      longitude: mpEntreeForm.longitude,
      altitude: mpEntreeForm.altitude,
      coordonneesGPS: mpEntreeForm.latitude && mpEntreeForm.longitude ? {
        latitude: parseFloat(mpEntreeForm.latitude) || 14.7167,
        longitude: parseFloat(mpEntreeForm.longitude) || -17.4677,
        altitude: parseFloat(mpEntreeForm.altitude) || 24
      } : undefined,
      
      // Collecte Usine
      agentCollecteNom: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.agentCollecteNom : undefined,
      agentCollecteTel: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.agentCollecteTel : undefined,
      siteEntrepriseCollectee: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.siteEntrepriseCollectee : undefined,
      structureCollecte: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.structureCollecte : undefined,
      numeroFicheCollecte: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.numeroFicheCollecte : undefined,
      heureDepart: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.heureDepart : undefined,
      heureRetour: mpEntreeMode === 'COLLECTEE' ? mpEntreeForm.heureRetour : undefined,
      
      // Coûts de Transport / Location
      priseEnChargeTransport: mpEntreeForm.priseEnChargeTransport,
      coutTransportPrisEnChargeFCFA: transportFCFA,
      coutLocationFCFA: mpEntreeForm.vehiculeType === 'VEHICULE_LOCATION' ? transportFCFA : 0,
      vehiculeType: mpEntreeForm.vehiculeType,
      loueurNom: mpEntreeForm.loueurNom,
      
      // Caractéristiques Matière
      mpId: cartonExploitableStock?.id || 'mp-occ-01',
      mpNom: cartonExploitableStock?.nom || 'Carton Récupéré (OCC)',
      typePapierCarton: mpEntreeForm.typePapierCarton,
      estGratuitDebarras: mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE',
      prixUnitaireKg: prixKg,
      quantiteDeclareeKg: Number(mpEntreeForm.quantiteDeclareeKg),
      quantiteBruteReceptionneeKg: qteBrute,
      uniteMesure: mpEntreeForm.uniteMesure || 'Kg',
      coutTotalBrutFCFA: coutTotal,
      montantTotalFCFA: qteBrute * prixKg,
      
      // Triage en attente
      statutTri: 'EN_ATTENTE_DE_TRI',
      magasinierReception: mpEntreeForm.magasinierReception,
      observations: mpEntreeForm.observations
    };

    await db.rawMaterialReceptions.add(newVoucher);

    // Mouvement d'entrée brute en attente de tri
    await db.stockMovements.add({
      id: `mvt-rec-${Date.now()}`,
      date: mpEntreeForm.date,
      type: 'RECEPTION_BRUTE',
      articleType: 'MATIERE_PREMIERE',
      articleId: cartonExploitableStock?.id || 'mp-occ-01',
      articleNom: 'Matière Brute en Attente de Tri',
      quantite: qteBrute,
      unite: 'Kg',
      responsable: mpEntreeForm.magasinierReception,
      motif: `Entrée ${mpEntreeMode} (${bonNum}) - En attente de triage`
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: mpEntreeForm.magasinierReception,
      userRole: 'RESPONSABLE_STOCK',
      action: 'RECEPTION_MATIERE_PREMIERE',
      entite: 'STOCK',
      description: `Entrée brute ${bonNum} de ${qteBrute} kg (${mpEntreeMode} - ${mpEntreeMode === 'COLLECTEE' ? (collecteType === 'GRATUITE' ? 'Gratuit' : 'Payant') : 'Fournisseur'}).`
    });

    setShowMpEntreeModal(false);
  };

  // 2. Validation de la Phase de Triage (OBLIGATOIRE - NB Client)
  const handleValidateTri = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!showTriModal) return;

    const conformeKg = Number(triForm.quantiteConformeKg);
    const rejetKg = Number(triForm.quantiteRejeteeKg);
    const totalPesee = showTriModal.quantiteBruteReceptionneeKg;

    if (conformeKg + rejetKg !== totalPesee) {
      if (!window.confirm(`Attention : Conforme (${conformeKg} kg) + Rejet (${rejetKg} kg) = ${conformeKg + rejetKg} kg, ce qui diffère du brut pesé (${totalPesee} kg). Confirmer le tri ?`)) {
        return;
      }
    }

    const rendement = Number(((conformeKg / (totalPesee || 1)) * 100).toFixed(1));
    const coutTotal = showTriModal.coutTotalBrutFCFA || (totalPesee * showTriModal.prixUnitaireKg);
    const coutReelKg = conformeKg > 0 ? Number((coutTotal / conformeKg).toFixed(1)) : showTriModal.prixUnitaireKg;

    // Mise à jour du bon de réception
    await db.rawMaterialReceptions.update(showTriModal.id, {
      statutTri: 'TRI_EFFECTUE',
      dateTri: todayStr,
      responsableTri: triForm.responsableTri,
      quantiteExploitableKg: conformeKg,
      quantiteRejeteeKg: rejetKg,
      rendementTriPourcent: rendement,
      coutRevientReelKg: coutReelKg,
      motifRejet: triForm.motifRejet
    });

    // Alimentation du stock exploitable net de carton
    if (cartonExploitableStock && conformeKg > 0) {
      await db.rawMaterials.update(cartonExploitableStock.id, {
        stockActuel: cartonExploitableStock.stockActuel + conformeKg
      });

      await db.stockMovements.add({
        id: `mvt-tri-conf-${Date.now()}`,
        date: todayStr,
        type: 'TRI_CONFORME_EXPLOITABLE',
        articleType: 'MATIERE_PREMIERE',
        articleId: cartonExploitableStock.id,
        articleNom: cartonExploitableStock.nom,
        quantite: conformeKg,
        unite: 'Kg',
        responsable: triForm.responsableTri,
        motif: `Intégration stock exploitable après tri ${showTriModal.numeroBon} (Rendement: ${rendement}%)`
      });
    }

    // Matière rejetée isolée en quarantaine / déclassée
    if (rejetKg > 0) {
      await db.rejectedRawMaterials.add({
        id: `rej-${Date.now()}`,
        date: todayStr,
        mpReference: cartonExploitableStock?.reference || 'MP-OCC',
        mpNom: `Rebuts de tri ${showTriModal.numeroBon}`,
        quantiteKg: rejetKg,
        motifRejet: triForm.motifRejet,
        fournisseur: showTriModal.fournisseurNom,
        statut: 'EN_ATTENTE_DECISION',
        responsableTri: triForm.responsableTri,
        observations: `Écarté lors du tri de ${showTriModal.numeroBon}`
      });

      await db.stockMovements.add({
        id: `mvt-tri-rej-${Date.now()}`,
        date: todayStr,
        type: 'TRI_NON_CONFORME_REJET',
        articleType: 'MATIERE_PREMIERE',
        articleId: cartonExploitableStock?.id || 'mp-occ-01',
        articleNom: 'Rebuts et Matières Rejetées',
        quantite: rejetKg,
        unite: 'Kg',
        responsable: triForm.responsableTri,
        motif: `Déclassement tri ${showTriModal.numeroBon} : ${triForm.motifRejet}`
      });
    }

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: triForm.responsableTri,
      userRole: 'RESPONSABLE_STOCK',
      action: 'TRIAGE_MATIERE_PREMIERE',
      entite: 'STOCK',
      description: `Triage de ${showTriModal.numeroBon} validé : ${conformeKg} kg conformes intégrés au stock, ${rejetKg} kg rejetés.`
    });

    setShowTriModal(null);
  };

  // 3. Enregistrement Sortie Matière vers Pulpeur / Production
  const handleSaveMpSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    const qteKg = Number(mpSortieForm.quantiteKg);

    if (cartonExploitableStock && cartonExploitableStock.stockActuel < qteKg) {
      alert(`Stock insuffisant en magasin : ${cartonExploitableStock.stockActuel} kg disponibles.`);
      return;
    }

    const todayClean = mpSortieForm.date.replace(/-/g, '');
    const sortieNum = `DSM-${todayClean}-${Math.floor(100 + Math.random() * 900)}`;

    // Demande d'autorisation de sortie approuvée et exécutée
    const newRequest: MaterialExitRequest = {
      id: `dsm-${Date.now()}`,
      numeroDemande: sortieNum,
      date: mpSortieForm.date,
      heure: mpSortieForm.heure,
      mpId: cartonExploitableStock?.id || 'mp-occ-01',
      mpNom: cartonExploitableStock?.nom || 'Carton Récupéré (OCC)',
      quantiteKgDemandee: qteKg,
      shift: mpSortieForm.shift,
      ligneProduction: mpSortieForm.destinationLigne,
      demandeurNom: mpSortieForm.demandeurNom,
      motifBesoins: mpSortieForm.motifSortie,
      statut: 'APPROUVEE_DESTOCKEE',
      autorisePar: mpSortieForm.magasinierNom,
      dateAutorisation: mpSortieForm.date,
      numeroBonSortieGenere: sortieNum
    };

    await db.materialExitRequests.add(newRequest);

    // Décrémenter le stock exploitable
    if (cartonExploitableStock) {
      await db.rawMaterials.update(cartonExploitableStock.id, {
        stockActuel: Math.max(0, cartonExploitableStock.stockActuel - qteKg)
      });

      await db.stockMovements.add({
        id: `mvt-sort-mp-${Date.now()}`,
        date: mpSortieForm.date,
        type: 'SORTIE_PULPEUR',
        articleType: 'MATIERE_PREMIERE',
        articleId: cartonExploitableStock.id,
        articleNom: cartonExploitableStock.nom,
        quantite: qteKg,
        unite: 'Kg',
        responsable: mpSortieForm.magasinierNom,
        motif: `Sortie vers ${mpSortieForm.destinationLigne} demandée par ${mpSortieForm.demandeurNom} (${sortieNum})`
      });
    }

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: mpSortieForm.magasinierNom,
      userRole: 'RESPONSABLE_STOCK',
      action: 'SORTIE_MATIERE_PREMIERE',
      entite: 'STOCK',
      description: `Sortie validée ${sortieNum} : ${qteKg} kg livrés au pulpeur pour ${mpSortieForm.demandeurNom} (${mpSortieForm.shift}).`
    });

    // Génération automatique du Bon de Sortie officiel selon le schéma
    try {
      exportBonSortieProductionPdf({
        numeroDemande: newRequest.numeroDemande,
        date: newRequest.date,
        heure: newRequest.heure,
        mpNom: newRequest.mpNom,
        quantite: newRequest.quantiteKgDemandee,
        unite: 'Kg',
        shift: newRequest.shift,
        ligneProduction: newRequest.ligneProduction,
        demandeurNom: newRequest.demandeurNom,
        demandeurPoste: mpSortieForm.demandeurPoste,
        motifBesoins: newRequest.motifBesoins,
        autorisePar: newRequest.autorisePar,
        dateAutorisation: newRequest.dateAutorisation,
        statut: newRequest.statut
      });
    } catch (err) {
      console.warn("Export PDF bon de sortie :", err);
    }

    setShowMpSortieModal(false);
  };

  // ─── Actions Métier Additifs Chimiques ─────────────────────────────────────
  
  // 1. Entrée Achat Additif
  const handleSaveAdditifEntree = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdditif) return;

    const qte = Number(additifEntreeForm.quantite);
    const pu = Number(additifEntreeForm.prixUnitaireFCFA);
    const transport = Number(additifEntreeForm.fraisTransportFCFA);
    const coutTotal = (qte * pu) + transport;
    const puRenduCalcule = qte > 0 ? Math.round(coutTotal / qte) : pu;

    const mvtNum = `E-ADD-${Date.now().toString().slice(-6)}`;

    // Incrémenter le stock de l'additif
    await db.rawMaterials.update(currentAdditif.id, {
      stockActuel: currentAdditif.stockActuel + qte,
      coutMoyenAchatFCFA: puRenduCalcule
    });

    // Enregistrer le mouvement d'intrant
    await db.intrantMovements.add({
      id: `intrant-mvt-${Date.now()}`,
      numeroMouvement: mvtNum,
      date: additifEntreeForm.date,
      heure: additifEntreeForm.heure,
      type: 'ENTREE_ACHAT',
      intrantId: currentAdditif.id,
      intrantReference: currentAdditif.reference,
      intrantNom: currentAdditif.nom,
      intrantCategorie: currentAdditif.categorie,
      unite: currentAdditif.unite || currentAdditif.uniteMesure || 'Kg',
      quantite: qte,
      stockAvant: currentAdditif.stockActuel,
      stockApres: currentAdditif.stockActuel + qte,
      prixUnitaireFCFA: puRenduCalcule,
      fraisTransportFCFA: transport,
      coutTotalRenduFCFA: coutTotal,
      fournisseurNom: additifEntreeForm.fournisseurNom,
      paysProvenance: additifEntreeForm.paysProvenance,
      lotFabricant: additifEntreeForm.lotFabricant,
      datePeremption: additifEntreeForm.datePeremption,
      numeroCertificatAnalyse: additifEntreeForm.numeroCertificatAnalyse,
      receptionnaireMagasin: additifEntreeForm.magasinierReception,
      observations: additifEntreeForm.observations,
      enregistrePar: additifEntreeForm.magasinierReception,
      valide: true
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: additifEntreeForm.magasinierReception,
      userRole: 'RESPONSABLE_STOCK',
      action: 'ENTREE_ADDITIF_CHIMIQUE',
      entite: 'STOCK',
      description: `Entrée ${qte} ${currentAdditif.uniteMesure} de ${currentAdditif.nom} (Fournisseur: ${additifEntreeForm.fournisseurNom}).`
    });

    setShowAdditifEntreeModal(false);
  };

  // 2. Sortie Additif vers Production
  const handleSaveAdditifSortie = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentAdditif) return;

    const qte = Number(additifSortieForm.quantite);

    if (currentAdditif.stockActuel < qte) {
      alert(`Stock insuffisant : ${currentAdditif.stockActuel} ${currentAdditif.uniteMesure} disponibles.`);
      return;
    }

    const todayClean = additifSortieForm.date.replace(/-/g, '');
    const sortieNum = `DSM-ADD-${todayClean}-${Math.floor(100 + Math.random() * 900)}`;

    // Décrémenter le stock
    await db.rawMaterials.update(currentAdditif.id, {
      stockActuel: Math.max(0, currentAdditif.stockActuel - qte)
    });

    // Enregistrer la demande d'expression de besoin & bon de sortie officiel (Page 4 du schéma)
    const newAdditifRequest: MaterialExitRequest = {
      id: `dsm-add-${Date.now()}`,
      numeroDemande: sortieNum,
      date: additifSortieForm.date,
      heure: additifSortieForm.heure,
      mpId: currentAdditif.id,
      mpNom: currentAdditif.nom,
      quantiteKgDemandee: qte,
      shift: additifSortieForm.shift,
      ligneProduction: additifSortieForm.destination,
      demandeurNom: additifSortieForm.demandeurNom,
      motifBesoins: additifSortieForm.motifSortie,
      statut: 'APPROUVEE_DESTOCKEE',
      autorisePar: additifSortieForm.magasinierNom,
      dateAutorisation: additifSortieForm.date,
      numeroBonSortieGenere: sortieNum
    };
    await db.materialExitRequests.add(newAdditifRequest);

    // Enregistrer le mouvement d'intrant
    await db.intrantMovements.add({
      id: `intrant-mvt-${Date.now()}`,
      numeroMouvement: sortieNum,
      date: additifSortieForm.date,
      heure: additifSortieForm.heure,
      type: 'SORTIE_PRODUCTION',
      intrantId: currentAdditif.id,
      intrantReference: currentAdditif.reference,
      intrantNom: currentAdditif.nom,
      intrantCategorie: currentAdditif.categorie,
      unite: currentAdditif.unite || currentAdditif.uniteMesure || 'Kg',
      quantite: qte,
      stockAvant: currentAdditif.stockActuel,
      stockApres: Math.max(0, currentAdditif.stockActuel - qte),
      prixUnitaireFCFA: currentAdditif.coutMoyenAchatFCFA || 650,
      ligneProduction: additifSortieForm.destination,
      shiftConsommation: additifSortieForm.shift,
      observations: `Sortie demandée par ${additifSortieForm.demandeurNom} (${additifSortieForm.demandeurPoste}) : ${additifSortieForm.motifSortie}`,
      enregistrePar: additifSortieForm.magasinierNom,
      valide: true
    });

    await db.auditLogs.add({
      id: `audit-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: additifSortieForm.magasinierNom,
      userRole: 'RESPONSABLE_STOCK',
      action: 'SORTIE_ADDITIF_CHIMIQUE',
      entite: 'STOCK',
      description: `Sortie de ${qte} ${currentAdditif.uniteMesure} de ${currentAdditif.nom} pour ${additifSortieForm.destination} (${additifSortieForm.demandeurNom}).`
    });

    // Génération automatique du Bon de Sortie Additif officiel
    try {
      exportBonSortieProductionPdf({
        numeroDemande: newAdditifRequest.numeroDemande,
        date: newAdditifRequest.date,
        heure: newAdditifRequest.heure,
        mpNom: newAdditifRequest.mpNom,
        quantite: newAdditifRequest.quantiteKgDemandee,
        unite: currentAdditif.uniteMesure || 'Kg',
        shift: newAdditifRequest.shift,
        ligneProduction: newAdditifRequest.ligneProduction,
        demandeurNom: newAdditifRequest.demandeurNom,
        demandeurPoste: additifSortieForm.demandeurPoste,
        motifBesoins: newAdditifRequest.motifBesoins,
        autorisePar: newAdditifRequest.autorisePar,
        dateAutorisation: newAdditifRequest.dateAutorisation,
        statut: newAdditifRequest.statut
      }, '#d97706');
    } catch (err) {
      console.warn("Export PDF bon de sortie additif :", err);
    }

    setShowAdditifSortieModal(false);
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-16">

      {/* ── Sélecteur Haut de Gamme : Matière Première (Gauche) & Additifs (Droite) ── */}
      <div className="bg-white p-2.5 sm:p-3.5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3">
        {/* Navigation Desktop (>= sm) */}
        <div className="hidden sm:flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveSection('MATIERE_PREMIERE')}
            className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeSection === 'MATIERE_PREMIERE'
                ? 'bg-slate-900 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Boxes className="w-4 h-4 lg:w-5 lg:h-5 text-amber-400 shrink-0" />
            <span>1. Matière Première (Papiers & Cartons)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-amber-400 text-slate-950 font-black shrink-0">
              {stockActuelCartonKg.toLocaleString()} kg
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ADDITIFS')}
            className={`px-4 lg:px-5 py-2.5 lg:py-3 rounded-2xl font-black text-xs sm:text-sm flex items-center gap-2 transition-all ${
              activeSection === 'ADDITIFS'
                ? 'bg-indigo-600 text-white shadow-md'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            <Droplets className="w-4 h-4 lg:w-5 lg:h-5 text-sky-300 shrink-0" />
            <span>2. Matières Additifs (Amidon, AKD...)</span>
            <span className="px-2 py-0.5 rounded-full text-[10px] bg-sky-300 text-slate-950 font-black shrink-0">
              {listeAdditifs.length} additifs
            </span>
          </button>
        </div>

        {/* Navigation Mobile (< sm) : Segmented Control Compact et Élégant */}
        <div className="sm:hidden grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-2xl w-full">
          <button
            type="button"
            onClick={() => setActiveSection('MATIERE_PREMIERE')}
            className={`py-2 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'MATIERE_PREMIERE'
                ? 'bg-slate-900 text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Boxes className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <span className="truncate">Cartons</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0 ${
              activeSection === 'MATIERE_PREMIERE' ? 'bg-amber-400 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {(stockActuelCartonKg / 1000).toFixed(1)}t
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveSection('ADDITIFS')}
            className={`py-2 px-2 rounded-xl font-black text-xs flex items-center justify-center gap-1.5 transition-all ${
              activeSection === 'ADDITIFS'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-600'
            }`}
          >
            <Droplets className="w-3.5 h-3.5 text-sky-300 shrink-0" />
            <span className="truncate">Additifs</span>
            <span className={`px-1.5 py-0.2 rounded-full text-[9px] font-black shrink-0 ${
              activeSection === 'ADDITIFS' ? 'bg-sky-300 text-slate-950' : 'bg-slate-200 text-slate-700'
            }`}>
              {listeAdditifs.length}
            </span>
          </button>
        </div>

        {/* Boutons d'Action Rapide : Grid 2 colonnes sur mobile, flex sur desktop */}
        <div className="grid grid-cols-2 gap-2 w-full sm:w-auto sm:flex sm:items-center">
          {activeSection === 'MATIERE_PREMIERE' ? (
            <>
              <button
                type="button"
                onClick={() => setShowMpSortieModal(true)}
                className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 shrink-0" />
                <span className="truncate">Sortie Pulpeur</span>
              </button>
              <button
                type="button"
                onClick={() => setShowMpEntreeModal(true)}
                className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">+ Réception Quai</span>
              </button>
            </>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setShowAdditifSortieModal(true)}
                className="px-2.5 sm:px-3.5 py-2 sm:py-2.5 rounded-xl border border-amber-200 bg-amber-50 hover:bg-amber-100 text-amber-800 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-amber-600 shrink-0" />
                <span className="truncate">Sortie Dosage</span>
              </button>
              <button
                type="button"
                onClick={() => setShowAdditifEntreeModal(true)}
                className="px-2.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md transition-all active:scale-95"
              >
                <Plus className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
                <span className="truncate">+ Achat Additif</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 1 : MATIÈRE PREMIÈRE (PAPIERS & CARTONS RECYCLÉS)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'MATIERE_PREMIERE' && (
        <div className="space-y-6">

          {/* Cartouches Indicateurs Clés Matière Première */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            
            {/* Stock Exploitable Réel */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Stock Exploitable (Net après Tri)
                </span>
                <div className="text-2xl font-black text-emerald-700 mt-1">
                  {stockActuelCartonKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span>
                </div>
                <span className="text-[11px] text-slate-500 font-medium block mt-0.5">
                  ≈ {(stockActuelCartonKg / 388.5).toFixed(1)} jours de couverture usine
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-emerald-50 text-emerald-600">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </div>

            {/* En attente de Triage */}
            <div className={`p-5 rounded-3xl border shadow-sm flex items-center justify-between transition-all ${
              receptionsEnAttenteTri.length > 0 ? 'bg-amber-50/70 border-amber-200' : 'bg-white border-slate-200'
            }`}>
              <div>
                <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider block">
                  En Attente de Triage
                </span>
                <div className="text-2xl font-black text-amber-900 mt-1">
                  {totalKgEnAttenteTri.toLocaleString()} <span className="text-xs font-bold text-amber-700">kg</span>
                </div>
                <span className="text-[11px] text-amber-700 font-bold block mt-0.5">
                  {receptionsEnAttenteTri.length} réception(s) à trier obligatoirement
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-amber-100 text-amber-800">
                <Scissors className="w-6 h-6" />
              </div>
            </div>

            {/* Sorties vers Pulpeur */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Sorties vers Pulpeur (Cumul)
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  {totalSortiesPulpeurKg.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg</span>
                </div>
                <span className="text-[11px] text-indigo-600 font-bold block mt-0.5">
                  Ligne de moulage Shuliy
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-indigo-50 text-indigo-600">
                <ArrowRight className="w-6 h-6" />
              </div>
            </div>

            {/* Coût Moyen Pondéré Réel */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex items-center justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Coût Moyen Pondéré (PMP)
                </span>
                <div className="text-2xl font-black text-slate-900 mt-1">
                  ~{coutMoyenPondereKg} <span className="text-xs font-bold text-slate-500">FCFA / kg</span>
                </div>
                <span className="text-[11px] text-emerald-700 font-bold block mt-0.5">
                  Valeur stock : {valeurTotaleStockMatiereFCFA.toLocaleString()} FCFA
                </span>
              </div>
              <div className="p-3 rounded-2xl bg-slate-100 text-slate-700">
                <DollarSign className="w-6 h-6" />
              </div>
            </div>

          </div>

          {/* ── WORKFLOW INDUSTRIEL : LES 3 ÉTAPES CLÉS DE LA MATIÈRE PREMIÈRE ── */}
          <div className="bg-white p-4 rounded-3xl border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-[11px] font-black uppercase tracking-wider text-slate-400">
                Cycle Opérationnel Usine BS Alvéoles : De la Réception Quai au Pulpeur
              </span>
              <span className="text-xs font-bold text-slate-600">
                Norme Qualité : Humidité &lt; 14% • Tri physique obligatoire
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Étape 1 */}
              <div 
                onClick={() => { setActiveMpTab('ETAT_ET_HISTORIQUE'); setShowMpEntreeModal(true); }}
                className="p-3.5 rounded-2xl border-2 border-blue-200 bg-blue-50/50 hover:bg-blue-50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    1
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 group-hover:text-blue-700">
                      Réception & Pesée Quai
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      Fournisseur ou Collecte usine • Pesée pont-bascule
                    </span>
                  </div>
                </div>
                <Plus className="w-4 h-4 text-blue-600 group-hover:scale-125 transition-transform" />
              </div>

              {/* Étape 2 : Triage Obligatoire */}
              <div 
                onClick={() => setActiveMpTab('TRIAGE_EN_COURS')}
                className={`p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between group ${
                  receptionsEnAttenteTri.length > 0 
                    ? 'border-amber-400 bg-amber-50 hover:bg-amber-100/80 shadow-sm animate-pulse'
                    : 'border-slate-200 bg-slate-50 hover:bg-slate-100'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-8 h-8 rounded-xl font-black text-xs flex items-center justify-center shadow-sm ${
                    receptionsEnAttenteTri.length > 0 ? 'bg-amber-500 text-slate-950' : 'bg-slate-300 text-slate-700'
                  }`}>
                    2
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 group-hover:text-amber-800">
                      Triage Physique Obligatoire
                    </span>
                    <span className="text-[10px] text-amber-800 font-bold">
                      {receptionsEnAttenteTri.length > 0 
                        ? `${receptionsEnAttenteTri.length} lot(s) (${totalKgEnAttenteTri.toLocaleString()} kg) à trier`
                        : 'Tous les lots sont triés et validés'
                      }
                    </span>
                  </div>
                </div>
                <Scissors className={`w-4 h-4 ${receptionsEnAttenteTri.length > 0 ? 'text-amber-700' : 'text-slate-400'}`} />
              </div>

              {/* Étape 3 : Stock Net Exploitable vers Pulpeur */}
              <div 
                onClick={() => { setActiveMpTab('ETAT_ET_HISTORIQUE'); setShowMpSortieModal(true); }}
                className="p-3.5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/50 hover:bg-emerald-50 cursor-pointer transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    3
                  </div>
                  <div>
                    <span className="block text-xs font-black text-slate-900 group-hover:text-emerald-700">
                      Stock Net & Alimentation Pulpeur
                    </span>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {stockActuelCartonKg.toLocaleString()} kg exploitables pour ligne Shuliy
                    </span>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </div>

          {/* Bandeau d'Alerte Triage si des lots attendent */}
          {receptionsEnAttenteTri.length > 0 && activeMpTab !== 'TRIAGE_EN_COURS' && (
            <div className="p-4 rounded-3xl bg-amber-50 border-2 border-amber-300 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-amber-200 text-amber-900 shrink-0">
                  <AlertOctagon className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-black text-amber-950 uppercase tracking-wider">
                    {receptionsEnAttenteTri.length} Réception(s) en Attente de Triage ({totalKgEnAttenteTri.toLocaleString()} kg bruts)
                  </h4>
                  <p className="text-xs text-amber-800 mt-0.5">
                    La matière brute ne rejoint le stock utile qu'une fois triée. Accédez à l'espace de tri pour séparer le carton conforme des rebuts inexploitables.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveMpTab('TRIAGE_EN_COURS')}
                className="px-4 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shrink-0 shadow-md flex items-center gap-1.5"
              >
                <Scissors className="w-4 h-4" />
                Ouvrir l'Espace Triage ({receptionsEnAttenteTri.length}) →
              </button>
            </div>
          )}

          {/* ── SOUS-ONGLETS MATIÈRE PREMIÈRE (3 ONGLETS EXPLICITES & ÉPURÉS) ── */}
          {/* ── SOUS-ONGLETS MATIÈRE PREMIÈRE (3 ONGLETS EXPLICITES & ÉPURÉS) ── */}
          <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto no-scrollbar w-full">
            <button
              type="button"
              onClick={() => setActiveMpTab('ETAT_ET_HISTORIQUE')}
              className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMpTab === 'ETAT_ET_HISTORIQUE'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <History className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Tableau 1 : Flux Global & Mouvements (Entrées / Sorties)</span>
              <span className="sm:hidden">T1 : Flux Global</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMpTab('TRIAGE_EN_COURS')}
              className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMpTab === 'TRIAGE_EN_COURS'
                  ? 'bg-amber-500 text-slate-950 shadow-md'
                  : receptionsEnAttenteTri.length > 0 
                    ? 'bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200' 
                    : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <Scissors className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Tableau 2 : Phase de Triage Obligatoire</span>
              <span className="sm:hidden">T2 : Triage</span>
              {receptionsEnAttenteTri.length > 0 && (
                <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-red-600 text-white font-black animate-pulse shrink-0">
                  {receptionsEnAttenteTri.length} à trier
                </span>
              )}
            </button>

            <button
              type="button"
              onClick={() => setActiveMpTab('COUT_ET_VALEUR')}
              className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMpTab === 'COUT_ET_VALEUR'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <DollarSign className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
              <span className="hidden sm:inline">Tableau 3 : Coût & Valeur du Stock (Formule Schéma)</span>
              <span className="sm:hidden">T3 : Coût & PMP</span>
            </button>

            <button
              type="button"
              onClick={() => setActiveMpTab('SORTIES_PRODUCTION')}
              className={`px-3.5 py-2 sm:py-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 whitespace-nowrap shrink-0 ${
                activeMpTab === 'SORTIES_PRODUCTION'
                  ? 'bg-red-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              <FileText className="w-3.5 h-3.5 shrink-0" />
              <span className="hidden sm:inline">Tableau 4 : Expression de Besoin & Bons de Sortie ({materialExitRequests.length})</span>
              <span className="sm:hidden">T4 : Sorties Prod ({materialExitRequests.length})</span>
            </button>
          </div>

          {/* ──────────────────────────────────────────────────────────────────
              TABLEAU 1 : ÉTAT DE STOCK & HISTORIQUE DES MOUVEMENTS (ENTRÉES & SORTIES)
              ────────────────────────────────────────────────────────────────── */}
          {activeMpTab === 'ETAT_ET_HISTORIQUE' && (
            <div className="space-y-4">
              
              {/* Journal Exhaustif des Mouvements (Entrées et Sorties) */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h3 className="text-base font-black text-slate-900">
                      Historique des Mouvements de Matière Première (Entrées & Sorties)
                    </h3>
                    <p className="text-xs text-slate-500">
                      Traçabilité intégrale : Entrées brutes, validation de triage et sorties pulpeur
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1.5 rounded-xl">
                      {movements.length} mouvements enregistrés
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Date & Réf</th>
                        <th className="py-3 px-4">Type de Mouvement</th>
                        <th className="py-3 px-4">Provenance / Destination</th>
                        <th className="py-3 px-4 text-center">Quantité (kg)</th>
                        <th className="py-3 px-4">Intervenant / Demandeur</th>
                        <th className="py-3 px-4">Motif & Observations</th>
                        <th className="py-3 px-5 text-center">Statut</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {movements.map(m => {
                        const isEntree = m.type.includes('ENTREE') || m.type.includes('RECEPTION') || m.type.includes('CONFORME');
                        const isSortie = m.type.includes('SORTIE');
                        return (
                          <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5">
                              <span className="font-bold text-slate-900 font-mono text-[11px]">{m.id.slice(0, 15)}</span>
                              <div className="text-[10px] text-slate-400">{m.date}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                                m.type === 'SORTIE_PULPEUR' ? 'bg-red-100 text-red-800' :
                                m.type === 'TRI_CONFORME_EXPLOITABLE' ? 'bg-emerald-100 text-emerald-800' :
                                m.type === 'TRI_NON_CONFORME_REJET' ? 'bg-rose-100 text-rose-800' :
                                'bg-blue-100 text-blue-800'
                              }`}>
                                {isSortie ? <ArrowUpRight className="w-3 h-3 text-red-600" /> : <ArrowDownRight className="w-3 h-3 text-emerald-600" />}
                                {m.type === 'SORTIE_PULPEUR' ? 'Sortie Pulpeur' :
                                 m.type === 'TRI_CONFORME_EXPLOITABLE' ? 'Tri Conforme (Entrée Stock)' :
                                 m.type === 'TRI_NON_CONFORME_REJET' ? 'Rebut Tri Déclassé' :
                                 'Entrée Brute Réception'}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 font-bold text-slate-800">
                              {m.articleNom}
                            </td>
                            <td className="py-3.5 px-4 text-center font-black text-sm">
                              <span className={isSortie ? 'text-red-600' : 'text-emerald-700'}>
                                {isSortie ? `-${m.quantite.toLocaleString()} kg` : `+${m.quantite.toLocaleString()} kg`}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-slate-700">
                              {m.responsable}
                            </td>
                            <td className="py-3.5 px-4 text-slate-500 max-w-[240px] truncate">
                              {m.motif}
                            </td>
                            <td className="py-3.5 px-5 text-center">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                                Validé
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

          {/* ──────────────────────────────────────────────────────────────────
              TABLEAU 2 : PHASE DE TRIAGE OBLIGATOIRE (SÉPARATION NET EXPLOITABLE VS REBUTS)
              ────────────────────────────────────────────────────────────────── */}
          {activeMpTab === 'TRIAGE_EN_COURS' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Bannière Pédagogique Qualité */}
              <div className="bg-gradient-to-r from-amber-600 via-amber-700 to-slate-900 rounded-3xl p-6 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-400 text-slate-950 text-xs font-black shadow-sm">
                    <Scissors className="w-3.5 h-3.5" />
                    DIRECTIVE QUALITÉ USINE STRICTE
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Phase de Triage Obligatoire des Matières Premières
                  </h3>
                  <p className="text-xs text-amber-100 max-w-2xl leading-relaxed">
                    Toute livraison ou collecte déchargée sur quai doit impérativement faire l'objet d'un triage physique sur table avant admission au pulpeur. La matière conforme intègre le stock exploitable net, tandis que les matières souillées (plastiques, métaux, humidité &gt; 14%) sont isolées en rebuts.
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/20 text-center shrink-0 min-w-[180px]">
                  <span className="text-[11px] text-amber-200 uppercase tracking-wider block font-bold">Lots en attente</span>
                  <div className="text-3xl font-black text-amber-300 mt-1">{receptionsEnAttenteTri.length}</div>
                  <span className="text-[11px] text-white/90 font-bold">{totalKgEnAttenteTri.toLocaleString()} kg bruts</span>
                </div>
              </div>

              {/* 1. SECTION DES LOTS EN ATTENTE DE TRIAGE */}
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-sm font-black text-slate-900 flex items-center gap-2">
                      <span className="w-3 h-3 rounded-full bg-amber-500 animate-ping"></span>
                      Lots Bruts Réceptionnés en Attente de Tri ({receptionsEnAttenteTri.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Cliquer sur "Effectuer le Triage Physique" pour enregistrer la pesée nette conforme et isoler les rebuts.
                    </p>
                  </div>
                  <button
                    onClick={() => setShowMpEntreeModal(true)}
                    className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-sm self-start sm:self-auto"
                  >
                    <Plus className="w-4 h-4" />
                    + Nouvelle Réception Quai
                  </button>
                </div>

                {receptionsEnAttenteTri.length === 0 ? (
                  <div className="p-8 rounded-3xl bg-white border-2 border-dashed border-emerald-200 text-center space-y-2">
                    <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto" />
                    <h5 className="text-sm font-black text-slate-900">Tous les lots réceptionnés ont été triés !</h5>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Toutes les matières premières ont été validées et sont intégrées au stock net exploitable ({stockActuelCartonKg.toLocaleString()} kg prêts pour le pulpeur).
                    </p>
                    <button
                      onClick={() => setShowMpEntreeModal(true)}
                      className="mt-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Plus className="w-4 h-4" />
                      Enregistrer une Nouvelle Réception Brute
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {receptionsEnAttenteTri.map(r => (
                      <div key={r.id} className="p-5 rounded-3xl bg-white border-2 border-amber-200 hover:border-amber-400 shadow-sm transition-all space-y-3.5">
                        {/* En-tête du lot */}
                        <div className="flex items-start justify-between pb-2 border-b border-slate-100">
                          <div>
                            <span className="font-mono font-black text-sm text-slate-900">{r.numeroBon}</span>
                            <div className="text-[11px] text-slate-400">{r.date} à {r.heure}</div>
                          </div>
                          <span className={`px-2.5 py-1 rounded-full text-[10px] font-black ${
                            r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' 
                              ? 'bg-blue-100 text-blue-800' 
                              : (r.estGratuitDebarras ? 'bg-emerald-100 text-emerald-800' : 'bg-purple-100 text-purple-800')
                          }`}>
                            {r.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' ? '🚚 Fournisseur' : (r.estGratuitDebarras ? '🎁 Collecte Gratuite' : '💵 Collecte Payante')}
                          </span>
                        </div>

                        {/* Origine et Localisation */}
                        <div className="grid grid-cols-2 gap-2 text-xs">
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">SOURCE / FOURNISSEUR :</span>
                            <strong className="text-slate-900 text-xs block truncate">{r.fournisseurNom}</strong>
                            {r.fournisseurAdresse && (
                              <span className="text-[10px] text-slate-500 flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3 text-red-500 shrink-0" />
                                <span className="truncate">{r.fournisseurAdresse}</span>
                              </span>
                            )}
                            {(r.latitude && r.longitude) && (
                              <a
                                href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline mt-1"
                                title="Localiser l'itinéraire sur Google Maps"
                              >
                                <Compass className="w-3 h-3 text-blue-600 shrink-0" />
                                <span>GPS: {r.latitude.slice(0, 7)}, {r.longitude.slice(0, 7)}</span>
                                {r.altitude && <span className="text-slate-500 font-medium">({r.altitude})</span>}
                                <ExternalLink className="w-2.5 h-2.5 opacity-70 shrink-0" />
                              </a>
                            )}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-bold block">PESÉE BRUTE QUAI :</span>
                            <strong className="text-amber-800 font-black text-base">{r.quantiteBruteReceptionneeKg.toLocaleString()} kg</strong>
                            <span className="text-[10px] text-slate-500 block truncate">{r.typePapierCarton}</span>
                          </div>
                        </div>

                        {/* Transport et Véhicule */}
                        <div className="p-3 rounded-2xl bg-slate-50 border border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Chauffeur :</span>
                            <span className="font-bold text-slate-800">{r.chauffeurNom || 'Non renseigné'}</span>
                            {r.chauffeurTel && <span className="text-slate-500 block text-[10px]">{r.chauffeurTel}</span>}
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 font-medium block">Matricule Véhicule :</span>
                            <span className="font-mono font-bold text-slate-900">{r.vehiculeImmatriculation || 'Non renseigné'}</span>
                            {r.numeroBonPesee && <span className="text-slate-500 block text-[10px]">Pesée : {r.numeroBonPesee}</span>}
                          </div>
                        </div>

                        {/* Action de triage */}
                        <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                          <div className="text-xs">
                            <span className="text-[10px] text-slate-400 block">Coût engagé :</span>
                            <strong className="text-slate-900 font-black">
                              {r.coutTotalBrutFCFA ? `${r.coutTotalBrutFCFA.toLocaleString()} FCFA` : (r.estGratuitDebarras ? '0 FCFA (Gratuit)' : `${(r.quantiteBruteReceptionneeKg * (r.prixUnitaireKg || 250)).toLocaleString()} FCFA`)}
                            </strong>
                          </div>
                          <button
                            onClick={() => {
                              setTriForm({
                                quantiteConformeKg: Math.round(r.quantiteBruteReceptionneeKg * 0.95),
                                quantiteRejeteeKg: Math.round(r.quantiteBruteReceptionneeKg * 0.05),
                                motifRejet: 'Cartons souillés, plastiques et humidité excessive',
                                responsableTri: 'Chef Équipe Tri Usine',
                                observations: `Triage du lot ${r.numeroBon}`
                              });
                              setShowTriModal(r);
                            }}
                            className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md flex items-center gap-2 transition-all active:scale-95"
                          >
                            <Scissors className="w-4 h-4" />
                            Effectuer le Triage Physique →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* 2. HISTORIQUE DES LOTS DÉJÀ TRIÉS AVEC RENDEMENT */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Historique des Réceptions Triées & Taux de Conformité ({receptionsTriees.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Suivi rigoureux du rendement de tri (Matière admissible pulpeur vs Rebuts rejetés)
                    </p>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                    Total Conforme : {totalConformeTrieKg.toLocaleString()} kg
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Réf Bon & Date</th>
                        <th className="py-3 px-4">Fournisseur / Origine</th>
                        <th className="py-3 px-4 text-center">Brut Pesé</th>
                        <th className="py-3 px-4 text-center">Conforme Admis</th>
                        <th className="py-3 px-4 text-center">Rebuts Écartés</th>
                        <th className="py-3 px-4 text-center">Rendement Tri (%)</th>
                        <th className="py-3 px-4 text-right">Coût Net Réel / kg</th>
                        <th className="py-3 px-4">Motif Rejet & Responsable</th>
                        <th className="py-3 px-5 text-center">Statut Tri</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {receptionsTriees.length === 0 ? (
                        <tr>
                          <td colSpan={9} className="py-8 text-center text-slate-400">
                            Aucun lot trié pour le moment dans l'historique.
                          </td>
                        </tr>
                      ) : (
                        receptionsTriees.map(r => {
                          const rendement = r.rendementTriPourcent || 
                            (r.quantiteBruteReceptionneeKg > 0 ? Number((((r.quantiteExploitableKg || 0) / r.quantiteBruteReceptionneeKg) * 100).toFixed(1)) : 100);
                          return (
                            <tr key={r.id} className="hover:bg-slate-50/80 transition-colors">
                              <td className="py-3.5 px-5">
                                <span className="font-bold text-slate-900 font-mono">{r.numeroBon}</span>
                                <div className="text-[10px] text-slate-400">Trié le {r.dateTri || r.date}</div>
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="font-bold text-slate-800">{r.fournisseurNom}</div>
                                {r.fournisseurAdresse && (
                                  <div className="text-[10px] text-slate-400 truncate max-w-xs">{r.fournisseurAdresse}</div>
                                )}
                                {(r.latitude && r.longitude) && (
                                  <a
                                    href={`https://www.google.com/maps?q=${r.latitude},${r.longitude}`}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex items-center gap-1 text-[10px] text-blue-600 font-bold hover:underline"
                                    title="Ouvrir l'itinéraire Google Maps"
                                  >
                                    <MapPin className="w-2.5 h-2.5 text-red-500 shrink-0" />
                                    <span>Maps ({r.altitude || 'GPS'})</span>
                                  </a>
                                )}
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-slate-900">
                                {r.quantiteBruteReceptionneeKg.toLocaleString()} kg
                              </td>
                              <td className="py-3.5 px-4 text-center font-black text-emerald-700 bg-emerald-50/50">
                                +{(r.quantiteExploitableKg || 0).toLocaleString()} kg
                              </td>
                              <td className="py-3.5 px-4 text-center font-bold text-rose-700 bg-rose-50/50">
                                -{(r.quantiteRejeteeKg || 0).toLocaleString()} kg
                              </td>
                              <td className="py-3.5 px-4 text-center">
                                <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                                  rendement >= 92 ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                                }`}>
                                  {rendement}%
                                </span>
                              </td>
                              <td className="py-3.5 px-4 text-right font-black text-slate-900">
                                ~{r.coutRevientReelKg || r.prixUnitaireKg || 250} FCFA
                              </td>
                              <td className="py-3.5 px-4">
                                <div className="text-[11px] text-slate-700 truncate max-w-xs">
                                  {r.motifRejet || 'Rebuts standards (ficelles, poussières)'}
                                </div>
                                <div className="text-[10px] text-slate-400">{r.responsableTri || 'Chef Tri'}</div>
                              </td>
                              <td className="py-3.5 px-5 text-center">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                  <Check className="w-3 h-3" /> Validé Net
                                </span>
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

          {/* ──────────────────────────────────────────────────────────────────
              TABLEAU 3 : COÛT & VALEUR DU STOCK (CONFORMITÉ, TRIAGE, GRATUIT VS PAYANT)
              ────────────────────────────────────────────────────────────────── */}
          {activeMpTab === 'COUT_ET_VALEUR' && (
            <div className="space-y-6">

              {/* Synthèse Méthodologique de Valorisation (Conformité & Tri) */}
              <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-3xl text-white shadow-xl space-y-4">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-emerald-500 text-slate-950 font-black">
                    <DollarSign className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black tracking-tight">
                      Valorisation Financière du Stock & Coût Réel Après Triage
                    </h3>
                    <p className="text-xs text-slate-300">
                      Règle de gestion : Le coût de revient réel prend en compte la gratuité ou le prix d'achat, les frais de transport pris en charge et le rendement du tri.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/80">
                    <span className="text-[10px] text-amber-400 font-bold uppercase tracking-wider block">
                      1. Matière Collectée Gratuite
                    </span>
                    <div className="text-xl font-black text-white mt-1">
                      ~{coutRevientKgGratuit} FCFA <span className="text-xs font-normal text-slate-400">/ kg</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      Achat = 0 FCFA. Coût = Transport usine/location ÷ Quantité conforme triée.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/80">
                    <span className="text-[10px] text-purple-400 font-bold uppercase tracking-wider block">
                      2. Matière Collectée Payante
                    </span>
                    <div className="text-xl font-black text-white mt-1">
                      ~{coutRevientKgPayantCollecte} FCFA <span className="text-xs font-normal text-slate-400">/ kg</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      (Prix négocié + Transport pris en charge) ÷ Quantité conforme triée.
                    </p>
                  </div>

                  <div className="p-4 rounded-2xl bg-slate-950/70 border border-slate-700/80">
                    <span className="text-[10px] text-sky-400 font-bold uppercase tracking-wider block">
                      3. Matière Fournisseurs Achetée
                    </span>
                    <div className="text-xl font-black text-white mt-1">
                      ~{coutRevientKgFournisseur} FCFA <span className="text-xs font-normal text-slate-400">/ kg</span>
                    </div>
                    <p className="text-[11px] text-slate-300 mt-1">
                      (Prix d'achat standard 250 F + Transport) ÷ Quantité conforme triée.
                    </p>
                  </div>
                </div>
              </div>

              {/* ENCADRÉ OFFICIEL DU SCHÉMA : DÉTERMINATION DE LA VALEUR DU STOCK ENTRANT */}
              <div className="bg-gradient-to-br from-indigo-950 via-slate-900 to-blue-950 p-6 rounded-3xl text-white shadow-xl border border-indigo-500/30 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-2xl bg-indigo-500 text-white font-black">
                      <Scale className="w-6 h-6" />
                    </div>
                    <div>
                      <span className="text-[10px] text-amber-300 font-black uppercase tracking-wider block">
                        Règle Fondamentale de Valorisation (Pages 1 & 3 du Schéma Directeur)
                      </span>
                      <h4 className="text-base sm:text-lg font-black text-white">
                        Détermination de la Valeur du Stock Entrant (PMP Unifié)
                      </h4>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-indigo-500/20 text-indigo-300 border border-indigo-400/30">
                    Formule Comptable & Industrielle
                  </span>
                </div>

                {/* Formule littérale exacte du schéma */}
                <div className="p-4 rounded-2xl bg-slate-950/80 border border-indigo-500/30 text-center space-y-2">
                  <div className="text-xs font-mono font-bold text-amber-300 uppercase tracking-wider">
                    Formule mathématique officielle du schéma :
                  </div>
                  <div className="inline-block max-w-full overflow-x-auto text-center py-1">
                    <div className="font-mono text-xs sm:text-sm font-black text-emerald-300 border-b-2 border-indigo-400/80 pb-1.5 px-4">
                      (Stock acquis conformes × Coût de revient Kg acquis) + (Stock collecté conformes × Coût de revient Kg collecté)
                    </div>
                    <div className="font-mono text-xs sm:text-sm font-bold text-slate-300 pt-1.5 px-4">
                      (Stock acquis de matière conforme + Stock collecté de matière conforme)
                    </div>
                  </div>
                </div>

                {/* Application numérique en temps réel */}
                <div className="p-4 rounded-2xl bg-indigo-950/50 border border-indigo-800/40 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Application numérique live avec les stocks actuels :
                    </span>
                    <div className="font-mono text-slate-200 text-xs sm:text-sm mt-1">
                      = [({kgConformeFournisseur.toLocaleString()} kg × {coutRevientKgFournisseur} F) + ({(kgConformeGratuit + kgConformePayantCollecte).toLocaleString()} kg × {kgConformeGratuit + kgConformePayantCollecte > 0 ? Math.round((valeurStockGratuit + valeurStockPayantCollecte) / (kgConformeGratuit + kgConformePayantCollecte)) : 0} F)] ÷ {totalKgConformeGlobal.toLocaleString()} kg
                    </div>
                  </div>
                  <div className="text-left md:text-right shrink-0">
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wider block">
                      Coût Moyen Pondéré Résultant
                    </span>
                    <strong className="text-2xl font-black text-emerald-400">
                      ~{coutMoyenPondereKg} FCFA <span className="text-xs font-normal text-slate-400">/ kg</span>
                    </strong>
                  </div>
                </div>
              </div>

              {/* Tableau de Valorisation Détaillé par Canal d'Approvisionnement */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100">
                  <h3 className="text-base font-black text-slate-900">
                    Ventilation de la Valeur du Stock Conforme vs Pertes sur Rebuts
                  </h3>
                  <p className="text-xs text-slate-500">
                    Calcul rigoureux de la valeur financière immobilisée dans le stock disponible
                  </p>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Canal d'Approvisionnement</th>
                        <th className="py-3 px-4 text-center">Quantité Conforme Triée</th>
                        <th className="py-3 px-4 text-center">Rendement Tri Moyen</th>
                        <th className="py-3 px-4 text-right">Dépense Achat & Transport</th>
                        <th className="py-3 px-4 text-right">Coût de Revient au kg</th>
                        <th className="py-3 px-5 text-right">Valeur du Stock Conforme</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      
                      {/* Ligne 1 : Collectes Gratuites */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                            Matières Collectées Gratuites (Débarras)
                          </span>
                          <span className="text-[10px] text-slate-400">Coût matière = 0 FCFA • Transport seul pris en compte</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-emerald-700 text-sm">
                          {kgConformeGratuit.toLocaleString()} kg
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          92.5%
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          {depenseTransportGratuit.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700">
                          ~{coutRevientKgGratuit} FCFA / kg
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-slate-900 text-sm">
                          {valeurStockGratuit.toLocaleString()} FCFA
                        </td>
                      </tr>

                      {/* Ligne 2 : Collectes Payantes */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-purple-500"></span>
                            Matières Collectées Payantes (Structures & Imprimeries)
                          </span>
                          <span className="text-[10px] text-slate-400">Prix unitaire négocié + frais de transport / location</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-purple-700 text-sm">
                          {kgConformePayantCollecte.toLocaleString()} kg
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          94.2%
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          {depenseAchatEtTransportCollectePayante.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-purple-700">
                          ~{coutRevientKgPayantCollecte} FCFA / kg
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-slate-900 text-sm">
                          {valeurStockPayantCollecte.toLocaleString()} FCFA
                        </td>
                      </tr>

                      {/* Ligne 3 : Livraisons Fournisseurs */}
                      <tr className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-bold text-slate-900 flex items-center gap-2">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500"></span>
                            Livraisons Fournisseurs Achetées
                          </span>
                          <span className="text-[10px] text-slate-400">Tarif standard 250 F/kg + transport pris en charge</span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-blue-700 text-sm">
                          {kgConformeFournisseur.toLocaleString()} kg
                        </td>
                        <td className="py-3.5 px-4 text-center font-bold text-slate-700">
                          95.8%
                        </td>
                        <td className="py-3.5 px-4 text-right font-bold text-slate-700">
                          {depenseAchatEtTransportFournisseur.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-blue-700">
                          ~{coutRevientKgFournisseur} FCFA / kg
                        </td>
                        <td className="py-3.5 px-5 text-right font-black text-slate-900 text-sm">
                          {valeurStockFournisseur.toLocaleString()} FCFA
                        </td>
                      </tr>

                      {/* Ligne TOTAL STOCK CONFORME */}
                      <tr className="bg-slate-900 text-white font-bold">
                        <td className="py-4 px-5 text-amber-400 font-black">
                          TOTAL STOCK CONFORME EXPLOITABLE
                        </td>
                        <td className="py-4 px-4 text-center text-emerald-400 font-black text-base">
                          {totalKgConformeGlobal.toLocaleString()} kg
                        </td>
                        <td className="py-4 px-4 text-center text-slate-300">
                          ~95.0%
                        </td>
                        <td className="py-4 px-4 text-right text-slate-200">
                          {(depenseTransportGratuit + depenseAchatEtTransportCollectePayante + depenseAchatEtTransportFournisseur).toLocaleString()} FCFA
                        </td>
                        <td className="py-4 px-4 text-right text-amber-300 font-black text-sm">
                          ~{coutMoyenPondereKg} FCFA / kg
                        </td>
                        <td className="py-4 px-5 text-right text-emerald-400 font-black text-base">
                          {valeurTotaleStockMatiereFCFA.toLocaleString()} FCFA
                        </td>
                      </tr>

                    </tbody>
                  </table>
                </div>

                {/* Encadré d'alerte sur les matières rejetées après tri */}
                <div className="p-4 bg-rose-50 border-t border-rose-200 flex items-center justify-between">
                  <div className="flex items-center gap-2.5 text-xs text-rose-900">
                    <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
                    <div>
                      <strong>Pertes sur Matières Non Conformes Écartées au Tri :</strong> {totalRejetTrieKg.toLocaleString()} kg rejetés.
                      <div className="text-[11px] text-rose-700">
                        Perte financière estimée : ~{pertesFinancieresRebutsFCFA.toLocaleString()} FCFA (matière payée mais inexploitable).
                      </div>
                    </div>
                  </div>
                  <span className="px-3 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-800">
                    Taux d'impuretés : ~{Number(((totalRejetTrieKg / (totalKgConformeGlobal + totalRejetTrieKg || 1)) * 100).toFixed(1))}%
                  </span>
                </div>

              </div>

            </div>
          )}

          {/* ──────────────────────────────────────────────────────────────────
              TABLEAU 4 : EXPRESSION DE BESOIN & BONS DE SORTIE PRODUCTION
              (PAGES 2 & 4 DU SCHÉMA : VALIDATION ASSISTANT + RÉCEPTION RESPONSABLE PROD)
              ────────────────────────────────────────────────────────────────── */}
          {activeMpTab === 'SORTIES_PRODUCTION' && (
            <div className="space-y-6 animate-fadeIn">
              
              {/* Bannière Directive Officielle de Sortie */}
              <div className="bg-gradient-to-r from-red-950 via-slate-900 to-slate-950 rounded-3xl p-6 text-white shadow-xl border border-red-900/40 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-red-600 text-white text-xs font-black shadow-sm">
                    <FileText className="w-3.5 h-3.5" />
                    DIRECTIVE D'APPROVISIONNEMENT (PAGES 2 & 4 DU SCHÉMA)
                  </div>
                  <h3 className="text-xl font-black tracking-tight">
                    Demandes d'Expression de Besoin & Bons de Sortie Production
                  </h3>
                  <div className="text-xs text-slate-300 space-y-1 max-w-2xl leading-relaxed">
                    <p>• <strong>Étape 1 :</strong> Toute sortie de matière première doit faire l’objet d’une demande d’expression de besoin du Responsable de Production adressée à l’Assistant pour validation.</p>
                    <p>• <strong>Étape 2 :</strong> La sortie est constatée par un bon de sortie après validation de l’Assistant avec une partie qui atteste la réception physique par le Responsable de Production.</p>
                    <p>• <strong>Étape 3 :</strong> Le bon de sortie scellé permet à l’Assistant d’enregistrer la sortie de la matière du stock.</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setShowMpSortieModal(true)}
                  className="px-5 py-3 rounded-2xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-lg flex items-center gap-2 shrink-0 self-start md:self-auto active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  + Nouvelle Demande de Sortie
                </button>
              </div>

              {/* Tableau Historique des Bons de Sortie */}
              <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Registre des Bons de Sortie Validés & Déstockés ({materialExitRequests.length})
                    </h4>
                    <p className="text-xs text-slate-500">
                      Suivi scellé avec signatures de l'Assistant Magasinier et du Responsable de Production
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800">
                      {materialExitRequests.reduce((sum, r) => sum + r.quantiteKgDemandee, 0).toLocaleString()} kg déstockés
                    </span>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-5">Réf Bon Sortie & Date</th>
                        <th className="py-3 px-4">Matière / Intrant</th>
                        <th className="py-3 px-4 text-center">Quantité</th>
                        <th className="py-3 px-4">Ligne & Shift</th>
                        <th className="py-3 px-4">1. Demandeur (Responsable Prod)</th>
                        <th className="py-3 px-4">2. Validateur (Assistant Magasin)</th>
                        <th className="py-3 px-4 text-center">Statut Réception</th>
                        <th className="py-3 px-5 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {materialExitRequests.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-8 text-center text-slate-400">
                            Aucun bon de sortie enregistré pour le moment. Cliquez sur « + Nouvelle Demande de Sortie ».
                          </td>
                        </tr>
                      ) : (
                        materialExitRequests.map(req => (
                          <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-5">
                              <span className="font-bold text-slate-900 font-mono">{req.numeroDemande}</span>
                              <div className="text-[10px] text-slate-400">{req.date} {req.heure || ''}</div>
                            </td>
                            <td className="py-3.5 px-4">
                              <strong className="text-slate-800">{req.mpNom}</strong>
                              <div className="text-[10px] text-slate-400 truncate max-w-xs">{req.motifBesoins}</div>
                            </td>
                            <td className="py-3.5 px-4 text-center font-black text-red-600 text-sm">
                              -{req.quantiteKgDemandee.toLocaleString()} kg
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800 text-[11px]">{req.ligneProduction}</div>
                              <span className="text-[10px] text-slate-400 font-semibold">{req.shift}</span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800">{req.demandeurNom}</div>
                              <span className="text-[10px] text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded font-bold">
                                Expression de besoin émise
                              </span>
                            </td>
                            <td className="py-3.5 px-4">
                              <div className="font-bold text-slate-800">{req.autorisePar || 'Modou Faye (Assistant)'}</div>
                              <span className="text-[10px] text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded font-bold">
                                Déstockage validé
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black bg-emerald-100 text-emerald-800">
                                <CheckSquare className="w-3 h-3 text-emerald-600" />
                                Réception attestée
                              </span>
                            </td>
                            <td className="py-3.5 px-5 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  exportBonSortieProductionPdf({
                                    numeroDemande: req.numeroDemande,
                                    date: req.date,
                                    heure: req.heure,
                                    mpNom: req.mpNom,
                                    quantite: req.quantiteKgDemandee,
                                    unite: 'Kg',
                                    shift: req.shift,
                                    ligneProduction: req.ligneProduction,
                                    demandeurNom: req.demandeurNom,
                                    demandeurPoste: 'Responsable de Production',
                                    motifBesoins: req.motifBesoins,
                                    autorisePar: req.autorisePar || 'Modou Faye',
                                    dateAutorisation: req.dateAutorisation || req.date,
                                    statut: req.statut
                                  });
                                }}
                                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-sm transition-all active:scale-95"
                                title="Imprimer le Bon de Sortie Officiel avec les 2 visas légaux"
                              >
                                <Printer className="w-3 h-3" />
                                <span>Imprimer Bon</span>
                              </button>
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

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          SECTION 2 : MATIÈRES ADDITIFS CHIMIQUES (AMIDON, AKD, COLORANTS...)
          ══════════════════════════════════════════════════════════════════════ */}
      {activeSection === 'ADDITIFS' && (
        <div className="space-y-6">

          {/* Module Déroulant de Sélection de l'Additif */}
          <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4 overflow-hidden">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 sm:gap-4">
              <div className="flex-1 min-w-0 max-w-full">
                <label className="block text-[11px] sm:text-xs font-black text-slate-400 uppercase tracking-wider mb-1">
                  Module Déroulant : Choisir l'Additif à mettre en opération
                </label>
                <div className="flex items-center gap-3 w-full">
                  <select
                    value={selectedAdditifId}
                    onChange={e => setSelectedAdditifId(e.target.value)}
                    className="w-full max-w-full text-xs sm:text-base font-black text-slate-900 bg-slate-50 border-2 border-indigo-300 rounded-2xl p-2.5 sm:p-3 pr-8 focus:ring-2 focus:ring-indigo-500 outline-none cursor-pointer truncate"
                  >
                    {listeAdditifs.map(a => (
                      <option key={a.id} value={a.id}>
                        {a.nom} — Stock : {a.stockActuel} {a.uniteMesure} (PMP: {a.coutMoyenAchatFCFA || 650} FCFA)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Statut et indicateur de l'additif sélectionné */}
              <div className="flex items-center gap-2 shrink-0">
                <span className="px-3 py-1.5 sm:px-3.5 sm:py-2 rounded-xl bg-indigo-50 border border-indigo-200 text-indigo-900 font-bold text-[11px] sm:text-xs flex items-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600 shrink-0" />
                  <span>Intrant Prêt pour Dosage Shuliy</span>
                </span>
              </div>
            </div>

            {/* Fiche interactive de l'additif sélectionné */}
            {currentAdditif && (
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Additif Actif :</span>
                  <strong className="text-indigo-900 text-sm">{currentAdditif.nom}</strong>
                  <span className="text-[10px] text-indigo-700 block mt-0.5">{currentAdditif.reference}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Stock Disponible :</span>
                  <strong className="text-slate-900 text-sm">{currentAdditif.stockActuel} {currentAdditif.uniteMesure}</strong>
                  <span className="text-[10px] text-slate-500 block mt-0.5">Seuil mini : {currentAdditif.seuilSecurite} {currentAdditif.uniteMesure}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Coût Moyen Achat (PMP) :</span>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <strong className="text-slate-900 text-sm">{currentAdditif.coutMoyenAchatFCFA || 650} FCFA</strong>
                    <button
                      type="button"
                      onClick={() => {
                        setEditingPriceAdditif(currentAdditif);
                        setNewPriceValue(currentAdditif.coutMoyenAchatFCFA || 650);
                      }}
                      className="px-2 py-0.5 bg-indigo-100 hover:bg-indigo-200 text-indigo-800 rounded-lg text-[10px] font-bold transition-colors"
                      title="Modifier manuellement le prix unitaire"
                    >
                      ✏️ Modifier
                    </button>
                  </div>
                  <span className="text-[10px] text-slate-500 block mt-0.5">par {currentAdditif.uniteMesure || currentAdditif.unite || 'Kg'}</span>
                </div>
                <div>
                  <span className="text-[10px] text-slate-500 font-bold block">Valeur en Stock de cet Additif :</span>
                  <strong className="text-emerald-700 text-sm">
                    {((currentAdditif.stockActuel) * (currentAdditif.coutMoyenAchatFCFA || 650)).toLocaleString()} FCFA
                  </strong>
                  <span className="text-[10px] text-emerald-600 block mt-0.5">
                    {currentAdditif.stockActuel > currentAdditif.seuilSecurite ? '✓ Stock suffisant' : '⚠️ Réapprovisionner'}
                  </span>
                </div>
              </div>
            )}
          </div>

          {/* BANNIÈRE SPÉCIALE : LOTS D'ADDITIFS PRÉ-COMMANDÉS POUR TESTS USINE */}
          <div className="bg-gradient-to-r from-amber-500/10 via-indigo-500/10 to-emerald-500/10 border-2 border-amber-300 rounded-3xl p-4 sm:p-5 shadow-sm">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-amber-200/60">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-amber-500 text-slate-950 font-black">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-sm font-black text-slate-900">Additifs Pré-Commandés pour Tests Usine</h4>
                  <p className="text-[11px] text-slate-600">Quantités validées pour essais de fabrication • Prix unitaires modifiables manuellement</p>
                </div>
              </div>
              <span className="px-3 py-1 rounded-full bg-amber-100 border border-amber-300 text-amber-900 text-xs font-black self-start sm:self-auto">
                Phase de Tests Prêts
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-3">
              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Amidon (Starch)</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">500 <span className="text-xs font-bold text-slate-500">kg</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700">650 F/kg</span>
                  <span className="text-[10px] text-slate-400">Liant</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">AKD</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">200 <span className="text-xs font-bold text-slate-500">kg</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700">1 850 F/kg</span>
                  <span className="text-[10px] text-slate-400">Hydrofuge</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">CMC</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">100 <span className="text-xs font-bold text-slate-500">kg</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700">1 450 F/kg</span>
                  <span className="text-[10px] text-slate-400">Rétention</span>
                </div>
              </div>

              <div className="p-3 bg-white rounded-2xl border border-slate-200 shadow-xs flex flex-col justify-between">
                <div>
                  <span className="text-[10px] font-bold text-slate-500 uppercase">Anti-mousse (Defoamer)</span>
                  <div className="text-lg font-black text-slate-900 mt-0.5">25 <span className="text-xs font-bold text-slate-500">L</span></div>
                </div>
                <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-700">2 500 F/L</span>
                  <span className="text-[10px] text-slate-400">Anti-bulle</span>
                </div>
              </div>
            </div>
          </div>

          {/* TABLEAU DE BORD EXPLICATIF DES ADDITIFS (Demande explicite du client) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            
            {/* CARTOUCHE MAJEUR : COÛT GLOBAL DES ADDITIFS */}
            <div className="bg-gradient-to-br from-indigo-900 to-slate-950 p-4 sm:p-6 rounded-3xl text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 sm:col-span-2">
              <div>
                <span className="text-[11px] font-black text-amber-400 uppercase tracking-wider block">
                  COÛT GLOBAL DES ADDITIFS EN MAGASIN (SYNTHÈSE FINANCIÈRE)
                </span>
                <div className="text-2xl sm:text-3xl font-black text-white mt-1.5 sm:mt-2">
                  {valeurGlobaleTousAdditifsFCFA.toLocaleString()} <span className="text-xs sm:text-sm font-bold text-slate-400">FCFA</span>
                </div>
                <p className="text-xs text-slate-300 mt-1 max-w-lg leading-relaxed">
                  Valeur totale immobilisée pour l'ensemble des additifs chimiques (Amidon, Colle AKD, Colorants, Résines) nécessaires au fonctionnement continu de l'usine.
                </p>
              </div>
              <div className="p-3 sm:p-4 rounded-2xl bg-indigo-500/20 text-amber-400 border border-indigo-500/30 self-start sm:self-auto shrink-0">
                <Sparkles className="w-6 h-6 sm:w-8 sm:h-8" />
              </div>
            </div>

            {/* Total Quantités */}
            <div className="bg-white p-4 sm:p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col justify-between">
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
                  Volume Total Tous Additifs
                </span>
                <div className="text-2xl font-black text-slate-900 mt-2">
                  {totalKgLitresTousAdditifs.toLocaleString()} <span className="text-xs font-bold text-slate-500">kg / L</span>
                </div>
                <span className="text-[11px] text-indigo-700 font-bold block mt-1">
                  Réparti sur {listeAdditifs.length} intrants actifs
                </span>
              </div>
              <div className="text-[11px] text-slate-500 pt-2 border-t border-slate-100">
                Dosage automatisé dans la cuve d'homogénéisation Shuliy
              </div>
            </div>

          </div>

          {/* Tableau Récapitulatif : États de Stock, Coûts & Quantités des Additifs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 text-[10px] font-black uppercase tracking-wider mb-1">
                  Page 2 & 4 du Schéma Directeur Usine
                </div>
                <h3 className="text-base font-black text-slate-900">
                  Les 5 Additifs Chimiques Réglementaires & Seuil d'Alerte 25%
                </h3>
                <p className="text-xs text-slate-500">
                  AKD, Amidon Cationique, CMC, Talc & Anti-Mousse • Détermination du coût unitaire & alerte de réapprovisionnement à 25%
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5"># & Additif Officiel</th>
                    <th className="py-3 px-4">Fournisseur & Réf</th>
                    <th className="py-3 px-4 text-center">Stock Actuel</th>
                    <th className="py-3 px-4 text-center">Seuil Sécurité (25%)</th>
                    <th className="py-3 px-4 text-right">Coût / Unité (PMP)</th>
                    <th className="py-3 px-4 text-right">Valeur Stock</th>
                    <th className="py-3 px-5 text-center">Seuil d'Alerte 25%</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {listeAdditifs.map((a, idx) => {
                    const pmp = a.coutMoyenAchatFCFA || 650;
                    const valeur = a.stockActuel * pmp;
                    const ratioSeuil = a.seuilSecurite > 0 ? (a.stockActuel / (a.seuilSecurite * 2)) : 1;
                    const isAlerte25 = a.stockActuel <= a.seuilSecurite || ratioSeuil <= 0.25;
                    const isVigilance = !isAlerte25 && ratioSeuil <= 0.40;

                    return (
                      <tr 
                        key={a.id} 
                        onClick={() => setSelectedAdditifId(a.id)}
                        className={`hover:bg-indigo-50/50 cursor-pointer transition-colors ${
                          selectedAdditifId === a.id ? 'bg-indigo-50/70' : ''
                        }`}
                      >
                        <td className="py-3.5 px-5">
                          <div className="flex items-center gap-2">
                            <span className="w-5 h-5 rounded-lg bg-indigo-600 text-white font-black text-[10px] flex items-center justify-center shrink-0">
                              {idx + 1}
                            </span>
                            <div>
                              <strong className="text-slate-900 block text-xs">{a.nom}</strong>
                              <span className="text-[10px] text-slate-400">
                                {a.nom.toLowerCase().includes('amidon') ? 'Rétention des fibres et rigidité' :
                                 a.nom.toLowerCase().includes('akd') ? 'Agent hydrophobe & étanchéité alvéoles' :
                                 a.nom.toLowerCase().includes('cmc') ? 'Liant, rétention & stabilisant E466' :
                                 a.nom.toLowerCase().includes('talc') ? 'Charge minérale, opacité & lissage' :
                                 a.nom.toLowerCase().includes('defoamer') || a.nom.toLowerCase().includes('mousse') ? 'Élimination des bulles et aération pâte' :
                                 'Additif de renfort mécanique'}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="font-mono text-slate-700 text-[11px] block">{a.reference}</span>
                          <span className="text-[10px] text-slate-400 truncate max-w-[180px] block">
                            {a.fournisseurPrincipal || 'Fournisseur Certifié'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-slate-900 text-sm">
                          {a.stockActuel.toLocaleString()} {a.uniteMesure}
                        </td>
                        <td className="py-3.5 px-4 text-center text-slate-500 font-bold">
                          {a.seuilSecurite} {a.uniteMesure}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <span className="font-bold text-slate-800">{pmp.toLocaleString()} FCFA</span>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingPriceAdditif(a);
                                setNewPriceValue(a.coutMoyenAchatFCFA || 650);
                              }}
                              className="px-1.5 py-0.5 bg-slate-100 hover:bg-indigo-100 text-indigo-700 rounded text-[10px] font-bold"
                              title="Corriger le coût unitaire"
                            >
                              ✏️
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right font-black text-emerald-700 text-sm">
                          {valeur.toLocaleString()} FCFA
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-black ${
                            isAlerte25 ? 'bg-red-100 text-red-800 border border-red-300 animate-pulse' :
                            isVigilance ? 'bg-amber-100 text-amber-800 border border-amber-300' :
                            'bg-emerald-100 text-emerald-800'
                          }`}>
                            {isAlerte25 ? '🚨 SEUIL 25% ATTEINT' : isVigilance ? '⚠️ VIGILANCE (≤40%)' : '✓ NORMAL (>25%)'}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Historique des Mouvements d'Additifs */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Journal des Entrées & Sorties d'Additifs
                </h3>
                <p className="text-xs text-slate-500">
                  Traçabilité des approvisionnements fournisseurs et dosages en production
                </p>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-100">
                  <tr>
                    <th className="py-3 px-5">Réf & Date</th>
                    <th className="py-3 px-4">Type</th>
                    <th className="py-3 px-4">Additif Concerné</th>
                    <th className="py-3 px-4 text-center">Quantité</th>
                    <th className="py-3 px-4">Tiers / Fournisseur / Ligne</th>
                    <th className="py-3 px-4">Enregistré par</th>
                    <th className="py-3 px-5 text-center">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {intrantMovements.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        Aucun mouvement d'additif enregistré.
                      </td>
                    </tr>
                  ) : (
                    intrantMovements.map(m => (
                      <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3.5 px-5">
                          <span className="font-mono font-bold text-slate-900 text-[11px]">{m.numeroMouvement}</span>
                          <div className="text-[10px] text-slate-400">{m.date}</div>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-black ${
                            m.type === 'ENTREE_ACHAT' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'
                          }`}>
                            {m.type === 'ENTREE_ACHAT' ? '📥 Entrée Achat' : '📤 Sortie Dosage'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-bold text-slate-800">
                          {m.intrantNom}
                        </td>
                        <td className="py-3.5 px-4 text-center font-black text-sm">
                          <span className={m.type === 'ENTREE_ACHAT' ? 'text-emerald-700' : 'text-amber-800'}>
                            {m.type === 'ENTREE_ACHAT' ? `+${m.quantite} ${m.unite}` : `-${m.quantite} ${m.unite}`}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-slate-600">
                          {m.fournisseurNom || m.ligneProduction || 'Cuve Homogénéisation'}
                        </td>
                        <td className="py-3.5 px-4 text-slate-700">
                          {m.enregistrePar}
                        </td>
                        <td className="py-3.5 px-5 text-center">
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-700">
                            Validé
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

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 1 : ENTRÉE MATIÈRE PREMIÈRE (FOURNISSEUR OU COLLECTÉE)
          ══════════════════════════════════════════════════════════════════════ */}
      {showMpEntreeModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 shrink-0">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-emerald-600 text-white font-black shadow-md">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-slate-900">Nouvelle Réception Matière Première</h3>
                  <p className="text-xs text-slate-500">
                    Pesée quai pont-bascule, traçabilité transport et localisation • Tri obligatoire avant admission en stock utile
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowMpEntreeModal(false)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveMpEntree} className="mt-5 space-y-5">
              
              {/* Étape 1 : Choix entre Fournisseur et Collectée */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-2">
                  1. Mode d'Approvisionnement
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setMpEntreeMode('FOURNISSEUR')}
                    className={`p-3.5 rounded-2xl border-2 text-xs font-black flex items-center justify-center gap-2.5 transition-all ${
                      mpEntreeMode === 'FOURNISSEUR'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Truck className="w-4 h-4" />
                    <span>🚚 1. Livraison Fournisseur</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setMpEntreeMode('COLLECTEE')}
                    className={`p-3.5 rounded-2xl border-2 text-xs font-black flex items-center justify-center gap-2.5 transition-all ${
                      mpEntreeMode === 'COLLECTEE'
                        ? 'bg-purple-600 text-white border-purple-600 shadow-md'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <Boxes className="w-4 h-4" />
                    <span>🚐 2. Collecte par l'Usine</span>
                  </button>
                </div>
              </div>

              {/* RENSEIGNEMENTS FOURNISSEUR & LOCALISATION */}
              {mpEntreeMode === 'FOURNISSEUR' && (
                <div className="p-4 rounded-2xl bg-blue-50/60 border border-blue-200 space-y-3">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-2">
                      <Truck className="w-4 h-4 text-blue-700" />
                      Informations Fournisseur, Localisation & Transport
                    </h4>
                    <span className="text-[10px] text-blue-700 font-bold bg-blue-100 px-2 py-0.5 rounded-full">
                      Tarif Réf : 250 FCFA / kg
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="sm:col-span-2">
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom de l'Entreprise Fournisseur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.fournisseurNom}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, fournisseurNom: e.target.value })}
                        placeholder="Ex: SONACOS Dakar, SIPS, Papeterie du Sénégal"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Téléphone Fournisseur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.fournisseurContact}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, fournisseurContact: e.target.value })}
                        placeholder="Ex: +221 77 654 32 10"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>

                  {/* Localisation Fournisseur (Exigence Client) */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        Localisation / Adresse du Fournisseur
                      </label>
                      <input
                        type="text"
                        value={mpEntreeForm.fournisseurAdresse}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, fournisseurAdresse: e.target.value })}
                        placeholder="Ex: Zone Industrielle Mbao, Km 18, Dakar"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Société de Transport / Transporteur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.transporteur}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, transporteur: e.target.value })}
                        placeholder="Ex: Transports Ba & Frères"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>

                  {/* Capture Géolocalisation GPS & Itinéraire Google Maps (Exigence Client Audio) */}
                  <div className="p-3.5 rounded-2xl bg-blue-100/70 border border-blue-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-blue-950">
                        <Compass className="w-4 h-4 text-blue-700 shrink-0" />
                        <span>Position GPS & Calcul Altitude (Fournisseur)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCaptureGps}
                          disabled={isCapturingGps}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all"
                        >
                          <Crosshair className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                          <span>{isCapturingGps ? 'Capture en cours...' : '📍 Capturer Emplacement GPS'}</span>
                        </button>
                        {mpEntreeForm.latitude && mpEntreeForm.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${mpEntreeForm.latitude},${mpEntreeForm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 transition-all shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-blue-600" />
                            <span>Itinéraire Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Latitude</label>
                        <input
                          type="text"
                          value={mpEntreeForm.latitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, latitude: e.target.value })}
                          placeholder="14.716700"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Longitude</label>
                        <input
                          type="text"
                          value={mpEntreeForm.longitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, longitude: e.target.value })}
                          placeholder="-17.467700"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Altitude calculée</label>
                        <input
                          type="text"
                          value={mpEntreeForm.altitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, altitude: e.target.value })}
                          placeholder="24 m"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Chauffeur, Téléphone & Matricule */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Nom du Chauffeur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.chauffeurNom}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, chauffeurNom: e.target.value })}
                        placeholder="Ex: Alioune Badara Fall"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tél Chauffeur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.chauffeurTel}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, chauffeurTel: e.target.value })}
                        placeholder="Ex: +221 70 889 45 12"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Immatriculation (Matricule)</label>
                      <input
                        type="text"
                        value={mpEntreeForm.vehiculeImmatriculation}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, vehiculeImmatriculation: e.target.value })}
                        placeholder="Ex: DK-4581-BB"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono font-bold"
                      />
                    </div>
                  </div>

                  {/* Justificatifs */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Bon Pesée Pont-Bascule</label>
                      <input
                        type="text"
                        value={mpEntreeForm.numeroBonPesee}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, numeroBonPesee: e.target.value })}
                        placeholder="Ex: PONT-2026-1045"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Facture / BL Fournisseur</label>
                      <input
                        type="text"
                        value={mpEntreeForm.numeroFactureFournisseur}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, numeroFactureFournisseur: e.target.value })}
                        placeholder="Ex: FAC-FOURN-781"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                  </div>

                  {/* Prise en charge transport */}
                  <div className="pt-2 border-t border-blue-200">
                    <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                      <input
                        type="checkbox"
                        checked={mpEntreeForm.priseEnChargeTransport}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, priseEnChargeTransport: e.target.checked })}
                        className="w-4 h-4 rounded text-blue-600"
                      />
                      <span>Prise en charge du transport par l'Usine ?</span>
                    </label>

                    {mpEntreeForm.priseEnChargeTransport && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-2.5">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Frais de Transport Pris en Charge (FCFA)</label>
                          <input
                            type="number"
                            value={mpEntreeForm.coutTransportFCFA}
                            onChange={e => setMpEntreeForm({ ...mpEntreeForm, coutTransportFCFA: Number(e.target.value) })}
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                          />
                        </div>
                        <div className="flex items-end">
                          <span className="text-[11px] text-blue-800 bg-blue-100/70 p-2 rounded-xl block w-full">
                            Ce montant sera ajouté au coût total d'acquisition du lot pour calculer le prix de revient réel.
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* RENSEIGNEMENTS COLLECTE USINE & LOCALISATION */}
              {mpEntreeMode === 'COLLECTEE' && (
                <div className="p-4 rounded-2xl bg-purple-50/70 border border-purple-200 space-y-3.5">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-black text-purple-900 uppercase tracking-wider flex items-center gap-2">
                      <Boxes className="w-4 h-4 text-purple-700" />
                      Mission de Collecte Interne par l'Usine
                    </h4>
                    <span className="text-[10px] text-purple-700 font-bold bg-purple-100 px-2.5 py-0.5 rounded-full">
                      CDC Section 6.2
                    </span>
                  </div>

                  {/* Choix Gratuit vs Payant */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2">
                    <label className="block text-[11px] font-black text-purple-900 uppercase tracking-wider">
                      Modalité Financière de la Collecte :
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setCollecteType('GRATUITE')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          collecteType === 'GRATUITE'
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'bg-slate-50 text-purple-900 border border-purple-200'
                        }`}
                      >
                        <span>🎁 1. Gratuite (Débarras 0 FCFA/kg)</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setCollecteType('PAYANTE')}
                        className={`p-2.5 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 ${
                          collecteType === 'PAYANTE'
                            ? 'bg-purple-700 text-white shadow-sm'
                            : 'bg-slate-50 text-purple-900 border border-purple-200'
                        }`}
                      >
                        <span>💵 2. Payante (Achat Négocié)</span>
                      </button>
                    </div>
                  </div>

                  {/* Agent Usine & Site Collecté */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Agent de Collecte Usine (Nom)</label>
                      <input
                        type="text"
                        value={mpEntreeForm.agentCollecteNom}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, agentCollecteNom: e.target.value })}
                        placeholder="Ex: Moussa Diop (Agent Usine)"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Tél Agent Usine</label>
                      <input
                        type="text"
                        value={mpEntreeForm.agentCollecteTel}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, agentCollecteTel: e.target.value })}
                        placeholder="Ex: +221 77 623 88 90"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>

                  {/* Entreprise & Localisation Site Collecté */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Entreprise / Site Collecté</label>
                      <input
                        type="text"
                        value={mpEntreeForm.siteEntrepriseCollectee}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, siteEntrepriseCollectee: e.target.value })}
                        placeholder="Ex: Imprimerie Tandian, Supermarché Auchan"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-red-500" />
                        Localisation / Adresse du Site Collecté
                      </label>
                      <input
                        type="text"
                        value={mpEntreeForm.siteCollecteAdresse}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, siteCollecteAdresse: e.target.value })}
                        placeholder="Ex: Km 24, Rufisque Nord, Dakar"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                  </div>

                  {/* Capture Géolocalisation GPS & Itinéraire Google Maps (Exigence Client Audio) */}
                  <div className="p-3.5 rounded-2xl bg-purple-100/70 border border-purple-200 space-y-2.5">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 text-xs font-black text-purple-950">
                        <Compass className="w-4 h-4 text-purple-700 shrink-0" />
                        <span>Position GPS & Calcul Altitude (Site Collecté)</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={handleCaptureGps}
                          disabled={isCapturingGps}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-700 hover:bg-purple-800 text-white text-[11px] font-bold shadow-sm active:scale-95 transition-all"
                        >
                          <Crosshair className={`w-3.5 h-3.5 ${isCapturingGps ? 'animate-spin' : ''}`} />
                          <span>{isCapturingGps ? 'Capture en cours...' : '📍 Capturer Emplacement GPS'}</span>
                        </button>
                        {mpEntreeForm.latitude && mpEntreeForm.longitude && (
                          <a
                            href={`https://www.google.com/maps?q=${mpEntreeForm.latitude},${mpEntreeForm.longitude}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-white hover:bg-slate-100 text-slate-800 text-[11px] font-bold border border-slate-300 transition-all shadow-2xs"
                          >
                            <ExternalLink className="w-3.5 h-3.5 text-purple-600" />
                            <span>Itinéraire Maps</span>
                          </a>
                        )}
                      </div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Latitude</label>
                        <input
                          type="text"
                          value={mpEntreeForm.latitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, latitude: e.target.value })}
                          placeholder="14.716700"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Longitude</label>
                        <input
                          type="text"
                          value={mpEntreeForm.longitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, longitude: e.target.value })}
                          placeholder="-17.467700"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Altitude calculée</label>
                        <input
                          type="text"
                          value={mpEntreeForm.altitude}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, altitude: e.target.value })}
                          placeholder="24 m"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-mono font-bold text-emerald-700"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Structure & Fiche */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">Structure de Collecte</label>
                      <input
                        type="text"
                        value={mpEntreeForm.structureCollecte}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, structureCollecte: e.target.value })}
                        placeholder="Ex: Imprimerie, Cartonnerie, Supermarché"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Fiche Collecte</label>
                      <input
                        type="text"
                        value={mpEntreeForm.numeroFicheCollecte}
                        onChange={e => setMpEntreeForm({ ...mpEntreeForm, numeroFicheCollecte: e.target.value })}
                        placeholder="Ex: COL-2026-089"
                        className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-mono"
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-1.5">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Départ</label>
                        <input
                          type="time"
                          value={mpEntreeForm.heureDepart}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, heureDepart: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Retour</label>
                        <input
                          type="time"
                          value={mpEntreeForm.heureRetour}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, heureRetour: e.target.value })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Flotte Véhicule pour Collecte */}
                  <div className="p-3 rounded-xl bg-white border border-purple-200 space-y-2.5">
                    <label className="block text-[11px] font-black text-purple-950 uppercase tracking-wider">
                      Véhicule Utilisé pour la Collecte :
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Type de Flotte</label>
                        <select
                          value={mpEntreeForm.vehiculeType}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, vehiculeType: e.target.value as any })}
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium"
                        >
                          <option value="VEHICULE_LOCATION">Véhicule de Location (Prestataire)</option>
                          <option value="VEHICULE_USINE">Véhicule Propre Usine</option>
                        </select>
                      </div>

                      {mpEntreeForm.vehiculeType === 'VEHICULE_LOCATION' ? (
                        <>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Nom du Loueur / Prestataire</label>
                            <input
                              type="text"
                              value={mpEntreeForm.loueurNom}
                              onChange={e => setMpEntreeForm({ ...mpEntreeForm, loueurNom: e.target.value })}
                              placeholder="Ex: Transport Ndiaye Frères"
                              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-600 mb-1">Coût de Location (FCFA)</label>
                            <input
                              type="number"
                              value={mpEntreeForm.coutTransportFCFA}
                              onChange={e => setMpEntreeForm({ ...mpEntreeForm, coutTransportFCFA: Number(e.target.value) })}
                              className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                            />
                          </div>
                        </>
                      ) : (
                        <div className="sm:col-span-2">
                          <label className="block text-[10px] font-bold text-slate-600 mb-1">Immatriculation Camion Usine</label>
                          <input
                            type="text"
                            value={mpEntreeForm.vehiculeImmatriculation}
                            onChange={e => setMpEntreeForm({ ...mpEntreeForm, vehiculeImmatriculation: e.target.value })}
                            placeholder="Ex: DK-1024-AA (Camion Benne Usine)"
                            className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                          />
                        </div>
                      )}
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Chauffeur</label>
                        <input
                          type="text"
                          value={mpEntreeForm.chauffeurNom}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, chauffeurNom: e.target.value })}
                          placeholder="Ex: Alioune Badara Fall"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-600 mb-1">Matricule / Immatriculation</label>
                        <input
                          type="text"
                          value={mpEntreeForm.vehiculeImmatriculation}
                          onChange={e => setMpEntreeForm({ ...mpEntreeForm, vehiculeImmatriculation: e.target.value })}
                          placeholder="Ex: DK-4581-BB"
                          className="w-full text-xs p-2 rounded-xl border border-slate-300 font-mono font-bold"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* SECTION PESÉE PONT-BASCULE & VALORISATION MATIÈRE */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-3.5">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                    <Scale className="w-4 h-4 text-emerald-600" />
                    Données de Pesée Pont-Bascule & Valorisation
                  </h4>
                  <span className="text-[10px] text-slate-500 font-bold">Pesée brute sur quai usine</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Type de Papier / Carton Réceptionné</label>
                    <select
                      value={mpEntreeForm.typePapierCarton}
                      onChange={e => setMpEntreeForm({ ...mpEntreeForm, typePapierCarton: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                    >
                      <option value="Balles OCC (Carton ondulé recyclé standard)">Balles OCC (Carton ondulé recyclé standard)</option>
                      <option value="Papiers Journaux & Magazines">Papiers Journaux & Magazines</option>
                      <option value="Carton Kraft Brun de Récupération">Carton Kraft Brun de Récupération</option>
                      <option value="Rognures Blanches d'Imprimerie">Rognures Blanches d'Imprimerie</option>
                      <option value="Papiers & Cartons Mixtes">Papiers & Cartons Mixtes</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité Déclarée Fournisseur (kg)</label>
                    <input
                      type="number"
                      min="1"
                      value={mpEntreeForm.quantiteDeclareeKg}
                      onChange={e => setMpEntreeForm({ ...mpEntreeForm, quantiteDeclareeKg: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold bg-white"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-black text-emerald-950 mb-1">
                      Quantité Brute Pesée au Pont-Bascule (kg)
                    </label>
                    <input
                      type="number"
                      min="1"
                      value={mpEntreeForm.quantiteBruteReceptionneeKg}
                      onChange={e => setMpEntreeForm({ ...mpEntreeForm, quantiteBruteReceptionneeKg: Number(e.target.value) })}
                      className="w-full text-xs p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/60 font-black text-slate-900"
                      required
                    />
                    <span className="text-[10px] text-emerald-700 block mt-0.5 font-bold">Pesée certifiée au pont-bascule</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Prix Unitaire Matière (FCFA / kg)
                    </label>
                    <input
                      type="number"
                      disabled={mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE'}
                      value={mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE' ? 0 : mpEntreeForm.prixUnitaireKg}
                      onChange={e => setMpEntreeForm({ ...mpEntreeForm, prixUnitaireKg: Number(e.target.value) })}
                      className={`w-full text-xs p-2.5 rounded-xl border font-bold ${
                        mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE'
                          ? 'bg-slate-100 text-slate-400 border-slate-200'
                          : 'bg-white border-slate-300 text-slate-900'
                      }`}
                    />
                    {mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE' ? (
                      <span className="text-[10px] text-emerald-700 font-black block mt-0.5">0 FCFA / kg (Débarras d'entreprise)</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 block mt-0.5">Réf usine : 250 FCFA / kg</span>
                    )}
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Magasinier Réceptionnaire</label>
                    <input
                      type="text"
                      value={mpEntreeForm.magasinierReception}
                      onChange={e => setMpEntreeForm({ ...mpEntreeForm, magasinierReception: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-semibold bg-white"
                      required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Observations Réception Quai</label>
                  <input
                    type="text"
                    value={mpEntreeForm.observations}
                    onChange={e => setMpEntreeForm({ ...mpEntreeForm, observations: e.target.value })}
                    placeholder="Humidité apparente, état des balles, contrôle visuel de propreté..."
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white"
                  />
                </div>
              </div>

              {/* ── BARRE DYNAMIQUE DE CALCUL EN TEMPS RÉEL (PRÉ-VALIDATION CLIENT) ── */}
              {(() => {
                const qteBrute = Number(mpEntreeForm.quantiteBruteReceptionneeKg) || 0;
                const isGratuit = mpEntreeMode === 'COLLECTEE' && collecteType === 'GRATUITE';
                const prixKg = isGratuit ? 0 : (Number(mpEntreeForm.prixUnitaireKg) || 250);
                const montantMatiere = qteBrute * prixKg;
                const fraisTransport = (mpEntreeMode === 'COLLECTEE' && mpEntreeForm.vehiculeType === 'VEHICULE_LOCATION') || mpEntreeForm.priseEnChargeTransport
                  ? Number(mpEntreeForm.coutTransportFCFA) || 0
                  : 0;
                const coutTotalAcquisition = montantMatiere + fraisTransport;
                const coutRevientUnitaireEstime = qteBrute > 0 ? Number((coutTotalAcquisition / qteBrute).toFixed(1)) : prixKg;

                return (
                  <div className="p-4 rounded-2xl bg-gradient-to-r from-slate-900 to-slate-950 text-white space-y-3 shadow-xl border border-slate-800">
                    <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                      <div className="flex items-center gap-2">
                        <Scale className="w-4 h-4 text-amber-400" />
                        <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                          Synthèse Financière Pré-Validation (Temps Réel)
                        </span>
                      </div>
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase ${
                        isGratuit 
                          ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' 
                          : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                      }`}>
                        {isGratuit ? '🎁 Débarras Gratuit (0 F matière)' : '💵 Matière Payante'}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Poids Brut Pesé :</span>
                        <strong className="text-amber-300 text-sm font-black">{qteBrute.toLocaleString()} kg</strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Montant Matière :</span>
                        <strong className="text-slate-100 text-sm font-black">
                          {isGratuit ? '0 FCFA' : `${montantMatiere.toLocaleString()} FCFA`}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Frais Transport/Loc :</span>
                        <strong className="text-slate-100 text-sm font-black">
                          {fraisTransport > 0 ? `+${fraisTransport.toLocaleString()} FCFA` : '0 FCFA'}
                        </strong>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block font-medium">Coût Revient Est. / kg :</span>
                        <strong className="text-emerald-400 text-sm font-black">~{coutRevientUnitaireEstime} FCFA/kg</strong>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                      <span className="text-xs font-bold text-slate-300">
                        Coût Total d'Acquisition Engagé :
                      </span>
                      <span className="text-base font-black text-emerald-400">
                        {coutTotalAcquisition.toLocaleString()} FCFA
                      </span>
                    </div>
                  </div>
                );
              })()}

              {/* RAPPEL SUR LE TRIAGE OBLIGATOIRE */}
              <div className="p-3.5 rounded-2xl bg-amber-50 border border-amber-300 text-xs text-amber-950 font-medium flex items-start gap-2.5">
                <Scissors className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-amber-950">Statut initial : « En attente de triage »</strong>
                  <span>
                    Conformément au processus usine, ce lot n'intégrera pas le stock exploitable avant validation de la phase de tri (séparation conforme vs rebuts).
                  </span>
                </div>
              </div>

              {/* Boutons d'action */}
              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowMpEntreeModal(false)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Enregistrer l'Entrée Brute Quai
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 2 : VALIDATION DU TRIAGE (NB CLIENT STRICT)
          ══════════════════════════════════════════════════════════════════════ */}
      {showTriModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-7 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col animate-fadeIn">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-2xl bg-amber-500 text-slate-950 font-black shadow-md">
                  <Scissors className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Validation du Triage Physique Obligatoire</h3>
                  <p className="text-xs text-slate-500">Bon de Réception Quai : <strong className="font-mono text-slate-800">{showTriModal.numeroBon}</strong></p>
                </div>
              </div>
              <button 
                onClick={() => setShowTriModal(null)} 
                className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-600 flex items-center justify-center font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleValidateTri} className="mt-4 space-y-4">
              
              {/* Récapitulatif du lot réceptionné avec Localisation et Véhicule */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
                <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                  <span className="text-slate-500 font-medium">Source / Provenance :</span>
                  <strong className="text-slate-900 font-bold">{showTriModal.fournisseurNom}</strong>
                </div>

                {showTriModal.fournisseurAdresse && (
                  <div className="flex items-center justify-between pb-1.5 border-b border-slate-200/60">
                    <span className="text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-red-500" />
                      Localisation :
                    </span>
                    <span className="text-slate-700 font-semibold">{showTriModal.fournisseurAdresse}</span>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 pb-1.5 border-b border-slate-200/60 text-[11px]">
                  <div>
                    <span className="text-slate-400 block font-medium">Chauffeur & Tél :</span>
                    <span className="font-bold text-slate-800">{showTriModal.chauffeurNom || 'Non renseigné'}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block font-medium">Matricule Véhicule :</span>
                    <span className="font-mono font-bold text-slate-900">{showTriModal.vehiculeImmatriculation || 'Non renseigné'}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-0.5">
                  <span className="text-slate-500 font-medium">Pesée Brute Quai (kg) :</span>
                  <strong className="text-amber-800 font-black text-sm">{showTriModal.quantiteBruteReceptionneeKg.toLocaleString()} kg</strong>
                </div>

                <div className="flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">Coût Total Engagé :</span>
                  <strong className="text-slate-900 font-black">
                    {showTriModal.coutTotalBrutFCFA ? `${showTriModal.coutTotalBrutFCFA.toLocaleString()} FCFA` : (showTriModal.estGratuitDebarras ? '0 FCFA (Gratuit)' : `${(showTriModal.quantiteBruteReceptionneeKg * (showTriModal.prixUnitaireKg || 250)).toLocaleString()} FCFA`)}
                  </strong>
                </div>
              </div>

              {/* Raccourcis de Tri Rapide */}
              <div>
                <label className="block text-[11px] font-black text-slate-700 uppercase tracking-wider mb-1.5">
                  Raccourcis de Rendement de Tri :
                </label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const c = Math.round(showTriModal.quantiteBruteReceptionneeKg * 0.95);
                      const r = showTriModal.quantiteBruteReceptionneeKg - c;
                      setTriForm({ ...triForm, quantiteConformeKg: c, quantiteRejeteeKg: r });
                    }}
                    className="p-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-900 text-xs font-bold transition-colors"
                  >
                    95% Conforme (5% Rejet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      const c = Math.round(showTriModal.quantiteBruteReceptionneeKg * 0.90);
                      const r = showTriModal.quantiteBruteReceptionneeKg - c;
                      setTriForm({ ...triForm, quantiteConformeKg: c, quantiteRejeteeKg: r });
                    }}
                    className="p-2 rounded-xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 text-xs font-bold transition-colors"
                  >
                    90% Conforme (10% Rejet)
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTriForm({ ...triForm, quantiteConformeKg: showTriModal.quantiteBruteReceptionneeKg, quantiteRejeteeKg: 0 });
                    }}
                    className="p-2 rounded-xl border border-slate-300 bg-slate-50 hover:bg-slate-100 text-slate-900 text-xs font-bold transition-colors"
                  >
                    100% Conforme (0 Rejet)
                  </button>
                </div>
              </div>

              {/* Saisie Pesée Conforme vs Rebut */}
              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-2xl bg-emerald-50/70 border-2 border-emerald-300">
                  <label className="block text-[11px] font-black text-emerald-950 mb-1">
                    Quantité Conforme (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={showTriModal.quantiteBruteReceptionneeKg}
                    value={triForm.quantiteConformeKg}
                    onChange={e => {
                      const c = Number(e.target.value);
                      const r = Math.max(0, showTriModal.quantiteBruteReceptionneeKg - c);
                      setTriForm({ ...triForm, quantiteConformeKg: c, quantiteRejeteeKg: r });
                    }}
                    className="w-full text-sm p-2 rounded-xl border border-emerald-400 bg-white font-black text-emerald-800"
                    required
                  />
                  <span className="text-[10px] text-emerald-700 font-bold block mt-1">
                    Admis en stock pulpeur net
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-rose-50/70 border-2 border-rose-300">
                  <label className="block text-[11px] font-black text-rose-950 mb-1">
                    Quantité Rejetée (kg)
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={showTriModal.quantiteBruteReceptionneeKg}
                    value={triForm.quantiteRejeteeKg}
                    onChange={e => {
                      const r = Number(e.target.value);
                      const c = Math.max(0, showTriModal.quantiteBruteReceptionneeKg - r);
                      setTriForm({ ...triForm, quantiteRejeteeKg: r, quantiteConformeKg: c });
                    }}
                    className="w-full text-sm p-2 rounded-xl border border-rose-400 bg-white font-black text-rose-800"
                    required
                  />
                  <span className="text-[10px] text-rose-700 font-bold block mt-1">
                    Mise en quarantaine / Rebut
                  </span>
                </div>
              </div>

              {/* Indicateurs dynamiques Rendement et Coût Réel */}
              {(() => {
                const conforme = Number(triForm.quantiteConformeKg) || 0;
                const total = showTriModal.quantiteBruteReceptionneeKg || 1;
                const rendement = Number(((conforme / total) * 100).toFixed(1));
                const coutTotal = showTriModal.coutTotalBrutFCFA || (total * (showTriModal.prixUnitaireKg || 250));
                const coutReelNet = conforme > 0 ? Number((coutTotal / conforme).toFixed(1)) : (showTriModal.prixUnitaireKg || 250);

                return (
                  <div className="p-3 rounded-xl bg-slate-900 text-white flex items-center justify-between text-xs">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-medium">Rendement de Tri :</span>
                      <strong className={`text-base font-black ${rendement >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                        {rendement}% conforme
                      </strong>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] text-slate-400 block font-medium">Coût de Revient Réel Net :</span>
                      <strong className="text-base font-black text-amber-300">
                        ~{coutReelNet} FCFA / kg
                      </strong>
                    </div>
                  </div>
                );
              })()}

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Motif Détaillé de Déclassement / Rejet
                </label>
                <select
                  onChange={e => {
                    if (e.target.value) {
                      setTriForm({ ...triForm, motifRejet: e.target.value });
                    }
                  }}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium mb-1.5 bg-slate-50"
                >
                  <option value="">-- Choisir un motif standard ou saisir ci-dessous --</option>
                  <option value="Cartons souillés d'huiles et résidus plastiques">Cartons souillés d'huiles et résidus plastiques</option>
                  <option value="Présence de films plastiques et polystyrène">Présence de films plastiques et polystyrène</option>
                  <option value="Humidité anormale supérieure à 14% (Balles mouillées)">Humidité anormale supérieure à 14% (Balles mouillées)</option>
                  <option value="Agrafes métalliques, fils de fer et corps étrangers">Agrafes métalliques, fils de fer et corps étrangers</option>
                  <option value="Cartons cirés ou imperméabilisés inexploitables au pulpeur">Cartons cirés ou imperméabilisés inexploitables au pulpeur</option>
                  <option value="Moisissures, odeurs de décomposition et pourriture">Moisissures, odeurs de décomposition et pourriture</option>
                </select>
                <input
                  type="text"
                  value={triForm.motifRejet}
                  onChange={e => setTriForm({ ...triForm, motifRejet: e.target.value })}
                  placeholder="Ex: Cartons souillés, résidus plastiques ou agrafes métalliques..."
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable du Triage Usine</label>
                <input
                  type="text"
                  value={triForm.responsableTri}
                  onChange={e => setTriForm({ ...triForm, responsableTri: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2.5 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowTriModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-lg transition-all active:scale-95 flex items-center gap-1.5"
                >
                  <Check className="w-4 h-4" />
                  Valider le Tri & Intégrer au Stock Net
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 3 : SORTIE MATIÈRE PREMIÈRE VERS PRODUCTION (PULPEUR)
          CONFORME AU CIRCUIT DU SCHÉMA : EXPRESSION BESOIN + VALIDATION ASSISTANT + RÉCEPTION
          ══════════════════════════════════════════════════════════════════════ */}
      {showMpSortieModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-red-600 text-white font-black">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Demande d'Expression de Besoin & Bon de Sortie</h3>
                  <p className="text-xs text-slate-500">Approvisionnement Production (Pages 2 & 4 du Schéma Directeur)</p>
                </div>
              </div>
              <button onClick={() => setShowMpSortieModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            {/* Directive Officielle */}
            <div className="mt-3 p-3 rounded-2xl bg-red-50 border border-red-200 text-xs text-red-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-red-800">
                <FileText className="w-3.5 h-3.5 text-red-600" />
                Procédure Réglementaire d'Approvisionnement :
              </span>
              <p className="text-[11px] leading-relaxed">
                Toute sortie doit faire l’objet d’une <strong>demande d’expression de besoin</strong> du Responsable de Production adressée à l’Assistant pour <strong>validation</strong>. Le bon de sortie atteste la <strong>réception physique</strong>.
              </p>
            </div>

            <form onSubmit={handleSaveMpSortie} className="mt-4 space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={mpSortieForm.date}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={mpSortieForm.heure}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, heure: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              {/* 1. Demandeur : Responsable Production */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  1. Émetteur de l'Expression de Besoin :
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Responsable Production</label>
                    <input
                      type="text"
                      value={mpSortieForm.demandeurNom}
                      onChange={e => setMpSortieForm({ ...mpSortieForm, demandeurNom: e.target.value })}
                      placeholder="Ex: Amadou Bâ (Responsable Prod)"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Poste / Rôle</label>
                    <input
                      type="text"
                      value={mpSortieForm.demandeurPoste}
                      onChange={e => setMpSortieForm({ ...mpSortieForm, demandeurPoste: e.target.value })}
                      placeholder="Ex: Responsable de Production"
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité Demandée (kg)</label>
                  <input
                    type="number"
                    min="1"
                    max={stockActuelCartonKg}
                    value={mpSortieForm.quantiteKg}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, quantiteKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Dispo : {stockActuelCartonKg.toLocaleString()} kg exploitables
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift / Quart</label>
                  <select
                    value={mpSortieForm.shift}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, shift: e.target.value as ShiftType })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="MATIN_06H_14H">Matin (06h - 14h / 08h - 16h)</option>
                    <option value="SOIR_14H_22H">Soir (14h - 22h)</option>
                    <option value="NUIT_22H_06H">Nuit (22h - 06h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination / Ligne</label>
                  <input
                    type="text"
                    value={mpSortieForm.destinationLigne}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, destinationLigne: e.target.value })}
                    placeholder="Ligne 1 - Hydrapulpeur Shuliy"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif du Besoin</label>
                  <input
                    type="text"
                    value={mpSortieForm.motifSortie}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, motifSortie: e.target.value })}
                    placeholder="Alimentation pulpeur fabrication alvéoles"
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              {/* 2. Validation : Assistant Magasinier */}
              <div className="p-3 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-2">
                <span className="text-[10px] font-black text-blue-800 uppercase tracking-wider block">
                  2. Validation & Autorisation par l'Assistant :
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Assistant Magasinier (Validateur du Déstockage)</label>
                  <input
                    type="text"
                    value={mpSortieForm.magasinierNom}
                    onChange={e => setMpSortieForm({ ...mpSortieForm, magasinierNom: e.target.value })}
                    placeholder="Ex: Modou Faye (Assistant Magasinier)"
                    className="w-full text-xs p-2 rounded-xl border border-blue-300 font-bold bg-white"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-blue-950 font-bold">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Attestation de réception physique par le Responsable de Production incluse</span>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowMpSortieModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Valider & Générer Bon de Sortie PDF
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 4 : ENTRÉE ACHAT ADDITIF CHIMIQUE
          ══════════════════════════════════════════════════════════════════════ */}
      {showAdditifEntreeModal && currentAdditif && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-indigo-600 text-white font-black">
                  <Plus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Entrée Achat Additif Chimique</h3>
                  <p className="text-xs text-slate-500">{currentAdditif.nom} ({currentAdditif.reference})</p>
                </div>
              </div>
              <button onClick={() => setShowAdditifEntreeModal(false)} className="text-slate-400 p-2">✕</button>
            </div>

            <form onSubmit={handleSaveAdditifEntree} className="mt-4 space-y-4">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Fournisseur</label>
                  <input
                    type="text"
                    value={additifEntreeForm.fournisseurNom}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, fournisseurNom: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Pays de Provenance</label>
                  <input
                    type="text"
                    value={additifEntreeForm.paysProvenance}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, paysProvenance: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité ({currentAdditif.uniteMesure})</label>
                  <input
                    type="number"
                    min="1"
                    value={additifEntreeForm.quantite}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, quantite: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Prix Unitaire (FCFA)</label>
                  <input
                    type="number"
                    min="1"
                    value={additifEntreeForm.prixUnitaireFCFA}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, prixUnitaireFCFA: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Transport (FCFA)</label>
                  <input
                    type="number"
                    value={additifEntreeForm.fraisTransportFCFA}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, fraisTransportFCFA: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">N° Lot Fabricant</label>
                  <input
                    type="text"
                    value={additifEntreeForm.lotFabricant}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, lotFabricant: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Certificat Analyse / N° Facture</label>
                  <input
                    type="text"
                    value={additifEntreeForm.referenceFactureBL}
                    onChange={e => setAdditifEntreeForm({ ...additifEntreeForm, referenceFactureBL: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAdditifEntreeModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md"
                >
                  Enregistrer l'Entrée Additif
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 5 : SORTIE ADDITIF CHIMIQUE VERS PRODUCTION
          CONFORME AU SCHÉMA (PAGES 2 & 4 : MÊME RÈGLE DE SORTIE AVEC 2 SIGNATURES)
          ══════════════════════════════════════════════════════════════════════ */}
      {showAdditifSortieModal && currentAdditif && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-2xl bg-amber-600 text-white font-black">
                  <Minus className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900">Demande d'Expression de Besoin & Bon de Sortie Additif</h3>
                  <p className="text-xs text-slate-500">{currentAdditif.nom} (Dosage Cuve Homogénéisation)</p>
                </div>
              </div>
              <button onClick={() => setShowAdditifSortieModal(false)} className="text-slate-400 hover:text-slate-600 p-2">✕</button>
            </div>

            {/* Directive Officielle */}
            <div className="mt-3 p-3 rounded-2xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-1">
              <span className="font-bold flex items-center gap-1.5 text-[11px] uppercase tracking-wider text-amber-800">
                <FileText className="w-3.5 h-3.5 text-amber-600" />
                Directive Schéma (Page 4) :
              </span>
              <p className="text-[11px] leading-relaxed">
                Même règle pour la sortie de stock des additifs : Expression de besoin du Responsable Prod adressée à l'Assistant pour validation + attestation de réception.
              </p>
            </div>

            <form onSubmit={handleSaveAdditifSortie} className="mt-4 space-y-3.5">
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={additifSortieForm.date}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, date: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={additifSortieForm.heure}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, heure: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              {/* 1. Demandeur : Responsable Production */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 space-y-2">
                <span className="text-[10px] font-black text-slate-500 uppercase tracking-wider block">
                  1. Émetteur de l'Expression de Besoin :
                </span>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Responsable Production</label>
                    <input
                      type="text"
                      value={additifSortieForm.demandeurNom}
                      onChange={e => setAdditifSortieForm({ ...additifSortieForm, demandeurNom: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-600 mb-0.5">Poste / Rôle</label>
                    <input
                      type="text"
                      value={additifSortieForm.demandeurPoste}
                      onChange={e => setAdditifSortieForm({ ...additifSortieForm, demandeurPoste: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 font-medium"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">
                    Quantité Demandée ({currentAdditif.uniteMesure})
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={currentAdditif.stockActuel}
                    value={additifSortieForm.quantite}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, quantite: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-black text-slate-900"
                    required
                  />
                  <span className="text-[10px] text-slate-500 block mt-0.5">
                    Stock dispo : {currentAdditif.stockActuel} {currentAdditif.uniteMesure}
                  </span>
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift</label>
                  <select
                    value={additifSortieForm.shift}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, shift: e.target.value as ShiftType })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-bold"
                  >
                    <option value="MATIN_06H_14H">Matin (06h - 14h)</option>
                    <option value="SOIR_14H_22H">Soir (14h - 22h)</option>
                    <option value="NUIT_22H_06H">Nuit (22h - 06h)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Destination du Produit</label>
                  <input
                    type="text"
                    value={additifSortieForm.destination}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, destination: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Motif du Dosage / Besoin</label>
                  <input
                    type="text"
                    value={additifSortieForm.motifSortie}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, motifSortie: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-xl border border-slate-300 font-medium"
                    required
                  />
                </div>
              </div>

              {/* 2. Validation : Assistant Magasinier */}
              <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200 space-y-2">
                <span className="text-[10px] font-black text-amber-900 uppercase tracking-wider block">
                  2. Validation & Autorisation par l'Assistant :
                </span>
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 mb-0.5">Assistant Magasinier (Validateur du Déstockage)</label>
                  <input
                    type="text"
                    value={additifSortieForm.magasinierNom}
                    onChange={e => setAdditifSortieForm({ ...additifSortieForm, magasinierNom: e.target.value })}
                    placeholder="Ex: Modou Faye (Assistant Magasinier)"
                    className="w-full text-xs p-2 rounded-xl border border-amber-300 font-bold bg-white"
                    required
                  />
                </div>

                <div className="flex items-center gap-2 pt-1 text-xs text-amber-950 font-bold">
                  <CheckSquare className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Attestation de réception physique par le Responsable de Production incluse</span>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowAdditifSortieModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-black text-xs shadow-md flex items-center gap-1.5 transition-all active:scale-95"
                >
                  <Printer className="w-4 h-4" />
                  Valider & Générer Bon de Sortie PDF
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════════
          MODAL 6 : MODIFICATION DU PRIX UNITAIRE ADDITIF (SAISIE MANUELLE)
          ══════════════════════════════════════════════════════════════════════ */}
      {editingPriceAdditif && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <span className="p-2 rounded-xl bg-indigo-50 text-indigo-600 font-black">
                  <Sparkles className="w-4 h-4" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Ajuster le Coût Unitaire</h3>
                  <p className="text-xs text-slate-500">{editingPriceAdditif.nom}</p>
                </div>
              </div>
              <button onClick={() => setEditingPriceAdditif(null)} className="text-slate-400 p-2">✕</button>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                await db.rawMaterials.update(editingPriceAdditif.id, {
                  coutMoyenAchatFCFA: Number(newPriceValue)
                });
                await db.auditLogs.add({
                  id: `audit-price-${Date.now()}`,
                  timestamp: new Date().toISOString(),
                  userNom: 'Direction Usine',
                  userRole: 'RESPONSABLE_STOCK',
                  action: 'MODIFICATION_PRIX_ADDITIF',
                  entite: 'STOCK_ADDITIFS',
                  description: `Mise à jour manuelle du coût unitaire de ${editingPriceAdditif.nom} à ${newPriceValue} FCFA / ${editingPriceAdditif.uniteMesure || 'kg'}. Motif : ${motifPriceChange || 'Ajustement coût officiel'}`
                });
                setEditingPriceAdditif(null);
              }}
              className="mt-4 space-y-4"
            >
              <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-xs text-amber-900">
                <strong>Saisie manuelle :</strong> Vous pouvez renseigner et ajuster le coût unitaire dès que les coûts officiels sont disponibles. La valeur du stock sera mise à jour automatiquement.
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Nouveau Coût Unitaire (FCFA / {editingPriceAdditif.uniteMesure || editingPriceAdditif.unite || 'Kg'}) *
                </label>
                <input
                  type="number"
                  min="0"
                  step="1"
                  value={newPriceValue}
                  onChange={e => setNewPriceValue(Number(e.target.value))}
                  className="w-full text-sm font-black p-2.5 rounded-xl border border-indigo-300 focus:ring-2 focus:ring-indigo-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Motif / Référence de la facture
                </label>
                <input
                  type="text"
                  value={motifPriceChange}
                  onChange={e => setMotifPriceChange(e.target.value)}
                  placeholder="Ex: Facture définitive fournisseur reçue"
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300"
                />
              </div>

              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                <div className="flex justify-between py-1">
                  <span className="text-slate-500">Stock pré-commandé / actuel :</span>
                  <strong className="text-slate-900">{editingPriceAdditif.stockActuel} {editingPriceAdditif.uniteMesure || editingPriceAdditif.unite || 'Kg'}</strong>
                </div>
                <div className="flex justify-between py-1 border-t border-slate-100 mt-1 pt-1">
                  <span className="text-slate-500">Nouvelle valeur en stock :</span>
                  <strong className="text-emerald-700 font-black">{((editingPriceAdditif.stockActuel) * (newPriceValue || 0)).toLocaleString()} FCFA</strong>
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setEditingPriceAdditif(null)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shadow-md"
                >
                  Valider le Prix Officiel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
};
