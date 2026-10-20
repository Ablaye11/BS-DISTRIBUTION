# BS DISTRIBUTION D’ŒUFS SUARL — Plateforme de Gestion Commerciale, Logistique, Financière & Comptable

Solution Web PWA complète pour le pilotage des opérations de distribution et de vente d'œufs au Sénégal.

---

## 📂 Structure du Projet (Séparation Backend / Frontend)

```
BS DISTRIBUTION/
├── backend/                  # Serveur REST API (Node.js / Express / TypeScript / PostgreSQL)
│   ├── src/
│   │   └── server.ts         # Endpoints RESTful pour les 38 entités & 12 modules
│   ├── package.json
│   └── README.md             # Documentation API Backend
│
├── src/                      # Application Web PWA Frontend (React / TypeScript / Vite)
│   ├── components/           # Tampon officiel, Carte Leaflet, PDF Generator
│   ├── modules/              # 12 Modules du Cahier des Charges
│   ├── db/                   # Offline PWA IndexedDB (Dexie)
│   └── types/                # Définitions TypeScript partagées
│
├── index.html                # Point d'entrée Web PWA
├── package.json              # Dépendances Frontend
├── implementation_plan.md    # Plan d'implémentation officiel validé
└── walkthrough.md           # Rapport de recette et audit 44/44 CDC
```

---

## 🚀 Démarrage Rapide

### 1. Démarrer le Backend (API REST - Port 5000)
```bash
cd backend
npm install
npm run dev
```

### 2. Démarrer le Frontend (Application Web PWA - Port 3000)
```bash
npm install
npm run dev
```

L'application web est accessible sur `http://localhost:3000` et s'interface avec l'API Backend sur `http://localhost:5000`.
