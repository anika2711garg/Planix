import { prisma } from '@/lib/prisma';

// Generate Sprint Summary Report
export async function generateSprintSummaryReport(sprintId: number) {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        team: true,
        items: {
          include: {
            owner: true,
            taskCompletions: true
          }
        }
      }
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const totalStoryPoints = sprint.items.reduce((sum, item) => sum + item.storyPoints, 0);
    const completedStoryPoints = sprint.items
      .filter(item => item.status === 'done')
      .reduce((sum, item) => sum + item.storyPoints, 0);

    const totalTasks = sprint.items.length;
    const completedTasks = sprint.items.filter(item => item.status === 'done').length;
    const inProgressTasks = sprint.items.filter(item => item.status === 'in-progress').length;
    const todoTasks = sprint.items.filter(item => item.status === 'todo').length;

    // Generate key achievements based on completed tasks
    const achievements = sprint.items
      .filter(item => item.status === 'done' && item.storyPoints >= 5)
      .slice(0, 5)
      .map(item => `Completed: ${item.title} (${item.storyPoints} pts)`);

    // Add default achievements if none found
    if (achievements.length === 0) {
      achievements.push('Sprint successfully initiated');
      if (completedTasks > 0) {
        achievements.push(`Completed ${completedTasks} tasks`);
      }
      if (completedStoryPoints > 0) {
        achievements.push(`Delivered ${completedStoryPoints} story points`);
      }
    }

    // Sprint goals (using description or default goals)
    const goals = [
      sprint.goals || 'Complete planned sprint tasks',
      `Deliver ${totalStoryPoints} story points`,
      `Complete ${totalTasks} tasks`,
      'Maintain team velocity',
      'Ensure quality deliverables'
    ];

    return {
      sprintName: sprint.name,
      teamName: sprint.team.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      goals: goals.slice(0, 3), // Top 3 goals
      summary: {
        completed: completedStoryPoints,
        total: totalStoryPoints,
        completionRate: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
      },
      taskBreakdown: {
        total: totalTasks,
        completed: completedTasks,
        inProgress: inProgressTasks,
        todo: todoTasks
      },
      achievements: achievements.slice(0, 4), // Top 4 achievements
      teamMembers: Array.from(new Set(sprint.items.map(item => item.owner?.username).filter(Boolean)))
    };
  } catch (error) {
    console.error('Error generating sprint summary report:', error);
    throw error;
  }
}

// Generate Velocity Report
export async function generateVelocityReport(teamId?: number, dateRange?: { start: Date, end: Date }) {
  try {
    const whereClause: any = {};
    
    if (teamId) {
      whereClause.teamId = teamId;
    }
    
    if (dateRange) {
      whereClause.startDate = { gte: dateRange.start };
      whereClause.endDate = { lte: dateRange.end };
    }

    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        team: true,
        items: {
          where: { status: 'done' }
        }
      },
      orderBy: { startDate: 'asc' }
    });

    const velocityData = sprints.map(sprint => {
      const completedPoints = sprint.items.reduce((sum, item) => sum + item.storyPoints, 0);
      return {
        sprintName: sprint.name,
        sprintId: sprint.id,
        teamName: sprint.team.name,
        points: completedPoints,
        tasksCompleted: sprint.items.length,
        startDate: sprint.startDate,
        endDate: sprint.endDate
      };
    });

    const totalPoints = velocityData.reduce((sum, sprint) => sum + sprint.points, 0);
    const averageVelocity = sprints.length > 0 ? totalPoints / sprints.length : 0;

    return {
      sprints: velocityData,
      summary: {
        totalSprints: sprints.length,
        totalPoints,
        averageVelocity: Math.round(averageVelocity * 10) / 10,
        highestVelocity: Math.max(...velocityData.map(s => s.points), 0),
        lowestVelocity: velocityData.length > 0 ? Math.min(...velocityData.map(s => s.points)) : 0
      }
    };
  } catch (error) {
    console.error('Error generating velocity report:', error);
    throw error;
  }
}

// Generate Team Performance Report
export async function generateTeamPerformanceReport(teamId: number, dateRange?: { start: Date, end: Date }) {
  try {
    const team = await prisma.team.findUnique({
      where: { id: teamId },
      include: {
        members: {
          include: {
            ownedItems: {
              where: dateRange ? {
                sprint: {
                  startDate: { gte: dateRange.start },
                  endDate: { lte: dateRange.end }
                }
              } : undefined,
              include: {
                sprint: true
              }
            }
          }
        },
        sprints: {
          where: dateRange ? {
            startDate: { gte: dateRange.start },
            endDate: { lte: dateRange.end }
          } : undefined,
          include: {
            items: true
          }
        }
      }
    });

    if (!team) {
      throw new Error('Team not found');
    }

    // Calculate member performance
    const memberPerformance = team.members.map(member => {
      const totalAssigned = member.ownedItems.reduce((sum, item) => sum + item.storyPoints, 0);
      const totalCompleted = member.ownedItems
        .filter(item => item.status === 'done')
        .reduce((sum, item) => sum + item.storyPoints, 0);
      
      const completionRate = totalAssigned > 0 ? (totalCompleted / totalAssigned) * 100 : 0;

      return {
        username: member.username,
        email: member.email,
        role: member.role,
        totalAssigned,
        totalCompleted,
        tasksAssigned: member.ownedItems.length,
        tasksCompleted: member.ownedItems.filter(item => item.status === 'done').length,
        completionRate: Math.round(completionRate)
      };
    });

    // Calculate team metrics
    const totalTeamPoints = team.sprints.reduce((sum, sprint) => 
      sum + sprint.items.reduce((sprintSum, item) => sprintSum + item.storyPoints, 0), 0
    );
    
    const completedTeamPoints = team.sprints.reduce((sum, sprint) => 
      sum + sprint.items.filter(item => item.status === 'done').reduce((sprintSum, item) => sprintSum + item.storyPoints, 0), 0
    );

    return {
      teamName: team.name,
      reportPeriod: dateRange ? {
        start: dateRange.start,
        end: dateRange.end
      } : null,
      teamMetrics: {
        totalMembers: team.members.length,
        totalSprints: team.sprints.length,
        totalPoints: totalTeamPoints,
        completedPoints: completedTeamPoints,
        teamCompletionRate: totalTeamPoints > 0 ? Math.round((completedTeamPoints / totalTeamPoints) * 100) : 0
      },
      memberPerformance,
      topPerformers: memberPerformance
        .filter(member => member.totalCompleted > 0)
        .sort((a, b) => b.totalCompleted - a.totalCompleted)
        .slice(0, 3)
    };
  } catch (error) {
    console.error('Error generating team performance report:', error);
    throw error;
  }
}

// Generate Burndown Analysis Report
export async function generateBurndownReport(sprintId: number) {
  try {
    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        team: true,
        items: {
          include: {
            owner: true
          }
        }
      }
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const totalStoryPoints = sprint.items.reduce((sum, item) => sum + item.storyPoints, 0);
    const completedStoryPoints = sprint.items
      .filter(item => item.status === 'done')
      .reduce((sum, item) => sum + item.storyPoints, 0);

    const remainingPoints = totalStoryPoints - completedStoryPoints;
    
    // Calculate ideal burndown (linear)
    const sprintDuration = Math.ceil(
      (new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)
    );
    
    const currentDay = Math.min(
      Math.ceil((new Date().getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)),
      sprintDuration
    );

    const idealRemainingPoints = Math.max(0, totalStoryPoints - (totalStoryPoints * currentDay / sprintDuration));
    
    // Risk assessment
    const progressPercentage = totalStoryPoints > 0 ? (completedStoryPoints / totalStoryPoints) * 100 : 0;
    const timeProgressPercentage = (currentDay / sprintDuration) * 100;
    
    let riskLevel = 'Low';
    let riskMessage = 'Sprint is on track';
    
    if (progressPercentage < timeProgressPercentage - 20) {
      riskLevel = 'High';
      riskMessage = 'Sprint is significantly behind schedule';
    } else if (progressPercentage < timeProgressPercentage - 10) {
      riskLevel = 'Medium';
      riskMessage = 'Sprint is slightly behind schedule';
    }

    return {
      sprintName: sprint.name,
      teamName: sprint.team.name,
      totalPoints: totalStoryPoints,
      completedPoints: completedStoryPoints,
      remainingPoints: remainingPoints,
      idealRemainingPoints: Math.round(idealRemainingPoints),
      progressPercentage: Math.round(progressPercentage),
      timeProgressPercentage: Math.round(timeProgressPercentage),
      sprintDuration,
      currentDay,
      riskAssessment: {
        level: riskLevel,
        message: riskMessage
      },
      recommendations: generateRecommendations(riskLevel, remainingPoints, sprintDuration - currentDay)
    };
  } catch (error) {
    console.error('Error generating burndown report:', error);
    throw error;
  }
}

function generateRecommendations(riskLevel: string, remainingPoints: number, remainingDays: number): string[] {
  const recommendations = [];
  
  if (riskLevel === 'High') {
    recommendations.push('Consider reducing sprint scope');
    recommendations.push('Identify and remove blockers immediately');
    recommendations.push('Increase team collaboration and daily standups');
  } else if (riskLevel === 'Medium') {
    recommendations.push('Monitor progress closely');
    recommendations.push('Consider pair programming for complex tasks');
    recommendations.push('Review task priorities and dependencies');
  } else {
    recommendations.push('Maintain current pace');
    recommendations.push('Look for opportunities to help team members');
    recommendations.push('Consider adding stretch goals if capacity allows');
  }
  
  if (remainingDays <= 2 && remainingPoints > 0) {
    recommendations.push('Focus on high-priority items only');
    recommendations.push('Prepare for sprint retrospective discussions');
  }
  
  return recommendations;
}

// Get available sprints for reports
export async function getAvailableSprintsForReports(teamId?: number) {
  try {
    const whereClause = teamId ? { teamId } : {};
    
    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        team: true,
        items: true
      },
      orderBy: { startDate: 'desc' }
    });

    return sprints.map(sprint => ({
      id: sprint.id,
      name: sprint.name,
      teamName: sprint.team.name,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      totalTasks: sprint.items.length,
      completedTasks: sprint.items.filter(item => item.status === 'done').length,
      isActive: new Date() >= new Date(sprint.startDate) && new Date() <= new Date(sprint.endDate)
    }));
  } catch (error) {
    console.error('Error fetching available sprints:', error);
    throw error;
  }
}