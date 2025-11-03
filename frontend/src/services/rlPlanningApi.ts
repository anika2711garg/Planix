// Add to your api.ts file

// RL Planning types
export interface RLRecommendation {
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

export interface RLPrediction {
  reorderedItems: Task[];
  recommendations: RLRecommendation[];
  confidence: number;
  reasoning: string;
}

export interface RLPlanningInput {
  backlogItems: Task[];
  teamCapacity?: number;
  sprintGoals?: string[];
  currentVelocity?: number;
}

// RL Planning API methods
export const getRLPrediction = async (input: RLPlanningInput): Promise<ApiResponse<RLPrediction>> => {
  return apiRequest<RLPrediction>('/api/sprint-planning/predict', {
    method: 'POST',
    body: JSON.stringify(input),
  });
};