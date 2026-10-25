const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Création du document PDF au format A4
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

// Dimensions A4 : 210 x 297 mm
const pageWidth = 210;

// Couleurs de la charte
const primaryDark = [15, 23, 42];    // Slate 900
const accentAmber = [245, 158, 11];  // Amber 500
const textDark    = [30, 41, 59];    // Slate 800
const textMuted   = [100, 116, 139]; // Slate 500
const bgLight     = [248, 250, 252]; // Slate 50

// 1. Bandeau supérieur décoratif
doc.setFillColor(...primaryDark);
doc.rect(0, 0, pageWidth, 28, 'F');

doc.setFillColor(...accentAmber);
doc.rect(0, 28, pageWidth, 2, 'F');

// Titre dans le bandeau
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(16);
doc.text('BS ALVÉOLES SÉNÉGAL', 15, 14);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(203, 213, 225);
doc.text("Unité Industrielle de Fabrication d'Alvéoles en Pâte Moulée Écologique", 15, 21);

// Badge DEVIS PROFORMA à droite
doc.setFillColor(...accentAmber);
doc.roundedRect(145, 8, 50, 12, 2, 2, 'F');
doc.setTextColor(...primaryDark);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('DEVIS PROFORMA', 170, 15.5, { align: 'center' });

// 2. Coordonnées de l'émetteur et du client
let y = 42;

// Bloc Émetteur (Gauche)
doc.setTextColor(...textMuted);
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.text('ÉMIS PAR :', 15, y);

doc.setTextColor(...primaryDark);
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.text('BS DISTRIBUTION SUARL', 15, y + 5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...textDark);
doc.text('Zone Industrielle Avicole — Dakar / Thiès', 15, y + 10);
doc.text('Tél : +221 76 622 59 79 / +221 77 100 00 01', 15, y + 14.5);
doc.text('Email : contact@bsalveoles.sn', 15, y + 19);
doc.text('NINEA : 009845212 — RC : SN.DKR.2024.B.18920', 15, y + 23.5);

// Bloc Client & Devis Infos (Droite)
doc.setFillColor(...bgLight);
doc.roundedRect(115, y - 4, 80, 32, 2, 2, 'F');
doc.setDrawColor(226, 232, 240);
doc.roundedRect(115, y - 4, 80, 32, 2, 2, 'D');

doc.setTextColor(...textMuted);
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.text('DESTINATAIRE :', 120, y + 1);

doc.setTextColor(...primaryDark);
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.text('Ferme Avicole & Couvoir Partenaire', 120, y + 6);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...textDark);
doc.text('Direction des Achats & Approvisionnements', 120, y + 11);
doc.text('Région de Thiès / Niayes — Sénégal', 120, y + 15.5);
doc.text('Contact : +221 77 000 00 00', 120, y + 20);

// 3. Métadonnées du Devis
y = 78;
doc.setFillColor(241, 245, 249);
doc.rect(15, y, 180, 10, 'F');
doc.setDrawColor(203, 213, 225);
doc.rect(15, y, 180, 10, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...textDark);
doc.text('N° DEVIS : DEV-2026-0650', 20, y + 6.5);
doc.text('DATE : 25/10/2026', 80, y + 6.5);
doc.text('VALIDITÉ : 30 Jours', 130, y + 6.5);
doc.text('PAIEMENT : Wave / Virement', 160, y + 6.5);

// 4. Tableau des articles
y = 96;

// En-tête du tableau
doc.setFillColor(...primaryDark);
doc.rect(15, y, 180, 8, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.text('RÉF.', 18, y + 5.5);
doc.text('DÉSIGNATION DU PRODUIT / SERVICE', 38, y + 5.5);
doc.text('CONDITIONNEMENT', 105, y + 5.5);
doc.text('QUANTITÉ', 140, y + 5.5, { align: 'right' });
doc.text('P.U. (FCFA)', 165, y + 5.5, { align: 'right' });
doc.text('TOTAL (FCFA)', 192, y + 5.5, { align: 'right' });

// Lignes d'articles
const items = [
  {
    ref: 'ALV-30-STD',
    desc: 'Plateaux 30 Œufs Standard (Pâte Moulée 100% Recyclée)',
    sub: 'Dimensions 295x295 mm, haute rigidité anti-choc pour ramassage et transport',
    cond: 'Fardeaux de 100 pcs',
    qty: '100 fard. (10 000 alv.)',
    pu: '4 500',
    total: '450 000'
  },
  {
    ref: 'BOX-06-STD',
    desc: 'Boîtes 6 Œufs Clipsables avec Couvercle de Protection',
    sub: 'Emballage consommateur pour distribution supermarchés et boutiques',
    cond: 'Fardeaux de 120 pcs',
    qty: '20 fard. (2 400 boîtes)',
    pu: '7 800',
    total: '156 000'
  },
  {
    ref: 'EXP-LIVR-01',
    desc: 'Forfait Livraison & Déchargement Sécurisé Camion Usine',
    sub: 'Transport palettisé et filmé avec chauffeur-livreur jusqu\'à la ferme',
    cond: 'Camion 10 Tonnes',
    qty: '1 expédition',
    pu: '44 000',
    total: '44 000'
  }
];

y += 8;
items.forEach((it, idx) => {
  const rowHeight = 16;
  
  if (idx % 2 === 1) {
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, rowHeight, 'F');
  }
  
  doc.setDrawColor(226, 232, 240);
  doc.line(15, y + rowHeight, 195, y + rowHeight);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...primaryDark);
  doc.text(it.ref, 18, y + 6);

  doc.text(it.desc, 38, y + 6);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7);
  doc.setTextColor(...textMuted);
  doc.text(it.sub, 38, y + 11);

  doc.setFontSize(8);
  doc.setTextColor(...textDark);
  doc.text(it.cond, 105, y + 6);

  doc.setFont('helvetica', 'bold');
  doc.text(it.qty, 140, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(it.pu, 165, y + 6, { align: 'right' });
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...primaryDark);
  doc.text(it.total, 192, y + 6, { align: 'right' });

  y += rowHeight;
});

// 5. Bloc des Totaux
y += 6;

// Récapitulatif à droite
const totauxX = 125;
const totauxWidth = 70;

doc.setFillColor(248, 250, 252);
doc.roundedRect(totauxX, y, totauxWidth, 34, 2, 2, 'F');
doc.setDrawColor(203, 213, 225);
doc.roundedRect(totauxX, y, totauxWidth, 34, 2, 2, 'D');

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(...textDark);
doc.text('Total Fournitures HT :', totauxX + 4, y + 7);
doc.text('606 000 FCFA', totauxX + totauxWidth - 4, y + 7, { align: 'right' });

doc.text('Frais de Transport / Logistique :', totauxX + 4, y + 13);
doc.text('44 000 FCFA', totauxX + totauxWidth - 4, y + 13, { align: 'right' });

doc.text('TVA (Régime Agro-avicole 0%) :', totauxX + 4, y + 19);
doc.text('0 FCFA', totauxX + totauxWidth - 4, y + 19, { align: 'right' });

// Ligne Total Net
doc.setFillColor(...primaryDark);
doc.rect(totauxX, y + 23, totauxWidth, 11, 'F');

doc.setTextColor(...accentAmber);
doc.setFont('helvetica', 'bold');
doc.setFontSize(9.5);
doc.text('NET À PAYER :', totauxX + 4, y + 30);
doc.setFontSize(11);
doc.text('650 000 FCFA', totauxX + totauxWidth - 4, y + 30, { align: 'right' });

// Notes & Conditions à gauche
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.setTextColor(...primaryDark);
doc.text('CONDITIONS DE RÈGLEMENT & LIVRAISON :', 15, y + 7);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.setTextColor(...textDark);
doc.text('• Acompte de 50% à la validation de la commande : 325 000 FCFA', 15, y + 13);
doc.text('• Solde de 50% payable à la réception et au déchargement : 325 000 FCFA', 15, y + 18);
doc.text('• Modes acceptés : Wave Business, Orange Money, Virement bancaire, Chèque certifié', 15, y + 23);
doc.text('• Délai de livraison garanti : 48h ouvrées après encaissement de l\'acompte', 15, y + 28);

// 6. Signatures et Cachet officiel
y = 195;

// Encadré Accord Client
doc.setDrawColor(203, 213, 225);
doc.setFillColor(255, 255, 255);
doc.roundedRect(15, y, 85, 42, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...primaryDark);
doc.text('BON POUR ACCORD DU CLIENT', 20, y + 6);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(...textMuted);
doc.text('Date et mention manuscrite "Bon pour accord" + Signature :', 20, y + 11);

// Encadré Cachet BS ALVÉOLES
doc.roundedRect(110, y, 85, 42, 2, 2, 'D');
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...primaryDark);
doc.text('POUR LA DIRECTION BS ALVÉOLES SÉNÉGAL', 115, y + 6);

// Faux tampon rond officiel
doc.setDrawColor(217, 119, 6);
doc.setLineWidth(0.6);
doc.circle(152, y + 25, 12, 'D');
doc.setFontSize(6);
doc.setTextColor(217, 119, 6);
doc.setFont('helvetica', 'bold');
doc.text('BS DISTRIBUTION', 152, y + 21, { align: 'center' });
doc.text('SUARL', 152, y + 25, { align: 'center' });
doc.text('DIRECTION COMMERCIALE', 152, y + 29, { align: 'center' });
doc.setLineWidth(0.2);

// 7. Bas de page / Mentions légales
const footerY = 280;
doc.setDrawColor(226, 232, 240);
doc.line(15, footerY, 195, footerY);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(...textMuted);
doc.text(
  'BS ALVÉOLES SÉNÉGAL — Société Unipersonnelle à Responsabilité Limitée (SUARL) au capital de 1 000 000 FCFA',
  pageWidth / 2,
  footerY + 4,
  { align: 'center' }
);
doc.text(
  'Siège social & Usine : Dakar / Thiès — NINEA : 009845212 — RCCM : SN.DKR.2024.B.18920 — Tél : +221 76 622 59 79',
  pageWidth / 2,
  footerY + 8,
  { align: 'center' }
);

// Sauvegarde du fichier PDF
const outputPath = path.join(__dirname, 'DEVIS_650000_FCFA_BS_ALVEOLES.pdf');
const pdfBytes = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBytes));

console.log(`PDF généré avec succès : ${outputPath}`);
