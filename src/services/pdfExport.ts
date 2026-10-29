/**
 * pdfExport.ts
 * Service d'export PDF pour BS ALVÉOLES SUARL
 * Utilise jsPDF pour générer des rapports professionnels
 */

import jsPDF from 'jspdf';
import { Invoice } from '../types';

// ── Types ────────────────────────────────────────────────────────────
export interface PdfTableColumn {
  header: string;
  key: string;
  width?: number;        // largeur relative (entre 0 et 1)
  align?: 'left' | 'right' | 'center';
  format?: (val: any) => string;
}

export interface PdfReportConfig {
  title: string;
  subtitle?: string;
  module: string;
  themeHex?: string;    // couleur primaire du thème (ex: '#2563eb')
  columns: PdfTableColumn[];
  rows: Record<string, any>[];
  summary?: { label: string; value: string }[];
  footer?: string;
}

// ── Utilitaires ──────────────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return [r, g, b];
}

function formatDate(): string {
  return new Date().toLocaleDateString('fr-FR', {
    day: '2-digit', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  });
}


// ── Générateur principal ─────────────────────────────────────────────
export function generatePdfReport(config: PdfReportConfig): void {
  const {
    title,
    subtitle,
    module,
    themeHex = '#2563eb',
    columns,
    rows,
    summary,
    footer
  } = config;

  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;

  const [pr, pg, pb] = hexToRgb(themeHex);

  // ── HEADER BANDEAU ────────────────────────────────────────────────
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(0, 0, pageW, 28, 'F');

  // Logo / titre usine
  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BS ALVÉOLES SUARL', marginL, 11);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Unité de Production d\'Alvéoles · Dakar, Sénégal', marginL, 17);
  pdf.text(`Module : ${module}`, marginL, 22);

  // Date à droite
  pdf.setFontSize(7);
  pdf.text(`Généré le ${formatDate()}`, pageW - marginR, 22, { align: 'right' });

  // ── TITRE DU RAPPORT ──────────────────────────────────────────────
  let y = 38;

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(16);
  pdf.setFont('helvetica', 'bold');
  pdf.text(title, marginL, y);
  y += 6;

  if (subtitle) {
    pdf.setFontSize(9);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(100, 116, 139);
    pdf.text(subtitle, marginL, y);
    y += 5;
  }

  // Ligne séparatrice
  pdf.setDrawColor(pr, pg, pb);
  pdf.setLineWidth(0.8);
  pdf.line(marginL, y + 2, pageW - marginR, y + 2);
  y += 8;

  // ── RÉSUMÉ / KPIs ──────────────────────────────────────────────────
  if (summary && summary.length > 0) {
    const boxW = contentW / summary.length - 3;
    summary.forEach((item, i) => {
      const bx = marginL + i * (boxW + 3);

      // Fond léger
      pdf.setFillColor(248, 250, 252);
      pdf.setDrawColor(226, 232, 240);
      pdf.setLineWidth(0.3);
      pdf.roundedRect(bx, y, boxW, 14, 2, 2, 'FD');

      // Valeur
      pdf.setTextColor(pr, pg, pb);
      pdf.setFontSize(12);
      pdf.setFont('helvetica', 'bold');
      pdf.text(item.value, bx + boxW / 2, y + 7, { align: 'center' });

      // Label
      pdf.setTextColor(100, 116, 139);
      pdf.setFontSize(6.5);
      pdf.setFont('helvetica', 'normal');
      pdf.text(item.label, bx + boxW / 2, y + 11.5, { align: 'center' });
    });
    y += 20;
  }

  // ── EN-TÊTE DU TABLEAU ─────────────────────────────────────────────
  const ROW_H = 7;
  const colWidths = columns.map(c => (c.width ?? 1 / columns.length) * contentW);

  // Fond header
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(marginL, y, contentW, ROW_H, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(7.5);
  pdf.setFont('helvetica', 'bold');

  let cx = marginL;
  columns.forEach((col, i) => {
    const align = col.align ?? 'left';
    const tx = align === 'right' ? cx + colWidths[i] - 2
             : align === 'center' ? cx + colWidths[i] / 2
             : cx + 2;
    pdf.text(col.header, tx, y + 5, { align: align === 'left' ? 'left' : align });
    cx += colWidths[i];
  });
  y += ROW_H;

  // ── LIGNES DU TABLEAU ──────────────────────────────────────────────
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');

  rows.forEach((row, rowIdx) => {
    // Saut de page si nécessaire
    if (y + ROW_H > pageH - 25) {
      pdf.addPage();
      y = 20;
    }

    // Alternance fond
    if (rowIdx % 2 === 0) {
      pdf.setFillColor(248, 250, 252);
      pdf.rect(marginL, y, contentW, ROW_H, 'F');
    }

    // Bordure basse légère
    pdf.setDrawColor(226, 232, 240);
    pdf.setLineWidth(0.2);
    pdf.line(marginL, y + ROW_H, marginL + contentW, y + ROW_H);

    // Cellules
    pdf.setTextColor(30, 41, 59);
    cx = marginL;
    columns.forEach((col, i) => {
      const raw = row[col.key] ?? '';
      const val = col.format ? col.format(raw) : String(raw);
      const align = col.align ?? 'left';
      const tx = align === 'right' ? cx + colWidths[i] - 2
               : align === 'center' ? cx + colWidths[i] / 2
               : cx + 2;
      pdf.text(val, tx, y + 5, { align: align === 'left' ? 'left' : align });
      cx += colWidths[i];
    });

    y += ROW_H;
  });

  // ── FOOTER ─────────────────────────────────────────────────────────
  const footerY = pageH - 12;
  pdf.setFillColor(248, 250, 252);
  pdf.rect(0, footerY - 3, pageW, 15, 'F');

  pdf.setDrawColor(226, 232, 240);
  pdf.setLineWidth(0.3);
  pdf.line(0, footerY - 3, pageW, footerY - 3);

  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'normal');
  pdf.text('BS ALVÉOLES SUARL · Document confidentiel à usage interne uniquement', marginL, footerY + 2);
  pdf.text(
    `${footer ?? title} · Page ${pdf.getCurrentPageInfo().pageNumber}`,
    pageW - marginR,
    footerY + 2,
    { align: 'right' }
  );

  // ── SAUVEGARDE ─────────────────────────────────────────────────────
  const filename = `BS_Alveoles_${module.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0, 10)}.pdf`;
  pdf.save(filename);
}

// ── Export rapide pour les modules ───────────────────────────────────

export function exportDashboardPdf(themeHex: string) {
  generatePdfReport({
    title: 'Tableau de Bord Exécutif',
    subtitle: `Rapport de pilotage · ${new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}`,
    module: 'Dashboard',

    themeHex,
    columns: [
      { header: 'KPI', key: 'kpi', width: 0.4 },
      { header: 'Valeur', key: 'value', width: 0.25, align: 'right' },
      { header: 'Objectif', key: 'target', width: 0.2, align: 'right' },
      { header: 'Statut', key: 'status', width: 0.15, align: 'center' },
    ],
    rows: [
      { kpi: 'Production du jour (alvéoles)', value: '46 000', target: '50 000', status: '92%' },
      { kpi: 'TRS / OEE Moyen (%)', value: '87.3%', target: '>80%', status: '✓' },
      { kpi: 'Chiffre d\'Affaires (FCFA)', value: '2 640 000', target: '2 500 000', status: '✓' },
      { kpi: 'Autonomie Matière (jours)', value: '~15 jours', target: '>10 jours', status: '✓' },
      { kpi: 'Fardeaux emballés', value: '460', target: '500', status: '92%' },
    ],
    summary: [
      { label: 'Production', value: '46 000 alv.' },
      { label: 'TRS', value: '87.3%' },
      { label: 'CA FCFA', value: '2 640 000' },
      { label: 'Stocks', value: '~15j' },
    ],
    footer: 'Rapport Exécutif',
  });
}

export function exportProductionPdf(themeHex: string, data?: any[]) {
  const rows = data ?? [
    { shift: 'Matin (06h-14h)', machine: 'M1 + M2', prod: '12 500', trs: '89%', defects: '1.2%', status: 'Conforme' },
    { shift: 'Après-midi (14h-22h)', machine: 'M1 + M2 + M3', prod: '18 000', trs: '86%', defects: '1.5%', status: 'Conforme' },
    { shift: 'Nuit (22h-06h)', machine: 'M1', prod: '8 500', trs: '79%', defects: '2.1%', status: 'À surveiller' },
  ];
  generatePdfReport({
    title: 'Rapport de Productivité & Indicateurs TRS',
    subtitle: 'Suivi des shifts de production et rendement des machines',
    module: 'Production',
    themeHex,
    columns: [
      { header: 'Équipe / Shift', key: 'shift', width: 0.28 },
      { header: 'Machines', key: 'machine', width: 0.18 },
      { header: 'Production', key: 'prod', width: 0.15, align: 'right' },
      { header: 'TRS', key: 'trs', width: 0.12, align: 'center' },
      { header: 'Défauts', key: 'defects', width: 0.12, align: 'center' },
      { header: 'Statut', key: 'status', width: 0.15, align: 'center' },
    ],
    rows,
    summary: [
      { label: 'Total prod.', value: '46 000 alv.' },
      { label: 'TRS moy.', value: '87.3%' },
      { label: 'Défauts', value: '1.6%' },
    ],
    footer: 'Rapport Production',
  });
}

export function exportStockPdf(themeHex: string, data?: any[]) {
  const rows = data ?? [
    { article: 'Balle OCC (carton brut)', unit: 'Tonne', qty: '48.7', seuil: '20', statut: 'OK' },
    { article: 'Amidon industriel', unit: 'Kg', qty: '850', seuil: '200', statut: 'OK' },
    { article: 'Biocide désinfectant', unit: 'L', qty: '45', seuil: '20', statut: 'OK' },
    { article: 'Alvéoles 30 œufs (PF)', unit: 'Fardeaux', qty: '380', seuil: '100', statut: 'OK' },
    { article: 'Boîtes 6 œufs', unit: 'Unités', qty: '8 500', seuil: '2 000', statut: 'OK' },
    { article: 'Ficelle d\'emballage', unit: 'Kg', qty: '12', seuil: '10', statut: '⚠ Bas' },
  ];
  generatePdfReport({
    title: 'État des Stocks & Inventaire',
    subtitle: 'Matières premières, consommables et produits finis',
    module: 'Stocks',
    themeHex,
    columns: [
      { header: 'Article / Désignation', key: 'article', width: 0.38 },
      { header: 'Unité', key: 'unit', width: 0.12 },
      { header: 'Quantité', key: 'qty', width: 0.18, align: 'right' },
      { header: 'Seuil Alerte', key: 'seuil', width: 0.18, align: 'right' },
      { header: 'Statut', key: 'statut', width: 0.14, align: 'center' },
    ],
    rows,
    summary: [
      { label: 'Articles', value: '6 références' },
      { label: 'OCC dispo', value: '48.7 T' },
      { label: 'Alertes', value: '1 article' },
    ],
    footer: 'Rapport Stocks',
  });
}

export function exportCommercialPdf(themeHex: string, data?: any[]) {
  const rows = data ?? [
    { client: 'SEDIMA SA', produit: 'Alvéoles 30 œufs', qte: '20 000', pu: '40', total: '800 000', statut: 'Livré' },
    { client: 'Poulina Group', produit: 'Boîtes 6 œufs', qte: '15 000', pu: '25', total: '375 000', statut: 'En cours' },
    { client: 'SOSEDIS', produit: 'Alvéoles 30 œufs', qte: '30 000', pu: '38', total: '1 140 000', statut: 'Livré' },
    { client: 'Marché local (revendeurs)', produit: 'Boîtes 10/12 œufs', qte: '8 000', pu: '30', total: '240 000', statut: 'Livré' },
  ];
  generatePdfReport({
    title: 'Rapport Commercial & Facturation',
    subtitle: 'Commandes clients, chiffre d\'affaires et statut des livraisons',
    module: 'Commercial',
    themeHex,
    columns: [
      { header: 'Client', key: 'client', width: 0.22 },
      { header: 'Produit', key: 'produit', width: 0.25 },
      { header: 'Qté', key: 'qte', width: 0.12, align: 'right' },
      { header: 'P.U. (FCFA)', key: 'pu', width: 0.14, align: 'right' },
      { header: 'Total (FCFA)', key: 'total', width: 0.14, align: 'right' },
      { header: 'Statut', key: 'statut', width: 0.13, align: 'center' },
    ],
    rows,
    summary: [
      { label: 'Commandes', value: '4 ordres' },
      { label: 'CA Total', value: '2 555 000 F' },
      { label: 'Livrés', value: '75%' },
    ],
    footer: 'Rapport Commercial',
  });
}

export function exportInventairePdf(themeHex: string, sessionTitle?: string, data?: any[]) {
  const rows = data ?? [
    { article: 'Balles Cartons OCC', unite: 'Kg', theo: '48 700', reel: '48 700', ecart: '0', ecartVal: '0 FCFA', statut: 'Conforme' },
    { article: 'Amidon Liant Fécule', unite: 'Kg', theo: '850', reel: '850', ecart: '0', ecartVal: '0 FCFA', statut: 'Conforme' },
    { article: 'Plateaux 30 Œufs', unite: 'Fardeaux', theo: '425', reel: '420', ecart: '-5', ecartVal: '-22 500 FCFA', statut: 'Déficit' },
    { article: 'Plateaux 30 Renforcés', unite: 'Fardeaux', theo: '210', reel: '210', ecart: '0', ecartVal: '0 FCFA', statut: 'Conforme' },
    { article: 'Boîtes 6 Œufs', unite: 'Fardeaux', theo: '150', reel: '150', ecart: '0', ecartVal: '0 FCFA', statut: 'Conforme' },
    { article: 'Ficelle Cerclage', unite: 'Rouleau', theo: '38', reel: '38', ecart: '0', ecartVal: '0 FCFA', statut: 'Conforme' },
  ];
  generatePdfReport({
    title: 'Procès-Verbal d\'Inventaire Physique & Réconciliation',
    subtitle: sessionTitle || `Session d'Inventaire Usine · ${new Date().toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' })}`,
    module: 'Inventaires',

    themeHex,
    columns: [
      { header: 'Article / Référence', key: 'article', width: 0.30 },
      { header: 'Unité', key: 'unite', width: 0.10 },
      { header: 'Théorique', key: 'theo', width: 0.14, align: 'right' },
      { header: 'Physique', key: 'reel', width: 0.14, align: 'right' },
      { header: 'Écart Qté', key: 'ecart', width: 0.12, align: 'center' },
      { header: 'Écart Val.', key: 'ecartVal', width: 0.20, align: 'right' },
    ],
    rows,
    summary: [
      { label: 'Références', value: `${rows.length} articles` },
      { label: 'Conformes', value: `${rows.filter(r => r.statut === 'Conforme').length} / ${rows.length}` },
      { label: 'Taux Conf.', value: `${Math.round((rows.filter(r => r.statut === 'Conforme').length / rows.length) * 100)}%` },
      { label: 'Statut', value: 'Clôturé & Validé' },
    ],
    footer: 'Rapport d\'Inventaire Certifié Conforme',
  });
}

/**
 * Générateur officiel de Facture & Bon de Livraison (PDF A4)
 * Conforme à la section 7.6 du Cahier des Charges
 */
export async function exportInvoicePdf(invoice: Invoice, themeHex: string = '#1E3A5F'): Promise<void> {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;

  const [pr, pg, pb] = hexToRgb(themeHex);

  // ── Charger le logo en base64 ─────────────────────────────────────
  let logoDataUrl: string | null = null;
  try {
    const resp = await fetch('/logo-bs-alveoles.png');
    if (resp.ok) {
      const blob = await resp.blob();
      logoDataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });
    }
  } catch (_) { /* logo non dispo, fallback texte */ }

  // ── 1. BANDEAU SUPÉRIEUR avec logo ───────────────────────────────
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(0, 0, pageW, 36, 'F');
  // Bande dorée fine en bas du bandeau
  pdf.setFillColor(196, 155, 102);
  pdf.rect(0, 34, pageW, 2, 'F');

  if (logoDataUrl) {
    // Logo réel à gauche
    try { pdf.addImage(logoDataUrl, 'PNG', marginL, 3, 28, 28); } catch (_) {}
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(13);
    pdf.text('BS ALVÉOLES SUARL', marginL + 31, 12);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('Fabrication d\'Alvéoles en Pâte Moulée 100% Recyclée', marginL + 31, 19);
    pdf.text('Dakar & Thiès, Sénégal  •  +221 76 622 59 79 / +221 77 792 40 65', marginL + 31, 25);
  } else {
    pdf.setTextColor(255, 255, 255);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(15);
    pdf.text('BS ALVÉOLES SUARL', marginL, 13);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(7.5);
    pdf.text('Fabrication d\'Alvéoles en Pâte Moulée 100% Recyclée', marginL, 20);
    pdf.text('Dakar & Thiès, Sénégal  •  +221 76 622 59 79 / +221 77 792 40 65', marginL, 26);
  }

  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(13);
  pdf.text('FACTURE COMMERCIALE', pageW - marginR, 12, { align: 'right' });
  pdf.setFontSize(8.5);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`N° ${invoice.numero}`, pageW - marginR, 19, { align: 'right' });
  if (invoice.numeroBL) {
    pdf.text(`BL associé : ${invoice.numeroBL}`, pageW - marginR, 25, { align: 'right' });
  }
  pdf.setFontSize(6.5);
  pdf.setTextColor(253, 230, 138);
  pdf.text('⚠ Vente par paquet de 100 alvéoles — 3 500 FCFA/paquet', pageW - marginR, 31, { align: 'right' });

  // ── 2. BLOCS INFOS CLIENT & FACTURE ──────────────────────────────
  let y = 38;

  // Cadre gauche : Client
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(marginL, y, (contentW / 2) - 4, 34, 3, 3, 'FD');

  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('FACTURÉ À :', marginL + 5, y + 6);

  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(11);
  pdf.text(invoice.clientNom, marginL + 5, y + 13);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Région : ${invoice.clientRegion}, Sénégal`, marginL + 5, y + 19);
  if (invoice.chauffeurNom) {
    pdf.text(`Livraison par : ${invoice.chauffeurNom} (${invoice.camionImmatriculation || 'Camion usine'})`, marginL + 5, y + 25);
  }
  if (invoice.notesLivraison) {
    pdf.text(`Note : ${invoice.notesLivraison.slice(0, 45)}`, marginL + 5, y + 30);
  }

  // Cadre droit : Détails Facture
  const rightX = marginL + (contentW / 2) + 4;
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(rightX, y, (contentW / 2) - 4, 34, 3, 3, 'FD');

  pdf.setTextColor(100, 116, 139);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.text('DÉTAILS DU RÈGLEMENT :', rightX + 5, y + 6);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Date d'émission : ${invoice.date}`, rightX + 5, y + 13);
  pdf.text(`Date d'échéance : ${invoice.dateEcheance || invoice.date}`, rightX + 5, y + 19);
  pdf.text(`Mode de paiement : ${invoice.modePaiementPrefere}`, rightX + 5, y + 25);
  
  pdf.setFont('helvetica', 'bold');
  const statutCouleur = invoice.statutPaiement === 'PAYE' ? [16, 185, 129] : invoice.statutPaiement === 'ACOMPTE' ? [245, 158, 11] : [239, 68, 68];
  pdf.setTextColor(statutCouleur[0], statutCouleur[1], statutCouleur[2]);
  pdf.text(`Statut : ${invoice.statutPaiement} • Commande ${invoice.statutCommande}`, rightX + 5, y + 30);

  // ── 3. TABLEAU DES ARTICLES COMMANDÉS ─────────────────────────────
  y = 78;

  // En-tête tableau
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(marginL, y, contentW, 8, 'F');
  pdf.setTextColor(255, 255, 255);
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);

  pdf.text('DÉSIGNATION DU PRODUIT', marginL + 4, y + 5.5);
  pdf.text('QUANTITÉ (PAQUETS DE 100)', marginL + 115, y + 5.5, { align: 'right' });
  pdf.text('PRIX / PAQUET', marginL + 145, y + 5.5, { align: 'right' });
  pdf.text('MONTANT TOTAL (FCFA)', pageW - marginR - 4, y + 5.5, { align: 'right' });

  y += 8;

  // Lignes articles
  invoice.articles.forEach((art, index) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      pdf.setFillColor(255, 255, 255);
    } else {
      pdf.setFillColor(248, 250, 252);
    }
    pdf.rect(marginL, y, contentW, 8, 'F');
    pdf.setDrawColor(241, 245, 249);
    pdf.line(marginL, y + 8, pageW - marginR, y + 8);

    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(15, 23, 42);
    pdf.text(art.designation || `Plateau ${art.format}`, marginL + 4, y + 5.5);

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(79, 70, 229);
    pdf.text(`${art.fardeaux} paquet${art.fardeaux > 1 ? 's' : ''}`, marginL + 115, y + 5.5, { align: 'right' });

    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(51, 65, 85);
    pdf.text('3 500 FCFA', marginL + 145, y + 5.5, { align: 'right' });

    pdf.setFont('helvetica', 'bold');
    pdf.setTextColor(15, 23, 42);
    pdf.text(`${art.totalLigneFCFA.toLocaleString('fr-FR')} FCFA`, pageW - marginR - 4, y + 5.5, { align: 'right' });

    y += 8;
  });

  // ── 4. TOTAUX & SOLDE FINANCIER ───────────────────────────────────
  y += 6;
  const totauxBoxW = 75;
  const totauxBoxX = pageW - marginR - totauxBoxW;

  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(totauxBoxX, y, totauxBoxW, 36, 3, 3, 'FD');

  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.setFont('helvetica', 'normal');

  pdf.text('Total Brut HT :', totauxBoxX + 5, y + 7);
  pdf.text(`${invoice.totalHT.toLocaleString('fr-FR')} FCFA`, pageW - marginR - 5, y + 7, { align: 'right' });

  pdf.text('TVA (Exonération agri/0%) :', totauxBoxX + 5, y + 13);
  pdf.text('0 FCFA', pageW - marginR - 5, y + 13, { align: 'right' });

  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('Total Net TTC :', totauxBoxX + 5, y + 20);
  pdf.text(`${invoice.totalTTC.toLocaleString('fr-FR')} FCFA`, pageW - marginR - 5, y + 20, { align: 'right' });

  pdf.setTextColor(16, 185, 129);
  pdf.text('Acompte encaissé :', totauxBoxX + 5, y + 26);
  pdf.text(`${invoice.acompteVerse.toLocaleString('fr-FR')} FCFA`, pageW - marginR - 5, y + 26, { align: 'right' });

  pdf.setDrawColor(pr, pg, pb);
  pdf.line(totauxBoxX + 5, y + 28, pageW - marginR - 5, y + 28);

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(invoice.soldeRestant > 0 ? 220 : 16, invoice.soldeRestant > 0 ? 38 : 185, invoice.soldeRestant > 0 ? 38 : 129);
  pdf.text('Solde restant dû :', totauxBoxX + 5, y + 33);
  pdf.text(`${invoice.soldeRestant.toLocaleString('fr-FR')} FCFA`, pageW - marginR - 5, y + 33, { align: 'right' });

  // ── 5. MENTIONS BANCAIRES & PAIEMENTS MOBILES ────────────────────
  const mentW = (contentW - totauxBoxW) - 8;
  pdf.setFillColor(241, 245, 249);
  pdf.roundedRect(marginL, y, mentW, 36, 3, 3, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('MODALITÉS DE RÈGLEMENT OFFICIELLES :', marginL + 5, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(71, 85, 105);
  pdf.text('• Wave Business Sénégal : +221 76 622 59 79 (BS Alvéoles SUARL)', marginL + 5, y + 14);
  pdf.text('• Orange Money Pro : +221 77 792 40 65 (BS Alvéoles)', marginL + 5, y + 20);
  pdf.text('• Virement Bancaire : CBAO Groupe Attijariwafa Bank (RIB sur demande)', marginL + 5, y + 26);
  pdf.text('• Unité commerciale légale : Lot standard de 100 plateaux ou boîtes.', marginL + 5, y + 32);

  // ── 6. SIGNATURES & VISAS ─────────────────────────────────────────
  y += 44;
  const sigBoxW = (contentW / 2) - 6;

  pdf.setDrawColor(203, 213, 225);
  pdf.rect(marginL, y, sigBoxW, 25, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('POUR L\'USINE — BS ALVÉOLES SUARL', marginL + 5, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Signature & Cachet de la Direction', marginL + 5, y + 11);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(pr, pg, pb);
  pdf.text('DIRECTION GÉNÉRALE DAKAR', marginL + 5, y + 21);

  pdf.rect(rightX, y, sigBoxW, 25, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);
  pdf.text('VISA DU CLIENT OU DU TRANSPORTEUR', rightX + 5, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('Mention manuscrite « Bon pour réception conforme »', rightX + 5, y + 11);

  // ── 7. PIED DE PAGE ───────────────────────────────────────────────
  pdf.setFontSize(7);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(148, 163, 184);
  pdf.text(
    'BS DISTRIBUTION SUARL (BS Alvéoles) — RC : SN-DKR-2026 • NINEA en cours • Logiciel certifié conforme CDC v1.0',
    pageW / 2,
    pageH - 8,
    { align: 'center' }
  );

  // Télécharger le PDF
  const cleanNomClient = invoice.clientNom.replace(/[^a-zA-Z0-9]/g, '_');
  pdf.save(`FACTURE_${invoice.numero}_${cleanNomClient}.pdf`);
}

// ── Export Bon de Réception Matière Première (Section 1.1) ───────────
export function exportReceptionPdf(rec: any, themeHex: string = '#059669'): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const [pr, pg, pb] = hexToRgb(themeHex);
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 14;
  const contentW = pageW - marginL * 2;

  // En-tête
  pdf.setFillColor(15, 23, 42);
  pdf.rect(0, 0, pageW, 26, 'F');
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(0, 24, pageW, 2, 'F');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(14);
  pdf.setTextColor(255, 255, 255);
  pdf.text('BS ALVÉOLES SUARL', marginL, 12);
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(203, 213, 225);
  pdf.text('Unité Industrielle de Pâte Moulée • Zone Industrielle Dakar / Mbao', marginL, 18);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(10);
  pdf.setTextColor(pr, pg, pb);
  pdf.text('BON DE RÉCEPTION SUR QUAI', pageW - marginL, 12, { align: 'right' });
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text(`N° ${rec.numeroBon || 'REC-2026-001'}`, pageW - marginL, 18, { align: 'right' });

  // Informations générales
  let y = 35;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. INFORMATIONS D\'APPROVISIONNEMENT', marginL, y);

  y += 5;
  pdf.setFillColor(248, 250, 252);
  pdf.setDrawColor(226, 232, 240);
  pdf.roundedRect(marginL, y, contentW, 36, 3, 3, 'FD');

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(71, 85, 105);
  pdf.text(`Date & Heure : ${rec.date} à ${rec.heure || '10:00'}`, marginL + 5, y + 7);
  pdf.text(`Mode : ${rec.modeApprovisionnement === 'FOURNISSEUR_LIVRAISON' ? 'Livraison Fournisseur' : 'Collecte Usine'}`, marginL + 5, y + 14);
  pdf.text(`Fournisseur / Source : ${rec.fournisseurNom}`, marginL + 5, y + 21);
  pdf.text(`N° Facture Fournisseur : ${rec.numeroFactureFournisseur || 'N/A'}`, marginL + 5, y + 28);

  const col2X = marginL + contentW / 2;
  pdf.text(`Transporteur : ${rec.transporteur || 'Non précisé'}`, col2X, y + 7);
  pdf.text(`Chauffeur : ${rec.chauffeurNom || 'N/A'} (${rec.chauffeurTel || ''})`, col2X, y + 14);
  pdf.text(`Immatriculation Véhicule : ${rec.vehiculeImmatriculation || 'DK-N/A'}`, col2X, y + 21);
  pdf.text(`N° Bon de Pesée : ${rec.numeroBonPesee || 'N/A'}`, col2X, y + 28);

  // Caractéristiques Matière
  y += 44;
  pdf.setFontSize(10);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. CARACTÉRISTIQUES & PESÉE MATIÈRE PREMIÈRE', marginL, y);

  y += 5;
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(marginL, y, contentW, 7, 'F');
  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(255, 255, 255);
  pdf.text('Désignation Matière', marginL + 4, y + 5);
  pdf.text('Qté Déclarée', marginL + 70, y + 5);
  pdf.text('Qté Pesée (Brute)', marginL + 105, y + 5);
  pdf.text('Prix Unit.', marginL + 140, y + 5);
  pdf.text('Montant Total', pageW - marginL - 4, y + 5, { align: 'right' });

  y += 7;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(marginL, y, contentW, 12, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text(rec.mpNom || rec.typePapierCarton || 'Balles Cartons Recyclés', marginL + 4, y + 7);
  pdf.setFont('helvetica', 'normal');
  pdf.text(`${(rec.quantiteDeclareeKg || rec.quantiteBruteReceptionneeKg).toLocaleString()} kg`, marginL + 70, y + 7);
  pdf.setFont('helvetica', 'bold');
  pdf.setTextColor(pr, pg, pb);
  pdf.text(`${rec.quantiteBruteReceptionneeKg.toLocaleString()} kg`, marginL + 105, y + 7);
  pdf.setTextColor(15, 23, 42);
  pdf.text(`${rec.prixUnitaireKg || 250} F/kg`, marginL + 140, y + 7);
  pdf.text(`${(rec.coutTotalBrutFCFA || (rec.quantiteBruteReceptionneeKg * (rec.prixUnitaireKg || 250))).toLocaleString()} FCFA`, pageW - marginL - 4, y + 7, { align: 'right' });

  // Règle du tri
  y += 18;
  pdf.setFillColor(254, 243, 199);
  pdf.setDrawColor(251, 191, 36);
  pdf.roundedRect(marginL, y, contentW, 16, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(146, 64, 14);
  pdf.text('⚠️ CLAUSE DE RÉSERVE & STATUT DU TRI (CDC Section 6.2 & 6.3) :', marginL + 4, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.text('Cette marchandise est acceptée sous réserve du tri qualité usine. Seule la matière jugée exploitable', marginL + 4, y + 10);
  pdf.text('après retrait des plastiques et impuretés sera définitivement admise au pulpeur et valorisée.', marginL + 4, y + 14);

  // Signatures
  y += 24;
  const boxW = contentW / 2 - 4;
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginL, y, boxW, 30, 2, 2, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('LE TRANSPORTEUR / LIVREUR', marginL + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Nom : ${rec.chauffeurNom || 'Chauffeur'}`, marginL + 4, y + 12);
  pdf.text('Signature & mention « Lu et approuvé »', marginL + 4, y + 25);

  const rightB = marginL + boxW + 8;
  pdf.roundedRect(rightB, y, boxW, 30, 2, 2, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('RÉCEPTIONNAIRE USINE BS ALVÉOLES', rightB + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Agent : ${rec.utilisateurReception || rec.magasinierReception || 'Modou Faye'}`, rightB + 4, y + 12);
  pdf.text('Cachet du quai & signature magasin', rightB + 4, y + 25);

  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('BS DISTRIBUTION SUARL — Document interne scellé et auditable • Logiciel ERP/MES v1.0', pageW / 2, pageH - 8, { align: 'center' });

  pdf.save(`BON_RECEPTION_${rec.numeroBon || 'REC'}.pdf`);
}

/**
 * Exporte un Bon de Sortie de Matière / Intrant pour la Production
 * Conforme au schéma officiel : Demande d'expression de besoin du Responsable Prod + Validation Assistant + Attestation réception
 */
export function exportBonSortieProductionPdf(sortie: {
  numeroDemande: string;
  date: string;
  heure?: string;
  mpNom: string;
  quantite: number;
  unite?: string;
  shift?: string;
  ligneProduction?: string;
  demandeurNom: string;
  demandeurPoste?: string;
  motifBesoins?: string;
  autorisePar?: string;
  dateAutorisation?: string;
  statut?: string;
}, themeHex = '#dc2626'): void {
  const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const pageW = pdf.internal.pageSize.getWidth();
  const pageH = pdf.internal.pageSize.getHeight();
  const marginL = 15;
  const marginR = 15;
  const contentW = pageW - marginL - marginR;

  const [pr, pg, pb] = hexToRgb(themeHex);

  // HEADER BANDEAU
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(0, 0, pageW, 28, 'F');

  pdf.setTextColor(255, 255, 255);
  pdf.setFontSize(14);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BS ALVÉOLES SUARL', marginL, 11);

  pdf.setFontSize(8);
  pdf.setFont('helvetica', 'normal');
  pdf.text('Unité Industrielle de Fabrication d\'Alvéoles · Dakar, Sénégal', marginL, 17);
  pdf.text('GESTION DES STOCKS — APPROVISIONNEMENT PRODUCTION', marginL, 22);

  pdf.setFontSize(8);
  pdf.text(`Émis le ${sortie.date} ${sortie.heure || ''}`, pageW - marginR, 22, { align: 'right' });

  // TITRE DU BON
  let y = 38;
  pdf.setTextColor(15, 23, 42);
  pdf.setFontSize(15);
  pdf.setFont('helvetica', 'bold');
  pdf.text('BON DE SORTIE DE STOCK POUR LA PRODUCTION', marginL, y);
  y += 6;

  pdf.setFontSize(9);
  pdf.setFont('helvetica', 'normal');
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Réf. Bon de Sortie : ${sortie.numeroDemande} • Conforme au circuit officiel d'approvisionnement`, marginL, y);

  y += 8;

  // CADRE EN-TÊTE DEMANDE & VALIDATION
  pdf.setDrawColor(226, 232, 240);
  pdf.setFillColor(248, 250, 252);
  pdf.roundedRect(marginL, y, contentW, 36, 3, 3, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. EXPRESSION DE BESOIN (PRODUCTION)', marginL + 5, y + 7);
  pdf.text('2. VALIDATION MAGASINIER / ASSISTANT', marginL + contentW / 2 + 5, y + 7);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.setTextColor(71, 85, 105);

  // Colonne gauche : Demandeur Production
  pdf.text(`Demandeur : ${sortie.demandeurNom}`, marginL + 5, y + 14);
  pdf.text(`Poste : ${sortie.demandeurPoste || 'Responsable de Production'}`, marginL + 5, y + 20);
  pdf.text(`Shift / Quart : ${sortie.shift || 'Matin (06h - 14h)'}`, marginL + 5, y + 26);
  pdf.text(`Destination : ${sortie.ligneProduction || 'Ligne Moulage Shuliy'}`, marginL + 5, y + 32);

  // Colonne droite : Validateur Assistant
  pdf.text(`Assistant Magasin : ${sortie.autorisePar || 'Assistant de Gestion des Stocks'}`, marginL + contentW / 2 + 5, y + 14);
  pdf.text(`Date Validation : ${sortie.dateAutorisation || sortie.date}`, marginL + contentW / 2 + 5, y + 20);
  pdf.text(`Statut : SORTIE VALIDÉE & DÉSTOCKÉE`, marginL + contentW / 2 + 5, y + 26);
  pdf.text(`Enregistrement Stock : EFFECTUÉ DANS L'ERP`, marginL + contentW / 2 + 5, y + 32);

  y += 44;

  // TABLEAU DE LA MATIÈRE SORTIE
  pdf.setFillColor(pr, pg, pb);
  pdf.rect(marginL, y, contentW, 8, 'F');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(255, 255, 255);
  pdf.text('Désignation de la Matière / Additif', marginL + 5, y + 5.5);
  pdf.text('Ligne / Cuve', marginL + 85, y + 5.5);
  pdf.text('Unité', marginL + 125, y + 5.5);
  pdf.text('Quantité Déstockée', pageW - marginR - 5, y + 5.5, { align: 'right' });

  y += 8;
  pdf.setFillColor(255, 255, 255);
  pdf.setDrawColor(226, 232, 240);
  pdf.rect(marginL, y, contentW, 14, 'FD');

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(9);
  pdf.setTextColor(15, 23, 42);
  pdf.text(sortie.mpNom, marginL + 5, y + 8);

  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(8);
  pdf.text(sortie.ligneProduction || 'Ligne Shuliy (Pulpeur)', marginL + 85, y + 8);
  pdf.text(sortie.unite || 'Kg', marginL + 125, y + 8);

  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(11);
  pdf.setTextColor(pr, pg, pb);
  pdf.text(`${sortie.quantite.toLocaleString()} ${sortie.unite || 'Kg'}`, pageW - marginR - 5, y + 8.5, { align: 'right' });

  y += 20;

  // MOTIF D'UTILISATION
  if (sortie.motifBesoins) {
    pdf.setFillColor(241, 245, 249);
    pdf.roundedRect(marginL, y, contentW, 14, 2, 2, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(8);
    pdf.setTextColor(71, 85, 105);
    pdf.text('Motif de l\'expression de besoin :', marginL + 4, y + 5);
    pdf.setFont('helvetica', 'normal');
    pdf.setTextColor(30, 41, 59);
    pdf.text(sortie.motifBesoins, marginL + 4, y + 10);
    y += 20;
  }

  // CLAUSE RÉGLEMENTAIRE DU SCHÉMA
  pdf.setFillColor(254, 242, 242);
  pdf.setDrawColor(254, 202, 202);
  pdf.roundedRect(marginL, y, contentW, 16, 2, 2, 'FD');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(153, 27, 27);
  pdf.text('DIRECTIVE INDUSTRIELLE (SCHÉMA DIRECTEUR D\'APPROVISIONNEMENT) :', marginL + 4, y + 5);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7.5);
  pdf.setTextColor(185, 28, 28);
  pdf.text('« Toute sortie de matière première doit faire l\'objet d\'une demande d\'expression de besoin du responsable', marginL + 4, y + 10);
  pdf.text('de production adressée à l\'assistant pour validation. Le bon de sortie atteste la réception physique. »', marginL + 4, y + 14);

  y += 22;

  // CADRES DE SIGNATURES DU SCHÉMA
  const boxW = contentW / 2 - 4;

  // Cadre 1 : Assistant Magasinier (Validation & Déstockage)
  pdf.setDrawColor(203, 213, 225);
  pdf.roundedRect(marginL, y, boxW, 36, 2, 2, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('1. VISA DE L\'ASSISTANT (VALIDATION)', marginL + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Assistant : ${sortie.autorisePar || 'Modou Faye'}`, marginL + 4, y + 12);
  pdf.text('Mention : « Sortie de stock autorisée & enregistrée »', marginL + 4, y + 17);
  pdf.text('Signature & Date :', marginL + 4, y + 30);

  // Cadre 2 : Responsable de Production (Attestation de réception)
  const rightB = marginL + boxW + 8;
  pdf.roundedRect(rightB, y, boxW, 36, 2, 2, 'D');
  pdf.setFont('helvetica', 'bold');
  pdf.setFontSize(8);
  pdf.setTextColor(15, 23, 42);
  pdf.text('2. ATTESTATION DE RÉCEPTION (RESPONSABLE PROD)', rightB + 4, y + 6);
  pdf.setFont('helvetica', 'normal');
  pdf.setFontSize(7);
  pdf.setTextColor(100, 116, 139);
  pdf.text(`Responsable Prod : ${sortie.demandeurNom}`, rightB + 4, y + 12);
  pdf.text('Mention : « Matières bien reçues sur la ligne de production »', rightB + 4, y + 17);
  pdf.text('Signature & Date :', rightB + 4, y + 30);

  pdf.setFontSize(7);
  pdf.setTextColor(148, 163, 184);
  pdf.text('BS DISTRIBUTION SUARL — Document interne officiel scellé et auditable • Logiciel ERP/MES v1.0', pageW / 2, pageH - 8, { align: 'center' });

  pdf.save(`BON_SORTIE_${sortie.numeroDemande || 'PROD'}.pdf`);
}
