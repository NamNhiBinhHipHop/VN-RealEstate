# VN Real Estate Investment Calculator

A sophisticated Next.js application for analyzing real estate investments in Vietnam with **ML-powered price prediction** using LightGBM trained on 6,000+ real properties.

## 🌟 Features

### 🤖 **ML Price Prediction** (NEW!)
- **Machine Learning** powered by LightGBM (Gradient Boosted Trees)
- Trained on **6,248 real properties** from Ho Chi Minh City
- Predict prices based on bedrooms, area, and location
- **23 districts** supported in HCMC

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

## 🏙️ Supported Cities

Hanoi, Ho Chi Minh City, Da Nang, Nha Trang, Can Tho, Hai Phong, Bien Hoa, Hue, Vung Tau, Quy Nhon

## 🏢 Property Types

Apartments, Land, Shophouse, Officetel

---

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Python 3.8+ (for ML features)

### Installation

```bash
# 1. Clone the repository
git clone <your-repo-url>
cd VN-REALESTATE-main

# 2. Install Node.js dependencies
npm install

# 3. Install Python dependencies (for ML API)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements_ml.txt

# 4. Set up environment variables
cp .env.example .env
# Edit .env with your values

# 5. Set up the database
npm run db:generate
npm run db:push
npm run db:seed
```

### Running the Application

#### For Local Development:

You need **two terminal windows**:

**Terminal 1 - Next.js Frontend:**
```bash
npm run dev
# Runs at http://localhost:3000
```

**Terminal 2 - ML API Backend (Optional):**
```bash
source venv/bin/activate
python ml_api.py
# Runs at http://localhost:8000
```

**Open your browser:** http://localhost:3000

#### For Production (Vercel):

The ML API runs automatically as a Vercel serverless function!
- No separate server needed
- Deploys with your Next.js app
- Scales automatically

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
npm run db:studio    # Open Prisma Studio (GUI)

# ML API
python ml_api.py     # Start ML prediction server
```

---

## 🤖 ML Price Prediction

### How It Works

The ML model uses **LightGBM** trained on 6,248 real properties:

**Input:**
- Number of bedrooms (1-10)
- Area in square meters (20-500)
- Location (23 districts in HCMC)

**Output:**
- Predicted price (in billion VND)
- Price per square meter

### Using the ML Feature

**Option 1: Web Interface**
1. Go to http://localhost:3000/predict
2. Fill in property details
3. Click "Dự Đoán Giá"
4. Get instant prediction!

**Option 2: Direct API**
```bash
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{
    "bedrooms": 3,
    "area": 85,
    "location": "Quận 1, Hồ Chí Minh"
  }'
```

### API Endpoints

**Local Development:**
- `GET http://localhost:8000/` - Health check
- `GET http://localhost:8000/locations` - List available locations
- `POST http://localhost:8000/predict` - Predict price
- `GET http://localhost:8000/docs` - API documentation (Swagger)

**Production (Vercel):**
- `GET /api/predict` - Health check
- `GET /api/predict/locations` - List available locations
- `POST /api/predict` - Predict price (serverless function)

---

## 🗄️ Database Schema

Using **Prisma ORM** with SQLite (dev) / PostgreSQL (production):

- **User** - User accounts with authentication
- **Property** - Real estate property data
- **MarketData** - Bank interest rates
- **Scenario** - Saved investment calculations

---

## 🌐 Deployment

### Deploy to Vercel + Railway

**Frontend (Vercel):**
1. Push code to GitHub
2. Import repository to Vercel
3. Add environment variables:
   ```
   DATABASE_URL=<postgresql-url>
   JWT_SECRET=<random-string>
   ```
4. Deploy!

**ML API Backend (Railway/Render/Heroku):**
1. Create `Procfile`:
   ```
   web: uvicorn ml_api:app --host 0.0.0.0 --port $PORT
   ```
2. Deploy Python app
3. Update CORS settings with production frontend URL

### Important for Production

⚠️ **Switch from SQLite to PostgreSQL:**

Update `prisma/schema.prisma`:
```prisma
datasource db {
  provider = "postgresql"  // Change from sqlite
  url      = env("DATABASE_URL")
}
```

Then run:
```bash
npx prisma migrate deploy
npm run db:seed
```

---

## 🛠️ Tech Stack

- **Framework**: Next.js 15 (App Router, Turbopack)
- **Language**: TypeScript
- **UI**: React 19, Tailwind CSS 4
- **Database**: Prisma ORM (SQLite/PostgreSQL)
- **Authentication**: JWT + bcryptjs
- **ML Backend**: FastAPI + LightGBM
- **ML Libraries**: scikit-learn, pandas, numpy
- **Validation**: Zod
- **Charts**: Recharts
- **Icons**: Lucide React

---

## 📊 Financial Calculations

The calculator uses industry-standard formulas:

- **Monthly Loan Payment**: Amortization formula
- **ROI**: (Total Returns / Initial Investment) × 100
- **IRR**: Internal Rate of Return using Newton-Raphson method
- **Cash Flow**: Rental income - (Loan payment + Management fees)

---

## 🔐 Environment Variables

Create `.env` file:

```env
# Database
DATABASE_URL="file:./prisma/dev.db"

# JWT Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
JWT_SECRET="your-secret-key-change-this-in-production"

# Optional
NEXT_PUBLIC_API_URL=""
```

---

## 📝 Project Structure

```
VN-REALESTATE-main/
├── src/
│   ├── app/              # Next.js pages & API routes
│   │   ├── page.tsx      # Homepage
│   │   ├── auth/         # Auth pages
│   │   ├── calculator/   # ROI/IRR calculator
│   │   ├── predict/      # ML price prediction
│   │   └── api/          # API routes
│   ├── components/       # React components
│   ├── contexts/         # React contexts
│   └── lib/              # Utilities & types
├── prisma/
│   ├── schema.prisma     # Database schema
│   └── dev.db            # SQLite database
├── Data/
│   └── merged_properties.csv  # ML training data (6,248 properties)
├── ml_api.py            # FastAPI ML server
├── requirements_ml.txt  # Python dependencies
└── .env.example         # Environment template
```

---

## 🧪 Testing

```bash
# Test Next.js
npm run dev

# Test ML API
curl http://localhost:8000/
curl http://localhost:8000/locations

# Test prediction
curl -X POST http://localhost:8000/predict \
  -H "Content-Type: application/json" \
  -d '{"bedrooms": 3, "area": 85, "location": "Quận 1, Hồ Chí Minh"}'
```

---

## 🐛 Troubleshooting

### ML API won't start
**Issue**: `ModuleNotFoundError`
**Solution**: 
```bash
pip install -r requirements_ml.txt
```

### Frontend can't connect to ML API
**Issue**: "ML API Không Khả Dụng"
**Solution**: 
1. Ensure ML API is running: `python ml_api.py`
2. Check CORS settings in `ml_api.py`
3. Verify port 8000 is not in use

### Database errors
**Issue**: Prisma errors
**Solution**:
```bash
npm run db:generate
npm run db:push
```

---

## 📈 Future Enhancements

- [ ] Add more cities (Hanoi, Da Nang)
- [ ] Include property features (furnished, parking)
- [ ] Model versioning & A/B testing
- [ ] Prediction confidence intervals
- [ ] Admin dashboard for model monitoring
- [ ] Real-time market data integration

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

---

## 📧 Support

For issues and questions, please open an issue on GitHub.

---

## 📄 License

This project is open source and available under the MIT License.

---

**Made with ❤️ for Vietnamese real estate investors**

🤖 Powered by LightGBM | 🚀 Built with Next.js | 💜 Designed with Tailwind CSS
