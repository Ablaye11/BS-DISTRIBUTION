import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { 
  ProductionShiftRecord, ShiftType, ShiftValidationStatus,
  QualityControlRecord, MachineIncidentRecord, DefautQualiteType, IncidentNatureType
} from '../../types';
import { useTheme } from '../../context/ThemeContext';
import { ExportPdfButton } from '../../components/common/ExportPdfButton';
import { exportProductionPdf } from '../../services/pdfExport';
import { 
  Gauge, TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  Layers, Zap, Droplets, RefreshCw, Plus, Filter, Factory,
  BarChart3, Activity, Award, ShieldAlert, Check, X, Wrench, Bug, FileText,
  ClipboardList, Power, WashingMachine, ShieldCheck, AlertOctagon, Unlock, BookOpen,
  Calendar, CheckSquare, Search, ArrowRight, Eye, Shield, AlertCircle, Info, ChevronDown,
  Boxes, PackageCheck, Truck, Package
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line, PieChart, Pie, Cell
} from 'recharts';

export const ProductiviteModule: React.FC = () => {
  const { currentTheme } = useTheme();

  // ── Données Dexie réactives ─────────────────────────────────────────
  const shifts = useLiveQuery(() => db.productionShifts.orderBy('date').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];
  const qualityControls = useLiveQuery(() => db.qualityControls.orderBy('date').reverse().toArray()) || [];
  const machineIncidents = useLiveQuery(() => db.machineIncidents.orderBy('date').reverse().toArray()) || [];
  const factorySettingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const factorySettings = factorySettingsList[0];
  const stockMovements = useLiveQuery(() => db.stockMovements.orderBy('date').reverse().limit(40).toArray()) || [];

  // ── Navigation entre onglets du Module 2 ───────────────────────────
  type TabType = 'SUIVI_JOURNALIER' | 'PRODUITS_FINIS' | 'QUALITE_DEFAUTS' | 'INCIDENTS_ARRETS' | 'INDICATEURS_AUTO' | 'CHECKLISTS_A21' | 'GUIDE_UTILISATION' | 'MAINTENANCE_PREV';
  const [activeTab, setActiveTab] = useState<TabType>('SUIVI_JOURNALIER');

  // ── Maintenance Préventive : Compteurs d'heures machines ────────────
  const [heuresMoules, setHeuresMoules] = useState<number>(() => {
    const saved = localStorage.getItem('bs_heures_moules');
    return saved ? Number(saved) : 0;
  });
  const [heuresTamis, setHeuresTamis] = useState<number>(() => {
    const saved = localStorage.getItem('bs_heures_tamis');
    return saved ? Number(saved) : 0;
  });
  const [checklistDimanche, setChecklistDimanche] = useState<Record<string, boolean>>({
    graissageRoulements: false,
    nettoyageBusePate: false,
    detartrageBruleur: false,
    controleGrilesVacuum: false,
    verificationCourrois: false,
    vidangeCircuitEau: false,
    controlePressingOrganes: false,
    signatureChefEquipe: false,
  });
  const [maintenanceNotes, setMaintenanceNotes] = useState('');

  // ── Paramètres industriels de référence (1 Shift de 8h avec 1h de pause • Lundi au Samedi) ────
  const CADENCE_NOMINALE = factorySettings?.cadenceNominale || 2000; // 2 000 alvéoles/h
  const TAUX_RENDEMENT_CIBLE = factorySettings?.tauxRendementRetenu || 85; // 85%
  const CADENCE_REELLE_CIBLE = factorySettings?.cadenceReelleCible || 1700; // 1 700 alvéoles/h
  // Organisation usine : 1 Seul Shift de 8h avec 1h de pause du Lundi au Samedi (6j/semaine)
  const DUREE_SHIFT_BRUTE = 8; // 8 heures de présence totale
  const PAUSE_SHIFT_HEURES = 1; // 1 heure de pause obligatoire
  const HEURES_MACHINE_NETTES = DUREE_SHIFT_BRUTE - PAUSE_SHIFT_HEURES; // 7 heures nettes de travail machine
  const HEURES_SHIFT_REF = HEURES_MACHINE_NETTES; // 7 heures nettes de production par jour
  const RENDEMENT_MATIERE_REF = factorySettings?.rendementMatiereAlvParKg || 35; // 35 alv/kg
  const CIBLE_JOUR = CADENCE_REELLE_CIBLE * HEURES_MACHINE_NETTES; // 1 700 * 7 = 11 900 alvéoles/jour
  const CIBLE_SEMAINE = CIBLE_JOUR * 6; // 6 jours du lundi au samedi = 71 400 alvéoles/semaine
  const CIBLE_MOIS = CIBLE_JOUR * (factorySettings?.joursProductionParMois || 26); // 26 jours = 309 400 alvéoles/mois

  // ── Filtres de liste ────────────────────────────────────────────────
  const todayStr = useMemo(() => new Date().toISOString().split('T')[0], []);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('TOUS');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<string>('TOUS');

  // ── Modals d'actions ────────────────────────────────────────────────
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [showQCModal, setShowQCModal] = useState(false);
  const [showIncidentModal, setShowIncidentModal] = useState(false);
  const [viewingShift, setViewingShift] = useState<ProductionShiftRecord | null>(null);

  // ── Formulaire Nouvelle Fiche de Production Journalière (CDC 5.1 & 5.2) ──
  const [newShift, setNewShift] = useState<{
    date: string;
    shift: ShiftType;
    ligneProduction: string;
    responsableShift: string;
    produitId: string;
    heureDemarrage: string;
    heureArret: string;
    heuresPlanifiees: number;
    heuresPause: number;
    heuresArret: number;
    natureArret: string;
    motifArret: string;
    quantiteTotaleFabriquee: number;
    quantiteConforme: number;
    quantiteNonConforme: number;
    quantiteMiseEnRebut: number;
    quantiteReutilisable: number;
    papierCartonConsommeKg: number;
    observations: string;
    derogationAccordee: boolean;
    motifDerogation: string;
  }>({
    date: todayStr,
    shift: 'MATIN_06H_14H',
    ligneProduction: 'Ligne Unique - Chaîne Shuliy Machinery 4 Faces (3 000 alv/h max)',
    responsableShift: 'Amadou Bâ (Chef d\'Équipe Unique)',
    produitId: products[0]?.id || 'prod-alv-30-std',
    heureDemarrage: '08:00',
    heureArret: '16:00',
    heuresPlanifiees: 8,
    heuresPause: 1,
    heuresArret: 0,
    natureArret: 'AUCUN',
    motifArret: '',
    quantiteTotaleFabriquee: 11900,
    quantiteConforme: 11550,
    quantiteNonConforme: 350,
    quantiteMiseEnRebut: 350,
    quantiteReutilisable: 0,
    papierCartonConsommeKg: 340,
    observations: 'Shift Unique 8h (Pause 1h - Lundi au Samedi). Équipe Unique & Ligne Unique Shuliy.',
    derogationAccordee: false,
    motifDerogation: ''
  });

  const [formError, setFormError] = useState<string | null>(null);

  // Calculs dynamiques : 8h présence totale - 1h de pause obligatoire - arrêts machines imprévus
  const shiftHeuresMachineDispo = Math.max(0, (newShift.heuresPlanifiees || 8) - (newShift.heuresPause || 1));
  const shiftHeuresFonc = Math.max(0.1, Number((shiftHeuresMachineDispo - (newShift.heuresArret || 0)).toFixed(2)));
  const shiftProductionTheoriqueAttendue = Math.round(CADENCE_REELLE_CIBLE * shiftHeuresFonc);
  
  // Règle de cohérence 5.2 : Production totale = Conforme + Non conforme
  const sommeConformeNonConforme = (Number(newShift.quantiteConforme) || 0) + (Number(newShift.quantiteNonConforme) || 0);
  const isCoherenceQuantites = Number(newShift.quantiteTotaleFabriquee) === sommeConformeNonConforme;
  const isConformeInferieurTotal = (Number(newShift.quantiteConforme) || 0) <= (Number(newShift.quantiteTotaleFabriquee) || 0);
  const sommeRebutsReutilisable = (Number(newShift.quantiteMiseEnRebut) || 0) + (Number(newShift.quantiteReutilisable) || 0);
  const isCoherenceNonConforme = Number(newShift.quantiteNonConforme) === sommeRebutsReutilisable;

  const formTauxRebut = (Number(newShift.quantiteTotaleFabriquee) || 0) > 0
    ? Number((((Number(newShift.quantiteNonConforme) || 0) / (Number(newShift.quantiteTotaleFabriquee) || 1)) * 100).toFixed(2))
    : 0;

  const formStatutRebut: 'VERT' | 'ORANGE' | 'ROUGE' = 
    formTauxRebut <= 3 ? 'VERT' : formTauxRebut <= 5 ? 'ORANGE' : 'ROUGE';

  const formCadenceReelle = shiftHeuresFonc > 0
    ? Math.round((Number(newShift.quantiteTotaleFabriquee) || 0) / shiftHeuresFonc)
    : 0;

  const formRendementMatiere = (Number(newShift.papierCartonConsommeKg) || 0) > 0
    ? Number(((Number(newShift.quantiteTotaleFabriquee) || 0) / (Number(newShift.papierCartonConsommeKg) || 1)).toFixed(1))
    : 0;

  // Jeux d'essai CDC adaptés au Shift Unique 8h (avec 1h de pause = 7h nettes)
  const applyScenarioTest1 = () => {
    setNewShift(prev => ({
      ...prev,
      heuresPlanifiees: 8,
      heuresPause: 1,
      heuresArret: 0,
      quantiteTotaleFabriquee: 11900,
      quantiteConforme: 11550,
      quantiteNonConforme: 350,
      quantiteMiseEnRebut: 350,
      quantiteReutilisable: 0,
      papierCartonConsommeKg: 340,
      observations: 'Scénario Test 1 : Shift unique 8h (1h pause). 11 900 totaux (7h x 1 700 alv/h), 11 550 conformes, 350 rebuts (Taux: 2.94% - Vert).'
    }));
    setFormError(null);
  };

  const applyScenarioTest2 = () => {
    setNewShift(prev => ({
      ...prev,
      heuresPlanifiees: 8,
      heuresPause: 1,
      heuresArret: 0.5,
      motifArret: 'Nettoyage buses séchoir (30 min)',
      quantiteTotaleFabriquee: 11050,
      quantiteConforme: 10150,
      quantiteNonConforme: 900,
      quantiteMiseEnRebut: 900,
      quantiteReutilisable: 0,
      papierCartonConsommeKg: 325,
      observations: 'Scénario Test 2 : 6.5h effectives. Rebut critique 8.14% (> 5% Rouge). Dérive séchoir tunnel.'
    }));
    setFormError(null);
  };

  // ── Sauvegarde et cycle de validation (CDC 5.1 & 5.2) ──────────────
  const handleSaveShift = async (targetStatus: 'BROUILLON' | 'SOUMIS_VALIDATION' | 'VALIDE') => {
    setFormError(null);

    const total = Number(newShift.quantiteTotaleFabriquee) || 0;
    const conforme = Number(newShift.quantiteConforme) || 0;
    const nonConforme = Number(newShift.quantiteNonConforme) || 0;
    const papierKg = Number(newShift.papierCartonConsommeKg) || Math.round(total / 35);

    // Contrôles de cohérence stricts (CDC Section 5.2)
    if (targetStatus === 'VALIDE' || targetStatus === 'SOUMIS_VALIDATION') {
      if (total <= 0) {
        setFormError('La quantité totale fabriquée doit être supérieure à 0.');
        return;
      }
      if (conforme > total) {
        setFormError(`La quantité conforme (${conforme}) ne peut pas dépasser la quantité totale fabriquée (${total}).`);
        return;
      }
      if (total !== (conforme + nonConforme) && !newShift.derogationAccordee) {
        setFormError(`Incohérence des quantités : Total (${total}) ≠ Conforme (${conforme}) + Non Conforme (${nonConforme}). Cochez Dérogation avec motif si autorisé.`);
        return;
      }
      if (newShift.derogationAccordee && !newShift.motifDerogation.trim()) {
        setFormError('Un motif de dérogation détaillé est strictement obligatoire avant validation (Section 5.2 du CDC).');
        return;
      }
    }

    const reportId = `RAP-PROD-${newShift.date.replace(/-/g, '')}-${Math.floor(100 + Math.random() * 900)}`;
    const prod = products.find(p => p.id === newShift.produitId) || products[0];
    const fardeaux = Math.floor(conforme / (prod?.quantiteParFardeau || 100));
    const cadenceReelle = Math.round(total / shiftHeuresFonc);
    const dispo = Number(((shiftHeuresFonc / (shiftHeuresMachineDispo || 7)) * 100).toFixed(1));
    const perf = Number(((cadenceReelle / CADENCE_REELLE_CIBLE) * 100).toFixed(1));
    const qualite = Number(((conforme / (total || 1)) * 100).toFixed(1));
    const trs = Number(((dispo * perf * qualite) / 10000).toFixed(1));
    const rebutsKg = Number(((nonConforme * 68) / 1000).toFixed(1));

    let statutQC: 'CONFORME' | 'SOUS_SURVEILLANCE' | 'NON_CONFORME' = 'CONFORME';
    if (formStatutRebut === 'ORANGE') statutQC = 'SOUS_SURVEILLANCE';
    if (formStatutRebut === 'ROUGE') statutQC = 'NON_CONFORME';

    const record: ProductionShiftRecord = {
      id: reportId,
      numeroRapport: reportId,
      date: newShift.date,
      shift: newShift.shift,
      ligneProduction: newShift.ligneProduction,
      responsableShift: newShift.responsableShift,
      produitId: prod?.id || 'prod-alv-30-std',
      produitNom: prod?.nom || 'Plateau 30 Œufs',
      heureDemarrage: newShift.heureDemarrage,
      heureArret: newShift.heureArret,
      heuresPlanifiees: newShift.heuresPlanifiees,
      heuresPause: newShift.heuresPause,
      heuresFonctionnement: shiftHeuresFonc,
      heuresArret: Number(newShift.heuresArret) || 0,
      motifArret: newShift.motifArret,
      cadenceTheorique: CADENCE_NOMINALE,
      cadenceCible: CADENCE_REELLE_CIBLE,
      tauxRendementCible: TAUX_RENDEMENT_CIBLE,
      quantiteTheoriqueAttendue: shiftProductionTheoriqueAttendue,
      quantiteTotaleFabriquee: total,
      alvéolesConformes: conforme,
      quantiteNonConforme: nonConforme,
      quantiteMiseEnRebut: Number(newShift.quantiteMiseEnRebut) || 0,
      quantiteReutilisable: Number(newShift.quantiteReutilisable) || 0,
      fardeauxEmballes: fardeaux,
      rebutsKilos: rebutsKg,
      rebutsPourcentage: formTauxRebut,
      papierCartonConsommeKg: papierKg,
      adjuvantKg: 35,
      energieKwh: 350,
      eauRecycleeM3: 18,
      cadenceHoraireReelle: cadenceReelle,
      tauxDisponibilite: dispo,
      tauxPerformance: perf,
      tauxQualite: qualite,
      trsOEE: trs,
      ratioKgPar1000Alveoles: Number(((papierKg / (conforme || 1)) * 1000).toFixed(1)),
      rendementMatiereAlvParKg: formRendementMatiere,
      realisationCiblePourcent: Math.round((conforme / (shiftProductionTheoriqueAttendue || 1)) * 100),
      ecartProductionAlveoles: conforme - shiftProductionTheoriqueAttendue,
      statutValidation: targetStatus,
      validePar: targetStatus === 'VALIDE' ? newShift.responsableShift : undefined,
      dateValidation: targetStatus === 'VALIDE' ? new Date().toISOString() : undefined,
      derogationAccordee: newShift.derogationAccordee,
      motifDerogation: newShift.motifDerogation,
      statutControleQualite: statutQC,
      observations: newShift.observations
    };

    await db.productionShifts.add(record);

    // Si VALIDÉ : Alimentation automatique du stock de produits finis et déduction matière (CDC Section 5.1 in fine)
    if (targetStatus === 'VALIDE') {
      if (prod && conforme > 0) {
        await db.alveoleProducts.update(prod.id, {
          stockFardeaux: prod.stockFardeaux + fardeaux,
          stockTotalUnites: prod.stockTotalUnites + conforme
        });

        await db.stockMovements.add({
          id: `mvt-pf-${Date.now()}`,
          date: newShift.date,
          type: 'ENTREE_PRODUCTION_PF',
          articleType: 'PRODUIT_FINI',
          articleId: prod.id,
          articleNom: prod.nom,
          quantite: fardeaux,
          unite: 'Fardeau (100)',
          responsable: newShift.responsableShift,
          motif: `Entrée production validée ${reportId}`
        });
      }

      // Déduction du papier carton consommé
      const mpCarton = await db.rawMaterials.where('categorie').equals('PAPIER_CARTON').first();
      if (mpCarton && papierKg > 0) {
        await db.rawMaterials.update(mpCarton.id, {
          stockActuel: Math.max(0, mpCarton.stockActuel - papierKg)
        });

        await db.stockMovements.add({
          id: `mvt-mp-${Date.now()}`,
          date: newShift.date,
          type: 'SORTIE_PULPEUR',
          articleType: 'MATIERE_PREMIERE',
          articleId: mpCarton.id,
          articleNom: mpCarton.nom,
          quantite: papierKg,
          unite: 'Kg',
          responsable: newShift.responsableShift,
          motif: `Consommation pulpeur rapport ${reportId}`
        });
      }
    }

    // Traçabilité Audit Log (Règle CDC)
    await db.auditLogs.add({
      id: `audit-prod-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: newShift.responsableShift,
      userRole: 'RESPONSABLE_PRODUCTION',
      action: targetStatus === 'VALIDE' ? 'VALIDATION_FICHE_PRODUCTION' : 'CREATION_FICHE_PRODUCTION',
      entite: 'PRODUCTION',
      description: `Rapport ${reportId} enregistré au statut ${targetStatus}. ${conforme} conformes, ${nonConforme} non conformes (${formTauxRebut}% rebut).`
    });

    setShowShiftModal(false);
  };

  // Validation d'une fiche existante depuis la liste
  const handleValidateExistingShift = async (shift: ProductionShiftRecord) => {
    const prod = products.find(p => p.id === shift.produitId) || products[0];
    const conforme = shift.alvéolesConformes;
    const fardeaux = Math.floor(conforme / (prod?.quantiteParFardeau || 100));
    const papierKg = shift.papierCartonConsommeKg;

    await db.productionShifts.update(shift.id, {
      statutValidation: 'VALIDE',
      validePar: 'Direction Production',
      dateValidation: new Date().toISOString()
    });

    if (prod && conforme > 0) {
      await db.alveoleProducts.update(prod.id, {
        stockFardeaux: prod.stockFardeaux + fardeaux,
        stockTotalUnites: prod.stockTotalUnites + conforme
      });
      await db.stockMovements.add({
        id: `mvt-pf-${Date.now()}`,
        date: shift.date,
        type: 'ENTREE_PRODUCTION_PF',
        articleType: 'PRODUIT_FINI',
        articleId: prod.id,
        articleNom: prod.nom,
        quantite: fardeaux,
        unite: 'Fardeau (100)',
        responsable: 'Direction Production',
        motif: `Validation a posteriori rapport ${shift.id}`
      });
    }

    if (papierKg > 0) {
      const mpCarton = await db.rawMaterials.where('categorie').equals('PAPIER_CARTON').first();
      if (mpCarton) {
        await db.rawMaterials.update(mpCarton.id, {
          stockActuel: Math.max(0, mpCarton.stockActuel - papierKg)
        });
      }
    }

    await db.auditLogs.add({
      id: `audit-val-${Date.now()}`,
      timestamp: new Date().toISOString(),
      userNom: 'Direction Production',
      userRole: 'RESPONSABLE_PRODUCTION',
      action: 'VALIDATION_FICHE_PRODUCTION',
      entite: 'PRODUCTION',
      description: `Validation officielle de la fiche ${shift.id} : ${conforme} conformes intégrés au stock.`
    });
  };

  // ── Formulaire Contrôle Qualité (CDC 5.4) ──────────────────────────
  const [newQC, setNewQC] = useState<{
    date: string;
    heure: string;
    rapportProductionId: string;
    produitId: string;
    quantiteControlee: number;
    quantiteConforme: number;
    quantiteRejetee: number;
    typeDefaut: DefautQualiteType;
    detailsDefaut: string;
    causeProbable: string;
    actionCorrective: string;
    responsableControle: string;
    statutResolution: 'OUVERT' | 'EN_COURS' | 'CORRIGE' | 'CLOTURE';
  }>({
    date: todayStr,
    heure: '10:00',
    rapportProductionId: shifts[0]?.id || '',
    produitId: products[0]?.id || 'prod-alv-30-std',
    quantiteControlee: 500,
    quantiteConforme: 485,
    quantiteRejetee: 15,
    typeDefaut: 'SURFACE_IRREGULIERE',
    detailsDefaut: '',
    causeProbable: 'Fibre carton recyclé hétérogène en entrée de pulpeur',
    actionCorrective: 'Raffinage prolongé et contrôle visuel des grilles',
    responsableControle: 'Contrôleur Qualité Ligne 1',
    statutResolution: 'CORRIGE'
  });

  const handleSaveQC = async (e: React.FormEvent) => {
    e.preventDefault();
    const tauxRebut = newQC.quantiteControlee > 0 
      ? Number(((newQC.quantiteRejetee / newQC.quantiteControlee) * 100).toFixed(2))
      : 0;
    const statutSeuil = tauxRebut <= 3 ? 'VERT' : tauxRebut <= 5 ? 'ORANGE' : 'ROUGE';
    const prod = products.find(p => p.id === newQC.produitId);

    const record: QualityControlRecord = {
      id: `QC-${Date.now()}`,
      numeroControle: `QC-${newQC.date.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      date: newQC.date,
      heure: newQC.heure,
      rapportProductionId: newQC.rapportProductionId,
      produitId: newQC.produitId,
      produitNom: prod?.nom || 'Alvéole 30 Œufs',
      quantiteControlee: Number(newQC.quantiteControlee),
      quantiteConforme: Number(newQC.quantiteConforme),
      quantiteRejetee: Number(newQC.quantiteRejetee),
      tauxRebut,
      statutSeuil,
      typeDefaut: newQC.typeDefaut,
      detailsDefaut: newQC.detailsDefaut,
      causeProbable: newQC.causeProbable,
      actionCorrective: newQC.actionCorrective,
      responsableControle: newQC.responsableControle,
      statutResolution: newQC.statutResolution
    };

    await db.qualityControls.add(record);
    setShowQCModal(false);
  };

  // ── Formulaire Fiche Incident Machine (CDC 5.5) ────────────────────
  const [newIncident, setNewIncident] = useState<{
    date: string;
    heureDebut: string;
    heureFin: string;
    equipementConcerne: string;
    natureIncident: IncidentNatureType;
    causeIdentifiee: string;
    mesuresPrises: string;
    recoursAssistanceExterieure: boolean;
    prestataireNom: string;
    impactProductionAlveoles: number;
    responsableResolution: string;
    statutCloture: 'EN_COURS' | 'RESOLU' | 'CLOTURE';
  }>({
    date: todayStr,
    heureDebut: '09:00',
    heureFin: '09:35',
    equipementConcerne: 'Mouleuse Rotative 4 Faces',
    natureIncident: 'BLOCAGE_MACHINE',
    causeIdentifiee: 'Bourrage de pâte sous les buses d\'aspiration',
    mesuresPrises: 'Arrêt immédiat, nettoyage à l\'eau pressurisée et redémarrage',
    recoursAssistanceExterieure: false,
    prestataireNom: '',
    impactProductionAlveoles: 950,
    responsableResolution: 'Amadou Bâ (Chef de Quart)',
    statutCloture: 'CLOTURE'
  });

  const handleSaveIncident = async (e: React.FormEvent) => {
    e.preventDefault();
    // Calcul de la durée en minutes et heures
    const [hD, mD] = newIncident.heureDebut.split(':').map(Number);
    const [hF, mF] = newIncident.heureFin.split(':').map(Number);
    const minutes = Math.max(1, (hF * 60 + mF) - (hD * 60 + mD));
    const heures = Number((minutes / 60).toFixed(2));

    const record: MachineIncidentRecord = {
      id: `INC-${Date.now()}`,
      numeroIncident: `INC-${newIncident.date.replace(/-/g, '')}-${Math.floor(10 + Math.random() * 90)}`,
      date: newIncident.date,
      heureDebut: newIncident.heureDebut,
      heureFin: newIncident.heureFin,
      dureeArretMinutes: minutes,
      dureeArretHeures: heures,
      equipementConcerne: newIncident.equipementConcerne,
      natureIncident: newIncident.natureIncident,
      causeIdentifiee: newIncident.causeIdentifiee,
      mesuresPrises: newIncident.mesuresPrises,
      recoursAssistanceExterieure: newIncident.recoursAssistanceExterieure,
      prestataireNom: newIncident.prestataireNom,
      impactProductionAlveoles: Number(newIncident.impactProductionAlveoles),
      responsableResolution: newIncident.responsableResolution,
      statutCloture: newIncident.statutCloture
    };

    await db.machineIncidents.add(record);
    setShowIncidentModal(false);
  };

  // ── Procédures A.2.1 ───────────────────────────────────────────────
  const [checkDemarrage, setCheckDemarrage] = useState({
    alimentationElectrique: true,
    arriveeEau: true,
    pulpeurPropre: true,
    moulesPositionnes: true,
    sechoirVide: true,
    epiPortes: true,
    autorisationChefEquipe: true,
    chefEquipeNom: 'Amadou Bâ',
    heureAutorisation: '05:55'
  });
  const [checkDescente, setCheckDescente] = useState({
    arretProgressifMachines: true,
    vidangePartiellePulpeur: true,
    nettoyageImmediat: true,
    coupureElectriqueGenerale: true,
    verrouillagesLocaux: true,
    rapportJournalierRempli: true,
    validePar: 'Amadou Bâ',
    heureDescente: '14:05'
  });

  // ── 5.6 Indicateurs Automatisés (Journalier / Hebdo / Mensuel) ─────
  type TimeScale = 'JOUR' | 'SEMAINE' | 'MOIS';
  const [kpiScale, setKpiScale] = useState<TimeScale>('JOUR');

  const kpiData = useMemo(() => {
    let dataset = shifts.filter(s => s.statutValidation === 'VALIDE' || !s.statutValidation);

    if (kpiScale === 'JOUR') {
      dataset = dataset.filter(s => s.date === todayStr);
    } else if (kpiScale === 'SEMAINE') {
      const d = new Date();
      d.setDate(d.getDate() - 7);
      const minDate = d.toISOString().split('T')[0];
      dataset = dataset.filter(s => s.date >= minDate);
    } else {
      const monthPrefix = todayStr.slice(0, 7);
      dataset = dataset.filter(s => s.date.startsWith(monthPrefix));
    }

    const prodReelle = dataset.reduce((sum, s) => sum + s.alvéolesConformes, 0);
    const nonConforme = dataset.reduce((sum, s) => sum + (s.quantiteNonConforme || Math.round(s.alvéolesConformes * 0.03)), 0);
    const prodTotale = prodReelle + nonConforme;
    const papierKg = dataset.reduce((sum, s) => sum + s.papierCartonConsommeKg, 0);
    const heuresEffectives = dataset.reduce((sum, s) => sum + s.heuresFonctionnement, 0);
    const heuresPlanifiees = dataset.reduce((sum, s) => sum + s.heuresPlanifiees, 0) || (heuresEffectives || 8);
    const heuresArret = dataset.reduce((sum, s) => sum + s.heuresArret, 0);

    const cadenceReelle = heuresEffectives > 0 ? Math.round(prodTotale / heuresEffectives) : CADENCE_REELLE_CIBLE;
    const tauxRebut = prodTotale > 0 ? Number(((nonConforme / prodTotale) * 100).toFixed(2)) : 0;
    const rendementMatiere = papierKg > 0 ? Number((prodReelle / papierKg).toFixed(1)) : RENDEMENT_MATIERE_REF;
    const disponibilite = heuresPlanifiees > 0 ? Number((((heuresPlanifiees - heuresArret) / heuresPlanifiees) * 100).toFixed(1)) : 100;
    
    const prodCible = kpiScale === 'JOUR' ? CIBLE_JOUR : kpiScale === 'SEMAINE' ? (CIBLE_JOUR * 6) : CIBLE_MOIS;
    const realisationCible = Math.min(150, Math.round((prodReelle / (prodCible || 1)) * 100));
    const ecartProduction = prodReelle - prodCible;

    return {
      prodReelle,
      prodTotale,
      nonConforme,
      heuresEffectives,
      heuresArret,
      cadenceReelle,
      tauxRebut,
      rendementMatiere,
      disponibilite,
      prodCible,
      realisationCible,
      ecartProduction
    };
  }, [shifts, kpiScale, todayStr, CIBLE_JOUR, CIBLE_MOIS, CADENCE_REELLE_CIBLE, RENDEMENT_MATIERE_REF]);

  // Filtrage liste des shifts
  const filteredShifts = useMemo(() => {
    return shifts.filter(s => {
      const matchShift = selectedShiftFilter === 'TOUS' || s.shift === selectedShiftFilter;
      const matchStatus = selectedStatusFilter === 'TOUS' || 
                          (s.statutValidation || 'VALIDE') === selectedStatusFilter;
      return matchShift && matchStatus;
    });
  }, [shifts, selectedShiftFilter, selectedStatusFilter]);

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      
      {/* ══════════════════════════════════════════════════════════════════
          BANNIÈRE PRINCIPALE DU MODULE 2
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-5 sm:p-7 rounded-3xl text-white shadow-xl border border-slate-700/60 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            <span className="px-3 py-1 rounded-full text-xs font-black bg-emerald-500 text-slate-950 flex items-center gap-1.5 shadow-sm">
              <Factory className="w-3.5 h-3.5" />
              MODULE 2 • PRODUCTION & CONTRÔLE QUALITÉ
            </span>
            <span className="text-xs text-slate-300 font-medium">
              Norme de référence : <strong>1 700 alv/h</strong> • Rendement : <strong>35 alv/kg</strong>
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
            Atelier de Fabrication & Assurance Qualité
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
            Fiches de production journalières avec règles de cohérence strictes, gestion des défauts selon la typologie CDC, fiches d'incidents machines et indicateurs industriels automatisés.
          </p>
        </div>

        <div className="relative z-10 flex flex-wrap items-center gap-2.5">
          <ExportPdfButton onExport={() => exportProductionPdf(currentTheme.hex)} />
          <button
            onClick={() => {
              applyScenarioTest1();
              setShowShiftModal(true);
            }}
            className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md active:scale-95 flex items-center gap-1.5 shrink-0"
          >
            <Plus className="w-4 h-4" />
            Nouvelle Fiche de Production
          </button>
        </div>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          ONGLETS DU MODULE 2 (CONFORMES AU CDC)
          ══════════════════════════════════════════════════════════════════ */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2 overflow-x-auto scrollbar-none flex-nowrap">
        <button
          onClick={() => setActiveTab('SUIVI_JOURNALIER')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'SUIVI_JOURNALIER'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Factory className="w-4 h-4" />
          5.1 Fiches de Production
        </button>

        <button
          onClick={() => setActiveTab('PRODUITS_FINIS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'PRODUITS_FINIS'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-blue-50 text-blue-900 hover:bg-blue-100 border border-blue-200'
          }`}
        >
          <Boxes className="w-4 h-4" />
          5.2 Produits Finis Sortie Usine ({products.length})
        </button>

        <button
          onClick={() => setActiveTab('QUALITE_DEFAUTS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'QUALITE_DEFAUTS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          5.4 Contrôle Qualité & Défauts
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {qualityControls.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INCIDENTS_ARRETS')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'INCIDENTS_ARRETS'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          5.5 Incidents & Arrêts Machine
          <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-100 text-slate-700">
            {machineIncidents.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('INDICATEURS_AUTO')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'INDICATEURS_AUTO'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Activity className="w-4 h-4" />
          5.6 Indicateurs Automatisés
        </button>

        <button
          onClick={() => setActiveTab('CHECKLISTS_A21')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'CHECKLISTS_A21'
              ? 'bg-emerald-700 text-white shadow-md'
              : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
          }`}
        >
          <ClipboardList className="w-4 h-4" />
          Procédures A.2.1
        </button>

        <button
          onClick={() => setActiveTab('GUIDE_UTILISATION')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'GUIDE_UTILISATION'
              ? 'bg-amber-500 text-slate-950 shadow-md'
              : 'bg-amber-50 text-amber-900 hover:bg-amber-100 border border-amber-200'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          Guide & Cycle de Validation
        </button>

        <button
          onClick={() => setActiveTab('MAINTENANCE_PREV')}
          className={`px-4 py-2.5 rounded-2xl text-xs font-black transition-all shrink-0 flex items-center gap-2 ${
            activeTab === 'MAINTENANCE_PREV'
              ? 'bg-orange-600 text-white shadow-md'
              : 'bg-orange-50 text-orange-900 hover:bg-orange-100 border border-orange-200'
          }`}
        >
          <Wrench className="w-4 h-4" />
          🔧 Maintenance Préventive
        </button>
      </div>

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 1 : 5.1 FICHES DE PRODUCTION & RÈGLES DE COHÉRENCE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'SUIVI_JOURNALIER' && (
        <div className="space-y-6">
          
          {/* Barre d'information organisation & filtres */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold text-slate-500">Organisation usine :</span>
              <div className="px-3 py-1.5 bg-amber-50 border border-amber-300/80 rounded-xl text-xs font-bold text-amber-950 flex flex-wrap items-center gap-2 shadow-xs">
                <span className="font-black text-amber-900">⭐ 1 Seul Shift (8h • Pause 1h)</span>
                <span className="text-amber-400">•</span>
                <span>1 Seule Équipe</span>
                <span className="text-amber-400">•</span>
                <span>1 Seule Ligne Shuliy</span>
                <span className="text-amber-400">•</span>
                <span className="text-slate-700">Du Lundi au Samedi</span>
              </div>

              <select
                value={selectedStatusFilter}
                onChange={e => setSelectedStatusFilter(e.target.value)}
                className="px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-xl text-xs font-bold text-slate-700"
              >
                <option value="TOUS">Tous les Statuts</option>
                <option value="VALIDE">Validés (En stock)</option>
                <option value="SOUMIS_VALIDATION">Soumis à Validation</option>
                <option value="BROUILLON">Brouillons provisoires</option>
              </select>
            </div>

            <div className="text-xs text-slate-500 font-semibold">
              {filteredShifts.length} fiche(s) de production enregistrée(s)
            </div>
          </div>

          {/* Liste des Fiches de Production Journalière */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Rapport & Date</th>
                    <th className="py-3 px-4">Équipe / Poste</th>
                    <th className="py-3 px-4">Temps Fonc. / Arrêt</th>
                    <th className="py-3 px-4">Total Fabriqué</th>
                    <th className="py-3 px-4">Conformes (Lots)</th>
                    <th className="py-3 px-4">Rebuts / Taux</th>
                    <th className="py-3 px-4">Cadence Réelle</th>
                    <th className="py-3 px-4">Statut Validation</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShifts.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
                        Aucun rapport de production ne correspond aux filtres.
                      </td>
                    </tr>
                  ) : (
                    filteredShifts.map(s => {
                      const statut = s.statutValidation || 'VALIDE';
                      const taux = s.rebutsPourcentage || 0;
                      return (
                        <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-bold text-slate-900">
                            <div>{s.numeroRapport || s.id}</div>
                            <div className="text-[10px] text-slate-400 font-normal">{s.date}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900">
                              Shift Unique 8h
                            </span>
                            <div className="text-[10px] text-amber-700 font-bold">Pause 1h • Équipe Unique</div>
                            <div className="text-[10px] text-slate-500">{s.responsableShift || 'Chef d\'équipe'}</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-slate-900">{s.heuresFonctionnement}h effectives</span>
                            <div className="text-[10px] text-slate-400">sur {s.heuresPlanifiees || 8}h ({s.heuresPause ?? 1}h pause)</div>
                            {s.heuresArret > 0 && (
                              <div className="text-[10px] text-red-600 font-semibold">
                                {s.heuresArret}h arrêt ({s.motifArret || 'Non précisé'})
                              </div>
                            )}
                          </td>
                          <td className="py-3 px-4 font-black text-slate-900">
                            {(s.quantiteTotaleFabriquee || s.alvéolesConformes).toLocaleString()} alv.
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-black text-emerald-700">{s.alvéolesConformes.toLocaleString()} alv.</span>
                            <div className="text-[10px] text-slate-500">{s.fardeauxEmballes} fardeaux (100)</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                              taux <= 3 ? 'bg-emerald-100 text-emerald-800' :
                              taux <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                            }`}>
                              {taux}% ({s.quantiteNonConforme || Math.round(s.alvéolesConformes * 0.03)} alv)
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`font-black ${s.cadenceHoraireReelle >= CADENCE_REELLE_CIBLE ? 'text-indigo-700' : 'text-amber-700'}`}>
                              {s.cadenceHoraireReelle} alv/h
                            </span>
                            <div className="text-[10px] text-slate-400">Cible: 1 700</div>
                          </td>
                          <td className="py-3 px-4">
                            <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black uppercase tracking-wider ${
                              statut === 'VALIDE' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                              statut === 'SOUMIS_VALIDATION' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                              'bg-slate-100 text-slate-700 border border-slate-200'
                            }`}>
                              {statut === 'VALIDE' ? '✓ Validé' :
                               statut === 'SOUMIS_VALIDATION' ? '⏳ En validation' : 'Brouillon'}
                            </span>
                          </td>
                          <td className="py-3 px-4 text-right">
                            {statut !== 'VALIDE' ? (
                              <button
                                onClick={() => handleValidateExistingShift(s)}
                                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-sm transition-all"
                              >
                                Valider →
                              </button>
                            ) : (
                              <button
                                onClick={() => setViewingShift(s)}
                                className="px-2.5 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs"
                              >
                                Consulter
                              </button>
                            )}
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
          CONTENU ONGLET : 5.2 PRODUITS FINIS SORTIE USINE & STOCK RÉEL
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'PRODUITS_FINIS' && (() => {
        const totalFardeauxStock = products.reduce((sum, p) => sum + (p.stockFardeaux || 0), 0);
        const totalUnitesStock = products.reduce((sum, p) => sum + (p.stockTotalUnites || 0), 0);
        const totalValeurStock = products.reduce((sum, p) => sum + ((p.stockFardeaux || 0) * (p.prixFardeauFCFA || 3500)), 0);
        const totalFabriqueConforme = shifts.filter(s => s.statutValidation === 'VALIDE').reduce((sum, s) => sum + (s.alvéolesConformes || 0), 0);
        const pfMovements = stockMovements.filter(m => m.type === 'ENTREE_PRODUCTION_PF' || m.articleType === 'PRODUIT_FINI');

        return (
          <div className="space-y-6">
            {/* Bannière Header */}
            <div className="bg-gradient-to-r from-blue-950 via-slate-900 to-indigo-950 p-6 rounded-3xl text-white shadow-xl border border-blue-800/60">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/40 flex items-center gap-1">
                      <Boxes className="w-3.5 h-3.5" />
                      Section 5.1 & 5.2 du Cahier des Charges
                    </span>
                    <span className="text-xs text-slate-400">• Sortie de Séchoir & Conditionnement Fardeaux</span>
                  </div>
                  <h3 className="font-extrabold text-xl sm:text-2xl tracking-tight">Magasin des Produits Finis Usine</h3>
                  <p className="text-xs sm:text-sm text-slate-300 mt-1 max-w-2xl leading-relaxed">
                    Alvéoles séchées, contrôlées et ficelées par <strong>paquets de 100 unités (fardeaux)</strong>. Le stock est alimenté en temps réel par la validation des fiches de production journalières (égalité stricte : Total = Conformes + Rebuts).
                  </p>
                </div>

                <div className="bg-blue-900/40 border border-blue-500/30 rounded-2xl p-4 text-right shrink-0">
                  <span className="text-[10px] font-bold text-blue-300 uppercase tracking-wider block">Valeur Stock Usine</span>
                  <div className="text-2xl font-black text-white mt-1">
                    {totalValeurStock.toLocaleString('fr-FR')} <span className="text-xs font-semibold text-blue-400">FCFA</span>
                  </div>
                  <span className="text-[10px] text-blue-300">Base tarif standard 3 500 FCFA/lot</span>
                </div>
              </div>

              {/* 4 Indicateurs Synthétiques */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 pt-5 border-t border-blue-800/50">
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-blue-300 uppercase block">Fardeaux en Stock</span>
                  <div className="text-2xl font-black text-white mt-0.5">{totalFardeauxStock.toLocaleString('fr-FR')}</div>
                  <span className="text-[10px] text-slate-400">Lots de 100 ficelés</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-emerald-300 uppercase block">Unités Totales Prêtes</span>
                  <div className="text-2xl font-black text-emerald-400 mt-0.5">{totalUnitesStock.toLocaleString('fr-FR')}</div>
                  <span className="text-[10px] text-slate-400">Alvéoles contrôlées</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-amber-300 uppercase block">Cumul Fabriqué Conforme</span>
                  <div className="text-2xl font-black text-amber-400 mt-0.5">{totalFabriqueConforme.toLocaleString('fr-FR')}</div>
                  <span className="text-[10px] text-slate-400">Depuis fiches validées</span>
                </div>
                <div className="bg-slate-900/60 p-3.5 rounded-2xl border border-slate-800">
                  <span className="text-[10px] font-bold text-indigo-300 uppercase block">Formats Actifs</span>
                  <div className="text-2xl font-black text-indigo-400 mt-0.5">{products.length}</div>
                  <span className="text-[10px] text-slate-400">Moulages référencés</span>
                </div>
              </div>
            </div>

            {/* Grille des Produits Finis Référencés */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {products.map(p => {
                const fardeaux = p.stockFardeaux || 0;
                const unites = p.stockTotalUnites || 0;
                const alerte = fardeaux <= (p.seuilAlerteFardeaux || 50);

                return (
                  <div key={p.id} className="p-5 rounded-3xl border border-slate-200 bg-white shadow-sm flex flex-col justify-between hover:shadow-md transition-shadow">
                    <div>
                      <div className="flex justify-between items-start">
                        <span className="text-[10px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">{p.reference}</span>
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                          alerte ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}>
                          Format {p.format}
                        </span>
                      </div>
                      <h4 className="font-extrabold text-slate-900 text-base mt-2">{p.nom}</h4>
                      <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-relaxed">{p.description}</p>
                    </div>

                    <div className="mt-5 pt-4 border-t border-slate-100 space-y-2.5">
                      <div className="flex justify-between items-baseline">
                        <span className="text-xs font-semibold text-slate-500">Stock Disponible :</span>
                        <span className="text-2xl font-black text-slate-900">
                          {fardeaux.toLocaleString('fr-FR')} <span className="text-xs font-normal text-slate-500">fardeaux</span>
                        </span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Alvéoles individuelles :</span>
                        <span className="font-bold text-slate-800">{unites.toLocaleString('fr-FR')} pcs</span>
                      </div>
                      <div className="flex justify-between items-center text-xs">
                        <span className="text-slate-500">Poids unitaire moyen :</span>
                        <span className="font-semibold text-slate-700">{p.poidsMoyenGrammes || 68}g</span>
                      </div>
                      <div className="flex justify-between items-center text-xs pt-2 border-t border-dashed border-slate-200">
                        <span className="text-slate-500">Tarif usine officiel :</span>
                        <span className="font-black text-emerald-700">3 500 FCFA / lot</span>
                      </div>
                      {alerte && (
                        <div className="p-2 rounded-xl bg-amber-50 border border-amber-200 text-[10px] font-bold text-amber-800 flex items-center gap-1.5 mt-1">
                          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                          <span>Seuil sécurité bas (≤ {p.seuilAlerteFardeaux || 50} fardeaux)</span>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Traçabilité des Entrées de Production en Stock */}
            <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h4 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
                    <PackageCheck className="w-4.5 h-4.5 text-blue-600" />
                    Historique des Entrées en Stock PF issues de la Production
                  </h4>
                  <p className="text-xs text-slate-500">Flux automatisé déclenché lors de la validation des fiches de shift (CDC Section 5.1 in fine)</p>
                </div>
                <span className="text-xs font-bold text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {pfMovements.length} entrée(s) enregistrée(s)
                </span>
              </div>

              {pfMovements.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  Aucune entrée de production enregistrée pour le moment. Validez une fiche de shift pour alimenter automatiquement le stock de produits finis.
                </div>
              ) : (
                <div className="overflow-x-auto rounded-2xl border border-slate-100">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-50 text-slate-600 font-bold uppercase text-[10px] border-b border-slate-100">
                      <tr>
                        <th className="py-3 px-4">Date</th>
                        <th className="py-3 px-4">Produit Fini</th>
                        <th className="py-3 px-4 text-center">Fardeaux Entrés</th>
                        <th className="py-3 px-4 text-center">Alvéoles Conformes</th>
                        <th className="py-3 px-4">Responsable Shift</th>
                        <th className="py-3 px-4">Motif / Rapport</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {pfMovements.slice(0, 15).map(m => (
                        <tr key={m.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono font-medium text-slate-700">{m.date}</td>
                          <td className="py-3 px-4 font-bold text-slate-900">{m.articleNom}</td>
                          <td className="py-3 px-4 text-center">
                            <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-black text-[11px]">
                              +{m.quantite} fardeaux
                            </span>
                          </td>
                          <td className="py-3 px-4 text-center font-bold text-slate-700">
                            {(m.quantite * 100).toLocaleString('fr-FR')} pcs
                          </td>
                          <td className="py-3 px-4 text-slate-600 font-medium">{m.responsable || 'Chef de Poste'}</td>
                          <td className="py-3 px-4 text-slate-500 font-mono text-[11px]">{m.motif}</td>
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

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 2 : 5.4 CONTRÔLE QUALITÉ DES DÉFAUTS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'QUALITE_DEFAUTS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                Registres des Contrôles Qualité & Gestion des Défauts (Section 5.4)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Surveillance stricte des défauts et seuils non chevauchants : Vert (≤ 3%), Orange (&gt; 3% et ≤ 5%), Rouge (&gt; 5%)
              </p>
            </div>
            <button
              onClick={() => setShowQCModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Nouveau Contrôle Qualité
            </button>
          </div>

          {/* Grille des 6 Typologies de défauts du CDC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { type: 'DEFORMATION', label: '1. Déformation', desc: 'Aspiration vide insuffisante ou démoulage hâtif', action: 'Contrôler dépression pompe à vide' },
              { type: 'CASSURE', label: '2. Cassure', desc: 'Fibres courtes ou manque d’amidon/liant', action: 'Augmenter le dosage en carton OCC' },
              { type: 'SURFACE_IRREGULIERE', label: '3. Surface Irrégulière', desc: 'Temps de défibrage pulpeur trop court', action: 'Prolonger le raffinage de 10 min' },
              { type: 'HUMIDITE_RESIDUELLE', label: '4. Humidité Résiduelle', desc: 'Séchage insuffisant ou tapis trop rapide', action: 'Réguler la température à 190°C' },
              { type: 'DEFAUT_EMPILAGE', label: '5. Défaut d’Empilage', desc: 'Guides de fardeleuse désaxés', action: 'Réétalonner la presse d’empilage' },
              { type: 'AUTRE', label: '6. Autre Défaut', desc: 'Taches, corps étrangers ou rognures plastifiées', action: 'Renforcer le tri matière première' }
            ].map(item => (
              <div key={item.type} className="p-4 rounded-2xl bg-white border border-slate-200 shadow-sm flex flex-col justify-between">
                <div>
                  <h4 className="text-xs font-black text-slate-900 mb-1 flex items-center gap-1.5">
                    <Bug className="w-4 h-4 text-amber-600" />
                    {item.label}
                  </h4>
                  <p className="text-[11px] text-slate-500 leading-relaxed">{item.desc}</p>
                </div>
                <div className="mt-3 pt-2 border-t border-slate-100 text-[11px] text-indigo-700 font-bold">
                  Action : {item.action}
                </div>
              </div>
            ))}
          </div>

          {/* Liste des contrôles qualité */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">N° Contrôle & Date</th>
                    <th className="py-3 px-4">Rapport Associé</th>
                    <th className="py-3 px-4">Quantité Contrôlée</th>
                    <th className="py-3 px-4">Conformes / Rejetées</th>
                    <th className="py-3 px-4">Taux de Rebut</th>
                    <th className="py-3 px-4">Type de Défaut & Cause</th>
                    <th className="py-3 px-4">Action Corrective</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {qualityControls.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-500 font-semibold">
                        Aucun contrôle qualité enregistré.
                      </td>
                    </tr>
                  ) : (
                    qualityControls.map(qc => (
                      <tr key={qc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{qc.numeroControle}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{qc.date} à {qc.heure}</div>
                        </td>
                        <td className="py-3 px-4 font-bold text-slate-700">
                          {qc.rapportProductionId}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          {qc.quantiteControlee.toLocaleString()} alv.
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-bold text-emerald-700">{qc.quantiteConforme} conf.</span>
                          <span className="text-red-600 ml-1 font-bold">({qc.quantiteRejetee} rejet)</span>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-xl text-[10px] font-black ${
                            qc.statutSeuil === 'VERT' ? 'bg-emerald-100 text-emerald-800' :
                            qc.statutSeuil === 'ORANGE' ? 'bg-amber-100 text-amber-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {qc.tauxRebut}% ({qc.statutSeuil})
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          <strong className="text-slate-900">{qc.typeDefaut}</strong>
                          <div className="text-[10px] text-slate-500 truncate max-w-[180px]">{qc.causeProbable}</div>
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold truncate max-w-[200px]">
                          {qc.actionCorrective}
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            qc.statutResolution === 'CORRIGE' || qc.statutResolution === 'CLOTURE'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-amber-50 text-amber-700'
                          }`}>
                            {qc.statutResolution}
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

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 3 : 5.5 INCIDENTS ET ARRÊTS MACHINE
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INCIDENTS_ARRETS' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Wrench className="w-5 h-5 text-amber-600" />
                Journal des Incidents & Arrêts Non Planifiés (Section 5.5)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Traçabilité des pannes, coupures électriques, bourrages et calcul de l'impact sur la disponibilité
              </p>
            </div>
            <button
              onClick={() => setShowIncidentModal(true)}
              className="px-4 py-2.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs transition-all shadow-md flex items-center gap-1.5 shrink-0"
            >
              <Plus className="w-4 h-4" />
              Déclarer un Incident Machine
            </button>
          </div>

          {/* Liste des incidents enregistrés */}
          <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-black uppercase text-[10px] tracking-wider">
                  <tr>
                    <th className="py-3 px-4">N° Incident & Date</th>
                    <th className="py-3 px-4">Équipement Concerné</th>
                    <th className="py-3 px-4">Nature Incident</th>
                    <th className="py-3 px-4">Durée d'Arrêt</th>
                    <th className="py-3 px-4">Cause Identifiée</th>
                    <th className="py-3 px-4">Mesures Prises</th>
                    <th className="py-3 px-4">Assistance Ext.</th>
                    <th className="py-3 px-4">Impact Alvéoles</th>
                    <th className="py-3 px-4">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {machineIncidents.length === 0 ? (
                    <tr>
                      <td colSpan={9} className="py-8 text-center text-slate-500 font-semibold">
                        Aucun incident machine déclaré.
                      </td>
                    </tr>
                  ) : (
                    machineIncidents.map(inc => (
                      <tr key={inc.id} className="hover:bg-slate-50/80 transition-colors">
                        <td className="py-3 px-4 font-bold text-slate-900">
                          <div>{inc.numeroIncident}</div>
                          <div className="text-[10px] text-slate-400 font-normal">{inc.date} ({inc.heureDebut} - {inc.heureFin})</div>
                        </td>
                        <td className="py-3 px-4 font-black text-slate-800">
                          {inc.equipementConcerne}
                        </td>
                        <td className="py-3 px-4">
                          <span className="px-2 py-0.5 rounded-lg bg-slate-100 text-slate-800 font-bold text-[10px]">
                            {inc.natureIncident}
                          </span>
                        </td>
                        <td className="py-3 px-4 font-black text-red-600">
                          {inc.dureeArretMinutes} min ({inc.dureeArretHeures}h)
                        </td>
                        <td className="py-3 px-4 text-slate-700 truncate max-w-[180px]">
                          {inc.causeIdentifiee}
                        </td>
                        <td className="py-3 px-4 text-slate-700 font-semibold truncate max-w-[180px]">
                          {inc.mesuresPrises}
                        </td>
                        <td className="py-3 px-4">
                          {inc.recoursAssistanceExterieure ? (
                            <span className="text-indigo-600 font-bold">{inc.prestataireNom || 'Oui (Externe)'}</span>
                          ) : (
                            <span className="text-slate-400">Non (Interne)</span>
                          )}
                        </td>
                        <td className="py-3 px-4 font-black text-slate-900">
                          -{inc.impactProductionAlveoles.toLocaleString()} alv.
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                            inc.statutCloture === 'CLOTURE' ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'
                          }`}>
                            {inc.statutCloture}
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

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 4 : 5.6 INDICATEURS INDUSTRIELS AUTOMATISÉS
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'INDICATEURS_AUTO' && (
        <div className="space-y-6">
          {/* Sélecteur temporel CDC 5.6 (Journalier, Hebdomadaire, Mensuel) */}
          <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-black text-slate-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-600" />
                Tableau des 7 Indicateurs Industriels Automatisés (Section 5.6)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Calculs automatiques à partir des données de production validées
              </p>
            </div>

            <div className="bg-slate-100 p-1 rounded-2xl flex items-center gap-1 text-xs">
              {(['JOUR', 'SEMAINE', 'MOIS'] as TimeScale[]).map(scale => (
                <button
                  key={scale}
                  onClick={() => setKpiScale(scale)}
                  className={`px-4 py-2 rounded-xl font-black transition-all ${
                    kpiScale === scale
                      ? 'bg-white text-slate-900 shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {scale === 'JOUR' ? 'Journalier' : scale === 'SEMAINE' ? 'Hebdomadaire' : 'Mensuel'}
                </button>
              ))}
            </div>
          </div>

          {/* Les 7 Cartes d'Indicateurs Industriels Officiels du CDC */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* 1. Cadence réelle */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">1. Cadence Réelle</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpiData.cadenceReelle} <span className="text-xs font-bold text-slate-500">alv/h</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Production totale ÷ heures effectives</p>
              <div className="mt-3 text-[11px] font-bold text-indigo-600">
                Cible CDC : {CADENCE_REELLE_CIBLE} alv/h ({CADENCE_NOMINALE} nominale)
              </div>
            </div>

            {/* 2. Taux de rebut */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">2. Taux de Rebut</div>
              <div className="text-2xl font-black text-slate-900 mt-2 flex items-center gap-2">
                {kpiData.tauxRebut}%
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${
                  kpiData.tauxRebut <= 3 ? 'bg-emerald-100 text-emerald-800' :
                  kpiData.tauxRebut <= 5 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                }`}>
                  {kpiData.tauxRebut <= 3 ? 'Vert (≤3%)' : kpiData.tauxRebut <= 5 ? 'Orange (≤5%)' : 'Rouge (>5%)'}
                </span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Quantité non conforme ÷ production × 100</p>
              <div className="mt-3 text-[11px] text-slate-600 font-semibold">
                Non conformes : {kpiData.nonConforme.toLocaleString()} alv.
              </div>
            </div>

            {/* 3. Rendement matière */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">3. Rendement Matière</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpiData.rendementMatiere} <span className="text-xs font-bold text-slate-500">alv / kg</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Alvéoles produites ÷ kg papier consommés</p>
              <div className="mt-3 text-[11px] font-bold text-emerald-700">
                Norme de référence : 35 alv / kg (pâte recyclée)
              </div>
            </div>

            {/* 4. Temps d'arrêt */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">4. Temps d'Arrêt</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpiData.heuresArret} <span className="text-xs font-bold text-slate-500">heures</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Somme des durées d'arrêt non planifié</p>
              <div className="mt-3 text-[11px] text-slate-600 font-semibold">
                Heures effectives : {kpiData.heuresEffectives}h
              </div>
            </div>

            {/* 5. Disponibilité machine */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">5. Disponibilité Machine</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpiData.disponibilite}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : (Temps planifié − arrêts) ÷ planifié × 100</p>
              <div className="mt-3 text-[11px] font-bold text-indigo-700">
                Composante clé du TRS / OEE usine
              </div>
            </div>

            {/* 6. Réalisation de la cible */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">6. Réalisation de la Cible</div>
              <div className="text-2xl font-black text-slate-900 mt-2">
                {kpiData.realisationCible}%
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Production réelle ÷ production cible × 100</p>
              <div className="mt-3 text-[11px] text-slate-600 font-semibold">
                Cible période : {kpiData.prodCible.toLocaleString()} alv.
              </div>
            </div>

            {/* 7. Écart de production */}
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm sm:col-span-2">
              <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">7. Écart de Production</div>
              <div className={`text-2xl font-black mt-2 ${kpiData.ecartProduction >= 0 ? 'text-emerald-700' : 'text-amber-600'}`}>
                {kpiData.ecartProduction >= 0 ? `+${kpiData.ecartProduction.toLocaleString()}` : kpiData.ecartProduction.toLocaleString()}
                <span className="text-xs font-bold text-slate-500 ml-1.5">alvéoles</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1">Formule : Production réelle − production cible ({kpiData.prodReelle.toLocaleString()} vs {kpiData.prodCible.toLocaleString()})</p>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 5 : PROCÉDURES OPÉRATIONNELLES A.2.1
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'CHECKLISTS_A21' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Checklist Démarrage */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                <Power className="w-4 h-4 text-emerald-600" />
                A.2.1 Démarrage de la Ligne – Check-list
              </h3>
              <p className="text-xs text-slate-500 mb-4">Autorisation de démarrage donnée par le Chef d'équipe uniquement</p>

              <div className="space-y-2.5">
                {[
                  { key: 'alimentationElectrique', label: 'Alimentation électrique active' },
                  { key: 'arriveeEau', label: 'Arrivée d\'eau ouverte' },
                  { key: 'pulpeurPropre', label: 'Pulpeur vide et propre' },
                  { key: 'moulesPositionnes', label: 'Moules propres et correctement positionnés' },
                  { key: 'sechoirVide', label: 'Séchoir vide' },
                  { key: 'epiPortes', label: 'EPI portés par tout le personnel' },
                  { key: 'autorisationChefEquipe', label: 'Autorisation formelle du Chef d\'équipe' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={(checkDemarrage as any)[item.key]}
                      onChange={e => setCheckDemarrage({ ...checkDemarrage, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-emerald-600 rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Checklist Descente & Fermeture */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
              <h3 className="text-sm font-black text-slate-900 mb-2 flex items-center gap-2">
                <WashingMachine className="w-4 h-4 text-blue-600" />
                Nettoyage, Arrêt Ligne & Fermeture du Site
              </h3>
              <p className="text-xs text-slate-500 mb-4">Procédure obligatoire en fin de quart ou clôture journalière</p>

              <div className="space-y-2.5">
                {[
                  { key: 'arretProgressifMachines', label: 'Arrêt progressif des machines' },
                  { key: 'vidangePartiellePulpeur', label: 'Vidange partielle du pulpeur' },
                  { key: 'nettoyageImmediat', label: 'Nettoyage immédiat des moules et tamis' },
                  { key: 'coupureElectriqueGenerale', label: 'Coupure électrique générale' },
                  { key: 'verrouillagesLocaux', label: 'Verrouillage des locaux' },
                  { key: 'rapportJournalierRempli', label: 'Rapport journalier rempli et partagé' }
                ].map(item => (
                  <label key={item.key} className="flex items-center gap-3 p-3 rounded-2xl bg-slate-50 border border-slate-200 cursor-pointer text-xs font-bold text-slate-800">
                    <input
                      type="checkbox"
                      checked={(checkDescente as any)[item.key]}
                      onChange={e => setCheckDescente({ ...checkDescente, [item.key]: e.target.checked })}
                      className="w-4 h-4 text-blue-600 rounded"
                    />
                    <span>{item.label}</span>
                  </label>
                ))}
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 6 : GUIDE COMPLET D'UTILISATION & VALIDATION
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'GUIDE_UTILISATION' && (
        <div className="space-y-6 animate-fadeIn">
          {/* Bannière du guide */}
          <div className="bg-gradient-to-r from-amber-500 via-amber-600 to-orange-600 p-6 rounded-3xl text-slate-950 shadow-lg relative overflow-hidden">
            <div className="relative z-10">
              <span className="px-3 py-1 rounded-full text-xs font-black bg-slate-950 text-amber-400 inline-flex items-center gap-1.5 shadow-sm mb-2">
                <BookOpen className="w-3.5 h-3.5" />
                MANUEL OPÉRATIONNEL & GOUVERNANCE INDUSTRIELLE
              </span>
              <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Comment Valider & Gérer la Productivité au Quotidien
              </h2>
              <p className="text-xs sm:text-sm text-amber-100 font-medium mt-1 max-w-2xl leading-relaxed">
                Organisation industrielle : <strong>1 seul Shift de 8h par jour</strong> • <strong>6 jours sur 7</strong> (Lundi au Samedi = 26 jours ouvrés/mois).
                Capacité cible nominale : <strong>1 700 alvéoles/h</strong> soit <strong>13 600 alvéoles/jour</strong> et <strong>353 600 alvéoles/mois</strong>.
              </p>
            </div>
          </div>

          {/* Cartouche Récapitulatif du Modèle 1 Shift (8h x 6 jours) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-indigo-600" />
                Régime de Travail
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">1 Shift Unique</div>
              <div className="text-xs text-indigo-700 font-bold mt-1">8h effectives / jour</div>
              <p className="text-[11px] text-slate-500 mt-1">Exemple : 08h00 - 16h00 (ou 06h00 - 14h00)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                Semaine d'Exploitation
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">6 jours / semaine</div>
              <div className="text-xs text-emerald-700 font-bold mt-1">26 jours ouvrés / mois</div>
              <p className="text-[11px] text-slate-500 mt-1">Dimanche réservé maintenance préventive</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Gauge className="w-3.5 h-3.5 text-amber-600" />
                Cible Journalière (8h)
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">13 600 alvéoles</div>
              <div className="text-xs text-amber-700 font-bold mt-1">136 fardeaux de 100</div>
              <p className="text-[11px] text-slate-500 mt-1">Cadence cible : 1 700 alv/h (Rendement 85%)</p>
            </div>

            <div className="bg-white p-5 rounded-3xl border border-slate-200 shadow-sm">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                Papier Journalier
              </div>
              <div className="text-xl font-black text-slate-900 mt-2">≈ 388,5 kg / jour</div>
              <div className="text-xs text-blue-700 font-bold mt-1">Rendement : 35 alv / kg</div>
              <p className="text-[11px] text-slate-500 mt-1">Besoin mensuel (26j) : ≈ 10 100 kg papier</p>
            </div>
          </div>

          {/* Les 5 Étapes du Flux Opérationnel */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-base font-black text-slate-900 mb-4 flex items-center gap-2">
              <ClipboardList className="w-5 h-5 text-indigo-600" />
              Cycle Quotidien : Les 5 Étapes de Validation & Pilotage
            </h3>

            <div className="space-y-4">
              
              {/* Étape 1 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                    1
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Matin : Vérification & Check-list A.2.1 (Avant Démarrage)
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      L'opérateur ou chef d'équipe ouvre l'onglet <strong>« Procédures A.2.1 »</strong> et valide les 7 points de contrôle :
                      alimentation électrique, arrivée d'eau, propreté du pulpeur, moules et tamis en place, séchoir tunnel vide, port des EPI et visa du Chef.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('CHECKLISTS_A21')}
                  className="px-3.5 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs shrink-0 self-start md:self-center"
                >
                  Voir Check-list A.2.1 →
                </button>
              </div>

              {/* Étape 2 */}
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-slate-900 text-white font-black text-sm flex items-center justify-center shrink-0">
                    2
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      En cours de journée : Contrôle Qualité & Incidents Éventuels
                    </h4>
                    <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                      • <strong>Qualité (CDC 5.4) :</strong> En cas de lot douteux, enregistrer un contrôle. Le système applique la règle stricte des seuils non-chevauchants :
                      <span className="inline-block mx-1 font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">Vert ≤ 3%</span>
                      <span className="inline-block mx-1 font-bold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded">Orange &gt; 3% et ≤ 5%</span>
                      <span className="inline-block mx-1 font-bold text-red-700 bg-red-50 px-1.5 py-0.5 rounded">Rouge &gt; 5% (Action corrective obligatoire)</span>.<br />
                      • <strong>Arrêt Machine (CDC 5.5) :</strong> Si panne ou bourrage, déclarer l'incident (durée, motif, perte estimée).
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0 self-start md:self-center">
                  <button
                    onClick={() => setActiveTab('QUALITE_DEFAUTS')}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs"
                  >
                    Qualité →
                  </button>
                  <button
                    onClick={() => setActiveTab('INCIDENTS_ARRETS')}
                    className="px-3 py-2 rounded-xl bg-white border border-slate-300 hover:bg-slate-100 text-slate-800 font-bold text-xs"
                  >
                    Incidents →
                  </button>
                </div>
              </div>

              {/* Étape 3 */}
              <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-amber-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    3
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-slate-900">
                      Fin de Journée (16h00) : Saisie de la Fiche de Production
                    </h4>
                    <p className="text-xs text-slate-700 mt-1 leading-relaxed">
                      Cliquer sur <strong>« Nouvelle Fiche de Production »</strong> :
                      <br />• Renseigner les <strong>Heures effectives</strong> (8h - arrêts machine).
                      <br />• Renseigner la <strong>Production totale</strong>, les <strong>Conformes</strong> et les <strong>Rebuts</strong>.
                      <br />• <strong>Règle de Cohérence Mathématique stricte (Section 5.2) :</strong> Total Fabriqué = Conformes + Non Conformes. Si le total diffère, le système bloque la validation sauf dérogation explicite et motivée.
                      <br />• Renseigner la consommation de carton papier (autour de 388 kg pour 13 600 alvéoles).
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => {
                    applyScenarioTest1();
                    setShowShiftModal(true);
                  }}
                  className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shrink-0 self-start md:self-center shadow-md flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  Ouvrir Saisie Fiche
                </button>
              </div>

              {/* Étape 4 */}
              <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-emerald-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    4
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-emerald-950">
                      Validation & Entrée Automatique en Stock (Automatisme Clé)
                    </h4>
                    <p className="text-xs text-emerald-800 mt-1 leading-relaxed">
                      Quand le Chef d'Équipe ou la Direction clique sur <strong>« Valider & Entrée en Stock »</strong> :
                      <br />✅ Les alvéoles conformes sont <strong>immédiatement ajoutées au Stock de Produits Finis</strong> (en fardeaux de 100).
                      <br />✅ Le carton papier consommé est <strong>automatiquement déduit du stock Matière Première (Pulpeur)</strong>.
                      <br />✅ Une trace immuable est inscrite dans le <strong>Journal d'Audit Log</strong> (date, auteur, quantités).
                      <br />✅ Le rapport est scellé au statut <strong>VALIDE</strong>.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('SUIVI_JOURNALIER')}
                  className="px-3.5 py-2 rounded-xl bg-emerald-700 hover:bg-emerald-600 text-white font-black text-xs shrink-0 self-start md:self-center"
                >
                  Voir Fiches Validées →
                </button>
              </div>

              {/* Étape 5 */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className="w-8 h-8 rounded-xl bg-indigo-600 text-white font-black text-sm flex items-center justify-center shrink-0">
                    5
                  </span>
                  <div>
                    <h4 className="text-sm font-black text-indigo-950">
                      Pilotage Direction : Onglet « 5.6 Indicateurs Automatisés »
                    </h4>
                    <p className="text-xs text-indigo-800 mt-1 leading-relaxed">
                      Basculer entre vue <strong>Journalière (1 jour)</strong>, <strong>Hebdomadaire (6 jours)</strong> ou <strong>Mensuelle (26 jours)</strong> pour analyser :
                      Cadence réelle vs 1 700 alv/h • Taux de rebut vs 3% • Rendement matière vs 35 alv/kg • TRS / OEE global • Écart de production cumulé.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setActiveTab('INDICATEURS_AUTO')}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-black text-xs shrink-0 self-start md:self-center"
                >
                  Voir Indicateurs 5.6 →
                </button>
              </div>

            </div>
          </div>

          {/* Règles de Gouvernance et Contrôles Non-Négociables */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <Shield className="w-4 h-4 text-emerald-600" />
                Règles de Cohérence CDC Section 5.2
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Total = Conformes + Non Conformes :</strong> Aucun écart non déclaré n'est toléré lors de la validation.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Conformes ≤ Total :</strong> Il est matériellement impossible de déclarer plus de produits conformes que le total fabriqué.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">✓</span>
                  <span><strong>Dérogation formelle :</strong> Tout écart exceptionnel nécessite l'activation de la case « Dérogation » avec justification écrite obligatoire.</span>
                </li>
              </ul>
            </div>

            <div className="p-5 rounded-3xl bg-white border border-slate-200 shadow-sm">
              <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                Seuils Qualité & Action Réactive
              </h4>
              <ul className="text-xs text-slate-600 space-y-2">
                <li className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold">🟢</span>
                  <span><strong>Taux de Rebut ≤ 3% :</strong> Zone verte nominale. Production conforme aux standards qualité.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold">🟠</span>
                  <span><strong>Taux de Rebut &gt; 3% et ≤ 5% :</strong> Zone orange de vigilance. Surveillance accrue des moules et du séchage.</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-red-600 font-bold">🔴</span>
                  <span><strong>Taux de Rebut &gt; 5% :</strong> Zone rouge critique. Déclenchement automatique d'un rapport de non-conformité et arrêt ou réglage immédiat.</span>
                </li>
              </ul>
            </div>
          </div>

        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 1 : NOUVELLE FICHE DE PRODUCTION JOURNALIÈRE (CDC 5.1 & 5.2)
          ══════════════════════════════════════════════════════════════════ */}
      {showShiftModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85dvh] sm:max-h-[92vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
            
            {/* Header Modal */}
            <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
                  <Factory className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base sm:text-lg font-black tracking-tight">Nouvelle Fiche de Production Journalière</h3>
                  <p className="text-xs text-slate-400 mt-0.5">Section 5.1 & Règles de Cohérence 5.2 du Cahier des Charges</p>
                </div>
              </div>
              <button 
                onClick={() => setShowShiftModal(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
              >
                ✕
              </button>
            </div>

            {/* Body Scrollable */}
            <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5">
              
              {/* Jeux d'essais CDC Section 14 */}
              <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Activity className="w-4 h-4 text-blue-600" />
                  Jeux d'essai du CDC (Section 14) :
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={applyScenarioTest1}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 font-bold text-[11px] border border-blue-200 transition-all"
                  >
                    Test 1 : 13 600 alv (Rebut 2.94% - Vert)
                  </button>
                  <button
                    type="button"
                    onClick={applyScenarioTest2}
                    className="px-3 py-1.5 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 font-bold text-[11px] border border-red-200 transition-all"
                  >
                    Test 2 : Rebut critique &gt; 5% (Rouge)
                  </button>
                </div>
              </div>

              {formError && (
                <div className="p-3.5 bg-red-50 border border-red-200 rounded-2xl text-xs font-bold text-red-800 flex items-start gap-2.5 animate-fadeIn">
                  <ShieldAlert className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div>{formError}</div>
                </div>
              )}

              {/* 1. Informations Générales & Temps */}
              <div>
                <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider mb-2.5">
                  1. Identification du Shift & Données de Temps (Lundi au Samedi)
                </h4>

                {/* Bannière de cadrage industriel */}
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3 mb-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-amber-950">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-amber-500 text-slate-950 text-[10px] font-black uppercase">Standard Usine</span>
                    <span className="font-black">1 Seul Shift (8h • Pause 1h) · 1 Seule Équipe · 1 Seule Ligne Shuliy</span>
                  </div>
                  <span className="text-[11px] font-bold text-amber-800">Rythme : Du Lundi au Samedi (6j/sem)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Date effective (Lundi au Samedi)</label>
                    <input
                      type="date"
                      value={newShift.date}
                      onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Shift de Travail (Unique)</label>
                    <input
                      type="text"
                      readOnly
                      value="⭐ Shift Unique 8h (08h00 - 16h00 • Pause 1h)"
                      className="w-full text-xs p-2.5 rounded-xl border border-amber-300 bg-amber-50/70 font-black text-amber-950 cursor-not-allowed"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Équipe & Responsable (Équipe Unique)</label>
                    <input
                      type="text"
                      value={newShift.responsableShift}
                      onChange={e => setNewShift({ ...newShift, responsableShift: e.target.value })}
                      className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-bold"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Démarrage (8h total)</label>
                    <input
                      type="time"
                      value={newShift.heureDemarrage}
                      onChange={e => setNewShift({ ...newShift, heureDemarrage: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Fin de Shift</label>
                    <input
                      type="time"
                      value={newShift.heureArret}
                      onChange={e => setNewShift({ ...newShift, heureArret: e.target.value })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Pause Repas / Repos</label>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max="4"
                      value={newShift.heuresPause}
                      onChange={e => setNewShift({ ...newShift, heuresPause: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400">1h réglementaire</span>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Arrêts Machine Imprévus</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0"
                      max="7"
                      value={newShift.heuresArret}
                      onChange={e => setNewShift({ ...newShift, heuresArret: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                    <span className="text-[10px] text-slate-400">Pannes ou bourrages</span>
                  </div>
                  <div className="bg-indigo-50 p-2 rounded-xl border border-indigo-200 flex flex-col justify-center">
                    <span className="text-[10px] text-indigo-700 font-bold block">Production Machine :</span>
                    <span className="text-sm font-black text-indigo-900">{shiftHeuresFonc}h nettes</span>
                    <span className="text-[9px] text-indigo-600 font-medium">8h - 1h pause - {newShift.heuresArret}h</span>
                  </div>
                </div>
              </div>

              {/* 2. Quantités Produites & Règle de Cohérence 5.2 */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
                    2. Quantités Fabriquées & Règle de Cohérence (CDC 5.2)
                  </h4>
                  <span className={`text-[11px] font-black px-2 py-0.5 rounded-lg ${
                    isCoherenceQuantites ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {isCoherenceQuantites ? '✓ Total = Conforme + Non conforme' : '⚠️ Incohérence Total ≠ Conforme + Rebuts'}
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="p-3 rounded-2xl bg-slate-50 border border-slate-200">
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">
                      Production Totale Fabriquée
                    </label>
                    <input
                      type="number"
                      value={newShift.quantiteTotaleFabriquee}
                      onChange={e => setNewShift({ ...newShift, quantiteTotaleFabriquee: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-black text-slate-900"
                      required
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">Saisie réelle globale</span>
                  </div>

                  <div className="p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200">
                    <label className="block text-[11px] font-bold text-emerald-900 mb-1">
                      Quantité Conforme (Unités)
                    </label>
                    <input
                      type="number"
                      value={newShift.quantiteConforme}
                      onChange={e => setNewShift({ ...newShift, quantiteConforme: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-emerald-300 bg-white font-black text-emerald-800"
                      required
                    />
                    <span className="text-[10px] text-emerald-700 mt-1 block">
                      = {Math.floor(newShift.quantiteConforme / 100)} fardeaux de 100
                    </span>
                  </div>

                  <div className="p-3 rounded-2xl bg-amber-50/70 border border-amber-200">
                    <label className="block text-[11px] font-bold text-amber-900 mb-1">
                      Quantité Non Conforme
                    </label>
                    <input
                      type="number"
                      value={newShift.quantiteNonConforme}
                      onChange={e => setNewShift({ ...newShift, quantiteNonConforme: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-amber-300 bg-white font-black text-amber-800"
                      required
                    />
                    <span className="text-[10px] text-amber-800 mt-1 block">
                      Taux calculé : <strong>{formTauxRebut}% ({formStatutRebut})</strong>
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Mise en Rebut (Pulpeur)</label>
                    <input
                      type="number"
                      value={newShift.quantiteMiseEnRebut}
                      onChange={e => setNewShift({ ...newShift, quantiteMiseEnRebut: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité Réutilisable</label>
                    <input
                      type="number"
                      value={newShift.quantiteReutilisable}
                      onChange={e => setNewShift({ ...newShift, quantiteReutilisable: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 mb-1">Papier Consommé (kg)</label>
                    <input
                      type="number"
                      value={newShift.papierCartonConsommeKg}
                      onChange={e => setNewShift({ ...newShift, papierCartonConsommeKg: Number(e.target.value) })}
                      className="w-full text-xs p-2 rounded-xl border border-slate-300 bg-white font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* 3. Dérogation Autorisée (CDC 5.2) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-800">
                  <input
                    type="checkbox"
                    checked={newShift.derogationAccordee}
                    onChange={e => setNewShift({ ...newShift, derogationAccordee: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-600"
                  />
                  <span>Autoriser une dérogation exceptionnelle de validation</span>
                </label>
                {newShift.derogationAccordee && (
                  <div className="mt-2 animate-fadeIn">
                    <label className="block text-[10px] font-black text-amber-800 uppercase tracking-wider mb-1">
                      Motif obligatoire de dérogation (Section 5.2 du CDC) :
                    </label>
                    <input
                      type="text"
                      value={newShift.motifDerogation}
                      onChange={e => setNewShift({ ...newShift, motifDerogation: e.target.value })}
                      placeholder="Ex: Écart de 50 alvéoles dû au calibrage du compteur rotatif"
                      className="w-full text-xs p-2 rounded-xl border border-amber-300 bg-white font-bold"
                      required
                    />
                  </div>
                )}
              </div>

              {/* 4. Observations */}
              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Observations opérationnelles</label>
                <textarea
                  rows={2}
                  value={newShift.observations}
                  onChange={e => setNewShift({ ...newShift, observations: e.target.value })}
                  className="w-full text-xs p-2.5 rounded-xl border border-slate-300 bg-white font-medium"
                />
              </div>

            </div>

            {/* Footer Modal avec boutons d'états (Brouillon / Validation) */}
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md p-3 pb-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20 mt-auto">
              <button
                type="button"
                onClick={() => handleSaveShift('BROUILLON')}
                className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-300 bg-white hover:bg-slate-100 text-slate-700 font-bold text-xs transition-colors"
              >
                Enregistrer en Brouillon Provisoire
              </button>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  type="button"
                  onClick={() => handleSaveShift('SOUMIS_VALIDATION')}
                  className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs transition-colors"
                >
                  Soumettre pour Validation
                </button>
                <button
                  type="button"
                  onClick={() => handleSaveShift('VALIDE')}
                  className="flex-1 sm:flex-none px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs shadow-md transition-colors flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Valider & Entrée en Stock
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 2 : NOUVEAU CONTRÔLE QUALITÉ (CDC 5.4)
          ══════════════════════════════════════════════════════════════════ */}
      {showQCModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-indigo-600 text-white font-black">
                  <ShieldAlert className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Nouveau Contrôle Qualité Alvéoles</h3>
                  <p className="text-xs text-slate-500">Section 5.4 du Cahier des Charges • Typologie des défauts</p>
                </div>
              </div>
              <button onClick={() => setShowQCModal(false)} className="text-slate-400 p-2">✕</button>
            </div>

            <form onSubmit={handleSaveQC} className="mt-4 space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newQC.date}
                    onChange={e => setNewQC({ ...newQC, date: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Heure</label>
                  <input
                    type="time"
                    value={newQC.heure}
                    onChange={e => setNewQC({ ...newQC, heure: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Type de Défaut (CDC 5.4)</label>
                <select
                  value={newQC.typeDefaut}
                  onChange={e => setNewQC({ ...newQC, typeDefaut: e.target.value as DefautQualiteType })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="DEFORMATION">1. Déformation de l'alvéole</option>
                  <option value="CASSURE">2. Cassure / Bords fragiles</option>
                  <option value="SURFACE_IRREGULIERE">3. Surface Irrégulière / Grumeaux</option>
                  <option value="HUMIDITE_RESIDUELLE">4. Humidité Résiduelle Excessive</option>
                  <option value="DEFAUT_EMPILAGE">5. Défaut d'Empilage / Calage</option>
                  <option value="AUTRE">6. Autre Défaut à préciser</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Quantité Contrôlée</label>
                  <input
                    type="number"
                    value={newQC.quantiteControlee}
                    onChange={e => setNewQC({ ...newQC, quantiteControlee: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Conformes</label>
                  <input
                    type="number"
                    value={newQC.quantiteConforme}
                    onChange={e => setNewQC({ ...newQC, quantiteConforme: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Rejetées</label>
                  <input
                    type="number"
                    value={newQC.quantiteRejetee}
                    onChange={e => setNewQC({ ...newQC, quantiteRejetee: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cause Probable</label>
                <input
                  type="text"
                  value={newQC.causeProbable}
                  onChange={e => setNewQC({ ...newQC, causeProbable: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Action Corrective</label>
                <input
                  type="text"
                  value={newQC.actionCorrective}
                  onChange={e => setNewQC({ ...newQC, actionCorrective: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowQCModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-xs shadow-md"
                >
                  Enregistrer le Contrôle Qualité
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          MODAL 3 : DÉCLARATION INCIDENT MACHINE (CDC 5.5)
          ══════════════════════════════════════════════════════════════════ */}
      {showIncidentModal && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-xl w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <span className="p-2.5 rounded-2xl bg-amber-500 text-slate-950 font-black">
                  <Wrench className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-base font-black text-slate-900">Fiche d'Incident & Arrêt Machine</h3>
                  <p className="text-xs text-slate-500">Section 5.5 du Cahier des Charges • Traçabilité disponibilité</p>
                </div>
              </div>
              <button onClick={() => setShowIncidentModal(false)} className="text-slate-400 p-2">✕</button>
            </div>

            <form onSubmit={handleSaveIncident} className="mt-4 space-y-4">
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newIncident.date}
                    onChange={e => setNewIncident({ ...newIncident, date: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Heure Début</label>
                  <input
                    type="time"
                    value={newIncident.heureDebut}
                    onChange={e => setNewIncident({ ...newIncident, heureDebut: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Heure Fin</label>
                  <input
                    type="time"
                    value={newIncident.heureFin}
                    onChange={e => setNewIncident({ ...newIncident, heureFin: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Équipement Concerné</label>
                <input
                  type="text"
                  value={newIncident.equipementConcerne}
                  onChange={e => setNewIncident({ ...newIncident, equipementConcerne: e.target.value })}
                  placeholder="Ex: Mouleuse Rotative, Séchoir Tunnel, Pompe à vide..."
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Nature de l'Incident (CDC 5.5)</label>
                <select
                  value={newIncident.natureIncident}
                  onChange={e => setNewIncident({ ...newIncident, natureIncident: e.target.value as IncidentNatureType })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                >
                  <option value="COUPURE_ELECTRIQUE">Coupure électrique</option>
                  <option value="RUPTURE_MATIERE_PREMIERE">Rupture de matière première</option>
                  <option value="BLOCAGE_MACHINE">Blocage machine / Bourrage</option>
                  <option value="DERIVE_QUALITE">Dérive qualité / Réglage</option>
                  <option value="PANNE_MECANIQUE">Panne mécanique</option>
                  <option value="PANNE_HYDRAULIQUE_VIDE">Panne pompe à vide ou circuit hydraulique</option>
                  <option value="AUTRE">Autre incident</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Cause Identifiée ou Présumée</label>
                <input
                  type="text"
                  value={newIncident.causeIdentifiee}
                  onChange={e => setNewIncident({ ...newIncident, causeIdentifiee: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 mb-1">Mesures Prises</label>
                <input
                  type="text"
                  value={newIncident.mesuresPrises}
                  onChange={e => setNewIncident({ ...newIncident, mesuresPrises: e.target.value })}
                  className="w-full text-xs p-2 rounded-xl border border-slate-300 font-semibold"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Perte Estimée (Alvéoles)</label>
                  <input
                    type="number"
                    value={newIncident.impactProductionAlveoles}
                    onChange={e => setNewIncident({ ...newIncident, impactProductionAlveoles: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 mb-1">Responsable Résolution</label>
                  <input
                    type="text"
                    value={newIncident.responsableResolution}
                    onChange={e => setNewIncident({ ...newIncident, responsableResolution: e.target.value })}
                    className="w-full text-xs p-2 rounded-xl border border-slate-300 font-bold"
                  />
                </div>
              </div>

              <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex items-center justify-end gap-2 z-20 mt-auto">
                <button
                  type="button"
                  onClick={() => setShowIncidentModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-100 text-slate-700 font-bold text-xs"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs shadow-md"
                >
                  Enregistrer l'Incident Machine
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4 : CONSULTATION DÉTAILLÉE D'UNE FICHE */}
      {viewingShift && (
        <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-black text-slate-900">{viewingShift.numeroRapport || viewingShift.id}</h3>
              <button onClick={() => setViewingShift(null)} className="text-slate-400 p-1">✕</button>
            </div>
            <div className="mt-4 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Date & Organisation :</span>
                <strong>{viewingShift.date} · Shift Unique 8h (Pause 1h)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Ligne de Production :</span>
                <strong>{viewingShift.ligneProduction || 'Ligne Unique Shuliy 4 Faces'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Équipe & Responsable :</span>
                <strong>{viewingShift.responsableShift || 'Équipe Unique (Amadou Bâ)'}</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Temps Machine :</span>
                <strong>{viewingShift.heuresPlanifiees || 8}h présence (Pause {viewingShift.heuresPause ?? 1}h) → {viewingShift.heuresFonctionnement}h nettes</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Production Conforme :</span>
                <strong className="text-emerald-700">{viewingShift.alvéolesConformes.toLocaleString()} alv ({viewingShift.fardeauxEmballes} fardeaux)</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Taux de Rebut :</span>
                <strong className="text-red-600">{viewingShift.rebutsPourcentage}%</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Cadence Réelle :</span>
                <strong>{viewingShift.cadenceHoraireReelle} alv/h</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Papier Consommé :</span>
                <strong>{viewingShift.papierCartonConsommeKg} kg</strong>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50">
                <span className="text-slate-500">Statut Validation :</span>
                <strong className="text-emerald-700">✓ {viewingShift.statutValidation || 'VALIDE'}</strong>
              </div>
              {viewingShift.motifDerogation && (
                <div className="p-2.5 rounded-xl bg-amber-50 text-amber-900 text-[11px] font-bold">
                  Motif Dérogation : {viewingShift.motifDerogation}
                </div>
              )}
            </div>
            <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-100 flex justify-end z-20 mt-auto">
              <button
                onClick={() => setViewingShift(null)}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white font-bold text-xs"
              >
                Fermer
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════════════
          CONTENU ONGLET 7 : MAINTENANCE PRÉVENTIVE (ANNEXE A CDC)
          ══════════════════════════════════════════════════════════════════ */}
      {activeTab === 'MAINTENANCE_PREV' && (
        <div className="space-y-6">
          {/* Bandeau header */}
          <div className="bg-gradient-to-r from-orange-900 via-orange-800 to-amber-900 p-5 rounded-3xl text-white shadow-xl">
            <div className="flex items-center gap-3 mb-1">
              <Wrench className="w-6 h-6 text-orange-300" />
              <h3 className="text-xl font-black tracking-tight">Maintenance Préventive – Équipements Critiques</h3>
            </div>
            <p className="text-xs text-orange-200 max-w-3xl">
              Conformément à l'Annexe A du Cahier des Charges, le remplacement des moules et grilles tamis rotatives est déclenché tous les 500h de fonctionnement cumulé. La checklist dimanche doit être signée avant toute reprise de production.
            </p>
          </div>

          {/* Compteurs d'heures machines */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* Moules */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">Jeu de Moules Rotatifs</div>
                  <div className={`text-4xl font-black ${ heuresMoules >= 500 ? 'text-red-600' : heuresMoules >= 400 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {heuresMoules.toLocaleString('fr-FR')}
                    <span className="text-base font-bold text-slate-500 ml-1">h</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xs ${
                  heuresMoules >= 500 ? 'bg-red-100 text-red-700' :
                  heuresMoules >= 400 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <span className="text-2xl">{heuresMoules >= 500 ? '🔴' : heuresMoules >= 400 ? '🟡' : '🟢'}</span>
                  <span className="text-[9px] mt-0.5">{heuresMoules >= 500 ? 'REMPLACEMENT' : `${500 - heuresMoules}h restant`}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${ heuresMoules >= 500 ? 'bg-red-500' : heuresMoules >= 400 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (heuresMoules / 500) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0h</span>
                  <span className="text-amber-600">400h ⚠️</span>
                  <span className="text-red-600">500h 🔴 (Remplacement)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  placeholder="Ajouter des heures..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  id="add-hrs-moules"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('add-hrs-moules') as HTMLInputElement;
                    const val = Number(input.value);
                    if (val > 0) {
                      const newH = heuresMoules + val;
                      setHeuresMoules(newH);
                      localStorage.setItem('bs_heures_moules', String(newH));
                      input.value = '';
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all"
                >
                  + Ajouter
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remettre le compteur Moules à 0 après remplacement ?')) {
                      setHeuresMoules(0);
                      localStorage.setItem('bs_heures_moules', '0');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200"
                >
                  Réinitialiser
                </button>
              </div>
              {heuresMoules >= 500 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800">
                  🔴 ALERTE : Remplacement des moules obligatoire ! (Seuil CDC Annexe A : 500h)
                </div>
              )}
            </div>

            {/* Grilles / Tamis Rotatifs Vacuum */}
            <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-black text-slate-400 uppercase tracking-wider mb-0.5">Grilles Tamis Rotatifs Vacuum</div>
                  <div className={`text-4xl font-black ${ heuresTamis >= 500 ? 'text-red-600' : heuresTamis >= 400 ? 'text-amber-600' : 'text-slate-900'}`}>
                    {heuresTamis.toLocaleString('fr-FR')}
                    <span className="text-base font-bold text-slate-500 ml-1">h</span>
                  </div>
                </div>
                <div className={`w-16 h-16 rounded-2xl flex flex-col items-center justify-center font-black text-xs ${
                  heuresTamis >= 500 ? 'bg-red-100 text-red-700' :
                  heuresTamis >= 400 ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                }`}>
                  <span className="text-2xl">{heuresTamis >= 500 ? '🔴' : heuresTamis >= 400 ? '🟡' : '🟢'}</span>
                  <span className="text-[9px] mt-0.5">{heuresTamis >= 500 ? 'REMPLACEMENT' : `${500 - heuresTamis}h restant`}</span>
                </div>
              </div>
              {/* Progress bar */}
              <div className="space-y-1.5">
                <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                  <div
                    className={`h-3 rounded-full transition-all ${ heuresTamis >= 500 ? 'bg-red-500' : heuresTamis >= 400 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                    style={{ width: `${Math.min(100, (heuresTamis / 500) * 100)}%` }}
                  />
                </div>
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold">
                  <span>0h</span>
                  <span className="text-amber-600">400h ⚠️</span>
                  <span className="text-red-600">500h 🔴 (Remplacement)</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min={0}
                  max={9999}
                  placeholder="Ajouter des heures..."
                  className="flex-1 text-xs p-2.5 rounded-xl border border-slate-200 font-bold"
                  id="add-hrs-tamis"
                />
                <button
                  onClick={() => {
                    const input = document.getElementById('add-hrs-tamis') as HTMLInputElement;
                    const val = Number(input.value);
                    if (val > 0) {
                      const newH = heuresTamis + val;
                      setHeuresTamis(newH);
                      localStorage.setItem('bs_heures_tamis', String(newH));
                      input.value = '';
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-black transition-all"
                >
                  + Ajouter
                </button>
                <button
                  onClick={() => {
                    if (window.confirm('Remettre le compteur Tamis à 0 après remplacement ?')) {
                      setHeuresTamis(0);
                      localStorage.setItem('bs_heures_tamis', '0');
                    }
                  }}
                  className="px-3 py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 text-xs font-bold border border-red-200"
                >
                  Réinitialiser
                </button>
              </div>
              {heuresTamis >= 500 && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs font-bold text-red-800">
                  🔴 ALERTE : Remplacement des grilles tamis obligatoire ! (Seuil CDC Annexe A : 500h)
                </div>
              )}
            </div>
          </div>

          {/* Checklist Entretien Dimanche (Annexe A) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm">
            <h3 className="text-sm font-black text-slate-900 mb-1 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-orange-600" />
              Protocole Dimanche – Entretien Hebdomadaire Complet (Annexe A du CDC)
            </h3>
            <p className="text-xs text-slate-500 mb-5">
              À effectuer chaque dimanche (jour de non-production). La checklist doit être complétée et signée par le Chef d'Équipe avant le redémarrage du lundi.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-5">
              {([
                { key: 'graissageRoulements', label: 'Graissage complet des roulements (Centrale Graissage)' },
                { key: 'nettoyageBusePate', label: 'Nettoyage et débouchage des buses de pâte' },
                { key: 'detartrageBruleur', label: 'Détartrage du brûleur et contrôle du débit gaz' },
                { key: 'controleGrilesVacuum', label: 'Contrôle et nettoyage des grilles tamis vacuum' },
                { key: 'verificationCourrois', label: 'Vérification tension courroies et chaînes de transmission' },
                { key: 'vidangeCircuitEau', label: 'Vidange partielle circuit eau / contrôle qualité eau recyclée' },
                { key: 'controlePressingOrganes', label: 'Contrôle pressage : inspection des organes d\'essorage' },
                { key: 'signatureChefEquipe', label: '✅ Validation et signature du Chef d\'Équipe Production' },
              ] as { key: keyof typeof checklistDimanche; label: string }[]).map(item => (
                <label key={item.key} className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                  checklistDimanche[item.key] 
                    ? 'bg-emerald-50 border-emerald-200' 
                    : 'bg-slate-50 border-slate-200 hover:border-slate-300'
                }`}>
                  <input
                    type="checkbox"
                    checked={checklistDimanche[item.key]}
                    onChange={e => setChecklistDimanche({ ...checklistDimanche, [item.key]: e.target.checked })}
                    className="w-4 h-4 rounded text-emerald-600 mt-0.5 shrink-0"
                  />
                  <span className={`text-xs font-bold ${ checklistDimanche[item.key] ? 'text-emerald-800 line-through decoration-emerald-500/60' : 'text-slate-800'}`}>
                    {item.label}
                  </span>
                </label>
              ))}
            </div>

            {/* Notes de maintenance */}
            <div className="space-y-2">
              <label className="text-xs font-black text-slate-700">Notes et Observations de Maintenance</label>
              <textarea
                rows={3}
                value={maintenanceNotes}
                onChange={e => setMaintenanceNotes(e.target.value)}
                placeholder="Ex: Remplacement joint brûleur N°2, commande pièces en attente..."
                className="w-full text-xs p-3 rounded-xl border border-slate-200 bg-slate-50 font-medium resize-none"
              />
            </div>

            <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-100">
              <div className="text-xs font-bold text-slate-500">
                {Object.values(checklistDimanche).filter(Boolean).length} / {Object.keys(checklistDimanche).length} éléments validés
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    const allDone = Object.values(checklistDimanche).every(Boolean);
                    if (!allDone) {
                      alert('Veuillez cocher tous les éléments de la checklist avant de valider.');
                      return;
                    }
                    const dateStr = new Date().toISOString().split('T')[0];
                    db.auditLogs.add({
                      id: `maint-${Date.now()}`,
                      timestamp: new Date().toISOString(),
                      userNom: 'Chef d\'Équipe Production',
                      userRole: 'RESPONSABLE_PRODUCTION',
                      action: 'VALIDATION_MAINTENANCE_PREVENTIVE',
                      entite: 'PRODUCTION',
                      description: `Checklist dimanche validée (${dateStr}) : ${maintenanceNotes || 'RAS – Entretien standard effectué.'}`
                    });
                    // Reset
                    setChecklistDimanche(Object.fromEntries(Object.keys(checklistDimanche).map(k => [k, false])) as any);
                    setMaintenanceNotes('');
                    alert('✅ Protocole dimanche validé et enregistré dans le journal d\'audit.');
                  }}
                  className="px-5 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-black text-xs shadow-md active:scale-95"
                >
                  ✅ Valider le Protocole Dimanche
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
