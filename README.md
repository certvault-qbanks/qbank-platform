# QBank Platform — Multi-Tenant Certification Prep

One codebase powering multiple niche certification question banks. Each qbank gets its own domain, branding, questions, and Stripe payments — but shares a single Supabase backend.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  ONE CODEBASE                        │
│                                                      │
│  src/configs/hc_compliance.js   ← HC QBank           │
│  src/configs/clinical_research.js ← CR QBank         │
│  src/configs/your_next_qbank.js ← Add more here     │
│                                                      │
│  VITE_QBANK_ID env var selects which config to use   │
├─────────────────────────────────────────────────────┤
│                                                      │
│  Shared: Auth, Study Engine, Analytics, Paywall,     │
│          Practice Tests, UI Components               │
│                                                      │
│  Per-QBank: Name, Logo, Colors, Categories,          │
│             Exam Configs, Stripe Links, Questions     │
└──────────────────────┬──────────────────────────────┘
                       │
              ┌────────▼────────┐
              │   ONE Supabase   │
              │   Database       │
              │                  │
              │  Every row has   │
              │  qbank_id column │
              │  for isolation   │
              └─────────────────┘
```

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/qbank-platform.git
cd qbank-platform
npm install
```

### 2. Set Up Supabase (one time, shared across all qbanks)

1. Create a free project at [supabase.com](https://supabase.com)
2. Go to **SQL Editor** → paste contents of `supabase/migration.sql` → Run
3. Go to **Settings > API** → copy Project URL and anon key

### 3. Configure & Run

```bash
cp .env.example .env.local
# Edit .env.local with your Supabase credentials
# Set VITE_QBANK_ID to whichever qbank you want to run

npm run dev
```

### 4. Enable Google OAuth (optional)

In Supabase Dashboard → Authentication → Providers → Google → Enable

## Adding a New QBank (5 minutes)

1. **Create config**: Copy `src/configs/hc_compliance.js` → `src/configs/my_new_cert.js`
2. **Edit config**: Change name, categories, exams, Stripe links, sample questions
3. **Register it**: Add import + entry in `src/configs/index.js`
4. **Deploy**: Create a new Vercel project with `VITE_QBANK_ID=my_new_cert`
5. **Add questions**: Import into Supabase `questions` table with `qbank_id = 'my_new_cert'`

### Config File Structure

```js
export default {
  id: 'my_new_cert',           // Unique ID (used as qbank_id in database)
  name: 'MY QBank',            // Short name (sidebar, logo)
  fullName: 'My Certification QBank',
  tagline: 'Pass your certification exam',
  description: 'Longer description for marketing pages',
  supportEmail: 'support@myqbank.com',
  logoText: 'MY',              // 2-letter fallback when no logo image

  colors: { primary: 'blue', accent: 'purple', success: 'emerald' },

  categories: [
    { value: 'topic_1', label: 'Topic One', color: 'from-blue-500 to-blue-600' },
    // ... more categories
  ],

  exams: [
    {
      id: 'exam_1', name: 'Exam Name', fullName: 'Full Exam Name',
      questionCount: 100, timeLimit: 120, passingScore: 70,
      categories: ['topic_1', 'topic_2'],
      color: 'from-blue-600 to-blue-700',
    },
  ],

  stripe: {
    '30day': 'https://buy.stripe.com/...',
    '90day': 'https://buy.stripe.com/...',
    '12month': 'https://buy.stripe.com/...',
  },

  plans: [
    { id: '30day', label: '30-Day', price: 49, period: '30 days', color: '...', highlight: false },
    { id: '90day', label: '90-Day', price: 79, period: '90 days', color: '...', highlight: true, badge: 'Popular' },
    { id: '12month', label: '12-Month', price: 99, period: '12 months', color: '...' },
  ],

  trial: { freeQuestions: 50 },

  sampleQuestions: [ /* hardcoded questions for offline Study mode */ ],
};
```

## Deploying Multiple QBanks on Vercel

Each qbank = one Vercel project pointing to the same GitHub repo.

| QBank | Domain | Vercel Env Var |
|-------|--------|---------------|
| HC Compliance | hcqbank.com | `VITE_QBANK_ID=hc_compliance` |
| Clinical Research | crqbank.com | `VITE_QBANK_ID=clinical_research` |
| Your Next One | nextqbank.com | `VITE_QBANK_ID=my_next_cert` |

All three share the same Supabase URL and anon key. Data is isolated by `qbank_id`.

### Steps per deployment:
1. Vercel → New Project → Import same GitHub repo
2. Set env vars: `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `VITE_QBANK_ID`
3. Add custom domain
4. Deploy

## Loading Questions into Supabase

Each question needs a `qbank_id` matching the config:

```sql
INSERT INTO questions (qbank_id, question_text, options, explanation, category, difficulty)
VALUES (
  'hc_compliance',
  'Your question text here',
  '[{"text": "Option A", "is_correct": false}, {"text": "Option B", "is_correct": true}]',
  'Explanation of correct answer',
  'hipaa_privacy',
  'intermediate'
);
```

Or bulk import via Supabase Table Editor (CSV/JSON upload).

## Stripe Webhook (activate subscriptions)

After a user pays, update their profile:

```sql
UPDATE profiles
SET subscription_status = 'active'
WHERE email = 'user@email.com' AND qbank_id = 'hc_compliance';
```

For automation: create a Supabase Edge Function triggered by Stripe webhook.

## Tech Stack

- **Frontend**: React 18, Vite, Tailwind CSS, shadcn/ui, Framer Motion, Recharts
- **Backend**: Supabase (PostgreSQL + Auth + Row Level Security)
- **Payments**: Stripe Payment Links (per qbank)
- **Hosting**: Vercel (one deployment per qbank, same repo)

## Project Structure

```
src/
├── api/
│   ├── supabaseClient.js      # Supabase client
│   └── entities.js             # Multi-tenant CRUD (all queries scoped by qbank_id)
├── configs/
│   ├── index.js                # Config loader (reads VITE_QBANK_ID)
│   ├── hc_compliance.js        # HC QBank config
│   └── clinical_research.js    # CR QBank config
├── components/
│   ├── ui/                     # shadcn/ui components
│   ├── common/                 # TrialCounter
│   ├── dashboard/              # StatsCard, CategoryCard, RecentActivity
│   └── paywall/                # PaywallModal
├── entities/
│   └── all.js                  # Barrel export
├── lib/
│   ├── AuthContext.jsx          # Supabase auth
│   ├── utils.js
│   └── query-client.js
├── pages/                       # All pages (config-driven)
├── App.jsx                      # Router
└── Layout.jsx                   # Sidebar (reads branding from config)
supabase/
└── migration.sql                # Database schema (run once)
```
