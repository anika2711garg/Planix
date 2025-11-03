"""
Reinforcement Learning Model for Sprint Planning Optimization
Implements DQN with Prioritized Experience Replay for backlog management
"""

import os
import argparse
import json
import random
import numpy as np
import pandas as pd
try:
    import torch
    import torch.nn as nn
    import torch.optim as optim
    TORCH_AVAILABLE = True
except Exception:
    TORCH_AVAILABLE = False
from collections import deque, namedtuple
from typing import List, Dict, Tuple, Optional

# Experience tuple for replay buffer
Experience = namedtuple('Experience', 
                       ['state', 'action', 'reward', 'next_state', 'done'])

def load_dataset(data_dir: str) -> List[Dict]:
    """
    Load dataset from ML Models/Dataset and return a list of "episodes".
    Each episode is a dict with keys: backlog_items (list), config (dict)
    """
    episodes: List[Dict] = []
    if not data_dir or not os.path.isdir(data_dir):
        print(f"Dataset directory not found: {data_dir}")
        return episodes

    sprint_path = os.path.join(data_dir, 'Sprint.csv')
    issue_path = os.path.join(data_dir, 'issue.csv')

    try:
        sprints_df = pd.read_csv(sprint_path)
    except Exception:
        print(f"Could not read {sprint_path}")
        sprints_df = pd.DataFrame()

    try:
        issues_df = pd.read_csv(issue_path)
    except Exception:
        print(f"Could not read {issue_path}")
        issues_df = pd.DataFrame()

    # normalize column names to lowercase for flexible lookup
    sprints_df.columns = [c.lower() for c in sprints_df.columns]
    issues_df.columns = [c.lower() for c in issues_df.columns]

    # Common candidates for sprint id column
    sprint_id_cols = [c for c in sprints_df.columns if 'id' in c]
    issue_sprint_cols = [c for c in issues_df.columns if 'sprint' in c]

    return episodes

if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train or run Sprint RL model')
    parser.add_argument('--mode', choices=['train','predict'], default='train')
    parser.add_argument('--data-dir', type=str, default='ML Models/Dataset')
    parser.add_argument('--episodes', type=int, default=500)
    parser.add_argument('--model-path', type=str, default='sprint_rl_final.pth')
    parser.add_argument('--input-json', type=str, help='JSON input for prediction mode')
    parser.add_argument('--output-json', type=str, help='JSON output path for prediction mode')
    args = parser.parse_args()

    if args.mode == 'predict' and args.input_json:
        if not os.path.exists(args.input_json):
            print(f'Input JSON not found: {args.input_json}')
            raise SystemExit(1)
            
        try:
            with open(args.input_json, 'r') as f:
                input_data = json.load(f)
            
            # Process prediction here and write to output_json
            result = {
                'reorderedItems': input_data.get('backlog_items', []),
                'recommendations': [],
                'confidence': 0.8,
                'reasoning': 'Model prediction reasoning here'
            }
            
            if args.output_json:
                with open(args.output_json, 'w') as f:
                    json.dump(result, f, indent=2)
            else:
                print(json.dumps(result, indent=2))
                
        except Exception as e:
            print(f'Error processing prediction: {str(e)}')
            raise SystemExit(1)
    else:
        if not TORCH_AVAILABLE:
            print('PyTorch is not installed in this environment. Install torch and retry (e.g. pip install torch).')
            raise SystemExit(1)

        print('Loading dataset from', args.data_dir)
        dataset_episodes = load_dataset(args.data_dir)
        if dataset_episodes:
            print(f'Found {len(dataset_episodes)} dataset episodes — training on dataset')
            agent, rewards, losses = train_agent(episodes=args.episodes, dataset_episodes=dataset_episodes)
        else:
            print('No dataset episodes found — training with synthetic environment')
            agent, rewards, losses = train_agent(episodes=args.episodes)

        agent.save(args.model_path)
        print('Training complete! Model saved to', args.model_path)
        print(f"\nTraining Statistics:")
        print(f"Average Reward (last 50 episodes): {np.mean(rewards[-50:]):.2f}")
        print(f"Best Episode Reward: {max(rewards):.2f}")
        print(f"Final Epsilon: {agent.epsilon:.3f}")