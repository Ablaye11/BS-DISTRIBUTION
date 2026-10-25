const { jsPDF } = require('jspdf');
const fs = require('fs');
const path = require('path');

const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
const W = 210, H = 297;
const mL = 15, mR = 195, cW = 180;
const navy=[15,23,42], amber=[217,119,6], blue=[37,99,235];
const txtD=[30,41,59], txtM=[100,116,139], bgL=[248,250,252], brd=[226,232,240];

let pg = 1, y = 0;

function footerOn() {
  doc.setDrawColor(...brd);
  doc.line(mL, H-12, mR, H-12);
  doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...txtM);
  doc.text('BS ALVEOLES — Cahier des Charges ERP/MES — CDC-BS-ALVEOLES-2026-001', W/2, H-8, {align:'center'});
  doc.text('Page '+pg, mR, H-8, {align:'right'});
}

function np() { doc.addPage(); pg++; y=20; footerOn(); }
function chk(n) { if(y+n > H-18) np(); }
function sp(n) { y+=(n||4); }

function secTitle(t) {
  chk(12);
  doc.setFillColor(...navy); doc.rect(mL,y,cW,8,'F');
  doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(9);
  doc.text(t, mL+3, y+5.8); y+=10;
}

function sub(t) {
  chk(10);
  doc.setFillColor(...amber); doc.rect(mL,y,3,7,'F');
  doc.setTextColor(...navy); doc.setFont('helvetica','bold'); doc.setFontSize(8.5);
  doc.text(t, mL+6, y+5.2); y+=9;
}

function body(t, ind) {
  const x=mL+(ind||0), mw=cW-(ind||0);
  doc.setFont('helvetica','normal'); doc.setFontSize(7.8); doc.setTextColor(...txtD);
  const ls=doc.splitTextToSize(t,mw); chk(ls.length*4.5+2);
  doc.text(ls,x,y); y+=ls.length*4.5+2;
}

function bul(lbl, val) {
  chk(6);
  doc.setFont('helvetica','bold'); doc.setFontSize(7.5);
  doc.setTextColor(...amber); doc.text('  -',mL,y);
  doc.setTextColor(...navy); doc.text(lbl, mL+7, y);
  if(val){ doc.setFont('helvetica','normal'); doc.setTextColor(...txtD); doc.text(' : '+val, mL+7+doc.getTextWidth(lbl), y); }
  y+=5;
}

function trow(cols, ws, hdr, alt) {
  const rh=6.5; chk(rh+1);
  let x=mL;
  if(hdr){ doc.setFillColor(...navy); doc.rect(mL,y,cW,rh,'F'); }
  else if(alt){ doc.setFillColor(...bgL); doc.rect(mL,y,cW,rh,'F'); }
  doc.setDrawColor(...brd); doc.rect(mL,y,cW,rh,'D');
  cols.forEach((c,i) => {
    doc.setFont('helvetica',hdr?'bold':'normal'); doc.setFontSize(7.2);
    doc.setTextColor(hdr?255:txtD[0], hdr?255:txtD[1], hdr?255:txtD[2]);
    doc.text(doc.splitTextToSize(String(c),ws[i]-2), x+2, y+4.5); x+=ws[i];
  }); y+=rh;
}

// ── COUVERTURE ──
doc.setFillColor(...navy); doc.rect(0,0,W,75,'F');
doc.setFillColor(...amber); doc.rect(0,75,W,3,'F');
doc.setTextColor(255,255,255); doc.setFont('helvetica','bold');
doc.setFontSize(20); doc.text('CAHIER DES CHARGES', W/2, 28, {align:'center'});
doc.setFontSize(13); doc.text('Logiciel ERP / MES — Digitalisation Usine', W/2, 40, {align:'center'});
doc.setFont('helvetica','normal'); doc.setFontSize(10); doc.setTextColor(203,213,225);
doc.text("Unite de Production d Alveoles en Pate Moulee", W/2, 52, {align:'center'});

doc.setFillColor(255,255,255); doc.roundedRect(35,85,140,65,3,3,'F');
doc.setTextColor(...navy); doc.setFont('helvetica','bold');
doc.setFontSize(18); doc.text('BS ALVEOLES', W/2, 102, {align:'center'});
doc.setFontSize(9); doc.setFont('helvetica','normal'); doc.setTextColor(...txtM);
doc.text('BS DISTRIBUTION SUARL', W/2, 109, {align:'center'});
doc.setDrawColor(...amber); doc.line(55,113,155,113);
doc.setTextColor(...txtD); doc.setFontSize(8);
doc.text('Ref : CDC-BS-ALVEOLES-2026-001', W/2, 119, {align:'center'});
doc.text('Date : 25 Octobre 2026  |  Version 1.0  |  Statut : LIVRE', W/2, 125, {align:'center'});
doc.text('Prestataire : Ablaye SECK  |  seckablaye519@gmail.com', W/2, 131, {align:'center'});
doc.text('+221 77 792 40 65  /  +221 75 368 86 18', W/2, 137, {align:'center'});
doc.text('Depot GitHub : github.com/Ablaye11/BS-DISTRIBUTION', W/2, 143, {align:'center'});

doc.setFillColor(...bgL); doc.roundedRect(22,162,75,40,2,2,'F');
doc.setDrawColor(...brd); doc.roundedRect(22,162,75,40,2,2,'D');
doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...txtM);
doc.text('MONTANT TOTAL', 59.5, 170, {align:'center'});
doc.setFontSize(20); doc.setTextColor(...navy); doc.text('700 000', 59.5, 185, {align:'center'});
doc.setFontSize(10); doc.text('FCFA', 59.5, 192, {align:'center'});
doc.setFont('helvetica','normal'); doc.setFontSize(7); doc.setTextColor(...txtM);
doc.text('Hors hebergement serveur', 59.5, 198, {align:'center'});

doc.setFillColor(...bgL); doc.roundedRect(113,162,75,40,2,2,'F');
doc.setDrawColor(...brd); doc.roundedRect(113,162,75,40,2,2,'D');
doc.setFont('helvetica','bold'); doc.setFontSize(7.5); doc.setTextColor(...txtM);
doc.text('CONDITIONS', 150.5, 170, {align:'center'});
doc.setFont('helvetica','normal'); doc.setFontSize(7.8); doc.setTextColor(...txtD);
doc.text('Acompte (60%) : 420 000 FCFA', 150.5, 178, {align:'center'});
doc.text('Solde (40%) : 280 000 FCFA', 150.5, 184, {align:'center'});
doc.setFillColor(...amber); doc.roundedRect(123,188,55,8,1,1,'F');
doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(8);
doc.text('DELAI : 2 SEMAINES', 150.5, 193.5, {align:'center'});

footerOn();

// ── PAGE 2 ──
np();
secTitle('1. PRESENTATION GENERALE'); sp(1);
sub('1.1 Contexte');
body("BS ALVEOLES est une unite industrielle senegalaise specialisee dans la fabrication d alveoles (plateaux et boites d oeufs) en pate de carton moulee 100% recyclee, destinees aux fermes avicoles, couvoirs, grossistes et supermarches du Senegal.");
sp(2);
body("Objectif : digitalisation complete via un logiciel ERP/MES web, fonctionnant en temps reel avec stockage local hors-ligne (Dexie/IndexedDB), sans dependance a internet.");
sp(4);
sub('1.2 Identification');
bul('Nom du logiciel','BS DISTRIBUTION SUARL — Gestion Commerciale, Logistique et Financiere');
bul('URL deploiement','http://localhost:3000 (serveur fourni par le client)');
bul('Depot code source','https://github.com/Ablaye11/BS-DISTRIBUTION');
bul('Version','1.0 — Livree le 25/10/2026');
sp(4);

secTitle('2. ARCHITECTURE TECHNIQUE'); sp(1);
sub('2.1 Frontend'); sp(1);
trow(['Technologie','Version','Role'],[55,30,95],true);
[['React','18.2.0','Framework UI composants'],['TypeScript','5.3.3','Typage statique strict'],['Vite','5.1.4','Bundler rapide'],['Tailwind CSS','4.3.3','Design system utilitaire'],['Dexie.js','3.2.4','IndexedDB locale hors-ligne'],['dexie-react-hooks','1.1.7','Hooks reactifs Dexie'],['Recharts','2.12.2','Graphiques & visualisations KPI'],['React-Leaflet','4.2.1','Cartographie GPS 14 regions Senegal'],['Lucide React','0.344.0','Icones vectorielles'],['jsPDF','2.5.1','Generation PDF factures, BL, devis'],['html2canvas','1.4.1','Export images/PDF']].forEach((r,i)=>trow(r,[55,30,95],false,i%2===1));
sp(3);
sub('2.2 Backend'); sp(1);
trow(['Technologie','Role'],[65,115],true);
[['Node.js + Express (Port 5000)','Serveur API REST'],['TypeScript','Typage du serveur'],['CORS','Partage ressources cross-origin'],['Stockage In-Memory','Base de donnees en memoire (MVP)']].forEach((r,i)=>trow(r,[65,115],false,i%2===1));
sp(3);
sub('2.3 Base de donnees locale — Dexie/IndexedDB'); sp(1);
body('Nom de la base : BSAlveolesProductionDB_v1'); sp(2);
trow(['Table','Description'],[55,125],true);
[['alveoleProducts','Catalogue produits finis (plateaux 30, boites 6/10/12)'],['rawMaterials','Stock matieres premieres (cartons OCC, adjuvants, hydrofuges...)'],['productionShifts','Releves de shifts et indicateurs TRS/OEE par shift'],['clients','Clients B2B (fermes, couvoirs, grossistes, supermarches)'],['invoices','Factures et Bons de Livraison avec numerotation automatique'],['expenses','Depenses et charges exploitation usine par categorie'],['stockMovements','Mouvements de stock (receptions, consommations, expeditions)'],['notifications','Alertes systeme internes non lues'],['auditLogs','Journal horodate de toutes les actions utilisateurs']].forEach((r,i)=>trow(r,[55,125],false,i%2===1));

// ── PAGE 3 ──
np();
secTitle('3. PROFILS UTILISATEURS'); sp(1);
trow(['Role','Nom par defaut','Acces'],[58,52,70],true);
[['DIRECTEUR_USINE','M. Ndiaye Saliou','Tous modules (lecture + ecriture)'],['RESPONSABLE_PRODUCTION','Amadou Ba','Dashboard, Productivite, Stock'],['RESPONSABLE_STOCK','Modou Faye','Stock, Dashboard'],['RESPONSABLE_COMMERCIAL','Ibrahima Ndiaye','Commercial, Dashboard, Finances'],['COMPTABLE','Awa Diop','Finances, Dashboard'],['SUPER_ADMIN','Super Administrateur','Acces total + Audit complet']].forEach((r,i)=>trow(r,[58,52,70],false,i%2===1));
sp(2);
bul('Authentification','Ecran connexion par profil (LoginScreen.tsx)');
bul('Securite','Verrouillage automatique par inactivite (SecurityAutoLockModal.tsx)');
bul('Vitrine publique','Accessible sans connexion (PublicLandingPage.tsx)');
sp(4);

secTitle('4. LES 6 MODULES FONCTIONNELS'); sp(1);
sub('MODULE 01 — TABLEAU DE BORD EXECUTIF');
body('Fichier : src/modules/dashboard/ExecutiveDashboard.tsx (17 784 octets)'); sp(1);
bul('KPIs temps reel','Production jour vs objectif 50 000 alv/j, TRS moyen, CA mensuel realise');
bul('Autonomie matieres','Calcul jours de production restants selon stocks actuels');
bul('Alertes usine','Stocks critiques, livraisons en retard, creances impayes');
bul('Graphiques interactifs','Courbes et barres KPI via Recharts');
bul('Navigation rapide','Acces direct aux 5 autres modules');
bul('Indicateurs colores','Vert / Orange / Rouge selon seuils objectif');
sp(4);

sub('MODULE 02 — INDICATEURS DE PRODUCTIVITE (MES / TRS)');
body('Fichier : src/modules/production/ProductiviteModule.tsx (33 908 octets — module le plus volumineux)'); sp(1);
bul('Shifts','Matin 06h-14h / Soir 14h-22h / Nuit 22h-06h');
bul('TRS/OEE auto','Taux Disponibilite x Taux Performance x Taux Qualite');
bul('Controle Qualite','CONFORME / SOUS_SURVEILLANCE / NON_CONFORME'); sp(2);
trow(['Indicateur','Formule de calcul'],[70,110],true);
[['Taux Disponibilite','(Heures Fonctionnement / Heures Planifiees) x 100'],['Taux Performance','(Cadence Reelle alv/h / Cadence Theorique) x 100'],['Taux Qualite','(Alveoles Conformes / Total Fabrique) x 100'],['TRS / OEE','Disponibilite x Performance x Qualite'],['Ratio matieres','kg papier carton consomme pour 1 000 alveoles']].forEach((r,i)=>trow(r,[70,110],false,i%2===1));
sp(3);
trow(['Reference','Designation','Capacite','Poids/Unite'],[38,72,35,35],true);
[['ALV-30-STD','Plateau 30 Oeufs Standard (Pate Moulee)','30 oeufs','68g'],['ALV-30-EXP','Plateau 30 Oeufs Renforce Export','30 oeufs','78g'],['ALV-BOX-6','Boite 6 Oeufs','6 oeufs','-'],['ALV-BOX-10','Boite 10 Oeufs','10 oeufs','-'],['ALV-BOX-12','Boite 12 Oeufs','12 oeufs','-']].forEach((r,i)=>trow(r,[38,72,35,35],false,i%2===1));

// ── PAGE 4 ──
np();
sub('MODULE 03 — GESTION DES STOCKS ET MATIERES');
body('Fichier : src/modules/stock/StockAlveolesModule.tsx (24 623 octets)'); sp(1);
bul('Produits Finis','Suivi en fardeaux et unites, alertes seuil critique, valorisation FCFA');
bul('Matieres Premieres','Balles cartons OCC, adjuvants, hydrofuges, colorants, cerclage, pieces usure');
bul('Cartographie GPS','Localisation entrepots via React-Leaflet'); sp(2);
trow(['Type Mouvement','Description'],[65,115],true);
[['ENTREE_RECEPTION','Reception de matieres premieres fournisseur'],['SORTIE_PULPEUR','Consommation matieres en production usine'],['ENTREE_PRODUCTION_PF','Entree produit fini depuis ligne de production'],['SORTIE_EXPEDITION','Sortie produit fini vers client sur commande'],['REBUT_RECYLE','Rebuts de production recycles en pulpe']].forEach((r,i)=>trow(r,[65,115],false,i%2===1));
sp(4);

sub('MODULE 04 — GESTION COMMERCIALE ET FACTURATION B2B');
body('Fichier : src/modules/commercial/GestionCommercialeModule.tsx (41 303 octets — module principal)'); sp(1);
bul('Categories clients','Fermes Avicoles, Couvoirs, Grossistes, Cooperatives, Supermarches, Conditionneurs');
bul('Fiche client','Raison sociale, contact, telephone, email, adresse, region, GPS, solde crediteur');
bul('Numerotation auto','FAC-AAMM-XXXX pour factures, BL-AAMM-XXXX pour bons de livraison');
bul('Cycle commande','DEVIS > CONFIRMEE > EN_PRODUCTION > PRETE > EXPEDIEE > LIVREE > ANNULEE');
bul('Paiements','Wave Business, Orange Money, Virement Bancaire, Cheque, Especes');
bul('Creances','Suivi solde du, limite credit, delai paiement par client');
bul('Export PDF','Generation factures et BL via jsPDF dans le navigateur');
bul('Cartographie','Clients localises sur carte interactive React-Leaflet');
sp(4);

sub('MODULE 05 — COMPTABILITE ET FINANCES');
body('Fichier : src/modules/finances/ComptabiliteFinanciereModule.tsx (24 600 octets)'); sp(1);
bul('Journal recettes','Encaissements clients par periode et mode de paiement');
bul('Journal depenses','9 categories : matieres, energie, salaires, transport, maintenance...');
bul('Tresorerie 4 comptes','Caisse Usine, Banque Principale, Wave Business, Orange Money Pro');
bul('Compte de resultat P&L','Recettes - Charges = Resultat Net de la periode');
bul('Suivi impayes','Alertes creances clients depassant delai paiement');
sp(4);

sub('MODULE 06 — JOURNAL D AUDIT ET TRACABILITE');
bul('Historique','Toutes les actions utilisateurs horodatees et tracees');
bul('Donnees','Utilisateur, role, action, entite, ancienne et nouvelle valeur');
bul('Types','CREATION, MODIFICATION, SUPPRESSION, CONNEXION');
bul('Acces','Reserve au DIRECTEUR_USINE et SUPER_ADMIN uniquement');
sp(4);

secTitle('5. COMPOSANTS TRANSVERSAUX'); sp(1);
trow(['Composant','Fichier','Taille','Description'],[33,58,18,71],true);
[['Header','Header.tsx','4 645 o','Barre sup. : logo, utilisateur, notifications, role'],['Sidebar','Sidebar.tsx','6 353 o','Menu lateral acces aux 6 modules'],['MobileNav','MobileNav.tsx','4 342 o','Navigation mobile responsive'],['OfflineBanner','OfflineBanner.tsx','1 576 o','Bandeau alerte connexion hors-ligne'],['LoginScreen','LoginScreen.tsx','6 666 o','Ecran connexion par profil'],['SecurityAutoLock','SecurityAutoLockModal.tsx','6 725 o','Verrouillage auto par inactivite'],['PublicLandingPage','PublicLandingPage.tsx','-','Vitrine publique avant connexion']].forEach((r,i)=>trow(r,[33,58,18,71],false,i%2===1));

// ── PAGE 5 ──
np();
secTitle('6. API BACKEND REST (Express.js — Port 5000)'); sp(1);
trow(['Methode','Route','Description'],[22,55,103],true);
[['GET','/api/health','Verification etat serveur API'],['GET','/api/prospects','Liste des prospects commerciaux'],['POST','/api/prospects','Creer un nouveau prospect'],['GET','/api/clients','Liste des clients B2B'],['GET','/api/invoices','Liste de toutes les factures'],['POST','/api/invoices','Creer une facture avec numerotation automatique'],['GET','/api/stock/lots','Lots de stock receptiones'],['GET','/api/stock/losses','Pertes et rebuts enregistres'],['GET','/api/audit-logs','Journal d audit complet']].forEach((r,i)=>trow(r,[22,55,103],false,i%2===1));
sp(4);

secTitle('7. FONCTIONNALITES TRANSVERSALES'); sp(1);
sub('7.1 Mode Hors-Ligne');
bul('Stockage local','Toutes les donnees dans Dexie/IndexedDB (navigateur)');
bul('Sans internet','Application utilisable en mode deconnecte');
bul('Bandeau alerte','OfflineBanner visible si reseau coupe'); sp(3);

sub('7.2 Generation PDF (jsPDF + html2canvas)');
bul('Factures et BL','Generes directement dans le navigateur');
bul('Devis prestataire','Scripts Node.js dedies (generate_devis_*.cjs)');
bul('Design premium','Bleu Nuit Slate 900 + Ambre Amber 600'); sp(3);

sub('7.3 Cartographie GPS (React-Leaflet + OpenStreetMap)');
bul('Technologie','React-Leaflet v4 avec tuiles OpenStreetMap');
bul('Couverture','14 regions du Senegal : Dakar, Thies, Saint-Louis, Diourbel, Fatick, Kaolack, Kolda, Louga, Matam, Kaffrine, Kedougou, Sedhiou, Tambacounda, Ziguinchor');
bul('Usage','Localisation clients et entrepots sur carte interactive'); sp(3);

sub('7.4 Systeme de Notifications');
bul('Stocks critiques','Alerte si stock < seuil de securite configure');
bul('Creances','Alerte impayes depassant delai paiement');
bul('TRS faible','Alerte si rendement production sous objectif');
bul('Centre notifs','Icone cloche dans Header avec compteur non-lus'); sp(4);

secTitle('8. CONDITIONS FINANCIERES ET CONTRACTUELLES'); sp(1);
trow(['Element','Detail'],[65,115],true);
[['Montant Total','700 000 FCFA (toutes prestations incluses)'],['Acompte au demarrage (60%)','420 000 FCFA — exigible avant debut des travaux'],['Solde a la livraison (40%)','280 000 FCFA — apres recette et validation client'],['Delai d execution','2 Semaines (14 jours ouvres) - garanti'],['Hebergement Serveur','EXCLU — A la charge exclusive du client'],['Nom de Domaine Web','EXCLU — A la charge exclusive du client'],['Code Source Complet','INCLUS — Livre avec le projet'],['Deploiement sur serveur','INCLUS — Sur serveur fourni par le client'],['Garantie et Support','INCLUS — 3 mois apres la livraison'],['Validite du devis','30 jours calendaires'],['Modes de reglement','Wave Business, Orange Money Pro, Virement Bancaire, Cheque']].forEach((r,i)=>trow(r,[65,115],false,i%2===1));

// ── PAGE 6 ──
np();
secTitle('9. LIVRABLES DU PROJET'); sp(2);
trow(['Livrable','Statut','Description'],[55,22,103],true);
[['Application Web ERP/MES (Frontend)','LIVRE','React + TypeScript + Tailwind + Dexie — 6 modules complets'],['API Backend REST (Express.js)','LIVRE','9 endpoints — Gestion prospects, clients, factures, stocks, audit'],['Base de donnees locale (Dexie)','LIVRE','9 tables IndexedDB avec donnees initiales seeded'],['Module Dashboard','LIVRE','KPIs, TRS, CA, alertes, graphiques Recharts'],['Module Productivite MES','LIVRE','Shifts, TRS/OEE, cadences, rebuts (33 908 octets)'],['Module Gestion des Stocks','LIVRE','Produits finis + matieres premieres + mouvements'],['Module Commercial B2B','LIVRE','Clients, factures, BL, paiements, cartographie GPS'],['Module Comptabilite Finances','LIVRE','Journal recettes/depenses, tresorerie 4 comptes, P&L'],['Journal Audit & Tracabilite','LIVRE','Historique complet toutes actions utilisateurs'],['Authentification & Securite','LIVRE','Login, roles, verrouillage auto, vitrine publique'],['Cartographie GPS Senegal','LIVRE','React-Leaflet, 14 regions, clients et entrepots localises'],['Generation PDF (Factures, BL)','LIVRE','jsPDF integre dans navigateur'],['Devis prestataire PDF','LIVRE','700 000 FCFA — DEVIS_700000_FCFA_ABLAYE_SECK.pdf'],['Ce Cahier des Charges PDF','LIVRE','CAHIER_DES_CHARGES_BS_ALVEOLES.pdf'],['Depot GitHub','LIVRE','https://github.com/Ablaye11/BS-DISTRIBUTION']].forEach((r,i)=>trow(r,[55,22,103],false,i%2===1));
sp(5);

secTitle('10. COORDONNEES DU PRESTATAIRE'); sp(2);
doc.setFillColor(...bgL); doc.roundedRect(mL,y,cW,32,2,2,'F');
doc.setDrawColor(...brd); doc.roundedRect(mL,y,cW,32,2,2,'D');
y+=6;
doc.setFont('helvetica','bold'); doc.setFontSize(12); doc.setTextColor(...navy);
doc.text('Ablaye SECK', mL+8, y); y+=6;
doc.setFont('helvetica','normal'); doc.setFontSize(8.5); doc.setTextColor(...txtD);
doc.text('Consultant Developpeur Logiciel Full-Stack — Specialite ERP/MES/Web', mL+8, y); y+=5.5;
doc.text('Dakar, Senegal', mL+8, y); y+=5.5;
doc.setTextColor(...blue); doc.text('seckablaye519@gmail.com', mL+8, y); y+=5.5;
doc.setTextColor(...txtD); doc.text('+221 77 792 40 65  /  +221 75 368 86 18', mL+8, y);
y+=10; sp(6);

secTitle('11. SIGNATURES ET VALIDATION'); sp(4);
const sy=y;
doc.setDrawColor(...brd); doc.roundedRect(mL,sy,87,55,2,2,'D');
doc.roundedRect(108,sy,87,55,2,2,'D');
doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...navy);
doc.text('POUR LE PRESTATAIRE', mL+4, sy+7);
doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...txtD);
doc.text('Ablaye SECK — Developpeur Logiciel', mL+4, sy+13);
doc.text('Engagement de realisation en 2 semaines', mL+4, sy+19);
doc.text('Dakar, le : 25 / 10 / 2026', mL+4, sy+27);
doc.setFont('helvetica','bold'); doc.setFontSize(8.5); doc.setTextColor(...blue);
doc.text('Ablaye SECK', mL+4, sy+47);
doc.setFont('helvetica','normal'); doc.setFontSize(6.5); doc.setTextColor(...txtM);
doc.text('seckablaye519@gmail.com', mL+4, sy+52);
doc.setFont('helvetica','bold'); doc.setFontSize(8); doc.setTextColor(...navy);
doc.text('POUR LE CLIENT (BS ALVEOLES)', 112, sy+7);
doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(...txtM);
doc.text('Bon pour accord et commande :', 112, sy+14);
doc.text('Nom et Fonction : ________________', 112, sy+22);
doc.text('Date : ___________________________', 112, sy+29);
doc.text('Signature et Cachet :', 112, sy+36);

y=sy+60; sp(6);
doc.setFillColor(...navy); doc.rect(mL,y,cW,18,'F');
doc.setTextColor(255,255,255); doc.setFont('helvetica','bold'); doc.setFontSize(10);
doc.text('BS ALVEOLES — Logiciel ERP/MES de Production — Version 1.0', W/2, y+8, {align:'center'});
doc.setFont('helvetica','normal'); doc.setFontSize(7.5); doc.setTextColor(203,213,225);
doc.text('CDC-BS-ALVEOLES-2026-001 — Confidentiel — Ablaye SECK — seckablaye519@gmail.com', W/2, y+14, {align:'center'});

const out = path.join(__dirname, 'CAHIER_DES_CHARGES_BS_ALVEOLES.pdf');
fs.writeFileSync(out, Buffer.from(doc.output('arraybuffer')));
console.log('OK:' + out);
