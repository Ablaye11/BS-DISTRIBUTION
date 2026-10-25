import React, { useState } from 'react';
import { 
  FileText, Calculator, Award, CheckCircle2, AlertTriangle, 
  Settings, Layers, TrendingUp, DollarSign, Clock, Users, ShieldAlert,
  HelpCircle, ArrowRight, RefreshCw, BarChart2, ShieldCheck, Check, Info
} from 'lucide-react';

export const CahierDesChargesModule: React.FC = () => {
  const [activeSubTab, setActiveSubTab] = useState<
    'annexe_c' | 'annexe_b' | 'annexe_a' | 'primes' | 'recette' | 'regles'
  >('annexe_c');

  // --- Simulateur interactif Annexe C ---
  const [cadenceNominale, setCadenceNominale] = useState(2000);
  const [tauxRendementPct, setTauxRendementPct] = useState(85);
  const [heuresShift, setHeuresShift] = useState(8);
  const [joursMois, setJoursMois] = useState(26);
  const [rendementPapierAlvKg, setRendementPapierAlvKg] = useState(35);
  const [prixPapierKg, setPrixPapierKg] = useState(225);
  const [partContratsPct, setPartContratsPct] = useState(50);
  const [prixContratAlv, setPrixContratAlv] = useState(30);
  const [prixMarcheAlv, setPrixMarcheAlv] = useState(35);

  // Calculs dérivés Annexe C
  const cadenceReelle = Math.round((cadenceNominale * tauxRendementPct) / 100);
  const productionJour = cadenceReelle * heuresShift;
  const productionMois = productionJour * joursMois;
  const lotsMois = Math.round(productionMois / 100);
  const besoinPapierKgMois = Math.round(productionMois / rendementPapierAlvKg);
  const coutMatiereUnitaire = Number((prixPapierKg / rendementPapierAlvKg).toFixed(2));
  const coutMatiereLot = Math.round(coutMatiereUnitaire * 100);

  const lotsContrats = Math.round((lotsMois * partContratsPct) / 100);
  const lotsMarche = lotsMois - lotsContrats;
  const caContrats = lotsContrats * (prixContratAlv * 100);
  const caMarche = lotsMarche * (prixMarcheAlv * 100);
  const caTotalTheorique = caContrats + caMarche;

  // --- Simulateur interactif Primes de Performance ---
  const [gainProductivite, setGainProductivite] = useState(14280000);
  const [tauxPrimeProductivite, setTauxPrimeProductivite] = useState(20);

  const [gainRendement, setGainRendement] = useState(-236250);
  const [tauxPrimeRendement, setTauxPrimeRendement] = useState(25);

  const [gainMaintenance, setGainMaintenance] = useState(-120000);
  const [tauxPrimeMaintenance, setTauxPrimeMaintenance] = useState(20);

  const [gainEnergie, setGainEnergie] = useState(-1896000);
  const [tauxPrimeEnergie, setTauxPrimeEnergie] = useState(15);

  const primeProductivite = Math.round((gainProductivite * tauxPrimeProductivite) / 100);
  const primeRendement = Math.round((gainRendement * tauxPrimeRendement) / 100);
  const primeMaintenance = Math.round((gainMaintenance * tauxPrimeMaintenance) / 100);
  const primeEnergie = Math.round((gainEnergie * tauxPrimeEnergie) / 100);
  const totalPrimeNet = primeProductivite + primeRendement + primeMaintenance + primeEnergie;

  // --- Tests de Recette ---
  const [testResults, setTestResults] = useState<Record<number, boolean>>({
    1: true,
    2: true,
    3: true,
    4: true,
    5: true,
    6: true,
    7: true,
    8: true,
    9: true,
    10: true,
    11: true,
    12: true,
  });

  const toggleTest = (id: number) => {
    setTestResults(prev => ({ ...prev, [id]: !prev[id] }));
  };

  return (
    <div className="space-y-6 animate-fadeIn pb-12">
      {/* En-tête du module */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 sm:p-8 rounded-3xl text-white shadow-2xl border border-slate-800">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <FileText className="w-3.5 h-3.5" />
                Dossier Officiel de Référence • Cadrage Intégral 28 Pages
              </span>
              <span className="text-xs text-slate-400">Devise : FCFA • Lot : 100 alvéoles</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight">
              Cahier des Charges & Normes Industrielles
            </h1>
            <p className="text-sm text-slate-300 mt-2 max-w-3xl">
              Socle mathématique et technique de l’usine BS ALVÉOLES. Recalcul intégral vérifiable, manuel d’exploitation opératoire (MOE), indicateurs de pilotage, primes de performance et banc de test de recette.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="bg-slate-800/80 border border-slate-700/80 p-3.5 rounded-2xl text-right">
              <div className="text-[10px] uppercase font-bold text-slate-400">Production Mensuelle Réf.</div>
              <div className="text-xl sm:text-2xl font-black text-amber-400 font-mono">
                {productionMois.toLocaleString('fr-FR')} <span className="text-xs text-white">alv/m</span>
              </div>
              <div className="text-[11px] text-emerald-400 font-semibold">{lotsMois.toLocaleString('fr-FR')} lots de 100</div>
            </div>
          </div>
        </div>

        {/* Sous-onglets de navigation */}
        <div className="flex flex-wrap gap-2 mt-6 pt-6 border-t border-slate-800/80">
          <button
            onClick={() => setActiveSubTab('annexe_c')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'annexe_c'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Calculator className="w-3.5 h-3.5" />
            Annexe C : Hypothèses & Capacité
          </button>

          <button
            onClick={() => setActiveSubTab('annexe_b')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'annexe_b'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <BarChart2 className="w-3.5 h-3.5" />
            Annexe B : KPI & Seuils d'Alerte
          </button>

          <button
            onClick={() => setActiveSubTab('annexe_a')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'annexe_a'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Settings className="w-3.5 h-3.5" />
            Annexe A : Manuel Exploitation (MOE)
          </button>

          <button
            onClick={() => setActiveSubTab('primes')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'primes'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <Award className="w-3.5 h-3.5" />
            Primes de Performance Automatisées
          </button>

          <button
            onClick={() => setActiveSubTab('recette')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'recette'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            Banc de Recette (12 Scénarios)
          </button>

          <button
            onClick={() => setActiveSubTab('regles')}
            className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
              activeSubTab === 'regles'
                ? 'bg-amber-500 text-slate-950 font-black shadow-lg shadow-amber-500/20'
                : 'bg-slate-800/80 text-slate-300 hover:text-white hover:bg-slate-750'
            }`}
          >
            <ShieldAlert className="w-3.5 h-3.5" />
            10 Règles Incontournables & Stocks
          </button>
        </div>
      </div>

      {/* --- SOUS-ONGLET 1 : ANNEXE C --- */}
      {activeSubTab === 'annexe_c' && (
        <div className="space-y-6">
          {/* Note d'auditabilité */}
          <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-xl text-slate-800">
            <div className="flex items-start gap-3">
              <Info className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-amber-950 text-sm">Annexe d'auditabilité — Recalcul intégral possible</h4>
                <p className="text-xs text-amber-900 mt-1">
                  Permet à tout lecteur (banquier, ingénieur, partenaire) de reproduire l’ensemble des calculs sans hypothèse implicite.
                  Tous les paramètres ci-dessous sont ajustables pour tester les scénarios réels ou futurs de l’unité industrielle.
                </p>
              </div>
            </div>
          </div>

          {/* Grille des 4 Piliers de Calcul */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">C.1. Cadence Réelle</div>
              <div className="text-2xl font-black text-slate-900 font-mono mt-1">
                {cadenceReelle.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">alv/h</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Nominale : {cadenceNominale} alv/h • Rendement : {tauxRendementPct}% (micro-arrêts, réglages, contrôle qualité)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">C.2. Production Journalière</div>
              <div className="text-2xl font-black text-indigo-600 font-mono mt-1">
                {productionJour.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">alv/j</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Organisation : 1 shift / jour de {heuresShift} heures effectives (08h00 - 17h00)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm border-amber-300 bg-amber-50/30">
              <div className="text-xs font-bold text-amber-800 uppercase tracking-wider">C.2.2. Référence Mensuelle</div>
              <div className="text-2xl font-black text-amber-600 font-mono mt-1">
                {productionMois.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">alv/m</span>
              </div>
              <div className="text-xs font-bold text-amber-900 mt-2">
                = 3 536 lots de 100 • Valeur de référence unique du dossier (26 jours/mois)
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
              <div className="text-xs font-bold text-slate-500 uppercase tracking-wider">C.3.2. Besoin Papier Mensuel</div>
              <div className="text-2xl font-black text-emerald-600 font-mono mt-1">
                {besoinPapierKgMois.toLocaleString('fr-FR')} <span className="text-xs text-slate-500">kg/m</span>
              </div>
              <div className="text-xs text-slate-500 mt-2">
                Rendement : {rendementPapierAlvKg} alv/kg • Arrondi : 10 100 à 10 200 kg/mois
              </div>
            </div>
          </div>

          {/* Formules Financières & Scénarios Matières */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Tableau des scénarios matière */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Layers className="w-4 h-4 text-amber-600" />
                C.3.3. Scénarios Matière Première (Papier Recyclé)
              </h3>
              <p className="text-xs text-slate-500">
                Hypothèse conservatrice : 35 alvéoles / kg (intègre les pertes d'humidité, variations qualité papier et rebuts partiels).
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Scénario</th>
                      <th className="p-2.5 text-center">Rendement (alv/kg)</th>
                      <th className="p-2.5 text-right rounded-r-lg">Papier requis (kg/mois)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-red-600">Pessimiste</td>
                      <td className="p-2.5 text-center font-mono">33</td>
                      <td className="p-2.5 text-right font-mono font-bold">10 715 kg</td>
                    </tr>
                    <tr className="bg-amber-50/60 font-bold text-amber-950">
                      <td className="p-2.5 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-amber-500"></span>
                        Central (Retenu au dossier)
                      </td>
                      <td className="p-2.5 text-center font-mono text-amber-600 text-sm">35</td>
                      <td className="p-2.5 text-right font-mono text-amber-600 text-sm">10 103 kg</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-emerald-600">Optimisé</td>
                      <td className="p-2.5 text-center font-mono">37</td>
                      <td className="p-2.5 text-right font-mono font-bold">9 556 kg</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-4 bg-slate-50 rounded-xl space-y-2 border border-slate-200 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Coût matière unitaire (225 FCFA / 35) :</span>
                  <span className="font-mono font-bold text-slate-900">{coutMatiereUnitaire} FCFA / alvéole</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Coût matière par lot de 100 :</span>
                  <span className="font-mono font-bold text-indigo-600">{coutMatiereLot} FCFA / lot</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-600">Répartition énergie mensuelle :</span>
                  <span className="font-bold text-slate-700">90% Réseau Senelec + 10% Groupe Électrogène</span>
                </div>
              </div>
            </div>

            {/* Répartition Commerciale Retenue */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <DollarSign className="w-4 h-4 text-emerald-600" />
                C.4. Répartition Commerciale & Chiffre d'Affaires Cible
              </h3>
              <p className="text-xs text-slate-500">
                Conversion de la production mensuelle en lots de 100 alvéoles : 353 600 / 100 = 3 536 lots / mois.
              </p>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Canal de Vente</th>
                      <th className="p-2.5 text-center">Part</th>
                      <th className="p-2.5 text-center">Lots / mois</th>
                      <th className="p-2.5 text-center">Prix Unitaire</th>
                      <th className="p-2.5 text-right rounded-r-lg">CA Mensuel (FCFA)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Contrats producteurs</td>
                      <td className="p-2.5 text-center font-mono">50 %</td>
                      <td className="p-2.5 text-center font-mono font-bold">{lotsContrats.toLocaleString('fr-FR')}</td>
                      <td className="p-2.5 text-center font-mono">30 FCFA (3 000/lot)</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">{caContrats.toLocaleString('fr-FR')}</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-slate-900">Marché ouvert</td>
                      <td className="p-2.5 text-center font-mono">50 %</td>
                      <td className="p-2.5 text-center font-mono font-bold">{lotsMarche.toLocaleString('fr-FR')}</td>
                      <td className="p-2.5 text-center font-mono">35 FCFA (3 500/lot)</td>
                      <td className="p-2.5 text-right font-mono font-bold text-slate-800">{caMarche.toLocaleString('fr-FR')}</td>
                    </tr>
                    <tr className="bg-emerald-50 font-black text-emerald-950">
                      <td className="p-2.5" colSpan={2}>TOTAL MENSUEL</td>
                      <td className="p-2.5 text-center font-mono">{lotsMois.toLocaleString('fr-FR')} lots</td>
                      <td className="p-2.5 text-center">-</td>
                      <td className="p-2.5 text-right font-mono text-emerald-700 text-sm">
                        {caTotalTheorique.toLocaleString('fr-FR')} FCFA
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-900">
                <strong>Référence dossier :</strong> CA 11 492 000 FCFA − OPEX 5 398 500 FCFA = <strong>Marge Brute de 6 093 500 FCFA</strong>.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 2 : ANNEXE B --- */}
      {activeSubTab === 'annexe_b' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg">
                  ANNEXE B — Tableau de Bord des Seuils d'Alerte Opérationnels
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Outil de pilotage – exploitation & supervision. Tous les KPI sont calculables sur site sans logiciel complexe.
                </p>
              </div>
              <span className="px-3 py-1 bg-indigo-100 text-indigo-800 rounded-full text-xs font-bold font-mono">
                Règle unique sans chevauchement
              </span>
            </div>

            <div className="overflow-x-auto mt-4">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Indicateur Clé</th>
                    <th className="p-3 bg-emerald-50 text-emerald-800 text-center font-black">Vert (Nominal)</th>
                    <th className="p-3 bg-amber-50 text-amber-800 text-center font-black">Orange (Attention)</th>
                    <th className="p-3 bg-red-50 text-red-800 text-center font-black rounded-r-xl">Rouge (Alerte / Arrêt)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  <tr className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">Cadence de production (alv/h)</div>
                      <div className="text-[10px] text-slate-500">Fréquence : mesure toutes les 2h</div>
                    </td>
                    <td className="p-3 bg-emerald-50/40 text-center font-mono font-bold text-emerald-700">
                      ≥ 1 700 alv/h
                    </td>
                    <td className="p-3 bg-amber-50/40 text-center font-mono font-bold text-amber-700">
                      1 600 – 1 699 alv/h
                    </td>
                    <td className="p-3 bg-red-50/40 text-center font-mono font-bold text-red-700">
                      &lt; 1 600 alv/h
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">Taux de rebut journalier (%)</div>
                      <div className="text-[10px] text-slate-500">Formule : (Rebuts / Prod totale) × 100</div>
                    </td>
                    <td className="p-3 bg-emerald-50/40 text-center font-mono font-bold text-emerald-700">
                      ≤ 3 %
                    </td>
                    <td className="p-3 bg-amber-50/40 text-center font-mono font-bold text-amber-700">
                      3 % – 5 %
                    </td>
                    <td className="p-3 bg-red-50/40 text-center font-mono font-bold text-red-700">
                      &gt; 5 %
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">Rendement matière (alv / kg)</div>
                      <div className="text-[10px] text-slate-500">Formule : Prod hebdo / papier consommé</div>
                    </td>
                    <td className="p-3 bg-emerald-50/40 text-center font-mono font-bold text-emerald-700">
                      ≥ 35 alv/kg
                    </td>
                    <td className="p-3 bg-amber-50/40 text-center font-mono font-bold text-amber-700">
                      33 – 35 alv/kg
                    </td>
                    <td className="p-3 bg-red-50/40 text-center font-mono font-bold text-red-700">
                      &lt; 33 alv/kg (Dérive matière)
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50">
                    <td className="p-3">
                      <div className="font-bold text-slate-900">Temps d'arrêt non planifié (min/jour)</div>
                      <div className="text-[10px] text-slate-500">Cumul des arrêts non planifiés</div>
                    </td>
                    <td className="p-3 bg-emerald-50/40 text-center font-mono font-bold text-emerald-700">
                      ≤ 30 min
                    </td>
                    <td className="p-3 bg-amber-50/40 text-center font-mono font-bold text-amber-700">
                      30 – 60 min
                    </td>
                    <td className="p-3 bg-red-50/40 text-center font-mono font-bold text-red-700">
                      &gt; 60 min
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Actions Standard Associées */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
              <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 space-y-2">
                <h4 className="font-bold text-amber-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4 text-amber-600" />
                  Actions Standard en Zone Orange
                </h4>
                <ul className="text-xs text-amber-950 space-y-1 list-disc list-inside">
                  <li>Ajustement immédiat des réglages pulpeur / moules</li>
                  <li>Surveillance renforcée du séchoir et de la consistance de la pâte</li>
                  <li>Analyse causale simple par le Chef d'équipe</li>
                </ul>
              </div>

              <div className="p-4 bg-red-50 rounded-xl border border-red-200 space-y-2">
                <h4 className="font-bold text-red-900 text-xs flex items-center gap-1.5 uppercase tracking-wider">
                  <ShieldAlert className="w-4 h-4 text-red-600" />
                  Actions Standard en Zone Rouge
                </h4>
                <ul className="text-xs text-red-950 space-y-1 list-disc list-inside">
                  <li>Arrêt immédiat de la ligne si nécessaire</li>
                  <li>Diagnostic technique immédiat (mécanique / électrique)</li>
                  <li>Correction impérative avant reprise de la fabrication</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Synthèse des KPI Hebdomadaires et Mensuels */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">Disponibilité Machine Cible</div>
              <div className="text-2xl font-black text-slate-900 font-mono">≥ 90 %</div>
              <div className="text-xs text-slate-500">(Temps planifié − arrêts) ÷ temps planifié × 100</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">Heures Homme Shift Référence</div>
              <div className="text-2xl font-black text-indigo-600 font-mono">192 h / semaine</div>
              <div className="text-xs text-slate-500">4 agents × 8 h × 6 jours de travail</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-1">
              <div className="text-[10px] uppercase font-bold text-slate-500">Coût Unitaire de Référence</div>
              <div className="text-2xl font-black text-emerald-600 font-mono">15,3 FCFA / alvéole</div>
              <div className="text-xs text-slate-500">OPEX 5 398 500 FCFA ÷ 353 600 alvéoles</div>
            </div>
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 3 : ANNEXE A --- */}
      {activeSubTab === 'annexe_a' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div>
              <h3 className="font-black text-slate-900 text-lg">
                ANNEXE A — Manuel d’Exploitation Opérationnel (MOE)
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Document opératoire à usage interne site usine. Zéro justification stratégique — procédures applicables telles quelles.
              </p>
            </div>

            {/* Découpage horaire */}
            <div className="space-y-3">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Clock className="w-4 h-4 text-amber-600" />
                A.1. Organisation Quotidienne & Découpage Horaire (08h00 – 17h00)
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 text-xs">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 font-mono">08h00 – 08h30</div>
                  <div className="text-slate-500 mt-1">Ouverture site & contrôles initiaux, vérif. EPI</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="font-bold text-indigo-900 font-mono">08h30 – 12h30</div>
                  <div className="text-indigo-700 mt-1 font-semibold">Production continue (4 heures)</div>
                </div>
                <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <div className="font-bold text-amber-900 font-mono">12h30 – 13h30</div>
                  <div className="text-amber-800 mt-1">Pause équipe / Arrêt ligne standard</div>
                </div>
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl">
                  <div className="font-bold text-indigo-900 font-mono">13h30 – 16h30</div>
                  <div className="text-indigo-700 mt-1 font-semibold">Production continue (3 heures)</div>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900 font-mono">16h30 – 17h00</div>
                  <div className="text-slate-500 mt-1">Nettoyage, vidange pulpeur & fermeture</div>
                </div>
              </div>
              <div className="text-[11px] text-slate-500 italic">
                Durée effective de production : <strong>8 heures / jour</strong>. Aucun fonctionnement de nuit ou heures creuses.
              </div>
            </div>

            {/* Répartition des 4 postes */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-600" />
                A.1.3. Répartition des Rôles par Poste sur le Shift (4 personnes)
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
                <div className="p-4 bg-slate-900 text-white rounded-xl">
                  <div className="font-bold text-amber-400">Chef d'équipe (1 pers.)</div>
                  <div className="text-slate-300 mt-1 text-[11px]">
                    Coordination générale, démarrage/arrêt ligne, validation qualité & saisie de la fiche de production journalière.
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900">Opérateur 1</div>
                  <div className="text-slate-600 mt-1 text-[11px]">
                    Alimentation pulpeur / matière première (tri visuel rapide, pesée papier recyclé, eau).
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900">Opérateur 2</div>
                  <div className="text-slate-600 mt-1 text-[11px]">
                    Surveillance moulage / cadence de transfert (respect de la consigne nominale 1 700 alv/h).
                  </div>
                </div>
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl">
                  <div className="font-bold text-slate-900">Opérateur 3</div>
                  <div className="text-slate-600 mt-1 text-[11px]">
                    Sortie séchoir / empilage & fardelage (fardeaux de 100 unités sous cerclage).
                  </div>
                </div>
              </div>
            </div>

            {/* Typologie des défauts et actions correctives */}
            <div className="space-y-3 pt-4 border-t border-slate-100">
              <h4 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                A.3.2. Typologie des Défauts & Procédure de Rebut Recyclé
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="bg-slate-100 text-slate-700 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5 rounded-l-lg">Défaut Constaté</th>
                      <th className="p-2.5">Cause Probable</th>
                      <th className="p-2.5">Action Corrective Immédiate</th>
                      <th className="p-2.5 text-right rounded-r-lg">Destination Produit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-red-600">Déformation</td>
                      <td className="p-2.5 text-slate-600">Pulpe trop humide / vide insuffisant</td>
                      <td className="p-2.5 text-slate-800">Ajuster pulping & circuit d'aspiration</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">Réintégration pulpeur</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-red-600">Cassure / Fragilité</td>
                      <td className="p-2.5 text-slate-600">Séchage insuffisant ou surchauffe</td>
                      <td className="p-2.5 text-slate-800">Réguler température & allonger cycle séchoir</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">Réintégration pulpeur</td>
                    </tr>
                    <tr className="hover:bg-slate-50">
                      <td className="p-2.5 font-bold text-red-600">Surface irrégulière</td>
                      <td className="p-2.5 text-slate-600">Pulpe hétérogène / grumeaux</td>
                      <td className="p-2.5 text-slate-800">Rebrassage prolongé au pulpeur</td>
                      <td className="p-2.5 text-right font-bold text-amber-700">Réintégration pulpeur</td>
                    </tr>
                  </tbody>
                </table>
              </div>
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-xs text-emerald-900">
                <strong>Procédure de recyclage intégrée :</strong> Les alvéoles non-conformes et rebuts ne sont pas jetés. Ils sont isolés puis réintégrés au pulpeur en dotation <em>« retours recyclés »</em> pour régénérer la pâte à papier.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 4 : PRIMES DE PERFORMANCE AUTOMATISÉES --- */}
      {activeSubTab === 'primes' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <Award className="w-5 h-5 text-amber-500" />
                  Primes Contrôle Performance Automatisée
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Feuille de calcul officielle : distribution des gains selon les 4 leviers industriels (Productivité, Matière, Maintenance, Énergie & Eau).
                </p>
              </div>

              <div className="flex items-center gap-2 bg-slate-100 p-2 rounded-xl text-xs font-mono font-bold">
                <span>Prix Alvéole : <strong className="text-slate-900">35 FCFA</strong></span>
                <span className="text-slate-300">|</span>
                <span>Prix Papier : <strong className="text-slate-900">225 FCFA/kg</strong></span>
              </div>
            </div>

            {/* Tableau Officiel des Primes */}
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-900 text-white font-bold uppercase text-[10px]">
                  <tr>
                    <th className="p-3 rounded-l-xl">Type de performance</th>
                    <th className="p-3 text-right">Gain réalisé (FCFA)</th>
                    <th className="p-3 text-center">Taux de prime</th>
                    <th className="p-3 text-right rounded-r-xl">Prime à verser (FCFA)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {/* Productivité */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                      Productivité
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-emerald-700">
                      {gainProductivite.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">
                      {tauxPrimeProductivite} %
                    </td>
                    <td className="p-3 text-right font-mono font-black text-emerald-700 text-sm">
                      {primeProductivite.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>

                  {/* Rendement matière */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      Rendement matière
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">
                      {gainRendement.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">
                      {tauxPrimeRendement} %
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600 text-sm">
                      {primeRendement.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>

                  {/* Maintenance */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      Maintenance
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">
                      {gainMaintenance.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">
                      {tauxPrimeMaintenance} %
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600 text-sm">
                      {primeMaintenance.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>

                  {/* Énergie & eau */}
                  <tr className="hover:bg-slate-50">
                    <td className="p-3 font-bold text-slate-900 flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-red-400"></span>
                      Énergie & eau
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600">
                      {gainEnergie.toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3 text-center font-mono font-bold text-indigo-600 bg-indigo-50/50">
                      {tauxPrimeEnergie} %
                    </td>
                    <td className="p-3 text-right font-mono font-bold text-red-600 text-sm">
                      {primeEnergie.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>

                  {/* TOTAL NET */}
                  <tr className="bg-amber-50/80 font-black text-amber-950 border-t-2 border-amber-300">
                    <td className="p-3.5 uppercase tracking-wider text-xs">
                      TOTAL PRIME NETTE À VERSER
                    </td>
                    <td className="p-3.5 text-right font-mono text-slate-700">
                      {(gainProductivite + gainRendement + gainMaintenance + gainEnergie).toLocaleString('fr-FR')} FCFA
                    </td>
                    <td className="p-3.5 text-center font-mono text-slate-500">-</td>
                    <td className="p-3.5 text-right font-mono text-amber-800 text-base">
                      {totalPrimeNet.toLocaleString('fr-FR')} FCFA
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Explications & Règles d'application */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-xs space-y-1.5">
                <div className="font-bold text-slate-900">Règle de gestion des primes variables :</div>
                <p className="text-slate-600 leading-relaxed">
                  Le système prend en compte les gains positifs générés (bonus de cadence et surcroît de productivité) et déduit les surconsommations (énergie, eau, maintenance non planifiée et pertes matières).
                </p>
              </div>

              <div className="p-4 bg-indigo-50 rounded-xl border border-indigo-200 text-xs space-y-1.5">
                <div className="font-bold text-indigo-950">Sécurisation & Validation Direction :</div>
                <p className="text-indigo-800 leading-relaxed">
                  Conformément au cahier des charges (section 12.7), les primes calculées sont soumises à la validation formelle de la Direction générale avant imputation sur la paie des équipes.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 5 : BANC DE RECETTE (12 SCÉNARIOS) --- */}
      {activeSubTab === 'recette' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h3 className="font-black text-slate-900 text-lg flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Section 14 — Tests de Recette Avant Mise en Production (12 Tests)
                </h3>
                <p className="text-xs text-slate-500 mt-1">
                  Le logiciel est validé lorsque l'ensemble des 12 scénarios ci-dessous est vérifié avec succès.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="px-3 py-1 bg-emerald-100 text-emerald-800 rounded-full text-xs font-bold">
                  12 / 12 Tests Validés
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5 mt-4">
              {[
                {
                  id: 1,
                  titre: 'Test 1 – Production',
                  desc: 'Saisir une production de 13 600 alvéoles, dont 13 200 conformes et 400 non conformes. Vérifier que les totaux sont cohérents et que le stock conforme augmente uniquement de la quantité validée.',
                  module: 'Production & Stocks'
                },
                {
                  id: 2,
                  titre: 'Test 2 – Rebut',
                  desc: 'Enregistrer une production avec un taux de rebut supérieur à 5 %. Vérifier que le système affiche une alerte rouge et permet d’enregistrer une action corrective.',
                  module: 'Qualité & Alertes'
                },
                {
                  id: 3,
                  titre: 'Test 3 – Approvisionnement matière',
                  desc: 'Enregistrer une réception de papier, puis un tri faisant apparaître une quantité exploitable inférieure à la quantité brute. Vérifier que seul le stock exploitable alimente le calcul des disponibilités de production.',
                  module: 'Stocks & MP'
                },
                {
                  id: 4,
                  titre: 'Test 4 – Sortie vers un commercial',
                  desc: 'Remettre 100 lots à un commercial. Vérifier la diminution du stock usine et l’augmentation équivalente du stock commercial.',
                  module: 'Logistique'
                },
                {
                  id: 5,
                  titre: 'Test 5 – Vente partielle',
                  desc: 'Faire vendre 30 lots par le commercial. Vérifier que son stock diminue de 30 lots et qu’il conserve 70 lots avant tout retour ou mouvement supplémentaire.',
                  module: 'Commercial'
                },
                {
                  id: 6,
                  titre: 'Test 6 – Retour des invendus',
                  desc: 'Faire retourner les 70 lots restants. Vérifier qu’ils restent en attente tant que le magasinier n’a pas contrôlé leur état, puis qu’ils réintègrent le stock approprié après validation.',
                  module: 'Stocks & Retours'
                },
                {
                  id: 7,
                  titre: 'Test 7 – Facture partiellement réglée',
                  desc: 'Créer une facture de 300 000 FCFA et enregistrer un paiement de 200 000 FCFA. Vérifier que le solde client est de 100 000 FCFA et que la trésorerie n’augmente que de 200 000 FCFA.',
                  module: 'Finances & Trésorerie'
                },
                {
                  id: 8,
                  titre: 'Test 8 – Annulation sans écrasement',
                  desc: 'Annuler une vente déjà validée selon la procédure autorisée. Vérifier que l’historique demeure consultable et que les mouvements de stock et de paiement sont corrigés sans effacement des pièces d’origine.',
                  module: 'Audit & Sécurité'
                },
                {
                  id: 9,
                  titre: 'Test 9 – Droits d’accès par profil',
                  desc: 'Connecter un commercial et vérifier qu’il ne peut pas modifier les paramètres financiers, supprimer des factures ou consulter des informations confidentielles.',
                  module: 'RBAC Sécurité'
                },
                {
                  id: 10,
                  titre: 'Test 10 – Cohérence financière',
                  desc: 'Comparer les ventes, paiements, créances, dépenses et trésorerie. Vérifier que chaque indicateur peut être recalculé à partir des opérations qui le composent.',
                  module: 'P&L & Auditabilité'
                },
                {
                  id: 11,
                  titre: 'Test 11 – Concurrence & stock négatif',
                  desc: 'Faire enregistrer des mouvements affectant un même stock. Vérifier qu’aucune sortie ne provoque de stock négatif et que les opérations ne sont pas dupliquées.',
                  module: 'Intégrité Données'
                },
                {
                  id: 12,
                  titre: 'Test 12 – Sauvegarde & Restauration',
                  desc: 'Créer une sauvegarde, simuler une perte de données de test et restaurer l’état attendu. Vérifier que les relations entre les documents et historiques sont préservées.',
                  module: 'Disaster Recovery'
                }
              ].map(test => (
                <div 
                  key={test.id}
                  onClick={() => toggleTest(test.id)}
                  className={`p-4 rounded-xl border transition-all cursor-pointer ${
                    testResults[test.id]
                      ? 'bg-emerald-50/50 border-emerald-200 hover:border-emerald-300'
                      : 'bg-red-50/50 border-red-200 hover:border-red-300'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700">
                          {test.module}
                        </span>
                        <h4 className="font-bold text-slate-900 text-xs">{test.titre}</h4>
                      </div>
                      <p className="text-[11px] text-slate-600 leading-relaxed mt-1">
                        {test.desc}
                      </p>
                    </div>

                    <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center ${
                      testResults[test.id] ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
                    }`}>
                      {testResults[test.id] ? <Check className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- SOUS-ONGLET 6 : LES 10 RÈGLES & 7 CATÉGORIES DE STOCKS --- */}
      {activeSubTab === 'regles' && (
        <div className="space-y-6">
          {/* Les 7 Catégories de Stocks */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <Layers className="w-4 h-4 text-indigo-600" />
              Section 6.1 — Les 7 Catégories de Stocks Distinctes
            </h3>
            <p className="text-xs text-slate-500">
              Une quantité ne doit jamais être considérée comme disponible à la vente simplement parce qu'elle existe physiquement sur le site.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs">
              <div className="p-3.5 bg-slate-50 border border-slate-200 rounded-xl">
                <span className="font-mono text-slate-400 font-bold">01.</span>
                <div className="font-bold text-slate-900 mt-1">Matières premières reçues (avant tri)</div>
                <div className="text-slate-500 text-[11px] mt-0.5">Balles de carton OCC brutes livrées</div>
              </div>

              <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-mono text-emerald-600 font-bold">02.</span>
                <div className="font-bold text-emerald-950 mt-1">Matières exploitables (après tri)</div>
                <div className="text-emerald-700 text-[11px] mt-0.5">Alimente le pulpeur & les calculs de prod</div>
              </div>

              <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl">
                <span className="font-mono text-red-600 font-bold">03.</span>
                <div className="font-bold text-red-950 mt-1">Matières rejetées / en attente</div>
                <div className="text-red-700 text-[11px] mt-0.5">Papiers souillés ou plastique exclu</div>
              </div>

              <div className="p-3.5 bg-indigo-50 border border-indigo-200 rounded-xl">
                <span className="font-mono text-indigo-600 font-bold">04.</span>
                <div className="font-bold text-indigo-950 mt-1">Produits finis conformes à l'usine</div>
                <div className="text-indigo-700 text-[11px] mt-0.5">Disponible pour expédition & livraison</div>
              </div>

              <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl">
                <span className="font-mono text-amber-700 font-bold">05.</span>
                <div className="font-bold text-amber-950 mt-1">Produits confiés aux commerciaux</div>
                <div className="text-amber-800 text-[11px] mt-0.5">Stock individualisé sous responsabilité</div>
              </div>

              <div className="p-3.5 bg-orange-50 border border-orange-200 rounded-xl">
                <span className="font-mono text-orange-600 font-bold">06.</span>
                <div className="font-bold text-orange-950 mt-1">Produits retournés en attente</div>
                <div className="text-orange-800 text-[11px] mt-0.5">Contrôle magasinier avant réintégration</div>
              </div>

              <div className="p-3.5 bg-slate-100 border border-slate-300 rounded-xl col-span-1 sm:col-span-2">
                <span className="font-mono text-slate-500 font-bold">07.</span>
                <div className="font-bold text-slate-900 mt-1">Produits déclassés ou définitivement rebutés</div>
                <div className="text-slate-600 text-[11px] mt-0.5">Réintégrés en pâte moulée au pulpeur (Dotation retours recyclés)</div>
              </div>
            </div>
          </div>

          {/* Les 10 Règles Incontournables */}
          <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-4">
            <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-red-600" />
              Section 11 — Les 10 Règles de Gestion Incontournables
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
              {[
                { r: 'Règle 1', t: 'Aucune entrée en stock commercialisable sans conformité validée', d: 'Les produits non contrôlés ou rejetés ne peuvent pas être vendus comme conformes.' },
                { r: 'Règle 2', t: 'Aucun stock négatif', d: 'Une sortie ne peut être validée si la quantité disponible est insuffisante.' },
                { r: 'Règle 3', t: 'Aucun mouvement sans document', d: 'Toute entrée, sortie, livraison ou correction est reliée à un bon identifiable.' },
                { r: 'Règle 4', t: 'Aucune suppression silencieuse', d: 'Une opération validée est corrigée par une opération inverse traçable.' },
                { r: 'Règle 5', t: 'Séparation des ventes et des encaissements', d: 'L’émission d’une facture ne vaut pas encaissement de trésorerie.' },
                { r: 'Règle 6', t: 'Unicité de la numérotation', d: 'Chaque facture, BL, bon de réception et reçu porte un identifiant unique séquentiel.' },
                { r: 'Règle 7', t: 'Traçabilité des responsabilités', d: 'Auteur, valideur, date et heure sont scellés dans le journal d’audit.' },
                { r: 'Règle 8', t: 'Cohérence des unités', d: 'Distinction claire entre l’alvéole individuelle et le lot de 100 alvéoles.' },
                { r: 'Règle 9', t: 'Protection des données & Rôles', d: 'Informations financières et marge accessibles uniquement aux rôles habilités.' },
                { r: 'Règle 10', t: 'Contrôle des calculs mathématiques', d: 'Tous les indicateurs sont calculés sur des données validées et vérifiables.' },
              ].map((item, idx) => (
                <div key={idx} className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-amber-700 bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                      {item.r}
                    </span>
                    <span className="font-bold text-slate-900">{item.t}</span>
                  </div>
                  <p className="text-[11px] text-slate-600">{item.d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
