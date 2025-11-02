import React, { useState, useEffect } from 'react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { CheckCircle, Clock, Target, AlertCircle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

// TypeScript interfaces for API data
interface Team {
  id: number;
  name: string;
  members?: User[];
}

interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  teamId?: number;
}

interface Sprint {
  id: number;
  name: string;
  startDate: string;
  endDate: string;
  status: string;
  teamId: number;
}

interface VelocityMetric {
  sprintName: string;
  points: number;
  tasksCompleted: number;
  sprintId: number;
}

interface WorkloadMetric {
  userName: string;
  userId: number;
  assignedPoints: number;
  completedPoints: number;
  tasksInProgress: number;
  tasksCompleted: number;
}

interface WorkloadChartData {
  name: string;
  points: number;
  completed: number;
  fill: string;
}

interface PerformanceData {
  dashboardMetrics: {
    totalSprints: number;
    activeSprints: number;
    completedTasks: number;
    averageVelocity: number;
  };
  velocityMetrics: VelocityMetric[];
  workloadMetrics: WorkloadMetric[];
  teamMetrics: {
    teamId: number;
    teamName: string;
    totalMembers: number;
    averageVelocity: number;
    completionRate: number;
  };
}

// --- Dynamic Custom Tooltip for Charts ---
type CustomTooltipProps = {
  active?: boolean;
  payload?: { value: number | string; name?: string }[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg">
        <p className="label text-indigo-300">{`${label}`}</p>
        {payload.map((entry, index) => (
          <p key={index} className="intro text-white">
            {`${entry.name || 'Value'}: ${entry.value}`}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

// --- Main Dynamic Component ---
const PerformancePage = () => {
  const { user } = useAuth();
  
  // State management for dynamic data
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [selectedTeam, setSelectedTeam] = useState<string>('');
  
  // Performance data state
  const [dashboardMetrics, setDashboardMetrics] = useState({
    totalSprints: 0,
    activeSprints: 0,
    completedTasks: 0,
    averageVelocity: 0
  });
  const [velocityData, setVelocityData] = useState<VelocityMetric[]>([]);
  const [workloadData, setWorkloadData] = useState<WorkloadChartData[]>([]);
  const [teamMetrics, setTeamMetrics] = useState({
    teamId: 0,
    teamName: '',
    totalMembers: 0,
    averageVelocity: 0,
    completionRate: 0
  });

  // Authentication and API helper
  const getToken = () => localStorage.getItem('auth_token');
  const API_BASE = 'http://localhost:3000/api';

  // Fetch teams data
  const fetchTeams = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/teams`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTeams(data);
        if (data.length > 0 && !selectedTeam) {
          setSelectedTeam(data[0].id.toString());
        }
      } else {
        setError('Failed to fetch teams data');
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
      setError('Network error while fetching teams');
    }
  };

  // Fetch sprints data
  const fetchSprints = async () => {
    try {
      const token = getToken();
      const response = await fetch(`${API_BASE}/sprints`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        await response.json(); // Sprints loaded for future use
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  // Fetch dashboard metrics
  const fetchDashboardMetrics = async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams({
        type: 'dashboard',
        ...(selectedTeam && { teamId: selectedTeam })
      });
      
      const response = await fetch(`${API_BASE}/performance?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setDashboardMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching dashboard metrics:', error);
    }
  };

  // Fetch velocity metrics
  const fetchVelocityMetrics = async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams({
        type: 'velocity',
        ...(selectedTeam && { teamId: selectedTeam })
      });
      
      console.log('🚀 Fetching velocity data for team:', selectedTeam);
      
      const response = await fetch(`${API_BASE}/performance?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Velocity API Response:', data); // Debug log
        
        // Check if we have sprints data
        if (data.sprints && Array.isArray(data.sprints) && data.sprints.length > 0) {
          // Transform data for chart - using the backend structure
          const chartData = data.sprints.map((sprint: any) => ({
            sprint: sprint.sprintName, // Backend returns sprintName
            points: sprint.points || 0,
            sprintId: sprint.sprintId,
            status: sprint.status || 'UNKNOWN',
            tasksCompleted: sprint.tasksCompleted || 0
          }));
          
          console.log('🔍 Transformed Chart Data:', chartData); // Debug log
          setVelocityData(chartData);
        } else {
          console.warn('⚠️ No sprints data in velocity response, using sample data');
          // Set empty array to trigger sample data usage
          setVelocityData([]);
        }
      } else {
        console.error('❌ Velocity API failed:', response.status, response.statusText);
        setVelocityData([]);
      }
    } catch (error) {
      console.error('❌ Error fetching velocity metrics:', error);
      setVelocityData([]);
    }
  };

  // Fetch team performance and workload
  const fetchWorkloadMetrics = async () => {
    try {
      const token = getToken();
      const params = new URLSearchParams({
        type: 'team',
        ...(selectedTeam && { teamId: selectedTeam })
      });
      
      const response = await fetch(`${API_BASE}/performance?${params}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        console.log('🔍 Workload API Response:', data); // Debug log
        
        // Transform workload data for chart
        const workloadChart = data.members?.map((member: any, index: number) => ({
          name: member.username || `User ${member.userId}`,
          points: member.totalAssigned || 0,
          completed: member.totalCompleted || 0,
          fill: getWorkloadColor(index)
        })) || [];
        
        console.log('🔍 Workload Chart Data:', workloadChart); // Debug log
        setWorkloadData(workloadChart);
        
        // Set team metrics
        if (data.teamName) {
          setTeamMetrics({
            teamId: parseInt(selectedTeam) || 0,
            teamName: data.teamName,
            totalMembers: data.members?.length || 0,
            averageVelocity: data.averageVelocity || 0,
            completionRate: data.completionRate || 0
          });
        }
      } else {
        console.error('❌ Workload API failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Error fetching workload metrics:', error);
    }
  };

  // Helper function for workload colors
  const getWorkloadColor = (index: number) => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff8042', '#00C49F', '#FFBB28', '#FF8A80'];
    return colors[index % colors.length];
  };

  // Calculate dynamic key metrics with fallback sample data
  const keyMetrics = {
    avgVelocity: dashboardMetrics.averageVelocity > 0 
      ? dashboardMetrics.averageVelocity?.toFixed(1) 
      : velocityData.length > 0 
        ? (velocityData.reduce((sum, v) => sum + v.points, 0) / velocityData.length).toFixed(1)
        : '0.0',
    avgWorkload: workloadData.length > 0 
      ? (workloadData.reduce((sum, w) => sum + w.points, 0) / workloadData.length).toFixed(1)
      : '0.0',
    sprintCompletion: teamMetrics.completionRate > 0
      ? `${(teamMetrics.completionRate * 100).toFixed(1)}%`
      : dashboardMetrics.totalSprints > 0 
        ? `${((dashboardMetrics.completedTasks / (dashboardMetrics.totalSprints * 10)) * 100).toFixed(1)}%`
        : '0%',
    avgDaysPerTask: dashboardMetrics.completedTasks > 0 
      ? (dashboardMetrics.totalSprints * 14 / dashboardMetrics.completedTasks).toFixed(1)
      : '0.0'
  };

  // Show sample data message when no real data exists
  const hasNoData = dashboardMetrics.totalSprints === 0 && 
                   dashboardMetrics.activeSprints === 0 && 
                   dashboardMetrics.completedTasks === 0 &&
                   velocityData.length === 0 &&
                   workloadData.length === 0;

  // Sample data for demonstration when database is empty
  const sampleVelocityData = [
    { sprint: 'Sprint 1', points: 23, sprintId: 1 },
    { sprint: 'Sprint 2', points: 31, sprintId: 2 },
    { sprint: 'Sprint 3', points: 35, sprintId: 3 },
    { sprint: 'Sprint 4', points: 29, sprintId: 4 },
    { sprint: 'Sprint 5', points: 33, sprintId: 5 },
  ];

  const sampleWorkloadData = [
    { name: 'John', points: 28, completed: 25, fill: '#6366F1' },
    { name: 'Sarah', points: 24, completed: 22, fill: '#8B5CF6' },
    { name: 'Mike', points: 31, completed: 29, fill: '#06B6D4' },
    { name: 'Lisa', points: 26, completed: 26, fill: '#10B981' },
    { name: 'Alex', points: 22, completed: 20, fill: '#F59E0B' },
  ];

  const sampleMetrics = {
    avgVelocity: '30.0',
    avgWorkload: '26.2',
    sprintCompletion: '91.2%',
    avgDaysPerTask: '2.3'
  };

  // Use sample data when no real data exists
  const displayVelocityData = hasNoData ? sampleVelocityData : (velocityData.length > 0 ? velocityData : sampleVelocityData);
  const displayMetrics = hasNoData ? sampleMetrics : keyMetrics;

  // Load all data on component mount and when filters change
  useEffect(() => {
    if (user) {
      setLoading(true);
      Promise.all([
        fetchTeams(),
        fetchSprints()
      ]).finally(() => setLoading(false));
    }
  }, [user]);

  useEffect(() => {
    if (user && selectedTeam) {
      setLoading(true);
      Promise.all([
        fetchDashboardMetrics(),
        fetchVelocityMetrics(),
        fetchWorkloadMetrics()
      ]).finally(() => setLoading(false));
    }
  }, [user, selectedTeam]);

  // Authentication check
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-6 text-center">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Authentication Required</h2>
          <p className="text-red-300">Please log in to access the Performance Dashboard.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
      {/* Animated Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Page Content */}
      <div className="relative z-10">
        {/* Header with Team Selector */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">Performance Dashboard</h1>
          <p className="text-indigo-300 mb-4">
            Real-time analytics for {teamMetrics.teamName || 'Your Team'}
          </p>
          
          {/* Team Filter */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 max-w-xs">
              <label className="block text-sm font-medium text-gray-300 mb-2">Select Team</label>
              <select
                value={selectedTeam}
                onChange={(e) => setSelectedTeam(e.target.value)}
                className="w-full p-2 bg-slate-800 border border-slate-600 rounded-lg text-white focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">All Teams</option>
                {teams.map(team => (
                  <option key={team.id} value={team.id.toString()}>
                    {team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            <p className="ml-4 text-indigo-300">Loading performance data...</p>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-500/20 border border-red-500/30 rounded-lg p-4 mb-6">
            <p className="text-red-300">{error}</p>
          </div>
        )}

        {/* Main Content */}
        {!loading && !error && (
          <>
            {/* Key Metrics Section - Hide cards with 0.0 values */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6 mb-8">
              {/* Only show Sprint Completion if it's not 0% */}
              {displayMetrics.sprintCompletion !== '0%' && (
                <MetricCard 
                  icon={<CheckCircle />} 
                  title="Sprint Completion" 
                  value={displayMetrics.sprintCompletion} 
                  color="green" 
                />
              )}
              
              {/* Only show Avg Days/Task if it's not 0.0 */}
              {displayMetrics.avgDaysPerTask !== '0.0' && (
                <MetricCard 
                  icon={<Clock />} 
                  title="Avg Days/Task" 
                  value={displayMetrics.avgDaysPerTask} 
                  color="amber" 
                />
              )}
            </div>

            {/* Sample Data Notice */}
            {hasNoData && (
              <div className="mb-6 bg-blue-500/20 border border-blue-500/30 rounded-lg p-4">
                <div className="flex items-center">
                  <AlertCircle className="h-5 w-5 text-blue-400 mr-2" />
                  <p className="text-blue-300 text-sm">
                    <strong>Demo Mode:</strong> Showing sample data since no real data exists yet. 
                    Add teams, sprints, and tasks to see your actual performance metrics.
                  </p>
                </div>
              </div>
            )}

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
              {/* Team Velocity Chart (Larger) */}
              <div className="lg:col-span-3 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-200 mb-1">Team Velocity</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Points completed over recent sprints
                  {!hasNoData && displayVelocityData.length === 0 && " - No velocity data available"}
                  {hasNoData && " - Demo data showing typical team performance"}
                  {displayVelocityData.length > 0 && !hasNoData && ` - ${displayVelocityData.length} sprints shown`}
                </p>
                
                <div className="mb-4 text-xs text-gray-500">
                  Debug: hasNoData={hasNoData.toString()}, velocityData.length={velocityData.length}, displayData.length={displayVelocityData.length}, workloadData.length={workloadData.length}
                </div>
                
                {(displayVelocityData.length > 0) ? (
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart data={displayVelocityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                      <defs>
                        <linearGradient id="velocityGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                      <XAxis dataKey="sprint" stroke="#9CA3AF" fontSize={12} />
                      <YAxis stroke="#9CA3AF" fontSize={12} />
                      <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff1a' }} />
                      <Bar dataKey="points" name="Story Points" radius={[8, 8, 0, 0]} fill="url(#velocityGradient)" />
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[350px] flex items-center justify-center">
                    <div className="text-center">
                      <Target className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <p className="text-gray-400">No sprint data available</p>
                      <p className="text-sm text-gray-500">Create sprints to see velocity metrics</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Team Members List (Instead of Workload Chart) */}
              <div className="lg:col-span-2 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-200 mb-1">Team Members</h3>
                <p className="text-sm text-gray-400 mb-6">
                  Current team member assignments
                </p>
                
                <div className="space-y-3">
                  {workloadData.length > 0 ? (
                    workloadData.map((member, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-800/50 rounded-lg border border-slate-600/30">
                        <div className="flex items-center space-x-3">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: member.fill || '#6366F1' }}
                          ></div>
                          <span className="text-white font-medium">{member.name}</span>
                        </div>
                      
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-8">
                      <div className="text-gray-400 mb-2">No team members assigned</div>
                      <div className="text-sm text-gray-500">Add team members to see assignments</div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Team Stats Summary */}
            {teamMetrics.teamName && (
              <div className="mt-8 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
                <h3 className="text-xl font-semibold text-gray-200 mb-4">Team Summary</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-indigo-400">{teamMetrics.totalMembers}</p>
                    <p className="text-sm text-gray-400">Total Members</p>
                  </div>
                 
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-400">{(teamMetrics.completionRate * 100).toFixed(1)}%</p>
                    <p className="text-sm text-gray-400">Completion Rate</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-purple-400">{dashboardMetrics.totalSprints}</p>
                    <p className="text-sm text-gray-400">Total Sprints</p>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

// --- Reusable Metric Card Component ---
const MetricCard = ({ 
  icon, 
  title, 
  value, 
  color 
}: { 
  icon: React.ReactNode;
  title: string;
  value: string;
  color: string;
}) => {
  const colorClasses = {
    indigo: { bg: 'bg-indigo-500/20', text: 'text-indigo-400' },
    teal: { bg: 'bg-teal-500/20', text: 'text-teal-400' },
    green: { bg: 'bg-green-500/20', text: 'text-green-400' },
    amber: { bg: 'bg-amber-500/20', text: 'text-amber-400' },
  }[color] || { bg: 'bg-gray-500/20', text: 'text-gray-400' };

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-lg flex items-center space-x-4">
      <div className={`p-3 rounded-lg ${colorClasses.bg}`}>
        <div className={colorClasses.text}>{icon}</div>
      </div>
      <div>
        <p className="text-sm text-gray-400">{title}</p>
        <p className="text-2xl font-bold text-white">{value}</p>
      </div>
    </div>
  );
};

export default PerformancePage;