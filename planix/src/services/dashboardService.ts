import { prisma } from '../lib/prisma';

export interface DashboardData {
  currentSprint: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
    daysRemaining: number;
    totalStoryPoints: number;
    completedStoryPoints: number;
    progressPercentage: number;
    riskLevel: 'Low' | 'Medium' | 'High';
  } | null;
  burndownData: Array<{
    day: number;
    ideal: number;
    actual?: number;
    predicted?: number;
  }>;
  aiRecommendations: Array<{
    type: 'scope' | 'velocity' | 'blocker';
    title: string;
    message: string;
    priority: 'high' | 'medium' | 'low';
  }>;
}

export async function getDashboardData(userId: number): Promise<DashboardData> {
  try {
    // Get user with team info
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        team: {
          include: {
            sprints: {
              where: {
                endDate: {
                  gte: new Date()
                }
              },
              orderBy: {
                startDate: 'asc'
              },
              take: 1,
              include: {
                items: {
                  include: {
                    taskCompletions: true
                  }
                }
              }
            }
          }
        }
      }
    });

    if (!user || !user.team || user.team.sprints.length === 0) {
      return {
        currentSprint: null,
        burndownData: [],
        aiRecommendations: []
      };
    }

    const sprint = user.team.sprints[0];
    
    // Calculate sprint metrics
    const totalStoryPoints = sprint.items.reduce((sum, item) => sum + item.storyPoints, 0);
    const completedStoryPoints = sprint.items
      .filter(item => item.status === 'done')
      .reduce((sum, item) => sum + item.storyPoints, 0);
    
    const progressPercentage = totalStoryPoints > 0 
      ? Math.round((completedStoryPoints / totalStoryPoints) * 100) 
      : 0;
    
    // Calculate days remaining
    const now = new Date();
    const endDate = new Date(sprint.endDate);
    const daysRemaining = Math.max(0, Math.ceil((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    
    // Determine risk level based on progress and time remaining
    const sprintDuration = Math.ceil((endDate.getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24));
    const timeElapsed = sprintDuration - daysRemaining;
    const expectedProgress = sprintDuration > 0 ? (timeElapsed / sprintDuration) * 100 : 0;
    
    let riskLevel: 'Low' | 'Medium' | 'High' = 'Low';
    if (progressPercentage < expectedProgress - 20) {
      riskLevel = 'High';
    } else if (progressPercentage < expectedProgress - 10) {
      riskLevel = 'Medium';
    }

    // Generate burndown data
    const burndownData = generateBurndownData(totalStoryPoints, completedStoryPoints, sprintDuration, timeElapsed);
    
    // Generate AI recommendations
    const aiRecommendations = generateAIRecommendations(sprint.items, progressPercentage, daysRemaining, riskLevel);

    return {
      currentSprint: {
        id: sprint.id,
        name: sprint.name,
        startDate: sprint.startDate.toISOString(),
        endDate: sprint.endDate.toISOString(),
        daysRemaining,
        totalStoryPoints,
        completedStoryPoints,
        progressPercentage,
        riskLevel
      },
      burndownData,
      aiRecommendations
    };
  } catch (error) {
    console.error('Error fetching dashboard data:', error);
    throw new Error('Failed to fetch dashboard data');
  }
}

function generateBurndownData(totalPoints: number, completedPoints: number, sprintDuration: number, timeElapsed: number) {
  const data = [];
  const pointsPerDay = totalPoints / sprintDuration;
  
  for (let day = 0; day <= sprintDuration; day++) {
    const ideal = Math.max(0, totalPoints - (day * pointsPerDay));
    let actual = totalPoints;
    let predicted;
    
    if (day <= timeElapsed) {
      // For past days, calculate based on actual progress
      actual = day === timeElapsed ? (totalPoints - completedPoints) : Math.max(0, totalPoints - (day * (completedPoints / timeElapsed)));
    } else {
      // For future days, show prediction
      const currentVelocity = timeElapsed > 0 ? completedPoints / timeElapsed : pointsPerDay;
      predicted = Math.max(0, (totalPoints - completedPoints) - ((day - timeElapsed) * currentVelocity));
    }
    
    data.push({
      day,
      ideal: Math.round(ideal),
      actual: day <= timeElapsed ? Math.round(actual) : undefined,
      predicted: day > timeElapsed ? Math.round(predicted!) : undefined
    });
  }
  
  return data;
}

function generateAIRecommendations(items: any[], progressPercentage: number, daysRemaining: number, riskLevel: string) {
  const recommendations = [];
  
  if (riskLevel === 'High') {
    recommendations.push({
      type: 'scope' as const,
      title: 'Scope Adjustment',
      message: 'Consider moving some lower priority items to the next sprint to reduce risk.',
      priority: 'high' as const
    });
  }
  
  if (progressPercentage < 50 && daysRemaining < 7) {
    recommendations.push({
      type: 'velocity' as const,
      title: 'Velocity Boost',
      message: 'Consider allocating additional resources or extending work hours to meet sprint goals.',
      priority: 'high' as const
    });
  }
  
  const overdueItems = items.filter(item => 
    item.status !== 'done' && 
    item.taskCompletions.some((tc: any) => tc.delayReason)
  );
  
  if (overdueItems.length > 0) {
    recommendations.push({
      type: 'blocker' as const,
      title: 'Potential Blockers',
      message: `${overdueItems.length} items are experiencing delays. Review and resolve blockers.`,
      priority: 'medium' as const
    });
  }
  
  return recommendations;
}