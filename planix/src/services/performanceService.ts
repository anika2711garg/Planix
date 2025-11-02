import { prisma } from '@/lib/prisma';

// Get overall dashboard metrics
export async function getDashboardMetrics() {
  try {
    const [totalSprints, totalBacklogItems, completedItems, totalTeams] = await Promise.all([
      prisma.sprint.count(),
      prisma.backlogItem.count(),
      prisma.backlogItem.count({ where: { status: 'done' } }),
      prisma.team.count()
    ]);

    // Calculate average velocity from completed sprints
    const completedSprints = await prisma.sprint.findMany({
      where: {
        endDate: { lt: new Date() } // Past sprints only
      },
      include: {
        items: {
          where: { status: 'done' }
        }
      }
    });

    const totalVelocity = completedSprints.reduce((sum, sprint) => {
      const sprintPoints = sprint.items.reduce((total, item) => total + item.storyPoints, 0);
      return sum + sprintPoints;
    }, 0);

    const averageVelocity = completedSprints.length > 0 ? totalVelocity / completedSprints.length : 0;

    // Get active sprints by date
    const now = new Date();
    const activeSprints = await prisma.sprint.count({
      where: {
        startDate: { lte: now },
        endDate: { gte: now }
      }
    });

    return {
      totalSprints,
      activeSprints,
      completedTasks: completedItems,
      averageVelocity: Math.round(averageVelocity * 10) / 10
    };
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    throw error;
  }
}

// Get team performance metrics with real workload calculation
export async function getTeamPerformance(teamId?: number) {
  try {
    console.log('🔍 Team performance called with teamId:', teamId);
    
    // Calculate workload distribution from actual task assignments
    const workloadMap = new Map();
    
    if (teamId) {
      // Get specific team information
      const team = await prisma.team.findUnique({
        where: { id: teamId },
        include: {
          members: true,
          sprints: {
            include: {
              items: {
                include: {
                  owner: true
                }
              }
            }
          }
        }
      });

      if (!team) {
        throw new Error(`Team with id ${teamId} not found`);
      }

      console.log('👥 Team found:', team.name, 'with', team.members.length, 'members');

      // Initialize workload for all team members
      team.members.forEach(member => {
        workloadMap.set(member.id, {
          userId: member.id,
          username: member.username,
          totalAssigned: 0,
          totalCompleted: 0,
          tasksAssigned: 0,
          tasksCompleted: 0
        });
      });

      // Calculate from actual assignments within team sprints
      team.sprints.forEach(sprint => {
        sprint.items.forEach(item => {
          console.log(`📋 Item: ${item.title}, Owner: ${item.ownerId}, Points: ${item.storyPoints}`);
          if (item.ownerId && workloadMap.has(item.ownerId)) {
            const workload = workloadMap.get(item.ownerId);
            workload.totalAssigned += item.storyPoints;
            workload.tasksAssigned++;
            
            if (item.status === 'done') {
              workload.totalCompleted += item.storyPoints;
              workload.tasksCompleted++;
            }
          }
        });
      });

      const completedSprints = team.sprints.filter(sprint => sprint.endDate < new Date()) || [];
      const totalVelocity = completedSprints.reduce((sum, sprint) => {
        const sprintPoints = sprint.items
          .filter(item => item.status === 'done')
          .reduce((total, item) => total + item.storyPoints, 0);
        return sum + sprintPoints;
      }, 0);

      const averageVelocity = completedSprints.length > 0 ? totalVelocity / completedSprints.length : 0;
      
      const totalTasks = team.sprints.reduce((sum, sprint) => sum + sprint.items.length, 0) || 0;
      const completedTasks = team.sprints.reduce((sum, sprint) => 
        sum + sprint.items.filter(item => item.status === 'done').length, 0) || 0;
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      console.log('📊 Team workload map:', Array.from(workloadMap.values()));

      return {
        teamName: team.name,
        members: Array.from(workloadMap.values()),
        averageVelocity: Math.round(averageVelocity * 10) / 10,
        completionRate: Math.round(completionRate * 100) / 100,
        totalMembers: team.members.length,
        totalSprints: team.sprints.length
      };
      
    } else {
      // Get all users with their task assignments (All Teams view)
      console.log('📊 Getting workload for all teams...');
      
      const users = await prisma.user.findMany({
        include: {
          team: true,
          ownedItems: {
            include: {
              sprint: true
            }
          }
        }
      });

      console.log('👥 Found users:', users.length);

      // Calculate workload for all users
      users.forEach(user => {
        const totalAssigned = user.ownedItems.reduce((sum, item) => sum + item.storyPoints, 0);
        const totalCompleted = user.ownedItems
          .filter(item => item.status === 'done')
          .reduce((sum, item) => sum + item.storyPoints, 0);
        const tasksAssigned = user.ownedItems.length;
        const tasksCompleted = user.ownedItems.filter(item => item.status === 'done').length;

        console.log(`👤 ${user.username}: ${totalAssigned} pts assigned, ${totalCompleted} pts completed`);

        workloadMap.set(user.id, {
          userId: user.id,
          username: user.username,
          totalAssigned,
          totalCompleted,
          tasksAssigned,
          tasksCompleted
        });
      });

      // Calculate overall metrics
      const allSprints = await prisma.sprint.findMany({
        include: {
          items: true
        }
      });

      const completedSprints = allSprints.filter(sprint => sprint.endDate < new Date());
      const totalVelocity = completedSprints.reduce((sum, sprint) => {
        const sprintPoints = sprint.items
          .filter(item => item.status === 'done')
          .reduce((total, item) => total + item.storyPoints, 0);
        return sum + sprintPoints;
      }, 0);

      const averageVelocity = completedSprints.length > 0 ? totalVelocity / completedSprints.length : 0;
      
      const totalTasks = allSprints.reduce((sum, sprint) => sum + sprint.items.length, 0);
      const completedTasks = allSprints.reduce((sum, sprint) => 
        sum + sprint.items.filter(item => item.status === 'done').length, 0);
      const completionRate = totalTasks > 0 ? completedTasks / totalTasks : 0;

      console.log('📊 All teams workload map:', Array.from(workloadMap.values()));

      return {
        teamName: 'All Teams',
        members: Array.from(workloadMap.values()),
        averageVelocity: Math.round(averageVelocity * 10) / 10,
        completionRate: Math.round(completionRate * 100) / 100,
        totalMembers: users.length,
        totalSprints: allSprints.length
      };
    }
  } catch (error) {
    console.error('❌ Error fetching team performance:', error);
    throw error;
  }
}

// Get sprint performance metrics
export async function getSprintPerformance(sprintId?: number) {
  try {
    const whereClause = sprintId ? { id: sprintId } : {};
    
    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        team: true,
        items: {
          include: {
            owner: true
          }
        }
      }
    });

    return sprints.map(sprint => {
      const totalItems = sprint.items.length;
      const completedItems = sprint.items.filter((item: any) => item.status === 'done').length;
      const totalStoryPoints = sprint.items.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0);
      const completedStoryPoints = sprint.items
        .filter((item: any) => item.status === 'done')
        .reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0);

      const completionRate = totalItems > 0 ? (completedItems / totalItems) * 100 : 0;
      const velocity = completedStoryPoints;

      // Determine sprint status based on dates
      const now = new Date();
      const startDate = new Date(sprint.startDate);
      const endDate = new Date(sprint.endDate);
      
      let status = 'PLANNING';
      if (now >= startDate && now <= endDate) {
        status = 'ACTIVE';
      } else if (now > endDate) {
        status = 'COMPLETED';
      }

      return {
        id: sprint.id,
        name: sprint.name,
        teamName: sprint.team.name,
        status: status,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        totalItems,
        completedItems,
        totalStoryPoints,
        completedStoryPoints,
        completionRate: Math.round(completionRate * 100) / 100,
        velocity
      };
    });
  } catch (error) {
    console.error('Error fetching sprint performance:', error);
    throw error;
  }
}

// Get velocity metrics for teams - calculated from completed tasks
export async function getVelocityMetrics(teamId?: number) {
  try {
    console.log('🔍 Velocity API called with teamId:', teamId);
    
    const whereClause = teamId ? { teamId } : {};
    
    // Get all sprints (not just completed ones for testing)
    const sprints = await prisma.sprint.findMany({
      where: whereClause,
      include: {
        team: true,
        items: true // Get all items first, then filter by status
      },
      orderBy: {
        startDate: 'asc' // Chronological order
      }
    });

    console.log('🔍 Found sprints:', sprints.length);

    // Transform to velocity chart data
    const velocityChartData = sprints.map(sprint => {
      // Get completed items only
      const completedItems = sprint.items.filter(item => item.status === 'done');
      const totalPoints = completedItems.reduce((sum, item) => sum + (item.storyPoints || 0), 0);
      const tasksCompleted = completedItems.length;
      
      console.log(`📊 Sprint ${sprint.name}: ${totalPoints} points, ${tasksCompleted} tasks completed`);

      return {
        sprintName: sprint.name,
        points: totalPoints,
        tasksCompleted,
        sprintId: sprint.id,
        teamName: sprint.team.name,
        startDate: sprint.startDate,
        endDate: sprint.endDate,
        status: sprint.endDate < new Date() ? 'COMPLETED' : 'ACTIVE'
      };
    });

    // Calculate average velocity from completed sprints only
    const completedSprints = velocityChartData.filter(sprint => sprint.status === 'COMPLETED');
    const averageVelocity = completedSprints.length > 0 
      ? Math.round((completedSprints.reduce((sum, sprint) => sum + sprint.points, 0) / completedSprints.length) * 10) / 10
      : 0;

    console.log('📈 Velocity chart data:', velocityChartData);
    console.log('📊 Average velocity:', averageVelocity);

    return {
      sprints: velocityChartData,
      averageVelocity,
      totalSprints: sprints.length,
      completedSprints: completedSprints.length
    };
  } catch (error) {
    console.error('❌ Error fetching velocity metrics:', error);
    throw error;
  }
}

// Get burndown chart data for sprint
export async function getBurndownData(sprintId?: number) {
  try {
    if (!sprintId) {
      // Get the most recent active sprint
      const now = new Date();
      const activeSprint = await prisma.sprint.findFirst({
        where: {
          startDate: { lte: now },
          endDate: { gte: now }
        },
        orderBy: { startDate: 'desc' }
      });
      
      if (!activeSprint) {
        return { message: 'No active sprint found' };
      }
      sprintId = activeSprint.id;
    }

    const sprint = await prisma.sprint.findUnique({
      where: { id: sprintId },
      include: {
        items: true
      }
    });

    if (!sprint) {
      throw new Error('Sprint not found');
    }

    const totalStoryPoints = sprint.items.reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0);
    const completedStoryPoints = sprint.items
      .filter((item: any) => item.status === 'done')
      .reduce((sum: number, item: any) => sum + (item.storyPoints || 0), 0);

    const remainingStoryPoints = totalStoryPoints - completedStoryPoints;

    // Calculate ideal burndown line
    const startDate = new Date(sprint.startDate);
    const endDate = new Date(sprint.endDate);
    const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
    const dailyBurnRate = totalStoryPoints / totalDays;

    const burndownData = [];
    for (let i = 0; i <= totalDays; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);
      
      burndownData.push({
        date: currentDate.toISOString().split('T')[0],
        ideal: Math.max(0, totalStoryPoints - (dailyBurnRate * i)),
        actual: i === totalDays ? remainingStoryPoints : totalStoryPoints // Simplified - in real scenario, track daily
      });
    }

    return {
      sprintName: sprint.name,
      totalStoryPoints,
      completedStoryPoints,
      remainingStoryPoints,
      burndownData
    };
  } catch (error) {
    console.error('Error fetching burndown data:', error);
    throw error;
  }
}

// Get task completion metrics
export async function getCompletionMetrics(teamId?: number, startDate?: string, endDate?: string) {
  try {
    const whereClause: any = {};
    
    if (teamId) {
      whereClause.sprint = {
        teamId
      };
    }

    if (startDate && endDate) {
      whereClause.updatedAt = {
        gte: new Date(startDate),
        lte: new Date(endDate)
      };
    }

    const backlogItems = await prisma.backlogItem.findMany({
      where: whereClause,
      include: {
        owner: true,
        sprint: {
          include: {
            team: true
          }
        }
      }
    });

    // Group by status
    const statusMetrics = backlogItems.reduce((acc: any, item) => {
      const status = item.status || 'unknown';
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    // Group by type
    const typeMetrics = backlogItems.reduce((acc: any, item) => {
      const type = item.type || 'unknown';
      if (!acc[type]) {
        acc[type] = 0;
      }
      acc[type]++;
      return acc;
    }, {});

    // Group by priority
    const priorityMetrics = backlogItems.reduce((acc: any, item) => {
      const priority = item.priority || 0;
      const priorityLabel = priority >= 3 ? 'High' : priority >= 2 ? 'Medium' : 'Low';
      if (!acc[priorityLabel]) {
        acc[priorityLabel] = 0;
      }
      acc[priorityLabel]++;
      return acc;
    }, {});

    return {
      total: backlogItems.length,
      statusBreakdown: statusMetrics,
      typeBreakdown: typeMetrics,
      priorityBreakdown: priorityMetrics
    };
  } catch (error) {
    console.error('Error fetching completion metrics:', error);
    throw error;
  }
}