import React from 'react';
import { AlertCircle, Zap, BarChart } from 'lucide-react';

interface Recommendation {
  type: string;
  title: string;
  message: string;
  priority: 'high' | 'medium' | 'low';
}

interface RLPrediction {
  reorderedItems: any[];
  recommendations: Recommendation[];
  confidence: number;
  reasoning: string;
}

interface Props {
  prediction?: RLPrediction;
  isLoading: boolean;
  onApplyRecommendations: (reorderedItems: any[]) => void;
}

const RLRecommendations: React.FC<Props> = ({
  prediction,
  isLoading,
  onApplyRecommendations,
}) => {
  if (isLoading) {
    return (
      <div className="p-4 bg-gray-50 rounded-lg animate-pulse">
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/2"></div>
      </div>
    );
  }

  if (!prediction) {
    return null;
  }

  const getPriorityColor = (priority: string) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'text-red-600 bg-red-50';
      case 'medium':
        return 'text-yellow-600 bg-yellow-50';
      case 'low':
        return 'text-green-600 bg-green-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold flex items-center">
          <Zap className="w-5 h-5 mr-2 text-blue-500" />
          AI Sprint Recommendations
        </h3>
        <div className="flex items-center">
          <BarChart className="w-4 h-4 mr-1 text-blue-500" />
          <span className="text-sm">
            Confidence: {(prediction.confidence * 100).toFixed(1)}%
          </span>
        </div>
      </div>

      {prediction.recommendations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Suggestions:</h4>
          <div className="space-y-2">
            {prediction.recommendations.map((rec, index) => (
              <div
                key={index}
                className={`p-3 rounded-md ${getPriorityColor(rec.priority)}`}
              >
                <h5 className="font-medium text-sm">{rec.title}</h5>
                <p className="text-sm mt-1">{rec.message}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {prediction.reasoning && (
        <div className="mb-4">
          <h4 className="text-sm font-medium mb-2">Reasoning:</h4>
          <p className="text-sm text-gray-600 bg-gray-50 p-3 rounded">
            {prediction.reasoning}
          </p>
        </div>
      )}

      {prediction.reorderedItems.length > 0 && (
        <div className="mt-4">
          <button
            onClick={() => onApplyRecommendations(prediction.reorderedItems)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition-colors"
          >
            Apply Recommended Order
          </button>
        </div>
      )}
    </div>
  );
};

export default RLRecommendations;