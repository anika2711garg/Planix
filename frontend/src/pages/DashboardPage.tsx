import React, { useEffect, useState, FC } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Target, CalendarDays, ShieldCheck, Lightbulb, TrendingUp, AlertTriangle } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useDashboard } from '../hooks/useApi';

// Types
interface ChartPoint {
  day: number;
  ideal: number | null;
  actual: number | null;
  predicted: number | null;
}

interface SprintData {
  id: number;
  startDate: string;
  endDate: string;
  items: any[];
  // Add other fields as needed
}

interface BurndownChartProps {
  currentSprint: SprintData | null;
}

// --- Reusable Custom Tooltip for Charts ---

// Define a specific type for the objects inside the 'payload' array
type TooltipPayload = {
  name: string;
  value: number;
  color: string;
};

// Define a specific type for the tooltip's props
type CustomTooltipProps = {
  active?: boolean;
  payload?: TooltipPayload[];
  label?: string;
};

const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
  if (active && payload && payload.length) {
    return (
      <div className="p-4 bg-slate-800/80 backdrop-blur-sm border border-white/10 rounded-lg shadow-lg text-sm">
        <p className="label text-indigo-300">{`Day ${label}`}</p>
        {/* TypeScript now knows 'pld' is of type TooltipPayload, so 'any' is not needed */}
        {payload.map((pld) => (
          <div key={pld.name} style={{ color: pld.color }}>
            {`${pld.name}: ${pld.value} pts`}
          </div>
        ))}
      </div>
    );
  }
  return null;
};

// --- CARD COMPONENTS ---

const ProgressCard = ({ currentSprint }: { currentSprint: any }) => {
  const progress = currentSprint?.progressPercentage || 0;
  const completedPoints = currentSprint?.completedStoryPoints || 0;
  const totalPoints = currentSprint?.totalStoryPoints || 0;
  const circumference = 2 * Math.PI * 45; // 2 * pi * radius

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col justify-between h-full">
      <div>
        <div className="flex items-center text-gray-400 mb-4">
          <Target size={18} className="mr-2" />
          <h3 className="font-semibold">Sprint Progress</h3>
        </div>
        <p className="text-gray-400 text-sm">You've completed {completedPoints} of {totalPoints} story points.</p>
      </div>
      <div className="relative flex items-center justify-center mt-4">
        <svg className="w-32 h-32 transform -rotate-90">
          <circle cx="64" cy="64" r="45" stroke="#ffffff1a" strokeWidth="10" fill="transparent" />
          <circle
            cx="64"
            cy="64"
            r="45"
            stroke="#A78BFA"
            strokeWidth="10"
            fill="transparent"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference - (progress / 100) * circumference}
            className="transition-all duration-1000 ease-in-out"
          />
        </svg>
        <span className="absolute text-3xl font-bold text-white">{progress}%</span>
      </div>
    </div>
  );
};

const TimeRemainingCard = ({ currentSprint }: { currentSprint: any }) => {
  const daysRemaining = currentSprint?.daysRemaining || 0;
  const endDate = currentSprint?.endDate ? new Date(currentSprint.endDate).toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  }) : 'No sprint active';

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col justify-center items-center text-center h-full">
      <div className="flex items-center text-gray-400 mb-2">
        <CalendarDays size={18} className="mr-2" />
        <h3 className="font-semibold">Time Remaining</h3>
      </div>
      <p className="text-6xl font-bold text-white my-2">{daysRemaining}</p>
      <p className="text-gray-400">days left</p>
      <p className="text-sm text-indigo-300 mt-2">Sprint ends {endDate}</p>
    </div>
  );
};

const SprintRiskCard = ({ currentSprint, riskData }: { currentSprint: any; riskData?: any }) => {
  const riskLevel = riskData?.risk_level || 'Unknown';
  const riskColor = riskLevel === 'Low' ? 'text-green-400' :
                   riskLevel === 'Medium' ? 'text-yellow-400' : 'text-red-400';

  const message = riskData?.message || 
    'Sprint is at high risk. Consider scope adjustment or additional resources.';

  const successRate = riskData?.predicted_success_score
    ? `${(riskData.predicted_success_score * 100).toFixed(1)}%`
    : 'N/A';

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg flex flex-col justify-center items-center text-center h-full">
      <div className="flex items-center text-gray-400 mb-2">
        <ShieldCheck size={18} className="mr-2" />
        <h3 className="font-semibold">Sprint Risk</h3>
      </div>

      <p className={`text-4xl font-bold my-2 ${riskColor}`}>{riskLevel}</p>
      <p className="text-lg text-gray-300 mb-2">AI Success Rate: <span className="font-semibold">{successRate}</span></p>
      <p className="text-gray-400">{message}</p>
    </div>
  );
};


// --- CHART & RECOMMENDATIONS COMPONENTS ---

const PredictiveBurndownChart: FC<BurndownChartProps> = ({ currentSprint }) => {
  const [burndownData, setBurndownData] = useState<ChartPoint[]>([]);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchBurndownData = async () => {
      if (!currentSprint?.id) return;

      console.log('Fetching burndown data for sprint:', currentSprint.id);

      try {
        const apiBase = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000';
        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (token) headers["Authorization"] = `Bearer ${token}`;

        const res = await fetch(`${apiBase}/api/ts_forecast`, {
          method: "POST",
          headers,
          credentials: "include",
          body: JSON.stringify({ sprintId: currentSprint.id }),
        });

        if (!res.ok) {
          console.warn('Failed to fetch burndown data, using fallback');
          return;
        }

        const data = await res.json();
        if (data.series) {
          console.log('Received forecast data:', data);
          const formattedData = data.series.map((point: any) => ({
            day: parseInt(point.day.replace('Day ', '')),
            ideal: point.ideal,
            actual: point.actual,
            predicted: point.predicted
          }));
          console.log('Formatted chart data:', formattedData);
          setBurndownData(formattedData);
        }
      } catch (error) {
        console.error('Error fetching burndown data:', error);
      }
    };

    fetchBurndownData();
  }, [currentSprint?.id, token]);

  // Use real data if available, otherwise show a sample pattern
  const data: ChartPoint[] = burndownData.length > 0 ? burndownData : [
    { day: 1, ideal: 100, actual: 100 },
    { day: 2, ideal: 90, actual: 95 },
    { day: 3, ideal: 80, actual: 85 },
    { day: 4, ideal: 70, actual: 78 },
    { day: 5, ideal: 60, actual: 65 },
    { day: 6, ideal: 50, actual: 60, predicted: 58 },
    { day: 7, ideal: 40, predicted: 52 },
    { day: 8, ideal: 30, predicted: 45 },
    { day: 9, ideal: 20, predicted: 35 },
    { day: 10, ideal: 10, predicted: 22 },
    { day: 11, ideal: 0, predicted: 10 },
  ].map(item => ({
    ...item,
    day: item.day, // Keep day as number for sorting
    ideal: typeof item.ideal === 'number' ? Number(item.ideal.toFixed(1)) : null,
    actual: typeof item.actual === 'number' ? Number(item.actual.toFixed(1)) : null,
    predicted: typeof item.predicted === 'number' ? Number(item.predicted.toFixed(1)) : null,
  }));

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg h-full">
      <h3 className="text-xl font-semibold text-gray-200 mb-1">Predictive Burndown</h3>
      <p className="text-sm text-gray-400 mb-6">
        Tracking progress against ideal flow with AI-powered forecasting
        {data.length > 0 && data[0].actual && ` • Starting with ${data[0].actual} points`}
      </p>
      {data.some(d => d.predicted !== null) ? (
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff1a" />
            <XAxis dataKey="day" stroke="#9CA3AF" fontSize={12} label={{ value: 'Sprint Day', position: 'insideBottom', offset: -5, fill: '#9CA3AF' }} />
            <YAxis stroke="#9CA3AF" fontSize={12} label={{ value: 'Points', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
            <Tooltip content={<CustomTooltip />} />
            <Legend wrapperStyle={{fontSize: "14px"}} />
            <Line type="monotone" dataKey="ideal" stroke="#4B5563" strokeWidth={2} name="Ideal" dot={false} />
            <Line type="monotone" dataKey="actual" stroke="#3B82F6" strokeWidth={2} name="Actual" dot={{ r: 4 }} />
            <Line type="monotone" dataKey="predicted" stroke="#A78BFA" strokeWidth={2} strokeDasharray="5 5" name="Predicted" />
          </LineChart>
        </ResponsiveContainer>
      ) : (
        <div className="flex items-center justify-center h-[300px] text-gray-400">
          <p>Loading forecast data...</p>
        </div>
      )}
    </div>
  );
};

const AIRecommendations = ({ recommendations }: { recommendations: any[] }) => {
  const defaultRecommendations = [
    { type: 'scope', title: "Scope Adjustment", message: "Consider moving some items to the next sprint to reduce risk.", priority: 'medium' },
    { type: 'velocity', title: "Velocity Boost", message: "Team has available capacity for additional tasks.", priority: 'low' },
    { type: 'blocker', title: "No Critical Issues", message: "All sprint items are progressing smoothly.", priority: 'low' },
  ];

  const displayRecommendations = recommendations && recommendations.length > 0 ? recommendations : defaultRecommendations;

  const getIcon = (type: string) => {
    switch (type) {
      case 'scope': return <Lightbulb className="text-yellow-400" />;
      case 'velocity': return <TrendingUp className="text-green-400" />;
      case 'blocker': return <AlertTriangle className="text-red-400" />;
      default: return <Lightbulb className="text-blue-400" />;
    }
  };

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg h-full">
      <h3 className="text-xl font-semibold text-gray-200 mb-1">AI-Powered Insights ✨</h3>
      <p className="text-sm text-gray-400 mb-6">Proactive recommendations to keep your sprint on track.</p>
      <div className="space-y-4">
        {displayRecommendations.map((rec, index) => (
          <div key={index} className="flex items-start p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200">
            <div className="p-2 mr-4">{getIcon(rec.type)}</div>
            <div>
              <h4 className="font-semibold text-white">{rec.title}</h4>
              <p className="text-sm text-gray-400">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-black/30 backdrop-blur-lg rounded-2xl p-6 border border-white/10 shadow-lg h-full">
      <h3 className="text-xl font-semibold text-gray-200 mb-1">AI-Powered Insights ✨</h3>
      <p className="text-sm text-gray-400 mb-6">Proactive recommendations to keep your sprint on track.</p>
      <div className="space-y-4">
        {displayRecommendations.map((rec, index) => (
          <div key={index} className="flex items-start p-4 bg-white/5 rounded-lg hover:bg-white/10 transition-colors duration-200">
            <div className="p-2 mr-4">{getIcon(rec.type)}</div>
            <div>
              <h4 className="font-semibold text-white">{rec.title}</h4>
              <p className="text-sm text-gray-400">{rec.message}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};


// --- MAIN DASHBOARD PAGE ---

const DashboardPage = () => {
  const { user } = useAuth();
  const { dashboardData, loading, error } = useDashboard();
  const currentSprint = dashboardData?.currentSprint;
  const [riskData, setRiskData] = useState<any>(null);
  const token = localStorage.getItem("token");

useEffect(() => {
  if (!currentSprint?.id) return;

  // Cache the prediction response in memory
  const predictionCache = new Map();
  const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  const fetchPrediction = async () => {
    // Check cache first
    const cacheKey = `sprint_${currentSprint.id}`;
    const cached = predictionCache.get(cacheKey);
    if (cached && (Date.now() - cached.timestamp < CACHE_TTL)) {
      setRiskData(cached.data);
      return;
    }

    try {
      // Use Vite env var if provided, otherwise default to localhost:3000 (Next.js dev)
      const apiBase = (import.meta.env.VITE_API_BASE as string) || 'http://localhost:3000';
      const headers: Record<string, string> = { "Content-Type": "application/json" };
      if (token) headers["Authorization"] = `Bearer ${token}`;

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

      const res = await fetch(`${apiBase}/api/ai/predictSprintSuccess`, {
        method: "POST",
        headers,
        signal: controller.signal,
        // NOTE: credentials are only needed if backend uses cookies; keep if required
        credentials: "include",
        body: JSON.stringify({ sprintId: currentSprint.id }),
      });

      clearTimeout(timeoutId);

      if (!res.ok) {
        console.warn(`Prediction fetch failed (${res.status}) — using fallback data.`);
        // Use fallback data if unauthorized or server error
        const fallback = {
          risk_level: "Low",
          predicted_success_score: 0.88, // 88%
          message: "AI prediction (fallback).",
        };
        setRiskData(fallback);
        predictionCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
        return;
      }

      const data = await res.json();
      // Handle invalid or empty response
      if (!data || !data.predicted_success_score) {
        console.warn("No valid data returned — using fallback.");
        const fallback = {
          risk_level: "Low",
          predicted_success_score: 0.88,
          message: "Default AI prediction (no valid data).",
        };
        setRiskData(fallback);
        predictionCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
        return;
      }

      // Cache the successful response
      predictionCache.set(cacheKey, { data, timestamp: Date.now() });
      setRiskData(data);
    } catch (error) {
      console.error("Prediction fetch error:", error);
      // 👇 Show fallback if any network or parsing error
      const fallback = {
        risk_level: "Low",
        predicted_success_score: 0.88,
        message: "Default AI prediction (network error).",
      };
      setRiskData(fallback);
      predictionCache.set(cacheKey, { data: fallback, timestamp: Date.now() });
    }
  };

  // Use an immediate async-IIFE to avoid state setting during render
  (async () => {
    await fetchPrediction();
  })();

  // Cleanup function to abort any in-flight requests
  return () => {
    // Cache will be garbage collected when component unmounts
    predictionCache.clear();
  };
}, [currentSprint?.id, token]); // Only re-run if sprint ID or auth token changes

  if (loading) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="relative min-h-screen w-full flex items-center justify-center bg-slate-900 text-white">
        <div className="text-center">
          <p className="text-red-400 mb-4">Error: {error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  const aiRecommendations = dashboardData?.aiRecommendations || [];

  return (
    <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
      {/* Animated Aurora Background */}
      <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
      <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>
      <div className="absolute -bottom-8 left-20 w-72 h-72 bg-blue-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-4000"></div>
      
      <div className="relative z-10">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-1">
            Welcome, {user?.username || 'User'}!
          </h1>
          <p className="text-indigo-300">
            {currentSprint ? (
              `${currentSprint.name} - ${new Date(currentSprint.startDate).toLocaleDateString()} to ${new Date(currentSprint.endDate).toLocaleDateString()}`
            ) : (
              'No active sprint'
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          <ProgressCard currentSprint={currentSprint} />
          <TimeRemainingCard currentSprint={currentSprint} />
          <SprintRiskCard currentSprint={currentSprint} riskData={riskData} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3">
            <PredictiveBurndownChart currentSprint={currentSprint} />
          </div>
          <div className="lg:col-span-2">
            <AIRecommendations recommendations={aiRecommendations} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;