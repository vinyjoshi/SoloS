# Payment Integration Setup & Testing Guide

## 🔧 Environment Setup

### 1. Required Environment Variables

Create a `.env.local` file in your project root:

```env
# Razorpay Credentials
RAZORPAY_KEY_ID=your_razorpay_key_id
RAZORPAY_KEY_SECRET=your_razorpay_key_secret
```

**For Vercel Deployment:**
1. Go to your Vercel project dashboard
2. Navigate to Settings → Environment Variables
3. Add both variables:
   - `RAZORPAY_KEY_ID` = `your_razorpay_key_id`
   - `RAZORPAY_KEY_SECRET` = `your_razorpay_key_secret`
4. Ensure they're enabled for Production, Preview, and Development

### 2. Get Razorpay Credentials

**Test Mode (for development):**
1. Login to Razorpay Dashboard: https://dashboard.razorpay.com/
2. Switch to **Test Mode** (top left toggle)
3. Go to Settings → API Keys
4. Generate Test Keys if not already created
5. Copy both Key ID and Key Secret

**Live Mode (for production):**
1. Complete KYC verification on Razorpay
2. Switch to **Live Mode**
3. Generate Live API Keys
4. Update the `key` in `utils/payment.js` from test to live key

---

## 🧪 Local Testing

### Step 1: Install Dependencies
```bash
npm install
npm install -g vercel  # If not already installed
```

### Step 2: Link to Vercel (Optional but Recommended)
```bash
vercel link
```

### Step 3: Pull Environment Variables
```bash
vercel env pull .env.local
```

Or manually create `.env.local` with your Razorpay keys.

### Step 4: Run Development Servers

**Terminal 1 - Vite Dev Server:**
```bash
npm run dev
```

**Terminal 2 - Vercel Serverless Functions:**
```bash
vercel dev
```

This runs:
- Frontend at `http://localhost:5173`
- Backend API at `http://localhost:3000/api/*`
- Vite proxy forwards `/api/*` to Vercel dev server

### Step 5: Test Payment Flow

1. Open `http://localhost:5173`
2. Login with Google
3. Try to access a locked date (dates before current week)
4. Click on any pricing plan
5. Test with Razorpay test cards:

**Test Card Numbers:**
- Success: `4111 1111 1111 1111`
- Failure: `4000 0000 0000 0002`
- CVV: Any 3 digits
- Expiry: Any future date
- OTP: `000000` (for 3D Secure)

---

## 🚀 Deployment to Vercel

### Step 1: Push to GitHub
```bash
git add .
git commit -m "Payment integration complete"
git push
```

### Step 2: Deploy via Vercel

**Option A: Auto-Deploy (Recommended)**
1. Connect your GitHub repo to Vercel
2. Every push to `main` triggers auto-deployment
3. Environment variables are automatically used

**Option B: Manual Deploy**
```bash
vercel --prod
```

### Step 3: Verify Environment Variables
1. Go to Vercel Dashboard → Your Project
2. Settings → Environment Variables
3. Ensure both `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` exist
4. They should be enabled for **Production**

### Step 4: Test Production
1. Visit your deployed URL (e.g., `your-app.vercel.app`)
2. Complete a test payment
3. Check Vercel logs: `vercel logs --follow`
4. Check Razorpay dashboard for order

---

## 📊 Monitoring & Debugging

### Check Logs

**Local Development:**
```bash
# Backend logs (Vercel Dev)
# Check Terminal 2 where you ran `vercel dev`

# Frontend logs
# Check browser console (F12)
```

**Production:**
```bash
# Real-time logs
vercel logs --follow

# Recent logs
vercel logs
```

### Common Issues & Fixes

#### 1. "Server error. Could not initiate payment"

**Check:**
- ✅ Environment variables are set in Vercel
- ✅ Variables are enabled for the correct environment
- ✅ Razorpay credentials are valid (test vs live mode)

**Fix:**
```bash
# Verify env vars locally
cat .env.local

# Verify on Vercel
vercel env ls

# Re-add if missing
vercel env add RAZORPAY_KEY_ID
vercel env add RAZORPAY_KEY_SECRET
```

#### 2. CORS Errors

**Check:**
- Backend should have CORS headers (already added)
- Using correct backend URL in payment.js

**Fix:**
- Ensure `Access-Control-Allow-Origin: *` in `api/create-order.js`
- Restart Vercel dev server

#### 3. "Invalid amount" Error

**Check:**
- Amount is being passed as number, not string
- Amount is positive

**Fix in App.jsx:**
```javascript
// Ensure number type
onClick={() => handlePayment(user, 499, "Monthly Focus", ...)}
                              // ^^^ number, not "499"
```

#### 4. Payment Modal Not Opening

**Check:**
- Razorpay script loaded successfully
- Check browser console for errors
- Internet connection stable

**Fix:**
- Clear browser cache
- Check network tab in DevTools
- Verify Razorpay key in `payment.js` matches dashboard

---

## 🎯 Plan Configuration

Current pricing (defined in `utils/payment.js`):

```javascript
WEEKLY: ₹99/week
MONTHLY: ₹499/month (Popular)
YEARLY: ₹4,999/year (17% savings)
LIFETIME: ₹9,999 one-time
```

To modify plans, update:
1. `utils/payment.js` - PLANS object
2. `src/App.jsx` - PricingModal button amounts

---

## 🔐 Security Best Practices

### Never Commit These:
- ❌ `.env.local`
- ❌ Razorpay API keys
- ❌ Firebase private keys

### Always:
- ✅ Use environment variables
- ✅ Keep test/live keys separate
- ✅ Enable webhook signatures for payment verification (future enhancement)
- ✅ Implement server-side payment verification (future enhancement)

---

## 📝 Testing Checklist

- [ ] Environment variables configured (local + Vercel)
- [ ] Local dev servers running (Vite + Vercel)
- [ ] Login flow works
- [ ] Locked dates show paywall
- [ ] All 4 pricing plans visible
- [ ] Payment modal opens
- [ ] Test payment succeeds with test card
- [ ] User tier upgrades to 'pro' after payment
- [ ] Locked dates unlock after upgrade
- [ ] Production deployment successful
- [ ] Production payment test completed
- [ ] Razorpay dashboard shows test order

---

## 🆘 Support & Resources

- **Razorpay Docs:** https://razorpay.com/docs/
- **Razorpay Test Cards:** https://razorpay.com/docs/payments/payments/test-card-details/
- **Vercel Docs:** https://vercel.com/docs
- **Project Issues:** Create an issue in your GitHub repo

---

## 🎉 Next Steps (Future Enhancements)

1. **Payment Verification**
   - Implement webhook endpoint
   - Verify payment signatures server-side
   - Auto-activate subscriptions

2. **Subscription Management**
   - Razorpay Subscriptions API
   - Auto-renewal reminders
   - Grace period handling

3. **Invoice Generation**
   - Email receipts via SendGrid/Resend
   - Downloadable PDF invoices

4. **Analytics**
   - Track conversion rates
   - Monitor payment failures
   - Revenue dashboard

5. **User Portal**
   - View payment history
   - Manage subscription
   - Download invoices
