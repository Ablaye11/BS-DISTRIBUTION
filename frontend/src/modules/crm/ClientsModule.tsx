import React, { useState } from 'react';
import { Client, SenegalRegion, ClientCategory } from '../../types';
import { Search, Phone, MapPin, Plus } from 'lucide-react';
import { db } from '../../db/database';

interface ClientsModuleProps {
  clients: Client[];
  currentUser: import('../../types').User;
  onRefreshData: () => void;
}

export const ClientsModule: React.FC<ClientsModuleProps> = ({ clients, currentUser, onRefreshData }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRegion, setSelectedRegion] = useState<string>('TOUTES');
  const [selectedCategory, setSelectedCategory] = useState<string>('TOUTES');
  const [showAddModal, setShowAddModal] = useState(false);

  // Form State
  const [raisonSociale, setRaisonSociale] = useState('');
  const [responsable, setResponsable] = useState('');
  const [telephone, setTelephone] = useState('');
  const [adresse, setAdresse] = useState('Keur Massar');
  const [region, setRegion] = useState<SenegalRegion>('Dakar');
  const [categorie, setCategorie] = useState<ClientCategory>('Tangana');

  const handleCreateClient = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!raisonSociale || !telephone) {
      alert('Veuillez renseigner la raison sociale et le téléphone.');
      return;
    }

    const newClient: Client = {
      id: `cli-${Date.now()}`,
      raisonSociale: raisonSociale,
      responsable: responsable || raisonSociale,
      telephone: telephone,
      adresse: adresse,
      region: region,
      departement: 'Keur Massar',
      commune: 'Keur Massar',
      gps: { latitude: 14.7794, longitude: -17.3129, timestamp: new Date().toISOString() },
      categorie: categorie,
      commercialId: currentUser.id,
      commercialName: currentUser.name,
      soldeCreance: 0,
      totalAchatsFCFA: 0,
      createdAt: new Date().toISOString()
    };

    await db.clients.add(newClient);
    setShowAddModal(false);
    onRefreshData();
    alert(`Client ${raisonSociale} ajouté avec succès !`);
  };

  const filteredClients = clients.filter(c => 
    (selectedRegion === 'TOUTES' || c.region === selectedRegion) &&
    (selectedCategory === 'TOUTES' || c.categorie === selectedCategory) &&
    (c.raisonSociale.toLowerCase().includes(searchTerm.toLowerCase()) || c.telephone.includes(searchTerm))
  );

  const totalCreances = clients.reduce((sum, c) => sum + (c.soldeCreance || 0), 0);
  const totalAchats = clients.reduce((sum, c) => sum + (c.totalAchatsFCFA || 0), 0);

  return (
    <div className="space-y-6 bg-white p-4 md:p-6 rounded-3xl border border-slate-200 shadow-sm font-sans">
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-2xl border border-slate-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs bg-emerald-600 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">MODULE CLIENTS</span>
            <span className="text-xs text-slate-500 font-bold">Portefeuille Clients & Créances en FCFA</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 mt-1 font-display">Gestion Détaillée des Clients</h2>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2 transition-all active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nouveau Client
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl border border-emerald-200 bg-white shadow-sm">
          <span className="text-xs text-slate-600 font-bold">Total Clients Référencés</span>
          <p className="text-2xl font-extrabold text-emerald-700 mt-1.5">{clients.length} clients</p>
        </div>

        <div className="p-4 rounded-2xl border border-red-200 bg-white shadow-sm">
          <span className="text-xs text-slate-600 font-bold">Total Créances Clients</span>
          <p className="text-2xl font-extrabold text-red-600 mt-1.5">{totalCreances.toLocaleString('fr-FR')} FCFA</p>
        </div>

        <div className="p-4 rounded-2xl border border-amber-200 bg-white shadow-sm">
          <span className="text-xs text-slate-600 font-bold">Volume d'Achats Cumulé</span>
          <p className="text-2xl font-extrabold text-amber-700 mt-1.5">{totalAchats.toLocaleString('fr-FR')} FCFA</p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 p-4 bg-white rounded-2xl border border-slate-200 shadow-sm text-xs">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Rechercher raison sociale, téléphone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-300 text-slate-900 font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="bg-white text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="TOUTES">Toutes les Catégories</option>
            <option value="Grossiste">Grossiste</option>
            <option value="Supérette">Supérette</option>
            <option value="Mini-market">Mini-market</option>
            <option value="Fast-food">Fast-food</option>
            <option value="Boutique">Boutique</option>
            <option value="Tangana">Tangana</option>
          </select>

          <select 
            value={selectedRegion}
            onChange={(e) => setSelectedRegion(e.target.value)}
            className="bg-white text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500 shadow-xs"
          >
            <option value="TOUTES">Toutes les Régions (Sénégal)</option>
            <option value="Dakar">Dakar / Keur Massar</option>
            <option value="Thiès">Thiès</option>
            <option value="Diourbel">Diourbel (Touba)</option>
          </select>
        </div>
      </div>

      {/* Clients Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredClients.map(c => (
          <div key={c.id} className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between">
              <div>
                <span className="text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 px-2 py-0.5 rounded uppercase">
                  {c.categorie}
                </span>
                <h3 className="font-extrabold text-slate-900 text-base mt-1.5 font-display">{c.raisonSociale}</h3>
              </div>
              {c.soldeCreance > 0 ? (
                <span className="text-[10px] bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded font-extrabold">
                  Crédit: {c.soldeCreance.toLocaleString()} F
                </span>
              ) : (
                <span className="text-[10px] bg-emerald-100 text-emerald-800 px-2 py-1 rounded font-bold">
                  Solde 0 FCFA
                </span>
              )}
            </div>

            <div className="text-xs text-slate-700 space-y-1 font-medium">
              <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-emerald-600" /> {c.telephone} ({c.responsable})</p>
              <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" /> {c.adresse}, {c.region}</p>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] text-slate-500 font-bold block">Commercial Responsable</span>
                <span className="font-bold text-slate-900">{c.commercialName}</span>
              </div>
              <div className="text-right">
                <span className="text-[10px] text-amber-700 font-bold block">Achats Cumulés</span>
                <span className="font-extrabold text-amber-800">{c.totalAchatsFCFA.toLocaleString('fr-FR')} FCFA</span>
              </div>
            </div>
          </div>
        ))}
        {filteredClients.length === 0 && (
          <div className="col-span-3 text-center py-12 text-slate-400 text-xs bg-white rounded-2xl border border-slate-200">
            Aucun client trouvé.
          </div>
        )}
      </div>

      {/* Modal Add Client */}
      {showAddModal && (
        <div className="fixed inset-0 z-[500] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-3xl p-6 space-y-4 shadow-2xl">
            <h3 className="text-lg font-extrabold text-slate-900 font-display">Ajouter un Client au Portefeuille</h3>
            <form onSubmit={handleCreateClient} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Raison Sociale / Établissement *</label>
                <input 
                  type="text" 
                  required
                  placeholder="ex: Supérette Teranga Keur Massar"
                  value={raisonSociale}
                  onChange={(e) => setRaisonSociale(e.target.value)}
                  className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsable</label>
                  <input 
                    type="text"
                    placeholder="Mamadou Sow"
                    value={responsable}
                    onChange={(e) => setResponsable(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone *</label>
                  <input 
                    type="text"
                    required
                    placeholder="77 555 88 99"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Catégorie</label>
                  <select 
                    value={categorie}
                    onChange={(e) => setCategorie(e.target.value as ClientCategory)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="Grossiste">Grossiste</option>
                    <option value="Supérette">Supérette</option>
                    <option value="Mini-market">Mini-market</option>
                    <option value="Fast-food">Fast-food</option>
                    <option value="Boutique">Boutique</option>
                    <option value="Tangana">Tangana</option>
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Région Sénégal</label>
                  <select 
                    value={region}
                    onChange={(e) => setRegion(e.target.value as SenegalRegion)}
                    className="w-full bg-white border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold"
                  >
                    <option value="Dakar">Dakar (Keur Massar)</option>
                    <option value="Thiès">Thiès</option>
                    <option value="Diourbel">Diourbel (Touba)</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="px-4 py-2 bg-emerald-600 text-white font-extrabold rounded-xl shadow-md">Créer Client</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
