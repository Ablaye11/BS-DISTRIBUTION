const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

// Document A4
const doc = new jsPDF({
  orientation: 'portrait',
  unit: 'mm',
  format: 'a4'
});

const pageWidth = 210;

// Charte graphique élégante & professionnelle (Bleu nuit tech + Ambre chaud)
const primaryNavy = [15, 23, 42];    // Slate 900
const accentAmber = [217, 119, 6];   // Amber 600
const accentBlue  = [37, 99, 235];   // Blue 600
const textDark    = [30, 41, 59];    // Slate 800
const textMuted   = [100, 116, 139]; // Slate 500
const bgLight     = [248, 250, 252]; // Slate 50
const borderLight = [226, 232, 240];

// 1. En-tête haut de page
doc.setFillColor(...primaryNavy);
doc.rect(0, 0, pageWidth, 28, 'F');

doc.setFillColor(...accentAmber);
doc.rect(0, 28, pageWidth, 2, 'F');

// Logo / Titre Prestataire
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(15);
doc.text('PRESTATION DE SERVICE INFORMATIQUE & DIGITALISATION', 15, 13);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8.5);
doc.setTextColor(203, 213, 225);
doc.text('Conception & Developpement Logiciel sur-mesure - Solutions Web & Mobile', 15, 20);

// Badge Devis à droite
doc.setFillColor(...accentAmber);
doc.roundedRect(142, 8, 53, 12, 2, 2, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(10);
doc.text('DEVIS DE PRESTATION', 168.5, 15.5, { align: 'center' });

// 2. Coordonnées Développeur et Client
let y = 38;

// Bloc Prestataire (Développeur)
doc.setTextColor(...textMuted);
doc.setFontSize(7.5);
doc.setFont('helvetica', 'bold');
doc.text('PRESTATAIRE / DEVELOPPEUR :', 15, y);

doc.setTextColor(...primaryNavy);
doc.setFontSize(9.5);
doc.setFont('helvetica', 'bold');
doc.text('Ablaye SECK - Consultant Developpeur Logiciel', 15, y + 4.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...textDark);
doc.text('Ingenierie Logicielle, Applications Web & Systemes de Gestion ERP/MES', 15, y + 9);
doc.text('Dakar, Senegal - Tel / WhatsApp : +221 77 792 40 65 / +221 75 368 86 18', 15, y + 13.5);
doc.text('Email : ablaye.seck@dev-senegal.com', 15, y + 18);

// Bloc Client (Usine)
doc.setFillColor(...bgLight);
doc.roundedRect(115, y - 3, 80, 28, 2, 2, 'F');
doc.setDrawColor(...borderLight);
doc.roundedRect(115, y - 3, 80, 28, 2, 2, 'D');

doc.setTextColor(...textMuted);
doc.setFontSize(7.5);
doc.setFont('helvetica', 'bold');
doc.text('CLIENT DESTINATAIRE :', 120, y + 2);

doc.setTextColor(...primaryNavy);
doc.setFontSize(9.5);
doc.setFont('helvetica', 'bold');
doc.text('Direction Generale - BS ALVEOLES', 120, y + 7);

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...textDark);
doc.text('Unite Industrielle de Production d Alveoles', 120, y + 12);
doc.text('Zone Industrielle / Avicole - Dakar / Thies, Senegal', 120, y + 16.5);
doc.text('Objet : Logiciel de Digitalisation & Gestion d Usine', 120, y + 21);

// 3. Cadre Références Devis
y = 70;
doc.setFillColor(241, 245, 249);
doc.rect(15, y, 180, 9, 'F');
doc.setDrawColor(...borderLight);
doc.rect(15, y, 180, 9, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...textDark);
doc.text('N DEVIS : DEV-DEV-2026-1025', 18, y + 5.5);
doc.text('DATE : 25/10/2026', 75, y + 5.5);
doc.text('DELAI : 3 a 4 Semaines', 120, y + 5.5);
doc.text('VALIDITE : 30 Jours', 162, y + 5.5);

// 4. Objet de la prestation
y = 85;
doc.setFillColor(...primaryNavy);
doc.rect(15, y, 180, 7, 'F');
doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('OBJET DU PROJET', 18, y + 4.8);

y += 7;
doc.setFillColor(248, 250, 252);
doc.rect(15, y, 180, 11, 'F');
doc.setDrawColor(...borderLight);
doc.rect(15, y, 180, 11, 'D');
doc.setTextColor(...textDark);
doc.setFont('helvetica', 'normal');
doc.setFontSize(7.5);
doc.text(
  'Conception, developpement et deploiement d une plateforme web securisee (ERP / MES) pour la digitalisation complete',
  18, y + 4.5
);
doc.text(
  'de la production d alveoles d oeufs en pate moulee : Tableaux de bord, Productivite (TRS), Stocks, Gestion Commerciale et Finances.',
  18, y + 8.5
);

// 5. Tableau des 5 Modules Requis
y = 108;

// En-tête tableau
doc.setFillColor(...primaryNavy);
doc.rect(15, y, 180, 7, 'F');

doc.setTextColor(255, 255, 255);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.text('N', 18, y + 4.8);
doc.text('MODULE / PRESTATION DEVELOPPEMENT', 28, y + 4.8);
doc.text('FONCTIONNALITES & LIVRABLES INCLUS', 78, y + 4.8);
doc.text('MONTANT (FCFA)', 190, y + 4.8, { align: 'right' });

// Les 5 Modules
const modules = [
  {
    num: '01',
    titre: 'Tableaux de Bord Executifs (Dashboard)',
    details: 'Supervision temps reel : production du jour vs objectif (50 000 alv.), TRS moyen, CA realise, jours autonomie carton et alertes usine avec graphiques interactifs.',
    prix: '130 000'
  },
  {
    num: '02',
    titre: 'Indicateurs de la Productivite (MES / TRS)',
    details: 'Suivi des shifts (Matin, Soir, Nuit), calcul automatique du TRS / OEE (Disponibilite, Performance, Qualite), cadences horaires (alv/h), rebuts et ratio carton/1k.',
    prix: '150 000'
  },
  {
    num: '03',
    titre: 'Gestion des Stocks & Matieres',
    details: 'Suivi matieres premieres (balles cartons OCC, papiers, liants) et produits finis (plateaux 30, boites 6/10/12 en fardeaux), alertes seuil critique et valorisation stock.',
    prix: '130 000'
  },
  {
    num: '04',
    titre: 'Gestion Commerciale & Facturation B2B',
    details: 'Repertoire clients avicoles (fermes, couvoirs, grossistes), prise de commandes en fardeaux, tarifs degressifs, generation de Factures et Bons de Livraison (BL) chauffeurs.',
    prix: '120 000'
  },
  {
    num: '05',
    titre: 'Comptabilite de Base & Finances',
    details: 'Journal des recettes clients, charges exploitation usine (gaz sechoir, energie, matieres), tresorerie multi-comptes (Banque, Caisse, Wave, OM) et Compte de Resultat P&L.',
    prix: '120 000'
  }
];

y += 7;
modules.forEach((m, idx) => {
  const rowHeight = 15;
  
  if (idx % 2 === 1) {
    doc.setFillColor(248, 250, 252);
    doc.rect(15, y, 180, rowHeight, 'F');
  }

  doc.setDrawColor(...borderLight);
  doc.line(15, y + rowHeight, 195, y + rowHeight);

  // Numéro
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(...accentAmber);
  doc.text(m.num, 18, y + 5.5);

  // Titre du module
  doc.setTextColor(...primaryNavy);
  doc.text(m.titre, 28, y + 5.5);

  // Détails
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(6.8);
  doc.setTextColor(...textDark);
  const splitDetails = doc.splitTextToSize(m.details, 105);
  doc.text(splitDetails, 28, y + 9.5);

  // Prix
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(...primaryNavy);
  doc.text(m.prix, 190, y + 6, { align: 'right' });

  y += rowHeight;
});

// 6. Cadre Total & Modalités Financières
y += 5;

// Encadré Modalités à gauche
doc.setFillColor(248, 250, 252);
doc.roundedRect(15, y, 105, 36, 2, 2, 'F');
doc.setDrawColor(...borderLight);
doc.roundedRect(15, y, 105, 36, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...primaryNavy);
doc.text('ECHEANCIER & CONDITIONS DE REGLEMENT :', 18, y + 5.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(6.8);
doc.setTextColor(...textDark);
doc.text('- Acompte au demarrage du projet (40%) : 260 000 FCFA', 18, y + 10.5);
doc.text('- Paiement a la livraison de la version test (40%) : 260 000 FCFA', 18, y + 15);
doc.text('- Solde final apres formation et livraison (20%) : 130 000 FCFA', 18, y + 19.5);
doc.text('- Reglement via Wave Business, Orange Money Pro, Virement Bancaire', 18, y + 24);

// Mention explicite Hébergement Exclu
doc.setFont('helvetica', 'bold');
doc.setTextColor(185, 28, 28); // Rouge foncé
doc.text('* HEBERGEMENT SERVEUR & DOMAINE : EXCLUS (A la charge du client)', 18, y + 28.5);

doc.setFont('helvetica', 'normal');
doc.setTextColor(...textDark);
doc.text('- Inclus : Deploiement sur serveur client, code source et support 3 mois', 18, y + 33);

// Encadré Total à droite
const totauxX = 125;
const totauxWidth = 70;

doc.setFillColor(248, 250, 252);
doc.roundedRect(totauxX, y, totauxWidth, 36, 2, 2, 'F');
doc.setDrawColor(...borderLight);
doc.roundedRect(totauxX, y, totauxWidth, 36, 2, 2, 'D');

doc.setFont('helvetica', 'normal');
doc.setFontSize(8);
doc.setTextColor(...textDark);
doc.text('Sous-Total Prestations :', totauxX + 4, y + 6.5);
doc.text('650 000 FCFA', totauxX + totauxWidth - 4, y + 6.5, { align: 'right' });

// Ligne Hébergement Serveur Exclu
doc.text('Hebergement Serveur :', totauxX + 4, y + 12);
doc.setFont('helvetica', 'bold');
doc.setTextColor(185, 28, 28);
doc.text('EXCLU (Client)', totauxX + totauxWidth - 4, y + 12, { align: 'right' });

doc.setFont('helvetica', 'normal');
doc.setTextColor(...textDark);
doc.text('Garantie & Support (3 mois) :', totauxX + 4, y + 17.5);
doc.text('INCLUS', totauxX + totauxWidth - 4, y + 17.5, { align: 'right' });

// Ligne Total Net
doc.setFillColor(...primaryNavy);
doc.rect(totauxX, y + 23, totauxWidth, 13, 'F');

doc.setTextColor(...accentAmber);
doc.setFont('helvetica', 'bold');
doc.setFontSize(8.5);
doc.text('TOTAL DU DEVIS :', totauxX + 4, y + 31);
doc.setFontSize(11);
doc.text('650 000 FCFA', totauxX + totauxWidth - 4, y + 31, { align: 'right' });

// 7. Signatures et Validation
y = 233;

// Bloc Prestataire
doc.setDrawColor(...borderLight);
doc.setFillColor(255, 255, 255);
doc.roundedRect(15, y, 85, 38, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...primaryNavy);
doc.text('POUR LE DEVELOPPEUR / PRESTATAIRE', 18, y + 5.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(...textDark);
doc.text('Signature & Engagement de realisation :', 18, y + 10);

doc.setFont('helvetica', 'bold');
doc.setFontSize(8);
doc.setTextColor(...accentBlue);
doc.text('Ablaye SECK - Developpeur Logiciel', 18, y + 26);
doc.setFont('helvetica', 'normal');
doc.setFontSize(6.5);
doc.setTextColor(...textMuted);
doc.text('Dakar, Senegal - Validite 30 jours', 18, y + 31);

// Bloc Client
doc.roundedRect(110, y, 85, 38, 2, 2, 'D');

doc.setFont('helvetica', 'bold');
doc.setFontSize(7.5);
doc.setTextColor(...primaryNavy);
doc.text('POUR LE CLIENT (BS ALVEOLES)', 113, y + 5.5);

doc.setFont('helvetica', 'normal');
doc.setFontSize(7);
doc.setTextColor(...textMuted);
doc.text('Mention manuscrite "Bon pour accord et commande" :', 113, y + 10);
doc.text('Date :', 113, y + 15);
doc.text('Signature & Cachet :', 113, y + 20);

// 8. Pied de page
const footerY = 282;
doc.setDrawColor(...borderLight);
doc.line(15, footerY, 195, footerY);

doc.setFont('helvetica', 'normal');
doc.setFontSize(6.5);
doc.setTextColor(...textMuted);
doc.text(
  'Devis de prestation de services developpement logiciel etabli sous le regime des prestataires de services informatiques au Senegal.',
  pageWidth / 2,
  footerY + 3.5,
  { align: 'center' }
);
doc.text(
  'Ablaye SECK - Developpeur Web & Mobile Full-Stack - Tel : +221 77 792 40 65 / +221 75 368 86 18',
  pageWidth / 2,
  footerY + 7,
  { align: 'center' }
);

// Sauvegarde dans la racine et dans public/
const outputPath = path.join(__dirname, 'DEVIS_DEVELOPPEMENT_LOGICIEL_650000_FCFA.pdf');
const publicPath = path.join(__dirname, 'public', 'DEVIS_DEVELOPPEMENT_LOGICIEL_650000_FCFA.pdf');

const pdfBytes = doc.output('arraybuffer');
fs.writeFileSync(outputPath, Buffer.from(pdfBytes));
fs.writeFileSync(publicPath, Buffer.from(pdfBytes));

console.log(`Devis Developpeur genere avec succes : ${outputPath}`);
