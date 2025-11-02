# VN Real Estate Investment Calculator

A sophisticated Next.js application for analyzing real estate investments in Vietnam with **ML-powered price prediction** using LightGBM trained on 6,000+ real properties.

## 🌟 Features

### 🤖 **ML Price Prediction** (NEW!)
- **Machine Learning** powered by LightGBM (Gradient Boosted Trees)
- **Pre-trained** on **6,246 real properties** from Ho Chi Minh City
- Predict prices based on bedrooms, area, and location
- **23 districts** supported in HCMC
- **Optimized for Vercel** - serverless deployment ready!

### 💰 **Investment Calculator**
- Calculate ROI, IRR, and monthly cash flow
- Multi-scenario analysis (pessimistic, base, optimistic)
- Real market data for Vietnamese cities
- Automatic risk alerts

### 📊 **Additional Features**
- User authentication (JWT-based)
- Scenario management (save & compare)
- Real bank interest rates
- Responsive design with Tailwind CSS

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for local ML development)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NamNhiBinhHipHop/VN-RealEstate.git
cd VN-RealEstate

# 2. Install Node.js dependencies
npm install

# 3. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 4. Set up the database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Run the development server
npm run dev
```

**Open your browser:** http://localhost:3000

---

## 🤖 ML Model Architecture

### How It Works

**Training (Local - One Time):**
```bash
# Install training dependencies
pip install -r requirements_ml.txt

# Train and save model
python train_model.py
```

This creates:
- `api/model.txt` - Pre-trained LightGBM model (319KB)
- `api/encoders.pkl` - Label encoders (1.3KB)
- `api/metadata.json` - Model info (1KB)

**Inference (Production - Vercel):**
- Serverless function loads pre-trained model
- No training needed (instant startup!)
- Only requires: `lightgbm` + `numpy` (~50MB total)
- Well under Vercel's 250MB limit

### Model Performance

- **Training Data**: 6,246 properties
- **Algorithm**: LightGBM (79 iterations)
- **MAE**: 9.0 billion VND
- **RMSE**: 22.8 billion VND
- **Features**: bedrooms, area, location, district, bedroom_density

---

## 📦 Available Scripts

```bash
# Next.js
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed database

# ML (Local Development)
python ml_api.py     # Start FastAPI server (localhost:8000)
python train_model.py # Re-train model with new data
```

---

## 🌐 Deployment to Vercel

### Simple One-Click Deploy

1. **Push to GitHub** (already done!)
   ```bash
   git push -u origin main
   ```

2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import `NamNhiBinhHipHop/VN-RealEstate`

3. **Add Environment Variables**
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=<your-secret-32-char-string>
   ```

4. **Build Command** (Important!)
   ```
   npm run db:generate && npm run build
   ```

5. **Deploy!** 🚀

### Everything Works on Vercel!

✅ Next.js Frontend
✅ All Pages & UI
✅ Authentication
✅ ROI/IRR Calculator
✅ **ML Price Prediction** (optimized serverless!)
✅ Database
✅ All APIs

**No separate ML deployment needed!** The Python ML function runs as a Vercel serverless function.

---

## 🔧 How ML Works on Vercel

### Architecture

```
User Request → Vercel Serverless Function → Load Pre-trained Model → Predict → Return JSON
                     ↓
                api/predict.py (6KB)
                     ↓
          Loads: model.txt (319KB)
                 encoders.pkl (1.3KB)
                     ↓
              Quick Prediction!
```

### Why It's Fast

- **Pre-trained model** - No training on each request
- **Cached in memory** - Model loads once per function instance
- **Minimal dependencies** - Only `lightgbm` + `numpy`
- **Small model files** - 320KB total
- **Total package** - ~50MB (well under 250MB limit!)

---

## 🗄️ Database Schema

Using **Prisma ORM**:

- **User**: User accounts with authentication
- **Property**: Real estate property data (prices, yields, fees)
- **MarketData**: Bank interest rates and loan terms
- **Scenario**: Saved investment calculations

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### Market Data
- `GET /api/market/[city]` - Get property and market data

### Investment Calculation
- `POST /api/calc/investment` - Calculate investment returns

### ML Prediction (Serverless)
- `GET /api/predict` - Health check
- `GET /api/predict/locations` - List 23 available locations
- `POST /api/predict` - Predict price

### Scenario Management (Protected)
- `POST /api/scenario/save` - Save investment scenario
- `GET /api/scenario/list` - List user's scenarios
- `POST /api/scenario/compare` - Compare multiple scenarios

---

## 🛠️ Tech Stack

**Frontend:**
- Next.js 15 (App Router, Turbopack)
- React 19
- TypeScript
- Tailwind CSS 4

**Backend:**
- Prisma ORM
- SQLite (dev) / PostgreSQL (production)
- JWT Authentication

**ML:**
- LightGBM (Gradient Boosted Trees)
- NumPy
- Pre-trained on 6,246 properties
- Vercel Python serverless runtime

---

## 📊 ML Model Details

### Training Process

```bash
# Run this locally to re-train (optional)
pip install -r requirements_ml.txt
python train_model.py
```

This trains LightGBM on your data and saves:
- Trained model
- Label encoders
- Metadata

### Model Features

**Input:**
1. Number of bedrooms (1-10)
2. Area in m² (20-500)
3. Location (23 HCMC districts)
4. District (extracted from location)
5. Bedroom density (bedrooms/area)

**Output:**
- Predicted price (billion VND)
- Price per square meter

### Supported Locations

All 23 districts in Ho Chi Minh City including:
- Quận 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- Quận Bình Thạnh, Bình Tân, Gò Vấp, Phú Nhuận, Tân Bình, Tân Phú
- Huyện Bình Chánh, Củ Chi, Hóc Môn, Nhà Bè

---

## 🎯 Production Deployment

### For PostgreSQL (Recommended)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"  // Change from sqlite
  url      = env("DATABASE_URL")
}
```

Then in Vercel:
1. Add Vercel Postgres storage
2. Update DATABASE_URL environment variable
3. Run migrations: `npx prisma migrate deploy`
4. Seed: `npm run db:seed`

---

## 📈 Package Size Optimization

**Before Optimization:**
- Dependencies: pandas, scikit-learn, lightgbm, numpy
- Training on every request
- Size: >250MB ❌ (Vercel limit exceeded)

**After Optimization:**
- Dependencies: lightgbm, numpy ONLY
- Pre-trained model loaded from files
- Size: ~50MB ✅ (5x smaller!)

**Model files included in repo:**
- `api/model.txt` - 319KB (LightGBM model)
- `api/encoders.pkl` - 1.3KB (label encoders)
- `api/metadata.json` - 1KB (model info)

Total: **~320KB** of model files!

---

## 🧪 Testing

```bash
# Test locally
npm run dev

# Test ML API locally (optional)
python ml_api.py  # Runs on localhost:8000

# Test API endpoint
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "bedrooms": 3,
    "area": 85,
    "location": "Quận 1, Hồ Chí Minh"
  }'
```

---

## 🏗️ Project Structure

```
VN-REALESTATE-main/
├── api/
│   ├── predict.py          # Vercel serverless function (6KB)
│   ├── model.txt           # Pre-trained LightGBM (319KB)
│   ├── encoders.pkl        # Label encoders (1.3KB)
│   └── metadata.json       # Model info (1KB)
├── src/
│   ├── app/                # Next.js pages & API routes
│   ├── components/         # React components
│   ├── contexts/           # React contexts
│   └── lib/                # Utilities & types
├── Data/
│   └── merged_properties.csv  # Training data (6,246 properties)
├── prisma/
│   ├── schema.prisma       # Database schema
│   └── dev.db              # SQLite database
├── train_model.py          # Model training script (run locally)
├── ml_api.py               # FastAPI server (local dev only)
├── requirements.txt        # Vercel Python deps (minimal!)
└── requirements_ml.txt     # Local dev deps (full)
```

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for Vietnamese real estate investors**

🤖 Powered by LightGBM | 🚀 Built with Next.js | 💜 Optimized for Vercel
