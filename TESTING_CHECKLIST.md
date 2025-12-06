# Payment Integration Testing Checklist

## Pre-Deployment Verification

### ✅ Environment Setup
- [ ] Razorpay test account created
- [ ] Test API keys obtained (rzp_test_xxx)
- [ ] Environment variables set in Vercel:
  - [ ] `RAZORPAY_KEY_ID`
  - [ ] `RAZORPAY_KEY_SECRET`
- [ ] Firebase project configured
- [ ] Firestore rules allow authenticated writes

### ✅ Code Review
- [ ] All 4 pricing buttons have payment handlers
- [ ] Amounts are in INR (₹99, ₹499, ₹4,999, ₹9,999)
- [ ] Success callbacks update Firestore correctly
- [ ] `serverTimestamp()` is imported from firebase/firestore
- [ ] User tier state updates on payment success
- [ ] Pricing modal closes after success

### ✅ Backend Verification
- [ ] `/api/create-order.js` deployed to Vercel
- [ ] CORS headers configured correctly
- [ ] Error handling implemented
- [ ] Amount conversion (INR → paise) working
- [ ] Logs show order creation

### ✅ Frontend Verification
- [ ] `utils/payment.js` loads Razorpay SDK
- [ ] Correct Razorpay key in options (`rzp_test_xxx`)
- [ ] Plan name passed to backend
- [ ] Success handler receives payment response
- [ ] Error messages display to user

---

## Manual Testing Steps

### Test Case 1: Weekly Plan (₹99)
1. Login to app
2. Open pricing modal (Profile Menu → Upgrade)
3. Click "Weekly Grind" button
4. Razorpay modal should open
5. Enter test card: `4111 1111 1111 1111`
6. CVV: `123`, Expiry: `12/25`
7. Complete payment
8. Verify:
   - [ ] Success alert shows
   - [ ] Modal closes
   - [ ] Firestore updated with `tier: 'pro', plan: 'weekly'`
   - [ ] Payment ID stored
   - [ ] Date restrictions removed

### Test Case 2: Monthly Plan (₹499) - POPULAR
1. Open pricing modal
2. Click "Monthly Focus" button (green highlighted)
3. Complete payment with test card
4. Verify Firestore: `plan: 'monthly'`

### Test Case 3: Yearly Plan (₹4,999)
1. Open pricing modal
2. Click "Yearly Commit" button
3. Complete payment
4. Verify Firestore: `plan: 'yearly'`

### Test Case 4: Lifetime Plan (₹9,999)
1. Open pricing modal
2. Click "Founder Mode" button
3. Complete payment
4. Verify Firestore: `plan: 'lifetime'`

### Test Case 5: Payment Failure
1. Open pricing modal
2. Click any pricing button
3. Use failure test card: `4000 0000 0000 0002`
4. Verify:
   - [ ] Error message shown
   - [ ] Modal remains open
   - [ ] User stays on free tier
   - [ ] No Firestore changes

### Test Case 6: User Cancels Payment
1. Open pricing modal
2. Click any pricing button
3. Close Razorpay modal (X button or ESC)
4. Verify:
   - [ ] Gracefully handled
   - [ ] Console logs "Payment cancelled"
   - [ ] User stays on free tier

---

## Firestore Data Verification

After successful payment, check Firebase Console:

```
Path: artifacts/solos-web/users/{uid}/settings/profile

Expected Structure:
{
  tier: "pro",
  plan: "weekly" | "monthly" | "yearly" | "lifetime",
  paymentId: "pay_xxxxxxxxx",
  lastPayment: Timestamp
}
```

### Verification Commands (Firebase Console)
1. Open Firestore in Firebase Console
2. Navigate to: `artifacts → solos-web → users → {your-uid} → settings → profile`
3. Check fields match expected structure
4. Verify `lastPayment` timestamp is recent

---

## Browser Console Checks

### Expected Console Logs (Success)
```
Creating order for ₹499 (49900 paise)
Order created successfully: order_xxxxxxxxx
Payment successful!
Payment ID: pay_xxxxxxxxx
Order ID: order_xxxxxxxxx
Signature: xxxxxxxxx
```

### Expected Console Logs (Failure)
```
Razorpay Order Creation Error: {...}
Payment Error: ...
```

---

## Network Tab Verification

### Expected Requests
1. **POST** `/api/create-order`
   - Status: `200 OK`
   - Request Body: `{ amount: 499 }`
   - Response: `{ id: "order_xxx", currency: "INR", amount: 49900 }`

2. **Razorpay SDK requests** (multiple)
   - To `checkout.razorpay.com`
   - Status: `200 OK`

---

## Razorpay Dashboard Checks

### After Test Payments
1. Login to [Razorpay Dashboard](https://dashboard.razorpay.com/)
2. Navigate to Transactions → Payments
3. Verify test payments appear
4. Check:
   - [ ] Correct amounts (₹99, ₹499, etc.)
   - [ ] Status: "Captured"
   - [ ] Payment method: Test Card
   - [ ] Order ID matches console logs

---

## Production Readiness

### Before Going Live
- [ ] Replace `rzp_test_xxx` with `rzp_live_xxx` in `utils/payment.js`
- [ ] Update Vercel environment variables with live keys
- [ ] Set up Razorpay webhooks for `payment.captured`
- [ ] Implement signature verification in webhook handler
- [ ] Test with real card in production
- [ ] Set up email notifications for payments
- [ ] Configure payment failure retries
- [ ] Add subscription management for recurring plans
- [ ] Implement refund logic if needed
- [ ] Set up analytics tracking (conversion, churn)

### Security Checklist
- [ ] API keys never committed to Git
- [ ] HTTPS enforced on all endpoints
- [ ] CORS configured for production domain only
- [ ] Rate limiting on `/api/create-order`
- [ ] Payment logs stored securely
- [ ] User payment data encrypted

---

## Common Issues & Solutions

### Issue: "Could not load Razorpay SDK"
**Solution**: Check internet connection, verify CDN is accessible

### Issue: "Payment initiation failed"
**Solution**: 
1. Check Vercel logs for backend errors
2. Verify environment variables are set
3. Test `/api/create-order` endpoint directly

### Issue: Firestore not updating
**Solution**:
1. Check Firebase Auth - user must be logged in
2. Verify Firestore security rules
3. Check browser console for Firebase errors

### Issue: Modal stays open after payment
**Solution**: Ensure `onClose()` is called in success callback

### Issue: Wrong tier after payment
**Solution**: Verify `setUserTier('pro')` is called in success handler

---

## Test Results Log

| Date | Test Case | Result | Notes |
|------|-----------|--------|-------|
| YYYY-MM-DD | Weekly Plan | ✅ / ❌ | |
| YYYY-MM-DD | Monthly Plan | ✅ / ❌ | |
| YYYY-MM-DD | Yearly Plan | ✅ / ❌ | |
| YYYY-MM-DD | Lifetime Plan | ✅ / ❌ | |
| YYYY-MM-DD | Payment Failure | ✅ / ❌ | |
| YYYY-MM-DD | User Cancellation | ✅ / ❌ | |

---

**Tester Name**: ________________  
**Date**: ________________  
**Environment**: Development / Staging / Production  
**Overall Status**: ✅ Pass / ❌ Fail

---

## Next Steps After Testing

1. Document any bugs found
2. Fix critical issues before production
3. Run full regression test
4. Get stakeholder approval
5. Deploy to production
6. Monitor first 24 hours closely
7. Set up alerting for payment failures

---

**Version**: 2.4  
**Last Updated**: December 2024
