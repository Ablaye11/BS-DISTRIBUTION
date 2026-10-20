import React, { useState } from 'react';
import { DeliveryMissionPlanner, SenegalRegion } from '../../types';
import { Plus, CheckCircle2 } from 'lucide-react';
import { db } from '../../db/database';

interface DeliveryPlannerModuleProps {
  deliveries: DeliveryMissionPlanner[];
  onRefreshData: () => void;
}

export const DeliveryPlannerModule: React.FC<DeliveryPlannerModuleProps> = ({ deliveries, onRefreshData }) => {
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [factureNumero, setFactureNumero] = useState('FAC-2602-0002');
  const [clientNom, setClientNom] = useState('Tangana Chez Modou');
  const [telephone, setTelephone] = useState('76 999 11 22');
  const [adresse, setAdresse] = useState('Médinatoul Mounawara, Keur Massar');
  const [region, setRegion] = useState<SenegalRegion>('Dakar');
  const [quantiteOeufs, setQuantiteOeufs] = useState<number>(600);
  const [livreurNom, setLivreurNom] = useState('Amadou Sow');
  const [vehiculeType, setVehiculeType] = useState('Tricycle Frigorifique N° 04');

  const handleUpdateStatus = async (id: string, newStatut: any) => {
    await db.deliveries.update(id, { statut: newStatut });
    onRefreshData();
    alert(`Statut de la livraison mis à jour : ${newStatut}`);
  };

  const handleCreateDelivery = async (e: React.FormEvent) => {
    e.preventDefault();
    const now = new Date();
    const yymm = `${now.getFullYear().toString().slice(2)}${(now.getMonth() + 1).toString().padStart(2, '0')}`;
    const seq = (deliveries.length + 1).toString().padStart(4, '0');
    const numeroBL = `BL-${yymm}-${seq}`;

    const newDel: DeliveryMissionPlanner = {
      id: `del-${Date.now()}`,
      numeroBL: numeroBL,
      factureNumero: factureNumero,
      clientNom: clientNom,
      telephone: telephone,
      adresse: adresse,
      region: region,
      commune: 'Keur Massar',
      quantiteOeufs: Number(quantiteOeufs),
      livreurNom: livreurNom,
      vehiculeType: vehiculeType,
      datePlanifiee: new Date().toISOString().split('T')[0],
      statut: 'En cours de livraison'
    };

    await db.deliveries.add(newDel);
    setShowAddModal(false);
    onRefreshData();
    alert(`Bon de livraison ${numeroBL} créé et affecté à ${livreurNom} !`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">SECTION 14 CDC</span>
            <span className="text-xs text-slate-500 font-bold">Planification & Affectation des Équipes de Livraison</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Gestion des Livraisons Terrain & Bons de Livraison (BL)</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all"
        >
          <Plus className="w-4 h-4" /> Planifier une Livraison
        </button>
      </div>

      {/* Deliveries Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {deliveries.map(d => (
          <div key={d.id} className="glass-card p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-extrabold text-amber-800 block">{d.numeroBL}</span>
                <span className="text-[10px] text-slate-500 font-medium">Facture liée : {d.factureNumero}</span>
              </div>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${
                d.statut === 'Livrée' ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' :
                d.statut === 'En cours de livraison' ? 'bg-amber-100 text-amber-900 border border-amber-300 animate-pulse' :
                'bg-slate-100 text-slate-700'
              }`}>
                {d.statut}
              </span>
            </div>

            <div className="text-xs text-slate-800 space-y-1 font-medium">
              <h4 className="font-extrabold text-slate-900 text-sm font-display">{d.clientNom}</h4>
              <p className="text-slate-600">{d.adresse} ({d.region})</p>
              <p className="text-slate-500">Tél: {d.telephone}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Livreur & Véhicule</span>
                <span className="font-extrabold text-slate-900">{d.livreurNom}</span>
                <span className="text-[10px] text-slate-500 font-medium block">{d.vehiculeType}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 font-bold block">Quantité Chargée</span>
                <span className="font-extrabold text-amber-800 text-sm">{d.quantiteOeufs.toLocaleString()} œufs</span>
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
              {d.statut !== 'Livrée' && (
                <button
                  onClick={() => handleUpdateStatus(d.id, 'Livrée')}
                  className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl transition-all flex items-center justify-center gap-1 shadow-sm"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" /> Confirmer Livrée
                </button>
              )}
            </div>
          </div>
        ))}
        {deliveries.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs">
            Aucune livraison planifiée.
          </div>
        )}
      </div>

      {/* Modal Add Delivery */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Planifier une Livraison</h3>
            <form onSubmit={handleCreateDelivery} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Client Destinataire *</label>
                <input 
                  type="text" 
                  required
                  value={clientNom}
                  onChange={(e) => setClientNom(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone *</label>
                  <input 
                    type="text" 
                    required
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Quantité (ŒUFS) *</label>
                  <input 
                    type="number" 
                    required
                    value={quantiteOeufs}
                    onChange={(e) => setQuantiteOeufs(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-amber-700 font-extrabold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Livreur Assigné</label>
                  <input 
                    type="text" 
                    value={livreurNom}
                    onChange={(e) => setLivreurNom(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Véhicule</label>
                  <input 
                    type="text" 
                    value={vehiculeType}
                    onChange={(e) => setVehiculeType(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-extrabold rounded-xl shadow-md">Valider Livraison & BL</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
