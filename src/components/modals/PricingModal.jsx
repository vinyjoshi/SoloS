import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X, Shield, CheckCircle } from 'lucide-react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { db, APP_ID, ensureHeaderToastStyles } from '../../constants';
import { handleRazorpayPayment } from '../../../utils/payment';

const PricingModal = ({ onClose, headerOffset = 0, user, setUserTier }) => {
  const [isIndia, setIsIndia] = useState(true);
  const [isLoadingGeo, setIsLoadingGeo] = useState(true);
  const [paymentProcessing, setPaymentProcessing] = useState(false);

  // Geo detection
  useEffect(() => {
    const detectLocation = async () => {
      try {
        const response = await fetch('https://ipapi.co/json/', {
          method: 'GET',
          headers: { Accept: 'application/json' },
        });
        const data = await response.json();
        if (data.country_code && data.country_code !== 'IN') setIsIndia(false);
      } catch (error) {
        console.error('GeoIP Detection failed:', error);
        setIsIndia(true);
      } finally {
        setIsLoadingGeo(false);
      }
    };
    detectLocation();
  }, []);

  const handleSuccessfulPayment = async (plan, response) => {
    setPaymentProcessing(true);
    try {
      const now = new Date();
      let expiresAt = new Date(now);
      switch (plan) {
        case 'weekly':   expiresAt.setDate(now.getDate() + 7); break;
        case 'monthly':  expiresAt.setMonth(now.getMonth() + 1); break;
        case 'yearly':   expiresAt.setFullYear(now.getFullYear() + 1); break;
        case 'international': expiresAt.setFullYear(now.getFullYear() + 2); break;
        case 'lifetime': expiresAt.setFullYear(now.getFullYear() + 100); break;
        default:         expiresAt.setMonth(now.getMonth() + 1);
      }

      const userRef = doc(db, 'artifacts', APP_ID, 'users', user.uid, 'settings', 'profile');
      await setDoc(userRef, {
        tier: 'pro',
        plan,
        paymentId: response.razorpay_payment_id || response.id,
        source: isIndia ? 'razorpay' : 'paypal',
        lastPayment: serverTimestamp(),
        expiresAt,
        purchasedAt: serverTimestamp(),
      }, { merge: true });

      setUserTier('pro');

      // Success toast
      const headerEl = document.querySelector('[data-header="main"]') || document.body;
      ensureHeaderToastStyles();
      const toast = document.createElement('div');
      toast.className =
        'absolute left-1/2 -translate-x-1/2 top-full mt-2 z-[10000] ' +
        'max-w-[92vw] w-[360px] bg-emerald-500 text-black px-4 py-3 rounded-2xl ' +
        'shadow-[0_18px_40px_-18px_rgba(16,185,129,0.7)] border border-emerald-300/50 backdrop-blur';
      toast.innerHTML = `
        <div class="flex items-center gap-3">
          <div class="h-8 w-8 rounded-full bg-black/10 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 20 20" fill="currentColor">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
            </svg>
          </div>
          <div class="text-sm font-extrabold tracking-tight">Welcome to SolOS Pro!</div>
        </div>
      `;
      toast.style.animation = 'headerToast 3.6s ease forwards';
      headerEl.appendChild(toast);
      setTimeout(() => toast.remove(), 3800);

      setPaymentProcessing(false);
      onClose();
    } catch (error) {
      console.error('Error updating tier:', error);
      setPaymentProcessing(false);
      alert('Payment successful but failed to update account. Please contact support.');
    }
  };

  const handleRazorpayClick = (planType, inrAmount, description) => {
    setPaymentProcessing(true);
    handleRazorpayPayment(user, inrAmount, description, (response) => {
      setPaymentProcessing(false);
      handleSuccessfulPayment(planType, response);
    }).catch(() => setPaymentProcessing(false));
  };

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] flex items-start md:items-center justify-center px-4 md:px-6 pb-10 bg-black/90 backdrop-blur-md animate-in fade-in duration-200 overflow-y-auto"
      style={{ paddingTop: `calc(${headerOffset + 16}px + env(safe-area-inset-top))` }}
      onClick={onClose}
    >
      <div
        className="bg-[#09090b] border border-white/10 rounded-2xl w-full max-w-3xl shadow-2xl relative overflow-hidden"
        style={{ maxHeight: `calc(100vh - ${headerOffset + 32}px)` }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <div className="sticky top-0 left-0 right-0 bg-[#09090b]/95 backdrop-blur z-20 flex justify-end px-3 py-3 md:px-4 md:py-4">
          <button onClick={onClose} className="p-2 text-zinc-500 hover:text-white hover:bg-white/10 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div
          className="grid md:grid-cols-2 overflow-y-auto"
          style={{ maxHeight: `calc(100vh - ${headerOffset + 96}px)` }}
        >
          {/* Left: Value prop */}
          <div className="p-8 md:p-12 bg-zinc-900 flex flex-col justify-center">
            <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mb-6 shadow-lg shadow-emerald-900/20">
              <Shield className="text-black" size={24} />
            </div>
            <h2 className="text-3xl font-bold text-white mb-4">Unlock Your Potential.</h2>
            <p className="text-zinc-400 mb-8 leading-relaxed">
              SolOS Free is designed for starters. SolOS Pro is designed for finishers.
            </p>
            <ul className="space-y-3 text-sm text-zinc-300">
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Unlimited History</li>
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Unlimited Projects & Areas</li>
              <li className="flex items-center gap-3"><CheckCircle size={16} className="text-emerald-500" /> Priority Support</li>
            </ul>
          </div>

          {/* Right: Pricing */}
          <div className="p-8 md:p-12 flex flex-col gap-4">
            <h3 className="text-lg font-medium text-white mb-2">Choose your commitment</h3>

            {isLoadingGeo ? (
              <div className="text-center py-12">
                <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-zinc-600 border-t-emerald-500" />
                <div className="text-zinc-400 text-sm mt-3">Detecting your region...</div>
              </div>
            ) : isIndia ? (
              <>
                {[
                  { plan: 'weekly', amount: 99, label: 'Weekly Grind', sub: 'Perfect for sprints', price: '₹99', per: '/ week' },
                  { plan: 'monthly', amount: 499, label: 'Monthly Focus', sub: 'Standard plan', price: '₹499', per: '/ month', popular: true },
                  { plan: 'yearly', amount: 4999, label: 'Yearly Commit', price: '₹4,999', per: '/ year' },
                ].map(({ plan, amount, label, sub, price, per, popular }) => (
                  <button
                    key={plan}
                    onClick={() => handleRazorpayClick(plan, amount, label)}
                    disabled={paymentProcessing}
                    className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-emerald-500/50 transition-all text-left flex justify-between items-center group cursor-pointer relative disabled:opacity-50"
                  >
                    {popular && (
                      <div className="absolute -top-3 left-4 px-2 bg-emerald-500 text-black text-[10px] font-bold rounded-full">POPULAR</div>
                    )}
                    <div>
                      <div className="font-bold text-white group-hover:text-emerald-400">{label}</div>
                      {sub && <div className="text-xs text-zinc-500">{sub}</div>}
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-lg font-bold text-white">{price}</div>
                      <div className="text-[10px] text-zinc-500">{per}</div>
                    </div>
                  </button>
                ))}

                <button
                  onClick={() => handleRazorpayClick('lifetime', 9999, 'Founder Mode')}
                  disabled={paymentProcessing}
                  className="w-full p-4 rounded-xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-purple-500/50 transition-all text-left flex justify-between items-center group mt-4 cursor-pointer disabled:opacity-50"
                >
                  <div className="font-bold text-white group-hover:text-purple-400">Founder Mode</div>
                  <div className="text-right">
                    <div className="font-mono text-lg font-bold text-white">₹9,999</div>
                    <div className="text-[10px] text-zinc-500">lifetime</div>
                  </div>
                </button>
              </>
            ) : (
              <PayPalScriptProvider options={{
                'client-id': import.meta.env.VITE_PAYPAL_CLIENT_ID,
                currency: 'USD',
                intent: 'capture',
              }}>
                <div className="w-full">
                  <div className="mb-4 p-4 rounded-xl border border-white/10 bg-zinc-900">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold text-white">Global Access</div>
                      <div className="font-mono text-xl text-white">$49</div>
                    </div>
                    <div className="text-xs text-zinc-400">1 Year Access + 1 Year Free</div>
                  </div>

                  {paymentProcessing && (
                    <div className="text-center py-4 text-zinc-400 text-sm">Processing payment...</div>
                  )}

                  {!paymentProcessing && (
                    <PayPalButtons
                      style={{ layout: 'vertical', color: 'gold', shape: 'rect', label: 'pay' }}
                      createOrder={(data, actions) =>
                        actions.order.create({
                          purchase_units: [{
                            amount: { currency_code: 'USD', value: '49.00' },
                            description: 'SolOS Pro International',
                          }],
                        })
                      }
                      onApprove={(data, actions) =>
                        actions.order.capture().then((details) => {
                          handleSuccessfulPayment('international', details);
                        })
                      }
                      onError={(err) => {
                        console.error('PayPal Error:', err);
                        alert('PayPal could not process the payment. Please try again.');
                      }}
                    />
                  )}
                  <div className="text-[10px] text-center text-zinc-600 mt-2">Secured by PayPal</div>
                </div>
              </PayPalScriptProvider>
            )}
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default PricingModal;
