# 🚀 Deploy Your Lead Gen Dashboard to Vercel (FREE & ONLINE 24/7)

## Step 1: Create GitHub Repository

1. Go to [https://github.com/new](https://github.com/new)
2. Name it: `leadgen-dashboard` (or any name you want)
3. Set to **Public** or **Private** (your choice)
4. **DO NOT** initialize with README or .gitignore (we already have them)
5. Click "Create repository"

## Step 2: Push Your Code to GitHub

After creating the repo, GitHub will show you commands. Run these in your terminal:

```bash
git remote add origin https://github.com/YOUR_USERNAME/leadgen-dashboard.git
git branch -M main
git push -u origin main
```

Replace `YOUR_USERNAME` with your actual GitHub username.

## Step 3: Deploy to Vercel (FREE!)

1. Go to [https://vercel.com](https://vercel.com)
2. Click "Sign Up" and choose **"Continue with GitHub"**
3. After signing in, click **"Add New"** → **"Project"**
4. Import your `leadgen-dashboard` repository
5. Vercel will auto-detect it's a Vite app
6. Click **"Deploy"**

## Step 4: Add Environment Variables

After deployment starts, go to your project settings:

1. Click on your project
2. Go to **Settings** → **Environment Variables**
3. Add these variables:

   - `VITE_SUPABASE_URL` = your Supabase URL
   - `VITE_SUPABASE_ANON_KEY` = your Supabase anon key
   - `VITE_N8N_SEND_EMAIL_WEBHOOK` = your n8n webhook URL

4. Click **"Redeploy"** to apply the environment variables

## Done! 🎉

Your app will be live at: `https://your-project-name.vercel.app`

It will:
- ✅ Be online 24/7 for FREE
- ✅ Auto-deploy when you push to GitHub
- ✅ Have SSL (HTTPS) automatically
- ✅ Be super fast with global CDN

### Update Your App Later

Just push to GitHub:
```bash
git add .
git commit -m "your update message"
git push
```

Vercel will automatically rebuild and deploy! 🚀
