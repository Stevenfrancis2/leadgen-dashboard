# Supabase Setup Guide

This guide will help you set up your Supabase database for the LeadGen Pro dashboard.

## Step 1: Create a Supabase Account

1. Go to [https://supabase.com](https://supabase.com)
2. Sign up for a free account
3. Create a new project

## Step 2: Get Your API Credentials

1. In your Supabase project dashboard, go to **Settings** → **API**
2. Copy the following:
   - **Project URL** (e.g., `https://xxxxx.supabase.co`)
   - **Anon public key** (starts with `eyJ...`)

3. Update your `.env` file:
```env
VITE_SUPABASE_URL=your-project-url-here
VITE_SUPABASE_ANON_KEY=your-anon-key-here
```

## Step 3: Create the Database Tables

Go to the **SQL Editor** in your Supabase dashboard and run the following SQL commands:

### 1. Create the Leads Table

```sql
-- Create leads table
CREATE TABLE leads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_type TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  number_of_results INTEGER NOT NULL,
  status TEXT DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'replied', 'closed', 'lost')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_contacted TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  contact_email TEXT,
  contact_phone TEXT,
  company_name TEXT
);

-- Create an index on created_at for faster queries
CREATE INDEX idx_leads_created_at ON leads(created_at DESC);

-- Create an index on status for faster filtering
CREATE INDEX idx_leads_status ON leads(status);

-- Enable Row Level Security (RLS)
ALTER TABLE leads ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
-- WARNING: In production, you should create more restrictive policies
CREATE POLICY "Allow all operations on leads" ON leads
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 2. Create the Lead Interactions Table (Optional)

```sql
-- Create lead_interactions table for tracking customer interactions
CREATE TABLE lead_interactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  lead_id UUID NOT NULL REFERENCES leads(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('email', 'call', 'meeting', 'note', 'status_change')),
  description TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by TEXT
);

-- Create an index on lead_id for faster queries
CREATE INDEX idx_interactions_lead_id ON lead_interactions(lead_id);

-- Enable Row Level Security (RLS)
ALTER TABLE lead_interactions ENABLE ROW LEVEL SECURITY;

-- Create a policy that allows all operations (for development)
CREATE POLICY "Allow all operations on lead_interactions" ON lead_interactions
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

### 3. Create a Function to Auto-Update the updated_at Column

```sql
-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_leads_updated_at
  BEFORE UPDATE ON leads
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

## Step 4: Configure n8n Workflow to Save Leads to Supabase

To automatically save leads from your n8n webhook to Supabase:

1. In your n8n workflow, after the webhook trigger, add a **Supabase** node
2. Configure it to **Insert** into the `leads` table
3. Map the webhook fields to the database columns:
   - `lead_type` ← `Lead Type`
   - `country` ← `Country`
   - `city` ← `City`
   - `number_of_results` ← `number of results`
   - `status` ← `'new'` (default value)

## Step 5: Test Your Setup

1. Make sure your `.env` file has the correct Supabase credentials
2. Restart your development server: `npm run dev`
3. Open the app at `http://localhost:3003` (or whatever port is shown)
4. Navigate to the Dashboard to see if it connects successfully

## Features of the Dashboard

### Dashboard Page (`/dashboard`)
- Real-time statistics overview
- Lead status distribution
- Recent leads table
- Weekly and monthly metrics
- Automatic updates when new leads are added

### Leads Management Page (`/leads`)
- Full leads table with search functionality
- Filter by status
- Sort by any column
- Update lead status inline
- Delete leads
- Real-time updates

### Analytics Page (`/analytics`)
- Lead status distribution pie chart
- Leads over time (14-day trend)
- Top countries bar chart
- Conversion funnel
- Response rate metrics

### New Lead Form (`/`)
- Original lead generation form
- Submits to n8n webhook
- Toast notifications for success/errors

## Troubleshooting

### "Supabase credentials are missing" Error
- Check that your `.env` file has the correct `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
- Make sure to restart the dev server after updating `.env`

### No Leads Showing Up
- Check that the `leads` table exists in Supabase
- Verify that Row Level Security policies are configured correctly
- Check the browser console for any errors
- Ensure your n8n workflow is saving data to Supabase

### Real-time Updates Not Working
- Make sure you've enabled Realtime in Supabase:
  - Go to **Database** → **Replication**
  - Enable replication for the `leads` table

## Security Note

The current RLS policies allow all operations without authentication. For production use, you should:

1. Implement proper authentication (e.g., using Supabase Auth)
2. Create more restrictive RLS policies
3. Add user management
4. Secure your API keys

## Need Help?

If you encounter any issues:
1. Check the browser console for errors
2. Check the Supabase logs in the dashboard
3. Verify your n8n workflow is running correctly
4. Make sure all environment variables are set correctly
