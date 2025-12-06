# SolOS - The Minimalist Founder OS

SolOS is a ruthless, distraction-free operating system designed for founders and solo entrepreneurs. It strips away the complexity of traditional project management tools to focus purely on **Execution** and **Strategy**.

---

## 🚀 Philosophy

Most productivity tools are procrastination traps. You spend more time configuring databases and colors than actually working.

**SolOS is different.**

- **Zero Config**: Open it and start working.
- **Daily Stack**: A linear flow for execution (Priorities → Routine → Burn Rate → Reflection).
- **Second Brain**: A hidden drawer for strategy (Projects, Areas, Resources, Archives).
- **Ephemeral Focus**: The dashboard resets daily (mostly), forcing you to focus on today.

---

## ✨ Features

### 1. The Daily Stack (Execution)
- **Timeline**: Visual week view to keep you grounded in time.
- **Brain Dump**: A scratchpad to clear mental RAM instantly.
- **Top 5 Priorities**: Enforced constraint. You get 5 critical tasks per day.
- **Routine Engine**: Dynamic hourly schedule blocks to manage energy, not just time.
- **Monthly Burn**: Track your fixed burn rate to keep financial anxiety at bay.
- **Daily Reflection**: A simple journal to close the loop on your day.

### 2. The Second Brain (Strategy)
- **PARA Method**: Built-in organization using Tiago Forte's P.A.R.A (Projects, Areas, Resources, Archives).
- **Quick Capture**: Slide-over panel to access your knowledge base without leaving your daily view.
- **Distraction-Free Editor**: Minimalist text editor for drafting plans, SOPs, and ideas.
- **Move & Archive**: Seamlessly move documents between lifecycle stages.

### 3. Freemium Model
- **Free Tier**: Current week access + limited docs (5 projects, 5 areas, 20 resources)
- **Pro Tier**: Unlimited history + unlimited docs + priority support
  - Weekly: ₹99/week
  - Monthly: ₹499/month
  - Yearly: ₹4,999/year (save 17%)
  - Lifetime: ₹9,999 (one-time)

---

## 🛠️ Tech Stack

Built with a focus on **speed, simplicity, and maintainability**.

- **Frontend**: React 18 + Vite
- **Styling**: Tailwind CSS (v3.4) + Lucide Icons
- **Backend**: Firebase (Auth + Firestore)
- **Payments**: Razorpay (INR)
- **Hosting**: Vercel (Frontend + Serverless Functions)
- **Font**: Inter (Google Fonts)

---

## 📦 Installation

### 1. Clone the repo
```bash
git clone https://github.com/yourusername/solos.git
cd solos
```

### 2. Install dependencies
```bash
npm install
```

### 3. Configure Firebase
1. Create a project at [Firebase Console](https://console.firebase.google.com/)
2. Enable **Authentication** (Google Sign-In)
3. Enable **Firestore Database**
4. Copy your web app config keys into `src/App.jsx`

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_AUTH_DOMAIN",
  projectId: "YOUR_PROJECT_ID",
  // ... rest of config
};
```

### 4. Configure Razorpay (Payment Integration)
1. Create account at [Razorpay](https://razorpay.com/)
2. Get test API keys from Dashboard → Settings → API Keys
3. Add to Vercel environment variables:

```bash
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

4. Update Razorpay key in `utils/payment.js`:
```javascript
key: "rzp_test_xxxxx"  // Your test key
```

### 5. Run locally
```bash
npm run dev
```

Visit `http://localhost:5173`

---

## 💳 Payment Integration

SolOS uses **Razorpay** for secure payment processing. Complete documentation:

- **[PAYMENT_SETUP_GUIDE.md](./PAYMENT_SETUP_GUIDE.md)** - 📘 Complete setup & deployment guide
- **[TROUBLESHOOTING.md](./TROUBLESHOOTING.md)** - 🔧 Common issues & quick fixes  
- **[PAYMENT_IMPLEMENTATION_SUMMARY.md](./PAYMENT_IMPLEMENTATION_SUMMARY.md)** - 📊 Technical overview
- **[TESTING_CHECKLIST.md](./TESTING_CHECKLIST.md)** - ✅ QA testing steps
- **[ARCHITECTURE.md](./ARCHITECTURE.md)** - 🏗️ System architecture

### Quick Start
```bash
# 1. Install dependencies
npm install

# 2. Copy environment template
cp .env.example .env.local

# 3. Add your Razorpay keys to .env.local

# 4. Verify setup
npm run verify:payment

# 5. Run dev servers
npm run dev          # Terminal 1
vercel dev           # Terminal 2
```

### Testing Payments
Test card: `4111 1111 1111 1111` • CVV: any 3 digits • Expiry: any future date

---

## 🚀 Deployment

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Production deployment
vercel --prod
```

### Environment Variables (Vercel)
Set these in Vercel Dashboard → Settings → Environment Variables:

```
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=your_secret_here
```

For production, replace with live keys (`rzp_live_xxxxx`).

---

## 📱 Mobile Support

SolOS is a **Progressive Web App (PWA)** candidate:
- Fully responsive design
- Add to Home Screen for native-like experience
- Works offline (coming soon)

---

## 🔒 Security

- ✅ Firebase Authentication (Google OAuth)
- ✅ Firestore security rules
- ✅ API keys in environment variables
- ✅ HTTPS enforced
- ✅ Payment signature verification (webhook)

---

## 📊 Project Structure

```
solos/
├── src/
│   ├── App.jsx              # Main app component
│   ├── main.jsx             # Vite entry point
│   ├── index.css            # Global styles
│   └── App.css              # Component styles
├── utils/
│   └── payment.js           # Razorpay payment handler
├── api/
│   ├── create-order.js      # Vercel serverless function
│   └── webhook.js           # Payment webhook (optional)
├── public/
│   ├── manifest.json        # PWA manifest
│   └── SolOS.png            # App icon
├── PAYMENT_INTEGRATION.md   # Payment docs
├── TESTING_CHECKLIST.md     # Testing guide
├── ARCHITECTURE.md          # System diagrams
├── QUICK_REF.md             # Quick reference
└── README.md                # This file
```

---

## 🤝 Contributing

This is a personal tool, but PRs are welcome if they align with the **"Ruthless Simplicity"** philosophy.

### ✅ Yes
- Performance improvements
- Bug fixes
- Cleaner UI
- Better documentation
- Security enhancements

### ❌ No
- New "features" that add clutter
- Complex integrations (e.g., team chat, video calls)
- Unnecessary dependencies

---

## 🐛 Troubleshooting

### Quick Diagnostics
```bash
# Verify payment setup
npm run verify:payment

# Or in browser console (F12)
runPaymentDiagnostics()
```

### Payment not working?
**See [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) for detailed fixes.**

Quick checks:
1. Environment variables set in `.env.local` AND Vercel dashboard
2. Both `vercel dev` and `npm run dev` running
3. Razorpay keys match your dashboard (test vs live)
4. Backend logs: `vercel logs --follow`

### Firestore not syncing?
1. Check Firebase Auth (user logged in?)
2. Verify Firestore security rules
3. Look for Firebase errors in console

### Build failing?
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
npm run build
```

---

## 📈 Roadmap

### ✅ Completed
- [x] Daily planner with priorities, schedule, expenses
- [x] Second Brain (PARA method)
- [x] Firebase Auth + Firestore sync
- [x] Freemium model with paywall
- [x] Razorpay payment integration
- [x] All 4 pricing tiers functional

### 🚧 In Progress
- [ ] Email receipts after payment
- [ ] Payment history dashboard
- [ ] Subscription auto-renewal
- [ ] Usage analytics

### 🔮 Future
- [ ] Mobile apps (iOS/Android)
- [ ] Offline mode (PWA)
- [ ] Team collaboration
- [ ] International pricing (USD/EUR)
- [ ] API for integrations

---

## 📄 License

MIT License. Go build something great.

---

## 📞 Support

- **Issues**: Open a GitHub issue
- **Email**: support@solos.app (if applicable)
- **Docs**: See [PAYMENT_INTEGRATION.md](./PAYMENT_INTEGRATION.md)

---

## 🙏 Acknowledgments

- Design inspiration: Linear, Notion, Arc Browser
- Payment processing: [Razorpay](https://razorpay.com/)
- Backend: [Firebase](https://firebase.google.com/)
- Hosting: [Vercel](https://vercel.com/)
- Icons: [Lucide](https://lucide.dev/)

---

**Version**: 2.4  
**Last Updated**: December 2024  
**Status**: 🟢 Production Ready

---

Made with ⚡ by founders, for founders.
