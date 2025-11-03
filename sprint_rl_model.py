"""
Enhanced Reinforcement Learning Model for Sprint Planning Optimization
Properly integrated with Jira CSV datasets
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
    Load dataset from CSV files and return list of training episodes.
    Each episode represents a sprint with its backlog items.
    """
    episodes: List[Dict] = []
    if not data_dir or not os.path.isdir(data_dir):
        print(f"Dataset directory not found: {data_dir}")
        return episodes

    sprint_path = os.path.join(data_dir, 'Sprint.csv')
    issue_path = os.path.join(data_dir, 'issue.csv')

    # Load datasets
    try:
        sprints_df = pd.read_csv(sprint_path)
        print(f"✓ Loaded {len(sprints_df)} sprints from Sprint.csv")
    except Exception as e:
        print(f"✗ Could not read {sprint_path}: {e}")
        return episodes

    try:
        issues_df = pd.read_csv(issue_path)
        print(f"✓ Loaded {len(issues_df)} issues from issue.csv")
    except Exception as e:
        print(f"✗ Could not read {issue_path}: {e}")
        return episodes

    # Print column names for debugging
    print("\nSprint.csv columns:", list(sprints_df.columns))
    print("issue.csv columns:", list(issues_df.columns))

    # Normalize column names
    sprints_df.columns = [str(c).strip().lower() for c in sprints_df.columns]
    issues_df.columns = [str(c).strip().lower() for c in issues_df.columns]

    # Identify key columns
    sprint_id_col = find_column(sprints_df, ['sprintid', 'sprint_id', 'id'])
    sprint_name_col = find_column(sprints_df, ['sprintname', 'sprint_name', 'name'])
    sprint_state_col = find_column(sprints_df, ['sprintstate', 'sprint_state', 'state', 'status'])
    
    issue_id_col = find_column(issues_df, ['issueid', 'issue_id', 'id', 'key'])
    issue_sprint_col = find_column(issues_df, ['sprintid', 'sprint_id', 'sprint'])
    story_points_col = find_column(issues_df, ['storypoints', 'story_points', 'points', 'estimate'])
    priority_col = find_column(issues_df, ['priority', 'priorityname'])
    type_col = find_column(issues_df, ['issuetype', 'issue_type', 'type'])
    status_col = find_column(issues_df, ['status', 'statusname'])

    if sprint_id_col is None:
        print("✗ Could not find sprint ID column in Sprint.csv")
        return episodes
    
    if issue_sprint_col is None:
        print("✗ Could not find sprint ID column in issue.csv")
        return episodes

    print(f"\n✓ Using sprint ID column: '{sprint_id_col}'")
    print(f"✓ Using issue sprint column: '{issue_sprint_col}'")

    # Process each sprint
    for idx, sprint_row in sprints_df.iterrows():
        sprint_id = sprint_row.get(sprint_id_col)
        
        if pd.isna(sprint_id):
            continue
            
        try:
            sprint_id = int(float(sprint_id))
        except (ValueError, TypeError):
            continue

        # Get sprint metadata
        sprint_name = sprint_row.get(sprint_name_col, f"Sprint-{sprint_id}")
        sprint_state = sprint_row.get(sprint_state_col, "UNKNOWN")
        
        # Filter issues for this sprint
        sprint_issues = issues_df[issues_df[issue_sprint_col].notna()].copy()
        sprint_issues = sprint_issues[sprint_issues[issue_sprint_col].apply(
            lambda x: safe_int_match(x, sprint_id)
        )]

        if len(sprint_issues) == 0:
            # Create synthetic items for empty sprints
            backlog_items = create_synthetic_backlog(sprint_id, 5)
            print(f"  Sprint {sprint_id} ({sprint_name}): No issues found, using {len(backlog_items)} synthetic items")
        else:
            # Convert issues to backlog items
            backlog_items = []
            for _, issue_row in sprint_issues.iterrows():
                item = convert_issue_to_backlog_item(
                    issue_row,
                    issue_id_col,
                    story_points_col,
                    priority_col,
                    type_col,
                    status_col
                )
                backlog_items.append(item)
            
            print(f"  Sprint {sprint_id} ({sprint_name}): {len(backlog_items)} issues, State: {sprint_state}")

        # Calculate team capacity (estimate from total story points)
        total_points = sum(item['story_points'] for item in backlog_items)
        team_capacity = max(40, int(total_points * 1.2))
        base_velocity = total_points * 0.85

        config = {
            'team_capacity': team_capacity,
            'base_velocity': base_velocity,
            'sprint_goals': [f"Sprint {sprint_id} Goals"],
            'sprint_id': sprint_id,
            'sprint_name': sprint_name,
            'sprint_state': sprint_state
        }

        episodes.append({
            'backlog_items': backlog_items,
            'config': config
        })

    print(f"\n✓ Created {len(episodes)} training episodes from dataset")
    return episodes


def find_column(df: pd.DataFrame, candidates: List[str]) -> Optional[str]:
    """Find the first matching column name from a list of candidates."""
    for col in df.columns:
        if col in candidates:
            return col
    return None


def safe_int_match(value, target: int) -> bool:
    """Safely check if a value matches target integer."""
    try:
        return int(float(value)) == target
    except (ValueError, TypeError):
        return False


def convert_issue_to_backlog_item(
    issue_row,
    issue_id_col: str,
    story_points_col: Optional[str],
    priority_col: Optional[str],
    type_col: Optional[str],
    status_col: Optional[str]
) -> Dict:
    """Convert a Jira issue row to a backlog item."""
    
    # Get issue ID
    issue_id = issue_row.get(issue_id_col, f"ISS-{random.randint(1000, 9999)}")
    
    # Get story points
    story_points = 3
    if story_points_col and story_points_col in issue_row.index:
        sp = issue_row.get(story_points_col)
        if pd.notna(sp):
            try:
                story_points = int(float(sp))
                if story_points not in [1, 2, 3, 5, 8, 13]:
                    closest = min([1, 2, 3, 5, 8, 13], key=lambda x: abs(x - story_points))
                    story_points = closest
            except (ValueError, TypeError):
                pass
    
    # Get priority
    priority = 'Medium'
    if priority_col and priority_col in issue_row.index:
        prio = str(issue_row.get(priority_col, '')).strip().lower()
        if prio in ['highest', 'high', 'blocker', 'critical']:
            priority = 'High'
        elif prio in ['medium', 'normal']:
            priority = 'Medium'
        elif prio in ['low', 'lowest', 'trivial']:
            priority = 'Low'
    
    # Get issue type
    issue_type = 'Feature'
    if type_col and type_col in issue_row.index:
        itype = str(issue_row.get(type_col, '')).strip()
        if itype:
            issue_type = itype
    
    # Get status
    status = 'To Do'
    if status_col and status_col in issue_row.index:
        stat = str(issue_row.get(status_col, '')).strip()
        if stat:
            status = stat
    
    # Determine completion probability based on status
    status_lower = status.lower()
    if 'done' in status_lower or 'closed' in status_lower or 'resolved' in status_lower:
        completion_probability = 0.95
    elif 'progress' in status_lower or 'review' in status_lower:
        completion_probability = 0.70
    else:
        completion_probability = 0.80
    
    # Determine risk level
    if story_points >= 8 and priority == 'High':
        risk_level = 'High'
    elif story_points >= 5 or priority == 'High':
        risk_level = 'Medium'
    else:
        risk_level = 'Low'
    
    return {
        'id': str(issue_id),
        'story_points': story_points,
        'priority': priority,
        'type': issue_type,
        'dependencies': [],
        'risk_level': risk_level,
        'completion_probability': completion_probability,
        'status': status
    }


def create_synthetic_backlog(sprint_id: int, count: int) -> List[Dict]:
    """Create synthetic backlog items for sprints with no issues."""
    items = []
    for i in range(count):
        items.append({
            'id': f'GEN-{sprint_id}-{i}',
            'story_points': random.choice([1, 2, 3, 5, 8]),
            'priority': random.choice(['High', 'Medium', 'Low']),
            'type': random.choice(['Feature', 'Bug', 'Tech Debt']),
            'dependencies': [],
            'risk_level': random.choice(['Low', 'Medium', 'High']),
            'completion_probability': random.uniform(0.6, 0.95),
            'status': 'To Do'
        })
    return items


class TransformerStateEncoder(nn.Module):
    """Transformer-based encoder for processing variable-length backlog items"""
    def __init__(self, input_dim=64, d_model=128, nhead=4, num_layers=2):
        super().__init__()
        self.embedding = nn.Linear(input_dim, d_model)
        encoder_layer = nn.TransformerEncoderLayer(
            d_model=d_model, 
            nhead=nhead,
            dim_feedforward=256,
            dropout=0.1,
            batch_first=True
        )
        self.transformer = nn.TransformerEncoder(encoder_layer, num_layers)
        self.pooling = nn.AdaptiveAvgPool1d(1)
        
    def forward(self, x):
        x = self.embedding(x)
        x = self.transformer(x)
        x = x.transpose(1, 2)
        x = self.pooling(x).squeeze(-1)
        return x


class DQNetwork(nn.Module):
    """Deep Q-Network with multi-head architecture"""
    def __init__(self, state_dim=128, action_dim=100, hidden_dim=256):
        super().__init__()
        
        self.state_encoder = nn.Sequential(
            nn.Linear(state_dim, hidden_dim),
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(hidden_dim, hidden_dim),
            nn.ReLU()
        )
        
        self.reorder_head = nn.Linear(hidden_dim, action_dim)
        self.priority_head = nn.Linear(hidden_dim, 3)
        self.assignment_head = nn.Linear(hidden_dim, action_dim)
        self.value_stream = nn.Linear(hidden_dim, 1)
        
    def forward(self, state):
        features = self.state_encoder(state)
        value = self.value_stream(features)
        
        reorder_advantages = self.reorder_head(features)
        priority_advantages = self.priority_head(features)
        assignment_advantages = self.assignment_head(features)
        
        reorder_q = value + (reorder_advantages - reorder_advantages.mean(dim=-1, keepdim=True))
        priority_q = value + (priority_advantages - priority_advantages.mean(dim=-1, keepdim=True))
        assignment_q = value + (assignment_advantages - assignment_advantages.mean(dim=-1, keepdim=True))
        
        return {
            'reorder': reorder_q,
            'priority': priority_q,
            'assignment': assignment_q
        }


class PrioritizedReplayBuffer:
    """Prioritized Experience Replay Buffer"""
    def __init__(self, capacity=10000, alpha=0.6):
        self.capacity = capacity
        self.alpha = alpha
        self.buffer = []
        self.priorities = np.zeros(capacity, dtype=np.float32)
        self.position = 0
        
    def add(self, experience, td_error=None):
        max_priority = self.priorities.max() if self.buffer else 1.0
        
        if len(self.buffer) < self.capacity:
            self.buffer.append(experience)
        else:
            self.buffer[self.position] = experience
            
        priority = max_priority if td_error is None else abs(td_error) + 1e-5
        self.priorities[self.position] = priority ** self.alpha
        self.position = (self.position + 1) % self.capacity
        
    def sample(self, batch_size, beta=0.4):
        if len(self.buffer) == 0:
            return [], [], []
            
        priorities = self.priorities[:len(self.buffer)]
        probabilities = priorities / priorities.sum()
        
        indices = np.random.choice(len(self.buffer), batch_size, p=probabilities)
        samples = [self.buffer[idx] for idx in indices]
        
        total = len(self.buffer)
        weights = (total * probabilities[indices]) ** (-beta)
        weights /= weights.max()
        
        return samples, indices, weights
        
    def update_priorities(self, indices, td_errors):
        for idx, td_error in zip(indices, td_errors):
            self.priorities[idx] = (abs(td_error) + 1e-5) ** self.alpha
            
    def __len__(self):
        return len(self.buffer)


class SprintEnvironment:
    """Sprint Planning Environment"""
    def __init__(self, config: Dict):
        self.config = config
        self.reset()
        
    def reset(self, initial_backlog: Optional[List[Dict]] = None, config: Optional[Dict] = None):
        self.day = 0
        if config:
            self.config.update(config)

        if initial_backlog:
            self.backlog_items = initial_backlog.copy()
        else:
            self.backlog_items = self._generate_backlog()

        self.assigned_items = []
        self.completed_items = []
        self.team_capacity = self.config.get('team_capacity', 40)
        self.remaining_capacity = self.team_capacity
        self.sprint_goals = self.config.get('sprint_goals', [])
        self.current_velocity = self.config.get('base_velocity', 30.0)

        return self._get_state()
        
    def _generate_backlog(self):
        num_items = np.random.randint(10, 20)
        items = []
        
        priority_dist = {'High': 0.3, 'Medium': 0.5, 'Low': 0.2}
        type_dist = {'Feature': 0.5, 'Bug': 0.3, 'Tech Debt': 0.2}
        
        for i in range(num_items):
            priority = np.random.choice(list(priority_dist.keys()), 
                                       p=list(priority_dist.values()))
            item_type = np.random.choice(list(type_dist.keys()), 
                                        p=list(type_dist.values()))
            
            story_points = np.random.choice([1, 2, 3, 5, 8, 13], 
                                           p=[0.1, 0.2, 0.3, 0.25, 0.1, 0.05])
            
            items.append({
                'id': f'ITEM-{i}',
                'story_points': story_points,
                'priority': priority,
                'type': item_type,
                'dependencies': [f'ITEM-{j}' for j in range(max(0, i-2), i) 
                                if np.random.random() < 0.2],
                'risk_level': np.random.choice(['High', 'Medium', 'Low']),
                'completion_probability': np.random.uniform(0.6, 0.95)
            })
            
        return items
        
    def _get_state(self):
        item_features = []
        for item in self.backlog_items:
            priority_score = {'High': 1.0, 'Medium': 0.5, 'Low': 0.2}[item['priority']]
            risk_score = {'High': 1.0, 'Medium': 0.5, 'Low': 0.2}[item['risk_level']]
            
            features = [
                item['story_points'] / 13.0,
                priority_score,
                len(item['dependencies']) / 5.0,
                item['completion_probability'],
                risk_score,
                1.0 if item in self.assigned_items else 0.0
            ]
            item_features.append(features)
            
        max_items = 20
        while len(item_features) < max_items:
            item_features.append([0.0] * 6)
        item_features = item_features[:max_items]
        
        context = [
            self.remaining_capacity / self.team_capacity,
            self.current_velocity / 50.0,
            len(self.completed_items) / max(len(self.backlog_items), 1),
            self.day / 14.0,
            len(self.assigned_items) / max_items
        ]
        
        return {
            'item_features': np.array(item_features, dtype=np.float32),
            'context': np.array(context, dtype=np.float32)
        }
        
    def step(self, action: Dict):
        reward = 0.0
        
        action_type = action['type']
        item_id = action.get('item_id')
        
        if action_type == 'assign_to_sprint':
            reward += self._assign_item(item_id)
        elif action_type == 'adjust_priority':
            reward += self._adjust_priority(item_id, action['new_priority'])
        elif action_type == 'reorder_backlog':
            reward += self._reorder_backlog(item_id, action['new_position'])
            
        self.day += 1
        self._simulate_completion()
        reward += self._calculate_reward()
        
        done = self.day >= 14 or self.remaining_capacity <= 0
        
        return self._get_state(), reward, done
        
    def _assign_item(self, item_id: str) -> float:
        item = next((i for i in self.backlog_items if i['id'] == item_id), None)
        if not item or item in self.assigned_items:
            return -10.0
            
        if item['story_points'] > self.remaining_capacity:
            return -20.0
            
        unmet_deps = [d for d in item['dependencies'] 
                     if d not in [i['id'] for i in self.completed_items]]
        if unmet_deps:
            return -15.0
            
        self.assigned_items.append(item)
        self.remaining_capacity -= item['story_points']
        
        priority_bonus = {'High': 50, 'Medium': 30, 'Low': 10}[item['priority']]
        return priority_bonus
        
    def _adjust_priority(self, item_id: str, new_priority: str) -> float:
        item = next((i for i in self.backlog_items if i['id'] == item_id), None)
        if not item:
            return -5.0
            
        old_priority = item['priority']
        item['priority'] = new_priority
        return 5.0 if old_priority != new_priority else -2.0
        
    def _reorder_backlog(self, item_id: str, new_position: int) -> float:
        item = next((i for i in self.backlog_items if i['id'] == item_id), None)
        if not item:
            return -5.0
            
        old_idx = self.backlog_items.index(item)
        self.backlog_items.pop(old_idx)
        self.backlog_items.insert(min(new_position, len(self.backlog_items)), item)
        return 2.0
        
    def _simulate_completion(self):
        for item in self.assigned_items[:]:
            if np.random.random() < item['completion_probability'] * 0.15:
                self.assigned_items.remove(item)
                self.completed_items.append(item)
                self.current_velocity += item['story_points'] * 0.1
                
    def _calculate_reward(self) -> float:
        reward = 0.0
        
        completed_points = sum(i['story_points'] for i in self.completed_items)
        total_points = sum(i['story_points'] for i in self.assigned_items + self.completed_items)
        
        if total_points > 0:
            completion_rate = completed_points / total_points
            reward += completion_rate * 100
            
        utilization = (self.team_capacity - self.remaining_capacity) / self.team_capacity
        if 0.8 <= utilization <= 1.0:
            reward += 25
        elif utilization > 1.0:
            reward -= 30
            
        high_priority_completed = sum(1 for i in self.completed_items 
                                     if i['priority'] == 'High')
        reward += high_priority_completed * 10
        
        high_risk_completed = sum(1 for i in self.completed_items 
                                 if i['risk_level'] == 'High')
        reward += high_risk_completed * 5
        
        return reward


class SprintPlanningRLAgent:
    """Main RL Agent for Sprint Planning"""
    def __init__(self, state_dim=128, action_dim=100, lr=0.001):
        self.device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
        
        self.policy_net = DQNetwork(state_dim, action_dim).to(self.device)
        self.target_net = DQNetwork(state_dim, action_dim).to(self.device)
        self.target_net.load_state_dict(self.policy_net.state_dict())
        
        self.optimizer = optim.Adam(self.policy_net.parameters(), lr=lr)
        self.replay_buffer = PrioritizedReplayBuffer(capacity=10000)
        
        self.gamma = 0.99
        self.epsilon = 1.0
        self.epsilon_min = 0.01
        self.epsilon_decay = 0.995
        self.batch_size = 64
        self.target_update_freq = 10
        self.train_step = 0
        
    def encode_state(self, state: Dict) -> torch.Tensor:
        item_features = torch.FloatTensor(state['item_features']).flatten()
        context = torch.FloatTensor(state['context'])
        encoded = torch.cat([item_features, context])
        
        if len(encoded) < 128:
            encoded = torch.cat([encoded, torch.zeros(128 - len(encoded))])
        else:
            encoded = encoded[:128]
            
        return encoded.to(self.device)
        
    def select_action(self, state: Dict, valid_actions: List[Dict], epsilon: Optional[float] = None) -> Dict:
        if epsilon is None:
            epsilon = self.epsilon
            
        if np.random.random() < epsilon:
            return random.choice(valid_actions)
            
        with torch.no_grad():
            state_tensor = self.encode_state(state).unsqueeze(0)
            q_values = self.policy_net(state_tensor)
            
            best_action = None
            best_value = float('-inf')
            
            for action in valid_actions:
                action_type = action['type']
                if action_type == 'assign_to_sprint':
                    value = q_values['assignment'][0].max().item()
                elif action_type == 'adjust_priority':
                    value = q_values['priority'][0].max().item()
                else:
                    value = q_values['reorder'][0].max().item()
                    
                if value > best_value:
                    best_value = value
                    best_action = action
                    
            return best_action if best_action else valid_actions[0]
            
    def train(self, beta=0.4):
        if len(self.replay_buffer) < self.batch_size:
            return 0.0
            
        experiences, indices, weights = self.replay_buffer.sample(self.batch_size, beta)
        
        states = torch.stack([self.encode_state(e.state) for e in experiences])
        next_states = torch.stack([self.encode_state(e.next_state) for e in experiences])
        rewards = torch.FloatTensor([e.reward for e in experiences]).to(self.device)
        dones = torch.FloatTensor([e.done for e in experiences]).to(self.device)
        weights = torch.FloatTensor(weights).to(self.device)
        
        current_q = self.policy_net(states)
        current_q_values = current_q['assignment'].max(dim=1)[0]
        
        with torch.no_grad():
            next_q = self.policy_net(next_states)
            next_actions = next_q['assignment'].max(dim=1)[1]
            
            target_next_q = self.target_net(next_states)
            next_q_values = target_next_q['assignment'].gather(1, next_actions.unsqueeze(1)).squeeze()
            
            target_q_values = rewards + (1 - dones) * self.gamma * next_q_values
            
        td_errors = target_q_values - current_q_values
        loss = (weights * td_errors.pow(2)).mean()
        
        self.optimizer.zero_grad()
        loss.backward()
        torch.nn.utils.clip_grad_norm_(self.policy_net.parameters(), 1.0)
        self.optimizer.step()
        
        self.replay_buffer.update_priorities(indices, td_errors.detach().cpu().numpy())
        
        self.train_step += 1
        if self.train_step % self.target_update_freq == 0:
            self.target_net.load_state_dict(self.policy_net.state_dict())
            
        self.epsilon = max(self.epsilon_min, self.epsilon * self.epsilon_decay)
        
        return loss.item()
        
    def save(self, path: str):
        torch.save({
            'policy_net': self.policy_net.state_dict(),
            'target_net': self.target_net.state_dict(),
            'optimizer': self.optimizer.state_dict(),
            'epsilon': self.epsilon,
            'train_step': self.train_step
        }, path)
        
    def load(self, path: str):
        checkpoint = torch.load(path)
        self.policy_net.load_state_dict(checkpoint['policy_net'])
        self.target_net.load_state_dict(checkpoint['target_net'])
        self.optimizer.load_state_dict(checkpoint['optimizer'])
        self.epsilon = checkpoint['epsilon']
        self.train_step = checkpoint['train_step']


def train_agent(episodes=1000, config=None, dataset_episodes: Optional[List[Dict]] = None):
    """Training loop for the RL agent"""
    if config is None:
        config = {
            'team_capacity': 40,
            'base_velocity': 30.0,
            'sprint_goals': ['Feature Development', 'Bug Fixes']
        }
        
    env = SprintEnvironment(config)
    agent = SprintPlanningRLAgent()
    
    episode_rewards = []
    losses = []
    
    if dataset_episodes:
        num_episodes = min(episodes, len(dataset_episodes))
        print(f"\nTraining on {num_episodes} dataset episodes...")
    else:
        num_episodes = episodes
        print(f"\nTraining with {num_episodes} synthetic episodes...")

    for episode_idx in range(num_episodes):
        if dataset_episodes and episode_idx < len(dataset_episodes):
            episode_data = dataset_episodes[episode_idx]
            state = env.reset(
                initial_backlog=episode_data.get('backlog_items'),
                config=episode_data.get('config')
            )
        else:
            state = env.reset()
            
        episode_reward = 0
        done = False
        step_count = 0
        
        while not done and step_count < 100:
            valid_actions = [
                {'type': 'assign_to_sprint', 'item_id': item['id']}
                for item in env.backlog_items[:5]
                if item not in env.assigned_items
            ]
            
            if not valid_actions:
                valid_actions = [
                    {'type': 'reorder_backlog', 
                     'item_id': env.backlog_items[0]['id'], 
                     'new_position': 0}
                ]
                
            action = agent.select_action(state, valid_actions)
            next_state, reward, done = env.step(action)
            
            agent.replay_buffer.add(
                Experience(state, action, reward, next_state, done)
            )
            
            loss = agent.train(beta=min(1.0, 0.4 + episode_idx / num_episodes * 0.6))
            if loss > 0:
                losses.append(loss)
                
            episode_reward += reward
            state = next_state
            step_count += 1
            
        episode_rewards.append(episode_reward)
        
        if episode_idx % 10 == 0:
            avg_reward = np.mean(episode_rewards[-10:])
            avg_loss = np.mean(losses[-100:]) if losses else 0
            print(f"Episode {episode_idx}/{num_episodes} | "
                  f"Reward: {avg_reward:.2f} | "
                  f"Loss: {avg_loss:.4f} | "
                  f"Epsilon: {agent.epsilon:.3f}")
                  
        if episode_idx % 100 == 0 and episode_idx > 0:
            agent.save(f'sprint_rl_checkpoint_ep{episode_idx}.pth')
            
    return agent, episode_rewards, losses


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Train Sprint Planning RL Model')
    parser.add_argument('--mode', choices=['train', 'predict'], default='train')
    parser.add_argument('--data-dir', type=str, default='ML Models/Dataset',
                       help='Directory containing Sprint.csv and issue.csv')
    parser.add_argument('--episodes', type=int, default=500,
                       help='Number of training episodes')
    parser.add_argument('--model-path', type=str, default='sprint_rl_final.pth',
                       help='Path to save/load model')
    args = parser.parse_args()

    if args.mode == 'train':
        if not TORCH_AVAILABLE:
            print('ERROR: PyTorch is not installed!')
            print('Install with: pip install torch')
            raise SystemExit(1)

        print('=' * 60)
        print('Sprint Planning RL Model - Training Mode')
        print('=' * 60)
        print(f'\nLoading dataset from: {args.data_dir}')
        
        dataset_episodes = load_dataset(args.data_dir)
        
        if dataset_episodes:
            print(f'\n✓ Successfully loaded {len(dataset_episodes)} episodes from dataset')
            print(f'  Training for {args.episodes} episodes using real data')
            agent, rewards, losses = train_agent(
                episodes=args.episodes, 
                dataset_episodes=dataset_episodes
            )
        else:
            print('\n⚠ No dataset episodes found - using synthetic environment')
            print(f'  Training for {args.episodes} episodes with generated data')
            agent, rewards, losses = train_agent(episodes=args.episodes)

        agent.save(args.model_path)
        
        print('\n' + '=' * 60)
        print('Training Complete!')
        print('=' * 60)
        print(f'✓ Model saved to: {args.model_path}')
        print(f'\nTraining Statistics:')
        print(f'  Total Episodes: {len(rewards)}')
        print(f'  Average Reward (last 50): {np.mean(rewards[-50:]):.2f}')
        print(f'  Best Episode Reward: {max(rewards):.2f}')
        print(f'  Worst Episode Reward: {min(rewards):.2f}')
        print(f'  Final Epsilon: {agent.epsilon:.3f}')
        print(f'  Total Training Steps: {agent.train_step}')
        
        if losses:
            print(f'  Average Loss (last 100): {np.mean(losses[-100:]):.4f}')
        
    else:
        print('Predict mode not yet implemented.')
        print('Use this model with the backend RLPlanningService for predictions.')