#!/usr/bin/env python3
"""
Train LightGBM model once and export everything needed for inference.

Outputs:
  - api/model.txt          (LightGBM text model)
  - api/encoders.pkl       (sklearn label encoders for reference)
  - api/metadata.json      (training metadata)
  - api/model.json         (compressed tree structures for TS runtime)
  - api/encoders.json      (string -> index mappings for runtime)
"""

import json
from pathlib import Path

import lightgbm as lgb
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder

DATA_PATH = Path("Data/merged_properties.csv")
API_DIR = Path("api")
RUNTIME_DIR = API_DIR  # keep exported trees inside api/ as requested


def ensure_dirs() -> None:
    API_DIR.mkdir(exist_ok=True)
    RUNTIME_DIR.mkdir(exist_ok=True)


def load_dataset() -> pd.DataFrame:
    if not DATA_PATH.exists():
        raise FileNotFoundError(f"Dataset not found: {DATA_PATH}")

    df = pd.read_csv(DATA_PATH)
    df = df.dropna()

    district_extract = df["location"].str.extract(r"Quận (\d+|[^,]+)|Huyện ([^,]+)")
    df["district"] = district_extract[0].fillna(district_extract[1]).fillna("Other")
    df["bedroom_density"] = df["bedrooms"] / df["area"].clip(lower=1)

    return df


def encode_features(df: pd.DataFrame):
    le_location = LabelEncoder()
    le_district = LabelEncoder()

    df["location_encoded"] = le_location.fit_transform(df["location"])
    df["district_encoded"] = le_district.fit_transform(df["district"])

    feature_columns = [
        "bedrooms",
        "area",
        "location_encoded",
        "district_encoded",
        "bedroom_density",
    ]

    X = df[feature_columns]
    y = df["price"]

    return (
        X,
        y,
        feature_columns,
        le_location,
        le_district,
        le_location.classes_.tolist(),
        le_district.classes_.tolist(),
    )


def train_model(X, y):
    district_labels = X["district_encoded"]
    X_train, X_val, y_train, y_val = train_test_split(
        X, y, test_size=0.2, random_state=42, stratify=district_labels
    )

    train_data = lgb.Dataset(X_train, label=y_train)
    val_data = lgb.Dataset(X_val, label=y_val, reference=train_data)

    params = {
        "objective": "regression",
        "metric": ["mae", "rmse"],
        "boosting_type": "gbdt",
        "learning_rate": 0.02,
        "num_leaves": 127,
        "max_depth": 10,
        "min_data_in_leaf": 20,
        "feature_fraction": 0.85,
        "bagging_fraction": 0.85,
        "bagging_freq": 5,
        "lambda_l1": 0.1,
        "lambda_l2": 0.1,
        "min_gain_to_split": 0.1,
        "max_bin": 255,
        "verbose": -1,
        "random_state": 42,
        "force_col_wise": True,
    }

    model = lgb.train(
        params,
        train_data,
        valid_sets=[train_data, val_data],
        num_boost_round=2000,
        callbacks=[
            lgb.early_stopping(150),
            lgb.log_evaluation(100),
        ],
    )
    return model, len(X_train), len(X_val)


def export_artifacts(
    model: lgb.Booster,
    feature_columns,
    le_location,
    le_district,
    locations,
    districts,
    train_size: int,
    val_size: int,
    num_rows: int,
):
    print("Saving LightGBM text model...")
    model.save_model(API_DIR / "model.txt")

    print("Saving encoders (pickle)...")
    with open(API_DIR / "encoders.pkl", "wb") as f:
        import pickle

        pickle.dump(
            {
                "le_location": le_location,
                "le_district": le_district,
                "available_locations": locations,
            },
            f,
        )

    metadata = {
        "num_samples": num_rows,
        "train_size": train_size,
        "val_size": val_size,
        "best_iteration": model.best_iteration,
        "feature_columns": feature_columns,
        "num_locations": len(locations),
        "num_districts": len(districts),
    }

    print("Saving metadata...")
    with open(API_DIR / "metadata.json", "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2, ensure_ascii=False)

    dump = model.dump_model()
    num_trees = dump.get("num_trees", len(dump["tree_info"]))
    runtime_payload = {
        "feature_names": dump["feature_names"],
        "tree_info": [
            {
                "tree_index": tree["tree_index"],
                "shrinkage": tree.get("shrinkage", 1.0),
                "tree_structure": tree["tree_structure"],
            }
            for tree in dump["tree_info"]
        ],
        "average_output": dump.get("average_output", 0.0),
        "num_trees": num_trees,
    }

    print("Exporting tree structures for Next.js runtime...")
    with open(RUNTIME_DIR / "model.json", "w", encoding="utf-8") as f:
        json.dump(runtime_payload, f, ensure_ascii=False)

    print("Exporting encoder mappings...")
    with open(RUNTIME_DIR / "encoders.json", "w", encoding="utf-8") as f:
        json.dump(
            {
                "locations": locations,
                "districts": districts,
            },
            f,
            ensure_ascii=False,
            indent=2,
        )

    print("All artifacts exported to:", API_DIR.resolve())


def main():
    ensure_dirs()
    print("Loading dataset...")
    df = load_dataset()
    print(f"Dataset size: {len(df)} rows")

    print("Encoding features...")
    (
        X,
        y,
        feature_columns,
        le_location,
        le_district,
        locations,
        districts,
    ) = encode_features(df)

    print("Training LightGBM model...")
    model, train_size, val_size = train_model(X, y)

    print(f"Best iteration: {model.best_iteration}")
    export_artifacts(
        model,
        feature_columns,
        le_location,
        le_district,
        locations,
        districts,
        train_size,
        val_size,
        len(df),
    )

    print("✅ Training complete. You can now commit the files inside the api/ directory.")


if __name__ == "__main__":
    main()
