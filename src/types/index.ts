export type UserRole = 
  | 'DIRECTEUR_USINE'
  | 'RESPONSABLE_PRODUCTION'
  | 'RESPONSABLE_STOCK'
  | 'RESPONSABLE_COMMERCIAL'
  | 'COMPTABLE'
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
  | 'LIANT_ADJUVANT'
  | 'HYDROFUGE'
  | 'COLORANT'
  | 'EMBALLAGE_CERCLAGE'
  | 'PIECE_USURE';

export interface RawMaterialStock {
  id: string;
  reference: string;
  nom: string;
  categorie: RawMaterialCategory;
  unite: 'Kg' | 'Tonne' | 'Litre' | 'Rouleau' | 'Unité';
  stockActuel: number;
  seuilSecurite: number;
  coutMoyenAchatFCFA: number;
  fournisseurPrincipal?: string;
  emplacementStock: string;
  derniereReception?: string;
}

// Relevés de Shifts & Indicateurs de Productivité Industriels
export type ShiftType = 'MATIN_06H_14H' | 'SOIR_14H_22H' | 'NUIT_22H_06H';

export interface ProductionShiftRecord {
  id: string;
  date: string; // YYYY-MM-DD
  shift: ShiftType;
  ligneProduction: string; // ex: "Ligne 1 - Mouleuse Rotative 3000 alv/h"
  responsableShift: string;
  produitId: string;
  produitNom: string;
  
  // Temps industriel
  heuresPlanifiees: number; // ex: 8h
  heuresFonctionnement: number; // ex: 7.2h
  heuresArret: number; // ex: 0.8h
  motifArret?: string; // ex: Bourrage séchoir, nettoyage tamis

  // Quantités produites
  alvéolesConformes: number; // Unités bonnes
  fardeauxEmballes: number; // Fardeaux ficelés
  rebutsKilos: number; // Rebuts recyclés en pulpe
  rebutsPourcentage: number;

  // Matières consommées
  papierCartonConsommeKg: number;
  adjuvantKg: number;
  energieKwh?: number;
  eauRecycleeM3?: number;

  // KPIs de Productivité calculés (TRS / OEE)
  cadenceHoraireReelle: number; // alvéoles / heure
  cadenceTheorique: number; // alvéoles / heure
  tauxDisponibilite: number; // (Heures Fonc / Heures Planif) * 100
  tauxPerformance: number; // (Cadence Réelle / Cadence Théorique) * 100
  tauxQualite: number; // (Alvéoles Bonnes / Total Fabriqué) * 100
  trsOEE: number; // Disponibilité x Performance x Qualité
  ratioKgPar1000Alveoles: number; // kg papier consommé pour 1000 alvéoles
  statutControleQualite: 'CONFORME' | 'SOUS_SURVEILLANCE' | 'NON_CONFORME';
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
  adresse: string;
  capaciteFermePoules?: number;
  consommationMensuelleEstimeeAlveoles?: number;
  soldeDuFCFA: number;
  limiteCreditFCFA: number;
  delaiPaiementJours: number;
  coordonneesGPS?: { latitude: number; longitude: number };
  notes?: string;
}

// Commandes & Factures
export type OrderStatus = 
  | 'DEVIS'
  | 'CONFIRMEE'
  | 'EN_PRODUCTION'
  | 'PRETE_EXPEDITION'
  | 'EXPEDIEE'
  | 'LIVREE'
  | 'ANNULEE';

export type PaymentStatus = 'PAYE' | 'ACOMPTE' | 'NON_PAYE';
export type PaymentMethod = 'Wave' | 'Orange Money' | 'Virement Bancaire' | 'Chèque' | 'Espèces';

export interface OrderItem {
  produitId: string;
  reference: string;
  designation: string;
  format: AlveoleFormatType;
  fardeaux: number;
  quantiteUnites: number;
  prixUnitaireFCFA: number;
  totalLigneFCFA: number;
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
  articles: OrderItem[];
  totalHT: number;
  tvaMontant: number;
  totalTTC: number;
  acompteVerse: number;
  soldeRestant: number;
  statutCommande: OrderStatus;
  statutPaiement: PaymentStatus;
  modePaiementPrefere: PaymentMethod;
  notesLivraison?: string;
  chauffeurNom?: string;
  camionImmatriculation?: string;
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
  type: 'ENTREE_RECEPTION' | 'SORTIE_PULPEUR' | 'ENTREE_PRODUCTION_PF' | 'SORTIE_EXPEDITION' | 'REBUT_RECYLE';
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
  role: UserRole;
  phone: string;
  avatar?: string;
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
