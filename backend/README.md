# BS DISTRIBUTION SUARL — API Backend (Node.js / Express / TypeScript)

Ce répertoire contient le serveur **Backend API RESTful** pour la plateforme de gestion commerciale, logistique, financière et comptable de **BS DISTRIBUTION D’ŒUFS SUARL** (Keur Massar, Sénégal).

---

## 📌 Architecture Backend & Synchro
- **Langage & Framework** : Node.js avec TypeScript, Express.js, CORS, JSON Web Tokens (JWT).
- **Base de Données** : PostgreSQL / SQLite avec modélisation complète des 38 entités.
- **Port d'écoute** : `http://localhost:5000`

---

## 🚀 Endpoints API RESTful
- `GET /api/health` : Statut du serveur API et vérification de la connexion BDD.
- `GET /api/prospects` & `POST /api/prospects` : Gestion des prospects terrain, scoring et géolocalisation.
- `GET /api/clients` : Portefeuille clients et solde créances en FCFA.
- `GET /api/invoices` & `POST /api/invoices` : Factures `FAC-YYMM-####`, Bons de Livraison `BL-YYMM-####` et règlements.
- `GET /api/stock/lots` & `GET /api/stock/losses` : Réceptions de lots d'œufs et suivi des pertes (Catégorie 1 fissurés / Catégorie 2 cassés).
- `GET /api/audit-logs` : Journal d'audit chronologique inaltérable des opérations sensibles.

---

## ⚙️ Démarrage du Serveur Backend
```bash
cd backend
npm install
npm run dev
```
