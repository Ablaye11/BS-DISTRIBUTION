import React, { useState } from 'react';
import { InterregionalMission, SenegalRegion } from '../../types';
import { Plus, Truck } from 'lucide-react';
import { db } from '../../db/database';

interface MissionsModuleProps {
  missions: InterregionalMission[];
  onRefreshData: () => void;
}

export const MissionsModule: React.FC<MissionsModuleProps> = ({ missions, onRefreshData }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [titre, setTitre] = useState('Tournée Commerciale Région Thiès & Mbour');
  const [responsableNom, setResponsableNom] = useState('Ibrahima Ndiaye');
  const [destinationRegion, setDestinationRegion] = useState<SenegalRegion>('Thiès');
  const [stockDepartOeufs, setStockDepartOeufs] = useState<number>(10000); // 10 000 œufs
  const [stockVenduOeufs, setStockVenduOeufs] = useState<number>(8500);
  const [stockRetourneOeufs, setStockRetourneOeufs] = useState<number>(1200);
  const [stockCasseOeufs, setStockCasseOeufs] = useState<number>(200);
  const [stockOffertOeufs, setStockOffertOeufs] = useState<number>(100);
  
  // Expenses
  const [fraisCarburant, setFraisCarburant] = useState<number>(35000);
  const [fraisHebergement, setFraisHebergement] = useState<number>(20000);
  const [fraisRestauration, setFraisRestauration] = useState<number>(15000);
  const [fraisPeages, setFraisPeages] = useState<number>(8000);
  const [prixMoyenVenteOeuf, setPrixMoyenVenteOeuf] = useState<number>(110);

  const totalFraisMission = fraisCarburant + fraisHebergement + fraisRestauration + fraisPeages;
  const recettesTotalesCalculated = stockVenduOeufs * prixMoyenVenteOeuf;
  const coutMarchandisesOeufs = stockVenduOeufs * 80;
  const beneficeNetCalculated = recettesTotalesCalculated - coutMarchandisesOeufs - totalFraisMission;

  const handleCreateMission = async (e: React.FormEvent) => {
    e.preventDefault();

    const newMission: InterregionalMission = {
      id: `mis-${Date.now()}`,
      titre: titre,
      responsableNom: responsableNom,
      destinationRegion: destinationRegion,
      dateDepart: new Date().toISOString().split('T')[0],
      stockDepartOeufs: Number(stockDepartOeufs),
      stockVenduOeufs: Number(stockVenduOeufs),
      stockRetourneOeufs: Number(stockRetourneOeufs),
      stockCasseOeufs: Number(stockCasseOeufs),
      stockOffertOeufs: Number(stockOffertOeufs),
      fraisTransportFCFA: 0,
      fraisCarburantFCFA: Number(fraisCarburant),
      fraisHebergementFCFA: Number(fraisHebergement),
      fraisRestaurationFCFA: Number(fraisRestauration),
      fraisPeagesFCFA: Number(fraisPeages),
      fraisDiversFCFA: 0,
      recettesTotalesFCFA: recettesTotalesCalculated,
      beneficeNetFCFA: beneficeNetCalculated,
      statut: 'En cours'
    };

    await db.missions.add(newMission);
    setShowAddModal(false);
    onRefreshData();
    alert(`Mission ${titre} enregistrée avec succès ! Bénéfice Net : ${beneficeNetCalculated.toLocaleString()} FCFA.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">MODULE 6 CDC</span>
            <span className="text-xs text-slate-500 font-bold">Tournées & Ventes Interrégionales au Sénégal</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Missions Commerciales Interrégionales</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Ouvrir une Nouvelle Mission
        </button>
      </div>

      {/* Mission Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {missions.map(mis => (
          <div key={mis.id} className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold bg-amber-50 text-amber-900 border border-amber-200 px-2 py-0.5 rounded uppercase">
                  Région : {mis.destinationRegion}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1 font-display">{mis.titre}</h3>
                <p className="text-xs text-slate-500 font-medium">Responsable : {mis.responsableNom} | Début : {mis.dateDepart}</p>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-1 rounded-full ${
                mis.statut === 'En cours' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 animate-pulse' : 'bg-slate-100 text-slate-700'
              }`}>
                {mis.statut}
              </span>
            </div>

            {/* Stock Movement Grid (UNITE EXCLUSIVEMENT ŒUFS) */}
            <div className="grid grid-cols-5 gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 text-center text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Stock Départ</span>
                <span className="font-extrabold text-slate-900">{mis.stockDepartOeufs.toLocaleString()} œufs</span>
              </div>
              <div>
                <span className="text-[10px] text-emerald-700 font-bold block">Vendus</span>
                <span className="font-extrabold text-emerald-700">{mis.stockVenduOeufs.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-blue-700 font-bold block">Retournés</span>
                <span className="font-bold text-blue-700">{mis.stockRetourneOeufs.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-purple-700 font-bold block">Offerts</span>
                <span className="font-bold text-purple-700">{mis.stockOffertOeufs.toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-red-600 font-bold block">Cassés</span>
                <span className="font-bold text-red-600">{mis.stockCasseOeufs.toLocaleString()}</span>
              </div>
            </div>

            {/* Financial Results of Mission */}
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Total Frais Mission (Carburant, Hébergement)</span>
                <span className="text-xs font-bold text-red-600">
                  -{(mis.fraisCarburantFCFA + mis.fraisHebergementFCFA + mis.fraisRestaurationFCFA + mis.fraisPeagesFCFA).toLocaleString()} FCFA
                </span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-slate-500 font-bold block">Bénéfice Net Mission</span>
                <span className="text-sm font-extrabold text-emerald-700">
                  +{mis.beneficeNetFCFA.toLocaleString('fr-FR')} FCFA
                </span>
              </div>
            </div>
          </div>
        ))}
        {missions.length === 0 && (
          <div className="col-span-2 text-center py-12 text-slate-400 text-xs">
            Aucune mission interrégionale enregistrée.
          </div>
        )}
      </div>

      {/* Modal Add Mission */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display flex items-center gap-2">
              <Truck className="w-5 h-5 text-amber-600" /> Enregistrer une Mission Interrégionale
            </h3>

            <form onSubmit={handleCreateMission} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Titre de la Tournée *</label>
                <input 
                  type="text"
                  required
                  value={titre}
                  onChange={(e) => setTitre(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Destination (Région)</label>
                  <select 
                    value={destinationRegion}
                    onChange={(e) => setDestinationRegion(e.target.value as SenegalRegion)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="Thiès">Thiès (Mbour/Tivaouane)</option>
                    <option value="Diourbel">Diourbel (Touba/Mbacké)</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Ziguinchor">Ziguinchor</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsable Mission</label>
                  <input 
                    type="text"
                    value={responsableNom}
                    onChange={(e) => setResponsableNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              {/* Stock Inputs */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-2">
                <span className="text-amber-800 font-extrabold text-[11px] block">Mouvements de Stock d'Œufs (Nombre d'œufs) :</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[10px] text-slate-600 font-bold">Stock Départ</label>
                    <input 
                      type="number"
                      value={stockDepartOeufs}
                      onChange={(e) => setStockDepartOeufs(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-amber-800 font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-emerald-700 font-bold">Stock Vendu</label>
                    <input 
                      type="number"
                      value={stockVenduOeufs}
                      onChange={(e) => setStockVenduOeufs(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-emerald-700 font-extrabold"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-blue-700 font-bold">Stock Retourné</label>
                    <input 
                      type="number"
                      value={stockRetourneOeufs}
                      onChange={(e) => setStockRetourneOeufs(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg p-2 text-blue-700 font-bold"
                    />
                  </div>
                </div>
              </div>

              {/* Frais Inputs */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Frais Carburant (FCFA)</label>
                  <input 
                    type="number"
                    value={fraisCarburant}
                    onChange={(e) => setFraisCarburant(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Hébergement & Repas (FCFA)</label>
                  <input 
                    type="number"
                    value={fraisHebergement}
                    onChange={(e) => setFraisHebergement(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between">
                <span className="font-bold text-slate-700 text-xs">Résultat Net Calculé :</span>
                <span className="font-extrabold text-emerald-700 text-sm">+{beneficeNetCalculated.toLocaleString('fr-FR')} FCFA</span>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button 
                  type="button" 
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl"
                >
                  Annuler
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-amber-500 text-white font-extrabold rounded-xl shadow-md"
                >
                  Valider la Mission
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
