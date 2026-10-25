import Dexie, { Table } from 'dexie';
import { 
  AlveoleProduct, RawMaterialStock, ProductionShiftRecord,
  Client, Invoice, Expense, StockMovement,
  SystemNotification, AuditLog 
} from '../types';

export class BSDistributionDatabase extends Dexie {
  alveoleProducts!: Table<AlveoleProduct>;
  rawMaterials!: Table<RawMaterialStock>;
  productionShifts!: Table<ProductionShiftRecord>;
  clients!: Table<Client>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  stockMovements!: Table<StockMovement>;
  notifications!: Table<SystemNotification>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('BSAlveolesProductionDB_v1');
    this.version(1).stores({
      alveoleProducts:  'id, reference, format',
      rawMaterials:     'id, reference, categorie',
      productionShifts: 'id, date, shift, ligneProduction, trsOEE',
      clients:          'id, codeClient, raisonSociale, region, categorie',
      invoices:         'id, numero, clientId, date, statutCommande, statutPaiement',
      expenses:         'id, categorie, date, comptePaiement',
      stockMovements:   'id, date, type, articleId',
      notifications:    'id, type, isRead',
      auditLogs:        'id, timestamp, userRole, entite, action'
    });
  }
}

export const db = new BSDistributionDatabase();

/**
 * Initialisation des données industrielles pour l'unité de production d'alvéoles
 */
export async function seedInitialDataIfEmpty() {
  const count = await db.alveoleProducts.count();
  if (count > 0) return;

  const today = new Date().toISOString().split('T')[0];

  // 1. Produits Finis : Alvéoles & Boîtes d'œufs
  const initialProducts: AlveoleProduct[] = [
    {
      id: 'prod-alv-30-std',
      reference: 'ALV-30-STD',
      nom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
      format: 'PLATEAU_30',
      description: 'Plateau 30 œufs en pâte de carton 100% recyclée, dimensions 295x295 mm. Emboîtement parfait et haute rigidité.',
      capaciteOeufs: 30,
      poidsMoyenGrammes: 68,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 45,
      prixFardeauFCFA: 4500,
      stockFardeaux: 420,
      stockTotalUnites: 42000,
      seuilAlerteFardeaux: 80,
      couleur: 'Gris Recyclé Naturel'
    },
    {
      id: 'prod-alv-30-exp',
      reference: 'ALV-30-EXP',
      nom: 'Plateau 30 Œufs Renforcé Export / Longue Distance',
      format: 'PLATEAU_30_EXPORT',
      description: 'Version dense renforcée à l\'amidon pour transport interrégional et résistance maximale au gerbage en camion.',
      capaciteOeufs: 30,
      poidsMoyenGrammes: 78,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 55,
      prixFardeauFCFA: 5500,
      stockFardeaux: 210,
      stockTotalUnites: 21000,
      seuilAlerteFardeaux: 50,
      couleur: 'Gris Foncé Kraft'
    },
    {
      id: 'prod-box-6',
      reference: 'BOX-06-STD',
      nom: 'Boîte 6 Œufs Clipsable avec Couvercle',
      format: 'BOITE_6',
      description: 'Boîte fermante en pâte moulée pour vente au détail en supermarché et supérettes. Double verrouillage clipsable.',
      capaciteOeufs: 6,
      poidsMoyenGrammes: 48,
      quantiteParFardeau: 120,
      prixUnitaireFCFA: 65,
      prixFardeauFCFA: 7800,
      stockFardeaux: 150,
      stockTotalUnites: 18000,
      seuilAlerteFardeaux: 40,
      couleur: 'Vert Écologique'
    },
    {
      id: 'prod-box-10',
      reference: 'BOX-10-STD',
      nom: 'Boîte 10 Œufs Fermante Format Familial',
      format: 'BOITE_10',
      description: 'Boîte 10 alvéoles pour la grande distribution. Protection antichoc intégrale avec fermeture sécurisée.',
      capaciteOeufs: 10,
      poidsMoyenGrammes: 62,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 85,
      prixFardeauFCFA: 8500,
      stockFardeaux: 110,
      stockTotalUnites: 11000,
      seuilAlerteFardeaux: 30,
      couleur: 'Gris Recyclé Naturel'
    },
    {
      id: 'prod-box-12',
      reference: 'BOX-12-STD',
      nom: 'Boîte 12 Œufs Double Rangée Fermante',
      format: 'BOITE_12',
      description: 'Conditionnement premium pour 1 douzaine d\'œufs de table. Surface lisse adaptée à l\'étiquetage personnalisé.',
      capaciteOeufs: 12,
      poidsMoyenGrammes: 72,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 95,
      prixFardeauFCFA: 9500,
      stockFardeaux: 90,
      stockTotalUnites: 9000,
      seuilAlerteFardeaux: 25,
      couleur: 'Blanc Crème Naturel'
    }
  ];

  await db.alveoleProducts.bulkAdd(initialProducts);

  // 2. Matières Premières & Consommables Usine
  const initialRawMaterials: RawMaterialStock[] = [
    {
      id: 'mp-occ-01',
      reference: 'MP-OCC-BALL',
      nom: 'Balles de Cartons Ondulés Recyclés (OCC)',
      categorie: 'PAPIER_CARTON',
      unite: 'Kg',
      stockActuel: 34500, // 34.5 Tonnes
      seuilSecurite: 8000, // 8 Tonnes
      coutMoyenAchatFCFA: 80, // 80 FCFA/kg
      fournisseurPrincipal: 'Collecteurs Industriels Dakar & Régions',
      emplacementStock: 'Hangar A - Zone Balles Stockées',
      derniereReception: today
    },
    {
      id: 'mp-jour-02',
      reference: 'MP-JOURNAUX',
      nom: 'Papiers Journaux & Rognures Kraft',
      categorie: 'PAPIER_CARTON',
      unite: 'Kg',
      stockActuel: 14200, // 14.2 Tonnes
      seuilSecurite: 4000,
      coutMoyenAchatFCFA: 70,
      fournisseurPrincipal: 'Imprimeries & Papeteries Partenaires',
      emplacementStock: 'Hangar B - Stock Papier Blanc/Kraft',
      derniereReception: today
    },
    {
      id: 'mp-amidon-03',
      reference: 'MP-AMIDON-LIANT',
      nom: 'Amidon Industriel / Sulfate d\'Aluminium (Liant)',
      categorie: 'LIANT_ADJUVANT',
      unite: 'Kg',
      stockActuel: 1250,
      seuilSecurite: 300,
      coutMoyenAchatFCFA: 650,
      fournisseurPrincipal: 'Chimie & Ingrédients Sénégal',
      emplacementStock: 'Zone Adjuvants Cuves & Fûts',
      derniereReception: today
    },
    {
      id: 'mp-hydro-04',
      reference: 'MP-AGENT-HYDRO',
      nom: 'Émulsion Hydrofugeante (Anti-Humidité)',
      categorie: 'HYDROFUGE',
      unite: 'Litre',
      stockActuel: 580,
      seuilSecurite: 150,
      coutMoyenAchatFCFA: 1200,
      fournisseurPrincipal: 'Fournisseur Poly-Coat',
      emplacementStock: 'Magasin Produits Spéciaux',
      derniereReception: today
    },
    {
      id: 'mp-cerclage-05',
      reference: 'MP-CERCL-PP',
      nom: 'Feuillard & Ruban Cerclage Fardeaux (PP)',
      categorie: 'EMBALLAGE_CERCLAGE',
      unite: 'Rouleau',
      stockActuel: 45,
      seuilSecurite: 10,
      coutMoyenAchatFCFA: 8500,
      fournisseurPrincipal: 'Emballages Plastiques Dakar',
      emplacementStock: 'Atelier Expédition / Conditionnement',
      derniereReception: today
    }
  ];

  await db.rawMaterials.bulkAdd(initialRawMaterials);

  // 3. Relevés de Shifts et Indicateurs de Productivité
  const initialShifts: ProductionShiftRecord[] = [
    {
      id: 'shift-rec-01',
      date: today,
      shift: 'MATIN_06H_14H',
      ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces (3 200 alv/h)',
      responsableShift: 'Amadou Bâ (Chef de Quart)',
      produitId: 'prod-alv-30-std',
      produitNom: 'Plateau 30 Œufs Standard',
      heuresPlanifiees: 8,
      heuresFonctionnement: 7.4,
      heuresArret: 0.6,
      motifArret: 'Contrôle niveau pulpeur & nettoyage tamis sous vide (36 min)',
      alvéolesConformes: 22400,
      fardeauxEmballes: 224,
      rebutsKilos: 95,
      rebutsPourcentage: 3.1,
      papierCartonConsommeKg: 1550,
      adjuvantKg: 35,
      energieKwh: 340,
      eauRecycleeM3: 18,
      cadenceHoraireReelle: 3027,
      cadenceTheorique: 3200,
      tauxDisponibilite: 92.5,
      tauxPerformance: 94.6,
      tauxQualite: 96.9,
      trsOEE: 84.8,
      ratioKgPar1000Alveoles: 69.2,
      statutControleQualite: 'CONFORME',
      observations: 'Excellente tenue mécanique des plateaux. Séchage homogène à 205°C.'
    },
    {
      id: 'shift-rec-02',
      date: today,
      shift: 'SOIR_14H_22H',
      ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces (3 200 alv/h)',
      responsableShift: 'Mamadou Seck (Chef de Quart)',
      produitId: 'prod-alv-30-std',
      produitNom: 'Plateau 30 Œufs Standard',
      heuresPlanifiees: 8,
      heuresFonctionnement: 7.6,
      heuresArret: 0.4,
      motifArret: 'Remplacement sangles de convoyeur séchoir (24 min)',
      alvéolesConformes: 23600,
      fardeauxEmballes: 236,
      rebutsKilos: 82,
      rebutsPourcentage: 2.6,
      papierCartonConsommeKg: 1620,
      adjuvantKg: 38,
      energieKwh: 355,
      eauRecycleeM3: 19,
      cadenceHoraireReelle: 3105,
      cadenceTheorique: 3200,
      tauxDisponibilite: 95.0,
      tauxPerformance: 97.0,
      tauxQualite: 97.4,
      trsOEE: 89.7,
      ratioKgPar1000Alveoles: 68.6,
      statutControleQualite: 'CONFORME',
      observations: 'Shift fluide, cadences maintenues. Évacuation directe vers fardeleuse.'
    }
  ];

  await db.productionShifts.bulkAdd(initialShifts);

  // 4. Clients B2B (Fermes avicoles, Couvoirs, Distributeurs)
  const initialClients: Client[] = [
    {
      id: 'cli-001',
      codeClient: 'CLI-NIAYES-01',
      raisonSociale: 'Ferme Avicole Moderne des Niayes',
      contactNom: 'M. Cheikh Sarr (Dir. Exploitation)',
      telephone: '+221 77 540 12 34',
      email: 'sarr@fermeniayes.sn',
      categorie: 'Ferme Avicole Ponte',
      region: 'Thiès',
      adresse: 'Zone Avicole de Notto Gouye Diama',
      capaciteFermePoules: 85000,
      consommationMensuelleEstimeeAlveoles: 75000,
      soldeDuFCFA: 0,
      limiteCreditFCFA: 5000000,
      delaiPaiementJours: 15,
      coordonneesGPS: { latitude: 14.8821, longitude: -17.0234 },
      notes: 'Gros client régulier. Commande 2 fois par mois par camion de 300 fardeaux.'
    },
    {
      id: 'cli-002',
      codeClient: 'CLI-SEDIMA-MBOUR',
      raisonSociale: 'Agri-Ponte Mbour & Petite Côte',
      contactNom: 'Mme Fatou Kiné Diop',
      telephone: '+221 76 890 45 67',
      email: 'appro@agriponte-mbour.com',
      categorie: 'Ferme Avicole Ponte',
      region: 'Thiès',
      adresse: 'Route de Sindia, Mbour',
      capaciteFermePoules: 45000,
      consommationMensuelleEstimeeAlveoles: 40000,
      soldeDuFCFA: 225000,
      limiteCreditFCFA: 3000000,
      delaiPaiementJours: 10,
      notes: 'Préfère les alvéoles standard 30 œufs + 50 fardeaux de boîtes 6 œufs.'
    },
    {
      id: 'cli-003',
      codeClient: 'CLI-BAOL-TOUBA',
      raisonSociale: 'Comptoir Avicole & Emballages du Baol',
      contactNom: 'El Hadj Modou Fall',
      telephone: '+221 70 333 88 99',
      email: 'fall.modou@baol-agro.sn',
      categorie: 'Grossiste Distributeur Emballages',
      region: 'Diourbel',
      adresse: 'Grand Marché Ocass, Touba',
      consommationMensuelleEstimeeAlveoles: 120000,
      soldeDuFCFA: 450000,
      limiteCreditFCFA: 8000000,
      delaiPaiementJours: 20,
      notes: 'Fournit tout le bassin du Baol et Diourbel en fardeaux d\'alvéoles.'
    },
    {
      id: 'cli-004',
      codeClient: 'CLI-SUPER-DAKAR',
      raisonSociale: 'Centrale d\'Achat Agro-Alimentaire Dakar',
      contactNom: 'Babacar Ndir',
      telephone: '+221 78 120 77 66',
      categorie: 'Supermarché / Centrale d\'Achat',
      region: 'Dakar',
      adresse: 'Zone Industrielle de Yarakh, Dakar',
      consommationMensuelleEstimeeAlveoles: 50000,
      soldeDuFCFA: 0,
      limiteCreditFCFA: 6000000,
      delaiPaiementJours: 30,
      notes: 'Commandes exclusives de boîtes 6 et 10 œufs avec étiquetage.'
    }
  ];

  await db.clients.bulkAdd(initialClients);

  // 5. Factures & Commandes
  const initialInvoices: Invoice[] = [
    {
      id: 'inv-2610-001',
      numero: 'FAC-2610-0001',
      numeroBL: 'BL-2610-0001',
      date: today,
      dateEcheance: today,
      clientId: 'cli-001',
      clientNom: 'Ferme Avicole Moderne des Niayes',
      clientRegion: 'Thiès',
      articles: [
        {
          produitId: 'prod-alv-30-std',
          reference: 'ALV-30-STD',
          designation: 'Plateau 30 Œufs Standard',
          format: 'PLATEAU_30',
          fardeaux: 300,
          quantiteUnites: 30000,
          prixUnitaireFCFA: 45,
          totalLigneFCFA: 1350000
        }
      ],
      totalHT: 1350000,
      tvaMontant: 0,
      totalTTC: 1350000,
      acompteVerse: 1350000,
      soldeRestant: 0,
      statutCommande: 'LIVREE',
      statutPaiement: 'PAYE',
      modePaiementPrefere: 'Virement Bancaire',
      chauffeurNom: 'Alioune Badara Diouf',
      camionImmatriculation: 'DK-4982-BB',
      notesLivraison: 'Livraison effectuée à la ferme de Notto Gouye Diama. Déchargement conforme.'
    },
    {
      id: 'inv-2610-002',
      numero: 'FAC-2610-0002',
      numeroBL: 'BL-2610-0002',
      date: today,
      dateEcheance: today,
      clientId: 'cli-003',
      clientNom: 'Comptoir Avicole & Emballages du Baol',
      clientRegion: 'Diourbel',
      articles: [
        {
          produitId: 'prod-alv-30-std',
          reference: 'ALV-30-STD',
          designation: 'Plateau 30 Œufs Standard',
          format: 'PLATEAU_30',
          fardeaux: 200,
          quantiteUnites: 20000,
          prixUnitaireFCFA: 45,
          totalLigneFCFA: 900000
        },
        {
          produitId: 'prod-box-6',
          reference: 'BOX-06-STD',
          designation: 'Boîte 6 Œufs Clipsable',
          format: 'BOITE_6',
          fardeaux: 50,
          quantiteUnites: 6000,
          prixUnitaireFCFA: 65,
          totalLigneFCFA: 390000
        }
      ],
      totalHT: 1290000,
      tvaMontant: 0,
      totalTTC: 1290000,
      acompteVerse: 840000,
      soldeRestant: 450000,
      statutCommande: 'EXPEDIEE',
      statutPaiement: 'ACOMPTE',
      modePaiementPrefere: 'Wave',
      chauffeurNom: 'Cheikh Tidiane Sow',
      camionImmatriculation: 'TH-2210-AA',
      notesLivraison: 'Acompte Wave reçu. Solde payable à réception Touba.'
    }
  ];

  await db.invoices.bulkAdd(initialInvoices);

  // 6. Dépenses d'exploitation de l'usine
  const initialExpenses: Expense[] = [
    {
      id: 'exp-001',
      date: today,
      categorie: 'Matières Premières (Balles Cartons)',
      montant: 850000,
      beneficiaire: 'Groupement Collecte Cartons Dakar',
      description: 'Achat de 10.6 Tonnes de cartons ondulés OCC compressés pour pulpeur',
      comptePaiement: 'Banque Principale',
      justificatifRef: 'FACT-COLLECT-2026-88',
      enregistrePar: 'Comptable Usine'
    },
    {
      id: 'exp-002',
      date: today,
      categorie: 'Électricité & Énergie Séchoir',
      montant: 420000,
      beneficiaire: 'Fournisseur Gaz Industriel Touba Gaz',
      description: 'Recharge cuve gaz propane séchoir tunnel alvéoles',
      comptePaiement: 'Banque Principale',
      justificatifRef: 'BL-GAZ-4412',
      enregistrePar: 'Comptable Usine'
    },
    {
      id: 'exp-003',
      date: today,
      categorie: 'Maintenance Machines & Pièces',
      montant: 125000,
      beneficiaire: 'Atelier Mécanique Usine',
      description: 'Entretien pompe à vide et remplacement filtres circuit d\'eau',
      comptePaiement: 'Caisse Usine',
      justificatifRef: 'RECU-MAINT-109',
      enregistrePar: 'Responsable Maintenance'
    }
  ];

  await db.expenses.bulkAdd(initialExpenses);

  // 7. Notifications système
  await db.notifications.add({
    id: `notif-welcome-${Date.now()}`,
    type: 'production',
    title: 'Unité de Production d\'Alvéoles Opérationnelle',
    message: 'Système configuré pour la gestion industrielle : TRS, stocks carton/pâte, gestion commerciale et suivi financier.',
    date: today,
    isRead: false
  });

  // 8. Audit log initial
  await db.auditLogs.add({
    id: `audit-init-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userNom: 'Directeur d\'Usine',
    userRole: 'DIRECTEUR_USINE',
    action: 'INITIALISATION_USINE',
    entite: 'Production Alvéoles',
    description: 'Initialisation de la plateforme de gestion d\'unité de production d\'alvéoles en pâte moulée.'
  });
}

/**
 * Générateur séquentiel de numéros de commande / facture
 */
export async function generateInvoiceNumber(): Promise<{ numero: string; numeroBL: string }> {
  const now = new Date();
  const yymm = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const count = await db.invoices.count();
  const seq = (count + 1).toString().padStart(4, '0');
  return {
    numero: `FAC-ALV-${yymm}-${seq}`,
    numeroBL: `BL-ALV-${yymm}-${seq}`
  };
}

/**
 * Enregistrement dans les logs d'audit
 */
export async function addAuditLog(
  userNom: string,
  userRole: string,
  action: string,
  entite: string,
  description: string,
  nouvelleValeur?: string
) {
  await db.auditLogs.add({
    id: `audit-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    timestamp: new Date().toISOString(),
    userNom,
    userRole: userRole as any,
    action,
    entite,
    description,
    nouvelleValeur
  });
}
