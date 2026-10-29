import Dexie, { Table } from 'dexie';
import { 
  AlveoleProduct, RawMaterialStock, ProductionShiftRecord,
  Client, Invoice, Expense, StockMovement,
  SystemNotification, AuditLog, InventorySession,
  CommercialExitVoucher, CommercialReturnVoucher, CommercialContract,
  User, FactorySystemParameters, RejectedRawMaterialRecord, ShiftAttendanceRecord,
  RawMaterialReceptionVoucher, QualityControlRecord, MachineIncidentRecord,
  RawMaterialSupplierReturnVoucher, MaterialExitRequest,
  PaymentRecord, DeliveryNote,
  IntrantSupplier, IntrantStockMovement
} from '../types';

export class BSDistributionDatabase extends Dexie {
  alveoleProducts!: Table<AlveoleProduct>;
  rawMaterials!: Table<RawMaterialStock>;
  rejectedRawMaterials!: Table<RejectedRawMaterialRecord>;
  rawMaterialReceptions!: Table<RawMaterialReceptionVoucher>;
  supplierReturnVouchers!: Table<RawMaterialSupplierReturnVoucher>;
  materialExitRequests!: Table<MaterialExitRequest>;
  productionShifts!: Table<ProductionShiftRecord>;
  clients!: Table<Client>;
  invoices!: Table<Invoice>;
  expenses!: Table<Expense>;
  stockMovements!: Table<StockMovement>;
  notifications!: Table<SystemNotification>;
  auditLogs!: Table<AuditLog>;
  inventorySessions!: Table<InventorySession>;
  commercialExitVouchers!: Table<CommercialExitVoucher>;
  commercialReturnVouchers!: Table<CommercialReturnVoucher>;
  commercialContracts!: Table<CommercialContract>;
  users!: Table<User>;
  factorySettings!: Table<FactorySystemParameters>;
  shiftAttendances!: Table<ShiftAttendanceRecord>;
  qualityControls!: Table<QualityControlRecord>;
  machineIncidents!: Table<MachineIncidentRecord>;
  paymentRecords!: Table<PaymentRecord>;   // Encaissements distincts (CDC 7.6)
  deliveryNotes!: Table<DeliveryNote>;     // Bons de livraison distincts (CDC 7.7)
  intrantSuppliers!: Table<IntrantSupplier>;    // Fiches fournisseurs d'intrants avec tarifs
  intrantMovements!: Table<IntrantStockMovement>; // Entrées/Sorties intrants avec prix

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
    this.version(2).stores({
      inventorySessions: 'id, date, frequence, statutValidation'
    });
    this.version(3).stores({
      commercialExitVouchers:   'id, numeroBon, commercialId, date, statut',
      commercialReturnVouchers: 'id, numeroRetour, commercialId, date, statut',
      commercialContracts:      'id, numeroContrat, clientId, statut'
    });
    this.version(4).stores({
      users: 'id, email, role, actif'
    });
    this.version(5).stores({
      factorySettings: 'id'
    });
    this.version(6).stores({
      rejectedRawMaterials: 'id, date, mpReference, statut'
    });
    this.version(7).stores({
      shiftAttendances: 'id, date, shift, collaborateurId, statut'
    });
    this.version(8).stores({
      rawMaterialReceptions: 'id, numeroBon, date, modeApprovisionnement, statutTri, mpId'
    });
    this.version(9).stores({
      qualityControls:  'id, numeroControle, date, rapportProductionId, typeDefaut, statutResolution',
      machineIncidents: 'id, numeroIncident, date, equipementConcerne, natureIncident, statutCloture'
    });
    this.version(10).stores({
      supplierReturnVouchers: 'id, numeroBonRetour, receptionId, date, statut',
      materialExitRequests:   'id, numeroDemande, date, statut, mpId'
    });
    this.version(11).stores({
      paymentRecords: 'id, factureId, clientId, date, modePaiement', // CDC 7.6 enc. distincts
      deliveryNotes:  'id, numeroBL, factureId, clientId, date, statut' // CDC 7.7 BL distincts
    });
    // v12 : Gestion complète des intrants (fournisseurs + mouvements avec prix)
    this.version(12).stores({
      intrantSuppliers: 'id, code, nom, statut',
      intrantMovements: 'id, numeroMouvement, date, type, intrantId, fournisseurId'
    });
  }
}

export const db = new BSDistributionDatabase();

/**
 * Initialisation des données industrielles pour l'unité de production d'alvéoles
 */
export async function seedInitialDataIfEmpty() {
  await seedUsersIfEmpty();
  await seedInventorySessionsIfEmpty();
  await seedCommercialVouchersAndContractsIfEmpty();
  await seedFactorySettingsIfEmpty();
  await seedRejectedRawMaterialsIfEmpty();
  await seedRawMaterialReceptionsIfEmpty();
  await seedQualityControlsAndIncidentsIfEmpty();
  await seedSupplierReturnsAndMaterialExitRequestsIfEmpty();
  await seedIntrantSuppliersIfEmpty();
  await seedIntrantMovementsIfEmpty();

  // Migration / enrichissement des mouvements intrants existants
  try {
    const existingIntrantMovements = await db.intrantMovements.toArray();
    for (const m of existingIntrantMovements) {
      if (m.type === 'ENTREE_ACHAT' && !m.paysProvenance) {
        await db.intrantMovements.update(m.id, {
          paysProvenance: m.fournisseurNom?.includes('Chine') || m.fournisseurNom?.includes('CSP') ? 'Chine' :
                          m.fournisseurNom?.includes('CSPI') || m.fournisseurNom?.includes('International') ? 'France' :
                          m.fournisseurNom?.includes('Ashland') ? 'Côte d\'Ivoire' : 'Sénégal',
          villeUsine: m.fournisseurNom?.includes('Chine') || m.fournisseurNom?.includes('CSP') ? 'Shanghai' :
                      m.fournisseurNom?.includes('CSPI') ? 'Lyon' :
                      m.fournisseurNom?.includes('Ashland') ? 'Abidjan' : 'Dakar',
          prixUsineUnitaireFCFA: m.prixUnitaireFCFA ? Math.round(m.prixUnitaireFCFA * 0.8) : undefined,
          fraisTransportFCFA: m.montantTotalFCFA ? Math.round(m.montantTotalFCFA * 0.12) : 25000,
          fraisDedouanementFCFA: m.montantTotalFCFA ? Math.round(m.montantTotalFCFA * 0.08) : 15000,
          coutTotalRenduFCFA: m.montantTotalFCFA || (m.quantite * (m.prixUnitaireFCFA || 0)),
          numeroCertificatAnalyse: `COA-${m.intrantId.toUpperCase()}-2026-01`,
          numeroCertificatOrigine: `CO-${m.intrantId.toUpperCase()}-2026`,
          numeroFicheMSDS: `MSDS-${m.intrantId.toUpperCase()}`,
          lotFabricant: `LOT-${m.intrantId.toUpperCase()}-2026`,
          conditionnement: 'Conditionnement standard usine',
          conformiteQualite: 'CONFORME',
          apparenceVisuelleCRT: 'OK',
          emballageCRT: 'INTACT',
          receptionnaireMagasin: 'Magasinier Usine'
        });
      }
    }
  } catch (e) {
    console.warn('Migration intrant movements:', e);
  }

  // Synchronisation des quantités pré-commandées pour la phase de tests :
  // Amidon : 500 kg, AKD : 200 kg, CMC : 100 kg, Anti-mousse : 25 L
  try {
    const syncTestAdditifsKey = 'bs_additifs_precommandes_tests_v2';
    if (!localStorage.getItem(syncTestAdditifsKey)) {
      const akd = await db.rawMaterials.get('mp-akd-03');
      if (akd) {
        await db.rawMaterials.update('mp-akd-03', {
          stockActuel: 200,
          seuilSecurite: 50,
          coutMoyenAchatFCFA: akd.coutMoyenAchatFCFA || 1850,
          unite: 'Kg',
          nom: 'AKD (Alkyl Ketene Dimer) — Encollage Hydrophobe'
        });
      }

      const amidon = await db.rawMaterials.get('mp-amidon-cat-04');
      if (amidon) {
        await db.rawMaterials.update('mp-amidon-cat-04', {
          stockActuel: 500,
          seuilSecurite: 100,
          coutMoyenAchatFCFA: amidon.coutMoyenAchatFCFA || 650,
          unite: 'Kg',
          nom: 'Amidon (Starch) — Liant Résistance & Rétention'
        });
      }

      const cmc = await db.rawMaterials.get('mp-cmc-05');
      if (cmc) {
        await db.rawMaterials.update('mp-cmc-05', {
          stockActuel: 100,
          seuilSecurite: 25,
          coutMoyenAchatFCFA: cmc.coutMoyenAchatFCFA || 1450,
          unite: 'Kg',
          nom: 'CMC (Carboxyméthylcellulose) — Liant Mécanique E466'
        });
      }

      const defoamer = await db.rawMaterials.get('mp-defoamer-07');
      if (defoamer) {
        await db.rawMaterials.update('mp-defoamer-07', {
          stockActuel: 25,
          seuilSecurite: 5,
          coutMoyenAchatFCFA: defoamer.coutMoyenAchatFCFA || 2500,
          unite: 'Litre',
          nom: 'Anti-Mousse (Defoamer) — Contrôle Mousse Pulpeur'
        });
      }

      localStorage.setItem(syncTestAdditifsKey, 'true');
    }
  } catch (err) {
    console.warn('Sync additifs tests:', err);
  }


  const count = await db.alveoleProducts.count();
  if (count > 0) {
    // Migration automatique des données existantes vers la règle tarifaire 3 500 FCFA / paquet de 100
    try {
      const existingProducts = await db.alveoleProducts.toArray();
      for (const p of existingProducts) {
        if (p.prixFardeauFCFA !== 3500 || p.prixUnitaireFCFA !== 35) {
          await db.alveoleProducts.update(p.id, {
            prixFardeauFCFA: 3500,
            prixUnitaireFCFA: 35,
            quantiteParFardeau: 100
          });
        }
      }
    } catch (e) {
      console.warn('Erreur migration prix produits:', e);
    }
    return;
  }

  const today = new Date().toISOString().split('T')[0];

  // 1. Produits Finis : Alvéoles & Boîtes d'œufs
  // ⚠️ RÈGLE COMMERCIALE : Vente EXCLUSIVEMENT par paquet de 100 alvéoles
  // Prix standard : 3 500 FCFA / paquet de 100 — PAS DE VENTE AU DÉTAIL
  const initialProducts: AlveoleProduct[] = [
    {
      id: 'prod-alv-30-std',
      reference: 'ALV-30-STD',
      nom: 'Alvéole 30 Œufs Standard (Pâte Moulée)',
      format: 'PLATEAU_30',
      description: 'Alvéole 30 œufs en pâte de carton 100% recyclée, dimensions 295x295 mm. Vente par paquet de 100 pièces à 3 500 FCFA.',
      capaciteOeufs: 30,
      poidsMoyenGrammes: 68,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 35,           // 35 FCFA / pièce
      prixFardeauFCFA: 3500,          // 3 500 FCFA / paquet de 100
      stockFardeaux: 420,
      stockTotalUnites: 42000,
      seuilAlerteFardeaux: 80,
      couleur: 'Gris Recyclé Naturel'
    },
    {
      id: 'prod-alv-30-exp',
      reference: 'ALV-30-EXP',
      nom: 'Alvéole 30 Œufs Renforcé Export / Longue Distance',
      format: 'PLATEAU_30_EXPORT',
      description: 'Version dense renforcée à l\'amidon pour transport interrégional. Vente par paquet de 100 pièces à 3 500 FCFA.',
      capaciteOeufs: 30,
      poidsMoyenGrammes: 78,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 35,           // même prix standard
      prixFardeauFCFA: 3500,          // 3 500 FCFA / paquet de 100
      stockFardeaux: 210,
      stockTotalUnites: 21000,
      seuilAlerteFardeaux: 50,
      couleur: 'Gris Foncé Kraft'
    },
    {
      id: 'prod-box-6',
      reference: 'BOX-06-STD',
      nom: 'Boîte 6 Alvéoles Clipsable avec Couvercle',
      format: 'BOITE_6',
      description: 'Boîte fermante en pâte moulée. Vente par paquet de 100 pièces uniquement.',
      capaciteOeufs: 6,
      poidsMoyenGrammes: 48,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 35,
      prixFardeauFCFA: 3500,
      stockFardeaux: 150,
      stockTotalUnites: 15000,
      seuilAlerteFardeaux: 40,
      couleur: 'Vert Écologique'
    },
    {
      id: 'prod-box-10',
      reference: 'BOX-10-STD',
      nom: 'Boîte 10 Alvéoles Fermante Format Familial',
      format: 'BOITE_10',
      description: 'Boîte 10 alvéoles pour grande distribution. Vente par paquet de 100 pièces uniquement.',
      capaciteOeufs: 10,
      poidsMoyenGrammes: 62,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 35,
      prixFardeauFCFA: 3500,
      stockFardeaux: 110,
      stockTotalUnites: 11000,
      seuilAlerteFardeaux: 30,
      couleur: 'Gris Recyclé Naturel'
    },
    {
      id: 'prod-box-12',
      reference: 'BOX-12-STD',
      nom: 'Boîte 12 Alvéoles Double Rangée Fermante',
      format: 'BOITE_12',
      description: 'Conditionnement premium 1 douzaine. Surface adaptée à l\'étiquetage. Vente par paquet de 100 pièces uniquement.',
      capaciteOeufs: 12,
      poidsMoyenGrammes: 72,
      quantiteParFardeau: 100,
      prixUnitaireFCFA: 35,
      prixFardeauFCFA: 3500,
      stockFardeaux: 90,
      stockTotalUnites: 9000,
      seuilAlerteFardeaux: 25,
      couleur: 'Blanc Crème Naturel'
    }
  ];

  await db.alveoleProducts.bulkAdd(initialProducts);

  // 2. Matières Premières & Consommables Usine (CDC Section 6.1 & Spécifications Client)
  // Tarif standard carton d'achat fixé à 250 FCFA/kg
  const initialRawMaterials: RawMaterialStock[] = [
    {
      id: 'mp-occ-01',
      reference: 'MP-OCC-BALL',
      nom: 'Balles de Cartons Ondulés Recyclés (OCC)',
      categorie: 'PAPIER_CARTON',
      estIntrant: false,
      unite: 'Kg',
      stockActuel: 34500, // 34.5 Tonnes
      seuilSecurite: 8000, // 8 Tonnes
      coutMoyenAchatFCFA: 250, // Fixé à 250 FCFA / kg selon accord client
      fournisseurPrincipal: 'Collecteurs Industriels Dakar & Régions',
      emplacementStock: 'Hangar A - Zone Balles Stockées',
      derniereReception: today
    },
    {
      id: 'mp-jour-02',
      reference: 'MP-JOURNAUX',
      nom: 'Papiers Journaux & Rognures Kraft',
      categorie: 'PAPIER_CARTON',
      estIntrant: false,
      unite: 'Kg',
      stockActuel: 14200, // 14.2 Tonnes
      seuilSecurite: 4000,
      coutMoyenAchatFCFA: 250, // Fixé à 250 FCFA / kg
      fournisseurPrincipal: 'Imprimeries & Papeteries Partenaires',
      emplacementStock: 'Hangar B - Stock Papier Blanc/Kraft',
      derniereReception: today
    },
    {
      id: 'mp-akd-03',
      reference: 'MP-AKD-HYDRO',
      nom: 'AKD (Alkyl Ketene Dimer) — Encollage Hydrophobe',
      categorie: 'HYDROFUGE',
      estIntrant: true,
      unite: 'Kg',
      stockActuel: 200, // Quantité pré-commandée pour tests : 200 kg
      seuilSecurite: 50,
      coutMoyenAchatFCFA: 1850, // Prix indicatif modifiable manuellement
      fournisseurPrincipal: 'Chimie Spécialités Papetières International',
      emplacementStock: 'Magasin Additifs - Zone Produits d\'Encollage',
      derniereReception: today
    },
    {
      id: 'mp-amidon-cat-04',
      reference: 'MP-AMIDON-CAT',
      nom: 'Amidon (Starch) — Liant Résistance & Rétention',
      categorie: 'LIANT_ADJUVANT',
      estIntrant: true,
      unite: 'Kg',
      stockActuel: 500, // Quantité pré-commandée pour tests : 500 kg
      seuilSecurite: 100,
      coutMoyenAchatFCFA: 650, // Prix indicatif modifiable manuellement
      fournisseurPrincipal: 'Cationic Starch for Papermaking Co.',
      emplacementStock: 'Silos Intrants Farineux & Liants',
      derniereReception: today
    },
    {
      id: 'mp-cmc-05',
      reference: 'MP-CMC-ARSHINE',
      nom: 'CMC (Carboxyméthylcellulose) — Liant Mécanique E466',
      categorie: 'LIANT_ADJUVANT',
      estIntrant: true,
      unite: 'Kg',
      stockActuel: 100, // Quantité pré-commandée pour tests : 100 kg
      seuilSecurite: 25,
      coutMoyenAchatFCFA: 1450, // Prix indicatif modifiable manuellement
      fournisseurPrincipal: 'Arshine Pharmaceutical Co., Limited',
      emplacementStock: 'Magasin Intrants Chimiques - Cuves A',
      derniereReception: today
    },
    {
      id: 'mp-talc-06',
      reference: 'MP-TALC-IND',
      nom: 'Talc Industriel (Silicate de Magnésium Hydraté - Charge & Opacité)',
      categorie: 'COLORANT',
      estIntrant: true,
      unite: 'Kg',
      stockActuel: 950,
      seuilSecurite: 350,
      coutMoyenAchatFCFA: 520,
      fournisseurPrincipal: 'Minéraux Techniques & Talcs Industriels',
      emplacementStock: 'Zone Charges Minérales & Poudres',
      derniereReception: today
    },
    {
      id: 'mp-defoamer-07',
      reference: 'MP-DEFOAMER-IND',
      nom: 'Anti-Mousse (Defoamer) — Contrôle Mousse Pulpeur',
      categorie: 'LIANT_ADJUVANT',
      estIntrant: true,
      unite: 'Litre',
      stockActuel: 25, // Quantité pré-commandée pour tests : 25 Litres
      seuilSecurite: 5,
      coutMoyenAchatFCFA: 2500, // Prix indicatif modifiable manuellement
      fournisseurPrincipal: 'Solutions Chimiques de Procédés Industriels',
      emplacementStock: 'Magasin Additifs Chimiques - Fûts Spéciaux',
      derniereReception: today
    },
    {
      id: 'mp-eau-08',
      reference: 'MP-EAU-PROCEDE',
      nom: 'Eau de Procédé Industrielle (Circuit Pulpeur & Recyclage)',
      categorie: 'EAU_ENERGIE',
      estIntrant: true,
      unite: 'm³',
      stockActuel: 450,
      seuilSecurite: 100,
      coutMoyenAchatFCFA: 450,
      fournisseurPrincipal: 'Forage Usine & Réseau SEN\'EAU',
      emplacementStock: 'Château d\'eau & Bâche de Stockage Usine',
      derniereReception: today
    },
    {
      id: 'mp-cerclage-09',
      reference: 'MP-CERCL-PP',
      nom: 'Feuillard & Ruban Cerclage Fardeaux (PP)',
      categorie: 'EMBALLAGE_CERCLAGE',
      estIntrant: false,
      unite: 'Rouleau',
      stockActuel: 45,
      seuilSecurite: 15,
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
      ligneProduction: 'Ligne Unique - Chaîne Shuliy 4 Faces (3 000 alv/h max)',
      responsableShift: 'Amadou Bâ (Chef d\'Équipe Unique)',
      produitId: 'prod-alv-30-std',
      produitNom: 'Plateau 30 Œufs Standard',
      heuresPlanifiees: 8,
      heuresPause: 1,
      heuresFonctionnement: 7.0,
      heuresArret: 0,
      motifArret: '',
      alvéolesConformes: 11900,
      fardeauxEmballes: 119,
      rebutsKilos: 10,
      rebutsPourcentage: 2.8,
      papierCartonConsommeKg: 340,
      adjuvantKg: 6,
      energieKwh: 120,
      eauRecycleeM3: 4,
      cadenceHoraireReelle: 1700,
      cadenceTheorique: 2000,
      tauxDisponibilite: 100,
      tauxPerformance: 85.0,
      tauxQualite: 97.2,
      trsOEE: 82.6,
      ratioKgPar1000Alveoles: 28.5,
      statutControleQualite: 'CONFORME',
      observations: 'Shift unique 8h conforme (1h pause repas). Lundi au samedi. Chaîne Shuliy nominale.'
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

  await seedInventorySessionsIfEmpty();
  await seedCommercialVouchersAndContractsIfEmpty();
}

/**
 * Données d'inventaires initiaux (hebdo & mensuel)
 */
export async function seedInventorySessionsIfEmpty() {
  const count = await db.inventorySessions.count();
  if (count > 0) return;

  const initialSessions: InventorySession[] = [
    {
      id: 'inv-hebdo-2026-w42',
      date: '2026-10-23',
      frequence: 'HEBDOMADAIRE',
      titre: 'Inventaire Hebdomadaire S42 - Fin de Semaine',
      responsable: 'Modou Faye (Resp. Stock)',
      supervisePar: 'Amadou Bâ (Resp. Production)',
      statutValidation: 'VALIDE',
      totalArticles: 6,
      articlesConformes: 5,
      articlesEnEcart: 1,
      valeurEcartNetFCFA: -22500,
      notes: 'Contrôle hebdomadaire standard. Léger déficit de 5 fardeaux alvéoles 30 lié à des prélèvements QC au laboratoire.',
      articles: [
        {
          articleId: 'mp-occ-01',
          articleNom: 'Balles de Cartons Ondulés OCC (100% Recyclé)',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Kg',
          stockTheorique: 48700,
          stockPhysique: 48700,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 85,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'mp-liant-01',
          articleNom: 'Amidon Liant Industriel Fécule',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Kg',
          stockTheorique: 850,
          stockPhysique: 850,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 650,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'prod-alv-30-std',
          articleNom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 425,
          stockPhysique: 420,
          ecartQuantite: -5,
          valeurUnitaireFCFA: 4500,
          ecartValeurFCFA: -22500,
          statut: 'DEFICIT',
          justification: 'Prélèvement pour test de résistance à l\'écrasement (QC usine).'
        },
        {
          articleId: 'prod-alv-30-exp',
          articleNom: 'Plateau 30 Œufs Renforcé Export',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 210,
          stockPhysique: 210,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 5500,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'prod-box-6',
          articleNom: 'Boîte 6 Œufs Clipsable avec Couvercle',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 150,
          stockPhysique: 150,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 7800,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'mp-ficelle-01',
          articleNom: 'Ficelle Plastique Cerclage Fardeaux',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Rouleau',
          stockTheorique: 38,
          stockPhysique: 38,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 7500,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        }
      ]
    },
    {
      id: 'inv-mensuel-2026-m09',
      date: '2026-09-30',
      frequence: 'MENSUEL',
      titre: 'Clôture & Inventaire Général Mensuel - Septembre 2026',
      responsable: 'Modou Faye (Resp. Stock)',
      supervisePar: 'M. Ndiaye Saliou (Directeur d\'Usine)',
      statutValidation: 'VALIDE',
      totalArticles: 6,
      articlesConformes: 4,
      articlesEnEcart: 2,
      valeurEcartNetFCFA: 15500,
      notes: 'Clôture comptable validée par la Direction et la Comptabilité. Écarts nets non significatifs (+0.12% de la valeur totale).',
      articles: [
        {
          articleId: 'mp-occ-01',
          articleNom: 'Balles de Cartons Ondulés OCC (100% Recyclé)',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Kg',
          stockTheorique: 52000,
          stockPhysique: 52500,
          ecartQuantite: 500,
          valeurUnitaireFCFA: 85,
          ecartValeurFCFA: 42500,
          statut: 'SURPLUS',
          justification: 'Tolérance pesage pont-bascule sur arrivage balles Dakar.'
        },
        {
          articleId: 'mp-liant-01',
          articleNom: 'Amidon Liant Industriel Fécule',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Kg',
          stockTheorique: 920,
          stockPhysique: 920,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 650,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'prod-alv-30-std',
          articleNom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 390,
          stockPhysique: 384,
          ecartQuantite: -6,
          valeurUnitaireFCFA: 4500,
          ecartValeurFCFA: -27000,
          statut: 'DEFICIT',
          justification: 'Alvéoles endommagées lors de la manutention chariots.'
        },
        {
          articleId: 'prod-alv-30-exp',
          articleNom: 'Plateau 30 Œufs Renforcé Export',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 180,
          stockPhysique: 180,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 5500,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'prod-box-6',
          articleNom: 'Boîte 6 Œufs Clipsable avec Couvercle',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 130,
          stockPhysique: 130,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 7800,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'mp-ficelle-01',
          articleNom: 'Ficelle Plastique Cerclage Fardeaux',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Rouleau',
          stockTheorique: 42,
          stockPhysique: 42,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 7500,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        }
      ]
    },
    {
      id: 'inv-mensuel-2026-m08',
      date: '2026-08-31',
      frequence: 'MENSUEL',
      titre: 'Clôture & Inventaire Général Mensuel - Août 2026',
      responsable: 'Modou Faye (Resp. Stock)',
      supervisePar: 'M. Ndiaye Saliou (Directeur d\'Usine)',
      statutValidation: 'VALIDE',
      totalArticles: 6,
      articlesConformes: 6,
      articlesEnEcart: 0,
      valeurEcartNetFCFA: 0,
      notes: 'Inventaire 100% conforme. Réconciliation parfaite production/stock.',
      articles: [
        {
          articleId: 'mp-occ-01',
          articleNom: 'Balles de Cartons Ondulés OCC (100% Recyclé)',
          articleType: 'MATIERE_PREMIERE',
          unite: 'Kg',
          stockTheorique: 45000,
          stockPhysique: 45000,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 85,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        },
        {
          articleId: 'prod-alv-30-std',
          articleNom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
          articleType: 'PRODUIT_FINI',
          unite: 'Fardeaux',
          stockTheorique: 310,
          stockPhysique: 310,
          ecartQuantite: 0,
          valeurUnitaireFCFA: 4500,
          ecartValeurFCFA: 0,
          statut: 'CONFORME'
        }
      ]
    }
  ];

  await db.inventorySessions.bulkAdd(initialSessions);
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

/**
 * Données initiales des contrats B2B, bons de sortie et retours commerciaux (CDC Sections 6.6, 6.7, 7.2)
 */
export async function seedCommercialVouchersAndContractsIfEmpty() {
  // 1. Contrats Commerciaux (30 FCFA/alv = 3 000 FCFA/lot de 100)
  const contractsCount = await db.commercialContracts.count();
  if (contractsCount === 0) {
    const contracts: CommercialContract[] = [
      {
        id: 'ctr-sedima-2026',
        numeroContrat: 'CTR-2026-001',
        clientId: 'client-sedima',
        clientNom: 'SEDIMA SA (Complexe Avicole Rufisque)',
        dateSignature: '2026-01-15',
        dateDebut: '2026-02-01',
        dateFin: '2026-12-31',
        dureeMois: 11,
        volumeMensuelLots: 800, // 80 000 alvéoles/mois
        prixContractuelAlveole: 30,
        prixContractuelLot: 3000,
        frequenceLivraison: 'Bi-hebdomadaire (Mardi & Vendredi)',
        volumeTotalContractuelLots: 8800,
        volumeLivreLots: 6200,
        volumeRestantLots: 2600,
        statut: 'EN_COURS',
        conditionsPaiement: '15 jours fin de quinzaine par virement'
      },
      {
        id: 'ctr-sosedis-2026',
        numeroContrat: 'CTR-2026-002',
        clientId: 'client-sosedis',
        clientNom: 'SOSEDIS Sénégal (Gros & Demi-Gros)',
        dateSignature: '2026-02-01',
        dateDebut: '2026-02-01',
        dateFin: '2026-10-31',
        dureeMois: 9,
        volumeMensuelLots: 500, // 50 000 alvéoles/mois
        prixContractuelAlveole: 30,
        prixContractuelLot: 3000,
        frequenceLivraison: 'Hebdomadaire (Mercredi)',
        volumeTotalContractuelLots: 4500,
        volumeLivreLots: 3800,
        volumeRestantLots: 700,
        statut: 'EN_COURS',
        conditionsPaiement: 'Au comptant à la livraison'
      },
      {
        id: 'ctr-nma-2026',
        numeroContrat: 'CTR-2026-003',
        clientId: 'client-nma-sanders',
        clientNom: 'NMA Sanders Pôle Avicole Pout',
        dateSignature: '2026-03-01',
        dateDebut: '2026-03-01',
        dateFin: '2027-02-28',
        dureeMois: 12,
        volumeMensuelLots: 600,
        prixContractuelAlveole: 30,
        prixContractuelLot: 3000,
        frequenceLivraison: 'Hebdomadaire (Lundi)',
        volumeTotalContractuelLots: 7200,
        volumeLivreLots: 4200,
        volumeRestantLots: 3000,
        statut: 'EN_COURS',
        conditionsPaiement: '30 jours fin de mois'
      }
    ];
    await db.commercialContracts.bulkAdd(contracts);
  }

  // 2. Bons de Sortie Commerciaux (Section 6.6 du CDC)
  const exitCount = await db.commercialExitVouchers.count();
  if (exitCount === 0) {
    const exitVouchers: CommercialExitVoucher[] = [
      {
        id: 'bsc-2026-001',
        numeroBon: 'BSC-2026-001',
        date: '2026-10-24',
        commercialId: 'usr-com',
        commercialNom: 'Ibrahima Ndiaye',
        produitId: 'prod-alv-30-std',
        produitNom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
        quantiteLots: 100, // 10 000 alvéoles
        quantiteUnites: 10000,
        stockUsineAvant: 520,
        stockUsineApres: 420,
        stockCommercialAvant: 0,
        stockCommercialApres: 100,
        magasinierNom: 'Modou Faye (Magasinier)',
        statut: 'CONFIRME_PAR_COMMERCIAL',
        observations: 'Dotation tournée secteur Thiès - Tivaouane (Scénario Test 4)'
      }
    ];
    await db.commercialExitVouchers.bulkAdd(exitVouchers);
  }

  // 3. Bons de Retour Invendus (Section 6.7 du CDC)
  const returnCount = await db.commercialReturnVouchers.count();
  if (returnCount === 0) {
    const returnVouchers: CommercialReturnVoucher[] = [
      {
        id: 'brc-2026-001',
        numeroRetour: 'BRC-2026-001',
        date: '2026-10-24',
        commercialId: 'usr-com',
        commercialNom: 'Ibrahima Ndiaye',
        produitId: 'prod-alv-30-std',
        produitNom: 'Plateau 30 Œufs Standard (Pâte Moulée)',
        quantiteLots: 15,
        motif: 'Invendus retour de tournée hebdomadaire',
        statut: 'ACCEPTE_CONFORME',
        magasinierNom: 'Modou Faye (Magasinier)',
        dateValidation: '2026-10-24',
        observations: '12 lots réintégrés en stock PF conforme, 3 lots déclassés dirigés vers recyclage pulpeur.'
      }
    ];
    await db.commercialReturnVouchers.bulkAdd(returnVouchers);
  }
}

export const INITIAL_FACTORY_USERS: User[] = [
  {
    id: 'usr-dir',
    name: 'M. Ndiaye Saliou',
    email: 'directeur@bsalveoles.sn',
    password: 'BS@Directeur2026!',
    role: 'DIRECTEUR_USINE',
    phone: '+221 76 622 59 79',
    department: 'Direction Générale',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-prod',
    name: 'Amadou Bâ',
    email: 'production@bsalveoles.sn',
    password: 'BS@Prod2026!',
    role: 'RESPONSABLE_PRODUCTION',
    phone: '+221 77 450 11 22',
    department: 'Production & TRS',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-stock',
    name: 'Modou Faye',
    email: 'stock@bsalveoles.sn',
    password: 'BS@Stock2026!',
    role: 'RESPONSABLE_STOCK',
    phone: '+221 78 300 44 55',
    department: 'Magasin & Matières Premières',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-com',
    name: 'Ibrahima Ndiaye',
    email: 'responsable.commercial@bsalveoles.sn',
    password: 'BS@RespCom2026!',
    role: 'RESPONSABLE_COMMERCIAL',
    phone: '+221 77 100 00 01',
    department: 'Direction Commerciale',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-agent-com',
    name: 'Cheikh Sène',
    email: 'commercial@bsalveoles.sn',
    password: 'BS@Com2026!',
    role: 'COMMERCIAL',
    phone: '+221 77 220 33 44',
    department: 'Force de Vente Terrain',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-cpt',
    name: 'Awa Diop',
    email: 'comptable@bsalveoles.sn',
    password: 'BS@Cpt2026!',
    role: 'COMPTABLE',
    phone: '+221 76 100 00 03',
    department: 'Finance & Trésorerie',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-audit',
    name: 'Ousmane Diallo',
    email: 'auditeur@bsalveoles.sn',
    password: 'BS@Audit2026!',
    role: 'CONTROLEUR_AUDITEUR',
    phone: '+221 77 888 99 00',
    department: 'Audit & Conformité CDC',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  },
  {
    id: 'usr-super',
    name: 'Super Admin',
    email: 'admin@bsalveoles.sn',
    password: 'BS@Admin2026!',
    role: 'SUPER_ADMIN',
    phone: '+221 78 914 88 88',
    department: 'Système & IT',
    actif: true,
    dateCreation: '2026-01-01',
    dernierAcces: '2026-10-25'
  }
];

export async function seedUsersIfEmpty() {
  const count = await db.users.count();
  if (count === 0) {
    await db.users.bulkAdd(INITIAL_FACTORY_USERS);
  }
}

export const DEFAULT_FACTORY_PARAMETERS: FactorySystemParameters = {
  id: 'settings-default',
  // 9.1 Paramètres industriels
  cadenceNominale: 2000,
  tauxRendementRetenu: 85,
  cadenceReelleCible: 1700,
  heuresEffectivesParJour: 8,
  joursProductionParMois: 26,
  rendementMatiereAlvParKg: 35,
  besoinMensuelPapierKg: 10100,
  seuilVertRebut: 3,
  seuilRougeRebut: 5,

  // 9.2 Paramètres commerciaux
  tailleLotCommercial: 100,
  prixContractuelAlveole: 30,
  prixMarcheOuvertAlveole: 35,
  prixContractuelLot: 3000,
  prixMarcheOuvertLot: 3500,
  dureeIndicativeContratsMois: 12,
  partContractuelleViseePourcent: 60,
  partMarcheOuvertPourcent: 40,

  // 9.3 Paramètres financiers
  prixAchatPapierKg: 250, // Mis à jour à 250 FCFA / kg (Accord commercial client)
  forfaitTransportPapierMensuel: 300000,
  coutKwhElectricite: 115,
  coutM3Eau: 650,
  delaiPaiementParDefautJours: 15,
  tauxRemiseMaxPourcent: 10,

  // 4.3 Seuils d'alertes automatiques configurables (CDC Section 4.3)
  seuilAlerteJoursAutonomiePapier: 5,
  seuilAlerteCadenceMin: 1500,
  seuilAlerteTauxRebutMax: 5.0,
  seuilAlerteArretMachineProlongeHeures: 1.5,
  seuilAlerteStockMinLotsProduitsFinis: 200,
  seuilAlerteStockCommercialPlafondLots: 250,
  seuilAlerteCreancesMaxFCFA: 1500000,
  seuilAlerteDelaiFactureEchueJours: 15,
  seuilAlerteEcheanceContratJours: 30,
  seuilAlerteEcartInventaireValeurFCFA: 50000,

  derniereModification: '2026-10-27',
  modifiePar: 'Direction Générale (Validation Client 250 FCFA/kg)',
  motifDerniereModification: 'Initialisation des seuils d\'alertes configurables Module 1 CDC'
};

export async function seedFactorySettingsIfEmpty() {
  const count = await db.factorySettings.count();
  if (count === 0) {
    await db.factorySettings.add(DEFAULT_FACTORY_PARAMETERS);
  } else {
    // S'assurer que les seuils d'alerte sont renseignés si les settings existaient déjà
    const current = await db.factorySettings.toCollection().first();
    if (current && current.seuilAlerteJoursAutonomiePapier === undefined) {
      await db.factorySettings.update(current.id, {
        seuilAlerteJoursAutonomiePapier: 5,
        seuilAlerteCadenceMin: 1500,
        seuilAlerteTauxRebutMax: 5.0,
        seuilAlerteArretMachineProlongeHeures: 1.5,
        seuilAlerteStockMinLotsProduitsFinis: 200,
        seuilAlerteStockCommercialPlafondLots: 250,
        seuilAlerteCreancesMaxFCFA: 1500000,
        seuilAlerteDelaiFactureEchueJours: 15,
        seuilAlerteEcheanceContratJours: 30,
        seuilAlerteEcartInventaireValeurFCFA: 50000
      });
    }
  }
}

export async function seedRawMaterialReceptionsIfEmpty() {
  const count = await db.rawMaterialReceptions.count();
  if (count === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.rawMaterialReceptions.bulkAdd([
      {
        id: 'rec-2026-101',
        numeroBon: 'BR-2026-101',
        date: today,
        heure: '08:30',
        modeApprovisionnement: 'FOURNISSEUR_LIVRAISON',
        fournisseurNom: 'Sénégal Carton Récupération SARL',
        fournisseurContact: '+221 77 550 12 34',
        fournisseurAdresse: 'Zone Industrielle Mbao, Dakar',
        transporteur: 'Transports Ba & Frères',
        chauffeurNom: 'Ousmane Fall',
        chauffeurTel: '+221 70 889 45 12',
        vehiculeImmatriculation: 'DK-4589-BB',
        numeroBonPesee: 'PESEE-DAKAR-8842',
        numeroFactureFournisseur: 'FAC-SCR-2026-441',
        mpId: 'mp-occ-01',
        mpNom: 'Balles de Cartons Ondulés Recyclés (OCC)',
        typePapierCarton: 'Balles OCC 100% compactées',
        estGratuitDebarras: false,
        prixUnitaireKg: 250,
        quantiteDeclareeKg: 6000,
        quantiteBruteReceptionneeKg: 6000,
        coutTotalBrutFCFA: 1500000, // 6000 kg * 250 F
        statutTri: 'TRI_EFFECTUE',
        dateTri: today,
        responsableTri: 'Modou Faye (Chef Tri & Magasin)',
        quantiteExploitableKg: 5700, // 95%
        quantiteRejeteeKg: 300,
        rendementTriPourcent: 95.0,
        coutRevientReelKg: 263.2, // 1 500 000 / 5700
        motifRejet: '300 kg de matières souillées (huile moteur) et agrafes métalliques lourdes',
        magasinierReception: 'Modou Faye',
        observations: 'Réception conforme à la pesée usine. Matière exploitable admise au pulpeur.'
      },
      {
        id: 'rec-2026-102',
        numeroBon: 'COL-2026-102',
        date: today,
        heure: '11:15',
        modeApprovisionnement: 'COLLECTE_USINE',
        fournisseurNom: 'Grandes Imprimeries Rufisque & Thiès',
        agentCollecteNom: 'Moussa Diop (Agent Collecte BS)',
        siteEntrepriseCollectee: 'Zone Artisanale & Imprimeries Rufisque',
        vehiculeType: 'VEHICULE_LOCATION',
        loueurNom: 'Location Utilitaires Thiès Express',
        coutLocationFCFA: 25000,
        heureDepart: '07:30',
        heureRetour: '11:00',
        vehiculeImmatriculation: 'TH-9021-C',
        mpId: 'mp-jour-02',
        mpNom: 'Papiers Journaux & Rognures Kraft',
        typePapierCarton: 'Rognures blanches & Papiers Kraft',
        estGratuitDebarras: true, // Collecte gratuite pour débarras !
        prixUnitaireKg: 0,
        quantiteDeclareeKg: 1800,
        quantiteBruteReceptionneeKg: 1800,
        coutTotalBrutFCFA: 25000, // Seulement le coût du transport/location !
        statutTri: 'TRI_EFFECTUE',
        dateTri: today,
        responsableTri: 'Modou Faye (Chef Tri & Magasin)',
        quantiteExploitableKg: 1720,
        quantiteRejeteeKg: 80,
        rendementTriPourcent: 95.6,
        coutRevientReelKg: 14.5, // 25 000 / 1720 kg = Coût de revient exceptionnellement bas (14.5 F/kg) !
        motifRejet: '80 kg de rognures avec encres UV plastifiées',
        magasinierReception: 'Modou Faye',
        observations: 'Excellente opération : débarras d\'imprimerie gratuit. Matière très propre.'
      },
      {
        id: 'rec-2026-103',
        numeroBon: 'BR-2026-103',
        date: today,
        heure: '14:45',
        modeApprovisionnement: 'FOURNISSEUR_LIVRAISON',
        fournisseurNom: 'GIE Récupérateurs Diamniadio',
        fournisseurContact: '+221 76 340 78 90',
        transporteur: 'Camion Partenaire GIE',
        chauffeurNom: 'Alioune Sow',
        chauffeurTel: '+221 77 112 33 44',
        vehiculeImmatriculation: 'DK-1204-AE',
        numeroBonPesee: 'PESEE-USINE-0994',
        mpId: 'mp-occ-01',
        mpNom: 'Balles de Cartons Ondulés Recyclés (OCC)',
        typePapierCarton: 'Cartons mixtes & boîtes d\'emballages',
        estGratuitDebarras: false,
        prixUnitaireKg: 250,
        quantiteDeclareeKg: 4500,
        quantiteBruteReceptionneeKg: 4500,
        coutTotalBrutFCFA: 1125000,
        statutTri: 'EN_ATTENTE_DE_TRI', // En attente de tri !
        magasinierReception: 'Modou Faye',
        observations: 'Déchargé en Quai de Réception B. En attente de passage sur la table de tri.'
      }
    ]);
  }
}

export async function seedRejectedRawMaterialsIfEmpty() {
  const count = await db.rejectedRawMaterials.count();
  if (count === 0) {
    const today = new Date().toISOString().split('T')[0];
    await db.rejectedRawMaterials.bulkAdd([
      {
        id: 'rej-001',
        date: today,
        mpReference: 'MP-OCC-BALL',
        mpNom: 'Balles de Cartons Ondulés (OCC)',
        quantiteKg: 300,
        motifRejet: 'Présence excessive de rubans adhésifs plastiques et colle thermofusible',
        fournisseur: 'Sénégal Carton Récupération SARL',
        statut: 'EN_ATTENTE_DECISION',
        responsableTri: 'Modou Faye (Magasinier Tri)',
        observations: 'Mis en quarantaine Zone C - En attente validation pour effilochage ou rejet'
      },
      {
        id: 'rej-002',
        date: today,
        mpReference: 'MP-JOURNAUX',
        mpNom: 'Papiers Journaux & Rognures Kraft',
        quantiteKg: 80,
        motifRejet: 'Rognures avec encres UV plastifiées non dispersibles à l\'eau',
        fournisseur: 'Grandes Imprimeries Rufisque',
        statut: 'EVACUATION_DEFINITIVE',
        responsableTri: 'Modou Faye (Chef Tri & Magasin)',
        dateDecision: today,
        observations: 'Inutilisable pour alvéoles - Évacuation décharge contrôlée'
      }
    ]);
  }
}

export async function seedQualityControlsAndIncidentsIfEmpty() {
  const qcCount = await db.qualityControls.count();
  const today = new Date().toISOString().split('T')[0];
  if (qcCount === 0) {
    await db.qualityControls.bulkAdd([
      {
        id: 'qc-001',
        numeroControle: 'QC-20261025-01',
        date: today,
        heure: '10:30',
        rapportProductionId: 'shift-rec-01',
        produitId: 'prod-alv-30-std',
        produitNom: 'Plateau 30 Œufs Standard',
        quantiteControlee: 1000,
        quantiteConforme: 975,
        quantiteRejetee: 25,
        tauxRebut: 2.5,
        statutSeuil: 'VERT',
        typeDefaut: 'SURFACE_IRREGULIERE',
        detailsDefaut: 'Légères aspérités sur les alvéoles centrales',
        causeProbable: 'Fibre carton légèrement trop grossière en début de cycle',
        actionCorrective: 'Raffinage pulpeur prolongé de 5 minutes',
        responsableControle: 'Amadou Bâ (Contrôleur Qualité Quart Matin)',
        statutResolution: 'CORRIGE'
      },
      {
        id: 'qc-002',
        numeroControle: 'QC-20261026-02',
        date: today,
        heure: '16:45',
        rapportProductionId: 'shift-rec-02',
        produitId: 'prod-alv-30-std',
        produitNom: 'Plateau 30 Œufs Standard',
        quantiteControlee: 800,
        quantiteConforme: 765,
        quantiteRejetee: 35,
        tauxRebut: 4.38,
        statutSeuil: 'ORANGE',
        typeDefaut: 'HUMIDITE_RESIDUELLE',
        detailsDefaut: 'Humidité résiduelle supérieure à 12% en sortie de séchoir',
        causeProbable: 'Baisse de pression brûleur gaz propane séchoir tunnel',
        actionCorrective: 'Réajustement vanne gaz et maintien température tunnel à 190°C',
        responsableControle: 'Mamadou Seck (Contrôleur Qualité Quart Soir)',
        statutResolution: 'CORRIGE'
      }
    ]);
  }

  const incCount = await db.machineIncidents.count();
  if (incCount === 0) {
    await db.machineIncidents.bulkAdd([
      {
        id: 'inc-001',
        numeroIncident: 'INC-20261025-01',
        date: today,
        heureDebut: '08:15',
        heureFin: '08:45',
        dureeArretMinutes: 30,
        dureeArretHeures: 0.5,
        equipementConcerne: 'Pompe à Vide & Circuit Dépression',
        natureIncident: 'BLOCAGE_MACHINE',
        causeIdentifiee: 'Encrassement tamis filtrant sous vide',
        mesuresPrises: 'Démontage rapide et nettoyage sous haute pression par l\'équipe de quart',
        recoursAssistanceExterieure: false,
        impactProductionAlveoles: 850,
        responsableResolution: 'Amadou Bâ (Chef de Quart)',
        statutCloture: 'CLOTURE',
        rapportProductionId: 'shift-rec-01'
      },
      {
        id: 'inc-002',
        numeroIncident: 'INC-20261026-02',
        date: today,
        heureDebut: '18:10',
        heureFin: '18:34',
        dureeArretMinutes: 24,
        dureeArretHeures: 0.4,
        equipementConcerne: 'Convoyeur Tapis Séchoir Tunnel',
        natureIncident: 'PANNE_MECANIQUE',
        causeIdentifiee: 'Détente sangle d\'entraînement tapis métallique',
        mesuresPrises: 'Resserrage galet tendeur et lubrification chaîne thermique',
        recoursAssistanceExterieure: false,
        impactProductionAlveoles: 680,
        responsableResolution: 'Mamadou Seck (Chef de Quart)',
        statutCloture: 'CLOTURE',
        rapportProductionId: 'shift-rec-02'
      }
    ]);
  }
}

export async function seedSupplierReturnsAndMaterialExitRequestsIfEmpty() {
  const returnCount = await db.supplierReturnVouchers.count();
  const today = new Date().toISOString().split('T')[0];
  if (returnCount === 0) {
    await db.supplierReturnVouchers.bulkAdd([
      {
        id: 'brf-001',
        numeroBonRetour: 'BRF-20261026-01',
        date: today,
        heure: '15:20',
        receptionId: 'rec-2026-101',
        numeroBonReception: 'BR-2026-101',
        fournisseurNom: 'Sénégal Carton Récupération SARL',
        fournisseurContact: '+221 77 550 12 34',
        fournisseurAdresse: 'Zone Industrielle Mbao, Dakar',
        mpNom: 'Balles de Cartons Ondulés Recyclés (OCC)',
        quantiteBruteKg: 6000,
        quantiteRejeteeKg: 300,
        tauxConformePourcent: 95.0,
        motifRetour: '300 kg de matières souillées aux hydrocarbures et métaux lourds impropres au pulpage',
        prixUnitaireKg: 250,
        montantAvoirFCFA: 75000,
        transporteur: 'Transports Ba & Frères',
        chauffeurNom: 'Ousmane Fall',
        chauffeurTel: '+221 70 889 45 12',
        chauffeurAdresse: 'Grand Yoff, Dakar',
        vehiculeImmatriculation: 'DK-4589-BB',
        magasinierNom: 'Modou Faye (Chef Tri & Magasin)',
        statut: 'RETOUR_EMIS',
        observations: 'Bon d\'avoir transmis au service achat pour déduction sur prochaine facture fournisseur'
      }
    ]);
  }

  const exitReqCount = await db.materialExitRequests.count();
  if (exitReqCount === 0) {
    await db.materialExitRequests.bulkAdd([
      {
        id: 'dsm-001',
        numeroDemande: 'DSM-20261027-01',
        date: today,
        heure: '06:15',
        mpId: 'mp-occ-01',
        mpNom: 'Balles de Cartons Ondulés Recyclés (OCC)',
        quantiteKgDemandee: 1550,
        shift: 'MATIN_06H_14H',
        ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
        demandeurNom: 'Amadou Bâ (Chef de Quart Matin)',
        motifBesoins: 'Alimentation pulpeur quart matin - Production alvéoles 30 œufs standard',
        statut: 'APPROUVEE_DESTOCKEE',
        autorisePar: 'Modou Faye (Magasinier Principal)',
        dateAutorisation: today,
        numeroBonSortieGenere: 'BSM-20261027-01',
        observations: 'Sortie autorisée et pesée conforme. Matière transférée au convoyeur pulpeur.'
      },
      {
        id: 'dsm-002',
        numeroDemande: 'DSM-20261027-02',
        date: today,
        heure: '09:30',
        mpId: 'mp-cmc-03',
        mpNom: 'CMC (Carboxyméthylcellulose) - Agent Rétention & Liant',
        quantiteKgDemandee: 35,
        shift: 'MATIN_06H_14H',
        ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
        demandeurNom: 'Amadou Bâ (Chef de Quart Matin)',
        motifBesoins: 'Dosage adjuvant liant cuve de préparation pulpe pour lot renforcé',
        statut: 'EN_ATTENTE_AUTORISATION',
        observations: 'En attente de signature par le responsable stock.'
      }
    ]);
  }
}


// ══════════════════════════════════════════════════════════════════════════════
// SEED : Fournisseurs d'Intrants avec Tarifs Négociés
// ══════════════════════════════════════════════════════════════════════════════
async function seedIntrantSuppliersIfEmpty() {
  const count = await db.intrantSuppliers.count();
  if (count > 0) return;

  const today = new Date().toISOString().split('T')[0];

  const suppliers: IntrantSupplier[] = [
    {
      id: 'fourn-akd-001',
      code: 'FOURN-INT-001',
      nom: 'Chimie Spécialités Papetières International (CSPI)',
      contact: 'Jean-Marc Dubois',
      telephone: '+221 33 869 12 45',
      email: 'jm.dubois@cspi-dakar.sn',
      adresse: 'Zone Industrielle de Diamniadio, Dakar',
      pays: 'Sénégal',
      intrantsLivres: ['mp-akd-02'],
      prixCatalogue: [
        {
          intrantId: 'mp-akd-02',
          intrantNom: 'AKD (Alkyl Ketene Dimer) — Agent Hydrofuge Encollage',
          prixUnitaireFCFA: 1850,
          unite: 'Kg',
          quantiteMinimaleCommande: 200,
          delaiLivraisonJours: 5,
          conditionsPaiement: '30 jours fin de mois',
          remisePourcent: 3,
          prixNegocie: 1794  // 1850 × (1 - 3%)
        }
      ],
      notesCommerciales: 'Fournisseur exclusif AKD. Remise 3% si commande ≥ 500 kg. Livraison sous 5 jours ouvrés Dakar.',
      statut: 'ACTIF',
      dateCreation: today
    },
    {
      id: 'fourn-amidon-001',
      code: 'FOURN-INT-002',
      nom: 'Cationic Starch for Papermaking Co. (CSP)',
      contact: 'Li Wei',
      telephone: '+86 21 5551 7890',
      email: 'liwei@csp-shanghai.cn',
      adresse: 'Shanghai Export Zone, Chine',
      pays: 'Chine',
      intrantsLivres: ['mp-amidon-01'],
      prixCatalogue: [
        {
          intrantId: 'mp-amidon-01',
          intrantNom: 'Amidon Cationique — Liant Résistance Humide',
          prixUnitaireFCFA: 850,
          unite: 'Kg',
          quantiteMinimaleCommande: 500,
          delaiLivraisonJours: 45,
          conditionsPaiement: 'Paiement avant livraison (Virement SWIFT)',
          remisePourcent: 5,
          prixNegocie: 808  // 850 × 0.95
        }
      ],
      notesCommerciales: 'Import Chine via transitaire Bolloré Dakar. Délai 45 jours FOB Shanghai. Remise 5% sur volume ≥ 2T.',
      statut: 'ACTIF',
      dateCreation: today
    },
    {
      id: 'fourn-cmc-001',
      code: 'FOURN-INT-003',
      nom: 'Arshine Pharmaceutical Co., Limited',
      contact: 'Sarah Chen',
      telephone: '+86 755 8823 4567',
      email: 's.chen@arshine-chem.com',
      adresse: 'Shenzhen Industrial Park, Guangdong, Chine',
      pays: 'Chine',
      intrantsLivres: ['mp-cmc-03'],
      prixCatalogue: [
        {
          intrantId: 'mp-cmc-03',
          intrantNom: 'CMC (Carboxyméthylcellulose) — Agent Rétention & Liant',
          prixUnitaireFCFA: 1450,
          unite: 'Kg',
          quantiteMinimaleCommande: 300,
          delaiLivraisonJours: 40,
          conditionsPaiement: 'LC 30 jours / Acompte 30%',
          remisePourcent: 4,
          prixNegocie: 1392  // 1450 × 0.96
        }
      ],
      notesCommerciales: 'CMC qualité food-grade utilisable en papeterie. Certification SGS disponible. Emballage 25 kg sacs.',
      statut: 'ACTIF',
      dateCreation: today
    },
    {
      id: 'fourn-talc-001',
      code: 'FOURN-INT-004',
      nom: 'Minéraux Techniques & Talcs Industriels (MTTI)',
      contact: 'Ousmane Ndiaye',
      telephone: '+221 77 451 33 20',
      email: 'o.ndiaye@mtti-senegal.sn',
      adresse: 'Zone Industrielle Mbao, Dakar',
      pays: 'Sénégal',
      intrantsLivres: ['mp-talc-04'],
      prixCatalogue: [
        {
          intrantId: 'mp-talc-04',
          intrantNom: 'Talc Industriel — Charge Minérale & Lissage',
          prixUnitaireFCFA: 520,
          unite: 'Kg',
          quantiteMinimaleCommande: 1000,
          delaiLivraisonJours: 3,
          conditionsPaiement: 'Comptant à la livraison',
          remisePourcent: 2,
          prixNegocie: 510
        }
      ],
      notesCommerciales: 'Fournisseur local Dakar. Livraison J+3. Talc micronisé 10µm. Emballage big-bags 500 kg ou sacs 25 kg.',
      statut: 'ACTIF',
      dateCreation: today
    },
    {
      id: 'fourn-antimousse-001',
      code: 'FOURN-INT-005',
      nom: 'Ashland Specialty Ingredients West Africa',
      contact: 'Aminata Kouyaté',
      telephone: '+221 33 842 67 89',
      email: 'a.kouyate@ashland-wa.com',
      adresse: 'Immeuble CCI, Plateau Dakar',
      pays: 'Sénégal',
      intrantsLivres: ['mp-defoamer-05'],
      prixCatalogue: [
        {
          intrantId: 'mp-defoamer-05',
          intrantNom: 'Anti-mousse Defoamer — Contrôle Mousse Pulper',
          prixUnitaireFCFA: 2200,
          unite: 'Litre',
          quantiteMinimaleCommande: 100,
          delaiLivraisonJours: 7,
          conditionsPaiement: '15 jours net',
          remisePourcent: 0,
          prixNegocie: 2200
        }
      ],
      notesCommerciales: 'Produit silicone émulsionnable. Dosage faible (0.5-1 kg/T pulpe). Fiche de données sécurité REACH disponible.',
      statut: 'ACTIF',
      dateCreation: today
    },
    {
      id: 'fourn-local-001',
      code: 'FOURN-INT-006',
      nom: 'Districhimic Sénégal (Distributeur Multi-Intrants)',
      contact: 'Mamadou Gaye',
      telephone: '+221 70 234 56 78',
      email: 'm.gaye@districhimic.sn',
      adresse: 'Dakar Plateau — Rue Carnot',
      pays: 'Sénégal',
      intrantsLivres: ['mp-akd-02', 'mp-amidon-01', 'mp-cmc-03', 'mp-talc-04', 'mp-defoamer-05'],
      prixCatalogue: [
        { intrantId: 'mp-akd-02',      intrantNom: 'AKD Hydrofuge',       prixUnitaireFCFA: 2050, unite: 'Kg',    quantiteMinimaleCommande: 50,   delaiLivraisonJours: 2, conditionsPaiement: 'Comptant Wave/Espèces', prixNegocie: 2050 },
        { intrantId: 'mp-amidon-01',   intrantNom: 'Amidon Cationique',   prixUnitaireFCFA: 950,  unite: 'Kg',    quantiteMinimaleCommande: 100,  delaiLivraisonJours: 2, conditionsPaiement: 'Comptant', prixNegocie: 920 },
        { intrantId: 'mp-cmc-03',      intrantNom: 'CMC Liant',           prixUnitaireFCFA: 1600, unite: 'Kg',    quantiteMinimaleCommande: 50,   delaiLivraisonJours: 2, conditionsPaiement: 'Comptant', prixNegocie: 1560 },
        { intrantId: 'mp-talc-04',     intrantNom: 'Talc Industriel',     prixUnitaireFCFA: 580,  unite: 'Kg',    quantiteMinimaleCommande: 200,  delaiLivraisonJours: 2, conditionsPaiement: 'Comptant', prixNegocie: 565 },
        { intrantId: 'mp-defoamer-05', intrantNom: 'Anti-mousse Defoamer', prixUnitaireFCFA: 2500, unite: 'Litre', quantiteMinimaleCommande: 20,   delaiLivraisonJours: 2, conditionsPaiement: 'Comptant', prixNegocie: 2400 }
      ],
      notesCommerciales: 'Distributeur local rapide pour dépannage. Prix plus élevés mais délai J+2 max. Accepte Wave Business.',
      statut: 'ACTIF',
      dateCreation: today
    }
  ];

  await db.intrantSuppliers.bulkAdd(suppliers);
}

// ══════════════════════════════════════════════════════════════════════════════
// SEED : Mouvements d'Entrée / Sortie Intrants (avec Prix & Référence Paiement)
// ══════════════════════════════════════════════════════════════════════════════
async function seedIntrantMovementsIfEmpty() {
  const count = await db.intrantMovements.count();
  if (count > 0) return;

  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  const lastWeek  = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0];

  const movements: IntrantStockMovement[] = [
    // ── Entrées Achats ────────────────────────────────────────────────────────
    {
      id: 'imvt-ent-001',
      numeroMouvement: 'ENT-INT-20261020-001',
      date: lastWeek,
      heure: '09:15',
      type: 'ENTREE_ACHAT',
      intrantId: 'mp-akd-02',
      intrantNom: 'AKD (Alkyl Ketene Dimer) — Agent Hydrofuge Encollage',
      intrantCategorie: 'HYDROFUGE',
      unite: 'Kg',
      quantite: 300,
      stockAvant: 142,
      stockApres: 442,
      paysProvenance: 'France',
      villeUsine: 'Lyon',
      prixUsineUnitaireFCFA: 1450,
      fraisTransportFCFA: 65000,
      fraisDedouanementFCFA: 38200,
      fraisDiversFCFA: 0,
      coutTotalRenduFCFA: 538200,
      prixUnitaireFCFA: 1794,
      montantTotalFCFA: 538200,
      conditionnement: 'Bidons 25 L (12 bidons)',
      nombreColis: 12,
      poidsNetKg: 300,
      poidsDeclareFournisseurKg: 300,
      numeroCertificatAnalyse: 'COA-CSPI-2026-992',
      numeroCertificatOrigine: 'CO-FR-78219',
      numeroFicheMSDS: 'MSDS-AKD-FR-2026',
      certificationISO: 'ISO 9001:2015',
      lotFabricant: 'LOT-2026-FR-44',
      dateProductionFabricant: '2026-08-15',
      datePeremption: '2027-08-15',
      conformiteQualite: 'CONFORME',
      apparenceVisuelleCRT: 'OK',
      emballageCRT: 'INTACT',
      receptionnaireMagasin: 'Cheikh Ndiaye (Magasinier Usine)',
      referenceBonCommande: 'BC-INT-2026-0142',
      referenceFactureFournisseur: 'CSPI-F-2026-0089',
      referencePaiement: 'VIR-BNK-2026-0892',
      modePaiement: 'Virement Bancaire',
      comptePaiement: 'Banque Principale',
      fournisseurId: 'fourn-akd-001',
      fournisseurNom: 'Chimie Spécialités Papetières International (CSPI)',
      fournisseurContact: 'Jean-Marc Dubois',
      fournisseurTelephone: '+221 33 869 12 45',
      vehiculeImmatriculation: 'DK-7823-AB',
      chauffeurNom: 'Ibrahima Sall',
      enregistrePar: 'Magasinier Usine',
      observations: 'Réception conforme. Bidon 25L × 12 unités = 300 kg. Contrôle qualité et Certificat CoA validés.',
      valide: true,
      numeroBonGenere: 'BR-INT-20261020-001'
    },
    {
      id: 'imvt-ent-002',
      numeroMouvement: 'ENT-INT-20261021-002',
      date: lastWeek,
      heure: '14:30',
      type: 'ENTREE_ACHAT',
      intrantId: 'mp-amidon-01',
      intrantNom: 'Amidon Cationique — Liant Résistance Humide',
      intrantCategorie: 'LIANT_ADJUVANT',
      unite: 'Kg',
      quantite: 500,
      stockAvant: 280,
      stockApres: 780,
      paysProvenance: 'Chine',
      villeUsine: 'Shanghai',
      prixUsineUnitaireFCFA: 620,
      fraisTransportFCFA: 75000,
      fraisDedouanementFCFA: 19000,
      fraisDiversFCFA: 0,
      coutTotalRenduFCFA: 404000,
      prixUnitaireFCFA: 808,
      montantTotalFCFA: 404000,
      conditionnement: 'Sacs 25 kg (20 sacs)',
      nombreColis: 20,
      poidsNetKg: 500,
      poidsDeclareFournisseurKg: 500,
      numeroCertificatAnalyse: 'COA-CSP-SH-8841',
      numeroCertificatOrigine: 'CO-CN-2026-SH492',
      numeroCertificatPhytosanitaire: 'PHYTO-CN-2026-004',
      numeroFicheMSDS: 'MSDS-STARCH-CAT-02',
      certificationISO: 'ISO 9001 & ISO 14001',
      lotFabricant: 'LOT-SH-ST-2026-10',
      dateProductionFabricant: '2026-07-20',
      datePeremption: '2027-07-20',
      conformiteQualite: 'CONFORME',
      apparenceVisuelleCRT: 'OK',
      emballageCRT: 'INTACT',
      receptionnaireMagasin: 'Cheikh Ndiaye (Magasinier Usine)',
      referenceBonCommande: 'BC-INT-2026-0139',
      referenceFactureFournisseur: 'CSP-INV-2026-0451',
      referencePaiement: 'SWIFT-BNP-20261020',
      modePaiement: 'Virement Bancaire',
      comptePaiement: 'Banque Principale',
      fournisseurId: 'fourn-amidon-001',
      fournisseurNom: 'Cationic Starch for Papermaking Co. (CSP)',
      fournisseurContact: 'Li Wei',
      enregistrePar: 'Chef Magasin',
      observations: 'Arrivage container Shanghai. 20 sacs × 25 kg. Certificat phytosanitaire et CoA vérifiés. Stockage silos A2.',
      valide: true,
      numeroBonGenere: 'BR-INT-20261021-002'
    },
    {
      id: 'imvt-ent-003',
      numeroMouvement: 'ENT-INT-20261025-003',
      date: yesterday,
      heure: '10:00',
      type: 'ENTREE_ACHAT',
      intrantId: 'mp-cmc-03',
      intrantNom: 'CMC (Carboxyméthylcellulose) — Agent Rétention & Liant',
      intrantCategorie: 'LIANT_ADJUVANT',
      unite: 'Kg',
      quantite: 200,
      stockAvant: 95,
      stockApres: 295,
      paysProvenance: 'Sénégal',
      villeUsine: 'Dakar',
      prixUsineUnitaireFCFA: 1350,
      fraisTransportFCFA: 25000,
      fraisDedouanementFCFA: 17000,
      fraisDiversFCFA: 0,
      coutTotalRenduFCFA: 312000,
      prixUnitaireFCFA: 1560,
      montantTotalFCFA: 312000,
      conditionnement: 'Sacs 25 kg (8 sacs)',
      nombreColis: 8,
      poidsNetKg: 200,
      poidsDeclareFournisseurKg: 200,
      numeroCertificatAnalyse: 'COA-DISTR-SN-009',
      numeroCertificatOrigine: 'CO-SN-UEMOA-019',
      numeroFicheMSDS: 'MSDS-CMC-SN-01',
      certificationISO: 'ISO 9001',
      lotFabricant: 'LOT-SN-DK-2026',
      dateProductionFabricant: '2026-09-01',
      datePeremption: '2027-09-01',
      conformiteQualite: 'CONFORME',
      apparenceVisuelleCRT: 'OK',
      emballageCRT: 'INTACT',
      receptionnaireMagasin: 'Cheikh Ndiaye (Magasinier Usine)',
      referenceBonCommande: 'BC-INT-2026-0155',
      referenceFactureFournisseur: 'ARSH-2026-3890',
      referencePaiement: 'WAVE-TX-9823741',
      modePaiement: 'Wave',
      comptePaiement: 'Wave Business',
      fournisseurId: 'fourn-local-001',
      fournisseurNom: 'Districhimic Sénégal',
      fournisseurContact: 'Mamadou Gaye',
      fournisseurTelephone: '+221 70 234 56 78',
      vehiculeImmatriculation: 'TH-1290-ZZ',
      enregistrePar: 'Magasinier Usine',
      observations: 'Achat urgence chez distributeur local. Certificat et conformité validés.',
      valide: true,
      numeroBonGenere: 'BR-INT-20261025-003'
    },
    {
      id: 'imvt-ent-004',
      numeroMouvement: 'ENT-INT-20261026-004',
      date: yesterday,
      heure: '16:00',
      type: 'ENTREE_ACHAT',
      intrantId: 'mp-defoamer-05',
      intrantNom: 'Anti-mousse Defoamer — Contrôle Mousse Pulper',
      intrantCategorie: 'INTRANT_CHIMIQUE',
      unite: 'Litre',
      quantite: 150,
      stockAvant: 30,
      stockApres: 180,
      paysProvenance: 'Côte d\'Ivoire',
      villeUsine: 'Abidjan',
      prixUsineUnitaireFCFA: 1850,
      fraisTransportFCFA: 35000,
      fraisDedouanementFCFA: 17500,
      fraisDiversFCFA: 0,
      coutTotalRenduFCFA: 330000,
      prixUnitaireFCFA: 2200,
      montantTotalFCFA: 330000,
      conditionnement: 'Bidons 25 L (6 bidons)',
      nombreColis: 6,
      poidsNetKg: 150,
      poidsDeclareFournisseurKg: 150,
      numeroCertificatAnalyse: 'COA-ASHL-2026-041',
      numeroCertificatOrigine: 'CO-CI-CEDEAO-88',
      numeroFicheMSDS: 'MSDS-DF-441-CI',
      certificationISO: 'ISO 9001',
      lotFabricant: 'LOT-CI-DF-09',
      dateProductionFabricant: '2026-08-10',
      datePeremption: '2028-08-10',
      conformiteQualite: 'CONFORME',
      apparenceVisuelleCRT: 'OK',
      emballageCRT: 'INTACT',
      receptionnaireMagasin: 'Cheikh Ndiaye (Magasinier Usine)',
      referenceBonCommande: 'BC-INT-2026-0160',
      referenceFactureFournisseur: 'ASHL-F-2026-0112',
      referencePaiement: 'CHQ-BSA-00892',
      modePaiement: 'Chèque',
      comptePaiement: 'Banque Principale',
      fournisseurId: 'fourn-antimousse-001',
      fournisseurNom: 'Ashland Specialty Ingredients West Africa',
      fournisseurContact: 'Aminata Kouyaté',
      enregistrePar: 'Directeur Production',
      observations: 'Commande mensuelle Defoamer. 6 bidons × 25 L. CoA et conformité conformes.',
      valide: true,
      numeroBonGenere: 'BR-INT-20261026-004'
    },
    // ── Sorties Production ────────────────────────────────────────────────────
    {
      id: 'imvt-sor-001',
      numeroMouvement: 'SOR-INT-20261024-001',
      date: yesterday,
      heure: '06:30',
      type: 'SORTIE_PRODUCTION',
      intrantId: 'mp-akd-02',
      intrantNom: 'AKD (Alkyl Ketene Dimer) — Agent Hydrofuge Encollage',
      intrantCategorie: 'HYDROFUGE',
      unite: 'Kg',
      quantite: 45,
      stockAvant: 487,
      stockApres: 442,
      shiftConsommation: 'MATIN_06H_14H',
      ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
      numeroDemandeAutorisation: 'DSM-20261024-01',
      enregistrePar: 'Chef de Quart — Amadou Bâ',
      observations: 'Dosage AKD 1.5% sur lot 30 000 alvéoles. Encollage standard.',
      valide: true,
      numeroBonGenere: 'BS-INT-20261024-001'
    },
    {
      id: 'imvt-sor-002',
      numeroMouvement: 'SOR-INT-20261024-002',
      date: yesterday,
      heure: '06:45',
      type: 'SORTIE_PRODUCTION',
      intrantId: 'mp-amidon-01',
      intrantNom: 'Amidon Cationique — Liant Résistance Humide',
      intrantCategorie: 'LIANT_ADJUVANT',
      unite: 'Kg',
      quantite: 120,
      stockAvant: 780,
      stockApres: 660,
      shiftConsommation: 'MATIN_06H_14H',
      ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
      enregistrePar: 'Chef de Quart — Amadou Bâ',
      observations: 'Dosage 4 kg/T papier — préparation cuve pulpeur 30 000 unités lot A.',
      valide: true,
      numeroBonGenere: 'BS-INT-20261024-002'
    },
    {
      id: 'imvt-sor-003',
      numeroMouvement: 'SOR-INT-20261025-003',
      date: today,
      heure: '07:00',
      type: 'SORTIE_PRODUCTION',
      intrantId: 'mp-cmc-03',
      intrantNom: 'CMC (Carboxyméthylcellulose) — Agent Rétention & Liant',
      intrantCategorie: 'LIANT_ADJUVANT',
      unite: 'Kg',
      quantite: 35,
      stockAvant: 295,
      stockApres: 260,
      shiftConsommation: 'MATIN_06H_14H',
      ligneProduction: 'Ligne 2 - Mouleuse Rotative Compacte',
      numeroDemandeAutorisation: 'DSM-20261027-02',
      enregistrePar: 'Chef de Quart — Fatou Diallo',
      observations: 'Lot spécial renforcé. CMC dosé à 1.2 kg/T pulpe pour résistance humide.',
      valide: true,
      numeroBonGenere: 'BS-INT-20261025-003'
    },
    {
      id: 'imvt-sor-004',
      numeroMouvement: 'SOR-INT-20261027-004',
      date: today,
      heure: '08:15',
      type: 'SORTIE_PRODUCTION',
      intrantId: 'mp-defoamer-05',
      intrantNom: 'Anti-mousse Defoamer — Contrôle Mousse Pulper',
      intrantCategorie: 'INTRANT_CHIMIQUE',
      unite: 'Litre',
      quantite: 8,
      stockAvant: 180,
      stockApres: 172,
      shiftConsommation: 'MATIN_06H_14H',
      ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces',
      enregistrePar: 'Chef de Quart — Amadou Bâ',
      observations: 'Dosage anti-mousse 0.3 L/T — pulpeur en régime de production intense.',
      valide: true,
      numeroBonGenere: 'BS-INT-20261027-004'
    }
  ];

  await db.intrantMovements.bulkAdd(movements);
}

