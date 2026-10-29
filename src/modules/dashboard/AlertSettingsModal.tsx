import React, { useState, useEffect } from 'react';
import { db } from '../../db/database';
import { FactorySystemParameters } from '../../types';
import { 
  X, Sliders, CheckCircle2, RotateCcw, AlertTriangle, ShieldCheck, 
  HelpCircle, Gauge, Boxes, ShoppingBag, DollarSign, Clock, Layers
} from 'lucide-react';

interface AlertSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSettings?: FactorySystemParameters;
  userRole?: string;
  userName?: string;
}

export const AlertSettingsModal: React.FC<AlertSettingsModalProps> = ({
  isOpen,
  onClose,
  currentSettings,
  userRole = 'DIRECTEUR_USINE',
  userName = 'Direction Usine'
}) => {
  const [formData, setFormData] = useState({
    seuilAlerteJoursAutonomiePapier: 5,
    seuilAlerteCadenceMin: 1500,
    seuilAlerteTauxRebutMax: 5.0,
    seuilAlerteArretMachineProlongeHeures: 1.5,
    seuilAlerteStockMinLotsProduitsFinis: 200,
    seuilAlerteStockCommercialPlafondLots: 250,
    seuilAlerteCreancesMaxFCFA: 1500000,
    seuilAlerteDelaiFactureEchueJours: 15,
    seuilAlerteEcheanceContratJours: 30,
    seuilAlerteEcartInventaireValeurFCFA: 50000
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    if (currentSettings) {
      setFormData({
        seuilAlerteJoursAutonomiePapier: currentSettings.seuilAlerteJoursAutonomiePapier ?? 5,
        seuilAlerteCadenceMin: currentSettings.seuilAlerteCadenceMin ?? 1500,
        seuilAlerteTauxRebutMax: currentSettings.seuilAlerteTauxRebutMax ?? 5.0,
        seuilAlerteArretMachineProlongeHeures: currentSettings.seuilAlerteArretMachineProlongeHeures ?? 1.5,
        seuilAlerteStockMinLotsProduitsFinis: currentSettings.seuilAlerteStockMinLotsProduitsFinis ?? 200,
        seuilAlerteStockCommercialPlafondLots: currentSettings.seuilAlerteStockCommercialPlafondLots ?? 250,
        seuilAlerteCreancesMaxFCFA: currentSettings.seuilAlerteCreancesMaxFCFA ?? 1500000,
        seuilAlerteDelaiFactureEchueJours: currentSettings.seuilAlerteDelaiFactureEchueJours ?? 15,
        seuilAlerteEcheanceContratJours: currentSettings.seuilAlerteEcheanceContratJours ?? 30,
        seuilAlerteEcartInventaireValeurFCFA: currentSettings.seuilAlerteEcartInventaireValeurFCFA ?? 50000
      });
    }
  }, [currentSettings, isOpen]);

  if (!isOpen) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const today = new Date().toISOString().split('T')[0];
      const settingsId = currentSettings?.id || 'settings-default';

      await db.factorySettings.update(settingsId, {
        ...formData,
        derniereModification: today,
        modifiePar: `${userName} (${userRole})`,
        motifDerniereModification: 'Modification des seuils d\'alertes automatiques (Module 1 CDC)'
      });

      await db.auditLogs.add({
        id: `audit-settings-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userNom: userName,
        userRole: userRole as any,
        action: 'MISE_A_JOUR_SEUILS_ALERTES',
        entite: 'TABLEAU_DE_BORD',
        description: 'Mise à jour des seuils d\'alertes automatiques par un utilisateur habilité',
        nouvelleValeur: JSON.stringify(formData)
      });

      setSavedSuccess(true);
      setTimeout(() => {
        setSavedSuccess(false);
        onClose();
      }, 1200);
    } catch (err) {
      console.error('Erreur enregistrement seuils:', err);
      alert('Erreur lors de l\'enregistrement des seuils.');
    }
  };

  const handleResetDefaults = () => {
    setFormData({
      seuilAlerteJoursAutonomiePapier: 5,
      seuilAlerteCadenceMin: 1500,
      seuilAlerteTauxRebutMax: 5.0,
      seuilAlerteArretMachineProlongeHeures: 1.5,
      seuilAlerteStockMinLotsProduitsFinis: 200,
      seuilAlerteStockCommercialPlafondLots: 250,
      seuilAlerteCreancesMaxFCFA: 1500000,
      seuilAlerteDelaiFactureEchueJours: 15,
      seuilAlerteEcheanceContratJours: 30,
      seuilAlerteEcartInventaireValeurFCFA: 50000
    });
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-3xl w-full max-h-[85dvh] sm:max-h-[90vh] flex flex-col shadow-2xl border border-slate-200 overflow-hidden">
        
        {/* Header Modal */}
        <div className="bg-slate-900 text-white p-5 sm:p-6 flex items-center justify-between border-b border-slate-800 shrink-0">
          <div className="flex items-center gap-3">
            <span className="p-2.5 rounded-2xl bg-amber-500/20 text-amber-400 border border-amber-500/30">
              <Sliders className="w-6 h-6" />
            </span>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-base sm:text-lg font-black tracking-tight">Configuration des Seuils d'Alertes</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/40">
                  CDC Section 4.3
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Modifiable directement par un utilisateur habilité sans intervention du développeur.
              </p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulaire scrollable */}
        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-6">
          
          {savedSuccess && (
            <div className="p-3.5 bg-emerald-50 border border-emerald-200 rounded-2xl flex items-center gap-3 text-emerald-800 text-xs font-bold animate-fadeIn">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
              <span>Seuils mis à jour avec succès dans la base de données locale. Les alertes du tableau de bord sont recalculées instantanément.</span>
            </div>
          )}

          {/* 1. SEUILS PRODUCTION */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Gauge className="w-4 h-4 text-indigo-600" />
              1. Seuils de Production & Cadence
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Cadence minimale acceptable
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="500"
                    max="3500"
                    step="50"
                    value={formData.seuilAlerteCadenceMin}
                    onChange={e => setFormData({ ...formData, seuilAlerteCadenceMin: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">alv/h</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si moyenne inférieure (CDC : 1 700)</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Taux de rebut maximal toléré
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="20"
                    step="0.1"
                    value={formData.seuilAlerteTauxRebutMax}
                    onChange={e => setFormData({ ...formData, seuilAlerteTauxRebutMax: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">%</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si rebut &gt; seuil (Seuil rouge CDC : 5%)</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Arrêt machine prolongé
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0.2"
                    max="8"
                    step="0.1"
                    value={formData.seuilAlerteArretMachineProlongeHeures}
                    onChange={e => setFormData({ ...formData, seuilAlerteArretMachineProlongeHeures: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-indigo-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">heures</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si arrêt sur un shift dépasse ce seuil</p>
              </div>
            </div>
          </div>

          {/* 2. SEUILS STOCKS & MATIÈRES */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Boxes className="w-4 h-4 text-emerald-600" />
              2. Seuils de Stocks & Matières Premières
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Jours de couverture papier min.
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="1"
                    max="30"
                    value={formData.seuilAlerteJoursAutonomiePapier}
                    onChange={e => setFormData({ ...formData, seuilAlerteJoursAutonomiePapier: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">jours</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte critique si stock &lt; seuil (CDC : 5 j)</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Stock mini produits finis usine
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="10"
                    max="5000"
                    step="50"
                    value={formData.seuilAlerteStockMinLotsProduitsFinis}
                    onChange={e => setFormData({ ...formData, seuilAlerteStockMinLotsProduitsFinis: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">lots 100</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Seuil de sécurité alvéoles prêtes</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Plafond stock par commercial
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="50"
                    max="1000"
                    step="50"
                    value={formData.seuilAlerteStockCommercialPlafondLots}
                    onChange={e => setFormData({ ...formData, seuilAlerteStockCommercialPlafondLots: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">lots 100</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si stock non justifié confié</p>
              </div>
            </div>
          </div>

          {/* 3. SEUILS COMMERCIAL & RECOUVREMENT */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-blue-600" />
              3. Seuils Commerciaux, Créances & Contrats
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Plafond d'alerte des créances clients
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="100000"
                    max="50000000"
                    step="100000"
                    value={formData.seuilAlerteCreancesMaxFCFA}
                    onChange={e => setFormData({ ...formData, seuilAlerteCreancesMaxFCFA: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">FCFA</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si le solde impayé total dépasse ce montant</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Alerte avant fin de contrat B2B
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5"
                    max="90"
                    value={formData.seuilAlerteEcheanceContratJours}
                    onChange={e => setFormData({ ...formData, seuilAlerteEcheanceContratJours: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-blue-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">jours</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Préavis pour lancer le renouvellement commercial</p>
              </div>
            </div>
          </div>

          {/* 4. SEUILS INVENTAIRES ET CONTRÔLE */}
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-3 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-purple-600" />
              4. Seuils Financiers & Écarts d'Inventaire
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Tolérance d'écart de valeur inventaire
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="5000"
                    max="1000000"
                    step="5000"
                    value={formData.seuilAlerteEcartInventaireValeurFCFA}
                    onChange={e => setFormData({ ...formData, seuilAlerteEcartInventaireValeurFCFA: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">FCFA</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Alerte si écart physique vs théorique dépasse cette valeur</p>
              </div>

              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200">
                <label className="block text-[11px] font-bold text-slate-700 mb-1">
                  Délai par défaut factures clients
                </label>
                <div className="flex items-center gap-1.5">
                  <input
                    type="number"
                    min="0"
                    max="90"
                    value={formData.seuilAlerteDelaiFactureEchueJours}
                    onChange={e => setFormData({ ...formData, seuilAlerteDelaiFactureEchueJours: Number(e.target.value) })}
                    className="w-full px-3 py-1.5 text-xs font-bold bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-purple-500"
                    required
                  />
                  <span className="text-[10px] text-slate-500 font-bold shrink-0">jours</span>
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Délai standard de paiement accordé (CDC : 15 j)</p>
              </div>
            </div>
          </div>

          {/* Note de conformité */}
          <div className="p-3 bg-amber-50/70 border border-amber-200/80 rounded-2xl text-[11px] text-amber-900 flex items-start gap-2.5">
            <ShieldCheck className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <p>
              <strong>Conformité CDC Section 4.3 :</strong> Toutes les modifications sont historisées avec l'identité de l'utilisateur ({userName}) et l'horodatage exact. Aucune modification de code n'est requise.
            </p>
          </div>

          {/* Footer Actions */}
          <div className="sticky bottom-0 bg-white/95 backdrop-blur-md pt-3 pb-4 sm:pb-2 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shrink-0 z-20 mt-auto">
            <button
              type="button"
              onClick={handleResetDefaults}
              className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1.5 px-3 py-2 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Rétablir valeurs par défaut CDC
            </button>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
              >
                Annuler
              </button>
              <button
                type="submit"
                className="flex-1 sm:flex-none px-6 py-2.5 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-xl shadow-md transition-colors flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                Enregistrer les Seuils
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
