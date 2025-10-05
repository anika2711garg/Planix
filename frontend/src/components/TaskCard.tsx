import { User } from 'lucide-react';

interface TaskCardProps {
  id: string;
  title: string;
  assignee: string;
  storyPoints: number;
  priority: 'high' | 'medium' | 'low';
}

const TaskCard = ({ title, assignee, storyPoints, priority }: TaskCardProps) => {
  const priorityColors = {
    high: 'bg-red-500',
    medium: 'bg-yellow-500',
    low: 'bg-green-500'
  };

  return (
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 mb-3 hover:border-gray-600 transition-colors cursor-pointer">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-white font-medium text-sm flex-1">{title}</h4>
        <span className={`${priorityColors[priority]} w-2 h-2 rounded-full ml-2 mt-1`}></span>
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 bg-gray-700 rounded-full flex items-center justify-center">
            <User size={14} className="text-gray-400" />
          </div>
          <span className="text-xs text-gray-400">{assignee}</span>
        </div>

        <div className="bg-blue-600 text-white text-xs font-semibold px-2 py-1 rounded">
          {storyPoints} pts
        </div>
      </div>
    </div>
  );
};

export default TaskCard;
