/**
 * Service d'importation et d'exportation de données de fichiers (CSV / Excel / JSON)
 * Pour BS ALVÉOLES SUARL
 */
import { db } from '../db/database';
import { Client, RawMaterialStock } from '../types';

/**
 * Nettoie et découpe une ligne CSV en tenant compte des guillemets
 */
export function parseCsvLine(line: string, delimiter: string = ';'): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

/**
 * Détecte le séparateur CSV (, ou ;)
 */
export function detectDelimiter(text: string): string {
  const firstLine = text.split('\n')[0] || '';
  const semiCount = (firstLine.match(/;/g) || []).length;
  const commaCount = (firstLine.match(/,/g) || []).length;
  return semiCount >= commaCount ? ';' : ',';
}

/**
 * Télécharge un fichier CSV avec UTF-8 BOM pour ouverture propre dans Excel
 */
export function downloadCsvTemplate(filename: string, headers: string[], sampleRows: string[][]) {
  const delimiter = ';';
  const csvContent = [
    headers.join(delimiter),
    ...sampleRows.map(row => row.map(v => `"${(v || '').replace(/"/g, '""')}"`).join(delimiter))
  ].join('\r\n');

  // Ajout du BOM UTF-8 (\uFEFF) pour compatibilité Excel
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Modèle et importation pour les Clients B2B
 */
export const CLIENT_CSV_HEADERS = [
  'Nom Entreprise / Client',
  'Personne Contact',
  'Téléphone',
  'Région (Dakar, Thiès, etc.)',
  'Catégorie Client',
  'Adresse / Localité'
];

export const CLIENT_CSV_SAMPLES = [
  ['Ferme Avicole Ndoyène', 'M. Cheikh Ndoye', '+221 77 123 45 67', 'Thiès', 'Ferme Avicole Ponte', 'Route de Khombole'],
  ['Couvoir du Saloum', 'Mme Fatou Sall', '+221 76 987 65 43', 'Kaolack', 'Couvoir Industriel', 'Zone Industrielle Kahone'],
  ['Grossiste Emballages Touba', 'Serigne Fall', '+221 78 456 12 30', 'Diourbel', 'Grossiste Distributeur Emballages', 'Marché Ocass']
];

export function downloadClientCsvTemplate() {
  downloadCsvTemplate('modele_import_clients_bs_alveoles.csv', CLIENT_CSV_HEADERS, CLIENT_CSV_SAMPLES);
}

export async function importClientsFromCsv(csvText: string): Promise<{ count: number; errors: string[] }> {
  const delimiter = detectDelimiter(csvText);
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) {
    throw new Error('Le fichier CSV est vide ou ne contient que les en-têtes.');
  }

  const errors: string[] = [];
  const clientsToAdd: Client[] = [];
  const today = new Date().toISOString().split('T')[0];

  // Ignorer l'en-tête (ligne 0)
  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const nom = cols[0]?.trim();
    if (!nom) {
      errors.push(`Ligne ${i + 1} ignorée : le nom du client est vide.`);
      continue;
    }

    const contact = cols[1]?.trim() || nom;
    const telephone = cols[2]?.trim() || '+221';
    const region = cols[3]?.trim() || 'Thiès';
    const categorie = cols[4]?.trim() || 'Ferme Avicole Ponte';
    const adresse = cols[5]?.trim() || '';

    const newClient: Client = {
      id: `client-${Date.now()}-${i}-${Math.random().toString(36).substring(2, 6)}`,
      codeClient: `CLT-${Date.now().toString().slice(-4)}-${i}`,
      raisonSociale: nom,
      contactNom: contact,
      telephone,
      region: (region as any),
      adresse,
      categorie: (categorie as any),
      soldeDuFCFA: 0,
      limiteCreditFCFA: 500000,
      delaiPaiementJours: 15
    };

    clientsToAdd.push(newClient);
  }

  if (clientsToAdd.length > 0) {
    await db.clients.bulkAdd(clientsToAdd);
  }

  return { count: clientsToAdd.length, errors };
}

/**
 * Modèle et importation pour les Matières Premières (Balles de Carton, Amidon...)
 */
export const RAW_MATERIALS_CSV_HEADERS = [
  'Référence (ex: MP-CARTON-01)',
  'Désignation Matière',
  'Catégorie (PAPIER_CARTON, AMIDON, EAU_ADDITIF)',
  'Unité (Kg, Litre)',
  'Stock Actuel',
  'Seuil de Sécurité',
  'Coût Moyen Achat (FCFA)',
  'Fournisseur Principal',
  'Emplacement Usine'
];

export const RAW_MATERIALS_CSV_SAMPLES = [
  ['MP-OCC-01', 'Balles de Cartons Ondulés (OCC)', 'PAPIER_CARTON', 'Kg', '25000', '8000', '80', 'Collecteurs Dakar', 'Hangar A'],
  ['MP-JOURNAL-02', 'Vieux Journaux & Rognures', 'PAPIER_CARTON', 'Kg', '12000', '4000', '70', 'Imprimeries Thiès', 'Hangar B'],
  ['MP-AMIDON-03', 'Amidon de Maïs Naturel', 'AMIDON', 'Kg', '1500', '500', '450', 'Fournisseur Dakar', 'Magasin Ingrédients']
];

export function downloadRawMaterialsCsvTemplate() {
  downloadCsvTemplate('modele_import_matieres_premieres_bs.csv', RAW_MATERIALS_CSV_HEADERS, RAW_MATERIALS_CSV_SAMPLES);
}

export async function importRawMaterialsFromCsv(csvText: string): Promise<{ count: number; errors: string[] }> {
  const delimiter = detectDelimiter(csvText);
  const lines = csvText.split(/\r?\n/).filter(l => l.trim().length > 0);
  if (lines.length <= 1) {
    throw new Error('Le fichier CSV est vide ou ne contient que les en-têtes.');
  }

  const errors: string[] = [];
  const materialsToAdd: RawMaterialStock[] = [];
  const today = new Date().toISOString().split('T')[0];

  for (let i = 1; i < lines.length; i++) {
    const cols = parseCsvLine(lines[i], delimiter);
    const nom = cols[1]?.trim() || cols[0]?.trim();
    if (!nom) {
      errors.push(`Ligne ${i + 1} ignorée : nom de matière vide.`);
      continue;
    }

    const ref = cols[0]?.trim() || `MP-${Date.now()}-${i}`;
    const categorie = (cols[2]?.trim() || 'PAPIER_CARTON') as any;
    const unite = (cols[3]?.trim() || 'Kg') as any;
    const stock = Number(cols[4]?.trim().replace(/\s+/g, '')) || 0;
    const seuil = Number(cols[5]?.trim().replace(/\s+/g, '')) || 1000;
    const cout = Number(cols[6]?.trim().replace(/\s+/g, '')) || 80;
    const fournisseur = cols[7]?.trim() || 'Collecteur Partenaire';
    const emplacement = cols[8]?.trim() || 'Hangar A';

    materialsToAdd.push({
      id: `mp-${Date.now()}-${i}`,
      reference: ref,
      nom,
      categorie,
      unite,
      stockActuel: stock,
      seuilSecurite: seuil,
      coutMoyenAchatFCFA: cout,
      fournisseurPrincipal: fournisseur,
      emplacementStock: emplacement,
      derniereReception: today
    });
  }

  if (materialsToAdd.length > 0) {
    await db.rawMaterials.bulkAdd(materialsToAdd);
  }

  return { count: materialsToAdd.length, errors };
}
