# BS DISTRIBUTION SUARL — Application Web PWA Frontend (React / TypeScript / Vite)

Ce répertoire contient l'interface utilisateur **Progressive Web App (PWA)** pour la plateforme de gestion commerciale, logistique, financière et comptable de **BS DISTRIBUTION D’ŒUFS SUARL**.

---

## 📌 Fonctionnalités Frontend
- **12 Modules CDC** : CRM, Ventes, Factures (`FAC-YYMM-####`), Bons de livraison (`BL-YYMM-####`), Missions Interrégionales, Stock d'œufs, Pertes Cat.1 (fissurés) & Cat.2 (cassés), Finances P&L, Commissions, Cartographie GPS, Poulaillers et Performance.
- **Sécurités & Rôles** : Rôles fins (`ADMIN_GENERAL`, `COMMERCIAL`, `DEMARCHEUR`, `COMPTABLE`, `SUPER_ADMIN`).
- **Mode Hors-Ligne (Offline-First)** : Moteur IndexedDB réactif Dexie.js avec synchronisation automatique.
- **Impression PDF** : Tampon officiel numérique certifié avec la signature de M. Ndiaye Saliou.

---

## 🚀 Démarrage du Frontend
```bash
cd frontend
npm install
npm run dev
```

L'application est accessible sur `http://localhost:3000`.
