import { prisma } from '../lib/prisma';
import { spawn } from 'child_process';
import path from 'path';

interface RLPredictionInput {
    backlogItems: any[];
    teamCapacity?: number;
    sprintGoals?: string[];
    currentVelocity?: number;
}

interface RLPredictionOutput {
    reorderedItems: any[];
    recommendations: {
        type: string;
        title: string;
        message: string;
        priority: 'high' | 'medium' | 'low';
    }[];
    confidence: number;
    reasoning: string;
}

export class RLPlanningService {
    private static modelPath = path.join(process.cwd(), 'src/services/sprint_rl_model.py');
    private static checkpointPath = path.join(process.cwd(), 'src/services/sprint_rl_final.pth');
    private static datasetPath = path.join(process.cwd(), '../ML Models/Dataset');

    /**
     * Convert backlog items to RL model input format
     */
    private static prepareModelInput(data: RLPredictionInput): any {
        const { backlogItems, teamCapacity, sprintGoals, currentVelocity } = data;
        
        return {
            backlog_items: backlogItems.map(item => ({
                id: item.id,
                title: item.title,
                story_points: item.storyPoints || 0,
                priority: item.priority,
                status: item.status,
                type: item.type || 'Feature',
                dependencies: item.dependencies || [],
                risk_level: this.calculateRiskLevel(item),
                completion_probability: this.estimateCompletionProbability(item)
            })),
            team_capacity: teamCapacity || 40,
            current_velocity: currentVelocity || 30,
            sprint_goals: sprintGoals || [],
            days_remaining: 14, // Assuming 2-week sprints
            completed_story_points: backlogItems.filter(i => i.status === 'Done')
                .reduce((sum, item) => sum + (item.storyPoints || 0), 0),
            total_story_points: backlogItems
                .reduce((sum, item) => sum + (item.storyPoints || 0), 0)
        };
    }

    /**
     * Calculate risk level based on item attributes
     */
    private static calculateRiskLevel(item: any): 'High' | 'Medium' | 'Low' {
        const hasHighPriority = item.priority === 'High';
        const isLargeTask = (item.storyPoints || 0) > 8;
        const hasDependencies = (item.dependencies || []).length > 0;

        if (hasHighPriority && (isLargeTask || hasDependencies)) {
            return 'High';
        } else if (isLargeTask || hasDependencies) {
            return 'Medium';
        }
        return 'Low';
    }

    /**
     * Estimate completion probability based on historical data
     */
    private static estimateCompletionProbability(item: any): number {
        // TODO: Implement based on historical completion data
        const baseProb = 0.8;
        const storyPointsPenalty = Math.min(0.2, ((item.storyPoints || 0) - 5) * 0.02);
        const dependenciesPenalty = Math.min(0.2, ((item.dependencies || []).length) * 0.05);
        
        return Math.max(0.6, baseProb - storyPointsPenalty - dependenciesPenalty);
    }

    /**
     * Run RL model prediction
     */
    static async getPrediction(input: RLPredictionInput): Promise<RLPredictionOutput> {
        const modelInput = this.prepareModelInput(input);

        return new Promise((resolve, reject) => {
            const pythonProcess = spawn('python', [
                this.modelPath,
                '--mode', 'predict',
                '--input', JSON.stringify(modelInput),
                '--model', this.checkpointPath
            ]);

            let result = '';
            let error = '';

            pythonProcess.stdout.on('data', (data) => {
                result += data.toString();
            });

            pythonProcess.stderr.on('data', (data) => {
                error += data.toString();
            });

            pythonProcess.on('close', (code) => {
                if (code !== 0) {
                    console.error('RL Model Error:', error);
                    reject(new Error('Failed to get RL model prediction'));
                    return;
                }

                try {
                    const prediction = JSON.parse(result);
                    resolve(this.processModelOutput(prediction, input.backlogItems));
                } catch (e) {
                    reject(new Error('Failed to parse RL model output'));
                }
            });
        });
    }

    /**
     * Process and format model output
     */
    private static processModelOutput(
        prediction: any,
        originalItems: any[]
    ): RLPredictionOutput {
        // Map predicted order back to original items
        const reorderedItems = prediction.reordered_items.map((id: string) =>
            originalItems.find(item => item.id === id)
        ).filter(Boolean);

        // Generate recommendations based on model output
        const recommendations = [];
        
        if (prediction.high_risk_items?.length > 0) {
            recommendations.push({
                type: 'risk',
                title: 'High Risk Items Detected',
                message: `${prediction.high_risk_items.length} items need attention to reduce sprint risk.`,
                priority: 'high'
            });
        }

        if (prediction.capacity_utilization > 0.9) {
            recommendations.push({
                type: 'capacity',
                title: 'High Capacity Utilization',
                message: 'Consider reducing sprint scope to maintain team velocity.',
                priority: 'medium'
            });
        }

        if (prediction.dependency_warnings?.length > 0) {
            recommendations.push({
                type: 'dependency',
                title: 'Dependency Risks',
                message: 'Some items have unresolved dependencies that may block progress.',
                priority: 'high'
            });
        }

        return {
            reorderedItems,
            recommendations,
            confidence: prediction.confidence || 0.8,
            reasoning: prediction.reasoning || 'Optimized based on multiple factors including priority, risk, and dependencies.'
        };
    }

    /**
     * Save model predictions and update backlog
     */
    static async saveReorderPrediction(
        sprintId: string,
        prediction: RLPredictionOutput
    ): Promise<void> {
        try {
            // Update item order in database
            const updatePromises = prediction.reorderedItems.map((item, index) =>
                prisma.backlogItem.update({
                    where: { id: item.id },
                    data: {
                        order: index,
                        updatedAt: new Date()
                    }
                })
            );

            // Save recommendations
            const recommendationPromises = prediction.recommendations.map(rec =>
                prisma.sprintRecommendation.create({
                    data: {
                        sprintId: parseInt(sprintId),
                        type: rec.type,
                        title: rec.title,
                        message: rec.message,
                        priority: rec.priority,
                        confidence: prediction.confidence,
                        createdAt: new Date()
                    }
                })
            );

            await Promise.all([...updatePromises, ...recommendationPromises]);
            
            console.log(`Saved RL model predictions for sprint ${sprintId}`);
            
        } catch (error) {
            console.error('Error saving RL predictions:', error);
            throw new Error('Failed to save RL model predictions');
        }
    }
}