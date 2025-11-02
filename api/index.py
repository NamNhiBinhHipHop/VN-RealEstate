"""
Lightweight Vercel Serverless Function for ML Prediction
Uses pre-trained LightGBM model with minimal dependencies
"""

from http.server import BaseHTTPRequestHandler
import json
import os

# Lazy imports - only import when needed
def get_model_and_data():
    """Load model and data (cached)"""
    import pickle
    import lightgbm as lgb
    
    cache_key = 'model_cache'
    if not hasattr(get_model_and_data, cache_key):
        # Load model data
        with open('api/model_data.pkl', 'rb') as f:
            model_data = pickle.load(f)
        
        # Load LightGBM model
        model = lgb.Booster(model_file='api/model_full.txt')
        
        setattr(get_model_and_data, cache_key, (model, model_data))
    
    return getattr(get_model_and_data, cache_key)

class handler(BaseHTTPRequestHandler):
    
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
        
        try:
            if self.path == '/api/predict' or self.path == '/api':
                response = {
                    'status': 'online',
                    'message': 'VN Real Estate Price Predictor',
                    'version': '2.0.0'
                }
            elif self.path == '/api/predict/locations' or self.path == '/api/locations':
                _, model_data = get_model_and_data()
                response = {'locations': model_data['available_locations']}
            else:
                response = {'error': 'Not found'}
            
            self.wfile.write(json.dumps(response).encode())
        except Exception as e:
            response = {'error': str(e)}
            self.wfile.write(json.dumps(response).encode())
    
    def do_POST(self):
        """Handle POST prediction requests"""
        
        try:
            # Read request body
            content_length = int(self.headers.get('Content-Length', 0))
            body = self.rfile.read(content_length)
            data = json.loads(body.decode())
            
            # Import numpy only when needed
            import numpy as np
            
            # Get model
            model, model_data = get_model_and_data()
            
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
            location_mapping = model_data['location_mapping']
            district_mapping = model_data['district_mapping']
            
            if location not in location_mapping:
                # Find similar location
                similar_location = None
                for loc in model_data['available_locations']:
                    if district in loc:
                        similar_location = loc
                        break
                
                if not similar_location:
                    raise ValueError(f"Location '{location}' not found")
                location = similar_location
            
            location_encoded = location_mapping[location]
            district_encoded = district_mapping.get(district, 0)
            
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

