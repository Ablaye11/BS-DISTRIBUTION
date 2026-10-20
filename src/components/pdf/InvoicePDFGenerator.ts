import jsPDF from 'jspdf';
import { Invoice } from '../../types';

export function generateInvoicePDF(invoice: Invoice, type: 'FACTURE' | 'BL' = 'FACTURE') {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  });

  // Color Palette
  const amberColor = '#f59e0b';
  const slateDark = '#0f172a';
  const slateGray = '#475569';

  // Header - Company Banner
  doc.setFillColor(15, 23, 42); // Slate 900
  doc.rect(0, 0, 210, 40, 'F');

  // Company Name & Subtitle
  doc.setTextColor(245, 158, 11); // Amber
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(20);
  doc.text("BS DISTRIBUTION D'ŒUFS SUARL", 14, 16);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(203, 213, 225); // Slate 300
  doc.text("Keur Massar Médinatoul Mounwara, Villa N° 96 — Sénégal", 14, 23);
  doc.text("Tél: +221 76 622 59 79 / +221 78 914 88 88 | E-mail: bsdistribution30@gmail.com", 14, 28);
  doc.text("Distribution & Vente d'Œufs sur tout le territoire sénégalais", 14, 33);

  // Document Title Badge (Right Side Header)
  doc.setFillColor(245, 158, 11);
  doc.rect(140, 10, 56, 20, 'F');
  doc.setTextColor(15, 23, 42);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(13);
  const docTitle = type === 'FACTURE' ? 'FACTURE' : 'BON DE LIVRAISON';
  doc.text(docTitle, 168, 18, { align: 'center' });
  doc.setFontSize(10);
  doc.text(type === 'FACTURE' ? invoice.numero : (invoice.numeroBL || 'BL-2602-0001'), 168, 25, { align: 'center' });

  // Divider Line
  doc.setDrawColor(245, 158, 11);
  doc.setLineWidth(1);
  doc.line(14, 42, 196, 42);

  // Invoice & Client Meta Details Block
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(10);
  
  // Left Box: Customer Info
  doc.setFillColor(248, 250, 252);
  doc.rect(14, 48, 90, 36, 'F');
  doc.setDrawColor(226, 232, 240);
  doc.rect(14, 48, 90, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text("CLIENT / DESTINATAIRE :", 18, 54);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(11);
  doc.text(invoice.clientNom, 18, 61);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9.5);
  doc.setTextColor(71, 85, 105);
  doc.text(`Commercial rattaché : ${invoice.commercialNom}`, 18, 67);
  doc.text(`Date d'émission : ${invoice.date}`, 18, 73);
  if (invoice.livreurNom) {
    doc.text(`Livreur responsable : ${invoice.livreurNom}`, 18, 79);
  }

  // Right Box: Payment & Status
  doc.setFillColor(248, 250, 252);
  doc.rect(110, 48, 86, 36, 'F');
  doc.rect(110, 48, 86, 36, 'S');

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text("RÈGLEMENT & STATUT :", 114, 54);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);
  doc.setFontSize(9.5);
  doc.text(`Mode de paiement : ${invoice.modePaiement}`, 114, 61);
  if (invoice.referencePaiement) {
    doc.text(`Réf. Transaction : ${invoice.referencePaiement}`, 114, 67);
  }
  doc.text(`Statut règlement : ${invoice.statutPaiement}`, 114, 73);
  doc.text(`Statut livraison : ${invoice.statutVente}`, 114, 79);

  // Table Header
  let startY = 92;
  doc.setFillColor(15, 23, 42);
  doc.rect(14, startY, 182, 8, 'F');
  
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9);
  doc.setTextColor(255, 255, 255);
  doc.text("DÉSIGNATION PRODUIT (SÉNÉGAL)", 18, startY + 5.5);
  doc.text("QUANTITÉ (ŒUFS)", 110, startY + 5.5, { align: 'center' });
  doc.text("PRIX UNITAIR. (FCFA)", 150, startY + 5.5, { align: 'right' });
  doc.text("TOTAL (FCFA)", 190, startY + 5.5, { align: 'right' });

  // Table Items
  let currentY = startY + 8;
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(15, 23, 42);

  invoice.items.forEach((item, index) => {
    // Alternating background row
    if (index % 2 === 0) {
      doc.setFillColor(248, 250, 252);
      doc.rect(14, currentY, 182, 9, 'F');
    }
    doc.setFontSize(9.5);
    doc.text(item.typeOeuf, 18, currentY + 6);
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.quantiteOeufs.toLocaleString('fr-FR')} œufs`, 110, currentY + 6, { align: 'center' });
    doc.setFont('helvetica', 'normal');
    doc.text(`${item.prixUnitaireOeuf.toLocaleString('fr-FR')} F`, 150, currentY + 6, { align: 'right' });
    doc.setFont('helvetica', 'bold');
    doc.text(`${item.totalFCFA.toLocaleString('fr-FR')} FCFA`, 190, currentY + 6, { align: 'right' });

    currentY += 9;
  });

  // Table Bottom Border
  doc.setDrawColor(203, 213, 225);
  doc.line(14, currentY + 2, 196, currentY + 2);

  // Totals Summary Box (Right Side)
  const summaryY = currentY + 8;
  doc.setFillColor(248, 250, 252);
  doc.rect(110, summaryY, 86, 32, 'F');
  doc.rect(110, summaryY, 86, 32, 'S');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text("Montant Total Facturé :", 114, summaryY + 8);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(15, 23, 42);
  doc.text(`${invoice.totalFCFA.toLocaleString('fr-FR')} FCFA`, 192, summaryY + 8, { align: 'right' });

  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);
  doc.text("Montant Encaissé / Acompte :", 114, summaryY + 16);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(16, 185, 129); // Emerald
  doc.text(`${invoice.acompteFCFA.toLocaleString('fr-FR')} FCFA`, 192, summaryY + 16, { align: 'right' });

  doc.setFont('helvetica', 'bold');
  doc.setTextColor(220, 38, 38); // Red
  doc.text("Solde Restant Dû (Crédit) :", 114, summaryY + 25);
  doc.setFontSize(11);
  doc.text(`${invoice.soldeDuFCFA.toLocaleString('fr-FR')} FCFA`, 192, summaryY + 25, { align: 'right' });

  // Stamp Box (Left Side)
  const stampY = summaryY;
  doc.setDrawColor(217, 119, 6);
  doc.setLineWidth(0.8);
  doc.rect(14, stampY, 90, 32, 'S');

  doc.setFontSize(8.5);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(217, 119, 6);
  doc.text("TAMPON OFFICIEL & CACHET DE VALIDATION", 18, stampY + 6);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(100, 116, 139);
  doc.text("BS DISTRIBUTION D'ŒUFS SUARL — Keur Massar", 18, stampY + 12);
  doc.text("Signataire : M. Ndiaye Saliou (Gérant)", 18, stampY + 16);
  doc.text(`Document horodaté le : ${new Date().toLocaleDateString('fr-FR')}`, 18, stampY + 20);

  // Simulated Digital Stamp Circle in PDF
  doc.setDrawColor(217, 119, 6);
  doc.circle(78, stampY + 16, 11, 'S');
  doc.setFontSize(6);
  doc.setTextColor(217, 119, 6);
  doc.text("BS DISTRIBUTION", 78, stampY + 14, { align: 'center' });
  doc.text("VALIDÉ", 78, stampY + 18, { align: 'center' });

  // Footer Terms & Conditions
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(100, 116, 139);
  doc.text("BS Distribution SUARL — Vente & Distribution d'œufs de qualité sur l'ensemble du territoire sénégalais.", 105, 280, { align: 'center' });
  doc.text("Document officiel généré automatiquement et certifié par BS Distribution.", 105, 284, { align: 'center' });

  // Save PDF File
  const filename = type === 'FACTURE' ? `${invoice.numero}.pdf` : `${invoice.numeroBL || 'BL'}.pdf`;
  doc.save(filename);
}
