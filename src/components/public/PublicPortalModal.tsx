import React, { useState } from 'react';
import { ShoppingBag, Building2, CheckCircle2, X, Send, Phone, CreditCard, Download, ShieldCheck, QrCode, ArrowRight, Copy, Check } from 'lucide-react';
import { SenegalRegion, EggCategoryType, PaymentMethod } from '../../types';
import { db, generateInvoiceNumber } from '../../db/database';
import { SENEGAL_GEOGRAPHY } from '../../utils/senegalData';
import { initiateWavePayment, initiateOrangeMoneyPayment, verifyPaymentStatus, PaymentInitiationResult } from '../../services/paymentApiService';
import { generateInvoicePDF } from '../pdf/InvoicePDFGenerator';

interface PublicPortalModalProps {
  onClose: () => void;
}

type TabType = 'ORDER' | 'PARTNER';

export const PublicPortalModal: React.FC<PublicPortalModalProps> = ({ onClose }) => {
  const [activeTab, setActiveTab]       = useState<TabType>('ORDER');
  const [isSubmitted, setIsSubmitted]   = useState(false);
  const [ticketRef, setTicketRef]       = useState('');
  const [totalPrice, setTotalPrice]     = useState(0);
  const [loading, setLoading]           = useState(false);
  const [paymentDone, setPaymentDone]   = useState(false);
  const [paymentResult, setPaymentResult] = useState<PaymentInitiationResult | null>(null);
  const [copiedUssd, setCopiedUssd]     = useState(false);
  const [invoiceObj, setInvoiceObj]     = useState<any>(null);

  // Form State: Order Request
  const [orderForm, setOrderForm] = useState({
    raisonSociale: '',
    nomContact: '',
    telephone: '',
    region: 'Dakar' as SenegalRegion,
    commune: 'Keur Massar',
    adresse: '',
    quantiteOeufs: 1500,
    typeOeufs: 'Œufs Gros Calibre' as EggCategoryType,
    modePaiement: 'Wave' as PaymentMethod,
    remarques: ''
  });

  // Form State: Partner Request
  const [partnerForm, setPartnerForm] = useState({
    nomPoulailler: '',
    proprietaire: '',
    telephone: '',
    region: 'Dakar' as SenegalRegion,
    commune: 'Keur Massar Nord',
    capaciteProduction: 6000,
    adresseFerme: '',
    notes: ''
  });

  const getPricePerEgg = (type: EggCategoryType) => {
    if (type === 'Œufs Gros Calibre') return 85;
    if (type === 'Œufs Poulettes') return 75;
    return 60;
  };

  // Handle Order Submission & Payment API Checkout
  const handleOrderSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const now = new Date().toISOString();
    const today = now.split('T')[0];
    const { numero, numeroBL } = await generateInvoiceNumber();

    const clientId = `cli-pub-${Date.now()}`;
    const unitPrice = getPricePerEgg(orderForm.typeOeufs);
    const totalFCFA = Number(orderForm.quantiteOeufs) * unitPrice;
    setTotalPrice(totalFCFA);

    const isPaidOnline = orderForm.modePaiement === 'Wave' || orderForm.modePaiement === 'Orange Money';

    // 1. Create Client record
    await db.clients.add({
      id: clientId,
      raisonSociale: orderForm.raisonSociale,
      responsable: orderForm.nomContact,
      telephone: orderForm.telephone,
      adresse: orderForm.adresse || orderForm.commune,
      region: orderForm.region,
      departement: 'Keur Massar',
      commune: orderForm.commune,
      categorie: 'Boutique',
      commercialId: 'usr-com1',
      commercialName: 'Achat Direct Portail Web',
      soldeCreance: isPaidOnline ? 0 : totalFCFA,
      totalAchatsFCFA: totalFCFA,
      createdAt: today
    });

    // 2. Create Invoice Record
    const newInvoice = {
      id: `inv-pub-${Date.now()}`,
      numero,
      numeroBL,
      clientId,
      clientNom: orderForm.raisonSociale,
      commercialId: 'usr-com1',
      commercialNom: 'Commande Directe Web',
      date: today,
      items: [{
        typeOeuf: orderForm.typeOeufs,
        quantiteOeufs: Number(orderForm.quantiteOeufs),
        prixUnitaireOeuf: unitPrice,
        totalFCFA: totalFCFA
      }],
      montantTotalFCFA: totalFCFA,
      totalFCFA: totalFCFA,
      acompteFCFA: isPaidOnline ? totalFCFA : 0,
      soldeDuFCFA: isPaidOnline ? 0 : totalFCFA,
      modePaiement: orderForm.modePaiement,
      referencePaiement: `WEB-PAY-${Date.now().toString().slice(-6)}`,
      statutPaiement: isPaidOnline ? ('Payée' as const) : ('Non Payée / Crédit' as const),
      statutVente: isPaidOnline ? ('Validée' as const) : ('En attente de validation' as const),
      observations: `Achat direct Web via ${orderForm.modePaiement}. Contact: ${orderForm.nomContact} (${orderForm.telephone})`
    };

    await db.invoices.add(newInvoice);
    setInvoiceObj(newInvoice);
    setTicketRef(numero);

    // 3. Initiate Payment API (Wave / OM)
    if (orderForm.modePaiement === 'Wave') {
      const initResult = await initiateWavePayment({
        amountFCFA: totalFCFA,
        orderRef: numero,
        clientPhone: orderForm.telephone,
        clientName: orderForm.nomContact,
      });
      setPaymentResult(initResult);
    } else if (orderForm.modePaiement === 'Orange Money') {
      const initResult = await initiateOrangeMoneyPayment({
        amountFCFA: totalFCFA,
        orderRef: numero,
        clientPhone: orderForm.telephone,
      });
      setPaymentResult(initResult);
    }

    setPaymentDone(isPaidOnline);
    setLoading(false);
    setIsSubmitted(true);
  };

  const handleVerifyLivePayment = async () => {
    if (!paymentResult) return;
    setLoading(true);
    const res = await verifyPaymentStatus(paymentResult.transactionRef);
    if (res.status === 'SUCCESS') {
      setPaymentDone(true);
    }
    setLoading(false);
  };

  const handlePartnerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    await new Promise(r => setTimeout(r, 600));
    setTicketRef(`PART-${Date.now().toString().slice(-5)}`);
    setLoading(false);
    setIsSubmitted(true);
  };

  const copyUssdCode = () => {
    if (paymentResult?.ussdCode) {
      navigator.clipboard.writeText(paymentResult.ussdCode);
      setCopiedUssd(true);
      setTimeout(() => setCopiedUssd(false), 2000);
    }
  };

  const whatsappUrl = `https://wa.me/221766225979?text=${encodeURIComponent(`Bonjour BS Distribution SUARL, j'ai effectué une commande en ligne [Facture: ${ticketRef} - Total: ${totalPrice.toLocaleString()} FCFA].`)}`;

  return (
    <div className="fixed inset-0 z-[700] bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 md:p-4 font-sans">
      <div className="bg-white border border-slate-200 w-full max-w-xl rounded-3xl p-5 md:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-amber-500 text-slate-950 flex items-center justify-center font-extrabold shadow-md font-display text-sm">
              BS
            </div>
            <div>
              <h3 className="font-extrabold text-slate-900 text-base font-display">Achat Direct & API de Paiement</h3>
              <p className="text-[11px] text-slate-500 font-medium">BS Distribution SUARL — Sénégal (14 Régions)</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Submitted Confirmation & Payment Screen */}
        {isSubmitted ? (
          <div className="text-center py-4 space-y-5">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-md">
              <CheckCircle2 className="w-8 h-8" />
            </div>

            <div className="space-y-1">
              <h4 className="text-xl font-black text-slate-900 font-display">
                {paymentDone ? '🎉 Paiement & Commande Confirmés !' : '✅ Commande Enregistrée !'}
              </h4>
              <p className="text-xs text-slate-600 font-semibold">
                Facture Nº : <strong className="text-amber-800 font-mono text-base">{ticketRef}</strong>
              </p>
            </div>

            {/* WAVE LIVE PAYMENT GATEWAY DISPLAY */}
            {orderForm.modePaiement === 'Wave' && paymentResult && (
              <div className="p-5 bg-blue-50/80 rounded-2xl border-2 border-blue-300 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-blue-900 uppercase tracking-wider flex items-center gap-1.5">
                    🌊 GUICHET PAIEMENT WAVE MOBILE MONEY
                  </span>
                  <span className="text-sm font-black text-blue-700 font-display">{totalPrice.toLocaleString()} FCFA</span>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-4 bg-white p-4 rounded-xl border border-blue-200 shadow-xs">
                  <img src={paymentResult.qrCodeUrl} alt="Wave QR Code" className="w-32 h-32 rounded-lg border border-slate-200 shrink-0" />
                  <div className="space-y-2 text-xs text-slate-700">
                    <p className="font-extrabold text-slate-900">Scannez avec l'application Wave ou appuyez ci-dessous :</p>
                    <a
                      href={paymentResult.checkoutUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-extrabold rounded-xl shadow-md transition-all"
                    >
                      <span>Payer avec l'application Wave</span>
                      <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            )}

            {/* ORANGE MONEY LIVE PAYMENT GATEWAY DISPLAY */}
            {orderForm.modePaiement === 'Orange Money' && paymentResult && (
              <div className="p-5 bg-orange-50/80 rounded-2xl border-2 border-orange-300 text-left space-y-4 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-orange-900 uppercase tracking-wider flex items-center gap-1.5">
                    🍊 GUICHET PAIEMENT ORANGE MONEY (#144#)
                  </span>
                  <span className="text-sm font-black text-orange-700 font-display">{totalPrice.toLocaleString()} FCFA</span>
                </div>

                <div className="bg-white p-4 rounded-xl border border-orange-200 space-y-3 text-xs">
                  <p className="font-extrabold text-slate-900">Code Marchand USSD à composer :</p>
                  <div className="flex items-center justify-between bg-slate-900 text-amber-400 font-mono text-sm font-black p-3 rounded-xl">
                    <span>{paymentResult.ussdCode}</span>
                    <button
                      onClick={copyUssdCode}
                      className="px-3 py-1.5 bg-amber-500 text-slate-950 font-extrabold text-xs rounded-lg flex items-center gap-1 hover:bg-amber-400"
                    >
                      {copiedUssd ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedUssd ? 'Copié !' : 'Copier'}</span>
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-2.5">
              {invoiceObj && (
                <button
                  onClick={() => generateInvoicePDF(invoiceObj)}
                  className="w-full sm:w-auto px-5 py-3 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
                >
                  <Download className="w-4 h-4" /> Télécharger Facture PDF
                </button>
              )}

              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full sm:w-auto px-5 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center justify-center gap-2"
              >
                <Phone className="w-4 h-4" /> Reçu sur WhatsApp
              </a>

              <button
                onClick={onClose}
                className="w-full sm:w-auto px-5 py-3 bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs rounded-xl border border-slate-200"
              >
                Fermer
              </button>
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="flex bg-slate-100 p-1 rounded-2xl border border-slate-200 text-xs">
              <button
                onClick={() => setActiveTab('ORDER')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'ORDER' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <ShoppingBag className="w-4 h-4" /> Acheter en Ligne
              </button>
              <button
                onClick={() => setActiveTab('PARTNER')}
                className={`flex-1 py-2.5 rounded-xl font-extrabold flex items-center justify-center gap-2 transition-all ${
                  activeTab === 'PARTNER' ? 'bg-amber-500 text-slate-950 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <Building2 className="w-4 h-4" /> Proposer un Poulailler
              </button>
            </div>

            {/* Form 1: Direct Online Order */}
            {activeTab === 'ORDER' && (
              <form onSubmit={handleOrderSubmit} className="space-y-3.5 text-xs">
                
                <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 text-amber-900 text-xs font-semibold flex items-center justify-between">
                  <span>Achetez vos œufs en direct au tarif de gros avec l'API Wave, Orange Money ou Espèces.</span>
                  <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Raison Sociale / Client *</label>
                    <input type="text" required placeholder="ex: Supérette Teranga..."
                      value={orderForm.raisonSociale}
                      onChange={e => setOrderForm(f => ({ ...f, raisonSociale: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-amber-500" />
                  </div>
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Nom du Responsable *</label>
                    <input type="text" required placeholder="ex: Mamadou Sow"
                      value={orderForm.nomContact}
                      onChange={e => setOrderForm(f => ({ ...f, nomContact: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900 focus:outline-none focus:border-amber-500" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Téléphone Portable (Sénégal) *</label>
                    <input type="tel" required placeholder="ex: 77 123 45 67"
                      value={orderForm.telephone}
                      onChange={e => setOrderForm(f => ({ ...f, telephone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900 focus:outline-none focus:border-amber-500" />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Région de Livraison</label>
                    <select value={orderForm.region}
                      onChange={e => setOrderForm(f => ({ ...f, region: e.target.value as SenegalRegion, commune: SENEGAL_GEOGRAPHY[e.target.value as SenegalRegion]?.communes[0] || 'Keur Massar' }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900">
                      {Object.keys(SENEGAL_GEOGRAPHY).map(reg => (
                        <option key={reg} value={reg}>{reg}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Commune / Ville *</label>
                    <input type="text" required placeholder="ex: Keur Massar, Touba, Thiès..."
                      value={orderForm.commune}
                      onChange={e => setOrderForm(f => ({ ...f, commune: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900" />
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Quantité d'Œufs</label>
                    <input type="number" min="100" max="500000" step="100" required
                      value={orderForm.quantiteOeufs}
                      onChange={e => setOrderForm(f => ({ ...f, quantiteOeufs: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-black text-amber-800" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Catégorie d'Œufs</label>
                    <select value={orderForm.typeOeufs}
                      onChange={e => setOrderForm(f => ({ ...f, typeOeufs: e.target.value as EggCategoryType }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900">
                      <option value="Œufs Gros Calibre">Œufs Gros Calibre (85 F/œuf)</option>
                      <option value="Œufs Poulettes">Œufs Poulettes (75 F/œuf)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block font-extrabold text-slate-700 mb-1">Mode de Paiement Direct</label>
                    <select value={orderForm.modePaiement}
                      onChange={e => setOrderForm(f => ({ ...f, modePaiement: e.target.value as PaymentMethod }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900">
                      <option value="Wave">🌊 Wave Mobile Money (API Directe)</option>
                      <option value="Orange Money">🍊 Orange Money (#144#)</option>
                      <option value="Espèces">💵 Espèces à la Livraison</option>
                    </select>
                  </div>
                </div>

                {/* Real-Time Total Price Calculation Box */}
                <div className="p-4 bg-slate-900 text-white rounded-2xl border border-slate-800 flex items-center justify-between shadow-lg">
                  <div>
                    <span className="text-[10px] text-amber-400 font-extrabold uppercase tracking-wider block">Calcul Total Direct</span>
                    <span className="text-xl font-black font-display text-white">
                      {(Number(orderForm.quantiteOeufs) * getPricePerEgg(orderForm.typeOeufs)).toLocaleString('fr-FR')} FCFA
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 block font-semibold">
                      {orderForm.quantiteOeufs.toLocaleString()} x {getPricePerEgg(orderForm.typeOeufs)} F/œuf
                    </span>
                    <span className="text-[10px] text-emerald-400 font-extrabold">Livraison Régions Incluse</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center gap-2 transition-all active:scale-95 disabled:opacity-60"
                  >
                    <CreditCard className="w-4 h-4" />
                    <span>Initier le Paiement {orderForm.modePaiement}</span>
                  </button>
                </div>
              </form>
            )}

            {/* Form 2: Partner Request */}
            {activeTab === 'PARTNER' && (
              <form onSubmit={handlePartnerSubmit} className="space-y-3 text-xs">
                <div className="p-3 bg-purple-50 rounded-xl border border-purple-200 text-purple-900 text-[11px] font-medium">
                  Vous êtes producteur au Sénégal ? Devenez partenaire fournisseur de BS Distribution avec garantie d'enlèvement régulier.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom du Poulailler / Ferme *</label>
                    <input type="text" required placeholder="ex: Ferme Bio Thiès..."
                      value={partnerForm.nomPoulailler}
                      onChange={e => setPartnerForm(f => ({ ...f, nomPoulailler: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Nom du Propriétaire *</label>
                    <input type="text" required placeholder="ex: Cheikh Sow"
                      value={partnerForm.proprietaire}
                      onChange={e => setPartnerForm(f => ({ ...f, proprietaire: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900" />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Téléphone Contact *</label>
                    <input type="tel" required placeholder="ex: 78 123 45 67"
                      value={partnerForm.telephone}
                      onChange={e => setPartnerForm(f => ({ ...f, telephone: e.target.value }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-medium text-slate-900" />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-700 mb-1">Capacité de Production (pondeuses)</label>
                    <input type="number" step="500" required
                      value={partnerForm.capaciteProduction}
                      onChange={e => setPartnerForm(f => ({ ...f, capaciteProduction: Number(e.target.value) }))}
                      className="w-full bg-slate-50 border border-slate-300 rounded-xl p-2.5 font-bold text-slate-900" />
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-end gap-2">
                  <button type="button" onClick={onClose} className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl">
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-3 bg-purple-700 hover:bg-purple-800 text-white font-extrabold text-xs rounded-xl shadow-md flex items-center gap-2"
                  >
                    <Send className="w-4 h-4" />
                    <span>Soumettre la Candidature</span>
                  </button>
                </div>
              </form>
            )}
          </>
        )}

      </div>
    </div>
  );
};
