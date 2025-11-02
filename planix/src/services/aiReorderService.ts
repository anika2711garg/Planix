import { prisma } from '../lib/prisma';

// Use any type for now to avoid import issues
type BacklogItem = any;

interface AIReorderRequest {
  backlogItems: BacklogItem[];
  criteria?: 'priority' | 'complexity' | 'dependencies' | 'sprint_readiness';
  teamCapacity?: number;
  sprintGoals?: string[];
}

interface AIReorderResponse {
  reorderedItems: BacklogItem[];
  reasoning: string;
  confidence: number;
  suggestions: string[];
}

export class AIReorderService {
  /**
   * AI-powered backlog reordering based on multiple criteria
   */
  static async reorderBacklog(request: AIReorderRequest): Promise<AIReorderResponse> {
    try {
      const { backlogItems, criteria = 'priority', teamCapacity, sprintGoals } = request;
      
      console.log(`AI Reordering ${backlogItems.length} items using criteria: ${criteria}`);
      
      // AI scoring algorithm
      const scoredItems = backlogItems.map(item => ({
        ...item,
        aiScore: this.calculateAIScore(item, criteria, teamCapacity, sprintGoals)
      }));
      
      // Sort by AI score (highest first)
      const reorderedItems = scoredItems
        .sort((a, b) => b.aiScore - a.aiScore)
        .map(({ aiScore, ...item }) => item);
      
      const reasoning = this.generateReasoning(criteria, reorderedItems.length);
      const confidence = this.calculateConfidence(scoredItems);
      const suggestions = this.generateSuggestions(reorderedItems, criteria);
      
      return {
        reorderedItems,
        reasoning,
        confidence,
        suggestions
      };
      
    } catch (error) {
      console.error('AI Reorder Service Error:', error);
      throw new Error('Failed to reorder backlog items');
    }
  }
  
  /**
   * Calculate AI score for individual backlog item
   */
  private static calculateAIScore(
    item: BacklogItem, 
    criteria: string, 
    teamCapacity?: number, 
    sprintGoals?: string[]
  ): number {
    let score = 0;
    
    // Base priority score (higher priority number = higher score)
    score += (item.priority || 1) * 20;
    
    // Story points consideration (smaller stories get boost for quick wins)
    if (item.storyPoints) {
      if (item.storyPoints <= 3) score += 20; // Quick wins
      else if (item.storyPoints <= 8) score += 10; // Medium effort
      else score -= 10; // High effort, lower immediate priority
    }
    
    // Status consideration
    if (item.status === 'IN_PROGRESS') score += 50; // Continue in-progress work
    if (item.status === 'DONE') score -= 100; // Don't reorder completed items
    
    // Criteria-specific scoring
    switch (criteria) {
      case 'priority':
        // Already weighted above
        break;
        
      case 'complexity':
        // Prefer simpler items first
        if (item.storyPoints && item.storyPoints <= 3) score += 30;
        break;
        
      case 'dependencies':
        // Items without dependencies get higher score
        // This would need dependency analysis from description/title
        if (item.description && !item.description.toLowerCase().includes('depends on')) {
          score += 25;
        }
        break;
        
      case 'sprint_readiness':
        // Well-defined items get higher score
        if (item.description && item.description.length > 50) score += 20;
        if (item.storyPoints && item.storyPoints > 0) score += 15;
        break;
    }
    
    // Sprint goals alignment
    if (sprintGoals && sprintGoals.length > 0) {
      const itemText = `${item.title} ${item.description}`.toLowerCase();
      sprintGoals.forEach(goal => {
        if (itemText.includes(goal.toLowerCase())) {
          score += 40;
        }
      });
    }
    
    // Team capacity consideration
    if (teamCapacity && item.storyPoints) {
      if (item.storyPoints <= teamCapacity * 0.3) {
        score += 15; // Fits well in capacity
      }
    }
    
    return Math.max(0, score);
  }
  
  /**
   * Generate human-readable reasoning
   */
  private static generateReasoning(criteria: string, itemCount: number): string {
    const reasoningMap = {
      'priority': `Reordered ${itemCount} items based on business priority, story points, and current status. High-priority items and quick wins are prioritized.`,
      'complexity': `Reordered ${itemCount} items to tackle simpler stories first, enabling quick wins and momentum building.`,
      'dependencies': `Reordered ${itemCount} items to minimize dependency blockers, promoting parallel development.`,
      'sprint_readiness': `Reordered ${itemCount} items based on definition completeness and sprint readiness criteria.`
    };
    
    return reasoningMap[criteria as keyof typeof reasoningMap] || 
           `Reordered ${itemCount} items using AI analysis.`;
  }
  
  /**
   * Calculate confidence score
   */
  private static calculateConfidence(scoredItems: any[]): number {
    if (scoredItems.length === 0) return 0;
    
    const scores = scoredItems.map(item => item.aiScore);
    const avgScore = scores.reduce((sum, score) => sum + score, 0) / scores.length;
    const variance = scores.reduce((sum, score) => sum + Math.pow(score - avgScore, 2), 0) / scores.length;
    
    // Higher variance = lower confidence (items are too similar)
    // Higher average = higher confidence (clear winners)
    const confidenceScore = Math.min(95, Math.max(10, (avgScore / 2) - (variance / 10)));
    
    return Math.round(confidenceScore);
  }
  
  /**
   * Generate actionable suggestions
   */
  private static generateSuggestions(items: BacklogItem[], criteria: string): string[] {
    const suggestions: string[] = [];
    
    // Check for missing story points
    const missingStoryPoints = items.filter(item => !item.storyPoints || item.storyPoints === 0);
    if (missingStoryPoints.length > 0) {
      suggestions.push(`${missingStoryPoints.length} items need story point estimation`);
    }
    
    // Check for vague descriptions
    const vagueDescriptions = items.filter(item => !item.description || item.description.length < 30);
    if (vagueDescriptions.length > 0) {
      suggestions.push(`${vagueDescriptions.length} items need more detailed descriptions`);
    }
    
    // Check for high-effort items
    const highEffortItems = items.filter(item => item.storyPoints && item.storyPoints > 13);
    if (highEffortItems.length > 0) {
      suggestions.push(`Consider breaking down ${highEffortItems.length} large items (>13 story points)`);
    }
    
    // Priority distribution
    const highPriorityCount = items.filter(item => (item.priority || 0) > 5).length;
    if (highPriorityCount > items.length * 0.5) {
      suggestions.push('Too many high-priority items - consider re-prioritizing');
    }
    
    return suggestions;
  }
  
  /**
   * Save reordered backlog to database
   */
  static async saveReorderedBacklog(sprintId: string, reorderedItems: BacklogItem[]): Promise<void> {
    try {
      // Update priority as order in database  
      const updatePromises = reorderedItems.map((item, index) => 
        prisma.backlogItem.update({
          where: { id: item.id },
          data: { 
            priority: index + 1, // Use priority as ordering
            updatedAt: new Date()
          }
        })
      );
      
      await Promise.all(updatePromises);
      console.log(`Saved reordered backlog with ${reorderedItems.length} items`);
      
    } catch (error) {
      console.error('Error saving reordered backlog:', error);
      throw new Error('Failed to save reordered backlog');
    }
  }
}
