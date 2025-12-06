# 🚀 Quick Reference: Payment Integration

## 🎯 One-Liner
**4 pricing tiers → Razorpay checkout → Firestore update → Pro features unlocked**

---

## 💰 Pricing at a Glance

```
₹99     → Weekly Grind    → plan: 'weekly'
₹499    → Monthly Focus   → plan: 'monthly'   [POPULAR]
₹4,999  → Yearly Commit   → plan: 'yearly'
₹9,999  → Founder Mode    → plan: 'lifetime'
```

---

## 🔧 Quick Setup (5 minutes)

### 1. Get Razorpay Keys
```bash
# Login to Razorpay Dashboard → Settings → API Keys
# Copy test keys for development
```

### 2. Set Environment Variables (Vercel)
```bash
RAZORPAY_KEY_ID=rzp_test_RoQMSgjJCLg7XE
RAZORPAY_KEY_SECRET=your_secret_here
```

### 3. Run Dev Server
```bash
npm run dev
```

### 4. Test Payment
```
1. Login → Profile Menu → Upgrade
2. Click any pricing button
3. Card: 4111 1111 1111 1111
4. CVV: 123, Expiry: 12/25
5. Complete payment ✅
```

---

## 📁 Key Files

```
src/App.jsx                # UI + Payment buttons
utils/payment.js           # Payment handler
api/create-order.js        # Backend order creation
PAYMENT_INTEGRATION.md     # Full docs
TESTING_CHECKLIST.md       # QA checklist
```

---

## 🧩 Code Snippets

### Add New Pricing Button
```javascript
<button 
  onClick={() => handlePayment(
    user,              // Firebase user
    299,               // Amount in INR
    "New Plan",        // Plan name
    async (response) => {
      // Update Firestore
      const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
      await setDoc(userRef, { 
        tier: 'pro', 
        plan: 'new-plan',
        paymentId: response.razorpay_payment_id,
        lastPayment: serverTimestamp()
      }, { merge: true });
      setUserTier('pro');
      onClose();
    }
  )}
>
  New Plan - ₹299
</button>
```

### Check User Tier
```javascript
// In any component
if (userTier === 'pro') {
  // Show pro features
} else {
  // Show paywall
}
```

### Access Payment Data
```javascript
// Firestore path
artifacts/solos-web/users/{uid}/settings/profile

// Structure
{
  tier: 'pro',
  plan: 'monthly',
  paymentId: 'pay_xxxxx',
  lastPayment: Timestamp
}
```

---

## 🐛 Debug Checklist

```
❌ Payment not working?
  ✓ Check browser console for errors
  ✓ Verify /api/create-order returns 200
  ✓ Check Razorpay Dashboard for orders
  ✓ Test with different browser/incognito

❌ Firestore not updating?
  ✓ Check Firebase Auth (user logged in?)
  ✓ Verify security rules allow writes
  ✓ Look for Firebase errors in console

❌ Modal won't close?
  ✓ Ensure onClose() is called in callback
  ✓ Check state update: setShowPricing(false)

❌ Test card rejected?
  ✓ Use exact: 4111 1111 1111 1111
  ✓ Any CVV, future expiry
  ✓ Razorpay test mode must be active
```

---

## 🔑 Test Cards

| Card | CVV | Expiry | Result |
|------|-----|--------|--------|
| 4111 1111 1111 1111 | Any | Future | ✅ Success |
| 4000 0000 0000 0002 | Any | Future | ❌ Failure |

---

## 📊 Firestore Query Examples

### Get User Tier
```javascript
const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
const snapshot = await getDoc(userRef);
const tier = snapshot.data()?.tier || 'free';
```

### Check if Pro
```javascript
useEffect(() => {
  if (!user) return;
  const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
  onSnapshot(userRef, (doc) => {
    if (doc.exists() && doc.data().tier) {
      setUserTier(doc.data().tier);
    }
  });
}, [user]);
```

---

## 🚀 Production Checklist

```
✓ Replace test keys with live keys
✓ Update Vercel environment variables
✓ Test with real card (small amount)
✓ Set up Razorpay webhooks
✓ Configure email receipts
✓ Monitor first 24 hours
✓ Set up alerts for failures
```

---

## 🎨 Styling

### Modal Z-Index Hierarchy
```
Pricing Modal:  z-[9999]  (highest)
Side Panel:     z-50
Header:         z-20
Content:        z-0       (lowest)
```

### Color Palette
```css
Emerald-500:  #10b981  (Primary CTA)
Purple-500:   #a855f7  (Lifetime tier)
Zinc-900:     #18181b  (Background)
White:        #ffffff  (Text/buttons)
```

---

## 📞 Quick Links

- [Razorpay Dashboard](https://dashboard.razorpay.com/)
- [Firebase Console](https://console.firebase.google.com/)
- [Vercel Dashboard](https://vercel.com/dashboard)
- [Razorpay Test Cards](https://razorpay.com/docs/payments/payments/test-card-upi-details/)

---

## 💡 Pro Tips

1. **Always test in incognito** to avoid cached states
2. **Check Network tab** for API responses
3. **Monitor Razorpay Dashboard** for test orders
4. **Use console.log** liberally during development
5. **Test ALL pricing tiers** before deploying

---

## 🆘 Emergency Commands

```bash
# Restart dev server
Ctrl+C → npm run dev

# Clear browser cache
Shift+Ctrl+Delete → Clear Everything

# Check Vercel logs
vercel logs

# Deploy to production
vercel --prod
```

---

## 📈 Analytics to Track

```
• Conversion rate per pricing tier
• Payment success/failure ratio
• Time to complete payment
• Most popular plan
• Cart abandonment rate
• Revenue by tier
```

---

## 🔐 Security Reminders

- ✅ API keys in environment variables ONLY
- ✅ Never commit secrets to Git
- ✅ Use HTTPS in production
- ✅ Verify webhook signatures
- ✅ Log all transactions
- ✅ Rate limit API endpoints

---

## 🎉 Success Indicators

```
✅ All 4 buttons trigger payment
✅ Razorpay modal opens smoothly
✅ Test card payments succeed
✅ Firestore updates immediately
✅ User tier changes to 'pro'
✅ Modal closes after success
✅ Success alert shows
✅ Date restrictions removed
```

---

**Questions?** Check `PAYMENT_INTEGRATION.md` for full details.

**Version**: 2.4 | **Last Updated**: Dec 2024
