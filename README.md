# Virtualb Lead Agent Dashboard

A comprehensive lead management system with AI-drafted email review and approval workflow. Built for Virtualb (360° virtual tour company) to manage real estate leads and review AI-generated outreach emails before sending.

## 🎯 Project Overview

This application consists of two main parts:

1. **Lead Agent Dashboard** - Review and approve AI-drafted emails before sending to leads
2. **Lead Generation Form** - Capture new leads from website visitors

### Key Features

- **Pending Drafts Review** - View all AI-drafted emails awaiting approval
- **Email Preview & Editing** - Full HTML preview with inline editing
- **One-Click Sending** - Approve and send emails via n8n webhook
- **Real-time Updates** - Dashboard auto-refreshes via Supabase subscriptions
- **Lead Metrics** - Track total leads, emails sent, replies, and meetings booked
- **Draft Management** - Approve, reject, or edit drafts before sending

---

## 📊 Database Schema

**Table Name:** `lead_agent1` (Supabase)

### ⚠️ CRITICAL: Column Names Use SPACES and CAPITALS!

Unlike typical database schemas, this table uses **spaces and capital letters** in column names:

```sql
-- Lead Information
Name (text) - Lead's full name
Email (text) - Lead's email address
Phone Number (text) - Phone number
Country (text) - Country
Location (text) - City/region
Industry (text) - Industry sector
Website URL (text) - Company website
LinkedIn URL (text)
Instagram URL (text)
Twitter URL (text)
Facebook URL (text)

-- Email Campaign Fields
Email Drafted (text) - HTML email content drafted by AI
Lead Reply 1 (text) - First reply from lead
Reply 1 Drafted (text) - Our drafted reply to their first message
Lead Reply 2 (text) - Second reply from lead
Reply 2 Drafted (text) - Our drafted reply to their second message

-- Status Tracking (lowercase)
draft_status (text) - 'pending_review', 'sent', 'rejected', 'none'
draft_subject (text) - Email subject line
draft_created_at (timestamp) - When draft was created
draft_sent_at (timestamp) - When email was sent
appointment_at (timestamp) - Meeting scheduled time
appointment_status (text) - 'proposed', 'confirmed', 'completed'
lead_status (text) - 'new', 'contacted', 'replied', 'meeting_booked', 'closed'
created_at (timestamp) - Lead creation date
last_interaction_at (timestamp) - Last interaction date
id (integer) - Primary key
```

### Important TypeScript Type Definition

```typescript
export interface Lead {
  id?: number;
  Name: string;                    // Capital N, no space
  Email: string;                   // Capital E
  'Phone Number'?: string;         // Space in name!
  'Email Drafted'?: string;        // Space in name!
  'Lead Reply 1'?: string;         // Space in name!
  // ... etc
}
```

---

## 🔧 Tech Stack

- **Frontend:** React 18 + TypeScript + Vite
- **Styling:** Tailwind CSS
- **Database:** Supabase (PostgreSQL)
- **Real-time:** Supabase Subscriptions
- **Email Sending:** n8n Webhook → SMTP (Zoho)
- **Icons:** Lucide React
- **Date Formatting:** date-fns
- **Routing:** React Router DOM

---

## 🚀 Installation & Setup

### 1. Install Dependencies

```bash
cd leadgenform
pnpm install
# or: npm install
```

### 2. Configure Environment Variables

Create `.env` file (already exists):

```bash
# Supabase Configuration
VITE_SUPABASE_URL=https://jrtlgrknngaltjedmkrb.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# n8n Webhook for sending emails (SMTP)
VITE_N8N_SEND_EMAIL_WEBHOOK=https://strategicaiagency.app.n8n.cloud/webhook-test/e80dac79-a3de-4221-b127-06ede70e10b9

# n8n Webhook for lead form submissions
VITE_WEBHOOK_URL=https://strategicaiagency.app.n8n.cloud/webhook-test/ec9b57c9-3661-49d9-93a4-fb43b52ef784
```

### 3. Setup Supabase Permissions

**CRITICAL:** Disable RLS or add a read policy:

#### Option A: Disable RLS (Quick Fix)
1. Go to Supabase Dashboard → Table Editor → `lead_agent1`
2. Click settings (⚙️) → Toggle RLS OFF

#### Option B: Add Policy (Better)
```sql
ALTER TABLE lead_agent1 ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
ON lead_agent1
FOR SELECT
TO anon
USING (true);
```

### 4. Run Development Server

```bash
pnpm run dev
# Opens at http://localhost:3000
```

---

## 📁 Project Structure

```
leadgenform/
├── src/
│   ├── pages/
│   │   ├── Dashboard.tsx          # 🎯 Main dashboard with pending drafts
│   │   ├── Leads.tsx              # All leads table view
│   │   ├── Analytics.tsx          # Analytics page
│   │   └── FormPage.tsx           # Lead generation form
│   ├── components/
│   │   ├── DraftCard.tsx          # Individual draft preview card
│   │   ├── DraftModal.tsx         # Full email view/edit modal
│   │   ├── Navbar.tsx             # Navigation bar
│   │   ├── Toast.tsx              # Toast notification
│   │   └── ToastContainer.tsx     # Toast manager
│   ├── lib/
│   │   └── supabase.ts            # Supabase client initialization
│   ├── types/
│   │   └── index.ts               # TypeScript type definitions
│   ├── data/
│   │   └── countries.ts           # Country list for form
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles + Tailwind
├── .env                           # Environment variables
├── .env.example                   # Template
├── package.json                   # Dependencies
├── tailwind.config.js            # Tailwind configuration
├── tsconfig.json                 # TypeScript config
└── vite.config.ts                # Vite configuration
```

---

## 🔄 How Email Sending Works

### Workflow:

1. **AI Drafts Email** (External process, populates `Email Drafted` column)
2. **Dashboard Shows Draft** (filters where `Email Drafted IS NOT NULL`)
3. **User Reviews** (clicks "View Full" → opens modal)
4. **User Approves** (clicks "Send")
5. **Frontend Calls n8n Webhook:**
   ```json
   POST https://strategicaiagency.app.n8n.cloud/webhook-test/e80dac79-a3de-4221-b127-06ede70e10b9
   {
     "toEmail": "info@company.com",
     "subject": "Partnership Opportunity - CMT Digital Solutions",
     "htmlBody": "<html>...</html>"
   }
   ```
6. **n8n Sends Email** (via Zoho SMTP)
7. **Dashboard Updates Supabase:**
   ```sql
   UPDATE lead_agent1
   SET draft_status = 'sent',
       draft_sent_at = NOW(),
       lead_status = 'contacted'
   WHERE Email = 'info@company.com'
   ```
8. **Real-time Update** (Supabase subscription refreshes dashboard)

---

## 📱 Key Components

### Dashboard.tsx (`src/pages/Dashboard.tsx:17`)

Main dashboard component that:
- Fetches all leads from `lead_agent1` table
- Calculates metrics (total, pending, sent, replies, meetings)
- Filters pending drafts where `"Email Drafted"` is not null
- Handles send/reject/save operations
- Manages real-time subscriptions

### DraftCard.tsx (`src/components/DraftCard.tsx`)

Individual draft preview card showing:
- Lead name, email, location, industry
- Subject line
- Email preview (first 150 characters)
- Action buttons: View Full, Edit, Send, Reject

### DraftModal.tsx (`src/components/DraftModal.tsx`)

Full-screen modal for:
- Viewing complete HTML email
- Editing subject and body
- HTML preview rendering
- Sending or saving changes

---

## 🎨 Pages & Routes

| Route | Component | Description |
|-------|-----------|-------------|
| `/dashboard` | Dashboard | Lead Agent Dashboard (main page) |
| `/` | FormPage | Lead generation form |
| `/leads` | Leads | All leads table view |
| `/analytics` | Analytics | Analytics page |

---

## ⚙️ Environment Variables Explained

### VITE_SUPABASE_URL
- Your Supabase project URL
- Found in: Supabase Dashboard → Settings → API

### VITE_SUPABASE_ANON_KEY
- Public anon/public key for Supabase
- Found in: Supabase Dashboard → Settings → API → Project API keys

### VITE_N8N_SEND_EMAIL_WEBHOOK
- **Purpose:** Send approved email drafts via SMTP
- **Method:** POST
- **Payload:** `{ toEmail, subject, htmlBody }`
- **n8n Workflow:** Webhook → SMTP Send → Response

### VITE_WEBHOOK_URL
- **Purpose:** Receive new lead form submissions
- **Method:** POST
- **Payload:** Lead form data

---

## 🐛 Common Issues & Solutions

### Issue: Drafts Not Showing

**Cause:** Supabase RLS (Row Level Security) blocking reads

**Solution:**
```sql
-- Disable RLS
ALTER TABLE lead_agent1 DISABLE ROW LEVEL SECURITY;

-- OR add policy
CREATE POLICY "Allow public read" ON lead_agent1 FOR SELECT TO anon USING (true);
```

### Issue: "Column does not exist" Error

**Cause:** Column names have **spaces and capitals**

**Wrong:**
```typescript
lead.email_drafted  // ❌
lead['email_drafted']  // ❌
```

**Correct:**
```typescript
lead['Email Drafted']  // ✅
lead['Lead Reply 1']   // ✅
lead.Name              // ✅ (no spaces)
```

### Issue: Email Not Sending

**Check:**
1. Is `VITE_N8N_SEND_EMAIL_WEBHOOK` set in `.env`?
2. Is the n8n workflow active?
3. Open browser console (F12) and check for errors
4. Test webhook manually with Postman/curl

### Issue: Real-time Updates Not Working

**Solution:**
- Ensure Supabase real-time is enabled for `lead_agent1` table
- Check: Supabase Dashboard → Database → Replication → Enable for table

---

## 🧪 Testing

### Add Test Data to Supabase:

```sql
INSERT INTO lead_agent1 (
  "Name",
  "Email",
  "Location",
  "Industry",
  "Email Drafted",
  draft_status,
  created_at
)
VALUES (
  'Test Company',
  'test@example.com',
  'Beirut, Lebanon',
  'Real Estate',
  '<html><body>Dear Test,<br><br>Thank you for your interest...</body></html>',
  'pending_review',
  NOW()
);
```

---

## 📊 Current Data (as of Nov 2025)

**Total Leads:** 10

**Leads with Drafts (6):**
1. PCX - info@pcx-lb.com
2. RAMCO - info@ramcolebanon.com
3. Dealers Group - info@dealersgroup.net
4. JSK Real Estate - info@jskrealestate.com
5. PBM - info@pbmlebanon.com
6. SmoothMove - info@smoothmovelebanon.com

**Leads without Drafts (4):**
- Rinvest
- FOREST SAL
- Al Manara
- MBO REALTORS

---

## 🔐 Security Notes

- **RLS:** Consider enabling RLS with proper policies for production
- **API Keys:** Never commit `.env` file to git
- **Webhook URLs:** Keep webhook URLs private
- **CORS:** Ensure n8n webhooks have CORS enabled if calling from browser

---

## 🚀 Deployment

### Build for Production:

```bash
pnpm run build
```

### Preview Production Build:

```bash
pnpm run preview
```

### Deploy to:
- **Vercel** (recommended for Vite projects)
- **Netlify**
- **Cloudflare Pages**

**Remember to:**
1. Set environment variables in hosting platform
2. Enable Supabase RLS with proper policies
3. Update CORS settings on n8n webhooks

---

## 📞 Support & Maintenance

### Important Files to Remember:

1. **`.env`** - All credentials and webhook URLs
2. **`src/types/index.ts`** - Database schema types (column names!)
3. **`src/pages/Dashboard.tsx`** - Main dashboard logic
4. **`src/lib/supabase.ts`** - Supabase client

### When Reopening Project:

1. Check if `.env` credentials are still valid
2. Verify Supabase RLS policies
3. Test n8n webhooks are still active
4. Run `pnpm install` if dependencies changed
5. Remember: **Column names have SPACES and CAPITALS!**

---

## 🎯 Future Enhancements (Phase 2)

- [ ] All Leads table with filters
- [ ] Search functionality
- [ ] Lead detail page
- [ ] Analytics charts (Recharts)
- [ ] Reply tracking system
- [ ] Meeting scheduler integration
- [ ] Bulk email operations
- [ ] Email templates
- [ ] Authentication (Supabase Auth)

---

## 📝 Notes for Claude Code

### Critical Things to Remember:

1. **Column Names:** Use `"Email Drafted"` (spaces!), not `email_drafted`
2. **Table Name:** `lead_agent1`, not `virtualb_leads`
3. **Webhook URL:** Already configured in `.env`
4. **RLS:** Must be disabled or have policy for reads
5. **Real-time:** Supabase subscriptions enabled on `lead_agent1`

### Quick Reference Queries:

```typescript
// Fetch all leads
const { data } = await supabase
  .from('lead_agent1')
  .select('*')
  .order('created_at', { ascending: false });

// Get pending drafts
const pending = leads.filter(
  l => l['Email Drafted'] &&
       l['Email Drafted'].trim() !== '' &&
       l.draft_status !== 'sent'
);

// Update after sending
await supabase
  .from('lead_agent1')
  .update({ draft_status: 'sent', draft_sent_at: new Date().toISOString() })
  .eq('Email', leadEmail);
```

---

Made with 🤖 by Claude Code for Virtualb Lead Management
