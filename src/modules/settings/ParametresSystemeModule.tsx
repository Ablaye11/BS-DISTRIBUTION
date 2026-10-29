import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, DEFAULT_FACTORY_PARAMETERS } from '../../db/database';
import { FactorySystemParameters, User } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import {
  Sliders, Save, RotateCcw, Download, Upload, ShieldAlert,
  CheckCircle2, AlertTriangle, Factory, ShoppingCart, DollarSign,
  Database, RefreshCw, FileText, Check, Lock, Cpu, FileSpreadsheet
} from 'lucide-react';
import { ImportCsvModal } from '../../components/ImportCsvModal';
import { downloadClientCsvTemplate, downloadRawMaterialsCsvTemplate } from '../../services/csvImportService';
import { downloadBackupFile, restoreDatabaseFromBackup } from '../../services/backupService';

interface ParametresSystemeModuleProps {
  currentUser?: User | null;
}

export const ParametresSystemeModule: React.FC<ParametresSystemeModuleProps> = ({ currentUser }) => {
  const { currentTheme } = useTheme();
  const settingsList = useLiveQuery(() => db.factorySettings.toArray()) || [];
  const currentSettings = settingsList[0] || DEFAULT_FACTORY_PARAMETERS;

  const [activeTab, setActiveTab] = useState<'INDUSTRIEL' | 'COMMERCIAL' | 'FINANCIER' | 'SAUVEGARDE'>('INDUSTRIEL');

  const [formData, setFormData] = useState<FactorySystemParameters>(DEFAULT_FACTORY_PARAMETERS);
  const [motifModification, setMotifModification] = useState('');
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // État pour la restauration de sauvegarde
  const [restoreStatus, setRestoreStatus] = useState<string | null>(null);
  const [isRestoring, setIsRestoring] = useState(false);
  const [activeCsvImport, setActiveCsvImport] = useState<'CLIENTS' | 'MATIERES_PREMIERES' | null>(null);

  useEffect(() => {
    if (currentSettings) {
      setFormData(currentSettings);
    }
  }, [currentSettings]);

  const handleChange = (field: keyof FactorySystemParameters, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? Number(value) : value
    }));
  };

  // Enregistrement des paramètres avec traçabilité Audit Log (Page 22 du CDC)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaveError(null);

    if (!motifModification.trim()) {
      setSaveError('Le motif de modification est obligatoire selon la section 9.3 du Cahier des Charges.');
      return;
    }

    try {
      const today = new Date().toISOString().split('T')[0];
      const userNom = currentUser?.name || 'Administrateur Usine';
      const userRole = currentUser?.role || 'DIRECTEUR_USINE';

      const updatedSettings: FactorySystemParameters = {
        ...formData,
        id: 'settings-default',
        derniereModification: today,
        modifiePar: `${userNom} (${userRole})`,
        motifDerniereModification: motifModification
      };

      await db.factorySettings.put(updatedSettings);

      // Traçabilité dans l'Audit Log (CDC Page 22)
      await db.auditLogs.add({
        id: `audit-param-${Date.now()}`,
        timestamp: new Date().toISOString(),
        userNom,
        userRole,
        action: 'MODIFICATION_PARAMETRES_SYSTEME',
        entite: 'PARAMETRES_USINE',
        description: `Mise à jour des paramètres système. Motif : ${motifModification}`,
        nouvelleValeur: JSON.stringify({
          cadenceCible: updatedSettings.cadenceReelleCible,
          prixContractuel: updatedSettings.prixContractuelAlveole,
          prixMarche: updatedSettings.prixMarcheOuvertAlveole,
          forfaitTransport: updatedSettings.forfaitTransportPapierMensuel
        })
      });

      setSaveSuccess(true);
      setMotifModification('');
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      setSaveError('Erreur lors de la sauvegarde des paramètres.');
    }
  };

  // Réinitialiser aux valeurs de référence du Cahier des Charges (Page 21)
  const handleResetToDefaultCDC = async () => {
    if (!window.confirm('Voulez-vous réinitialiser tous les paramètres aux valeurs officielles du Cahier des Charges (Version 1.0) ?')) {
      return;
    }
    setFormData(DEFAULT_FACTORY_PARAMETERS);
    setMotifModification('Rétablissement des valeurs standards du Cahier des Charges 28 pages');
  };

  // Export d'une sauvegarde complète JSON (Test 12 du CDC)
  const handleExportBackupJSON = async () => {
    try {
      await downloadBackupFile(currentUser?.name || 'Direction Usine', currentUser?.role || 'DIRECTEUR_USINE');
    } catch (err) {
      alert('Erreur lors de la génération de la sauvegarde.');
    }
  };

  // Restauration d'une sauvegarde JSON (Test 12 du CDC)
  const handleImportBackupJSON = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsRestoring(true);
        setRestoreStatus('Lecture du fichier de sauvegarde...');
        const jsonContent = event.target?.result as string;
        const data = JSON.parse(jsonContent);

        const confirmRestore = window.confirm(
          `Attention : Vous allez restaurer les données issues de la sauvegarde du ${data.meta?.exportDate || 'date inconnue'}. Cette opération remplacera les enregistrements actuels. Continuer ?`
        );
        if (!confirmRestore) {
          setIsRestoring(false);
          setRestoreStatus(null);
          return;
        }

        const res = await restoreDatabaseFromBackup(
          data,
          currentUser?.name || 'Direction Usine',
          currentUser?.role || 'SUPER_ADMIN'
        );

        setRestoreStatus(res.message);
        setTimeout(() => {
          setRestoreStatus(null);
          window.location.reload();
        }, 1200);
      } catch (err: any) {
        setRestoreStatus(`Erreur : ${err?.message || 'Échec de restauration'}`);
      } finally {
        setIsRestoring(false);
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-6">
      {/* En-tête du Module */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200/80 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-1 rounded-lg text-xs font-black uppercase tracking-wider bg-slate-900 text-amber-400">
              Module 7 • Administration CDC
            </span>
            <span className="text-xs text-slate-700 font-bold">Section 9 & 13 du Cahier des Charges</span>
          </div>
          <h1 className="text-2xl font-black text-slate-900 mt-1">
            Paramètres Industriels, Commerciaux & Financiers
          </h1>
          <p className="text-xs text-slate-700 font-bold mt-1">
            Gestion centralisée des valeurs de référence de l'usine BS Alvéoles sans intervention du développeur.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleResetToDefaultCDC}
            className="flex items-center gap-2 px-3.5 py-2.5 rounded-xl border border-slate-300 text-xs font-black text-slate-700 hover:bg-slate-50 transition-colors"
            title="Rétablir les valeurs de la maquette CDC"
          >
            <RotateCcw className="w-4 h-4 text-slate-500" />
            Valeurs CDC Standard
          </button>
        </div>
      </div>

      {/* Bandeau d'information sur la dernière révision */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2.5">
          <Lock className="w-4 h-4 text-amber-700 shrink-0" />
          <div>
            <span className="font-black text-amber-950">Dernière révision validée : </span>
            <span className="text-amber-800 font-bold">{formData.derniereModification || '25/10/2026'}</span>
            <span className="text-amber-700"> par </span>
            <span className="font-bold text-amber-900">{formData.modifiePar || 'Direction Générale'}</span>
          </div>
        </div>
        <div className="text-amber-800 italic font-semibold">
          « {formData.motifDerniereModification || 'Paramètres initiaux conformes CDC'} »
        </div>
      </div>

      {/* Onglets de navigation */}
      <div className="flex flex-wrap gap-2 border-b border-slate-200 pb-2">
        <button
          onClick={() => setActiveTab('INDUSTRIEL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'INDUSTRIEL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Factory className="w-4 h-4 text-amber-400" />
          9.1 Paramètres Industriels
        </button>

        <button
          onClick={() => setActiveTab('COMMERCIAL')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'COMMERCIAL'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <ShoppingCart className="w-4 h-4 text-purple-400" />
          9.2 Paramètres Commerciaux & Tarifs
        </button>

        <button
          onClick={() => setActiveTab('FINANCIER')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'FINANCIER'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <DollarSign className="w-4 h-4 text-emerald-400" />
          9.3 Paramètres Financiers & Forfaits
        </button>

        <button
          onClick={() => setActiveTab('SAUVEGARDE')}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black transition-all ${
            activeTab === 'SAUVEGARDE'
              ? 'bg-slate-900 text-white shadow-md'
              : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
          }`}
        >
          <Database className="w-4 h-4 text-sky-400" />
          Test 12 • Sauvegarde & Restauration
        </button>
      </div>

      {/* Messages de succès / erreur */}
      {saveSuccess && (
        <div className="bg-emerald-50 border border-emerald-300 text-emerald-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          Paramètres mis à jour avec succès et consignés dans le Journal d'Audit (CDC Règle 4 & 7).
        </div>
      )}

      {saveError && (
        <div className="bg-rose-50 border border-rose-300 text-rose-800 p-4 rounded-2xl flex items-center gap-3 text-xs font-bold">
          <ShieldAlert className="w-5 h-5 text-rose-600 shrink-0" />
          {saveError}
        </div>
      )}

      {/* Contenu de chaque onglet */}
      {activeTab === 'INDUSTRIEL' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Cadence Nominale */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Cadence Nominale Machine
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.cadenceNominale}
                  onChange={(e) => handleChange('cadenceNominale', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">alv / heure</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Référence théorique constructeur (2 000 alv/h)</p>
            </div>

            {/* Taux de Rendement Retenu */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Taux de Rendement Retenu (TRS Cible)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.tauxRendementRetenu}
                  onChange={(e) => handleChange('tauxRendementRetenu', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">%</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Standard de performance retenu : 85 %</p>
            </div>

            {/* Cadence Réelle Cible */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Cadence Réelle Cible
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.cadenceReelleCible}
                  onChange={(e) => handleChange('cadenceReelleCible', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">alv / heure</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">2 000 × 85% = 1 700 alvéoles/h effectives</p>
            </div>

            {/* Heures effectives par jour */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Durée Effective par Jour
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.heuresEffectivesParJour}
                  onChange={(e) => handleChange('heuresEffectivesParJour', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">heures / jour</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Base shift standard : 8 heures (1 700 × 8 = 13 600 alv/j)</p>
            </div>

            {/* Jours de production par mois */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Jours de Production Mensuelle
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.joursProductionParMois}
                  onChange={(e) => handleChange('joursProductionParMois', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">jours / mois</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">13 600 × 26 = 353 600 alvéoles/mois</p>
            </div>

            {/* Rendement matière */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Rendement Matière Première
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.rendementMatiereAlvParKg}
                  onChange={(e) => handleChange('rendementMatiereAlvParKg', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">alvéoles / kg papier</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Ratio matière standard : 35 alvéoles par kg de carton recyclé</p>
            </div>

            {/* Seuils de Rebut */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Seuil Rebut Vert (Acceptable)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={formData.seuilVertRebut}
                  onChange={(e) => handleChange('seuilVertRebut', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">%</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">≤ 3% = Performance optimale</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Seuil Rebut Rouge (Critique)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.1"
                  value={formData.seuilRougeRebut}
                  onChange={(e) => handleChange('seuilRougeRebut', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">%</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">&gt; 5% = Alerte rouge et arrêt/ajustement obligatoire</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Besoin Mensuel Matière (Carton)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.besoinMensuelPapierKg}
                  onChange={(e) => handleChange('besoinMensuelPapierKg', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">kg / mois</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Consommation prévisionnelle d'environ 10,1 tonnes/mois</p>
            </div>
          </div>

          {/* Justification obligatoire de la modification (CDC Page 22) */}
          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Motif de modification obligatoire (CDC Règle de traçabilité page 22)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Réglage suite à l'installation d'une nouvelle pompe de relevage de pâte"
              value={motifModification}
              onChange={(e) => setMotifModification(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Valider & Enregistrer dans le Journal d'Audit
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'COMMERCIAL' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Taille du lot commercial */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Taille du Lot Commercial (Unité de référence CDC)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.tailleLotCommercial}
                  onChange={(e) => handleChange('tailleLotCommercial', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">alvéoles / lot</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Unité contractuelle : fardeau de 100 alvéoles</p>
            </div>

            {/* Prix Contractuel unitaire */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Prix Contractuel Référence (Fermes partenaires)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.prixContractuelAlveole}
                  onChange={(e) => {
                    const alv = Number(e.target.value);
                    handleChange('prixContractuelAlveole', alv);
                    handleChange('prixContractuelLot', alv * formData.tailleLotCommercial);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / alvéole</span>
              </div>
              <p className="text-[11px] text-emerald-800 font-bold">
                Soit {formData.prixContractuelAlveole * formData.tailleLotCommercial} FCFA le lot de 100 alvéoles
              </p>
            </div>

            {/* Prix Marché Ouvert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Prix Marché Ouvert (Grossistes & Détail)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.prixMarcheOuvertAlveole}
                  onChange={(e) => {
                    const alv = Number(e.target.value);
                    handleChange('prixMarcheOuvertAlveole', alv);
                    handleChange('prixMarcheOuvertLot', alv * formData.tailleLotCommercial);
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / alvéole</span>
              </div>
              <p className="text-[11px] text-purple-800 font-bold">
                Soit {formData.prixMarcheOuvertAlveole * formData.tailleLotCommercial} FCFA le lot de 100 alvéoles
              </p>
            </div>

            {/* Part Contractuelle Visée */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Objectif de Couverture Contractuelle
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.partContractuelleViseePourcent}
                  onChange={(e) => {
                    const part = Number(e.target.value);
                    handleChange('partContractuelleViseePourcent', part);
                    handleChange('partMarcheOuvertPourcent', Math.max(0, 100 - part));
                  }}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">%</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">CDC Recommandation 12.1 : Objectif 60% à 75% sous contrat</p>
            </div>

            {/* Part Marché Ouvert */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Part Marché Ouvert (Commerciaux & Spot)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  disabled
                  value={formData.partMarcheOuvertPourcent}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-700 text-sm bg-slate-100"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">%</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Complémentaire automatique : 100% - part contractuelle</p>
            </div>

            {/* Durée indicative des contrats */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Durée Indicative des Contrats B2B
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.dureeIndicativeContratsMois}
                  onChange={(e) => handleChange('dureeIndicativeContratsMois', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">mois</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Standard : 6 à 12 mois de sécurisation de débouchés</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Motif de révision tarifaire obligatoire (CDC Page 22)
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Révision semestrielle des tarifs contractuels selon cours des matières"
              value={motifModification}
              onChange={(e) => setMotifModification(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Valider les Tarifs & Historiser
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'FINANCIER' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {/* Forfait transport papier recyclé */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Forfait Transport Papier Recyclé
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.forfaitTransportPapierMensuel}
                  onChange={(e) => handleChange('forfaitTransportPapierMensuel', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / mois</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">CDC Section 6.4 : Forfait de référence 300 000 FCFA/mois</p>
            </div>

            {/* Prix d'achat papier carton kg */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Prix Moyen Achat Carton Recyclé (OCC)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.prixAchatPapierKg}
                  onChange={(e) => handleChange('prixAchatPapierKg', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / kg</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Coût matière brute triée d'entrée usine</p>
            </div>

            {/* Électricité */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Tarif Électricité Industriel (Senelec)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.coutKwhElectricite}
                  onChange={(e) => handleChange('coutKwhElectricite', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / kWh</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Pour calcul automatique des coûts de production</p>
            </div>

            {/* Eau */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Coût de l'Eau & Traitement
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.coutM3Eau}
                  onChange={(e) => handleChange('coutM3Eau', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">FCFA / m³</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Circuits fermés et eau de recyclage pulpeur</p>
            </div>

            {/* Délai de paiement par défaut */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Délai de Paiement Standard Accordé
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.delaiPaiementParDefautJours}
                  onChange={(e) => handleChange('delaiPaiementParDefautJours', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">jours</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Pour le calcul des alertes d'échéances et de relances</p>
            </div>

            {/* Remise maximum autorisée */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-2">
              <label className="text-xs font-black text-slate-800 uppercase tracking-wide">
                Plafond Remise Commerciale
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  value={formData.tauxRemiseMaxPourcent}
                  onChange={(e) => handleChange('tauxRemiseMaxPourcent', e.target.value)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-xl font-black text-slate-900 text-sm focus:ring-2 focus:ring-slate-900"
                />
                <span className="text-xs font-bold text-slate-500 shrink-0">% max</span>
              </div>
              <p className="text-[11px] text-slate-700 font-bold">Au-delà, accord écrit de la direction requis</p>
            </div>
          </div>

          <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 space-y-3">
            <label className="text-xs font-black text-slate-900 uppercase tracking-wide flex items-center gap-2">
              <ShieldAlert className="w-4 h-4 text-amber-600" />
              Motif de modification des charges d'exploitation obligatoire
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Ajustement de la grille tarifaire électricité / transport selon nouvelles factures"
              value={motifModification}
              onChange={(e) => setMotifModification(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:ring-2 focus:ring-slate-900"
            />
            <div className="flex justify-end">
              <button
                type="submit"
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-900 text-white text-xs font-black rounded-xl hover:bg-slate-800 transition-colors shadow-md"
              >
                <Save className="w-4 h-4 text-amber-400" />
                Valider les Paramètres Financiers
              </button>
            </div>
          </div>
        </form>
      )}

      {activeTab === 'SAUVEGARDE' && (
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-50 text-sky-600 flex items-center justify-center">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Scénario Test 12 • Sauvegarde et Restauration des Données
                </h3>
                <p className="text-xs text-slate-700 font-bold">
                  Exigence formelle du Cahier des Charges : exporter et restaurer l'intégralité de la base Dexie.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              {/* Export Sauvegarde */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Download className="w-4 h-4 text-emerald-600" />
                    1. Sauvegarde Complète (Export JSON)
                  </div>
                  <p className="text-xs text-slate-700 font-bold mt-2">
                    Génère un fichier JSON sécurisé contenant toutes les tables : produits, stocks, relevés de production, clients, factures, collaborateurs, contrats, bons de sortie et journal d'audit.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportBackupJSON}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-emerald-600 text-white rounded-xl text-xs font-black hover:bg-emerald-700 transition-colors shadow-sm"
                >
                  <Download className="w-4 h-4" />
                  Télécharger le Dump JSON de l'Usine
                </button>
              </div>

              {/* Import Restauration */}
              <div className="border border-slate-200 rounded-2xl p-5 bg-slate-50 flex flex-col justify-between space-y-4">
                <div>
                  <div className="flex items-center gap-2 text-slate-900 font-black text-sm">
                    <Upload className="w-4 h-4 text-amber-600" />
                    2. Restauration Complète (Import JSON)
                  </div>
                  <p className="text-xs text-slate-700 font-bold mt-2">
                    Permet de restaurer l'état complet du logiciel après un incident ou sur un nouveau poste, sans perte de traçabilité.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-slate-900 text-white rounded-xl text-xs font-black hover:bg-slate-800 transition-colors shadow-sm cursor-pointer">
                    <Upload className="w-4 h-4 text-amber-400" />
                    Sélectionner un fichier de sauvegarde
                    <input
                      type="file"
                      accept=".json"
                      onChange={handleImportBackupJSON}
                      className="hidden"
                      disabled={isRestoring}
                    />
                  </label>
                  {restoreStatus && (
                    <p className="text-[11px] font-bold text-center text-slate-700">{restoreStatus}</p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Section Importation de Fichiers Métier (CSV / Excel) */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                <FileSpreadsheet className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900">
                  Importation de Données Métier depuis Fichiers (CSV / Excel)
                </h3>
                <p className="text-xs text-slate-600 font-medium">
                  Téléchargez un modèle vierge au format Excel/CSV, remplissez vos données, puis importez-les dans l'usine en 1 clic.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5 pt-2">
              {/* Carte Clients */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">Portefeuille Clients B2B</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">Fichier CSV</span>
                </div>
                <p className="text-xs text-slate-500">
                  Importez vos fermes avicoles, grossistes d'emballages, couvoirs et supermarchés avec contacts et adresses.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={downloadClientCsvTemplate}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Modèle CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCsvImport('CLIENTS')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importer
                  </button>
                </div>
              </div>

              {/* Carte Matières Premières */}
              <div className="p-5 rounded-2xl border border-slate-200 bg-slate-50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-black text-slate-900 text-sm">Matières Premières & Balles</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700">Fichier CSV</span>
                </div>
                <p className="text-xs text-slate-500">
                  Importez les stocks de balles de cartons ondulés (OCC), journaux, amidon et consommables usine.
                </p>
                <div className="flex items-center gap-2 pt-2">
                  <button
                    type="button"
                    onClick={downloadRawMaterialsCsvTemplate}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-slate-300 text-slate-700 text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Modèle CSV
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveCsvImport('MATIERES_PREMIERES')}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Importer
                  </button>
                </div>
              </div>
            </div>
          </div>

        </div>
      )}

      {/* Modal d'importation CSV dynamique */}
      {activeCsvImport && (
        <ImportCsvModal
          type={activeCsvImport}
          onClose={() => setActiveCsvImport(null)}
        />
      )}
    </div>
  );
};
