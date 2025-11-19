# VN Real Estate Investment Calculator

A sophisticated Next.js application for analyzing real estate investments in Vietnam with **LightGBM-powered price prediction** trained on 6,000+ verified Ho Chi Minh City properties.

## 🌟 Features

### 🤖 **LightGBM Price Prediction**
- Gradient Boosting model trained on **6,246** verified transactions
- Predicts price by bedrooms, floor area, and district in HCMC
- Returns formatted total price + price per m²
- Ships as JSON artifacts (`api/model.json`, `api/encoders.json`) so Vercel only needs Next.js

### 🗺️ **District Price Map**
- Interactive Mapbox GL choropleth for Hồ Chí Minh City (`/map`)
- Builds polygons per district/huyện from `public/data/hcmc_districts.geojson`
- Colors driven by aggregated stats from `/api/district-stats`
- Hover tooltips + legend + “Reset view” button + filter controls
- Requires `NEXT_PUBLIC_MAPBOX_TOKEN`

### 💰 **Investment Calculator**
- Calculate ROI, IRR, and monthly cash flow
- Multi-scenario analysis (pessimistic, base, optimistic)
- Real market data for Vietnamese cities
- Automatic risk alerts

### 📊 **Additional Features**
- User authentication (JWT-based)
- Scenario management (save & compare)
- Real bank interest rates
- Beautiful responsive UI with Tailwind CSS

---

## 🚀 Quick Start

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/NamNhiBinhHipHop/VN-RealEstate.git
cd VN-RealEstate

# 2. Install dependencies
npm install

# 3. Set up environment
cp .env.example .env

# 4. Set up database
npm run db:generate
npm run db:push
npm run db:seed

# 5. Run dev server
npm run dev
```

**Open:** http://localhost:3000

---

## 🤖 LightGBM Price Estimation

### How it works

1. Run `python train_model.py` (or reuse the committed artifacts) against `Data/merged_properties.csv`.
2. The script outputs:
   - `api/model.json`: the full forest for the Next.js runtime
   - `api/encoders.json`: lookup tables for locations/districts
   - `api/model.txt`, `api/encoders.pkl`, `api/metadata.json` (reference/original LightGBM files)
3. `/api/predict` loads those JSON files, rebuilds the feature vector, and walks all 140 trees per request.

**Inputs:**
- Bedrooms (1-10)
- Floor area (m²)
- District/huyện (23+ supported)

**Prediction pipeline:**
1. Encode district + location exactly like the training job
2. Compute `bedroom_density = bedrooms / area`
3. Build `[bedrooms, area, location_encoded, district_encoded, bedroom_density]`
4. Sum every tree’s contribution (Gradient Boosting Decision Tree)

**Outputs:**
- Total price (billions of VND)
- Price per square meter
- Metadata: `method: "LightGBM gradient boosting (pre-trained)"`

### Re-training (optional)

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements_ml.txt
python train_model.py
```

The script overwrites artifacts inside `api/`. Commit them before deploying to Vercel.

### Supported Locations

**23 Districts in Ho Chi Minh City:**
- Quận 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12
- Quận Bình Thạnh, Bình Tân, Gò Vấp, Phú Nhuận, Tân Bình, Tân Phú
- Huyện Bình Chánh, Củ Chi, Hóc Môn, Nhà Bè

---

## 🗺️ District Choropleth Map

1. GeoJSON boundaries live at `public/data/hcmc_districts.geojson`. They can be replaced with more detailed shapes if needed.
2. Aggregated stats (avg. price + listing count) are stored in `data/district_stats.json` and served via `/api/district-stats`.
3. The `HCMCChoropleth` component (`src/components/maps/HCMCChoropleth.tsx`) is client-only, powered by Mapbox GL JS, and accepts `{ district, avgPrice, count }[]`.
4. `/map` renders the map + filter controls; it automatically updates fill colors when filters change.
5. Remember to set `NEXT_PUBLIC_MAPBOX_TOKEN` in `.env` or the Vercel dashboard.

---

## 📦 Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run start        # Start production server
npm run lint         # Run ESLint

# Database
npm run db:generate  # Generate Prisma client
npm run db:push      # Push schema to database
npm run db:seed      # Seed with sample data
npm run db:studio    # Open Prisma Studio GUI
```

---

## 🌐 Deploy to Vercel

### One-Click Deploy

1. **Push to GitHub** ✅ (Already done!)
   
2. **Import to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Click "Add New Project"
   - Import: `NamNhiBinhHipHop/VN-RealEstate`

3. **Environment Variables**
   ```
   DATABASE_URL=file:./prisma/dev.db
   JWT_SECRET=<generate-32-char-random>
   NEXT_PUBLIC_MAPBOX_TOKEN=<your-public-mapbox-token>
   NEXT_PUBLIC_ML_API_URL=<optional-external-endpoint>
   ```
   
   Generate JWT:
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

4. **Build Command**
   ```
   npm run db:generate && npm run build
   ```

5. **Deploy!** 🚀

### Everything Works on Vercel!

✅ Homepage & UI
✅ Authentication
✅ ROI/IRR Calculator
✅ **LightGBM Price Prediction** (pure TypeScript runtime!)
✅ Database
✅ All API routes

**No Python deployment needed at runtime!** Mô hình LightGBM đã được convert sang JSON và chạy trực tiếp trong API route.

---

## 🗄️ Database Schema

Using **Prisma ORM** with 4 models:

- **User**: Authentication
- **Property**: Real estate data (prices, yields, fees)
- **MarketData**: Bank interest rates
- **Scenario**: Saved calculations

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register user
- `POST /api/auth/login` - Login user

### Prediction (LightGBM)
- `GET /api/predict` - Health check
- `GET /api/predict?locations=true` - List locations
- `POST /api/predict` - LightGBM price prediction
- `GET /api/district-stats` - Aggregated district pricing for the choropleth map

### Market Data
- `GET /api/market/[city]` - Get property data

### Investment Calculator
- `POST /api/calc/investment` - Calculate ROI/IRR

### Scenarios (Protected)
- `POST /api/scenario/save` - Save scenario
- `GET /api/scenario/list` - List scenarios
- `POST /api/scenario/compare` - Compare scenarios

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Auth**: JWT + bcryptjs
- **AI**: LightGBM (pre-trained, JSON runtime)
- **Validation**: Zod
- **Charts**: Recharts

---

## 📊 Project Structure

```
VN-RealEstate/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Homepage
│   │   ├── auth/                 # Auth pages
│   │   ├── calculator/           # ROI/IRR calculator
│   │   ├── predict/              # LightGBM price prediction UI
│   │   └── api/
│   │       ├── auth/             # Auth endpoints
│   │       ├── calc/             # Calculator endpoints
│   │       ├── predict/          # LightGBM inference endpoint ⭐
│   │       ├── market/           # Market data
│   │       └── scenario/         # Scenario management
│   ├── components/               # React components
│   ├── contexts/                 # React contexts
│   └── lib/                      # Utilities & types
├── prisma/
│   ├── schema.prisma             # Database schema
│   └── dev.db                    # SQLite database
├── Data/
│   └── merged_properties.csv     # Training data (6,246 properties)
├── api/
│   ├── model.json                # Exported tree structures (used by API)
│   ├── encoders.json             # Location/district mappings
│   ├── model.txt / encoders.pkl  # Original LightGBM artifacts (optional)
│   └── metadata.json             # Training metadata
└── .env.example                  # Environment template
```

---

## 🎯 Why This Solution is Better

### **Old Approach** (Before):
- ❌ Python serverless function vượt quá 250MB
- ❌ Người dùng phải tự chạy FastAPI để dự đoán
- ❌ Khó debug, phụ thuộc runtime Python khi deploy

### **Current Approach** (Now):
- ✅ LightGBM vẫn giữ nguyên độ chính xác, nhưng toàn bộ tree được convert sang JSON
- ✅ Next.js API route tự duyệt 140 cây → không cần Python
- ✅ Commits chỉ cần kèm các file trong thư mục `api/`
- ✅ Người dùng cuối không phải huấn luyện hoặc cài ML

**Độ tin cậy dữ liệu & mô hình:**
- ✅ 6,246 bất động sản thật tại TP.HCM
- ✅ 23+ quận/huyện
- ✅ 5 đặc trưng: phòng ngủ, diện tích, location/district encoded, bedroom density
- ✅ Gradient Boosting với 140 cây, LR 0.02, regularization đầy đủ

---

## 🧪 Testing

```bash
# Test API
curl http://localhost:3000/api/predict

# Get locations
curl 'http://localhost:3000/api/predict?locations=true'

# Predict price
curl -X POST http://localhost:3000/api/predict \
  -H "Content-Type: application/json" \
  -d '{
    "bedrooms": 3,
    "area": 85,
    "location": "Quận 1, Hồ Chí Minh"
  }'
```

---

## 📈 For Production

### Using PostgreSQL (Recommended)

Update `prisma/schema.prisma`:

```prisma
datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}
```

Then:
1. Add Vercel Postgres
2. Update DATABASE_URL
3. Run: `npx prisma migrate deploy`
4. Seed: `npm run db:seed`

---

## 🎊 Ready to Deploy!

**Your repository**: https://github.com/NamNhiBinhHipHop/VN-RealEstate

**Deploy now:**
1. Go to [vercel.com](https://vercel.com)
2. Import repository
3. Add environment variables
4. Deploy!

**Everything works out of the box!** 🚀

---

## 🤝 Contributing

Contributions welcome! Submit a PR.

## 📄 License

MIT License - Open source

---

**Made with ❤️ for Vietnamese real estate investors**

🤖 LightGBM AI | 🚀 Built with Next.js | 💜 Optimized for Vercel
