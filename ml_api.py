#!/usr/bin/env python3
"""
FastAPI server for Real Estate Price Prediction
Provides REST API endpoints for the ML model
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import numpy as np
import uvicorn
import pickle
import os
from typing import List, Optional

app = FastAPI(title="VN Real Estate Price Predictor")

# Enable CORS for Next.js (local + production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000", 
        "http://127.0.0.1:3000",
        "https://*.vercel.app",  # Allow all Vercel deployments
        "*"  # Allow all origins (remove in production if needed)
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global variables for model and encoders
model = None
le_location = None
le_district = None
feature_columns = None
available_locations = []

class PredictionRequest(BaseModel):
    bedrooms: int
    area: float
    location: str

class PredictionResponse(BaseModel):
    predicted_price: float
    price_per_sqm: float
    bedrooms: int
    area: float
    location: str

class LocationsResponse(BaseModel):
    locations: List[str]

def load_and_train_model():
    """Load data and train the model on startup"""
    global model, le_location, le_district, feature_columns, available_locations
    
    print("Loading and training model...")
    
    # Load data
    df = pd.read_csv("Data/merged_properties.csv")
    
    # Preprocess
    df_processed = df.copy()
    df_processed = df_processed.dropna()
    
    # Extract district
    district_extract = df_processed['location'].str.extract(r'Quận (\d+|[^,]+)|Huyện ([^,]+)')
    df_processed['district'] = district_extract[0].fillna(district_extract[1]).fillna('Other')
    
    # Create features
    df_processed['bedroom_density'] = df_processed['bedrooms'] / df_processed['area']
    
    # Encode categorical variables
    le_location = LabelEncoder()
    le_district = LabelEncoder()
    
    df_processed['location_encoded'] = le_location.fit_transform(df_processed['location'])
    df_processed['district_encoded'] = le_district.fit_transform(df_processed['district'])
    
    # Store available locations
    available_locations = sorted(le_location.classes_.tolist())
    
    # Create features and target
    feature_columns = ['bedrooms', 'area', 'location_encoded', 'district_encoded', 
                      'bedroom_density']
    
    X = df_processed[feature_columns]
    y = df_processed['price']
    
    # Split data
    district_labels = X['district_encoded']
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=district_labels
    )
    
    # Train model
    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)
    
    params = {
        "objective": "regression",
        "metric": ["mae", "rmse"],
        "boosting_type": "gbdt",
        "learning_rate": 0.03,
        "num_leaves": 63,
        "max_depth": 8,
        "feature_fraction": 0.9,
        "bagging_fraction": 0.8,
        "bagging_freq": 3,
        "verbose": -1,
        "random_state": 42
    }
    
    model = lgb.train(
        params,
        train_data,
        valid_sets=[train_data, val_data],
        num_boost_round=1000,
        callbacks=[lgb.early_stopping(100), lgb.log_evaluation(0)]
    )
    
    print(f"Model trained successfully!")
    print(f"Available locations: {len(available_locations)}")

@app.on_event("startup")
async def startup_event():
    """Load and train model when server starts"""
    load_and_train_model()

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "online",
        "message": "VN Real Estate Price Predictor API",
        "version": "1.0.0"
    }

@app.get("/locations", response_model=LocationsResponse)
async def get_locations():
    """Get list of available locations"""
    return LocationsResponse(locations=available_locations)

@app.post("/predict", response_model=PredictionResponse)
async def predict_price(request: PredictionRequest):
    """Predict real estate price based on input features"""
    
    if model is None:
        raise HTTPException(status_code=500, detail="Model not loaded")
    
    try:
        bedrooms = request.bedrooms
        area = request.area
        location = request.location
        
        # Extract district from location
        district = location.split(',')[0].strip()
        if district.startswith('Quận '):
            district = district.replace('Quận ', '')
        elif district.startswith('Huyện '):
            district = district.replace('Huyện ', '')
        
        # Encode location and district
        try:
            location_encoded = le_location.transform([location])[0]
            district_encoded = le_district.transform([district])[0]
        except ValueError:
            # Try to find a similar location
            similar_location = None
            for loc in available_locations:
                if district in loc:
                    similar_location = loc
                    break
            
            if similar_location:
                location = similar_location
                location_encoded = le_location.transform([similar_location])[0]
                similar_district = similar_location.split(',')[0].strip()
                if similar_district.startswith('Quận '):
                    similar_district = similar_district.replace('Quận ', '')
                elif similar_district.startswith('Huyện '):
                    similar_district = similar_district.replace('Huyện ', '')
                district_encoded = le_district.transform([similar_district])[0]
            else:
                raise HTTPException(
                    status_code=400,
                    detail=f"Location '{location}' not found. Please use /locations endpoint to see available locations."
                )
        
        # Create feature vector
        bedroom_density = bedrooms / area
        features = np.array([[bedrooms, area, location_encoded, district_encoded, 
                            bedroom_density]])
        
        # Make prediction
        predicted_price = float(model.predict(features)[0])
        price_per_sqm = predicted_price / area
        
        return PredictionResponse(
            predicted_price=predicted_price,
            price_per_sqm=price_per_sqm,
            bedrooms=bedrooms,
            area=area,
            location=location
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    print("Starting VN Real Estate Price Predictor API...")
    print("API will be available at: http://localhost:8000")
    print("Documentation at: http://localhost:8000/docs")
    uvicorn.run(app, host="0.0.0.0", port=8000, log_level="info")

