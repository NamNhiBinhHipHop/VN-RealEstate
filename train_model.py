#!/usr/bin/env python3
"""
Train and save the ML model for deployment
This runs ONCE locally to create the model files
"""

import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
import pickle
import json

print("Loading data...")
df = pd.read_csv("Data/merged_properties.csv")
df = df.dropna()

print(f"Dataset: {len(df)} properties")

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

print(f"Unique locations: {len(available_locations)}")
print(f"Unique districts: {len(set(df['district']))}")

# Create features and target
feature_columns = ['bedrooms', 'area', 'location_encoded', 'district_encoded', 'bedroom_density']
X = df[feature_columns]
y = df['price']

# Split data
district_labels = X['district_encoded']
X_train, X_val, y_train, y_val = train_test_split(
    X, y, test_size=0.2, random_state=42, stratify=district_labels
)

print(f"\nTraining set: {len(X_train)}")
print(f"Validation set: {len(X_val)}")

# Train model
print("\nTraining LightGBM model...")
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
    callbacks=[lgb.early_stopping(100), lgb.log_evaluation(50)]
)

print(f"\nModel trained! Best iteration: {model.best_iteration}")

# Save model as text file (smaller than pickle for LightGBM)
print("\nSaving model...")
model.save_model('api/model.txt')

# Save encoders
with open('api/encoders.pkl', 'wb') as f:
    pickle.dump({
        'le_location': le_location,
        'le_district': le_district,
        'available_locations': available_locations
    }, f)

# Save metadata
metadata = {
    'num_samples': len(df),
    'num_locations': len(available_locations),
    'locations': available_locations,
    'best_iteration': model.best_iteration,
    'feature_columns': feature_columns
}

with open('api/metadata.json', 'w') as f:
    json.dump(metadata, f, indent=2, ensure_ascii=False)

print("\n✅ Model saved successfully!")
print(f"   - api/model.txt (LightGBM model)")
print(f"   - api/encoders.pkl (Label encoders)")
print(f"   - api/metadata.json (Model metadata)")
print(f"\nModel size: {len(open('api/model.txt').read()) / 1024:.2f} KB")
print("Ready for deployment!")

