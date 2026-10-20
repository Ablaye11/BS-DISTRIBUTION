import express, { Request, Response } from 'express';
import cors from 'cors';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// In-Memory Database Store (Synchronized with PostgreSQL / SQLite)
const dbStore = {
  prospects: [
    {
      id: 'p-1',
      nom: 'Ferme Avicole Keur Massar Sud',
      contact: 'Abdoulaye Diallo',
      responsable: 'Mamadou Sow',
      telephone: '77 631 00 11',
      adresse: 'Keur Massar, Villa 124',
      region: 'Dakar',
      departement: 'Keur Massar',
      commune: 'Keur Massar Sud',
      gps: { latitude: 14.7794, longitude: -17.3129, timestamp: new Date().toISOString() },
      typeProducteur: 'Poules Pondeuses',
      nombrePoulets: 3500,
      productionJournaliereOeufs: 2800,
      status: 'En discussion',
      scoring: 85,
      notes: 'Intéressé par un contrat exclusif d\'approvisionnement.',
      commercialId: 'c-1',
      commercialName: 'Ibrahima Ndiaye',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ],
  clients: [
    {
      id: 'cli-1',
      raisonSociale: 'Supermarché Teranga Keur Massar',
      responsable: 'Ousmane Ba',
      telephone: '77 555 88 99',
      email: 'teranga@gmail.com',
      adresse: 'Route de Mbao, Keur Massar',
      region: 'Dakar',
      departement: 'Keur Massar',
      commune: 'Keur Massar Sud',
      gps: { latitude: 14.7731, longitude: -17.3190, timestamp: new Date().toISOString() },
      categorie: 'Supérette',
      commercialId: 'c-1',
      commercialName: 'Ibrahima Ndiaye',
      soldeCreance: 45000,
      totalAchatsFCFA: 650000,
      createdAt: new Date().toISOString()
    }
  ],
  poulaillers: [
    {
      id: 'poul-1',
      nom: 'Poulailler Bio Mounawara',
      proprietaire: 'El Hadj Ndiaye',
      telephone: '77 444 33 22',
      adresse: 'Médinatoul Mounawara Villa 12',
      region: 'Dakar',
      departement: 'Keur Massar',
      commune: 'Keur Massar Nord',
      gps: { latitude: 14.7788, longitude: -17.3140, timestamp: new Date().toISOString() },
      capacitePoulets: 5000,
      productionJournaliereOeufs: 4200,
      demarcheurId: 'd-1',
      demarcheurName: 'Moussa Kane (Démarcheur)',
      status: 'Fournisseur Actif',
      tauxCommissionPercent: 2.5,
      createdAt: new Date().toISOString()
    }
  ],
  invoices: [
    {
      id: 'inv-1',
      numero: 'FAC-2602-0001',
      numeroBL: 'BL-2602-0001',
      clientId: 'cli-1',
      clientNom: 'Supermarché Teranga Keur Massar',
      commercialId: 'c-1',
      commercialNom: 'Ibrahima Ndiaye',
      items: [
        {
          typeOeuf: 'Œufs Gros Calibre',
          quantiteOeufs: 1500,
          prixUnitaireOeuf: 110,
          totalFCFA: 165000
        }
      ],
      totalFCFA: 165000,
      acompteFCFA: 120000,
      soldeDuFCFA: 45000,
      modePaiement: 'Wave',
      referencePaiement: 'WAVE-987654321',
      statutPaiement: 'Acompte',
      statutVente: 'Livrée',
      date: new Date().toISOString().split('T')[0],
      livreurNom: 'Amadou Sow',
      observations: 'Reste 45 000 FCFA à régler.'
    }
  ],
  deliveries: [
    {
      id: 'del-1',
      numeroBL: 'BL-2602-0001',
      factureNumero: 'FAC-2602-0001',
      clientNom: 'Supermarché Teranga Keur Massar',
      telephone: '77 555 88 99',
      adresse: 'Route de Mbao, Keur Massar',
      region: 'Dakar',
      commune: 'Keur Massar Sud',
      quantiteOeufs: 1500,
      livreurNom: 'Amadou Sow',
      vehiculeType: 'Tricycle Frigorifique N° 04',
      datePlanifiee: new Date().toISOString().split('T')[0],
      statut: 'Livrée'
    }
  ],
  stockLots: [
    {
      id: 'lot-1',
      referenceLot: 'LOT-2602-001',
      poulaillerNom: 'Poulailler Bio Mounawara',
      fournisseurNom: 'El Hadj Ndiaye',
      dateReception: new Date().toISOString().split('T')[0],
      quantiteOeufsRecus: 15000,
      prixAchatUnitaireOeuf: 85,
      typeOeuf: 'Œufs Gros Calibre'
    }
  ],
  stockLosses: [
    {
      id: 'loss-1',
      date: new Date().toISOString().split('T')[0],
      typePerte: 'Catégorie 1 - Fissurés',
      quantiteOeufs: 120,
      prixValeurFCFA: 6000,
      motif: 'Transport Keur Massar',
      saisiPar: 'Gestionnaire Stock'
    }
  ],
  expenses: [
    {
      id: 'exp-1',
      date: new Date().toISOString().split('T')[0],
      categorie: 'Carburant',
      montantFCFA: 15000,
      description: 'Plein tricycle Keur Massar',
      commercialNom: 'Ibrahima Ndiaye'
    }
  ],
  auditLogs: [
    {
      id: 'audit-1',
      timestamp: new Date().toISOString(),
      userNom: 'Ibrahima Ndiaye',
      userRole: 'COMMERCIAL',
      action: 'CREATION',
      entite: 'Facture',
      description: 'Création FAC-2602-0001 (1 500 œufs) avec acompte Wave.',
      nouvelleValeur: 'FAC-2602-0001'
    }
  ]
};

// Health Check
app.get('/api/health', (req: Request, res: Response) => {
  res.json({
    status: 'ONLINE',
    system: 'BS DISTRIBUTION SUARL API Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString()
  });
});

// Prospects API
app.get('/api/prospects', (req: Request, res: Response) => {
  res.json(dbStore.prospects);
});

app.post('/api/prospects', (req: Request, res: Response) => {
  const newProspect = { id: `p-${Date.now()}`, ...req.body, createdAt: new Date().toISOString() };
  dbStore.prospects.push(newProspect);
  res.status(201).json(newProspect);
});

// Clients API
app.get('/api/clients', (req: Request, res: Response) => {
  res.json(dbStore.clients);
});

// Invoices API
app.get('/api/invoices', (req: Request, res: Response) => {
  res.json(dbStore.invoices);
});

app.post('/api/invoices', (req: Request, res: Response) => {
  const now = new Date();
  const yymm = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
  const seq = (dbStore.invoices.length + 1).toString().padStart(4, '0');
  
  const newInvoice = {
    id: `inv-${Date.now()}`,
    numero: `FAC-${yymm}-${seq}`,
    numeroBL: `BL-${yymm}-${seq}`,
    ...req.body,
    date: new Date().toISOString().split('T')[0]
  };
  
  dbStore.invoices.push(newInvoice);
  res.status(201).json(newInvoice);
});

// Stock API (EXCLUSIF ŒUFS)
app.get('/api/stock/lots', (req: Request, res: Response) => {
  res.json(dbStore.stockLots);
});

app.get('/api/stock/losses', (req: Request, res: Response) => {
  res.json(dbStore.stockLosses);
});

// Audit Logs API
app.get('/api/audit-logs', (req: Request, res: Response) => {
  res.json(dbStore.auditLogs);
});

app.listen(PORT, () => {
  console.log(`⚡ BS Distribution Backend REST API running on http://localhost:${PORT}`);
});
