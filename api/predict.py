"""
Vercel Serverless Function for ML Price Prediction
This file will be deployed as a Vercel Python serverless function
"""

import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import numpy as np
import json
import os
from http.server import BaseHTTPRequestHandler
import pickle
from pathlib import Path

# Cache directory for the model
CACHE_DIR = "/tmp/ml_cache"
MODEL_PATH = f"{CACHE_DIR}/model.pkl"
ENCODERS_PATH = f"{CACHE_DIR}/encoders.pkl"

def get_or_train_model():
    """Load cached model or train new one"""
    
    # Check if model is cached
    if os.path.exists(MODEL_PATH) and os.path.exists(ENCODERS_PATH):
        try:
            with open(MODEL_PATH, 'rb') as f:
                model = pickle.load(f)
            with open(ENCODERS_PATH, 'rb') as f:
                encoders = pickle.load(f)
            return model, encoders['le_location'], encoders['le_district'], encoders['available_locations']
        except:
            pass
    
    # Train new model
    print("Training model...")
    
    # Load data
    data_path = "Data/merged_properties.csv"
    if not os.path.exists(data_path):
        # Try alternative path for Vercel
        data_path = "/var/task/Data/merged_properties.csv"
    
    df = pd.read_csv(data_path)
    df = df.dropna()
    
    # Extract district
    district_extract = df['location'].str.extract(r'Quận (\d+|[^,]+)|Huyện ([^,]+)')
    df['district'] = district_extract[0].fillna(district_extract[1]).fillna('Other')
    
    # Create features
    df['bedroom_density'] = df['bedrooms'] / df['area']
    
    # Encode categorical variables
    le_location = LabelEncoder()
    le_district = LabelEncoder()
    
    df['location_encoded'] = le_location.fit_transform(df['location'])
    df['district_encoded'] = le_district.fit_transform(df['district'])
    
    available_locations = sorted(le_location.classes_.tolist())
    
    # Create features and target
    feature_columns = ['bedrooms', 'area', 'location_encoded', 'district_encoded', 'bedroom_density']
    X = df[feature_columns]
    y = df['price']
    
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
        num_boost_round=100,  # Reduced for faster training
        callbacks=[lgb.early_stopping(20), lgb.log_evaluation(0)]
    )
    
    # Cache the model
    os.makedirs(CACHE_DIR, exist_ok=True)
    with open(MODEL_PATH, 'wb') as f:
        pickle.dump(model, f)
    with open(ENCODERS_PATH, 'wb') as f:
        pickle.dump({
            'le_location': le_location,
            'le_district': le_district,
            'available_locations': available_locations
        }, f)
    
    return model, le_location, le_district, available_locations

class handler(BaseHTTPRequestHandler):
    """Vercel Python serverless function handler"""
    
    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
    
    def do_GET(self):
        """Handle GET requests"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        
        if self.path == '/api/predict':
            response = {
                'status': 'online',
                'message': 'VN Real Estate Price Predictor',
                'method': 'POST to /api/predict with JSON body'
            }
            self.wfile.write(json.dumps(response).encode())
        elif self.path == '/api/predict/locations':
            try:
                _, _, _, available_locations = get_or_train_model()
                response = {'locations': available_locations}
                self.wfile.write(json.dumps(response).encode())
            except Exception as e:
                response = {'error': str(e)}
                self.wfile.write(json.dumps(response).encode())
        else:
            response = {'error': 'Not found'}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle POST prediction requests"""
        
        if self.path != '/api/predict':
            self.send_response(404)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': 'Not found'}).encode())
            return
        
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Get model
            model, le_location, le_district, available_locations = get_or_train_model()
            
            # Extract request data
            bedrooms = data['bedrooms']
            area = data['area']
            location = data['location']
            
            # Extract district
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
                # Try to find similar location
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
                    raise ValueError(f"Location '{location}' not found")
            
            # Create features
            bedroom_density = bedrooms / area
            features = np.array([[bedrooms, area, location_encoded, district_encoded, bedroom_density]])
            
            # Predict
            predicted_price = float(model.predict(features)[0])
            price_per_sqm = predicted_price / area
            
            # Send response
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {
                'predicted_price': predicted_price,
                'price_per_sqm': price_per_sqm,
                'bedrooms': bedrooms,
                'area': area,
                'location': location
            }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode())

