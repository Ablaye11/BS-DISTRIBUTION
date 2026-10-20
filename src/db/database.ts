import Dexie, { Table } from 'dexie';
import { 
  Prospect, Client, Poulailler, Invoice, 
  InterregionalMission, StockLot, StockLoss, 
  Expense, CommissionRecord, AuditLog, 
  DeliveryMissionPlanner, SystemNotification 
} from '../types';

export class BSDistributionDatabase extends Dexie {
  prospects!: Table<Prospect>;
  clients!: Table<Client>;
  poulaillers!: Table<Poulailler>;
  invoices!: Table<Invoice>;
  deliveries!: Table<DeliveryMissionPlanner>;
  missions!: Table<InterregionalMission>;
  stockLots!: Table<StockLot>;
  stockLosses!: Table<StockLoss>;
  expenses!: Table<Expense>;
  commissions!: Table<CommissionRecord>;
  notifications!: Table<SystemNotification>;
  auditLogs!: Table<AuditLog>;

  constructor() {
    super('BSDistributionDB_v3');
    this.version(1).stores({
      prospects:     'id, status, region, commercialId, scoring',
      clients:       'id, raisonSociale, categorie, region, commercialId',
      poulaillers:   'id, nom, demarcheurId, status, region',
      invoices:      'id, numero, clientId, commercialId, statutPaiement, date',
      deliveries:    'id, numeroBL, factureNumero, statut, region',
      missions:      'id, titre, destinationRegion, statut',
      stockLots:     'id, referenceLot, dateReception',
      stockLosses:   'id, typePerte, date',
      expenses:      'id, categorie, date',
      commissions:   'id, demarcheurId, statut, periode',
      notifications: 'id, type, isRead',
      auditLogs:     'id, timestamp, userRole, entite, action'
    });
  }
}

export const db = new BSDistributionDatabase();

/**
 * Initialise uniquement la notification de bienvenue au premier lancement.
 * Aucune donnée fictive — toutes les données sont saisies par les vrais utilisateurs.
 */
export async function seedInitialDataIfEmpty() {
  const count = await db.notifications.count();
  if (count > 0) return;

  const now = new Date().toISOString();
  const today = now.split('T')[0];

  await db.notifications.add({
    id: `notif-welcome-${Date.now()}`,
    type: 'stock',
    title: 'Bienvenue sur BS Distribution',
    message: 'Plateforme initialisée. Commencez par ajouter vos poulaillers, prospects et premiers stocks d\'œufs.',
    date: today,
    isRead: false
  });

  await db.auditLogs.add({
    id: `audit-init-${Date.now()}`,
    timestamp: now,
    userNom: 'Système',
    userRole: 'SUPER_ADMIN',
    action: 'INITIALISATION',
    entite: 'Système',
    description: 'Première ouverture de la plateforme BS Distribution SUARL. Base de données initialisée.',
  });
}

/**
 * Génère un numéro de facture séquentiel au format FAC-YYMM-####
 */
export async function generateInvoiceNumber(): Promise<{ numero: string; numeroBL: string }> {
  const now = new Date();
  const yymm = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const count = await db.invoices.count();
  const seq = (count + 1).toString().padStart(4, '0');
  return {
    numero: `FAC-${yymm}-${seq}`,
    numeroBL: `BL-${yymm}-${seq}`
  };
}

/**
 * Génère une référence de lot de stock au format LOT-YYMM-###
 */
export async function generateLotReference(): Promise<string> {
  const now = new Date();
  const yymm = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const count = await db.stockLots.count();
  const seq = (count + 1).toString().padStart(3, '0');
  return `LOT-${yymm}-${seq}`;
}

/**
 * Enregistre une ligne d'audit
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
