import { useState } from 'react';
import { AlertCircle, CheckCircle } from 'lucide-react';

interface Recommendation {
  id: string;
  type: 'alert' | 'opportunity';
  title: string;
  description: string;
}

const initialRecommendations: Recommendation[] = [
  {
    id: '1',
    type: 'alert',
    title: 'High risk of delay detected',
    description: "Task-123 'Implement user authentication' is falling behind. Suggestion: Move this task to the next sprint to secure the current sprint goal."
  },
  {
    id: '2',
    type: 'opportunity',
    title: 'Available capacity detected',
    description: "Developer Sarah has available capacity. Suggestion: Assign Task-456 'API integration' to accelerate progress."
  },
  {
    id: '3',
    type: 'alert',
    title: 'Workload imbalance detected',
    description: "John has 35 story points while the team average is 20. Suggestion: Redistribute 2-3 tasks to balance workload."
  }
];

const AIRecommendations = () => {
  const [recommendations, setRecommendations] = useState(initialRecommendations);

  const handleAccept = (id: string) => {
    setRecommendations(recommendations.filter(rec => rec.id !== id));
  };

  const handleDismiss = (id: string) => {
    setRecommendations(recommendations.filter(rec => rec.id !== id));
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-200 mb-6">AI Recommendations</h3>
      <div className="space-y-4">
        {recommendations.map((rec) => (
          <div
            key={rec.id}
            className={`border rounded-lg p-4 ${
              rec.type === 'alert'
                ? 'bg-red-900/10 border-red-700/50'
                : 'bg-green-900/10 border-green-700/50'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {rec.type === 'alert' ? (
                  <AlertCircle className="text-red-400" size={20} />
                ) : (
                  <CheckCircle className="text-green-400" size={20} />
                )}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-white mb-1">{rec.title}</h4>
                <p className="text-gray-400 text-sm mb-3">{rec.description}</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAccept(rec.id)}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Accept
                  </button>
                  <button
                    onClick={() => handleDismiss(rec.id)}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    Dismiss
                  </button>
                </div>
              </div>
            </div>
          </div>
        ))}
        {recommendations.length === 0 && (
          <div className="text-center py-8 text-gray-400">
            <CheckCircle className="mx-auto mb-2" size={48} />
            <p>No recommendations at this time. Great work!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIRecommendations;
