import React, { useState } from 'react';
import { Poulailler, SenegalRegion } from '../../types';
import { Plus, Phone, MapPin } from 'lucide-react';
import { db } from '../../db/database';

interface PoulaillersModuleProps {
  poulaillers: Poulailler[];
  onRefreshData: () => void;
}

export const PoulaillersModule: React.FC<PoulaillersModuleProps> = ({ poulaillers, onRefreshData }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [nom, setNom] = useState('');
  const [proprietaire, setProprietaire] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('Keur Massar');
  const [region, setRegion] = useState<SenegalRegion>('Dakar');
  const [capacitePoulets, setCapacitePoulets] = useState<number>(4000);
  const [productionJournaliereOeufs, setProductionJournaliereOeufs] = useState<number>(3200);
  const [tauxCommissionPercent, setTauxCommissionPercent] = useState<number>(2.5);

  const handleCreatePoulailler = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom || !telephone) {
      alert('Veuillez renseigner le nom du poulailler et le numéro de téléphone.');
      return;
    }

    const newFarm: Poulailler = {
      id: `poul-${Date.now()}`,
      nom: nom,
      proprietaire: proprietaire || nom,
      telephone: telephone,
      adresse: adresse,
      region: region,
      departement: 'Keur Massar',
      commune: 'Keur Massar',
      gps: { latitude: 14.7810, longitude: -17.3115, timestamp: new Date().toISOString() },
      capacitePoulets: Number(capacitePoulets),
      productionJournaliereOeufs: Number(productionJournaliereOeufs),
      demarcheurId: 'd-1',
      demarcheurName: 'Moussa Kane (Démarcheur)',
      status: 'Fournisseur Actif',
      tauxCommissionPercent: Number(tauxCommissionPercent),
      createdAt: new Date().toISOString()
    };

    await db.poulaillers.add(newFarm);
    setShowAddModal(false);
    onRefreshData();
    alert(`Poulailler ${nom} enrôlé avec succès ! Taux commission : ${tauxCommissionPercent}%.`);
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-purple-600 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">ESPACE DÉMARCHEUR</span>
            <span className="text-xs text-slate-500 font-bold">Enrôlement des Fermes & Poulaillers Partenaires</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Pipeline & Référentiel des Poulaillers</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Enrôler un Nouveau Poulailler
        </button>
      </div>

      {/* Poulaillers Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {poulaillers.map(f => (
          <div key={f.id} className="glass-card p-5 rounded-2xl border border-purple-200 bg-white space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold bg-purple-100 text-purple-800 border border-purple-200 px-2 py-0.5 rounded uppercase">
                  {f.status}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1.5 font-display">{f.nom}</h3>
              </div>
              <span className="text-xs font-extrabold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-full border border-amber-200">
                Comm. {f.tauxCommissionPercent}%
              </span>
            </div>

            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-purple-600" /> {f.proprietaire} ({f.telephone})</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {f.adresse}, {f.region}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Capacité Poulets</span>
                <span className="font-extrabold text-slate-900">{f.capacitePoulets.toLocaleString()} volailles</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-purple-700 font-bold block">Ponte Journalière</span>
                <span className="font-extrabold text-amber-700">{f.productionJournaliereOeufs.toLocaleString()} œufs/jour</span>
              </div>
            </div>
          </div>
        ))}
        {poulaillers.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Aucun poulailler enrôlé pour le moment.
          </div>
        )}
      </div>

      {/* Modal Add Poulailler */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Enrôler un Nouveau Poulailler</h3>
            <form onSubmit={handleCreatePoulailler} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom du Poulailler / Ferme *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Poulailler Bio Mounawara"
                  value={nom}
                  onChange={(e) => setNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Propriétaire / Contact</label>
                  <input 
                    type="text"
                    placeholder="El Hadj Ndiaye"
                    value={proprietaire}
                    onChange={(e) => setProprietaire(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone *</label>
                  <input 
                    type="text"
                    required
                    placeholder="77 444 33 22"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Capacité Poulets</label>
                  <input 
                    type="number"
                    value={capacitePoulets}
                    onChange={(e) => setCapacitePoulets(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Ponte Journalière (ŒUFS)</label>
                  <input 
                    type="number"
                    value={productionJournaliereOeufs}
                    onChange={(e) => setProductionJournaliereOeufs(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-amber-700 font-extrabold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">% Commission Démarcheur *</label>
                <input 
                  type="number"
                  step="0.1"
                  required
                  value={tauxCommissionPercent}
                  onChange={(e) => setTauxCommissionPercent(Number(e.target.value))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-purple-700 font-extrabold"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-purple-600 text-white font-extrabold rounded-xl shadow-md">Enrôler Poulailler</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
