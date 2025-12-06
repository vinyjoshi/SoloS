# SolOS Payment Architecture Diagram

## System Overview

```
┌──────────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE (React)                       │
│                                                                       │
│  ┌────────────────────────────────────────────────────────────┐    │
│  │                     Pricing Modal                           │    │
│  │                                                             │    │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐       │    │
│  │  │  Weekly     │  │  Monthly    │  │  Yearly     │       │    │
│  │  │  ₹99/week   │  │  ₹499/mo    │  │  ₹4,999/yr  │       │    │
│  │  └─────────────┘  └─────────────┘  └─────────────┘       │    │
│  │                                                             │    │
│  │  ┌─────────────┐                                           │    │
│  │  │  Lifetime   │                                           │    │
│  │  │  ₹9,999     │                                           │    │
│  │  └─────────────┘                                           │    │
│  └────────────────────────────────────────────────────────────┘    │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ onClick: handlePayment()
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                    PAYMENT UTILITY (utils/payment.js)                │
│                                                                       │
│  1. Load Razorpay SDK from CDN                                      │
│  2. Create order request to backend                                 │
│  3. Initialize Razorpay checkout                                    │
│  4. Handle payment response                                         │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ POST /api/create-order
                     │ { amount: 499 }
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│              BACKEND API (api/create-order.js - Vercel)             │
│                                                                       │
│  1. Validate request                                                │
│  2. Check environment variables                                     │
│  3. Initialize Razorpay SDK                                         │
│  4. Create order (amount * 100)                                     │
│  5. Return order_id to frontend                                     │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ Razorpay API Call
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                       RAZORPAY SERVICE                               │
│                                                                       │
│  • Generate order_id                                                │
│  • Return order details                                             │
│  • Open checkout modal                                              │
│  • Process payment                                                  │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ Payment Success
                     │ { payment_id, order_id, signature }
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     SUCCESS CALLBACK (App.jsx)                       │
│                                                                       │
│  1. Receive payment response                                        │
│  2. Update Firestore with:                                          │
│     • tier: 'pro'                                                   │
│     • plan: 'weekly|monthly|yearly|lifetime'                        │
│     • paymentId: 'pay_xxxxx'                                        │
│     • lastPayment: serverTimestamp()                                │
│  3. Update local state (setUserTier('pro'))                         │
│  4. Close modal                                                     │
│  5. Show success alert                                              │
└────────────────────┬─────────────────────────────────────────────────┘
                     │
                     │ setDoc()
                     │
                     ▼
┌──────────────────────────────────────────────────────────────────────┐
│                         FIRESTORE DATABASE                           │
│                                                                       │
│  Path: artifacts/solos-web/users/{uid}/settings/profile            │
│                                                                       │
│  {                                                                  │
│    tier: "pro",                                                     │
│    plan: "monthly",                                                 │
│    paymentId: "pay_xxxxxxxxx",                                      │
│    lastPayment: Timestamp(2024-12-07T...)                           │
│  }                                                                  │
└──────────────────────────────────────────────────────────────────────┘
```

---

## Data Flow Sequence

```
USER                FRONTEND              BACKEND           RAZORPAY         FIRESTORE
  |                    |                     |                  |                |
  |--[Click Button]--->|                     |                  |                |
  |                    |                     |                  |                |
  |                    |--[POST /api]------->|                  |                |
  |                    |   {amount: 499}     |                  |                |
  |                    |                     |                  |                |
  |                    |                     |--[Create Order]->|                |
  |                    |                     |                  |                |
  |                    |                     |<--[order_id]-----|                |
  |                    |<--[order_id]--------|                  |                |
  |                    |                     |                  |                |
  |                    |--[Open Modal]------>|                  |                |
  |                    |                     |                  |                |
  |<--[Enter Card]-----|                     |                  |                |
  |                    |                     |                  |                |
  |--[Pay Now]-------->|                     |                  |                |
  |                    |                     |                  |                |
  |                    |<--[Success]---------|                  |                |
  |                    | {payment_id}        |                  |                |
  |                    |                     |                  |                |
  |                    |--[Update User]------------------------------>|          |
  |                    |   {tier: 'pro'}     |                  |                |
  |                    |                     |                  |                |
  |<--[Alert]----------|                     |                  |                |
  |  "Welcome!"        |                     |                  |                |
  |                    |                     |                  |                |
```

---

## Component Relationships

```
App.jsx (Main Component)
├── PricingModal
│   ├── Weekly Button → handlePayment(99, 'weekly')
│   ├── Monthly Button → handlePayment(499, 'monthly')
│   ├── Yearly Button → handlePayment(4999, 'yearly')
│   └── Lifetime Button → handlePayment(9999, 'lifetime')
│
├── payment.js (Utility)
│   ├── loadRazorpayScript()
│   ├── fetch('/api/create-order')
│   ├── new Razorpay(options)
│   └── handler: onSuccess(response)
│
└── Firestore Update
    └── setDoc(userRef, {tier, plan, paymentId, lastPayment})
```

---

## Environment Variables Flow

```
Development (.env.local)
├── RAZORPAY_KEY_ID=rzp_test_xxxxx
└── RAZORPAY_KEY_SECRET=xxxxx

         ↓ (Deploy)

Vercel (Production)
├── RAZORPAY_KEY_ID=rzp_live_xxxxx
└── RAZORPAY_KEY_SECRET=xxxxx

         ↓ (Used by)

api/create-order.js
└── process.env.RAZORPAY_KEY_ID
└── process.env.RAZORPAY_KEY_SECRET
```

---

## Error Handling Flow

```
                    ┌─────────────────┐
                    │  User Action    │
                    └────────┬────────┘
                             │
                             ▼
                    ┌─────────────────┐
                    │ Try Payment     │
                    └────────┬────────┘
                             │
                    ┌────────┴────────┐
                    │                 │
                    ▼                 ▼
           ┌─────────────┐   ┌─────────────┐
           │  Success    │   │   Failure   │
           └──────┬──────┘   └──────┬──────┘
                  │                 │
                  ▼                 ▼
         ┌─────────────┐   ┌─────────────┐
         │Update State │   │ Show Error  │
         │Close Modal  │   │ Keep Modal  │
         │Show Alert   │   │ Log Error   │
         └─────────────┘   └─────────────┘
```

---

## Security Layers

```
┌────────────────────────────────────────────┐
│          FRONTEND (Client-Side)            │
│  • API Keys visible in code (public key)   │
│  • No secrets exposed                      │
│  • HTTPS enforced                          │
└────────────────┬───────────────────────────┘
                 │
                 │ Secure HTTPS Request
                 │
                 ▼
┌────────────────────────────────────────────┐
│          BACKEND (Server-Side)             │
│  • Environment variables                   │
│  • Secret keys never exposed               │
│  • Input validation                        │
│  • CORS configured                         │
└────────────────┬───────────────────────────┘
                 │
                 │ Authenticated API Call
                 │
                 ▼
┌────────────────────────────────────────────┐
│              RAZORPAY API                  │
│  • Signature verification                  │
│  • Payment processing                      │
│  • Webhook callbacks                       │
└────────────────────────────────────────────┘
```

---

## Pricing Tiers Comparison

```
┌─────────────┬────────┬──────────┬──────────┬───────────┐
│    Tier     │ Price  │ Duration │ Savings  │ Use Case  │
├─────────────┼────────┼──────────┼──────────┼───────────┤
│ Weekly      │ ₹99    │ 7 days   │ --       │ Testing   │
├─────────────┼────────┼──────────┼──────────┼───────────┤
│ Monthly     │ ₹499   │ 30 days  │ --       │ Standard  │
├─────────────┼────────┼──────────┼──────────┼───────────┤
│ Yearly      │ ₹4,999 │ 365 days │ 17% off  │ Committed │
├─────────────┼────────┼──────────┼──────────┼───────────┤
│ Lifetime    │ ₹9,999 │ Forever  │ Best     │ Founders  │
└─────────────┴────────┴──────────┴──────────┴───────────┘

Annual Cost Comparison:
Weekly:  ₹99  × 52 weeks  = ₹5,148
Monthly: ₹499 × 12 months = ₹5,988
Yearly:  ₹4,999 (Save ₹989 vs Monthly)
```

---

## Firestore Schema

```
artifacts/
└── solos-web/
    └── users/
        └── {userId}/
            ├── days/
            │   └── {dateKey}/
            │       ├── top3: []
            │       ├── schedule: {}
            │       ├── expenses: []
            │       ├── brainDump: ""
            │       └── journal: ""
            │
            ├── docs/
            │   └── {docId}/
            │       ├── title: ""
            │       ├── body: ""
            │       ├── category: ""
            │       ├── tags: []
            │       └── updatedAt: Timestamp
            │
            └── settings/
                └── profile/
                    ├── tier: "free" | "pro"
                    ├── plan: "weekly" | "monthly" | "yearly" | "lifetime"
                    ├── paymentId: "pay_xxxxx"
                    └── lastPayment: Timestamp
```

---

## State Management Flow

```
┌──────────────────────────────────────────────────┐
│             Initial State (Free Tier)            │
│  • userTier = 'free'                             │
│  • Date locking: current week only               │
│  • Doc limits: 5 projects, 5 areas, 20 resources │
└────────────────┬─────────────────────────────────┘
                 │
                 │ User clicks Upgrade
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│              Payment Modal Opens                 │
│  • showPricing = true                            │
│  • Body scroll locked                            │
│  • Modal above all content (z-index 9999)        │
└────────────────┬─────────────────────────────────┘
                 │
                 │ Payment Success
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│            State Update (Pro Tier)               │
│  1. Firestore: tier = 'pro', plan = 'monthly'   │
│  2. Local state: setUserTier('pro')             │
│  3. Modal: showPricing = false                  │
│  4. Alert: "Welcome to SolOS Pro!"              │
└────────────────┬─────────────────────────────────┘
                 │
                 │ UI Re-renders
                 │
                 ▼
┌──────────────────────────────────────────────────┐
│           Updated UI (Pro Features)              │
│  • All dates unlocked                            │
│  • Unlimited docs                                │
│  • No paywalls                                   │
└──────────────────────────────────────────────────┘
```

---

**This architecture ensures:**
- ✅ Secure payment processing
- ✅ Clear separation of concerns
- ✅ Scalable for future features
- ✅ Easy to debug and maintain
