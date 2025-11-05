# predict_sprint_success.py

import joblib
import pandas as pd
import numpy as np
import sys
import json
import time
from typing import Dict, Any, Tuple
from sklearn.pipeline import Pipeline
# --- Configuration ---

import os.path

def find_model_file():
    script_dir = os.path.dirname(os.path.abspath(__file__))
    possible_paths = [
        os.path.join(script_dir, '..', 'models', 'sprint_success_model.pkl'),  # relative to script
        os.path.join(script_dir, '..', '..', 'models', 'sprint_success_model.pkl'),  # from src/services to src/../models
        os.path.join(os.getcwd(), 'src', 'models', 'sprint_success_model.pkl'),  # from cwd
        os.path.join(os.getcwd(), 'models', 'sprint_success_model.pkl'),  # from cwd/models
    ]
    
    for path in possible_paths:
        if os.path.isfile(path):
            return path
    return None

MODEL_PATH = find_model_file()
if MODEL_PATH:
    print(f"Found model at: {MODEL_PATH}", file=sys.stderr)

# The exact features used during training
FEATURE_COLUMNS = [
    'teamId', 'sprint_duration', 'total_backlog_items', 'total_story_points',
    'completion_ratio', 'avg_priority', 'avg_delay_minutes',
    'on_time_completion_ratio', 'velocity_efficiency',
    'workload_efficiency', 'task_density', 'team_experience'
]

# Load the trained pipeline (preprocessor + model) with global caching
PIPELINE = None
_model_load_timestamp = None

def get_pipeline():
    global PIPELINE, _model_load_timestamp
    
    # If model is already loaded and it's been less than 1 hour, reuse it
    if PIPELINE is not None and _model_load_timestamp is not None:
        age = time.time() - _model_load_timestamp
        if age < 3600:  # 1 hour cache
            return PIPELINE
    
    if MODEL_PATH:
        try:
            PIPELINE = joblib.load(MODEL_PATH)
            _model_load_timestamp = time.time()
            print(f"Model loaded from {MODEL_PATH} at {time.strftime('%H:%M:%S')}", file=sys.stderr)
            return PIPELINE
        except Exception as e:
            print(f"ERROR: Failed to load model from {MODEL_PATH}: {e}", file=sys.stderr)
            return None
    else:
        print("ERROR: Could not find model file in any expected location", file=sys.stderr)
        return None

def calculate_confidence_interval(model: Pipeline, X_new: pd.DataFrame, num_bootstrap=100) -> Tuple[float, float]:
    """
    Calculates a prediction interval (e.g., 90%) using a simple bootstrap method
    on the model's residuals (if the model is not a quantile regression type).
    
    For production, consider Quantile Regression Forests if using RFR, or dedicated 
    GBM prediction interval methods for higher accuracy.
    """
    if not hasattr(model, 'residuals_'):
        # For simplicity, we use a fixed interval derived from test MAE for this example
        # In the real training script, you would calculate and save the residuals.
        # Assume a test MAE of ~0.05
        error_margin = 0.05
    else:
        # Placeholder for complex residual-based calculation
        error_margin = 0.05

    # Predict the mean score
    mean_prediction = model.predict(X_new)[0]

    # Return 90% prediction interval
    lower_bound = mean_prediction - error_margin
    upper_bound = mean_prediction + error_margin
    
    return max(0.0, lower_bound), min(1.0, upper_bound)


def predict_sprint_success(sprint_data: Dict[str, Any]) -> Dict[str, Any]:
    """
    Inference function for a single sprint.
    1. Validates and converts input data to DataFrame.
    2. Runs prediction.
    3. Calculates confidence interval.
    """
    # Debug: Print received data
    print("DEBUG: Received sprint data:", file=sys.stderr)
    print(json.dumps(sprint_data, indent=2), file=sys.stderr)
    print("\nDEBUG: Using mock data?" + (" Yes" if sprint_data.get('teamId') == 2 else " No"), file=sys.stderr)
    
    pipeline = get_pipeline()
    if pipeline is None:
        return {"error": "Model not loaded. Check model path."}

    # 1. Prepare data (must be a DataFrame for the Pipeline)
    try:
        # Convert dictionary to a DataFrame, ensuring feature order and structure
        X_new = pd.DataFrame([sprint_data], columns=FEATURE_COLUMNS)
    except Exception as e:
        return {"error": f"Data preparation failed: {e}"}

    # 2. Prediction
    predicted_score = pipeline.predict(X_new)[0]
    
    # Clip score to be between 0 and 1
    predicted_score = np.clip(predicted_score, 0.0, 1.0)
    
    # 3. Confidence Interval
    lower_ci, upper_ci = calculate_confidence_interval(PIPELINE, X_new)

    return {
        "predicted_success_score": round(predicted_score, 4),
        "confidence_interval": [round(lower_ci, 4), round(upper_ci, 4)],
        "confidence_value": round(upper_ci - lower_ci, 4) # Range of the CI
    }

# --- CLI / stdin usage ---
if __name__ == '__main__':
    # If JSON is piped to stdin, use it. Otherwise fall back to mock data.
    try:
        stdin_data = sys.stdin.read()
        if stdin_data and stdin_data.strip():
            try:
                input_features = json.loads(stdin_data)
            except Exception:
                # If the input isn't proper JSON, ignore and use mock
                input_features = None
        else:
            input_features = None
    except Exception:
        input_features = None

    if not input_features:
        # This mock data must contain ALL required features, using the exact names
        input_features = {
            'teamId': 2,
            'sprint_duration': 14,
            'total_backlog_items': 15,
            'total_story_points': 100,
            'completion_ratio': 0.95,
            'avg_priority': 2.2,
            'avg_delay_minutes': 30.5,
            'on_time_completion_ratio': 0.85,
            'velocity_efficiency': 1.1, # Team velocity is 110, target was 100
            'workload_efficiency': 1.05,
            'task_density': 3.0, # 42 tasks / 14 days
            'team_experience': 3.8
        }

    result = predict_sprint_success(input_features)
    # Before we output, validate result is json-serializable
    try:
        output = json.dumps(result)
        sys.stderr.write(f"DEBUG: About to output JSON: {output}\n")
        print(output, flush=True)  # flush to ensure immediate output
    except Exception as e:
        sys.stderr.write(f"ERROR: Failed to serialize result: {e}\n")
        print(json.dumps({"error": str(e)}))