#!/usr/bin/env python3
"""
Train model locally and export lightweight coefficients for Vercel
This script trains the full model and exports only what's needed for prediction
"""

import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import json

def train_and_export():
    """Train model and export minimal data needed for prediction"""
    
    print("Loading data...")
    df = pd.read_csv("Data/merged_properties.csv")
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
    
    # Save encoders mapping
    location_mapping = {loc: int(idx) for idx, loc in enumerate(le_location.classes_)}
    district_mapping = {dist: int(idx) for idx, dist in enumerate(le_district.classes_)}
    
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
    print("Training model...")
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
        callbacks=[lgb.early_stopping(100), lgb.log_evaluation(100)]
    )
    
    print(f"\nModel trained! Best iteration: {model.best_iteration}")
    
    # Save full model (for local use)
    model.save_model('model_full.txt')
    print("Saved full model to model_full.txt")
    
    # Export minimal data for Vercel (JSON - no heavy dependencies needed)
    export_data = {
        'location_mapping': location_mapping,
        'district_mapping': district_mapping,
        'available_locations': sorted(le_location.classes_.tolist()),
        'model_file': 'model_full.txt'
    }
    
    with open('api/model_data.json', 'w', encoding='utf-8') as f:
        json.dump(export_data, f, ensure_ascii=False, indent=2)
    
    print("Exported model data to api/model_data.json")
    print(f"Locations: {len(export_data['available_locations'])}")
    
    # Also save as pickle for faster loading
    with open('api/model_data.pkl', 'wb') as f:
        pickle.dump(export_data, f)
    
    # Copy model file to api directory
    import shutil
    shutil.copy('model_full.txt', 'api/model_full.txt')
    print("Copied model to api/model_full.txt")
    
    print("\n✅ Export complete! Ready for Vercel deployment.")

if __name__ == "__main__":
    train_and_export()

