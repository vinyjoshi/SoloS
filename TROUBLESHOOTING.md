# Quick Troubleshooting Guide

## Error: "Server error. Could not initiate payment. Please try again."

This error means the backend API cannot create a Razorpay order. Here's how to fix it:

### ✅ Solution Checklist

#### 1. **Check Environment Variables** (Most Common Issue)

**Local Development:**
```bash
# Create .env.local from template
cp .env.example .env.local

# Edit .env.local and add your actual Razorpay keys
# Get them from: https://dashboard.razorpay.com/app/keys
```

Your `.env.local` should look like:
```env
RAZORPAY_KEY_ID=rzp_test_ABC123XYZ
RAZORPAY_KEY_SECRET=a1b2c3d4e5f6g7h8i9j0
```

**Vercel Production:**
1. Go to: https://vercel.com/your-project/settings/environment-variables
2. Add both variables:
   - Name: `RAZORPAY_KEY_ID` → Value: `rzp_test_...`
   - Name: `RAZORPAY_KEY_SECRET` → Value: `your_secret`
3. ✅ Check "Production", "Preview", "Development"
4. Click "Save"
5. **Redeploy** your project

#### 2. **Verify Razorpay Keys Are Valid**

```bash
# Login to Razorpay Dashboard
# https://dashboard.razorpay.com/

# Switch to TEST MODE (top-left toggle)
# Go to: Settings → API Keys
# Copy Key ID and Key Secret
```

**Common mistakes:**
- ❌ Using Live keys without KYC completion
- ❌ Copying keys with extra spaces
- ❌ Mixing Test and Live keys

#### 3. **Restart Development Servers**

After adding environment variables:

```bash
# Stop both servers (Ctrl+C)

# Terminal 1 - Frontend
npm run dev

# Terminal 2 - Backend (new terminal)
vercel dev
```

#### 4. **Check Backend Logs**

**Local:**
- Look at the terminal running `vercel dev`
- You should see: `✅ Order created: order_...`
- If you see: `❌ Missing Razorpay credentials` → Go back to Step 1

**Production:**
```bash
vercel logs --follow
```

Look for:
- `Creating order for ₹99` ← Good
- `Missing Razorpay credentials` ← Fix Step 1
- `HTTP error 401` ← Invalid keys

#### 5. **Verify Package Installation**

```bash
# Ensure razorpay is installed
npm install razorpay

# Check it's in package.json
cat package.json | grep razorpay
```

#### 6. **Test Backend Directly**

```bash
# Test the API endpoint
curl -X POST http://localhost:3000/api/create-order \
  -H "Content-Type: application/json" \
  -d '{"amount":99,"planName":"Test"}'
```

**Expected Response:**
```json
{
  "success": true,
  "order": {
    "id": "order_abc123",
    "amount": 9900,
    "currency": "INR"
  }
}
```

**If you see error:**
- Check Step 1 again (env variables)
- Ensure `vercel dev` is running

---

## Other Common Errors

### "Failed to load Razorpay SDK"
**Fix:** Check internet connection. Script loads from: `https://checkout.razorpay.com/v1/checkout.js`

### Payment modal doesn't open
**Fix:** 
1. Check browser console (F12) for errors
2. Ensure Razorpay key in `utils/payment.js` matches your dashboard

### Payment succeeds but tier doesn't upgrade
**Fix:**
1. Check Firestore rules allow writes to user profile
2. Verify `onSuccess` callback runs (check console logs)

---

## 🧪 Quick Verification

Run this command to verify your setup:

```bash
npm run verify:payment
```

This checks:
- ✅ Environment variables exist
- ✅ All required files present
- ✅ Payment functions properly imported
- ✅ Dependencies installed

---

## 🆘 Still Stuck?

1. **Check the logs:**
   ```bash
   # Local
   # Look at terminal running `vercel dev`
   
   # Production
   vercel logs --follow
   ```

2. **Test with diagnostic tool:**
   - Open browser console (F12)
   - Run: `runPaymentDiagnostics()`
   - Follow the report

3. **Common fix that works 90% of the time:**
   ```bash
   # Stop all servers
   # Delete .vercel folder
   rm -rf .vercel
   
   # Recreate .env.local with correct keys
   nano .env.local
   
   # Reinstall dependencies
   npm install
   
   # Restart both servers
   npm run dev        # Terminal 1
   vercel dev         # Terminal 2
   ```

---

## 📞 Support Resources

- **Razorpay Docs:** https://razorpay.com/docs/
- **Vercel Logs:** https://vercel.com/docs/observability/logs
- **Project Guide:** See `PAYMENT_SETUP_GUIDE.md`
