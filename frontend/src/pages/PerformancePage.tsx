import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer, 
  Cell
} from 'recharts';
import { TrendingUp, Users, CheckCircle, Clock } from 'lucide-react';
import { useMemo } from 'react';

// --- Data (can be moved to a separate file or fetched from an API) ---
const velocityData = [
  { sprint: 'Sprint 19', points: 45 },
  { sprint: 'Sprint 20', points: 52 },
  { sprint: 'Sprint 21', points: 48 },
  { sprint: 'Sprint 22', points: 55 },
  { sprint: 'Sprint 23', points: 50 }
];

const workloadData = [
  { name: 'John', points: 28, fill: '#8884d8' },
  { name: 'Sarah', points: 24, fill: '#82ca9d' },
  { name: 'Mike', points: 20, fill: '#ffc658' },
  { name: 'Alex', points: 18, fill: '#ff8042' },
  { name: 'Emma', points: 22, fill: '#00C49F' }
];

// --- Custom Tooltip for Charts ---
// --- Custom Tooltip for Charts ---

// Define a specific type for the props your component will receive
type CustomTooltipProps = {
  active?: boolean;
  payload?: { value: number | string }[]; // payload is an array of objects
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg">
        <p className="label text-indigo-300">{`${label}`}</p>
        <p className="intro text-white">{`Points: ${payload[0].value}`}</p>
      </div>
    );
  }
  return null;
};


// --- Main Component ---
const PerformancePage = () => {
  
  // Calculate metrics dynamically instead of hardcoding them
  const keyMetrics = useMemo(() => {
    const totalVelocity = velocityData.reduce((sum, s) => sum + s.points, 0);
    const totalWorkload = workloadData.reduce((sum, w) => sum + w.points, 0);

    return {
      avgVelocity: (totalVelocity / velocityData.length).toFixed(1),
      avgWorkload: (totalWorkload / workloadData.length).toFixed(1),
      sprintCompletion: '92%', // Example static value
      avgDaysPerTask: '2.1',   // Example static value
    };
  }, []);

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
      {/* Animated Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>

      {/* Page Content */}
      <div className="relative z-10">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">Performance Dashboard</h1>
          <p className="text-indigo-300">Analytics for AI Sprint Optimizer Team</p>
        </div>

        {/* Key Metrics Section */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
          <MetricCard icon={<TrendingUp />} title="Average Velocity" value={keyMetrics.avgVelocity} color="indigo" />
          <MetricCard icon={<Users />} title="Avg Points/Person" value={keyMetrics.avgWorkload} color="teal" />
          <MetricCard icon={<CheckCircle />} title="Sprint Completion" value={keyMetrics.sprintCompletion} color="green" />
          <MetricCard icon={<Clock />} title="Avg Days/Task" value={keyMetrics.avgDaysPerTask} color="amber" />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Team Velocity Chart (Larger) */}
          <div className="lg:col-span-3 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-1">Team Velocity</h3>
            <p className="text-sm text-gray-400 mb-6">Points completed over the last 5 sprints</p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={velocityData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
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
          </div>

          {/* Workload Distribution Chart (Smaller) */}
          <div className="lg:col-span-2 bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg">
            <h3 className="text-xl font-semibold text-gray-200 mb-1">Workload Distribution</h3>
            <p className="text-sm text-gray-400 mb-6">Current sprint points per member</p>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={workloadData} layout="vertical" margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
                <XAxis type="number" stroke="#9CA3AF" fontSize={12} />
                <YAxis type="category" dataKey="name" stroke="#9CA3AF" fontSize={12} width={50} />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: '#ffffff1a' }} />
                <Bar dataKey="points" name="Assigned Points" radius={[0, 8, 8, 0]}>
                  {workloadData.map((entry) => (
                    <Cell key={`cell-${entry.name}`} fill={entry.fill} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- Reusable Metric Card Component ---
const MetricCard = ({ icon, title, value, color }: { icon: React.ReactNode, title: string, value: string, color: string }) => {
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