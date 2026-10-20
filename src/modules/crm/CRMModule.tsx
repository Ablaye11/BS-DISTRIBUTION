import React, { useState } from 'react';
import { Prospect, SenegalRegion, ProspectStatus } from '../../types';
import {
  Plus, Search, MapPin, Phone,
  Navigation, CheckCircle2, X, Trash2
} from 'lucide-react';
import { db } from '../../db/database';

interface CRMModuleProps {
  prospects: Prospect[];
  clients: any[];
  currentUser: import('../../types').User;
  onRefreshData: () => void;
}

const STATUS_CONFIG: Record<ProspectStatus, { label: string; color: string; bg: string; border: string }> = {
  'Nouveau':        { label: '🆕 Nouveau',         color: 'text-slate-800',    bg: 'bg-white',          border: 'border-slate-300' },
  'Contacté':       { label: '📞 Contacté',         color: 'text-slate-900',    bg: 'bg-white',          border: 'border-slate-300' },
  'En discussion':  { label: '💬 En discussion',    color: 'text-amber-900',    bg: 'bg-amber-50',      border: 'border-amber-200' },
  'À relancer':     { label: '🔔 À relancer',       color: 'text-orange-900',   bg: 'bg-orange-50',     border: 'border-orange-200' },
  'Converti':       { label: '✅ Converti Client',  color: 'text-emerald-800',  bg: 'bg-emerald-50',    border: 'border-emerald-200' },
  'Perdu':          { label: '❌ Perdu',             color: 'text-red-800',      bg: 'bg-red-50',        border: 'border-red-200' },
};

const PIPELINE: ProspectStatus[] = ['Nouveau','Contacté','En discussion','À relancer','Converti','Perdu'];

export const CRMModule: React.FC<CRMModuleProps> = ({ prospects, clients, currentUser, onRefreshData }) => {
  const [view, setView]                   = useState<'CARDS' | 'PIPELINE'>('CARDS');
  const [search, setSearch]               = useState('');
  const [regionFilter, setRegionFilter]   = useState('TOUTES');
  const [statusFilter, setStatusFilter]   = useState<string>('TOUS');
  const [showModal, setShowModal]         = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<Prospect | null>(null);

  // Form state
  const [form, setForm] = useState({
    nom: '', contact: '', telephone: '', adresse: '',
    region: 'Dakar' as SenegalRegion, commune: 'Keur Massar',
    scoring: 60, notes: '', status: 'Nouveau' as ProspectStatus,
    typeProducteur: 'Boutique de quartier',
    gpsLat: 14.7794, gpsLong: -17.3129, gpsLoading: false
  });

  const takeGps = () => {
    setForm(f => ({ ...f, gpsLoading: true }));
    navigator.geolocation?.getCurrentPosition(
      pos => setForm(f => ({ ...f, gpsLat: pos.coords.latitude, gpsLong: pos.coords.longitude, gpsLoading: false })),
      () => setForm(f => ({ ...f, gpsLoading: false }))
    );
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const p: Prospect = {
      id: `p-${Date.now()}`,
      nom: form.nom, contact: form.contact || form.nom, responsable: form.contact || form.nom,
      telephone: form.telephone, adresse: form.adresse || 'Keur Massar',
      region: form.region, departement: 'Keur Massar', commune: form.commune,
      gps: { latitude: form.gpsLat, longitude: form.gpsLong, timestamp: new Date().toISOString() },
      status: form.status, scoring: form.scoring, notes: form.notes,
      commercialId: currentUser.id,
      commercialName: currentUser.name,
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString()
    };
    await db.prospects.add(p);
    setShowModal(false);
    setForm(f => ({ ...f, nom:'', contact:'', telephone:'', notes:'' }));
    onRefreshData();
  };

  const updateStatus = async (id: string, status: ProspectStatus) => {
    await db.prospects.update(id, { status, updatedAt: new Date().toISOString() });
    onRefreshData();
  };

  const convertToClient = async (p: Prospect) => {
    const cat: import('../../types').ClientCategory = 'Tangana';
    await db.prospects.update(p.id, { status: 'Converti', updatedAt: new Date().toISOString() });
    await db.clients.add({
      id: `cli-${Date.now()}`, raisonSociale: p.nom, responsable: p.responsable,
      telephone: p.telephone, adresse: p.adresse, region: p.region,
      departement: p.departement, commune: p.commune, gps: p.gps,
      categorie: cat, commercialId: p.commercialId, commercialName: p.commercialName,
      soldeCreance: 0, totalAchatsFCFA: 0, createdAt: new Date().toISOString()
    });
    setSelectedProspect(null);
    onRefreshData();
    alert(`🎉 ${p.nom} est maintenant un client actif !`);
  };

  const deleteProspect = async (id: string) => {
    if (!window.confirm('Supprimer ce prospect ?')) return;
    await db.prospects.delete(id);
    setSelectedProspect(null);
    onRefreshData();
  };

  const filtered = prospects.filter(p =>
    (regionFilter === 'TOUTES' || p.region === regionFilter) &&
    (statusFilter === 'TOUS' || p.status === statusFilter) &&
    (p.nom.toLowerCase().includes(search.toLowerCase()) || p.telephone.includes(search))
  );

  // Stats
  const total         = prospects.length;
  const converted     = prospects.filter(p => p.status === 'Converti').length;
  const inPipeline    = prospects.filter(p => !['Converti','Perdu'].includes(p.status)).length;
  const conversionRate = total > 0 ? Math.round((converted / total) * 100) : 0;
  const avgScore      = prospects.length ? Math.round(prospects.reduce((s, p) => s + p.scoring, 0) / prospects.length) : 0;

  return (
    <div className="space-y-5">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs bg-amber-500 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">CRM TERRAIN</span>
            <span className="text-xs text-slate-500 font-bold">Pipeline de Prospection — {prospects.length} prospects</span>
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 font-display">Prospection Commerciale</h2>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex bg-slate-100 border border-slate-200 rounded-xl p-1 text-xs">
            <button onClick={() => setView('CARDS')} className={`px-3 py-1.5 rounded-lg font-extrabold transition-all ${view === 'CARDS' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'}`}>
              Cartes
            </button>
            <button onClick={() => setView('PIPELINE')} className={`px-3 py-1.5 rounded-lg font-extrabold transition-all ${view === 'PIPELINE' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-600'}`}>
              Pipeline Kanban
            </button>
          </div>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-1.5 transition-all">
            <Plus className="w-4 h-4" /> Nouveau Prospect
          </button>
        </div>
      </div>

      {/* ── KPIs ───────────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Prospects', val: total, color: 'text-slate-900', sub: 'enregistrés' },
          { label: 'En Pipeline', val: inPipeline, color: 'text-amber-700', sub: 'actifs' },
          { label: 'Convertis Clients', val: converted, color: 'text-emerald-700', sub: `sur ${total}` },
          { label: 'Taux Conversion', val: `${conversionRate}%`, color: 'text-blue-700', sub: `Score moy. ${avgScore}%` },
        ].map(k => (
          <div key={k.label} className="glass-card p-4 rounded-2xl border border-slate-200 bg-white shadow-sm">
            <p className="text-[10px] text-slate-500 font-bold">{k.label}</p>
            <p className={`text-2xl font-extrabold mt-1 ${k.color}`}>{k.val}</p>
            <p className="text-[10px] text-slate-400 font-medium">{k.sub}</p>
          </div>
        ))}
      </div>

      {/* ── Filters ─────────────────────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-3 p-4 bg-white rounded-2xl border border-slate-200 text-xs shadow-sm">
        <div className="relative w-56">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input type="text" placeholder="Nom, téléphone..."
            value={search} onChange={e => setSearch(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500"
          />
        </div>
        <select value={regionFilter} onChange={e => setRegionFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500">
          <option value="TOUTES">Toutes les Régions</option>
          {['Dakar','Thiès','Diourbel','Saint-Louis','Kaolack'].map(r => <option key={r}>{r}</option>)}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl px-3 py-2.5 focus:outline-none focus:border-amber-500">
          <option value="TOUS">Tous les statuts</option>
          {PIPELINE.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <span className="text-slate-500 ml-auto font-medium">{filtered.length} résultat(s)</span>
      </div>

      {/* ── PIPELINE VIEW ────────────────────────────────────────────────── */}
      {view === 'PIPELINE' && (
        <div className="overflow-x-auto pb-2">
          <div className="flex gap-3 min-w-max">
            {PIPELINE.map(stage => {
              const cfg = STATUS_CONFIG[stage];
              const stageProspects = prospects.filter(p => p.status === stage);
              return (
                <div key={stage} className={`w-56 rounded-2xl border ${cfg.border} bg-white p-3.5 space-y-2 flex-shrink-0 shadow-sm`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-xs font-extrabold ${cfg.color}`}>{cfg.label}</span>
                    <span className="text-[10px] bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 rounded-full font-mono font-bold">{stageProspects.length}</span>
                  </div>
                  {stageProspects.map(p => (
                    <div key={p.id} onClick={() => setSelectedProspect(p)}
                      className="bg-slate-50 border border-slate-200 rounded-xl p-3 cursor-pointer hover:border-amber-500 transition-all shadow-sm">
                      <p className="font-extrabold text-slate-900 text-xs truncate font-display">{p.nom}</p>
                      <p className="text-[10px] text-slate-500 font-medium">{p.telephone}</p>
                      <div className="mt-2 flex items-center gap-1.5">
                        <div className="flex-1 bg-slate-200 rounded-full h-1.5">
                          <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${p.scoring}%` }} />
                        </div>
                        <span className="text-[10px] text-amber-700 font-extrabold">{p.scoring}%</span>
                      </div>
                    </div>
                  ))}
                  {stageProspects.length === 0 && (
                    <p className="text-[10px] text-slate-400 text-center py-4 font-medium">Aucun prospect</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── CARDS VIEW ───────────────────────────────────────────────────── */}
      {view === 'CARDS' && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map(p => {
            const cfg = STATUS_CONFIG[p.status];
            return (
              <div key={p.id} className={`glass-card p-5 rounded-2xl border ${cfg.border} bg-white space-y-3 shadow-sm hover:shadow-md transition-all cursor-pointer`}
                onClick={() => setSelectedProspect(p)}>
                <div className="flex items-start justify-between">
                  <div>
                    <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded border ${cfg.border} ${cfg.bg} ${cfg.color}`}>{cfg.label}</span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-2 font-display">{p.nom}</h3>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-extrabold text-amber-700">{p.scoring}%</p>
                    <div className="w-14 bg-slate-200 rounded-full h-1.5 mt-1">
                      <div className="bg-amber-500 h-1.5 rounded-full" style={{ width: `${p.scoring}%` }} />
                    </div>
                  </div>
                </div>
                <div className="text-xs text-slate-700 space-y-1 font-medium">
                  <p className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-amber-600" />{p.telephone}</p>
                  <p className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5 text-slate-400" />{p.commune}, {p.region}</p>
                  {p.notes && <p className="text-[10px] text-slate-500 italic">"{p.notes}"</p>}
                </div>
                {p.status !== 'Converti' && p.status !== 'Perdu' && (
                  <button onClick={e => { e.stopPropagation(); convertToClient(p); }}
                    className="w-full py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-extrabold text-xs rounded-xl transition-all border border-emerald-200 flex items-center justify-center gap-1.5 shadow-sm">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> Convertir en Client
                  </button>
                )}
              </div>
            );
          })}
          {filtered.length === 0 && (
            <div className="col-span-3 text-center py-12 text-slate-400 text-xs">Aucun prospect trouvé.</div>
          )}
        </div>
      )}

      {/* ── Prospect Detail Modal ────────────────────────────────────────── */}
      {selectedProspect && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-md rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-start justify-between">
              <div>
                <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded ${STATUS_CONFIG[selectedProspect.status].color} ${STATUS_CONFIG[selectedProspect.status].bg} border ${STATUS_CONFIG[selectedProspect.status].border}`}>
                  {STATUS_CONFIG[selectedProspect.status].label}
                </span>
                <h3 className="text-lg font-extrabold text-slate-900 mt-1.5 font-display">{selectedProspect.nom}</h3>
              </div>
              <button onClick={() => setSelectedProspect(null)} className="p-2 text-slate-400 hover:text-slate-700">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Score Bar */}
            <div>
              <div className="flex justify-between text-xs mb-1">
                <span className="text-slate-600 font-bold">Score d'intérêt</span>
                <span className="text-amber-700 font-extrabold">{selectedProspect.scoring}%</span>
              </div>
              <div className="w-full bg-slate-100 rounded-full h-2">
                <div className="bg-gradient-to-r from-amber-500 to-amber-600 h-2 rounded-full transition-all" style={{ width: `${selectedProspect.scoring}%` }} />
              </div>
            </div>

            <div className="text-xs space-y-2 text-slate-700 font-medium">
              <p><span className="text-slate-400">📞</span> {selectedProspect.telephone} ({selectedProspect.responsable})</p>
              <p><span className="text-slate-400">📍</span> {selectedProspect.adresse}, {selectedProspect.commune}, {selectedProspect.region}</p>
              <p><span className="text-slate-400">🌍</span> GPS: {selectedProspect.gps?.latitude.toFixed(5)}, {selectedProspect.gps?.longitude.toFixed(5)}</p>
              {selectedProspect.notes && <p className="italic text-slate-500">"{selectedProspect.notes}"</p>}
            </div>

            {/* Status Changer */}
            <div>
              <p className="text-xs text-slate-600 font-bold mb-2">Mettre à jour le statut :</p>
              <div className="flex flex-wrap gap-1.5">
                {PIPELINE.map(s => (
                  <button key={s} onClick={() => { updateStatus(selectedProspect.id, s); setSelectedProspect(prev => prev ? { ...prev, status: s } : null); }}
                    className={`text-[10px] px-2.5 py-1 rounded-lg font-extrabold border transition-all ${
                      selectedProspect.status === s
                        ? `${STATUS_CONFIG[s].bg} ${STATUS_CONFIG[s].color} ${STATUS_CONFIG[s].border}`
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:border-amber-400'
                    }`}>
                    {STATUS_CONFIG[s].label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex gap-2 pt-3 border-t border-slate-100">
              {selectedProspect.status !== 'Converti' && selectedProspect.status !== 'Perdu' && (
                <button onClick={() => convertToClient(selectedProspect)}
                  className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow-md">
                  <CheckCircle2 className="w-4 h-4" /> Convertir en Client
                </button>
              )}
              <button onClick={() => deleteProspect(selectedProspect.id)}
                className="px-3.5 py-2.5 bg-red-50 text-red-700 hover:bg-red-100 font-bold text-xs rounded-xl border border-red-200 flex items-center gap-1 transition-all">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Add Prospect Modal ───────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-[600] bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 w-full max-w-lg rounded-2xl p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between mb-4">
              <h3 className="text-lg font-extrabold text-slate-900 font-display">Nouveau Prospect Terrain</h3>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5 text-slate-400" /></button>
            </div>
            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="block text-slate-700 font-semibold mb-1">Nom / Établissement *</label>
                <input type="text" required placeholder="Supérette Niayes Keur Massar"
                  value={form.nom} onChange={e => setForm(f => ({ ...f, nom: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Responsable</label>
                  <input type="text" placeholder="Mamadou Diallo"
                    value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none" />
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Téléphone *</label>
                  <input type="text" required placeholder="77 600 00 00"
                    value={form.telephone} onChange={e => setForm(f => ({ ...f, telephone: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Région</label>
                  <select value={form.region} onChange={e => setForm(f => ({ ...f, region: e.target.value as SenegalRegion }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-bold focus:outline-none">
                    {['Dakar','Thiès','Diourbel','Saint-Louis','Kaolack','Ziguinchor'].map(r => <option key={r}>{r}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-slate-700 font-semibold mb-1">Commune / Quartier</label>
                  <input type="text" placeholder="Keur Massar Mounawara"
                    value={form.commune} onChange={e => setForm(f => ({ ...f, commune: e.target.value }))}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none" />
                </div>
              </div>

              {/* Score Slider */}
              <div>
                <div className="flex justify-between mb-1">
                  <label className="text-slate-700 font-semibold">Score d'intérêt</label>
                  <span className="text-amber-700 font-extrabold">{form.scoring}%</span>
                </div>
                <input type="range" min={0} max={100} step={5} value={form.scoring}
                  onChange={e => setForm(f => ({ ...f, scoring: Number(e.target.value) }))}
                  className="w-full accent-amber-500" />
                <div className="flex justify-between text-[10px] text-slate-400 mt-0.5 font-medium">
                  <span>Froid (0%)</span><span>Tiède (50%)</span><span>Chaud (100%)</span>
                </div>
              </div>

              {/* GPS Capture */}
              <div>
                <button type="button" onClick={takeGps}
                  className={`w-full py-2.5 border rounded-xl flex items-center justify-center gap-2 font-bold transition-all ${
                    form.gpsLoading ? 'border-amber-500 bg-amber-50 text-amber-800 animate-pulse' : 'border-amber-300 bg-amber-50/50 text-amber-800 hover:bg-amber-100'
                  }`}>
                  <Navigation className={`w-3.5 h-3.5 ${form.gpsLoading ? 'animate-spin' : ''}`} />
                  {form.gpsLoading ? 'Acquisition GPS...' : `📍 Prendre Position GPS (${form.gpsLat.toFixed(4)}, ${form.gpsLong.toFixed(4)})`}
                </button>
              </div>

              <div>
                <label className="block text-slate-700 font-semibold mb-1">Notes / Besoins</label>
                <textarea rows={2} placeholder="Besoins en œufs, fréquence de livraison souhaitée..."
                  value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 text-slate-900 font-medium focus:border-amber-500 focus:outline-none resize-none" />
              </div>

              <div className="flex gap-2 pt-3 border-t border-slate-100">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 bg-slate-100 text-slate-700 font-bold rounded-xl">Annuler</button>
                <button type="submit" className="flex-1 py-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold rounded-xl shadow-md">Enregistrer Prospect</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
