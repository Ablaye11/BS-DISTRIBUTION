import React, { useState } from 'react';
import { AuditLog } from '../../types';
import { Search, History, Filter } from 'lucide-react';

interface AuditLogModuleProps {
  auditLogs: AuditLog[];
}

export const AuditLogModule: React.FC<AuditLogModuleProps> = ({ auditLogs }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEntite, setSelectedEntite] = useState<string>('TOUTES');
  const [selectedAction, setSelectedAction] = useState<string>('TOUTES');

  // Deduplicate audit logs by ID
  const uniqueLogs = Array.from(new Map(auditLogs.map(item => [item.id, item])).values());

  // Dynamically extract available entities & actions from real database logs
  const availableEntities = Array.from(new Set(uniqueLogs.map(l => l.entite).filter(Boolean)));
  const availableActions = Array.from(new Set(uniqueLogs.map(l => l.action).filter(Boolean)));

  const filteredLogs = uniqueLogs.filter(log => {
    const entiteMatch = selectedEntite === 'TOUTES' || log.entite.toLowerCase() === selectedEntite.toLowerCase();
    const actionMatch = selectedAction === 'TOUTES' || log.action.toLowerCase() === selectedAction.toLowerCase();
    
    const query = searchTerm.toLowerCase().trim();
    const searchMatch = !query || 
      (log.userNom && log.userNom.toLowerCase().includes(query)) || 
      (log.userRole && log.userRole.toLowerCase().includes(query)) ||
      (log.description && log.description.toLowerCase().includes(query)) ||
      (log.action && log.action.toLowerCase().includes(query)) ||
      (log.entite && log.entite.toLowerCase().includes(query)) ||
      (log.nouvelleValeur && log.nouvelleValeur.toLowerCase().includes(query));

    return entiteMatch && actionMatch && searchMatch;
  });

  return (
    <div className="space-y-4 md:space-y-6 font-sans">
      {/* Header */}
      <div className="p-4 md:p-5 glass-panel rounded-2xl border border-amber-200 bg-white shadow-sm">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[10px] bg-rose-600 text-white font-extrabold px-2.5 py-0.5 rounded shadow-sm uppercase tracking-wider">SECTION 25 CDC</span>
          <span className="text-xs text-slate-500 font-bold hidden sm:inline">Sécurité & Traçabilité</span>
        </div>
        <h2 className="text-base md:text-xl font-extrabold text-slate-900 font-display">Journal d'Audit des Opérations Sensibles</h2>
      </div>

      {/* Filter Bar Mobile Optimized */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-2.5 p-3.5 bg-white rounded-2xl border border-slate-200 text-xs shadow-sm">
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input 
            type="text"
            placeholder="Filtrer par utilisateur, action..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-300 text-slate-900 font-medium rounded-xl pl-9 pr-3 py-2.5 focus:outline-none focus:border-amber-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto">
          {/* Entity Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-slate-600 font-bold shrink-0">Entité :</span>
            <select 
              value={selectedEntite}
              onChange={(e) => setSelectedEntite(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="TOUTES">Toutes les entités</option>
              {availableEntities.map(ent => (
                <option key={ent} value={ent}>{ent}</option>
              ))}
            </select>
          </div>

          {/* Action Filter */}
          <div className="flex items-center gap-1.5 flex-1 sm:flex-initial">
            <span className="text-slate-600 font-bold shrink-0">Action :</span>
            <select 
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full sm:w-auto bg-slate-50 text-slate-800 font-bold border border-slate-300 rounded-xl px-2.5 py-2 focus:outline-none focus:border-amber-500"
            >
              <option value="TOUTES">Toutes les actions</option>
              {availableActions.map(act => (
                <option key={act} value={act}>{act}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Audit Log Table Container */}
      <div className="glass-panel rounded-2xl border border-slate-200 bg-white overflow-hidden shadow-sm">
        <div className="p-3.5 md:p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
          <h3 className="font-extrabold text-slate-900 text-xs md:text-sm flex items-center gap-2 font-display">
            <History className="w-4 h-4 text-rose-600" /> Journal Séquentiel ({filteredLogs.length} événements)
          </h3>
          {(searchTerm || selectedEntite !== 'TOUTES' || selectedAction !== 'TOUTES') && (
            <button 
              onClick={() => { setSearchTerm(''); setSelectedEntite('TOUTES'); setSelectedAction('TOUTES'); }}
              className="text-[11px] text-rose-600 hover:text-rose-800 font-bold underline"
            >
              Réinitialiser les filtres
            </button>
          )}
        </div>

        {/* ── MOBILE VIEW: Card List ───────────────────────────────────── */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredLogs.map(log => (
            <div key={log.id} className="p-3.5 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className={`px-2 py-0.5 rounded text-[10px] font-extrabold ${
                  log.action === 'CREATION' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                  log.action === 'VALIDATION' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                  log.action === 'SUPPRESSION' ? 'bg-red-50 text-red-800 border border-red-200' :
                  'bg-amber-50 text-amber-800 border border-amber-200'
                }`}>
                  {log.action}
                </span>

                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 border border-slate-200 px-1.5 py-0.2 rounded">
                  {log.entite}
                </span>

                <span className="text-[10px] font-mono text-slate-400 ml-auto">
                  {new Date(log.timestamp).toLocaleString('fr-FR')}
                </span>
              </div>

              <div className="text-xs space-y-1">
                <div className="flex items-center gap-1.5">
                  <span className="font-extrabold text-slate-900">{log.userNom}</span>
                  <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 rounded font-mono font-bold">
                    {log.userRole}
                  </span>
                </div>

                <p className="text-slate-700 font-medium text-[11px] leading-relaxed">
                  {log.description}
                </p>

                {log.nouvelleValeur && (
                  <p className="text-[10px] font-mono text-slate-500 bg-slate-50 p-1.5 rounded border border-slate-200">
                    {log.nouvelleValeur}
                  </p>
                )}
              </div>
            </div>
          ))}

          {filteredLogs.length === 0 && (
            <div className="p-8 text-center text-slate-400 text-xs">
              Aucun événement d'audit ne correspond aux filtres sélectionnés.
            </div>
          )}
        </div>

        {/* ── DESKTOP VIEW: Full Table ─────────────────────────────────── */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs min-w-[700px]">
            <thead>
              <tr className="bg-slate-50 text-slate-600 border-b border-slate-200">
                <th className="p-3">Horodatage</th>
                <th className="p-3">Utilisateur (Rôle)</th>
                <th className="p-3">Action</th>
                <th className="p-3">Entité</th>
                <th className="p-3">Description Opérationnelle</th>
                <th className="p-3">Valeur / Diff</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredLogs.map(log => (
                <tr key={log.id} className="hover:bg-slate-50/60">
                  <td className="p-3 font-mono text-[11px] text-slate-500 font-medium">{new Date(log.timestamp).toLocaleString('fr-FR')}</td>
                  <td className="p-3">
                    <span className="font-extrabold text-slate-900 block">{log.userNom}</span>
                    <span className="text-[9px] bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.2 rounded font-mono font-bold">
                      {log.userRole}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2.5 py-0.5 rounded text-[10px] font-extrabold ${
                      log.action === 'CREATION' ? 'bg-emerald-50 text-emerald-800 border border-emerald-200' :
                      log.action === 'VALIDATION' ? 'bg-blue-50 text-blue-800 border border-blue-200' :
                      log.action === 'SUPPRESSION' ? 'bg-red-50 text-red-800 border border-red-200' :
                      'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}>
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 font-bold text-slate-700">{log.entite}</td>
                  <td className="p-3 text-slate-800 font-medium">{log.description}</td>
                  <td className="p-3 text-slate-600 font-mono text-[11px] font-medium">{log.nouvelleValeur || '-'}</td>
                </tr>
              ))}
              {filteredLogs.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-400 text-xs">Aucun événement d'audit ne correspond aux filtres sélectionnés.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
