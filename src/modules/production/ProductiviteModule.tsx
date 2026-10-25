import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../../db/database';
import { ProductionShiftRecord, ShiftType } from '../../types';
import { 
  Gauge, TrendingUp, AlertTriangle, CheckCircle2, Clock, 
  Layers, Zap, Droplets, RefreshCw, Plus, Filter, Factory,
  BarChart3, Activity, Award
} from 'lucide-react';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  CartesianGrid, Tooltip, Legend, LineChart, Line 
} from 'recharts';

export const ProductiviteModule: React.FC = () => {
  const shifts = useLiveQuery(() => db.productionShifts.orderBy('date').reverse().toArray()) || [];
  const products = useLiveQuery(() => db.alveoleProducts.toArray()) || [];

  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedShiftFilter, setSelectedShiftFilter] = useState<string>('TOUS');

  // Formulaire nouveau relevé
  const [newShift, setNewShift] = useState<{
    date: string;
    shift: ShiftType;
    ligneProduction: string;
    responsableShift: string;
    produitId: string;
    heuresPlanifiees: number;
    heuresFonctionnement: number;
    heuresArret: number;
    motifArret: string;
    alvéolesConformes: number;
    rebutsKilos: number;
    papierCartonConsommeKg: number;
    adjuvantKg: number;
    energieKwh: number;
    eauRecycleeM3: number;
    cadenceTheorique: number;
    observations: string;
  }>({
    date: new Date().toISOString().split('T')[0],
    shift: 'MATIN_06H_14H',
    ligneProduction: 'Ligne 1 - Mouleuse Rotative 4 Faces (3 200 alv/h)',
    responsableShift: 'Amadou Bâ',
    produitId: products[0]?.id || 'prod-alv-30-std',
    heuresPlanifiees: 8,
    heuresFonctionnement: 7.5,
    heuresArret: 0.5,
    motifArret: '',
    alvéolesConformes: 23000,
    rebutsKilos: 75,
    papierCartonConsommeKg: 1580,
    adjuvantKg: 35,
    energieKwh: 350,
    eauRecycleeM3: 18,
    cadenceTheorique: 3200,
    observations: ''
  });

  // Calcul des métriques globales agrégées
  const totalAlveoles = shifts.reduce((sum, s) => sum + s.alvéolesConformes, 0);
  const totalFardeaux = shifts.reduce((sum, s) => sum + s.fardeauxEmballes, 0);
  const totalRebutsKg = shifts.reduce((sum, s) => sum + s.rebutsKilos, 0);
  const totalPapierKg = shifts.reduce((sum, s) => sum + s.papierCartonConsommeKg, 0);

  const avgTRS = shifts.length > 0 
    ? (shifts.reduce((sum, s) => sum + s.trsOEE, 0) / shifts.length).toFixed(1)
    : '85.0';
  
  const avgDispo = shifts.length > 0
    ? (shifts.reduce((sum, s) => sum + s.tauxDisponibilite, 0) / shifts.length).toFixed(1)
    : '93.5';

  const avgPerf = shifts.length > 0
    ? (shifts.reduce((sum, s) => sum + s.tauxPerformance, 0) / shifts.length).toFixed(1)
    : '95.2';

  const avgQualite = shifts.length > 0
    ? (shifts.reduce((sum, s) => sum + s.tauxQualite, 0) / shifts.length).toFixed(1)
    : '97.1';

  const avgRatio = shifts.length > 0
    ? (shifts.reduce((sum, s) => sum + s.ratioKgPar1000Alveoles, 0) / shifts.length).toFixed(1)
    : '68.8';

  // Soumission nouveau relevé
  const handleSaveShift = async (e: React.FormEvent) => {
    e.preventDefault();
    const prod = products.find(p => p.id === newShift.produitId) || products[0];

    const heuresFonc = Number(newShift.heuresFonctionnement) || 1;
    const heuresPlanif = Number(newShift.heuresPlanifiees) || 8;
    const conformes = Number(newShift.alvéolesConformes) || 0;
    const papierKg = Number(newShift.papierCartonConsommeKg) || 1;
    const cadTheorique = Number(newShift.cadenceTheorique) || 3200;
    const rebutsKg = Number(newShift.rebutsKilos) || 0;

    // Calculs industriels
    const fardeaux = Math.floor(conformes / (prod?.quantiteParFardeau || 100));
    const cadenceReelle = Math.round(conformes / heuresFonc);
    const dispo = Number(((heuresFonc / heuresPlanif) * 100).toFixed(1));
    const perf = Number(((cadenceReelle / cadTheorique) * 100).toFixed(1));
    
    // Estimation rebuts unités (~68g par alvéole 30)
    const poidsUnitaireG = prod?.poidsMoyenGrammes || 68;
    const rebutsUnitesEstimees = Math.round((rebutsKg * 1000) / poidsUnitaireG);
    const totalFabrique = conformes + rebutsUnitesEstimees;
    const qualite = Number(((conformes / (totalFabrique || 1)) * 100).toFixed(1));
    const trs = Number(((dispo * perf * qualite) / 10000).toFixed(1));
    const ratioMatiere = Number(((papierKg / (conformes || 1)) * 1000).toFixed(1));
    const rebutsPct = Number(((rebutsUnitesEstimees / (totalFabrique || 1)) * 100).toFixed(1));

    let statutQC: 'CONFORME' | 'SOUS_SURVEILLANCE' | 'NON_CONFORME' = 'CONFORME';
    if (trs < 75 || rebutsPct > 5) statutQC = 'SOUS_SURVEILLANCE';
    if (trs < 65 || rebutsPct > 8) statutQC = 'NON_CONFORME';

    const record: ProductionShiftRecord = {
      id: `shift-${Date.now()}`,
      date: newShift.date,
      shift: newShift.shift,
      ligneProduction: newShift.ligneProduction,
      responsableShift: newShift.responsableShift,
      produitId: prod?.id || 'prod-alv-30-std',
      produitNom: prod?.nom || 'Plateau 30 Œufs',
      heuresPlanifiees: heuresPlanif,
      heuresFonctionnement: heuresFonc,
      heuresArret: Number(newShift.heuresArret) || 0,
      motifArret: newShift.motifArret,
      alvéolesConformes: conformes,
      fardeauxEmballes: fardeaux,
      rebutsKilos: rebutsKg,
      rebutsPourcentage: rebutsPct,
      papierCartonConsommeKg: papierKg,
      adjuvantKg: Number(newShift.adjuvantKg) || 0,
      energieKwh: Number(newShift.energieKwh) || 0,
      eauRecycleeM3: Number(newShift.eauRecycleeM3) || 0,
      cadenceHoraireReelle: cadenceReelle,
      cadenceTheorique: cadTheorique,
      tauxDisponibilite: dispo,
      tauxPerformance: perf,
      tauxQualite: qualite,
      trsOEE: trs,
      ratioKgPar1000Alveoles: ratioMatiere,
      statutControleQualite: statutQC,
      observations: newShift.observations
    };

    await db.productionShifts.add(record);

    // Mettre à jour le stock de produit fini
    if (prod) {
      await db.alveoleProducts.update(prod.id, {
        stockFardeaux: prod.stockFardeaux + fardeaux,
        stockTotalUnites: prod.stockTotalUnites + conformes
      });
    }

    // Déduire la matière première carton consommée
    const mpCarton = await db.rawMaterials.where('categorie').equals('PAPIER_CARTON').first();
    if (mpCarton) {
      await db.rawMaterials.update(mpCarton.id, {
        stockActuel: Math.max(0, mpCarton.stockActuel - papierKg)
      });
    }

    // Notification système
    await db.notifications.add({
      id: `notif-${Date.now()}`,
      type: 'production',
      title: `Rapport de Production Shift Enregistré`,
      message: `${conformes.toLocaleString()} alvéoles conformes (${fardeaux} fardeaux) produites. TRS : ${trs}%.`,
      date: newShift.date,
      isRead: false
    });

    setShowAddModal(false);
  };

  // Données pour graphiques Recharts
  const chartData = [...shifts].reverse().map(s => ({
    nom: `${s.date.slice(5)} (${s.shift === 'MATIN_06H_14H' ? 'Matin' : s.shift === 'SOIR_14H_22H' ? 'Soir' : 'Nuit'})`,
    alvéoles: s.alvéolesConformes,
    cadenceReelle: s.cadenceHoraireReelle,
    cadenceTheorique: s.cadenceTheorique,
    trs: s.trsOEE,
    rebutsKg: s.rebutsKilos
  }));

  const filteredShifts = selectedShiftFilter === 'TOUS' 
    ? shifts 
    : shifts.filter(s => s.shift === selectedShiftFilter);

  return (
    <div className="space-y-6">
      {/* En-tête du module */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-800 to-indigo-950 p-6 rounded-2xl text-white shadow-xl border border-slate-700/60">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Lignes de Production Opérationnelles
            </span>
            <span className="text-xs text-slate-400">• Unité de Pâte Moulée</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Indicateurs de Productivité & Pilotage Usine
          </h1>
          <p className="text-sm text-slate-300 mt-1 max-w-2xl">
            Suivi des cadences de moulage, calcul du Taux de Rendement Synthétique (TRS / OEE), maîtrise des rebuts recyclés et consommation matière.
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold transition-all shadow-lg hover:shadow-amber-500/25 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Nouveau Relevé de Shift
        </button>
      </div>

      {/* Cartes Cadrans KPIs TRS Industriels */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* TRS / OEE */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm relative overflow-hidden group hover:border-amber-300 transition-all">
          <div className="absolute top-0 right-0 w-24 h-24 bg-amber-50 rounded-bl-full -z-0 opacity-60"></div>
          <div className="flex items-center justify-between relative z-10">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">TRS / OEE Global</span>
            <span className={`p-2 rounded-lg ${Number(avgTRS) >= 80 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
              <Gauge className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3 relative z-10">
            <div className="text-3xl font-black text-slate-900 tracking-tight">{avgTRS}%</div>
            <div className="flex items-center gap-1.5 mt-1 text-xs">
              <span className="font-semibold text-emerald-600">Dispo × Perf × Qualité</span>
              <span className="text-slate-400">• Obj: &gt;85%</span>
            </div>
          </div>
          {/* Barre de progression TRS */}
          <div className="w-full bg-slate-100 h-2 rounded-full mt-3 overflow-hidden">
            <div 
              className={`h-full rounded-full ${Number(avgTRS) >= 80 ? 'bg-emerald-500' : 'bg-amber-500'}`}
              style={{ width: `${Math.min(100, Number(avgTRS))}%` }}
            ></div>
          </div>
        </div>

        {/* Taux Disponibilité */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-blue-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Disponibilité</span>
            <span className="p-2 rounded-lg bg-blue-50 text-blue-600">
              <Clock className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{avgDispo}%</div>
            <p className="text-xs text-slate-500 mt-1">Temps de marche réel / planifié</p>
          </div>
        </div>

        {/* Taux Performance */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-indigo-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Performance Cadence</span>
            <span className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
              <Zap className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{avgPerf}%</div>
            <p className="text-xs text-slate-500 mt-1">Cadence réelle vs nominale (3 200/h)</p>
          </div>
        </div>

        {/* Taux Qualité */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-emerald-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Qualité Produits</span>
            <span className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
              <CheckCircle2 className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{avgQualite}%</div>
            <p className="text-xs text-slate-500 mt-1">Alvéoles conformes / Total produit</p>
          </div>
        </div>

        {/* Ratio Matière Première */}
        <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm hover:border-purple-300 transition-all">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Ratio Papier / 1k</span>
            <span className="p-2 rounded-lg bg-purple-50 text-purple-600">
              <Layers className="w-5 h-5" />
            </span>
          </div>
          <div className="mt-3">
            <div className="text-3xl font-black text-slate-900">{avgRatio} <span className="text-sm font-semibold text-slate-500">kg</span></div>
            <p className="text-xs text-slate-500 mt-1">Carton consommé pour 1 000 alvéoles</p>
          </div>
        </div>
      </div>

      {/* Graphiques de Productivité */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Évolution de la production & cadences */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-indigo-600" />
                Production d'Alvéoles par Shift & Cadences Horaires
              </h2>
              <p className="text-xs text-slate-500">Unités conformes emballées et cadences observées sur la ligne rotative</p>
            </div>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="nom" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="left" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis yAxisId="right" orientation="right" stroke="#4F46E5" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Bar yAxisId="left" dataKey="alvéoles" name="Alvéoles Conformes" fill="#3B82F6" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="cadenceReelle" name="Cadence Réelle (alv/h)" stroke="#10B981" strokeWidth={3} dot={{ r: 4 }} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Évolution du TRS & Rebuts */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-sm">
          <div className="mb-4">
            <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Activity className="w-5 h-5 text-amber-600" />
              Évolution TRS & Taux de Rebuts
            </h2>
            <p className="text-xs text-slate-500">Maintien de l'excellence industrielle et recyclage pâte</p>
          </div>

          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData} margin={{ top: 10, right: 10, left: -10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                <XAxis dataKey="nom" stroke="#64748B" fontSize={11} tickLine={false} />
                <YAxis stroke="#64748B" fontSize={11} tickLine={false} domain={[50, 100]} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#0F172A', color: '#fff', borderRadius: '8px', border: 'none' }}
                />
                <Legend wrapperStyle={{ paddingTop: '10px' }} />
                <Line type="monotone" dataKey="trs" name="TRS / OEE (%)" stroke="#F59E0B" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Tableau détaillé des Relevés de Production de Shifts */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden">
        <div className="p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <Factory className="w-5 h-5 text-slate-700" />
              Historique des Relevés de Shifts & Contrôles Qualité
            </h3>
            <p className="text-xs text-slate-500">Relevés enregistrés par les chefs de quart avec traçabilité complète</p>
          </div>

          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-slate-400" />
            <select
              value={selectedShiftFilter}
              onChange={(e) => setSelectedShiftFilter(e.target.value)}
              className="text-xs font-medium bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="TOUS">Tous les shifts</option>
              <option value="MATIN_06H_14H">Shift Matin (06h - 14h)</option>
              <option value="SOIR_14H_22H">Shift Soir (14h - 22h)</option>
              <option value="NUIT_22H_06H">Shift Nuit (22h - 06h)</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/75 text-slate-500 uppercase tracking-wider border-b border-slate-200/60 font-semibold">
              <tr>
                <th className="py-3 px-4">Date & Shift</th>
                <th className="py-3 px-4">Ligne & Responsable</th>
                <th className="py-3 px-4">Produit Fabriqué</th>
                <th className="py-3 px-4 text-right">Alvéoles Conformes</th>
                <th className="py-3 px-4 text-right">Fardeaux</th>
                <th className="py-3 px-4 text-right">Cadence (h)</th>
                <th className="py-3 px-4 text-right">Carton (kg)</th>
                <th className="py-3 px-4 text-right">Rebuts</th>
                <th className="py-3 px-4 text-center">TRS / OEE</th>
                <th className="py-3 px-4 text-center">Contrôle Qualité</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700 font-medium">
              {filteredShifts.map((s) => {
                const shiftLabel = s.shift === 'MATIN_06H_14H' ? 'Matin' : s.shift === 'SOIR_14H_22H' ? 'Soir' : 'Nuit';
                const shiftBadgeColor = s.shift === 'MATIN_06H_14H' 
                  ? 'bg-amber-50 text-amber-700 border-amber-200' 
                  : s.shift === 'SOIR_14H_22H' 
                  ? 'bg-blue-50 text-blue-700 border-blue-200' 
                  : 'bg-purple-50 text-purple-700 border-purple-200';

                return (
                  <tr key={s.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="font-bold text-slate-900">{s.date}</div>
                      <span className={`inline-block px-2 py-0.5 mt-0.5 rounded-full text-[10px] font-semibold border ${shiftBadgeColor}`}>
                        Shift {shiftLabel}
                      </span>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="text-slate-900 font-semibold">{s.responsableShift}</div>
                      <div className="text-slate-400 text-[11px] truncate max-w-[180px]">{s.ligneProduction}</div>
                    </td>
                    <td className="py-3.5 px-4 font-semibold text-slate-800">
                      {s.produitNom}
                    </td>
                    <td className="py-3.5 px-4 text-right font-black text-slate-900 text-sm">
                      {s.alvéolesConformes.toLocaleString()}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-indigo-600">
                      {s.fardeauxEmballes} fard.
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-bold text-slate-900">{s.cadenceHoraireReelle.toLocaleString()}</span>
                      <span className="text-[10px] text-slate-400 block">/ {s.cadenceTheorique}</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold text-slate-900">{s.papierCartonConsommeKg} kg</span>
                      <span className="text-[10px] text-slate-400 block">{s.ratioKgPar1000Alveoles} kg/1k</span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <span className="font-semibold text-red-600">{s.rebutsKilos} kg</span>
                      <span className="text-[10px] text-slate-400 block">({s.rebutsPourcentage}%)</span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-bold text-xs ${
                        s.trsOEE >= 85 ? 'bg-emerald-100 text-emerald-800' :
                        s.trsOEE >= 75 ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {s.trsOEE}%
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold ${
                        s.statutControleQualite === 'CONFORME'
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : s.statutControleQualite === 'SOUS_SURVEILLANCE'
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-red-50 text-red-700 border border-red-200'
                      }`}>
                        {s.statutControleQualite === 'CONFORME' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                        {s.statutControleQualite === 'SOUS_SURVEILLANCE' && <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />}
                        {s.statutControleQualite}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal d'ajout de nouveau relevé de production */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-200 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <span className="p-2 rounded-xl bg-amber-100 text-amber-800">
                  <Factory className="w-5 h-5" />
                </span>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Nouveau Relevé de Shift de Production</h3>
                  <p className="text-xs text-slate-500">Enregistrement des cadences, des quantités et calcul automatique du TRS</p>
                </div>
              </div>
              <button 
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100 transition-colors"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveShift} className="mt-5 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Date</label>
                  <input
                    type="date"
                    value={newShift.date}
                    onChange={e => setNewShift({ ...newShift, date: e.target.value })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Shift</label>
                  <select
                    value={newShift.shift}
                    onChange={e => setNewShift({ ...newShift, shift: e.target.value as ShiftType })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="MATIN_06H_14H">Shift Matin (06h - 14h)</option>
                    <option value="SOIR_14H_22H">Shift Soir (14h - 22h)</option>
                    <option value="NUIT_22H_06H">Shift Nuit (22h - 06h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Responsable Shift</label>
                  <input
                    type="text"
                    value={newShift.responsableShift}
                    onChange={e => setNewShift({ ...newShift, responsableShift: e.target.value })}
                    placeholder="Nom du chef de quart"
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Ligne de Production</label>
                  <select
                    value={newShift.ligneProduction}
                    onChange={e => setNewShift({ ...newShift, ligneProduction: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    <option value="Ligne 1 - Mouleuse Rotative 4 Faces (3 200 alv/h)">Ligne 1 - Rotative 4 Faces (3 200 alv/h)</option>
                    <option value="Ligne 2 - Mouleuse Alternative Standard (1 600 alv/h)">Ligne 2 - Alternative Standard (1 600 alv/h)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Format d'Alvéole Produit</label>
                  <select
                    value={newShift.produitId}
                    onChange={e => setNewShift({ ...newShift, produitId: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 focus:ring-2 focus:ring-amber-500"
                  >
                    {products.map(p => (
                      <option key={p.id} value={p.id}>{p.nom} ({p.quantiteParFardeau} pcs/fardeau)</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Temps de marche */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/80 grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heures Planifiées</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newShift.heuresPlanifiees}
                    onChange={e => setNewShift({ ...newShift, heuresPlanifiees: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Heures de Marche</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newShift.heuresFonctionnement}
                    onChange={e => setNewShift({ ...newShift, heuresFonctionnement: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-slate-600 mb-1">Arrêts (heures)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={newShift.heuresArret}
                    onChange={e => setNewShift({ ...newShift, heuresArret: Number(e.target.value) })}
                    className="w-full text-xs p-2 rounded-lg border border-slate-200 bg-white"
                  />
                </div>
              </div>

              {/* Quantités et Rebuts */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Alvéoles Conformes (Unités)</label>
                  <input
                    type="number"
                    value={newShift.alvéolesConformes}
                    onChange={e => setNewShift({ ...newShift, alvéolesConformes: Number(e.target.value) })}
                    required
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold text-slate-900"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rebuts / Casses (Kg recyclé)</label>
                  <input
                    type="number"
                    value={newShift.rebutsKilos}
                    onChange={e => setNewShift({ ...newShift, rebutsKilos: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold text-red-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Papier Carton Consommé (Kg)</label>
                  <input
                    type="number"
                    value={newShift.papierCartonConsommeKg}
                    onChange={e => setNewShift({ ...newShift, papierCartonConsommeKg: Number(e.target.value) })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-semibold text-slate-800"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Motif d'arrêt machine (si applicable)</label>
                <input
                  type="text"
                  value={newShift.motifArret}
                  onChange={e => setNewShift({ ...newShift, motifArret: e.target.value })}
                  placeholder="Ex: Nettoyage moules, bourrage sortie séchoir..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Observations & Tenue mécanique</label>
                <textarea
                  rows={2}
                  value={newShift.observations}
                  onChange={e => setNewShift({ ...newShift, observations: e.target.value })}
                  placeholder="Remarques sur la rigidité, la coloration, le séchage..."
                  className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md transition-all active:scale-95"
                >
                  Valider & Enregistrer le Relevé
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
