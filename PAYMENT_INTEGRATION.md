# Payment Integration Guide

## Overview
SolOS uses **Razorpay** for payment processing with a freemium pricing model. This document explains the complete payment flow and configuration.

---

## Pricing Structure (All in INR)

| Plan | Price | Duration | Firestore `plan` Value |
|------|-------|----------|------------------------|
| **Weekly Grind** | ₹99 | 7 days | `weekly` |
| **Monthly Focus** (Popular) | ₹499 | 30 days | `monthly` |
| **Yearly Commit** | ₹4,999 | 365 days (saves 17%) | `yearly` |
| **Founder Mode** | ₹9,999 | Lifetime | `lifetime` |

---

## Architecture

```
┌─────────────┐       ┌──────────────┐       ┌─────────────┐
│   UI Layer  │──────▶│ payment.js   │──────▶│   Backend   │
│  (App.jsx)  │       │  (Frontend)  │       │ create-order│
└─────────────┘       └──────────────┘       └─────────────┘
       │                      │                      │
       │                      ▼                      ▼
       │              ┌──────────────┐       ┌──────────────┐
       │              │   Razorpay   │       │  Razorpay    │
       │              │   Checkout   │◀──────│   Orders     │
       │              └──────────────┘       │     API      │
       │                      │              └──────────────┘
       │                      ▼
       │              ┌──────────────┐
       └─────────────▶│  Firestore   │
                      │   (Profile)  │
                      └──────────────┘
```

---

## File Structure

```
solos/
├── src/
│   └── App.jsx              # UI + Payment buttons
├── utils/
│   └── payment.js           # Frontend payment handler
├── api/
│   └── create-order.js      # Vercel serverless function
└── PAYMENT_INTEGRATION.md   # This file
```

---

## Environment Variables

### Required for Backend (`/api/create-order.js`)
Set these in **Vercel Dashboard → Settings → Environment Variables**:

```bash
RAZORPAY_KEY_ID=rzp_test_RoQMSgjJCLg7XE        # Test Key ID
RAZORPAY_KEY_SECRET=your_secret_key_here       # Keep this PRIVATE
```

⚠️ **IMPORTANT**: Never commit secrets to Git. Use environment variables only.

---

## Payment Flow

### 1. User Clicks Pricing Button
Located in `PricingModal` component in `App.jsx`:

```javascript
<button onClick={() => handlePayment(
  user,           // Firebase user object
  499,            // Amount in INR
  "Monthly Focus", // Plan name
  async (response) => {
    // Success callback
    const userRef = doc(db, 'artifacts', appId, 'users', user.uid, 'settings', 'profile');
    await setDoc(userRef, { 
      tier: 'pro', 
      plan: 'monthly',
      paymentId: response.razorpay_payment_id,
      lastPayment: serverTimestamp()
    }, { merge: true });
    setUserTier('pro');
    onClose();
    alert("Welcome to SolOS Pro! 🚀");
  }
)}>
```

### 2. Frontend Creates Order
`utils/payment.js`:
- Loads Razorpay SDK script
- Calls `/api/create-order` endpoint
- Receives `order_id` from backend

```javascript
const response = await fetch("/api/create-order", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ amount: 499 }), // INR amount
});
const order = await response.json(); // { id, currency, amount }
```

### 3. Backend Creates Razorpay Order
`api/create-order.js`:
- Verifies it's a POST request
- Multiplies amount by 100 (converts ₹499 → 49900 paise)
- Creates order via Razorpay API
- Returns `order_id` to frontend

```javascript
const order = await razorpay.orders.create({
  amount: req.body.amount * 100, // Paise
  currency: "INR",
  receipt: `receipt_${Date.now()}`
});
```

### 4. Razorpay Checkout Opens
`utils/payment.js` initializes Razorpay modal:

```javascript
const paymentObject = new window.Razorpay({
  key: "rzp_test_RoQMSgjJCLg7XE",
  amount: order.amount,
  currency: order.currency,
  name: "SolOS Pro",
  description: `Upgrade to ${planName}`,
  order_id: order.id,
  handler: async function (response) {
    // Success callback from App.jsx
    await onSuccess(response);
  }
});
paymentObject.open();
```

### 5. Payment Success
After successful payment, Razorpay calls the `handler` function with:
```javascript
{
  razorpay_payment_id: "pay_xxxxx",
  razorpay_order_id: "order_xxxxx",
  razorpay_signature: "signature_xxxxx"
}
```

### 6. Firestore Update
The success callback updates user profile:

```javascript
// Firestore path: artifacts/solos-web/users/{uid}/settings/profile
{
  tier: 'pro',
  plan: 'monthly',              // weekly | monthly | yearly | lifetime
  paymentId: 'pay_xxxxx',       // Razorpay payment ID
  lastPayment: serverTimestamp() // Firebase timestamp
}
```

---

## Testing

### Test Cards (Razorpay Test Mode)

| Card Number | CVV | Expiry | Result |
|-------------|-----|--------|--------|
| 4111 1111 1111 1111 | Any | Future date | ✅ Success |
| 4000 0000 0000 0002 | Any | Future date | ❌ Failure |

### Test Flow
1. Start dev server: `npm run dev`
2. Login with Google
3. Click hamburger menu → Profile → "Upgrade Plan"
4. Select any pricing tier
5. Use test card: `4111 1111 1111 1111`
6. Complete payment
7. Verify Firestore update in Firebase Console

---

## Production Deployment

### 1. Switch to Live Keys
Replace test keys in:
- **Frontend**: `utils/payment.js` → `key: "rzp_live_xxxxx"`
- **Backend**: Vercel env vars → `RAZORPAY_KEY_ID=rzp_live_xxxxx`

### 2. Enable Webhooks (Recommended)
Set up Razorpay webhooks for:
- `payment.captured` - Confirm payment
- `payment.failed` - Handle failures
- `subscription.cancelled` - Recurring plans

Webhook URL: `https://your-domain.vercel.app/api/webhook`

### 3. Security Checklist
- ✅ Verify payment signatures in webhook
- ✅ Use HTTPS only
- ✅ Store keys in environment variables
- ✅ Add rate limiting to `/api/create-order`
- ✅ Log all transactions for audit

---

## Firewall Logic (Free vs Pro)

### Free Tier Restrictions
```javascript
// src/App.jsx
const isDateLocked = () => {
  if (userTier === 'pro') return false;
  const startOfWeek = getStartOfCurrentWeek();
  const checkDate = new Date(currentDate);
  checkDate.setHours(0,0,0,0);
  return checkDate < startOfWeek; // Locks past weeks
};
```

### Document Creation Limits
```javascript
// SecondBrainPanel component
if (userTier === 'free') {
  const count = docs.filter(d => d.category === category).length;
  const limits = { 
    projects: 5, 
    areas: 5, 
    resources: 20 
  };
  if (limits[category] && count >= limits[category]) {
    setShowPricing(true); // Show paywall
    return;
  }
}
```

---

## Troubleshooting

### Payment Not Working
1. **Check browser console** for errors
2. **Verify backend is deployed** - Visit `/api/create-order` (should return 405)
3. **Check Razorpay Dashboard** - Look for failed orders
4. **Verify CORS headers** - Check Network tab in DevTools

### Firestore Not Updating
1. **Check Firebase Rules** - Ensure write access for authenticated users
2. **Verify user object** - `console.log(user)` before payment
3. **Check serverTimestamp** - Must import from `firebase/firestore`

### Test Payment Failing
1. Use exact test card: `4111 1111 1111 1111`
2. Any 3-digit CVV works
3. Use future expiry date (e.g., 12/25)
4. Ensure test mode is active in Razorpay

---

## Future Enhancements

### Recommended Additions
1. **Subscription Management**
   - Add Razorpay subscription plans
   - Auto-renew logic
   - Grace period for expired plans

2. **Payment Verification**
   - Verify signature in webhook
   - Store transaction history
   - Send email receipts

3. **Analytics**
   - Track conversion rates
   - A/B test pricing
   - Monitor churn

4. **User Dashboard**
   - Show active plan
   - Payment history
   - Cancel subscription

---

## Support

### Resources
- [Razorpay Docs](https://razorpay.com/docs/)
- [Firebase Firestore](https://firebase.google.com/docs/firestore)
- [Vercel Serverless Functions](https://vercel.com/docs/functions)

### Contact
For issues with this integration, check:
1. GitHub Issues
2. Razorpay Support (support@razorpay.com)
3. Project maintainer

---

**Last Updated**: December 2024  
**Version**: 2.4
