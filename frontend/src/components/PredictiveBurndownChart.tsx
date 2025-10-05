import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const mockData = [
  { day: 'Day 1', ideal: 80, actual: 80, predicted: 80 },
  { day: 'Day 2', ideal: 70, actual: 75, predicted: 75 },
  { day: 'Day 3', ideal: 60, actual: 68, predicted: 68 },
  { day: 'Day 4', ideal: 50, actual: 60, predicted: 60 },
  { day: 'Day 5', ideal: 40, actual: 52, predicted: 52 },
  { day: 'Day 6', ideal: 30, actual: null, predicted: 45 },
  { day: 'Day 7', ideal: 20, actual: null, predicted: 38 },
  { day: 'Day 8', ideal: 10, actual: null, predicted: 30 },
  { day: 'Day 9', ideal: 0, actual: null, predicted: 22 },
  { day: 'Day 10', ideal: 0, actual: null, predicted: 15 }
];

const PredictiveBurndownChart = () => {
  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-6">
      <h3 className="text-xl font-semibold text-gray-200 mb-6">Predictive Burndown Chart</h3>
      <ResponsiveContainer width="100%" height={350}>
        <LineChart data={mockData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis dataKey="day" stroke="#9CA3AF" />
          <YAxis stroke="#9CA3AF" label={{ value: 'Story Points', angle: -90, position: 'insideLeft', fill: '#9CA3AF' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1F2937',
              border: '1px solid #374151',
              borderRadius: '8px',
              color: '#F3F4F6'
            }}
          />
          <Legend />
          <Line
            type="monotone"
            dataKey="ideal"
            stroke="#6B7280"
            strokeWidth={2}
            strokeDasharray="5 5"
            name="Ideal"
            dot={false}
          />
          <Line
            type="monotone"
            dataKey="actual"
            stroke="#3B82F6"
            strokeWidth={3}
            name="Actual"
            dot={{ fill: '#3B82F6', r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="predicted"
            stroke="#10B981"
            strokeWidth={2}
            strokeDasharray="3 3"
            name="Predicted"
            dot={{ fill: '#10B981', r: 3 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};

export default PredictiveBurndownChart;
