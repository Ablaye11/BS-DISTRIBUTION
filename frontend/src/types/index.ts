export type UserRole = 
  | 'ADMIN_GENERAL'
  | 'COMMERCIAL'
  | 'DEMARCHEUR'
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

export type ClientCategory = 
  | 'Grossiste'
  | 'Alimentation'
  | 'Supérette'
  | 'Mini-market'
  | 'Fast-food'
  | 'Boutique'
  | 'Tangana'
  | 'Autre';

export type ProspectStatus = 
  | 'Nouveau'
  | 'Contacté'
  | 'En discussion'
  | 'À relancer'
  | 'Converti'
  | 'Perdu';

export type PoulaillerStatus = 
  | 'Prospect'
  | 'Contact'
  | 'Visite'
  | 'Contrat'
  | 'Fournisseur Actif'
  | 'Inactif';

export type OrderStatus = 
  | 'Brouillon'
  | 'En attente de validation'
  | 'Validée'
  | 'Préparée'
  | 'Livrée'
  | 'Partiellement livrée'
  | 'Annulée';

export type PaymentMethod = 
  | 'Wave'
  | 'Orange Money'
  | 'Free Money'
  | 'Espèces'
  | 'Chèque'
  | 'Virement Bancaire';

export type PaymentStatus = 
  | 'Payée'
  | 'Acompte'
  | 'Non Payée / Crédit';

export type EggCategoryType = 
  | 'Œufs Gros Calibre'
  | 'Œufs Poulettes'
  | 'Œufs Fissurés (Cat 1)'
  | 'Œufs Cassés (Cat 2)';

export interface GPSLocation {
  latitude: number;
  longitude: number;
  accuracy?: number;
  timestamp: string;
  capturedBy?: string;
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  avatar?: string;
}

export interface ProspectInteraction {
  id: string;
  prospectId: string;
  date: string;
  typeInteraction: 'Appel' | 'Visite Terrain' | 'Rendez-vous' | 'Relance SMS/WhatsApp';
  commentaire: string;
  prochaineAction?: string;
  responsable: string;
}

export interface Prospect {
  id: string;
  nom: string;
  contact: string;
  responsable: string;
  telephone: string;
  adresse: string;
  region: SenegalRegion;
  departement: string;
  commune: string;
  gps?: GPSLocation;
  typeProducteur?: string;
  nombrePoulets?: number;
  productionJournaliereOeufs?: number;
  status: ProspectStatus;
  scoring: number; // 0 - 100
  notes: string;
  commercialId: string;
  commercialName: string;
  createdAt: string;
  updatedAt: string;
  interactions?: ProspectInteraction[];
}

export interface Client {
  id: string;
  raisonSociale: string;
  responsable: string;
  telephone: string;
  email?: string;
  adresse: string;
  region: SenegalRegion;
  departement: string;
  commune: string;
  gps?: GPSLocation;
  categorie: ClientCategory;
  commercialId: string;
  commercialName: string;
  soldeCreance: number; // En FCFA
  totalAchatsFCFA: number;
  createdAt: string;
}

export interface Poulailler {
  id: string;
  nom: string;
  proprietaire: string;
  telephone: string;
  adresse: string;
  region: SenegalRegion;
  departement: string;
  commune: string;
  gps?: GPSLocation;
  capacitePoulets: number;
  productionJournaliereOeufs: number; // En nombre d'œufs
  demarcheurId: string;
  demarcheurName: string;
  status: PoulaillerStatus;
  tauxCommissionPercent: number; // ex: 2.5%
  createdAt: string;
}

export interface SaleItem {
  typeOeuf: EggCategoryType;
  quantiteOeufs: number; // UNITE UNIQUE : Nombre d'œufs
  prixUnitaireOeuf: number; // Prix par œuf en FCFA
  totalFCFA: number;
}

export interface Invoice {
  id: string;
  numero: string; // FAC-YYMM-####
  numeroBL?: string; // BL-YYMM-####
  clientId: string;
  clientNom: string;
  commercialId: string;
  commercialNom: string;
  items: SaleItem[];
  totalFCFA: number;
  acompteFCFA: number;
  soldeDuFCFA: number;
  modePaiement: PaymentMethod;
  referencePaiement?: string;
  statutPaiement: PaymentStatus;
  statutVente: OrderStatus;
  date: string;
  livreurNom?: string;
  observations?: string;
}

export interface DeliveryMissionPlanner {
  id: string;
  numeroBL: string; // BL-YYMM-####
  factureNumero: string;
  clientNom: string;
  telephone: string;
  adresse: string;
  region: SenegalRegion;
  commune: string;
  quantiteOeufs: number;
  livreurNom: string;
  vehiculeType: string;
  datePlanifiee: string;
  statut: 'Préparée' | 'En cours de livraison' | 'Livrée' | 'Livraison Partielle' | 'Annulée';
  remarques?: string;
}

export interface InterregionalMission {
  id: string;
  titre: string;
  responsableNom: string;
  destinationRegion: SenegalRegion;
  dateDepart: string;
  dateRetour?: string;
  stockDepartOeufs: number; // UNITE UNIQUE : ŒUFS
  stockVenduOeufs: number;
  stockRetourneOeufs: number;
  stockCasseOeufs: number;
  stockOffertOeufs: number;
  fraisTransportFCFA: number;
  fraisCarburantFCFA: number;
  fraisHebergementFCFA: number;
  fraisRestaurationFCFA: number;
  fraisPeagesFCFA: number;
  fraisDiversFCFA: number;
  recettesTotalesFCFA: number;
  beneficeNetFCFA: number;
  statut: 'En cours' | 'Clôturée';
}

export interface StockLot {
  id: string;
  referenceLot: string;
  poulaillerNom: string;
  fournisseurNom: string;
  dateReception: string;
  quantiteOeufsRecus: number; // UNITE UNIQUE
  prixAchatUnitaireOeuf: number; // Prix par œuf FCFA
  typeOeuf: EggCategoryType;
  remarques?: string;
}

export interface StockLoss {
  id: string;
  date: string;
  typePerte: 'Catégorie 1 - Fissurés' | 'Catégorie 2 - Cassés irrécupérables';
  quantiteOeufs: number; // UNITE UNIQUE
  prixValeurFCFA: number;
  motif: string;
  saisiPar: string;
}

export interface Expense {
  id: string;
  date: string;
  categorie: 'Transport' | 'Carburant' | 'Repas' | 'Communication' | 'Hébergement' | 'Divers';
  montantFCFA: number;
  description: string;
  commercialId?: string;
  commercialNom: string;
  justificatifRef?: string;
}

export interface CommissionRecord {
  id: string;
  demarcheurId: string;
  demarcheurNom: string;
  poulaillerNom: string;
  factureNumero: string;
  montantVenteFCFA: number;
  tauxPercent: number;
  montantCommissionFCFA: number;
  periode: string;
  statut: 'À payer' | 'Payée';
  dateAttribuee: string;
}

export interface SystemNotification {
  id: string;
  type: 'stock' | 'creance' | 'relance' | 'commission';
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
  action: string; // 'CREATION', 'MODIFICATION', 'SUPPRESSION', 'VALIDATION'
  entite: string; // 'Facture', 'Prospect', 'Client', 'Stock', 'Paiement'
  description: string;
  ancienneValeur?: string;
  nouvelleValeur?: string;
}
