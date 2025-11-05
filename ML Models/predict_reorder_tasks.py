"""
predict_reorder_tasks.py

This script loads the trained XGBoost task reordering model and demonstrates
prediction on new sprint data. It shows how to preprocess new issues and
reorder them based on predicted completion order.
"""

import pandas as pd
import numpy as np
import joblib
from datetime import datetime, timedelta

def load_model_and_encoders():
    """Load the trained model and all encoders/mappings"""
    print("Loading model and encoders...")
    model = joblib.load('task_reorder_model.pkl')
    encoders = joblib.load('task_reorder_encoders.pkl')
    print("Model and encoders loaded successfully!\n")
    return model, encoders

def create_sample_sprint_data():
    """
    Create sample data for a new sprint (NEW-2025) with 5 issues.
    These issues do NOT have Resolution_Date or true Task_Rank.
    """
    # Current date for realistic timestamps
    today = datetime.now()
    sprint_start = today - timedelta(days=7)
    
    sample_data = pd.DataFrame({
        'ID': [10001, 10002, 10003, 10004, 10005],
        'Issue_Key': ['NEW-1', 'NEW-2', 'NEW-3', 'NEW-4', 'NEW-5'],
        'Sprint_ID': ['NEW-2025'] * 5,
        'Priority': ['Blocker', 'Major', 'Critical', 'Minor', 'Major'],
        'Story_Point': [8.0, 5.0, 13.0, 3.0, 5.0],
        'Total_Effort_Minutes': [480.0, 240.0, 780.0, 120.0, 300.0],
        'Assignee_ID': ['USER-101', 'USER-102', 'USER-101', 'USER-103', 'USER-102'],
        'Creation_Date': [
            sprint_start - timedelta(days=30),
            sprint_start - timedelta(days=15),
            sprint_start - timedelta(days=45),
            sprint_start - timedelta(days=10),
            sprint_start - timedelta(days=20)
        ],
        'Start_Date': [sprint_start] * 5,
        'num_comments': [15, 8, 25, 3, 12],
        'num_links': [4, 2, 6, 1, 3],
        'num_changes': [20, 10, 35, 5, 15]
    })
    
    return sample_data

def preprocess_new_data(sample_df, encoders):
    """
    Apply all preprocessing steps and encodings to new data.
    
    Args:
        sample_df: DataFrame with raw issue data
        encoders: Dictionary containing all encoding mappings
        
    Returns:
        Processed DataFrame with feature matrix ready for prediction
    """
    df = sample_df.copy()
    
    # 1. Priority Encoding (Ordinal)
    priority_map = encoders['priority_map']
    df['Priority_Encoded'] = df['Priority'].map(priority_map).fillna(0)
    
    # 2. Task Age Calculation
    df['Start_Date'] = pd.to_datetime(df['Start_Date'])
    df['Creation_Date'] = pd.to_datetime(df['Creation_Date'])
    df['Task_Age'] = (df['Start_Date'] - df['Creation_Date']).dt.days
    df['Task_Age'] = df['Task_Age'].clip(lower=0)
    
    # 3. Assignee Target Encoding
    assignee_means = encoders['assignee_means']
    global_mean = encoders['global_mean_rank']
    df['Assignee_Encoded'] = df['Assignee_ID'].map(assignee_means).fillna(global_mean)
    
    # 4. Handle Missing Values
    df['Story_Point'] = df['Story_Point'].fillna(encoders['story_point_median'])
    df['Total_Effort_Minutes'] = df['Total_Effort_Minutes'].fillna(encoders['effort_median'])
    
    # 5. Ensure count features exist (already in sample data)
    df['num_comments'] = df['num_comments'].fillna(0)
    df['num_links'] = df['num_links'].fillna(0)
    df['num_changes'] = df['num_changes'].fillna(0)
    
    return df

def predict_and_reorder(model, processed_df, feature_columns):
    """
    Predict task ranks and reorder issues accordingly.
    
    Args:
        model: Trained XGBoost model
        processed_df: Preprocessed DataFrame
        feature_columns: List of feature column names
        
    Returns:
        DataFrame sorted by predicted rank (ascending order)
    """
    # Extract feature matrix
    X_new = processed_df[feature_columns]
    
    # Predict task rank scores
    predicted_ranks = model.predict(X_new)
    
    # Add predictions to dataframe
    result_df = processed_df.copy()
    result_df['Predicted_Task_Rank'] = predicted_ranks
    
    # Sort by predicted rank (lower is better - completed earlier)
    result_df = result_df.sort_values('Predicted_Task_Rank')
    
    return result_df

def display_results(result_df):
    """Display the reordered task list with key information"""
    print("=" * 90)
    print("PREDICTED TASK COMPLETION ORDER FOR SPRINT: NEW-2025")
    print("=" * 90)
    print(f"{'Rank':<6} {'Issue Key':<12} {'Predicted Score':<18} {'Priority':<12} {'Story Points':<15}")
    print("-" * 90)
    
    for idx, (_, row) in enumerate(result_df.iterrows(), 1):
        print(f"{idx:<6} {row['Issue_Key']:<12} {row['Predicted_Task_Rank']:<18.2f} "
              f"{row['Priority']:<12} {row['Story_Point']:<15.0f}")
    
    print("=" * 90)
    print("\nInterpretation:")
    print("- Lower predicted scores indicate tasks likely to be completed earlier")
    print("- The model considers priority, complexity, assignee history, and activity")
    print("- This ordering can help with sprint planning and task prioritization")
    
    # Display feature contributions
    print("\n" + "=" * 90)
    print("FEATURE VALUES FOR TOP 3 TASKS")
    print("=" * 90)
    top_3 = result_df.head(3)
    feature_cols = ['Issue_Key', 'Priority', 'Story_Point', 'Task_Age', 'num_comments', 'num_links', 'num_changes']
    print(top_3[feature_cols].to_string(index=False))
    print("=" * 90 + "\n")

def main():
    """Main execution function"""
    print("\n" + "=" * 90)
    print("TASK REORDERING PREDICTION SYSTEM")
    print("=" * 90 + "\n")
    
    # Step 1: Load model and encoders
    model, encoders = load_model_and_encoders()
    
    # Step 2: Create sample new sprint data
    print("Creating sample sprint data (NEW-2025)...")
    sample_df = create_sample_sprint_data()
    print(f"Created {len(sample_df)} issues for prediction\n")
    
    # Step 3: Preprocess the new data
    print("Preprocessing new data...")
    processed_df = preprocess_new_data(sample_df, encoders)
    print("Preprocessing completed\n")
    
    # Step 4: Predict and reorder
    print("Predicting task completion order...")
    feature_columns = encoders['feature_columns']
    result_df = predict_and_reorder(model, processed_df, feature_columns)
    print("Prediction completed\n")
    
    # Step 5: Display results
    display_results(result_df)
    
    # Step 6: Save results (optional)
    result_df[['Issue_Key', 'Priority', 'Story_Point', 
               'Predicted_Task_Rank']].to_csv('predicted_task_order.csv', index=False)
    print("Results saved to 'predicted_task_order.csv'\n")

if __name__ == "__main__":
    main()