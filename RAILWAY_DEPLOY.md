# 🚀 Complete Deployment Guide

## Quick Summary

**Deploy to 2 services (both FREE):**
1. **Railway** - Python ML API (backend)
2. **Vercel** - Next.js App (frontend)

**Total time: ~10 minutes**  
**Total cost: $0** 🎉

---

# 🚂 Step 1: Deploy ML API to Railway (FREE)

## Why Railway?

- ✅ **FREE tier** (500 hours/month)
- ✅ **Supports Python** perfectly
- ✅ **No size limits** like Vercel
- ✅ **Easy deployment** from GitHub
- ✅ **Automatic HTTPS**

---

---

# 📝 Step 0: Push to GitHub

### Push Code to GitHub

**First time setup:**

```bash
cd /Users/binh/Downloads/VN-REALESTATE-main
git push -u origin main
```

**You'll need:**
- Username: `NamNhiBinhHipHop`
- Password: **Personal Access Token** from https://github.com/settings/tokens
  - Create token with `repo` scope
  - Use token as password

---

# 🚂 Step 1: Deploy ML API to Railway

## Deploy to Railway

1. **Go to [railway.app](https://railway.app)**
   - Sign up/Login with GitHub

2. **Create New Project**
   - Click "New Project"
   - Select "Deploy from GitHub repo"
   - Choose: `NamNhiBinhHipHop/VN-RealEstate`

3. **Railway Auto-Detects Everything!**
   - Detects Python app automatically
   - Uses `Procfile` we created
   - Installs from `requirements_ml.txt`
   - No configuration needed!

4. **Wait for Deployment**
   - Takes ~2-3 minutes
   - Railway will build and deploy

5. **Get Your URL**
   - After deployment, click on your service
   - Go to "Settings" → "Networking"
   - Copy the public URL (e.g., `https://your-app.up.railway.app`)

---

# ☁️ Step 2: Deploy Frontend to Vercel

## Deploy to Vercel

1. **Go to [vercel.com](https://vercel.com)**
   - Sign in with GitHub

2. **Import Repository**
   - Click "Add New Project"
   - Select: `NamNhiBinhHipHop/VN-RealEstate`
   - Click "Import"

3. **Add Environment Variables**
   
   Click "Environment Variables" and add:
   
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=<your-secret-32-chars>
   NEXT_PUBLIC_ML_API_URL=<your-railway-url>
   ```
   
   **Generate JWT_SECRET:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   
   **ML API URL Example:**
   ```
   NEXT_PUBLIC_ML_API_URL=https://vn-realestate-production.up.railway.app
   ```

4. **Configure Build**
   
   Install Command:
   ```
   npm install && npx prisma generate && npx prisma db push
   ```

5. **Deploy!**
   - Click "Deploy"
   - Wait for build
   - Your app is live! 🎉

---

## 🧪 Test Your Deployment

### Test Railway ML API:

```bash
# Health check
curl https://your-app.up.railway.app/

# Get locations
curl https://your-app.up.railway.app/locations

# Make prediction
curl -X POST https://your-app.up.railway.app/predict \
  -H "Content-Type: application/json" \
  -d '{
    "bedrooms": 3,
    "area": 85,
    "location": "Quận 1, Hồ Chí Minh"
  }'
```

### Test Vercel Frontend:

1. Visit your Vercel URL
2. Go to `/predict`
3. Should connect to Railway ML API automatically!
4. Make a prediction - it works! 🎊

---

## 💰 Cost Breakdown

### FREE Tier Limits:

**Railway:**
- 500 hours/month FREE
- ~$0 for your ML API (well within free tier)
- Unlimited requests

**Vercel:**
- 100 GB bandwidth/month FREE
- Unlimited requests
- ~$0 for your Next.js app

**Total Cost: $0** 🎉

---

## 🔧 Configuration Files

We created these for you:

### `Procfile`
```
web: uvicorn ml_api:app --host 0.0.0.0 --port $PORT
```
Tells Railway how to start your Python app.

### `railway.json`
```json
{
  "build": { "builder": "NIXPACKS" },
  "deploy": {
    "startCommand": "uvicorn ml_api:app --host 0.0.0.0 --port $PORT"
  }
}
```
Railway configuration for Python deployment.

### `requirements_ml.txt`
Python dependencies for Railway to install.

---

## 📊 Architecture

```
User Browser
     ↓
Vercel (Next.js Frontend)
     ↓
Railway (Python ML API)
     ↓
LightGBM Model → Price Prediction
```

**Local Development:**
```
localhost:3000 (Next.js) → localhost:8000 (Python)
```

**Production:**
```
vercel.app (Next.js) → railway.app (Python)
```

---

## 🎯 Quick Deployment Summary

```bash
# 1. Push to GitHub
git push -u origin main

# 2. Deploy ML API to Railway
# → Go to railway.app
# → New Project → GitHub repo
# → Auto-deploys!
# → Copy Railway URL

# 3. Deploy Frontend to Vercel
# → Go to vercel.com
# → Import GitHub repo
# → Add env vars (including NEXT_PUBLIC_ML_API_URL)
# → Deploy!

# 4. Done! Both work together! 🎉
```

---

## 🐛 Troubleshooting

### Railway deployment fails

**Check:**
- `requirements_ml.txt` exists
- `Procfile` exists
- Python version compatible (3.8+)

**Solution:** Railway logs will show the issue

### CORS errors on production

**Fix:** Already configured in `ml_api.py`:
```python
allow_origins=["*"]  # Allows all origins
```

For stricter security, replace `"*"` with your Vercel URL:
```python
allow_origins=["https://your-app.vercel.app"]
```

### ML predictions slow on first request

**Normal!** 
- First request trains the model (~10 seconds)
- Model is cached after that
- Subsequent requests are fast (<1 second)

---

## ✅ Checklist

**Before deploying:**
- [x] Code pushed to GitHub
- [ ] Railway account created
- [ ] ML API deployed to Railway
- [ ] Railway URL copied
- [ ] Vercel account created
- [ ] Environment variables set
- [ ] Next.js deployed to Vercel

**After deploying:**
- [ ] Test homepage
- [ ] Test authentication
- [ ] Test calculator
- [ ] Test ML predictions (most important!)
- [ ] Verify Railway logs
- [ ] Check Vercel logs

---

## 🎉 Result

After following these steps:

✅ **Next.js on Vercel** (frontend)
✅ **Python ML API on Railway** (backend)
✅ **ML predictions work in production**
✅ **Everything FREE!**
✅ **Automatic scaling**
✅ **HTTPS everywhere**

---

**Your VN Real Estate Calculator is now production-ready with ML predictions! 🚀**

