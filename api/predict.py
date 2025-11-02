"""
Vercel Serverless Function for ML Price Prediction
Loads PRE-TRAINED model for fast inference
"""

import lightgbm as lgb
import numpy as np
import json
import pickle
from http.server import BaseHTTPRequestHandler
import os

# Global variables for caching
_model = None
_encoders = None
_metadata = None

def load_model():
    """Load pre-trained model and encoders (cached)"""
    global _model, _encoders, _metadata
    
    if _model is not None:
        return _model, _encoders, _metadata
    
    # Get the directory where this file is located
    base_dir = os.path.dirname(os.path.abspath(__file__))
    
    # Load model
    model_path = os.path.join(base_dir, 'model.txt')
    _model = lgb.Booster(model_file=model_path)
    
    # Load encoders
    encoders_path = os.path.join(base_dir, 'encoders.pkl')
    with open(encoders_path, 'rb') as f:
        _encoders = pickle.load(f)
    
    # Load metadata
    metadata_path = os.path.join(base_dir, 'metadata.json')
    with open(metadata_path, 'r') as f:
        _metadata = json.load(f)
    
    return _model, _encoders, _metadata

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
        try:
            model, encoders, metadata = load_model()
            
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            
            if '/locations' in self.path:
                response = {'locations': encoders['available_locations']}
            else:
                response = {
                    'status': 'online',
                    'message': 'VN Real Estate Price Predictor',
                    'version': '1.0.0',
                    'num_locations': metadata['num_locations']
                }
            
            self.wfile.write(json.dumps(response).encode())
            
        except Exception as e:
            self.send_response(500)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.end_headers()
            self.wfile.write(json.dumps({'error': str(e)}).encode())
    
    def do_POST(self):
        """Handle POST prediction requests"""
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Load model
            model, encoders, metadata = load_model()
            
            le_location = encoders['le_location']
            le_district = encoders['le_district']
            available_locations = encoders['available_locations']
            
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
                    self.send_response(400)
                    self.send_header('Content-Type', 'application/json')
                    self.send_header('Access-Control-Allow-Origin', '*')
                    self.end_headers()
                    self.wfile.write(json.dumps({
                        'error': f"Location '{location}' not found. Use /api/predict/locations to see available locations."
                    }).encode())
                    return
            
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
            
            response = {'error': str(e), 'type': type(e).__name__}
            self.wfile.write(json.dumps(response).encode())
