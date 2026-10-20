import React, { useState, useEffect } from 'react';
import { 
  ShoppingBag, Building2, Phone, CheckCircle2, 
  ShieldCheck, Truck, LogIn, 
  ChevronDown, Zap, Award, Users, Globe2, Menu, X 
} from 'lucide-react';
import { PublicPortalModal } from './PublicPortalModal';

interface PublicLandingPageProps {
  onOpenLogin: () => void;
}

const PRODUCTS = [
  {
    id: 'GROS',
    image: '/gros_real.png',
    title: 'Œufs Extra & Gros Calibre',
    badge: 'Bestseller Grossistes & Supérettes',
    priceUnit: 85,
    minCmd: '1 500 œufs',
    description: 'Œufs frais de gros calibre issus d\'élevages sénégalais contrôlés. Coquille solide, jaune éclatant, fraîcheur garantie.',
    features: ['Calibre Supérieur > 60g', 'Livraison Tout le Sénégal (14 Régions)', 'Contrôle Sanitaire Strict'],
  },
  {
    id: 'POULETTES',
    image: '/poulettes_real.png',
    title: 'Œufs Calibre Moyen (Poulettes)',
    badge: 'Restaurants & Ménages',
    priceUnit: 75,
    minCmd: '1 000 œufs',
    description: 'Parfaits pour la restauration rapide, pâtisseries et consommation familiale. Prix compétitif en demi-gros.',
    features: ['Calibre 50g – 55g', 'Enlèvement Dépôt ou Livraison Régions', 'Prix Compétitif en Gros'],
  },
  {
    id: 'FISSURES',
    image: '/fissures_real.png',
    title: 'Œufs Fissurés Cat. 1',
    badge: 'Économique Pâtisseries',
    priceUnit: 60,
    minCmd: '500 œufs',
    description: 'Œufs ultra-frais avec légère fissure de transport. Idéaux en cuisine, pâtisserie, boulangerie. Tarif réduit.',
    features: ['Ultra-Frais du jour', 'Tarif Réduit Spécial', 'Expédition Régionale Sécurisée'],
  }
];

const STATS = [
  { icon: Award, val: '+5 ans', label: "D'expérience au Sénégal" },
  { icon: Globe2, val: '14 Régions', label: 'Couverture Nationale' },
  { icon: Truck, val: '48h', label: 'Délai Livraison Régions' },
  { icon: Zap, val: '100%', label: 'Fraîcheur Garantie' },
];

export const PublicLandingPage: React.FC<PublicLandingPageProps> = ({ onOpenLogin }) => {
  const [showOrderModal, setShowOrderModal]   = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [qty, setQty]                         = useState(1500);
  const [selProd, setSelProd]                 = useState(PRODUCTS[0]);
  const [scrolled, setScrolled]               = useState(false);
  const [floatVisible, setFloatVisible]       = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 60);
      setFloatVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const total = qty * selProd.priceUnit;
  const waUrl = `https://wa.me/221766225979?text=${encodeURIComponent(`Bonjour BS Distribution SUARL, je voudrais commander ${qty.toLocaleString()} ${selProd.title} (${total.toLocaleString()} FCFA).`)}`;

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-slate-900 font-sans antialiased overflow-x-hidden relative">

      {/* ══ FULL-PAGE FIXED BACKGROUND IMAGE ════════════════════════════════ */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden opacity-25">
        <img 
          src="/farm_bg.png" 
          alt="BS Distribution Poultry Farm" 
          className="w-full h-full object-cover filter brightness-105 contrast-105" 
        />
      </div>

      {/* ══ TOP INFO BAR ═════════════════════════════════════════════════════ */}
      <div className="fixed top-0 left-0 right-0 z-[501] bg-slate-900 text-white text-[11px] font-bold px-3 md:px-4 py-2 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2 md:gap-4 overflow-hidden">
          <span className="flex items-center gap-1.5 text-amber-400 truncate">
            <Globe2 className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">Vente & Livraison dans les 14 Régions du Sénégal</span>
          </span>
          <span className="hidden sm:flex items-center gap-1.5 text-emerald-400 shrink-0">
            <CheckCircle2 className="w-3 h-3" />
            Paiement Wave / OM
          </span>
        </div>
        <span className="text-white/80 font-mono text-[10px] md:text-xs shrink-0">📞 +221 76 622 59 79</span>
      </div>

      {/* ══ MAIN NAVBAR ══════════════════════════════════════════════════════ */}
      <nav className={`fixed top-8 left-0 right-0 z-[500] bg-white/95 backdrop-blur-md transition-all duration-300 ${
        scrolled
          ? 'shadow-lg border-b-2 border-amber-400'
          : 'border-b border-slate-200 shadow-sm'
      }`}>
        <div className="max-w-7xl mx-auto px-4 md:px-8 h-16 md:h-18 flex items-center justify-between gap-2 md:gap-4 py-2 md:py-3">
          
          {/* Logo & Name */}
          <div className="flex items-center gap-2 md:gap-3 shrink-0">
            <div className="h-10 w-10 md:h-14 md:w-14 rounded-xl md:rounded-2xl bg-white border border-amber-400 flex items-center justify-center shadow-sm overflow-hidden">
              <img src="/logo.png" alt="BS DISTRIBUTION" className="h-7 md:h-10 w-auto object-contain" />
            </div>
            <div>
              <div className="flex items-center gap-1.5 md:gap-2">
                <span className="font-black text-slate-900 text-sm md:text-xl tracking-tight font-display">BS DISTRIBUTION</span>
                <span className="text-[8px] md:text-[9px] font-black bg-amber-500 text-slate-950 px-1.5 py-0.5 rounded uppercase tracking-widest shadow-xs">SUARL</span>
              </div>
              <p className="text-[9px] md:text-[10px] text-slate-500 font-semibold hidden sm:block mt-0.5">
                🌐 Distribution Nationale d'Œufs Frais — Toutes Régions du Sénégal
              </p>
            </div>
          </div>

          <div className="hidden lg:block w-px h-10 bg-slate-200 mx-2" />

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-1 text-xs font-extrabold text-slate-700">
            {[
              { href: '#catalogue', label: 'Catalogue Œufs' },
              { href: '#calculateur', label: 'Simulateur Prix' },
              { href: '#partenaires', label: 'Poulaillers' },
            ].map(link => (
              <a
                key={link.href}
                href={link.href}
                className="relative px-4 py-2.5 rounded-xl hover:bg-slate-100 hover:text-slate-900 transition-all group font-bold"
              >
                {link.label}
                <span className="absolute bottom-1 left-4 right-4 h-0.5 bg-amber-500 scale-x-0 group-hover:scale-x-100 transition-transform duration-300 rounded-full" />
              </a>
            ))}
          </div>

          {/* Desktop & Mobile Actions */}
          <div className="flex items-center gap-1.5 md:gap-3 shrink-0">
            <a
              href={waUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex px-3 md:px-4 py-2 md:py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm items-center gap-2 transition-all active:scale-95"
            >
              <Phone className="w-4 h-4" />
              <span>WhatsApp</span>
            </a>

            <button
              onClick={() => setShowOrderModal(true)}
              className="px-3 md:px-4 py-2 md:py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-sm flex items-center gap-1.5 md:gap-2 transition-all active:scale-95 border border-amber-600/30"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Commander</span>
            </button>

            <button
              onClick={onOpenLogin}
              className="px-2.5 md:px-3 py-2 md:py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center gap-1.5 md:gap-2 transition-all active:scale-95"
            >
              <LogIn className="w-4 h-4" />
              <span className="hidden sm:inline">Équipe</span>
            </button>

            {/* Mobile Hamburger Toggle Button (md:hidden) */}
            <button
              onClick={() => setIsMobileNavOpen(!isMobileNavOpen)}
              className="md:hidden p-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-300 transition-all ml-1"
              aria-label="Menu"
            >
              {isMobileNavOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5 text-amber-600" />}
            </button>
          </div>
        </div>

        {/* Slide-Down Mobile Navigation Menu */}
        {isMobileNavOpen && (
          <div className="md:hidden bg-white border-b-2 border-amber-400 p-4 space-y-3 shadow-2xl animate-in slide-in-from-top duration-300 font-sans">
            <div className="flex flex-col space-y-1">
              <a
                href="#catalogue"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-900 font-extrabold text-xs flex items-center justify-between border border-slate-200"
              >
                <span>📦 Catalogue & Tarifs Œufs</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </a>

              <a
                href="#calculateur"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-900 font-extrabold text-xs flex items-center justify-between border border-slate-200"
              >
                <span>🧮 Simulateur de Prix en Direct</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </a>

              <a
                href="#partenaires"
                onClick={() => setIsMobileNavOpen(false)}
                className="p-3 rounded-xl bg-slate-50 hover:bg-amber-50 text-slate-900 font-extrabold text-xs flex items-center justify-between border border-slate-200"
              >
                <span>🐓 Poulaillers & Éleveurs Partenaires</span>
                <ChevronDown className="w-4 h-4 -rotate-90 text-slate-400" />
              </a>
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col gap-2">
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full p-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" />
                <span>Contact WhatsApp (+221 76 622 59 79)</span>
              </a>

              <button
                onClick={() => {
                  setIsMobileNavOpen(false);
                  onOpenLogin();
                }}
                className="w-full p-3 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2"
              >
                <LogIn className="w-4 h-4 text-amber-400" />
                <span>Espace Connexion Équipe</span>
              </button>
            </div>
          </div>
        )}
      </nav>

      {/* ══ HERO SECTION ═════════════════════════════════════════════════════ */}
      <section className="relative pt-40 pb-16 md:pt-48 md:pb-12 z-10">
        <div className="max-w-6xl mx-auto px-4 md:px-8 space-y-10">
          
          {/* Centered Text Header */}
          <div className="text-center space-y-6 max-w-4xl mx-auto">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/90 border border-slate-200 text-amber-900 text-xs font-extrabold shadow-sm">
              <Globe2 className="w-4 h-4 text-amber-600" />
              <span>Réseau N°1 de Distribution d'Œufs dans TOUTES les Régions du Sénégal</span>
            </div>

            <h1 className="text-3xl md:text-5xl lg:text-6xl font-black text-slate-900 leading-tight font-display tracking-tight">
              Œufs Frais de Table <br />
              <span className="bg-gradient-to-r from-amber-600 via-amber-700 to-amber-800 bg-clip-text text-transparent">
                Qualité Supérieure — Tout le Sénégal
              </span>
            </h1>

            <p className="text-sm md:text-base text-slate-700 max-w-2xl mx-auto font-semibold leading-relaxed">
              Grossistes, supérettes, restaurants, boulangeries & ménages : approvisionnez-vous directement à Dakar, Thiès, Touba, Saint-Louis, Kaolack, Ziguinchor et dans l'ensemble des 14 régions du Sénégal.
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3 pt-1">
              {[
                { icon: CheckCircle2, text: 'Qualité Contrôlée' },
                { icon: Truck, text: 'Livraison 14 Régions du Sénégal' },
                { icon: ShieldCheck, text: 'Wave / Orange Money' }
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-2 text-xs font-extrabold text-slate-800 bg-white/90 px-3.5 py-1.5 rounded-full border border-slate-200 shadow-sm">
                  <item.icon className="w-4 h-4 text-amber-600" />
                  <span>{item.text}</span>
                </div>
              ))}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-sm rounded-2xl shadow-md flex items-center justify-center gap-3 transition-all active:scale-95 border border-amber-600/30"
              >
                <ShoppingBag className="w-5 h-5" />
                <span>Commander en Ligne</span>
              </button>

              <a
                href="#catalogue"
                className="w-full sm:w-auto px-6 py-4 bg-white hover:bg-slate-50 text-slate-800 font-extrabold text-sm rounded-2xl border border-slate-300 flex items-center justify-center gap-2 transition-all shadow-sm"
              >
                <span>Voir le Catalogue</span>
                <ChevronDown className="w-4 h-4 text-slate-600" />
              </a>
            </div>
          </div>

          {/* Full-width edge-to-edge Photo Banner */}
          <div className="relative w-screen left-1/2 -translate-x-1/2 overflow-hidden shadow-xl border-y border-slate-200">
            <img
              src="/hero_realistic.png"
              alt="Élevage d'Œufs BS Distribution"
              className="w-full h-72 sm:h-96 md:h-[480px] object-cover"
            />
            <div className="absolute bottom-0 left-0 right-0 px-8 py-5 bg-white border-t border-slate-200 shadow-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div>
                <p className="text-[10px] text-amber-700 font-extrabold uppercase tracking-widest">Disponibilité & Logistique Nationale</p>
                <p className="text-sm md:text-base font-black text-slate-900 mt-0.5 font-display">Siège Keur Massar — Envoi Quotidien Dakar & Toutes les Régions du Sénégal</p>
              </div>
              <span className="px-4 py-2 bg-emerald-100 text-emerald-800 border border-emerald-300 text-xs font-black rounded-full shrink-0">
                ✅ Stock Disponible & Expédition Nationale
              </span>
            </div>
          </div>

        </div>
      </section>

      {/* ══ STATS SECTION ════════════════════════════════════════════════════ */}
      <section className="py-12 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {STATS.map((s, i) => {
              const Icon = s.icon;
              return (
                <div key={i} className="bg-white/95 p-5 rounded-2xl border border-slate-200 text-center shadow-md hover:shadow-lg transition-all">
                  <Icon className="w-6 h-6 text-amber-600 mx-auto mb-2" />
                  <p className="text-2xl md:text-3xl font-black text-slate-900 font-display">{s.val}</p>
                  <p className="text-xs text-slate-600 font-bold mt-1">{s.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══ CATALOGUE SECTION ════════════════════════════════════════════════ */}
      <section id="catalogue" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-12">
          
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <span className="text-xs font-extrabold bg-amber-50 text-amber-900 border border-amber-300 px-3.5 py-1 rounded-full uppercase tracking-wider shadow-xs">
              NOTRE CATALOGUE NATIONAL
            </span>
            <h2 className="text-3xl md:text-4xl font-black text-slate-900 font-display">
              Œufs Frais de Table — Tarifs & Distribution
            </h2>
            <p className="text-xs md:text-sm text-slate-700 font-semibold">
              Consultez nos catégories et commandez directement pour une livraison dans votre région au Sénégal.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {PRODUCTS.map(prod => (
              <div
                key={prod.id}
                className="bg-white/95 rounded-3xl border border-slate-200 shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-60 bg-slate-100 overflow-hidden">
                    <img
                      src={prod.image}
                      alt={prod.title}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3">
                      <span className="px-3 py-1 bg-amber-500 text-slate-950 font-black text-[10px] rounded-full shadow-sm">
                        {prod.badge}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-4">
                    <h3 className="text-lg font-extrabold text-slate-900 font-display">{prod.title}</h3>
                    <p className="text-xs text-slate-600 leading-relaxed font-medium">{prod.description}</p>

                    <div className="space-y-1.5 pt-2">
                      {prod.features.map((feat, fi) => (
                        <div key={fi} className="flex items-center gap-2 text-xs text-slate-700 font-semibold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 space-y-4">
                  <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                    <div>
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Prix Unitaire</p>
                      <p className="text-xl font-black text-amber-700 font-display">{prod.priceUnit} FCFA <span className="text-xs font-normal text-slate-500">/ œuf</span></p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-slate-500 font-bold uppercase">Commande Min.</p>
                      <p className="text-xs font-extrabold text-slate-900">{prod.minCmd}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelProd(prod);
                      setShowOrderModal(true);
                    }}
                    className="w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-xs rounded-xl shadow-sm flex items-center justify-center gap-2 transition-all active:scale-95"
                  >
                    <ShoppingBag className="w-4 h-4 text-amber-400" />
                    <span>Commander Cette Catégorie</span>
                  </button>
                </div>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* ══ LIVE CALCULATOR SECTION ══════════════════════════════════════════ */}
      <section id="calculateur" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 space-y-10">
          
          <div className="text-center space-y-3 max-w-3xl mx-auto">
            <span className="text-xs font-black bg-slate-900 text-white px-4 py-1.5 rounded-full uppercase tracking-wider shadow-sm inline-flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              SIMULATEUR DE PRIX EN DIRECT & ESTIMATION INSTANTANÉE
            </span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 font-display tracking-tight">
              Calculez le Montant de Votre Commande
            </h2>
            <p className="text-sm text-slate-700 font-semibold">
              Obtenez immédiatement votre devis sur mesure avec calcul de livraison pour toutes les régions du Sénégal.
            </p>
          </div>

          <div className="bg-white/95 border border-slate-200 rounded-[32px] p-6 md:p-12 space-y-10 shadow-xl">
            
            {/* Step 1: Product Selection Cards */}
            <div className="space-y-4">
              <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">1</span>
                CHOISISSEZ LE PRODUIT DÉSIRÉ :
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
                {PRODUCTS.map(p => {
                  const isSelected = selProd.id === p.id;
                  return (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelProd(p)}
                      className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between gap-3 ${
                        isSelected
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-md'
                          : 'bg-white text-slate-800 border-slate-200 hover:border-slate-400'
                      }`}
                    >
                      <div>
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-black px-2.5 py-0.5 rounded-full uppercase ${
                            isSelected ? 'bg-slate-950 text-white' : 'bg-slate-100 text-slate-700'
                          }`}>
                            {p.badge}
                          </span>
                          {isSelected && <CheckCircle2 className="w-5 h-5 text-slate-950 shrink-0" />}
                        </div>
                        <p className="text-base font-black font-display leading-snug">{p.title}</p>
                      </div>

                      <div className="pt-2 border-t border-current/15 flex items-baseline justify-between">
                        <span className="text-xs font-bold opacity-80">Prix Unitaire :</span>
                        <span className="text-2xl font-black font-display">{p.priceUnit} FCFA <span className="text-xs font-normal">/ œuf</span></span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Quantity Direct Typing & Slider */}
            <div className="space-y-5 bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <label className="text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-2">
                  <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 flex items-center justify-center font-black text-xs">2</span>
                  SAISISSEZ OU AJUSTEZ LA QUANTITÉ D'ŒUFS :
                </label>
                
                {/* Direct Typing Input Box */}
                <div className="flex items-center gap-3 bg-white border-2 border-slate-300 rounded-2xl px-5 py-3 shadow-xs focus-within:border-slate-900">
                  <input
                    type="number"
                    min="100"
                    max="500000"
                    step="100"
                    value={qty || ''}
                    onChange={e => setQty(Math.max(0, Number(e.target.value)))}
                    className="w-44 bg-transparent text-slate-900 font-black text-2xl font-display focus:outline-none text-right"
                    placeholder="Ex: 5000"
                  />
                  <span className="text-sm font-extrabold text-slate-600">œufs</span>
                </div>
              </div>

              {/* Range Slider */}
              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={Math.min(qty, 50000)}
                onChange={e => setQty(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer h-3 bg-slate-200 rounded-xl"
              />

              {/* Quick Presets */}
              <div className="flex items-center justify-between flex-wrap gap-2 pt-2">
                <span className="text-xs text-slate-600 font-extrabold">Raccourcis Quantités Courantes :</span>
                <div className="flex items-center flex-wrap gap-2">
                  {[1500, 3000, 5000, 10000, 20000, 47000].map(preset => (
                    <button
                      key={preset}
                      type="button"
                      onClick={() => setQty(preset)}
                      className={`px-3.5 py-1.5 rounded-xl text-xs font-black border transition-all ${
                        qty === preset
                          ? 'bg-amber-500 text-slate-950 border-amber-600 shadow-xs'
                          : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.toLocaleString()} œufs
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Step 3: Total Result Display Box */}
            <div className="p-6 md:p-8 bg-slate-900 text-white rounded-3xl border border-slate-800 flex flex-col lg:flex-row items-center justify-between gap-6 shadow-xl">
              <div className="space-y-1 text-center lg:text-left">
                <span className="text-xs font-extrabold text-amber-400 uppercase tracking-widest block">MONTANT TOTAL ESTIMÉ DE LA COMMANDE</span>
                <div className="flex items-baseline justify-center lg:justify-start gap-2">
                  <span className="text-4xl md:text-5xl font-black text-amber-400 font-display tracking-tight">
                    {total.toLocaleString('fr-FR')}
                  </span>
                  <span className="text-xl font-black text-white font-display">FCFA</span>
                </div>
                <p className="text-xs text-slate-400 font-medium pt-1">
                  Détail : {qty.toLocaleString()} œufs x {selProd.priceUnit} FCFA | Expédition & Livraison dans les 14 Régions du Sénégal
                </p>
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
                <button
                  onClick={() => setShowOrderModal(true)}
                  className="w-full sm:w-auto px-6 py-4 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-95 border border-amber-600/30"
                >
                  <ShoppingBag className="w-5 h-5" />
                  <span>Commander Directement en Ligne</span>
                </button>

                <a
                  href={waUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full sm:w-auto px-6 py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-2xl shadow-md flex items-center justify-center gap-2.5 transition-all active:scale-95"
                >
                  <Phone className="w-5 h-5" />
                  <span>Valider sur WhatsApp</span>
                </a>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ══ FARM PARTNERSHIP SECTION ═════════════════════════════════════════ */}
      <section id="partenaires" className="py-20 z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8">
          <div className="bg-white/95 border border-slate-200 rounded-3xl p-8 md:p-12 shadow-lg grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            
            <div className="lg:col-span-8 space-y-4">
              <span className="text-xs font-extrabold bg-purple-100 text-purple-900 border border-purple-300 px-3 py-1 rounded-full uppercase">
                ÉLEVEURS & POULAILLERS DE TOUTES LES RÉGIONS
              </span>
              <h2 className="text-2xl md:text-4xl font-black text-slate-900 font-display">
                Devenez Ferme Partenaire BS Distribution
              </h2>
              <p className="text-xs md:text-sm text-slate-600 font-medium leading-relaxed">
                Vous possédez un poulailler au Sénégal (Dakar, Thiès, Kaolack, Saint-Louis, Diourbel...) ? Vendez toute votre production d'œufs en toute sérénité à BS Distribution avec paiement sécurisé et enlèvement régulier.
              </p>
            </div>

            <div className="lg:col-span-4 text-center lg:text-right">
              <button
                onClick={() => setShowOrderModal(true)}
                className="w-full sm:w-auto px-8 py-4 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-2xl shadow-md transition-all active:scale-95"
              >
                Proposer Ma Ferme
              </button>
            </div>

          </div>
        </div>
      </section>

      {/* ══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer className="bg-slate-900 border-t border-slate-800 py-10 text-slate-400 text-xs z-10 relative">
        <div className="max-w-7xl mx-auto px-4 md:px-8 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src="/logo.png" alt="BS Distribution" className="h-8 w-auto" />
            <div>
              <p className="font-extrabold text-white text-sm font-display">BS DISTRIBUTION SUARL</p>
              <p className="text-[10px] text-slate-500 font-medium">Vente, Logistique & Distribution Nationale d'Œufs — 14 Régions du Sénégal</p>
            </div>
          </div>
          <div className="text-center sm:text-right space-y-1 text-[11px] font-medium">
            <p>Téléphone / WhatsApp : <strong className="text-amber-400">+221 76 622 59 79</strong></p>
            <p>© 2025 BS Distribution SUARL. Tous droits réservés.</p>
          </div>
        </div>
      </footer>

      {/* Floating WhatsApp Button */}
      {floatVisible && (
        <div className="fixed bottom-6 right-6 z-[400]">
          <a
            href={waUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="w-14 h-14 bg-emerald-600 hover:bg-emerald-700 text-white rounded-full shadow-xl flex items-center justify-center transition-all active:scale-95"
          >
            <Phone className="w-6 h-6" />
          </a>
        </div>
      )}

      {showOrderModal && (
        <PublicPortalModal onClose={() => setShowOrderModal(false)} />
      )}
    </div>
  );
};
