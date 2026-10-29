import React, { useState } from 'react';
import { Upload, Download, FileText, CheckCircle2, AlertTriangle, X, RefreshCw } from 'lucide-react';
import {
  downloadClientCsvTemplate,
  downloadRawMaterialsCsvTemplate,
  importClientsFromCsv,
  importRawMaterialsFromCsv
} from '../services/csvImportService';

interface ImportCsvModalProps {
  type: 'CLIENTS' | 'MATIERES_PREMIERES';
  onClose: () => void;
  onSuccess?: () => void;
}

export const ImportCsvModal: React.FC<ImportCsvModalProps> = ({ type, onClose, onSuccess }) => {
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{ count: number; errors: string[] } | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const title = type === 'CLIENTS' ? 'Importer des Clients B2B' : 'Importer des Matières Premières & Balles';
  const description = type === 'CLIENTS'
    ? 'Importez une liste de fermes avicoles, grossistes ou distributeurs depuis un fichier CSV ou Excel.'
    : 'Importez des stocks de balles de cartons, vieux journaux ou amidon.';

  const handleDownloadTemplate = () => {
    if (type === 'CLIENTS') {
      downloadClientCsvTemplate();
    } else {
      downloadRawMaterialsCsvTemplate();
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    setFile(selectedFile);
    setErrorMessage(null);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      const text = event.target?.result as string;
      setFileContent(text);
    };
    reader.onerror = () => {
      setErrorMessage('Impossible de lire le fichier sélectionné.');
    };
    reader.readAsText(selectedFile, 'UTF-8');
  };

  const handleImport = async () => {
    if (!fileContent.trim()) {
      setErrorMessage('Veuillez sélectionner un fichier valide non vide.');
      return;
    }

    setIsProcessing(true);
    setErrorMessage(null);

    try {
      let res;
      if (type === 'CLIENTS') {
        res = await importClientsFromCsv(fileContent);
      } else {
        res = await importRawMaterialsFromCsv(fileContent);
      }
      setResult(res);
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setErrorMessage(err.message || "Une erreur est survenue lors de l'importation.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/70 backdrop-blur-sm overflow-y-auto overscroll-contain animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-4 sm:p-6 shadow-2xl border border-slate-200 max-h-[85dvh] sm:max-h-[90vh] overflow-y-auto overscroll-contain flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Upload className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-black text-slate-900">{title}</h3>
              <p className="text-xs text-slate-500">{description}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-xl hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Corps */}
        <div className="py-5 space-y-4">
          {/* Étape 1 : Modèle */}
          <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between">
            <div>
              <p className="text-xs font-bold text-slate-900">Étape 1 : Télécharger le modèle vierge</p>
              <p className="text-[11px] text-slate-500">Format CSV compatible Microsoft Excel & Google Sheets</p>
            </div>
            <button
              onClick={handleDownloadTemplate}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-white border border-slate-200 hover:border-indigo-400 text-indigo-700 font-bold text-xs rounded-xl shadow-xs transition-all active:scale-95"
            >
              <Download className="w-3.5 h-3.5" />
              Télécharger Modèle
            </button>
          </div>

          {/* Étape 2 : Fichier */}
          <div className="space-y-2">
            <p className="text-xs font-bold text-slate-900">Étape 2 : Importer votre fichier rempli</p>
            <label className="border-2 border-dashed border-slate-200 hover:border-indigo-400 rounded-2xl p-6 flex flex-col items-center justify-center text-center cursor-pointer bg-slate-50/50 hover:bg-indigo-50/20 transition-all">
              <FileText className="w-8 h-8 text-slate-400 mb-2" />
              <span className="text-xs font-bold text-slate-800">
                {file ? file.name : 'Cliquez pour sélectionner un fichier CSV'}
              </span>
              <span className="text-[10px] text-slate-400 mt-1">Fichiers .csv ou .txt (Séparateur point-virgule ou virgule)</span>
              <input
                type="file"
                accept=".csv,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={isProcessing}
              />
            </label>
          </div>

          {/* Messages de retour */}
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-700 text-xs font-semibold">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {result && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl space-y-1">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Importation réussie : {result.count} enregistrement(s) ajouté(s) avec succès !</span>
              </div>
              {result.errors.length > 0 && (
                <div className="text-[10px] text-amber-700 mt-1">
                  Avertissements : {result.errors.join(', ')}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-white/95 backdrop-blur-md flex items-center justify-end gap-3 pt-3 pb-4 sm:pb-2 border-t border-slate-100 z-20 mt-auto">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-900"
          >
            Fermer
          </button>
          <button
            type="button"
            onClick={handleImport}
            disabled={!file || isProcessing}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-xs text-white shadow-md transition-all ${
              !file || isProcessing
                ? 'bg-slate-300 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700 active:scale-95'
            }`}
          >
            {isProcessing ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                Importation en cours...
              </>
            ) : (
              <>
                <Upload className="w-3.5 h-3.5" />
                Valider l'importation
              </>
            )}
          </button>
        </div>

      </div>
    </div>
  );
};
