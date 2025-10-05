import { Clock, Target, AlertTriangle } from 'lucide-react';

export const ProgressCard = () => {
  const progress = 65;
  const completed = 52;
  const total = 80;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Sprint Progress</h3>
        <Target className="text-blue-400" size={24} />
      </div>
      <div className="flex items-center justify-center mb-4">
        <div className="relative w-32 h-32">
          <svg className="transform -rotate-90 w-32 h-32">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              className="text-gray-700"
            />
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="transparent"
              strokeDasharray={`${2 * Math.PI * 56}`}
              strokeDashoffset={`${2 * Math.PI * 56 * (1 - progress / 100)}`}
              className="text-blue-500"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-3xl font-bold text-white">{progress}%</span>
          </div>
        </div>
      </div>
      <div className="text-center">
        <p className="text-gray-400 text-sm">Story Points</p>
        <p className="text-2xl font-bold text-white">{completed}/{total}</p>
      </div>
    </div>
  );
};

export const TimeRemainingCard = () => {
  const daysLeft = 8;

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Time Remaining</h3>
        <Clock className="text-green-400" size={24} />
      </div>
      <div className="flex flex-col items-center justify-center py-8">
        <p className="text-6xl font-bold text-white mb-2">{daysLeft}</p>
        <p className="text-xl text-gray-400">Days Left</p>
      </div>
    </div>
  );
};

export const SprintRiskCard = () => {
  const riskLevel = 'Low';
  const riskColor = riskLevel === 'Low' ? 'text-green-500' : riskLevel === 'Medium' ? 'text-yellow-500' : 'text-red-500';
  const bgColor = riskLevel === 'Low' ? 'bg-green-900/20' : riskLevel === 'Medium' ? 'bg-yellow-900/20' : 'bg-red-900/20';

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-200">Sprint Risk</h3>
        <AlertTriangle className={riskColor} size={24} />
      </div>
      <div className="flex flex-col items-center justify-center py-8">
        <div className={`${bgColor} px-6 py-3 rounded-lg`}>
          <p className={`text-3xl font-bold ${riskColor}`}>{riskLevel}</p>
        </div>
        <p className="text-gray-400 mt-4 text-sm">Risk of Delay</p>
      </div>
    </div>
  );
};
