export type UserRole = 
  | 'DIRECTEUR_USINE'
  | 'RESPONSABLE_PRODUCTION'
  | 'RESPONSABLE_STOCK'
  | 'COMMERCIAL'
  | 'RESPONSABLE_COMMERCIAL'
  | 'COMPTABLE'
  | 'CONTROLEUR_AUDITEUR'
  | 'SUPER_ADMIN';

export type SenegalRegion = 
  | 'Dakar'
  | 'Thiès'
  | 'Saint-Louis'
  | 'Diourbel'
  | 'Fatick'
  | 'Kaolack'
  | 'Kolda'
  | 'Louga'
  | 'Matam'
  | 'Kaffrine'
  | 'Kédougou'
  | 'Sédhiou'
  | 'Tambacounda'
  | 'Ziguinchor';

// Types d'acteurs clients pour les alvéoles
export type ClientCategory = 
  | 'Ferme Avicole Ponte'
  | 'Couvoir Industriel'
  | 'Grossiste Distributeur Emballages'
  | 'Coopérative Avicole'
  | 'Supermarché / Centrale d\'Achat'
  | 'Conditionneur d\'Œufs'
  | 'Autre Client B2B';

// Types de produits alvéoles
export type AlveoleFormatType = 
  | 'PLATEAU_30'
  | 'BOITE_6'
  | 'BOITE_10'
  | 'BOITE_12'
  | 'PLATEAU_30_EXPORT';

export interface AlveoleProduct {
  id: string;
  reference: string;
  nom: string;
  format: AlveoleFormatType;
  description: string;
  capaciteOeufs: number;
  poidsMoyenGrammes: number; // ex: 68g
  quantiteParFardeau: number; // ex: 100 unités par paquet/fardeau
  prixUnitaireFCFA: number; // Prix par alvéole
  prixFardeauFCFA: number; // Prix du fardeau
  stockFardeaux: number;
  stockTotalUnites: number;
  seuilAlerteFardeaux: number;
  couleur: string; // ex: Gris naturel, Vert écologique, Rose
  imageUrl?: string;
}

// Matières Premières & Consommables Usine
export type RawMaterialCategory = 
  | 'PAPIER_CARTON'
  | 'INTRANT_CHIMIQUE'
  | 'LIANT_ADJUVANT'
  | 'HYDROFUGE'
  | 'COLORANT'
  | 'EMBALLAGE_CERCLAGE'
  | 'EAU_ENERGIE'
  | 'PIECE_USURE';

export interface RawMaterialStock {
  id: string;
  reference: string;
  nom: string;
  categorie: RawMaterialCategory;
  estIntrant?: boolean; // CMC, Amidon, Calque... (Seuil d'alerte spécifique 25%)
  unite: 'Kg' | 'Tonne' | 'Litre' | 'Rouleau' | 'Unité' | 'm³';
  uniteMesure?: string; // Alias d'unité pour affichage et calcul
  stockActuel: number;
  seuilSecurite: number;
  coutMoyenAchatFCFA: number;        // Prix moyen pondéré actuel (recalculé à chaque entrée)
  prixAchatMinFCFA?: number;         // Prix minimum négocié (meilleure offre fournisseur)
  prixAchatMaxFCFA?: number;         // Prix maximum constaté
  fournisseurPrincipal?: string;     // Nom du fournisseur principal
  fournisseursPrixCatalogue?: {      // Catalogue de prix par fournisseur
    fournisseurId: string;
    fournisseurNom: string;
    prixUnitaireFCFA: number;
    devise?: string;
    conditionsPaiement?: string;
    delaiLivraisonJours?: number;
    derniereCommande?: string;
  }[];
  emplacementStock: string;
  derniereReception?: string;
  totalValeurStockFCFA?: number;     // = stockActuel × coutMoyenAchatFCFA
}

// ── Fiche Fournisseur d'Intrant (avec tarif négocié) ──────────────────────────
export interface IntrantSupplier {
  id: string;
  code: string;                      // Ex: FOURN-INT-001
  nom: string;                       // Raison sociale
  contact: string;                   // Nom du commercial / représentant
  telephone: string;
  email?: string;
  adresse?: string;
  ville?: string;
  pays: string;                      // Sénégal, France, Chine...
  intrantsLivres: string[];          // IDs des RawMaterialStock qu'il fournit
  prixCatalogue: {                   // Tarifs par intrant
    intrantId: string;
    intrantNom: string;
    prixUnitaireFCFA: number;
    unite: string;
    conditionnement?: string;        // Ex: 'Sacs 25 kg', 'Bidons 25 L'
    quantiteMinimaleCommande?: number;
    delaiLivraisonJours?: number;
    conditionsPaiement?: string;     // Ex: '30 jours fin de mois', 'Paiement avant livraison'
    remisePourcent?: number;
    prixNegocie?: number;            // Prix après négociation
  }[];
  notesCommerciales?: string;
  statut: 'ACTIF' | 'INACTIF' | 'EN_NEGOCIATION' | 'SUSPENDU';
  dateCreation: string;
}

// ── Mouvement d'Entrée / Sortie Stock Intrant (avec prix & fournisseur) ───────
export interface IntrantStockMovement {
  id: string;
  numeroMouvement: string;           // Ex: ENT-INT-20261027-001 / SOR-INT-...
  date: string;
  heure: string;
  type: 'ENTREE_ACHAT'               // Réception commande fournisseur
      | 'SORTIE_PRODUCTION'          // Consommation en production (dosage)
      | 'SORTIE_PERTE'               // Perte / gaspillage / rebut intrant
      | 'ENTREE_RETOUR_PRODUCTION'   // Retour intrant non utilisé en production
      | 'ENTREE_AJUSTEMENT'          // Ajustement inventaire (excédent)
      | 'SORTIE_AJUSTEMENT';         // Ajustement inventaire (manquant)
  intrantId: string;                 // Réf. RawMaterialStock.id
  intrantReference?: string;         // Réf produit catalogue (ex: MP-AKD-01)
  intrantNom: string;
  intrantCategorie: RawMaterialCategory;
  unite: string;
  quantite: number;                  // Quantité du mouvement (toujours positive)
  stockAvant: number;                // Stock avant mouvement
  stockApres: number;                // Stock après mouvement

  // ── Provenance & Fournisseur ───────────────────────────────────────────────
  paysProvenance?: string;           // Ex: Sénégal, Chine, France, Maroc...
  villeUsine?: string;               // Ville de l'usine productrice
  fournisseurId?: string;
  fournisseurNom?: string;
  fournisseurContact?: string;
  fournisseurTelephone?: string;
  fournisseurEmail?: string;
  fournisseurAdresse?: string;
  vehiculeImmatriculation?: string;
  chauffeurNom?: string;
  transitaire?: string;              // Transitaire/commissionnaire pour importations

  // ── Prix & Coûts (Fiche Réception Complète) ───────────────────────────────
  prixUsineUnitaireFCFA?: number;    // Prix départ usine fournisseur (EXW / FOB)
  prixUnitaireFCFA?: number;         // Prix rendu Dakar (franco) = usine + transport + taxes
  fraisTransportFCFA?: number;       // Frais de transport total pour ce lot
  fraisDedouanementFCFA?: number;    // Droits de douane + frais transitaire
  fraisDiversFCFA?: number;          // Manutention, magasinage, assurance...
  coutTotalRenduFCFA?: number;       // = quantité × prixUsine + fraisTransport + douane + divers
  montantTotalFCFA?: number;         // = quantité × prixUnitaireFCFA (prix franco)
  tauxChange?: number;               // Taux de change utilisé si devise étrangère
  deviseOrigine?: string;            // USD, EUR, CNY, XOF...
  prixEnDeviseOrigine?: number;      // Prix unitaire en devise d'origine

  // ── Références Documentaires ───────────────────────────────────────────────
  referenceBonCommande?: string;     // N° BC interne BS ALVÉOLES
  referenceFactureFournisseur?: string; // N° facture fournisseur
  numeroBL_Maritime?: string;        // Bill of Lading (importation maritime)
  numeroDedouanement?: string;       // Déclaration en douane / D10
  referencePaiement?: string;        // N° Wave TX, N° chèque, N° virement...
  modePaiement?: 'Wave' | 'Orange Money' | 'Virement Bancaire' | 'Chèque' | 'Espèces' | 'Crédit' | 'LC (Lettre de Crédit)';
  comptePaiement?: 'Wave Business' | 'Orange Money Pro' | 'Banque Principale' | 'Caisse Usine';
  conditionsPaiement?: string;       // Ex: '30 jours fin de mois', 'Paiement avant livraison'

  // ── Certificats & Documents Qualité ───────────────────────────────────────
  numeroCertificatAnalyse?: string;  // Certificate of Analysis (CoA)
  numeroCertificatOrigine?: string;  // Certificat d'Origine pays exportateur
  numeroCertificatPhytosanitaire?: string; // Certificat phytosanitaire (si applicable)
  numeroFicheMSDS?: string;          // Fiche de Données Sécurité (MSDS / FDS)
  certificationISO?: string;         // ISO 9001, ISO 14001, etc.
  lotFabricant?: string;             // N° lot fabricant (traçabilité)
  datePeremption?: string;           // Date de péremption (si applicable)
  dateProductionFabricant?: string;  // Date de fabrication

  // ── Conditionnement & Réception Physique ──────────────────────────────────
  conditionnement?: string;          // Ex: 'Sacs 25 kg', 'Big-bag 500 kg', 'Bidons 25 L', 'Fûts 200 L'
  nombreColis?: number;              // Nombre de sacs / bidons / fûts reçus
  poidsNetKg?: number;               // Poids net réel pesé à réception
  poidsBrutKg?: number;              // Poids brut (avec emballage)
  poidsDeclareFournisseurKg?: number; // Poids déclaré sur facture fournisseur
  ecartPeseeKg?: number;             // Écart = réel - déclaré (positif ou négatif)

  // ── Contrôle Qualité à Réception ──────────────────────────────────────────
  conformiteQualite?: 'CONFORME' | 'NON_CONFORME' | 'CONFORME_RESERVE' | 'EN_ATTENTE_LABO';
  apparenceVisuelleCRT?: 'OK' | 'ANOMALIE';  // Aspect, couleur, odeur
  emballageCRT?: 'INTACT' | 'ENDOMMAGE' | 'FUITES';
  humiditeMesuree?: number;          // Humidité mesurée (% pour les poudres)
  pHMesure?: number;                 // pH mesuré si liquide
  viscosite?: string;                // Viscosité si applicable
  echantillonPrelevePourLabo?: boolean; // Echantillon envoyé au laboratoire
  remarquesControleQualite?: string; // Observations du contrôleur qualité
  receptionnaireMagasin?: string;    // Nom du magasinier réceptionnaire
  validationChefMagasin?: boolean;   // Validé par le chef magasin
  chefMagasinNom?: string;

  // ── Données production (pour les sorties production) ──────────────────────
  shiftConsommation?: string;        // Ex: 'MATIN_06H_14H'
  ligneProduction?: string;
  numeroDemandeAutorisation?: string; // Réf. MaterialExitRequest.numeroDemande

  // ── Métadonnées ────────────────────────────────────────────────────────────
  enregistrePar: string;
  observations?: string;
  valide: boolean;                   // Validé par le responsable stock
  numeroBonGenere?: string;          // Bon de réception / bon de sortie généré
  photosUrls?: string[];             // Photos de la réception (URLs)
}

// Relevés de Shifts & Indicateurs de Productivité Industriels (CDC Section 5.1 & 5.2)
export type ShiftType = 'MATIN_06H_14H' | 'SOIR_14H_22H' | 'NUIT_22H_06H';

export type ShiftValidationStatus = 'BROUILLON' | 'SOUMIS_VALIDATION' | 'VALIDE' | 'REJETE';

export interface ProductionShiftRecord {
  id: string; // Ex: RP-20261027-01
  numeroRapport?: string; // Généré automatiquement
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  ligneProduction: string; // ex: "Ligne 1 - Mouleuse Rotative 3000 alv/h"
  responsableShift: string;
  produitId: string;
  produitNom: string;
  
  heureDemarrage?: string; // ex: 08:00
  heureArret?: string; // ex: 16:00
  heuresPlanifiees: number; // 8h de présence totale (Lundi au Samedi)
  heuresPause?: number; // 1h de pause réglementaire
  heuresFonctionnement: number; // Calculées (Heures Planifiées - Heures Pause - Heures Arrêt)
  heuresArret: number; // Arrêts machine non planifiés
  motifArret?: string; // ex: Bourrage séchoir, nettoyage tamis
  natureArret?: string;

  // Paramètres de référence industriels (Section 5.3)
  cadenceTheorique: number; // 2 000 alv/h nominale
  cadenceCible?: number; // 1 700 alv/h cible réelle
  tauxRendementCible?: number; // 85%
  quantiteTheoriqueAttendue?: number; // Cadence réelle cible × Heures effectives

  // Quantités produites (Section 5.1 & 5.2 Règles de cohérence)
  quantiteTotaleFabriquee?: number; // Total = Conforme + Non conforme
  alvéolesConformes: number; // Unités bonnes validées
  quantiteNonConforme?: number; // Non conforme = Rebuts + Réutilisable
  fardeauxEmballes: number; // Fardeaux ficelés (lots de 100)
  rebutsKilos: number; // Rebuts recyclés en pulpe
  rebutsPourcentage: number; // Taux de rebut (%)
  quantiteMiseEnRebut?: number;
  quantiteReutilisable?: number; // Quantité réutilisable / réinjectée

  // Matières consommées
  papierCartonConsommeKg: number;
  adjuvantKg: number;
  energieKwh?: number;
  eauRecycleeM3?: number;

  // Paramètres Ligne Shuliy (Processus Continu & Boucle Fermée)
  concentrationPatePourcent?: number; // Cible stricte : 2.0 à 3.0 % (Cuve d'Homogénéisation)
  eauRecycleeBoucleFermee?: boolean; // Circuit de récupération d'eau en boucle fermée actif
  nombreCyclesEau?: number; // Nombre de cycles de réutilisation (1 à 5)
  nettoyageMoulesApresCycle?: boolean; // Machine de nettoyage des moules activée post-cycle
  equipementSourceDefaut?: string; // Appareil de la chaîne Shuliy identifié comme source de dérive

  // KPIs de Productivité calculés (TRS / OEE & Section 5.6)
  cadenceHoraireReelle: number; // alvéoles / heure (Total ÷ heures effectives)
  tauxDisponibilite: number; // (Heures Fonc / Heures Planif) * 100
  tauxPerformance: number; // (Cadence Réelle / Cadence Théorique) * 100
  tauxQualite: number; // (Alvéoles Bonnes / Total Fabriqué) * 100
  trsOEE: number; // Disponibilité x Performance x Qualité
  ratioKgPar1000Alveoles: number; // kg papier consommé pour 1000 alvéoles
  rendementMatiereAlvParKg?: number; // Alvéoles produites ÷ kg papier consommés (cible 35)
  realisationCiblePourcent?: number; // Production réelle ÷ production cible × 100
  ecartProductionAlveoles?: number; // Production réelle - production cible
  
  // Validation & Dérogation (Section 5.1 & 5.2)
  statutValidation?: ShiftValidationStatus;
  validePar?: string;
  dateValidation?: string;
  derogationAccordee?: boolean;
  motifDerogation?: string;

  statutControleQualite: 'CONFORME' | 'SOUS_SURVEILLANCE' | 'NON_CONFORME';
  observations?: string;
}

// ─── Équipements Réels de la Ligne Shuliy Machinery (100 m² - Processus Continu) ───
export type ShuliyEquipmentType =
  | 'HYDRAPULPEUR'                 // 1. Hydrapulpeur hydraulique à pales
  | 'CUVE_HOMOGENEISATION'         // 2. Cuve d'homogénéisation (concentration 2-3%, amidon/AKD)
  | 'POMPE_A_PATE'                 // 3. Pompe à pâte sous pression
  | 'MACHINE_A_MOULER'             // 4. Machine à mouler Shuliy SL-3-4 / SL-4-4 (moules alu)
  | 'POMPE_A_VIDE'                 // 5. Pompe à vide (aspiration & séparation eau)
  | 'COMPRESSEUR_AIR'              // 6. Compresseur d'air (jet de démoulage calibré)
  | 'SYSTEME_SECHAGE'              // 7. Système de séchage (conteneur / chambre thermique)
  | 'CIRCUIT_RECUPERATION_EAU'     // 8. Pompe eaux usées & boucle fermée (jusqu'à 5 cycles)
  | 'MACHINE_NETTOYAGE_MOULES'     // 9. Machine de nettoyage des moules post-cycle
  | 'ARMOIRE_TGBT'                 // Armoire électrique TGBT (380V - 50Hz)
  | 'AUTRE';

export const SHULIY_EQUIPMENTS = [
  { id: 'HYDRAPULPEUR', nom: '1. Hydrapulpeur Hydraulique (Broyage & Pales)', etape: 1, role: 'Défibrage des cartons avec eau' },
  { id: 'CUVE_HOMOGENEISATION', nom: '2. Cuve d\'Homogénéisation (Concentration 2-3%)', etape: 2, role: 'Stabilisation pâte & mélange additifs' },
  { id: 'POMPE_A_PATE', nom: '3. Pompe à Pâte (Acheminement sous pression)', etape: 3, role: 'Transfert régulier cuve vers mouleuse' },
  { id: 'MACHINE_A_MOULER', nom: '4. Machine à Mouler Shuliy (SL-3-4 / SL-4-4)', etape: 4, role: 'Moulage sous vide des plateaux 30 œufs' },
  { id: 'POMPE_A_VIDE', nom: '5. Pompe à Vide (Dépression & Extraction eau)', etape: 5, role: 'Placage de la pâte et déshydratation' },
  { id: 'COMPRESSEUR_AIR', nom: '6. Compresseur d\'Air (Souffle de démoulage)', etape: 6, role: 'Éjection précise sans déformation' },
  { id: 'SYSTEME_SECHAGE', nom: '7. Système de Séchage (Chambre / Conteneur)', etape: 7, role: 'Évaporation de l\'eau sur racks' },
  { id: 'CIRCUIT_RECUPERATION_EAU', nom: '8. Pompe Eaux Usées (Boucle fermée 5 cycles)', etape: 8, role: 'Recyclage écologique et réinjection au pulpeur' },
  { id: 'MACHINE_NETTOYAGE_MOULES', nom: '9. Machine de Nettoyage des Moules', etape: 9, role: 'Élimination des résidus de fibres post-cycle' },
  { id: 'ARMOIRE_TGBT', nom: 'Armoire Électrique TGBT (380V - 50Hz)', etape: 0, role: 'Distribution générale de puissance' }
] as const;

// ─── Module 2.4 - Contrôle Qualité des Défauts (Section 5.4 du CDC) ────────
export type DefautQualiteType = 
  | 'DEFORMATION'
  | 'CASSURE'
  | 'SURFACE_IRREGULIERE'
  | 'HUMIDITE_RESIDUELLE'
  | 'DEFAUT_EMPILAGE'
  | 'AUTRE';

export interface QualityControlRecord {
  id: string;
  numeroControle: string; // Ex: QC-20261027-01
  date: string;
  heure: string;
  rapportProductionId: string;
  produitId: string;
  produitNom: string;
  quantiteControlee: number;
  quantiteConforme: number;
  quantiteRejetee: number;
  tauxRebut: number; // (quantiteRejetee ÷ quantiteControlee) * 100
  statutSeuil: 'VERT' | 'ORANGE' | 'ROUGE'; // ≤3% Vert, 3-5% Orange, >5% Rouge
  typeDefaut: DefautQualiteType;
  detailsDefaut?: string;
  causeProbable: string;
  actionCorrective: string;
  responsableControle: string;
  statutResolution: 'OUVERT' | 'EN_COURS' | 'CORRIGE' | 'CLOTURE';
}

// ─── Module 2.5 - Incidents et Arrêts Machine (Section 5.5 du CDC) ──────────
export type IncidentNatureType = 
  | 'COUPURE_ELECTRIQUE'
  | 'RUPTURE_MATIERE_PREMIERE'
  | 'BLOCAGE_MACHINE'
  | 'DERIVE_QUALITE'
  | 'PANNE_MECANIQUE'
  | 'PANNE_HYDRAULIQUE_VIDE'
  | 'AUTRE';

export interface MachineIncidentRecord {
  id: string;
  numeroIncident: string; // Ex: INC-20261027-01
  date: string;
  heureDebut: string;
  heureFin: string;
  dureeArretMinutes: number;
  dureeArretHeures: number;
  equipementConcerne: string; // Mouleuse rotative, Pulpeur, Séchoir tunnel, Pompe à vide...
  natureIncident: IncidentNatureType;
  causeIdentifiee: string;
  mesuresPrises: string;
  recoursAssistanceExterieure: boolean;
  prestataireNom?: string;
  impactProductionAlveoles: number; // Perte estimée d'alvéoles
  responsableResolution: string;
  statutCloture: 'EN_COURS' | 'RESOLU' | 'CLOTURE';
  rapportProductionId?: string;
}

export interface RejectedRawMaterialRecord {
  id: string;
  date: string;
  mpReference: string;
  mpNom: string;
  quantiteKg: number;
  motifRejet: string;
  fournisseur: string;
  statut: 'EN_ATTENTE_DECISION' | 'RECYCLE_PULPEUR' | 'EVACUATION_DEFINITIVE';
  responsableTri: string;
  dateDecision?: string;
  observations?: string;
}

// Réception Matière Première & Collecte Usine (CDC 6.2, 6.3 & Spécifications Audio Client)
export interface RawMaterialReceptionVoucher {
  id: string;
  numeroBon: string;
  date: string;
  heure: string;
  modeApprovisionnement: 'FOURNISSEUR_LIVRAISON' | 'COLLECTE_USINE';
  
  // Si Fournisseur :
  fournisseurNom: string;
  fournisseurPrenom?: string;
  fournisseurContact?: string;
  fournisseurAdresse?: string;
  transporteur?: string;
  chauffeurNom?: string;
  chauffeurTel?: string;
  chauffeurAdresse?: string;
  vehiculeImmatriculation?: string;
  vehiculeCouleur?: string;
  numeroBonPesee?: string;
  numeroFactureFournisseur?: string;
  priseEnChargeTransport?: boolean; // Prise en charge du transport par l'Usine (Oui/Non)
  coutTransportPrisEnChargeFCFA?: number; // Montant transport pris en charge

  // Géolocalisation & Itinéraire GPS (CDC & Audio Client)
  latitude?: string;
  longitude?: string;
  altitude?: string;
  coordonneesGPS?: { latitude: number; longitude: number; altitude?: number };

  // Si Collecte interne par l'Usine :
  agentCollecteNom?: string;
  agentCollecteTel?: string;
  siteEntrepriseCollectee?: string;
  structureCollecte?: string; // Structure ou source de collecte (Schéma p.3)
  numeroFicheCollecte?: string; // Numéro de fiche de collecte (Schéma p.3)
  sitesCollectesMultiples?: { usineNom: string; emplacement: string; quantiteKg: number }[];
  vehiculeType?: 'VEHICULE_USINE' | 'VEHICULE_LOCATION';
  loueurNom?: string;
  coutLocationFCFA?: number;
  valorisationQuantiteRecueFCFA?: number; // Valorisation financière de la quantité reçue (Schéma p.3)
  heureDepart?: string;
  heureRetour?: string;
  respectNormesQualite?: boolean; // Respect des normes et qualité de papier favorable à l'entreprise

  // Caractéristiques matière
  mpId: string;
  mpNom: string;
  typePapierCarton: string; // Balles OCC, Journaux, Kraft, Rognures, Mixte
  estGratuitDebarras: boolean; // Si l'entreprise donne gratuitement pour débarras (0 FCFA)
  prixUnitaireKg: number; // Standard 250 FCFA/kg si acheté
  quantiteDeclareeKg: number;
  quantiteBruteReceptionneeKg: number;
  coutTotalBrutFCFA: number; // (quantiteBruteReceptionneeKg * prixUnitaireKg) + coutLocation

  // Processus de Tri & Déclassement (Section 6.3)
  statutTri: 'EN_ATTENTE_DE_TRI' | 'TRI_EFFECTUE';
  dateTri?: string;
  responsableTri?: string;
  quantiteExploitableKg?: number; // Matière qui intègre le stock exploitable
  quantiteRejeteeKg?: number; // Matière qui va en zone quarantaine / rejetée
  rendementTriPourcent?: number; // (quantiteExploitable / quantiteBrute) * 100
  coutRevientReelKg?: number; // coutTotalBrutFCFA / quantiteExploitableKg
  motifRejet?: string;

  // Bon de Retour Fournisseur si tri insatisfaisant (Règle Client)
  bonRetourGenere?: boolean;
  numeroBonRetour?: string;
  uniteMesure?: string; // Standard 'Kg'
  montantTotalFCFA?: number; // Montant total calculé (prixUnitaireKg * quantiteBruteReceptionneeKg)
  utilisateurReception?: string; // Utilisateur ayant effectué la réception physique
  magasinierReception: string;
  observations?: string;
}

// Bon de Retour Matière Première au Fournisseur (Spécification Client)
export interface RawMaterialSupplierReturnVoucher {
  id: string;
  numeroBonRetour: string; // Ex: BRF-20261027-01
  date: string;
  heure: string;
  receptionId: string;
  numeroBonReception: string;
  fournisseurNom: string;
  fournisseurContact?: string;
  fournisseurAdresse?: string;
  mpNom: string;
  quantiteBruteKg: number;
  quantiteRejeteeKg: number;
  tauxConformePourcent: number;
  motifRetour: string;
  prixUnitaireKg: number; // 250 FCFA
  montantAvoirFCFA: number; // quantiteRejeteeKg * 250
  transporteur?: string;
  chauffeurNom?: string;
  chauffeurTel?: string;
  chauffeurAdresse?: string;
  vehiculeImmatriculation?: string;
  magasinierNom: string;
  statut: 'RETOUR_EMIS' | 'TRANSMIS_FOURNISSEUR' | 'AVOIR_REGULARISE';
  observations?: string;
}

// Workflow Demande d'Autorisation de Sortie Matière vers Production (Spécification Client)
export interface MaterialExitRequest {
  id: string;
  numeroDemande: string; // Ex: DSM-20261027-01
  date: string;
  heure: string;
  mpId: string;
  mpNom: string;
  quantiteKgDemandee: number;
  shift: ShiftType;
  ligneProduction: string;
  demandeurNom: string; // Responsable Production / Chef de quart
  motifBesoins: string; // Alimentation pulpeur, dosage intrants CMC/amidon...
  statut: 'EN_ATTENTE_AUTORISATION' | 'APPROUVEE_DESTOCKEE' | 'REJETEE';
  autorisePar?: string; // Magasinier / Responsable Stock
  dateAutorisation?: string;
  numeroBonSortieGenere?: string;
  motifRefus?: string;
  observations?: string;
}

// Client B2B
export interface Client {
  id: string;
  codeClient: string;
  raisonSociale: string;
  contactNom: string;
  telephone: string;
  email?: string;
  categorie: ClientCategory;
  region: SenegalRegion;
  departement?: string;
  commune?: string;
  quartier?: string;
  adresse: string;
  latitude?: number;
  longitude?: number;
  coordonneesGPS?: { latitude: number; longitude: number };
  capaciteFermePoules?: number;
  consommationMensuelleEstimeeAlveoles?: number;
  potentielCommercialLotsMois?: number;  // Potentiel commercial estimé (CDC 7.1)
  commercialResponsableId?: string;      // Commercial assigné à ce client (CDC 7.1)
  commercialResponsableNom?: string;
  statutRelation?: 'PROSPECT' | 'CLIENT_ACTIF' | 'CLIENT_INACTIF' | 'PARTENAIRE_CLE' | 'SUSPENDU'; // CDC 7.1
  soldeDuFCFA: number;
  limiteCreditFCFA: number;
  delaiPaiementJours: number;
  notes?: string;
  dateCreation?: string;
  derniereActivite?: string;             // Date de la dernière transaction
}

// Commandes & Factures
export type OrderStatus = 
  | 'BROUILLON'
  | 'DEVIS'
  | 'CONFIRMEE'
  | 'EN_PRODUCTION'
  | 'EN_PREPARATION'
  | 'PRETE_EXPEDITION'
  | 'EXPEDIEE'
  | 'LIVREE'
  | 'PARTIELLEMENT_LIVREE'
  | 'ANNULEE'
  | 'CLOTUREE';

export type PaymentStatus = 'PAYE' | 'ACOMPTE' | 'NON_PAYE' | 'EN_CONTENTIEUX';
export type PaymentMethod = 'Wave' | 'Orange Money' | 'Virement Bancaire' | 'Chèque' | 'Espèces';

export type DeliveryStatus = 'A_PREPARER' | 'EN_PREPARATION' | 'EXPEDIEE' | 'LIVREE' | 'LIVREE_PARTIELLEMENT' | 'REFUSEE' | 'ANNULEE';

export interface OrderItem {
  produitId: string;
  reference: string;
  designation: string;
  format: AlveoleFormatType;
  fardeaux: number;
  quantiteUnites: number;
  prixUnitaireFCFA: number;
  remisePourcent?: number;    // Remise autorisée en % (CDC 7.5 & 9.3 max 10%)
  montantRemiseFCFA?: number; // Montant de la remise calculé
  totalLigneFCFA: number;     // Après remise
}

export interface Invoice {
  id: string;
  numero: string; // FAC-2610-0001
  numeroBL?: string; // BL-2610-0001
  date: string;
  dateEcheance: string;
  clientId: string;
  clientNom: string;
  clientRegion: SenegalRegion;
  commercialId?: string;       // Commercial responsable de la vente (CDC 7.5)
  commercialNom?: string;
  articles: OrderItem[];
  totalHT: number;
  totalRemiseFCFA?: number;    // Montant total des remises accordées
  tvaMontant: number;
  totalTTC: number;
  acompteVerse: number;
  soldeRestant: number;
  statutCommande: OrderStatus;
  statutPaiement: PaymentStatus;
  modePaiementPrefere: PaymentMethod;
  referencePaiement?: string;  // Référentiel de paiement : N° Wave TX, OM SN, N° chèque, N° virement...
  compteCrediteeAcompte?: 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro'; // Compte crédité lors de l'acompte
  notesLivraison?: string;
  chauffeurNom?: string;
  camionImmatriculation?: string;
  // Séparation Facture / Livraison / Encaissement (CDC 7.6)
  datelivraison?: string;      // Date effective de la livraison
  dateEncaissement?: string;   // Date du dernier paiement complet
  piecesJointes?: string[];    // Références de pièces jointes
  annulee?: boolean;           // Facture annulée (jamais supprimée)
  motifAnnulation?: string;
  avoirNumero?: string;        // Si remplacée par un avoir
}

// Enregistrement d'un Paiement / Encaissement (CDC 7.6 - séparation livraison/encaissement)
export interface PaymentRecord {
  id: string;
  factureId: string;
  factureNumero: string;
  clientId: string;
  clientNom: string;
  date: string;
  montantFCFA: number;
  modePaiement: PaymentMethod;
  reference?: string;          // Numéro de chèque, référence virement, code Wave...
  compteCreditee: 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro';
  enregistrePar: string;
  observations?: string;
}

// Bon de Livraison distinct (CDC 7.7 - ne pas sortir 2 fois le stock)
export interface DeliveryNote {
  id: string;
  numeroBL: string;            // BL-2026-001
  factureId?: string;
  factureNumero?: string;
  clientId: string;
  clientNom: string;
  date: string;
  dateLivraisonPrevue?: string;
  dateLivraisonEffective?: string;
  articles: OrderItem[];
  quantitePrevueFardeaux: number;
  quantitelivreeFardeaux: number;
  responsableLivraison: string;
  chauffeurNom?: string;
  camionImmatriculation?: string;
  statut: DeliveryStatus;
  preuveLivraison?: string;    // Référence de la preuve (signature, photo...)
  reservesClient?: string;     // Éventuelles réserves à la réception
  stockSortiOfficiel: boolean; // TRUE = sortie de stock officielle déjà enregistrée
  observations?: string;
}

// Dépenses & Trésorerie
export type ExpenseCategory = 
  | 'Matières Premières (Balles Cartons)'
  | 'Adjuvants & Liants Chimiques'
  | 'Électricité & Énergie Séchoir'
  | 'Maintenance Machines & Pièces'
  | 'Salaires & Primes Usine'
  | 'Transport & Carburant'
  | 'Eau & Traitement Recyclage'
  | 'Emballage & Cerclage'
  | 'Charges Administratives & Taxes'
  | 'Autre Dépense Usine';

export interface Expense {
  id: string;
  date: string;
  categorie: ExpenseCategory;
  montant: number;
  beneficiaire: string;
  description: string;
  comptePaiement: 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro';
  justificatifRef?: string;
  enregistrePar: string;
}

// Mouvements de Stock
export interface StockMovement {
  id: string;
  date: string;
  type: 
    | 'ENTREE_RECEPTION' 
    | 'SORTIE_PULPEUR' 
    | 'ENTREE_PRODUCTION_PF' 
    | 'SORTIE_EXPEDITION' 
    | 'REBUT_RECYLE' 
    | 'SORTIE_COMMERCIAL' 
    | 'SORTIE_COMMERCIALE'
    | 'RETOUR_COMMERCIAL'
    | 'RECEPTION_BRUTE'
    | 'TRI_CONFORME_EXPLOITABLE'
    | 'TRI_NON_CONFORME_REJET'
    | 'RETOUR_INVENDU_CONFORME'
    | 'AJUSTEMENT_INVENTAIRE';
  articleType: 'MATIERE_PREMIERE' | 'PRODUIT_FINI';
  articleId: string;
  articleNom: string;
  quantite: number;
  unite: string;
  coutUnitaire?: number;
  referenceLot?: string;
  responsable: string;
  motif: string;
}

// Bon de Sortie vers un Commercial (Page 13, section 6.6 du CDC)
export interface CommercialExitVoucher {
  id: string;
  numeroBon: string;
  date: string;
  heure?: string;
  commercialId: string;
  commercialNom: string;
  produitId: string;
  produitNom: string;
  quantiteLots: number; // En lots de 100 alvéoles
  quantiteUnites: number;
  stockUsineAvant?: number;
  stockUsineApres?: number;
  stockCommercialAvant?: number;
  stockCommercialApres?: number;
  destinationZone?: string;
  vehiculeImmatriculation?: string;
  magasinierNom: string;
  statut: 'REMIS' | 'CONFIRME_PAR_COMMERCIAL' | 'VALIDE';
  observations?: string;
}

// Bon de Retour Invendus Commercial (Page 13, section 6.7 du CDC)
export interface CommercialReturnVoucher {
  id: string;
  numeroRetour: string;
  date: string;
  heure?: string;
  commercialId: string;
  commercialNom: string;
  produitId: string;
  produitNom: string;
  quantiteLots: number;
  quantiteUnites?: number;
  motif: string;
  decision?: 'ACCEPTE_CONFORME' | 'ACCEPTE_SOUS_RESERVE' | 'NON_CONFORME_RECYCLE' | 'REFUSE';
  statut: 'EN_ATTENTE_CONTROLE' | 'ACCEPTE_CONFORME' | 'ACCEPTE_SOUS_RESERVE' | 'NON_CONFORME_RECYCLE' | 'REFUSE' | 'TRAITE';
  magasinierNom?: string;
  dateValidation?: string;
  dateTraitement?: string;
  observations?: string;
}

// Contrats Commerciaux B2B (Page 15, section 7.2 du CDC)
export interface CommercialContract {
  id: string;
  numeroContrat: string;
  clientId: string;
  clientNom: string;
  dateSignature: string;
  dateDebut: string;
  dateFin: string;
  dureeMois: number;
  volumeMensuelLots: number; // en lots de 100 alvéoles
  prixContractuelAlveole: number; // 30 FCFA
  prixContractuelLot: number; // 3 000 FCFA
  frequenceLivraison: string;
  volumeTotalContractuelLots: number;
  volumeLivreLots: number;
  volumeRestantLots: number;
  statut: 'EN_COURS' | 'CLOTURE' | 'EN_RENOUVELLEMENT';
  conditionsPaiement: string;
}

// Compte de Trésorerie
export interface AccountBalance {
  nom: 'Caisse Usine' | 'Banque Principale' | 'Wave Business' | 'Orange Money Pro';
  solde: number;
  dernierRapprochement: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  password?: string;
  role: UserRole;
  phone: string;
  avatar?: string;
  department?: string;
  actif?: boolean;
  dateCreation?: string;
  dernierAcces?: string;
}

export interface SystemNotification {
  id: string;
  type: 'production' | 'stock' | 'finance' | 'commercial';
  title: string;
  message: string;
  date: string;
  isRead: boolean;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userNom: string;
  userRole: UserRole;
  action: string;
  entite: string;
  description: string;
  nouvelleValeur?: string;
}

// ─── Module Inventaires Périodiques (Hebdomadaire & Mensuel) ────────
export type InventoryFrequency = 'HEBDOMADAIRE' | 'MENSUEL' | 'EXCEPTIONNEL';

export interface InventoryItemResult {
  articleId: string;
  articleNom: string;
  articleType: 'MATIERE_PREMIERE' | 'PRODUIT_FINI';
  unite: string;
  stockTheorique: number;
  stockPhysique: number;
  ecartQuantite: number; // physique - theorique
  valeurUnitaireFCFA: number;
  ecartValeurFCFA: number;
  statut: 'CONFORME' | 'SURPLUS' | 'DEFICIT';
  justification?: string;
}

export interface InventorySession {
  id: string;
  date: string; // YYYY-MM-DD
  frequence: InventoryFrequency;
  titre: string;
  responsable: string;
  supervisePar?: string;
  articles: InventoryItemResult[];
  totalArticles: number;
  articlesConformes: number;
  articlesEnEcart: number;
  valeurEcartNetFCFA: number; // Somme des écarts en FCFA
  statutValidation: 'VALIDE' | 'EN_COURS' | 'REJETE';
  notes?: string;
}

// ─── Module Administration & Paramètres Usine (Section 9 du CDC) ────────
export interface FactorySystemParameters {
  id: string; // 'settings-default'
  // 9.1 Paramètres industriels
  cadenceNominale: number; // 2 000 alv/h
  tauxRendementRetenu: number; // 85%
  cadenceReelleCible: number; // 1 700 alv/h
  heuresEffectivesParJour: number; // 8h
  joursProductionParMois: number; // 26 jours
  rendementMatiereAlvParKg: number; // 35 alv/kg
  besoinMensuelPapierKg: number; // ~10 100 kg
  seuilVertRebut: number; // ≤ 3%
  seuilRougeRebut: number; // > 5%

  // 9.2 Paramètres commerciaux
  tailleLotCommercial: number; // 100 alvéoles
  prixContractuelAlveole: number; // 30 FCFA
  prixMarcheOuvertAlveole: number; // 35 FCFA
  prixContractuelLot: number; // 3 000 FCFA
  prixMarcheOuvertLot: number; // 3 500 FCFA
  dureeIndicativeContratsMois: number; // 12 mois
  partContractuelleViseePourcent: number; // 60%
  partMarcheOuvertPourcent: number; // 40%

  // 9.3 Paramètres financiers
  prixAchatPapierKg: number; // 100 FCFA / kg
  forfaitTransportPapierMensuel: number; // 300 000 FCFA / mois
  coutKwhElectricite: number; // 115 FCFA / kWh
  coutM3Eau: number; // 650 FCFA / m3
  delaiPaiementParDefautJours: number; // 15 jours
  tauxRemiseMaxPourcent: number; // 10%

  // 4.3 Seuils d'alertes automatiques configurables (Module 1 - CDC Section 4.3)
  seuilAlerteJoursAutonomiePapier?: number; // Jours de couverture min papier critique (ex: 5 j)
  seuilAlerteCadenceMin?: number; // Cadence min usine acceptable (ex: 1 500 alv/h)
  seuilAlerteTauxRebutMax?: number; // Taux de rebut max toléré (ex: 5.0 %)
  seuilAlerteArretMachineProlongeHeures?: number; // Seuil arrêt machine prolongé (ex: 1.5 h)
  seuilAlerteStockMinLotsProduitsFinis?: number; // Seuil stock usine minimal PF (ex: 200 lots)
  seuilAlerteStockCommercialPlafondLots?: number; // Plafond stock détenu par un commercial (ex: 250 lots)
  seuilAlerteCreancesMaxFCFA?: number; // Seuil global de créances clients critiques (ex: 1 500 000 FCFA)
  seuilAlerteDelaiFactureEchueJours?: number; // Délai d'échéance facture impayée (ex: 15 j)
  seuilAlerteEcheanceContratJours?: number; // Alerte avant échéance contrat B2B (ex: 30 j)
  seuilAlerteEcartInventaireValeurFCFA?: number; // Tolérance écart financier inventaire (ex: 50 000 FCFA)

  derniereModification?: string;
  modifiePar?: string;
  motifDerniereModification?: string;
}

// ─── Procédures Opérationnelles A.2.1 Démarrage, Descente & Pointage ──────
export interface ShiftChecklistDemarrage {
  alimentationElectrique: boolean;
  arriveeEau: boolean;
  pulpeurPropre: boolean;
  moulesPositionnes: boolean;
  sechoirVide: boolean;
  epiPortes: boolean;
  autorisationChefEquipe: boolean;
  chefEquipeNom: string;
  heureAutorisation: string;
}

export interface ShiftChecklistDescente {
  arretProgressifMachines: boolean;
  vidangePartiellePulpeur: boolean;
  nettoyageImmediat: boolean;
  coupureElectriqueGenerale: boolean;
  verrouillagesLocaux: boolean;
  rapportJournalierRempli: boolean;
  validePar: string;
  heureDescente: string;
}

export interface ShiftTaskLog {
  id: string;
  heure: string;
  designation: string;
  statut: 'EFFECTUE' | 'EN_COURS';
  operateurNom: string;
}

export interface ShiftAttendanceRecord {
  id: string;
  date: string;
  shift: ShiftType | 'JOURNEE_MAGASIN';
  collaborateurId: string;
  collaborateurNom: string;
  poste: string;
  heureArrivee: string;
  heureDescente?: string;
  heuresEffectivesMinutes?: number;
  statut: 'EN_POSTE' | 'TERMINE' | 'RETARD';
  checklistDemarrage: ShiftChecklistDemarrage;
  checklistDescente?: ShiftChecklistDescente;
  tachesHoraires: ShiftTaskLog[];
  observations?: string;
}


