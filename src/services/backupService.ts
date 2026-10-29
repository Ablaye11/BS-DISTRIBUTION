import { db } from '../db/database';
import { UserRole } from '../types';

export interface DatabaseBackup {
  meta: {
    app: string;
    version: string;
    exportDate: string;
    exportedBy: string;
    totalRecords: number;
  };
  alveoleProducts: any[];
  rawMaterials: any[];
  rejectedRawMaterials: any[];
  rawMaterialReceptions: any[];
  supplierReturnVouchers: any[];
  materialExitRequests: any[];
  productionShifts: any[];
  clients: any[];
  invoices: any[];
  expenses: any[];
  stockMovements: any[];
  notifications: any[];
  auditLogs: any[];
  inventorySessions: any[];
  commercialExitVouchers: any[];
  commercialReturnVouchers: any[];
  commercialContracts: any[];
  users: any[];
  factorySettings: any[];
  shiftAttendances: any[];
  qualityControls: any[];
  machineIncidents: any[];
  paymentRecords: any[];
  deliveryNotes: any[];
}

/**
 * Exporte l'intégralité de la base de données Dexie (toutes les tables) au format JSON.
 */
export const exportFullDatabaseBackup = async (userName = 'Direction Usine', userRole: UserRole = 'DIRECTEUR_USINE'): Promise<{ jsonStr: string; recordCount: number }> => {
  const [
    alveoleProducts,
    rawMaterials,
    rejectedRawMaterials,
    rawMaterialReceptions,
    supplierReturnVouchers,
    materialExitRequests,
    productionShifts,
    clients,
    invoices,
    expenses,
    stockMovements,
    notifications,
    auditLogs,
    inventorySessions,
    commercialExitVouchers,
    commercialReturnVouchers,
    commercialContracts,
    users,
    factorySettings,
    shiftAttendances,
    qualityControls,
    machineIncidents,
    paymentRecords,
    deliveryNotes
  ] = await Promise.all([
    db.alveoleProducts.toArray(),
    db.rawMaterials.toArray(),
    db.rejectedRawMaterials.toArray(),
    db.rawMaterialReceptions.toArray(),
    db.supplierReturnVouchers.toArray(),
    db.materialExitRequests.toArray(),
    db.productionShifts.toArray(),
    db.clients.toArray(),
    db.invoices.toArray(),
    db.expenses.toArray(),
    db.stockMovements.toArray(),
    db.notifications.toArray(),
    db.auditLogs.toArray(),
    db.inventorySessions.toArray(),
    db.commercialExitVouchers.toArray(),
    db.commercialReturnVouchers.toArray(),
    db.commercialContracts.toArray(),
    db.users.toArray(),
    db.factorySettings.toArray(),
    db.shiftAttendances.toArray(),
    db.qualityControls.toArray(),
    db.machineIncidents.toArray(),
    db.paymentRecords.toArray(),
    db.deliveryNotes.toArray()
  ]);

  const totalRecords = 
    alveoleProducts.length + rawMaterials.length + rejectedRawMaterials.length +
    rawMaterialReceptions.length + supplierReturnVouchers.length + materialExitRequests.length +
    productionShifts.length + clients.length + invoices.length + expenses.length +
    stockMovements.length + notifications.length + auditLogs.length + inventorySessions.length +
    commercialExitVouchers.length + commercialReturnVouchers.length + commercialContracts.length +
    users.length + factorySettings.length + shiftAttendances.length + qualityControls.length +
    machineIncidents.length + paymentRecords.length + deliveryNotes.length;

  const backupData: DatabaseBackup = {
    meta: {
      app: 'BS Alvéoles ERP/MES',
      version: '1.0',
      exportDate: new Date().toISOString(),
      exportedBy: `${userName} (${userRole})`,
      totalRecords
    },
    alveoleProducts,
    rawMaterials,
    rejectedRawMaterials,
    rawMaterialReceptions,
    supplierReturnVouchers,
    materialExitRequests,
    productionShifts,
    clients,
    invoices,
    expenses,
    stockMovements,
    notifications,
    auditLogs,
    inventorySessions,
    commercialExitVouchers,
    commercialReturnVouchers,
    commercialContracts,
    users,
    factorySettings,
    shiftAttendances,
    qualityControls,
    machineIncidents,
    paymentRecords,
    deliveryNotes
  };

  const jsonStr = JSON.stringify(backupData, null, 2);

  // Journalisation d'audit
  await db.auditLogs.add({
    id: `audit-backup-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userNom: userName,
    userRole,
    action: 'SAUVEGARDE_BASE_DE_DONNEES',
    entite: 'SYSTEME',
    description: `Export JSON complet réussi : ${totalRecords} enregistrements exportés (Test 12 CDC).`
  });

  return { jsonStr, recordCount: totalRecords };
};

/**
 * Déclenche le téléchargement direct du fichier JSON de sauvegarde dans le navigateur.
 */
export const downloadBackupFile = async (userName = 'Direction Usine', userRole: UserRole = 'DIRECTEUR_USINE') => {
  const { jsonStr } = await exportFullDatabaseBackup(userName, userRole);
  const blob = new Blob([jsonStr], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const timeStr = `${String(now.getHours()).padStart(2, '0')}h${String(now.getMinutes()).padStart(2, '0')}`;
  
  a.href = url;
  a.download = `BS_ALVEOLES_BACKUP_${dateStr}_${timeStr}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

/**
 * Restaure l'ensemble des données usine depuis un objet de sauvegarde JSON.
 */
export const restoreDatabaseFromBackup = async (
  data: any,
  userName = 'Administrateur',
  userRole: UserRole = 'SUPER_ADMIN'
): Promise<{ success: boolean; message: string; restoredCount: number }> => {
  if (!data || typeof data !== 'object') {
    throw new Error('Format de fichier de sauvegarde invalide (JSON non objet).');
  }

  // Vérifier la présence minimale des tables structurelles
  if (!data.alveoleProducts && !data.clients && !data.productionShifts) {
    throw new Error('Fichier de sauvegarde corrompu ou incomplet (tables principales absentes).');
  }

  let restoredCount = 0;

  await db.transaction('rw', [
    db.alveoleProducts,
    db.rawMaterials,
    db.rejectedRawMaterials,
    db.rawMaterialReceptions,
    db.supplierReturnVouchers,
    db.materialExitRequests,
    db.productionShifts,
    db.clients,
    db.invoices,
    db.expenses,
    db.stockMovements,
    db.notifications,
    db.auditLogs,
    db.inventorySessions,
    db.commercialExitVouchers,
    db.commercialReturnVouchers,
    db.commercialContracts,
    db.users,
    db.factorySettings,
    db.shiftAttendances,
    db.qualityControls,
    db.machineIncidents,
    db.paymentRecords,
    db.deliveryNotes
  ], async () => {
    // Helper pour vider et réinsérer
    const restoreTable = async (table: any, items?: any[]) => {
      if (Array.isArray(items) && items.length > 0) {
        await table.clear();
        await table.bulkAdd(items);
        restoredCount += items.length;
      }
    };

    await restoreTable(db.alveoleProducts, data.alveoleProducts);
    await restoreTable(db.rawMaterials, data.rawMaterials);
    await restoreTable(db.rejectedRawMaterials, data.rejectedRawMaterials);
    await restoreTable(db.rawMaterialReceptions, data.rawMaterialReceptions);
    await restoreTable(db.supplierReturnVouchers, data.supplierReturnVouchers);
    await restoreTable(db.materialExitRequests, data.materialExitRequests);
    await restoreTable(db.productionShifts, data.productionShifts);
    await restoreTable(db.clients, data.clients);
    await restoreTable(db.invoices, data.invoices);
    await restoreTable(db.expenses, data.expenses);
    await restoreTable(db.stockMovements, data.stockMovements);
    await restoreTable(db.inventorySessions, data.inventorySessions);
    await restoreTable(db.commercialExitVouchers, data.commercialExitVouchers);
    await restoreTable(db.commercialReturnVouchers, data.commercialReturnVouchers);
    await restoreTable(db.commercialContracts, data.commercialContracts);
    await restoreTable(db.users, data.users);
    await restoreTable(db.factorySettings, data.factorySettings);
    await restoreTable(db.shiftAttendances, data.shiftAttendances);
    await restoreTable(db.qualityControls, data.qualityControls);
    await restoreTable(db.machineIncidents, data.machineIncidents);
    await restoreTable(db.paymentRecords, data.paymentRecords);
    await restoreTable(db.deliveryNotes, data.deliveryNotes);
  });

  // Tracer la restauration dans l'audit log
  await db.auditLogs.add({
    id: `audit-restore-${Date.now()}`,
    timestamp: new Date().toISOString(),
    userNom: userName,
    userRole,
    action: 'RESTAURATION_BASE_DE_DONNEES',
    entite: 'SYSTEME',
    description: `Restauration complète effectuée avec succès : ${restoredCount} enregistrements restaurés depuis le dump du ${data.meta?.exportDate || 'date inconnue'}.`
  });

  return {
    success: true,
    message: `Base de données restaurée avec succès (${restoredCount} éléments).`,
    restoredCount
  };
};
