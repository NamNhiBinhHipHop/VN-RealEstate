# 🚀 Deployment Guide

## Step 1: Push to GitHub

Your code is ready! Push it with:

```bash
cd /Users/binh/Downloads/VN-REALESTATE-main
git push -u origin main
```

**If you need authentication:**
```bash
# You may need to enter your GitHub username and personal access token
# Get token from: https://github.com/settings/tokens
```

---

## Step 2: Deploy Frontend to Vercel

### Via Vercel Dashboard (Easiest)

1. **Go to [vercel.com](https://vercel.com)** and sign in

2. **Click "Add New Project"**

3. **Import Your Repository**
   - Select: `NamNhiBinhHipHop/VN-RealEstate`
   - Click "Import"

4. **Configure Project**
   - Framework: `Next.js` (auto-detected)
   - Root Directory: `./`
   - Build Command: `npm run build`

5. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=<generate-secure-random-string>
   ```
   
   **Generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

6. **Build Settings (Important!)**
   
   Add this to "Install Command":
   ```
   npm install && npx prisma generate && npx prisma db push
   ```

7. **Deploy!**
   - Click "Deploy"
   - Wait for build to complete
   - Your app will be live!

---

## Step 3: Seed Database (After First Deploy)

After your first deployment, run this locally to seed production DB:

```bash
# Set your Vercel URL
export DATABASE_URL="<your-vercel-postgres-url>"

# Or keep SQLite for now
npm run db:seed
```

---

## ⚠️ Important Notes for Vercel

### What Will Work:
✅ Next.js frontend
✅ All pages and UI
✅ ROI/IRR Calculator
✅ User authentication
✅ Database (with SQLite or Postgres)

### What Won't Work:
❌ **ML Price Prediction** - Python ML API won't run on Vercel

### To Make ML Work in Production:

You need to deploy the ML API separately:

**Option 1: Railway (Free tier)**
1. Go to [railway.app](https://railway.app)
2. Create new project
3. Deploy from GitHub (select your repo)
4. Set root directory to `/`
5. Add `Procfile`:
   ```
   web: uvicorn ml_api:app --host 0.0.0.0 --port $PORT
   ```
6. Add environment variables (if needed)
7. Deploy!

**Option 2: Render (Free tier)**
1. Go to [render.com](https://render.com)
2. New → Web Service
3. Connect GitHub repo
4. Build Command: `pip install -r requirements_ml.txt`
5. Start Command: `uvicorn ml_api:app --host 0.0.0.0 --port $PORT`
6. Deploy!

**Then update your Next.js environment:**
```
NEXT_PUBLIC_ML_API_URL=https://your-ml-api.railway.app
```

And update CORS in `ml_api.py`:
```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-vercel-app.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Production Database (Recommended)

For production, switch from SQLite to PostgreSQL:

### Using Vercel Postgres:

1. In Vercel dashboard → Storage → Create Database → Postgres
2. Copy connection string
3. Update `prisma/schema.prisma`:
   ```prisma
   datasource db {
     provider = "postgresql"
     url      = env("DATABASE_URL")
   }
   ```
4. Run migrations:
   ```bash
   npx prisma migrate dev --name init
   npx prisma db push
   npm run db:seed
   ```

---

## Testing Your Deployment

After deployment:

1. ✅ Visit your Vercel URL
2. ✅ Test homepage
3. ✅ Register a user
4. ✅ Test calculator (`/calculator`)
5. ✅ Test auth flow
6. ⚠️ ML predictions won't work until you deploy ML API separately

---

## Quick Checklist

**Before pushing to GitHub:**
- [x] Code committed
- [x] .gitignore updated
- [x] .env.example created
- [x] README.md complete

**For Vercel deployment:**
- [ ] Push code to GitHub
- [ ] Import to Vercel
- [ ] Add environment variables
- [ ] Configure build commands
- [ ] Deploy!

**For ML in production (optional):**
- [ ] Deploy ML API to Railway/Render
- [ ] Update CORS settings
- [ ] Set NEXT_PUBLIC_ML_API_URL

---

## Need Help?

- Vercel Docs: https://vercel.com/docs
- Railway Docs: https://docs.railway.app
- Render Docs: https://render.com/docs

