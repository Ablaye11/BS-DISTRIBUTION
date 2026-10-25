import React, { useState } from 'react';
import { 
  Factory, Boxes, ShieldCheck, Truck, LogIn, 
  ChevronDown, Zap, Award, Users, Globe2, Phone, CheckCircle2,
  Layers, ArrowRight, Calculator, Leaf, Recycle, Scale
} from 'lucide-react';

interface PublicLandingPageProps {
  onOpenLogin: () => void;
}

const ALVEOLE_CATALOG = [
  {
    id: 'ALV-30-STD',
    title: 'Plateau 30 Œufs Standard',
    format: '30 Alvéoles (295 × 295 mm)',
    badge: 'Standard Avicole Bestseller',
    priceUnit: 45,
    fardeauQty: 100,
    priceFardeau: 4500,
    description: 'Plateau universel pour le ramassage en ferme, transport et vente en gros. Rigidité optimale, emboîtement compact.',
    features: ['100% Pâte de Carton Recyclée', 'Rigidité renforcée anti-écrasement', 'Conditionnement par fardeaux de 100 pcs'],
    color: 'Gris Recyclé Naturel'
  },
  {
    id: 'ALV-30-EXP',
    title: 'Plateau 30 Œufs Renforcé Export',
    format: '30 Alvéoles Haute Densité',
    badge: 'Longue Distance & Camions',
    priceUnit: 55,
    fardeauQty: 100,
    priceFardeau: 5500,
    description: 'Version dense enrichie en liant végétal pour gerbage sur plusieurs mètres en camion sans déformation.',
    features: ['Résistance mécanique supérieure', 'Spécial transport interrégional', 'Fardeau cerclé sous film étanche'],
    color: 'Gris Foncé Kraft'
  },
  {
    id: 'BOX-06',
    title: 'Boîte 6 Œufs Fermante Clipsable',
    format: 'Boîte 6 Alvéoles avec Couvercle',
    badge: 'Grande Distribution & Supérettes',
    priceUnit: 65,
    fardeauQty: 120,
    priceFardeau: 7800,
    description: 'Conditionnement au détail haut de gamme pour supermarchés. Double clip de verrouillage sécurisé.',
    features: ['Fermeture clipsable automatique', 'Face supérieure prête pour étiquette', 'Protection antichoc 360°'],
    color: 'Vert Écologique'
  },
  {
    id: 'BOX-10',
    title: 'Boîte 10 Œufs Format Familial',
    format: 'Boîte 10 Alvéoles Fermante',
    badge: 'Format Grand Public',
    priceUnit: 85,
    fardeauQty: 100,
    priceFardeau: 8500,
    description: 'Boîte 10 alvéoles pour la consommation des ménages et restaurants. Protection thermique et respirabilité.',
    features: ['Protection coquille renforcée', 'Empilement facile en rayon', 'Biodégradable et compostable'],
    color: 'Gris Recyclé Naturel'
  },
  {
    id: 'BOX-12',
    title: 'Boîte 12 Œufs Double Rangée (1 Douzaine)',
    format: 'Boîte 12 Alvéoles (2 × 6)',
    badge: 'Format Premium 1 Douzaine',
    priceUnit: 95,
    fardeauQty: 100,
    priceFardeau: 9500,
    description: 'Le format classique de la douzaine pour les fermes avicoles souhaitant valoriser leur production locale.',
    features: ['Format douzaine premium', 'Haute respirabilité de la pâte moulée', 'Absorption naturelle de l\'humidité'],
    color: 'Blanc Crème Naturel'
  }
];

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onOpenLogin }) => {
  const [selectedFormat, setSelectedFormat] = useState(ALVEOLE_CATALOG[0]);
  const [quantiteFardeaux, setQuantiteFardeaux] = useState(50);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteSuccess, setQuoteSuccess] = useState(false);

  // Formulaire devis
  const [quoteData, setQuoteData] = useState({
    nomFerme: '',
    contact: '',
    telephone: '+221 ',
    region: 'Thiès',
    message: ''
  });

  // Calcul du simulateur
  const totalAlveolesSimule = quantiteFardeaux * selectedFormat.fardeauQty;
  // Tarif dégressif selon volume
  let remisePct = 0;
  if (quantiteFardeaux >= 100) remisePct = 5;
  if (quantiteFardeaux >= 300) remisePct = 10;
  if (quantiteFardeaux >= 500) remisePct = 15;

  const montantBrut = quantiteFardeaux * selectedFormat.priceFardeau;
  const montantRemise = Math.round((montantBrut * remisePct) / 100);
  const montantNet = montantBrut - montantRemise;

  const handleSendQuote = (e: React.FormEvent) => {
    e.preventDefault();
    setQuoteSuccess(true);
    setTimeout(() => {
      setQuoteSuccess(false);
      setShowQuoteModal(false);
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Barre supérieure d'information usine */}
      <div className="bg-slate-950 text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-amber-400 font-semibold">
              <Factory className="w-3.5 h-3.5" />
              Unité Industrielle de Fabrication d'Alvéoles en Pâte Moulée
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:flex items-center gap-1 text-emerald-400">
              <Recycle className="w-3.5 h-3.5" />
              100% Papiers & Cartons Recyclés
            </span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1 text-slate-400">
              <Phone className="w-3 h-3 text-amber-400" />
              Service Commercial : +221 76 622 59 79
            </span>
            <button
              onClick={onOpenLogin}
              className="text-amber-400 hover:text-amber-300 font-bold underline flex items-center gap-1"
            >
              <LogIn className="w-3 h-3" />
              Accès Équipe Usine
            </button>
          </div>
        </div>
      </div>

      {/* Navigation principale */}
      <header className="bg-white/95 backdrop-blur-md sticky top-0 z-40 border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-500 to-amber-400 flex items-center justify-center shadow-lg shadow-amber-500/20 text-slate-950">
              <Factory className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xl font-black tracking-tight text-slate-950">BS ALVÉOLES</span>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-700 border border-slate-200">
                  SÉNÉGAL
                </span>
              </div>
              <p className="text-[11px] text-slate-500 font-medium">Emballages Avicoles Éco-Responsables</p>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-sm font-semibold text-slate-600">
            <a href="#catalogue" className="hover:text-amber-600 transition-colors">Catalogue Alvéoles</a>
            <a href="#simulateur" className="hover:text-amber-600 transition-colors">Simulateur & Tarifs</a>
            <a href="#process" className="hover:text-amber-600 transition-colors">Process Écologique</a>
            <a href="#contact" className="hover:text-amber-600 transition-colors">Contact Usine</a>
          </nav>

          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const el = document.getElementById('simulateur');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="hidden sm:inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs shadow-md transition-all active:scale-95"
            >
              <Calculator className="w-4 h-4 text-amber-400" />
              Devis en Ligne
            </button>
            <button
              onClick={onOpenLogin}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              Accéder à l'ERP Usine
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-12 pb-20 overflow-hidden bg-gradient-to-b from-slate-100 via-white to-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10">
          <div className="text-center max-w-3xl mx-auto space-y-6">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/30 text-amber-900 text-xs font-extrabold shadow-sm">
              <Recycle className="w-4 h-4 text-amber-600 animate-spin-slow" />
              1er Fabricant Sénégalais d'Alvéoles en Pâte Moulée 100% Recyclée
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black text-slate-950 tracking-tight leading-[1.15]">
              Alvéoles & Boîtes d'Œufs{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-600 to-amber-500">
                Haute Résistance
              </span>
            </h1>

            <p className="text-base sm:text-lg text-slate-600 leading-relaxed">
              Pour les fermes avicoles de ponte, couvoirs, grossistes et supermarchés du Sénégal.
              Nos alvéoles protègent vos œufs contre les chocs et l'humidité tout en réduisant vos coûts d'emballage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <a
                href="#simulateur"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-slate-950 hover:bg-slate-900 text-white font-extrabold text-sm shadow-xl transition-all active:scale-95"
              >
                <Calculator className="w-4 h-4 text-amber-400" />
                Calculer un Devis en Direct
              </a>
              <button
                onClick={onOpenLogin}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-2xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/25 transition-all active:scale-95"
              >
                <Factory className="w-4 h-4" />
                Ouvrir le Logiciel de Gestion Usine
              </button>
            </div>
          </div>

          {/* 4 Chiffres Clés Usine */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-16 max-w-5xl mx-auto">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-amber-600">50 000+</div>
              <p className="text-xs font-bold text-slate-700 mt-1">Alvéoles / Jour</p>
              <p className="text-[11px] text-slate-400">Capacité industrielle</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-emerald-600">100%</div>
              <p className="text-xs font-bold text-slate-700 mt-1">Écologique & Recyclé</p>
              <p className="text-[11px] text-slate-400">Papiers & cartons locaux</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-indigo-600">14 Régions</div>
              <p className="text-xs font-bold text-slate-700 mt-1">Livraison Nationale</p>
              <p className="text-[11px] text-slate-400">Dakar, Thiès, Kaolack...</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-center">
              <div className="text-3xl font-black text-slate-900">-25%</div>
              <p className="text-xs font-bold text-slate-700 mt-1">Économie de Coûts</p>
              <p className="text-[11px] text-slate-400">Par rapport au plastique</p>
            </div>
          </div>
        </div>
      </section>

      {/* Catalogue des Formats d'Alvéoles */}
      <section id="catalogue" className="py-16 bg-white border-y border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-amber-600 bg-amber-50 px-3 py-1 rounded-full border border-amber-200">
              Gamme Industrielle
            </span>
            <h2 className="text-3xl font-black text-slate-950 mt-3">Nos Formats d'Alvéoles & Boîtes d'Œufs</h2>
            <p className="text-sm text-slate-600 mt-2">
              Conçus selon les normes avicoles internationales pour s'adapter à toutes les calibres d'œufs de table et de reproduction.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ALVEOLE_CATALOG.map((item) => (
              <div 
                key={item.id}
                className="bg-slate-50/70 rounded-3xl p-6 border border-slate-200 hover:border-amber-400 hover:shadow-xl transition-all duration-300 flex flex-col justify-between group"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-xs font-extrabold px-3 py-1 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                      {item.badge}
                    </span>
                    <span className="text-xs font-bold text-slate-400 font-mono">{item.id}</span>
                  </div>

                  <h3 className="text-lg font-bold text-slate-950 group-hover:text-amber-600 transition-colors">
                    {item.title}
                  </h3>
                  <p className="text-xs text-indigo-700 font-semibold mt-0.5">{item.format}</p>
                  <p className="text-xs text-slate-600 mt-3 leading-relaxed">{item.description}</p>

                  <ul className="mt-4 space-y-2 text-xs text-slate-700">
                    {item.features.map((feat, i) => (
                      <li key={i} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-4 border-t border-slate-200">
                  <div className="flex items-end justify-between">
                    <div>
                      <span className="text-[10px] text-slate-400 block font-semibold">Prix Unitaire indicatif</span>
                      <span className="text-2xl font-black text-slate-950">{item.priceUnit} FCFA</span>
                      <span className="text-[10px] text-slate-500 block">
                        Fardeau de {item.fardeauQty} pcs : {item.priceFardeau.toLocaleString()} FCFA
                      </span>
                    </div>

                    <button
                      onClick={() => {
                        setSelectedFormat(item);
                        const el = document.getElementById('simulateur');
                        el?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition-colors"
                    >
                      Simuler
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Simulateur de Commande & Devis en Direct */}
      <section id="simulateur" className="py-16 bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-400 bg-amber-500/20 px-3 py-1 rounded-full border border-amber-500/30">
              Outil Dégressif Grossistes & Fermes
            </span>
            <h2 className="text-3xl font-black mt-3">Simulateur de Devis en Direct</h2>
            <p className="text-sm text-slate-300 mt-2">
              Bénéficiez de remises immédiates sur vos volumes par camion ou fardeaux complets.
            </p>
          </div>

          <div className="bg-slate-800/90 rounded-3xl p-6 sm:p-8 border border-slate-700 shadow-2xl backdrop-blur-md grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Colonne réglages */}
            <div className="space-y-6">
              <div>
                <label className="block text-xs font-bold text-slate-300 uppercase tracking-wider mb-2">
                  1. Choisissez le Format d'Alvéole
                </label>
                <div className="space-y-2">
                  {ALVEOLE_CATALOG.map((item) => (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setSelectedFormat(item)}
                      className={`w-full p-3 rounded-xl text-left border transition-all flex items-center justify-between text-xs ${
                        selectedFormat.id === item.id
                          ? 'bg-amber-500 text-slate-950 font-bold border-amber-400 shadow-md'
                          : 'bg-slate-900/60 border-slate-700 text-slate-300 hover:border-slate-500'
                      }`}
                    >
                      <div>
                        <div className="font-extrabold">{item.title}</div>
                        <span className={`text-[10px] ${selectedFormat.id === item.id ? 'text-slate-900' : 'text-slate-400'}`}>
                          {item.fardeauQty} pcs/fardeau • {item.priceUnit} FCFA/alv.
                        </span>
                      </div>
                      <span className="font-mono font-black">{item.priceFardeau.toLocaleString()} F/fard.</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    2. Quantité en Fardeaux
                  </label>
                  <span className="text-amber-400 font-extrabold text-sm">{quantiteFardeaux} Fardeaux</span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="1000"
                  step="10"
                  value={quantiteFardeaux}
                  onChange={(e) => setQuantiteFardeaux(Number(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1">
                  <span>10 fard. (1 000 pcs)</span>
                  <span>100 fard. (-5%)</span>
                  <span>300 fard. (-10%)</span>
                  <span>500+ fard. (-15%)</span>
                </div>
              </div>
            </div>

            {/* Colonne Résultat du Devis */}
            <div className="bg-slate-950 rounded-2xl p-6 border border-slate-800 flex flex-col justify-between">
              <div>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-4">
                  Estimation du Bon de Commande
                </span>

                <div className="space-y-3 text-xs">
                  <div className="flex justify-between text-slate-300">
                    <span>Format sélectionné :</span>
                    <span className="font-bold text-white">{selectedFormat.title}</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Nombre de fardeaux :</span>
                    <span className="font-bold text-white">{quantiteFardeaux} fardeaux</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Quantité totale d'alvéoles :</span>
                    <span className="font-bold text-indigo-400 text-sm">{totalAlveolesSimule.toLocaleString()} unités</span>
                  </div>
                  <div className="flex justify-between text-slate-300">
                    <span>Montant Brut :</span>
                    <span className="font-mono">{montantBrut.toLocaleString()} FCFA</span>
                  </div>
                  {remisePct > 0 && (
                    <div className="flex justify-between text-emerald-400 font-semibold">
                      <span>Remise Volume Spéciale ({remisePct}%) :</span>
                      <span>-{montantRemise.toLocaleString()} FCFA</span>
                    </div>
                  )}

                  <div className="pt-4 mt-2 border-t border-slate-800 flex justify-between items-baseline">
                    <span className="text-sm font-bold text-white">Montant Total Net :</span>
                    <span className="text-3xl font-black text-amber-400 tracking-tight">
                      {montantNet.toLocaleString()}{' '}
                      <span className="text-xs font-normal text-slate-400">FCFA</span>
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-500 italic mt-1">
                    * Hors frais de transport éventuels selon la région de livraison.
                  </p>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-800">
                <button
                  onClick={() => setShowQuoteModal(true)}
                  className="w-full py-3.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-sm shadow-lg shadow-amber-500/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <Phone className="w-4 h-4" />
                  Valider ce Devis & Être Contacté
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Process Écologique & Recyclage */}
      <section id="process" className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="text-xs font-extrabold uppercase tracking-wider text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200">
              Économie Circulaire
            </span>
            <h2 className="text-3xl font-black text-slate-950 mt-3">Le Processus de Pâte Moulée Écologique</h2>
            <p className="text-sm text-slate-600 mt-2">
              Comment nous transformons les vieux cartons sénégalais en emballages protecteurs rigides et biodégradables.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mx-auto font-black text-lg mb-4">
                1
              </div>
              <h3 className="font-bold text-slate-900 text-base">Collecte & Tri OCC</h3>
              <p className="text-xs text-slate-600 mt-2">
                Récupération de balles de cartons recyclés auprès des entreprises et collecteurs locaux.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-800 flex items-center justify-center mx-auto font-black text-lg mb-4">
                2
              </div>
              <h3 className="font-bold text-slate-900 text-base">Pulpage & Brassage</h3>
              <p className="text-xs text-slate-600 mt-2">
                Défibrage mécanique dans l'eau avec liants végétaux sans produits chimiques toxiques.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center mx-auto font-black text-lg mb-4">
                3
              </div>
              <h3 className="font-bold text-slate-900 text-base">Moulage sous Vide</h3>
              <p className="text-xs text-slate-600 mt-2">
                Aspiration précise sur moules d'alvéoles rotatifs pour un calibrage millimétrique.
              </p>
            </div>

            <div className="p-6 rounded-2xl bg-slate-50 border border-slate-200 text-center">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mx-auto font-black text-lg mb-4">
                4
              </div>
              <h3 className="font-bold text-slate-900 text-base">Séchage & Cerclage</h3>
              <p className="text-xs text-slate-600 mt-2">
                Tunnel de séchage continu à 200°C et conditionnement sous fardeaux prêts pour chargement.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer id="contact" className="bg-slate-950 text-white py-12 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500 text-slate-950 font-black flex items-center justify-center">
              <Factory className="w-5 h-5" />
            </div>
            <div>
              <span className="font-black text-base">BS ALVÉOLES SÉNÉGAL</span>
              <p className="text-xs text-slate-400">Unité de Production d'Emballages en Pâte Moulée</p>
            </div>
          </div>

          <div className="text-center md:text-right text-xs text-slate-400">
            <p>Usine & Service Commercial : Dakar / Keur Massar / Régions</p>
            <p className="text-slate-500 mt-1">© 2026 BS DISTRIBUTION SUARL • Tous droits réservés</p>
          </div>
        </div>
      </footer>

      {/* Modal Devis Rapide */}
      {showQuoteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Demande de Devis d'Alvéoles</h3>
              <button onClick={() => setShowQuoteModal(false)} className="text-slate-400">✕</button>
            </div>

            {quoteSuccess ? (
              <div className="py-8 text-center space-y-3">
                <CheckCircle2 className="w-12 h-12 text-emerald-600 mx-auto" />
                <h4 className="font-bold text-slate-900 text-base">Demande envoyée avec succès !</h4>
                <p className="text-xs text-slate-600">
                  Notre équipe commerciale va vous rappeler sous 30 minutes avec votre bon de commande proforma.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSendQuote} className="mt-4 space-y-3">
                <div className="p-3 bg-amber-50 rounded-xl text-xs text-amber-900 font-medium">
                  {quantiteFardeaux} fardeaux de {selectedFormat.title} • Net : {montantNet.toLocaleString()} FCFA
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom de la Ferme / Entreprise</label>
                  <input
                    type="text"
                    required
                    value={quoteData.nomFerme}
                    onChange={e => setQuoteData({ ...quoteData, nomFerme: e.target.value })}
                    placeholder="Ex: Ferme Avicole du Saloum"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Nom du Contact</label>
                  <input
                    type="text"
                    required
                    value={quoteData.contact}
                    onChange={e => setQuoteData({ ...quoteData, contact: e.target.value })}
                    placeholder="Votre nom"
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Téléphone WhatsApp / Appel</label>
                  <input
                    type="text"
                    required
                    value={quoteData.telephone}
                    onChange={e => setQuoteData({ ...quoteData, telephone: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200 font-bold"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Région de Livraison</label>
                  <select
                    value={quoteData.region}
                    onChange={e => setQuoteData({ ...quoteData, region: e.target.value })}
                    className="w-full text-xs p-2.5 rounded-lg border border-slate-200"
                  >
                    <option value="Thiès">Thiès</option>
                    <option value="Dakar">Dakar</option>
                    <option value="Diourbel">Diourbel</option>
                    <option value="Fatick">Fatick</option>
                    <option value="Kaolack">Kaolack</option>
                    <option value="Saint-Louis">Saint-Louis</option>
                    <option value="Autre Région">Autre Région</option>
                  </select>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="px-3 py-2 text-xs font-semibold text-slate-600"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 text-xs font-bold text-slate-950 bg-amber-500 hover:bg-amber-400 rounded-lg shadow-md"
                  >
                    Envoyer ma demande
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
