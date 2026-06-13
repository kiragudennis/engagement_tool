## What We've Built

| System                                      | Status               |
| ------------------------------------------- | -------------------- |
| Spin wheel engine                           | ✅ Complete          |
| Trivia challenge system                     | ✅ Complete          |
| Live broadcast display                      | ✅ Complete          |
| Multi-business foundation                   | ✅ Database + tables |
| Business signup flow                        | ✅                   |
| Access codes (public, single-use, bulk, QR) | ✅                   |
| Code-gated customer activation              | ✅                   |
| Branded business spin page                  | ✅                   |
| Business admin dashboard                    | ✅                   |
| Code management page                        | ✅                   |
| Customer list + export                      | ✅                   |
| Pricing page                                | ✅                   |
| PayPal + M-Pesa checkout                    | ✅                   |
| Payment webhooks                            | ✅                   |
| Customer loyalty points                     | ✅                   |
| Customer account dashboard                  | ✅                   |
| Streak tracking hook                        | ✅                   |

## What's Missing

| Gap                                                                     | Priority    |
| ----------------------------------------------------------------------- | ----------- |
| **Subscription enforcement** - middleware that checks plan limits       | 🔴 Critical |
| **Plan limit enforcement** - block spins when monthly limit reached     | 🔴 Critical |
| **Trial expiry handling** - auto-lock features after trial              | 🔴 Critical |
| **Business settings page** - branding, activation duration, admin users | 🟡 High     |
| **Spin game config in admin** - reuse existing admin but scoped         | 🟡 High     |
| **Trivia host controls in admin** - scoped to business                  | 🟡 High     |
| **Points redemption API** - actually redeem points                      | 🟡 High     |
| **Email notifications** - trial ending, payment receipt, etc            | 🟡 High     |
| **README / Documentation**                                              | 🔴 Critical |
| **Landing page** - marketing site                                       | 🟡 High     |
| **SEO metadata** - for business pages                                   | 🟢 Medium   |
| **Error boundaries** - graceful failures                                | 🟢 Medium   |
| **Rate limiting** - prevent abuse                                       | 🟢 Medium   |
| **Analytics page** - charts for businesses                              | 🟢 Medium   |

````

---

## 4. README.md

```markdown
# 🎡 Engage — Turn Your Business Into a Live Game Show

**Engage** is a multi-tenant engagement platform that lets businesses create gamified experiences (spin wheels, trivia nights) and invite their audience to participate. Businesses broadcast live events via OBS while customers play from their phones.

---

## ✨ Features

### For Businesses
- **🎰 Spin-to-Win Wheel** — Configurable prize wheel with probabilities, custom branding
- **🧠 Live Trivia** — Host trivia nights with ticket queues, timed answers, live leaderboards
- **🎬 OBS Broadcast** — Professional live display for projecting behind the host
- **🎟️ Access Codes** — Public, single-use, bulk, and QR codes to gate participation
- **📊 Customer Data** — Every spin captures emails; export to CSV
- **💰 Monetization** — Free 14-day trial, then Starter/Pro/Enterprise plans
- **💳 Payments** — M-Pesa and PayPal integration

### For Customers
- **One Account** — Single login across all businesses
- **⭐ Loyalty Points** — Earn points for every spin and trivia answer
- **🎁 Rewards** — Redeem points for extra spins, VIP badges, golden tickets
- **📱 Mobile-First** — No app download; works in any browser

---

## 🏗️ Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 14 (App Router) |
| Database | Supabase (PostgreSQL) |
| Auth | Supabase Auth |
| Real-time | Supabase Realtime (WebSockets) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| Payments | PayPal API + M-Pesa Daraja API |
| Email | Resend |
| Deployment | Vercel |

---

# Changelog

## [1.0.0] - 2026-06-13

### Added
- Multi-tenant business foundation with Supabase RLS
- Spin wheel engine with configurable prizes and probabilities
- Live trivia challenge system with ticket queue
- OBS-compatible live broadcast display
- Access code system (public, single-use, bulk, QR, time-limited)
- Code-gated customer activation (30-day window per business)
- Branded business pages with custom colors and logos
- Business admin dashboard with stats and quick actions
- Code management page with bulk generation
- Customer list with CSV export and detail view
- PayPal and M-Pesa payment integration
- Customer loyalty points system per business
- Customer account dashboard with active businesses and history
- Points redemption options (extra spins, VIP badges, golden tickets)
- Subscription plans (Starter, Pro, Enterprise) with 14-day free trial
- Plan limits enforcement and usage tracking
- Public pages: Landing, Pricing, About, How It Works, Terms, Privacy
- Real-time Supabase subscriptions for live features
- canvas-confetti for win celebrations
- Framer Motion animations throughout
- Responsive mobile-first design

### Technical
- Next.js 14 App Router
- Supabase with PostgreSQL and Row Level Security
- TypeScript throughout
- Tailwind CSS with shadcn/ui components
- Server-side middleware for plan enforcement
- Webhook handlers for PayPal and M-Pesa
- Database functions for points, activations, and code redemption

## 📦 Project Structure

````

├── app/
│ ├── (public)/ # Public-facing pages
│ │ ├── spin/ # Code entry + signup
│ │ ├── [businessSlug]/ # Branded business pages
│ │ │ └── spin/ # Business spin wheel
│ │ ├── pricing/ # Pricing page
│ │ └── business/
│ │ └── signup/ # Business onboarding
│ │
│ ├── (admin)/ # Business admin
│ │ └── admin/
│ │ └── [businessSlug]/
│ │ ├── page.tsx # Dashboard
│ │ ├── codes/ # Code management
│ │ ├── customers/ # Customer list
│ │ ├── spin/ # Spin game config
│ │ ├── trivia/ # Trivia config
│ │ └── billing/ # Subscription
│ │
│ ├── (store)/ # Customer account
│ │ ├── account/ # Dashboard + points
│ │ └── challenges/ # Challenge system (legacy e-commerce)
│ │
│ └── api/
│ ├── checkout/ # Payment initiation
│ └── webhooks/
│ ├── paypal/ # PayPal webhook
│ └── mpesa/ # M-Pesa callback
│
├── components/
│ ├── ui/ # shadcn/ui components
│ ├── notifications/ # Notification bell + service
│ └── providers/ # Auth, theme providers
│
├── lib/
│ ├── context/ # AuthContext
│ ├── services/ # Challenges, notifications, plan limits
│ └── hooks/ # useStreakTracker
│
└── types/ # TypeScript types

````

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Supabase account
- PayPal Business account (for payments)
- M-Pesa Daraja API credentials (for M-Pesa)

### Environment Variables

```bash
# .env.local
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# PayPal
PAYPAL_CLIENT_ID=your-paypal-client-id
PAYPAL_SECRET=your-paypal-secret

# M-Pesa
MPESA_CONSUMER_KEY=your-mpesa-consumer-key
MPESA_CONSUMER_SECRET=your-mpesa-consumer-secret
MPESA_PASSKEY=your-mpesa-passkey
MPESA_SHORTCODE=174379

# App
NEXT_PUBLIC_URL=https://engagespin.com
````

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/engage.git
cd engage

# Install dependencies
npm install

# Run database migrations
# Execute all SQL files in /supabase/migrations/ in order

# Start development server
npm run dev
```

### Database Setup

Execute these SQL files in order:

1. `00-users.sql` — Base users table
2. `01-businesses.sql` — Multi-tenant foundation
3. `02-spin-games.sql` — Spin wheel engine
4. `03-challenges.sql` — Challenge/trivia system
5. `04-access-codes.sql` — Code management
6. `05-customer-points.sql` — Loyalty points
7. `06-payments.sql` — Payment tracking
8. `07-notifications.sql` — Notification system

---

## 🔄 How It Works

### Customer Flow

```
1. Customer receives a code from a business (receipt, social media, in-store)
2. Visits engagespin.com/spin
3. Enters code → creates account (or logs in)
4. Account activated for that business for 30 days
5. Spins the wheel → wins prizes
6. Earns loyalty points for every engagement
7. Can be active with multiple businesses simultaneously
```

### Business Flow

```
1. Business signs up at engagespin.com/business/signup
2. Gets 14-day free trial
3. Configures spin wheel (prizes, probabilities, branding)
4. Generates access codes (QR for in-store, bulk for receipts)
5. Shares codes with customers
6. Customers spin → business captures emails
7. Broadcasts live trivia via OBS
8. Exports customer data for marketing
```

### Live Broadcast Flow

```
1. Admin opens host controls at /admin/[slug]/trivia/host
2. Opens /[slug]/live in OBS as browser source
3. Host calls participants by ticket number
4. Customers answer from their phones at /[slug]/trivia
5. Live display shows question, timer, leaderboard
6. All real-time via Supabase WebSockets
```

---

## 💰 Subscription Plans

| Feature          | Starter ($29/mo) | Pro ($79/mo) | Enterprise ($199/mo) |
| ---------------- | ---------------- | ------------ | -------------------- |
| Spin games       | 1                | 3            | Unlimited            |
| Spins/month      | 500              | 5,000        | 25,000               |
| Prize slots      | 6                | 12           | 24                   |
| Trivia questions | 20               | 100          | Unlimited            |
| Admin users      | 1                | 3            | 10                   |
| Custom domain    | ❌               | ✅           | ✅                   |
| Remove branding  | ❌               | ✅           | ✅                   |
| API access       | ❌               | ❌           | ✅                   |

---

## 🔐 Security

- **Row Level Security (RLS)** — All tables have RLS policies
- **Code-gated access** — No browsing without verified codes
- **Rate limiting** — Spins per user per day enforced
- **Data isolation** — Businesses only see their own customers
- **Secure webhooks** — PayPal and M-Pesa webhooks verified

---

## 📝 License

Proprietary. All rights reserved.

---

## 🙋 Support

- Email: support@engagespin.com
- Documentation: docs.engagespin.com

```

```
