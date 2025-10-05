"use client";

import { useState } from 'react';
import { PlusCircle, ChevronUp, ChevronDown, ChevronsUpDown, X } from 'lucide-react';

// --- TYPE DEFINITIONS ---
type Priority = 'high' | 'medium' | 'low';

interface Task {
  id: string;
  title: string;
  assignee: string;
  storyPoints: number;
  priority: Priority;
}

// Omit 'id' for new task creation
type NewTaskData = Omit<Task, 'id'>;

type ColumnId = 'todo' | 'inProgress' | 'done';

interface Column {
  id: ColumnId;
  title: string;
  tasks: Task[];
}

// --- INITIAL DATA ---
const initialData: Record<ColumnId, Column> = {
  todo: {
    id: 'todo',
    title: 'To Do',
    tasks: [
      { id: '1', title: 'Implement user authentication flow', assignee: 'John', storyPoints: 8, priority: 'high' },
      { id: '2', title: 'Design database schema for new feature', assignee: 'Sarah', storyPoints: 5, priority: 'high' },
      { id: '3', title: 'Create API endpoints for user tasks', assignee: 'Mike', storyPoints: 5, priority: 'medium' },
      { id: '4', title: 'Setup CI/CD pipeline for deployment', assignee: 'Alex', storyPoints: 3, priority: 'low' },
    ],
  },
  inProgress: {
    id: 'inProgress',
    title: 'In Progress',
    tasks: [
      { id: '5', title: 'Build dashboard UI components in React', assignee: 'Sarah', storyPoints: 8, priority: 'high' },
      { id: '6', title: 'Integrate Stripe for payment processing', assignee: 'John', storyPoints: 13, priority: 'high' },
      { id: '7', title: 'Write comprehensive unit tests for the API', assignee: 'Mike', storyPoints: 5, priority: 'medium' },
    ],
  },
  done: {
    id: 'done',
    title: 'Done',
    tasks: [
      { id: '8', title: 'Setup project repository on GitHub', assignee: 'Alex', storyPoints: 2, priority: 'high' },
      { id: '9', title: 'Configure local development environment', assignee: 'Sarah', storyPoints: 3, priority: 'medium' },
      { id: '10', title: 'Create initial wireframes and mockups', assignee: 'Mike', storyPoints: 5, priority: 'low' },
      { id: '11', title: 'Define and document sprint goals', assignee: 'John', storyPoints: 2, priority: 'high' },
    ],
  },
};

// --- COMPONENT: NewTaskModal ---
const NewTaskModal = ({ isOpen, onClose, onAddTask }: { isOpen: boolean; onClose: () => void; onAddTask: (task: NewTaskData) => void; }) => {
    const [taskData, setTaskData] = useState<NewTaskData>({
        title: '',
        assignee: 'John',
        storyPoints: 3,
        priority: 'medium',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setTaskData(prev => ({ ...prev, [name]: name === 'storyPoints' ? parseInt(value) : value }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!taskData.title) return; // Basic validation
        onAddTask(taskData);
        // Reset form for next entry
        setTaskData({ title: '', assignee: 'John', storyPoints: 3, priority: 'medium' });
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fadeIn">
            <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-8 w-full max-w-lg relative animate-scaleUp">
                <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors">
                    <X size={24} />
                </button>
                <h2 className="text-2xl font-bold text-white mb-6">Add New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Task Title</label>
                        <input type="text" name="title" value={taskData.title} onChange={handleChange} placeholder="e.g., Deploy to production" className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" required />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Assignee</label>
                            <select name="assignee" value={taskData.assignee} onChange={handleChange} className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option>John</option>
                                <option>Sarah</option>
                                <option>Mike</option>
                                <option>Alex</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-300 mb-2">Priority</label>
                            <select name="priority" value={taskData.priority} onChange={handleChange} className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500">
                                <option value="high">High</option>
                                <option value="medium">Medium</option>
                                <option value="low">Low</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-300 mb-2">Story Points</label>
                        <input type="number" name="storyPoints" value={taskData.storyPoints} onChange={handleChange} min="1" className="w-full px-4 py-3 bg-slate-700/50 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500" />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="bg-slate-600 hover:bg-slate-700 text-white font-bold px-5 py-2.5 rounded-lg transition-colors">Cancel</button>
                        <button type="submit" className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-2.5 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all">
                            <PlusCircle size={18} />
                            Add Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


// --- COMPONENT: TaskCard ---
const TaskCard = ({ task, onDragStart }: { task: Task; onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void }) => {
  const priorityStyles: Record<Priority, { bg: string; icon: JSX.Element }> = {
    high: { bg: 'bg-red-500/20 text-red-400', icon: <ChevronUp size={16} /> },
    medium: { bg: 'bg-yellow-500/20 text-yellow-400', icon: <ChevronsUpDown size={16} /> },
    low: { bg: 'bg-green-500/20 text-green-400', icon: <ChevronDown size={16} /> },
  };
  const assigneeColors: Record<string, string> = { 'John': 'bg-indigo-500', 'Sarah': 'bg-purple-500', 'Mike': 'bg-teal-500', 'Alex': 'bg-orange-500', };

  return (
    <div
      draggable
      onDragStart={(e) => onDragStart(e, task.id)}
      className="bg-slate-800/80 border border-slate-700 rounded-lg p-4 mb-4 cursor-grab active:cursor-grabbing transition-all duration-200 hover:bg-slate-700/70 hover:shadow-lg hover:-translate-y-1"
    >
      <p className="font-semibold text-white mb-2">{task.title}</p>
      <div className="flex items-center justify-between text-sm text-gray-400">
        <div className="flex items-center gap-2">
            <div className={`w-6 h-6 rounded-full ${assigneeColors[task.assignee] || 'bg-gray-600'} flex items-center justify-center text-white text-xs font-bold`}>{task.assignee.charAt(0)}</div>
            <span>{task.assignee}</span>
        </div>
        <div className="flex items-center gap-4">
          <span className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${priorityStyles[task.priority].bg}`}>{priorityStyles[task.priority].icon}{task.priority}</span>
          <span className="bg-slate-700 text-white font-bold text-xs w-6 h-6 flex items-center justify-center rounded-full">{task.storyPoints}</span>
        </div>
      </div>
    </div>
  );
};

// --- COMPONENT: BoardColumn ---
const BoardColumn = ({ column, onDragOver, onDrop, onDragStart }: { column: Column; onDragOver: (e: React.DragEvent<HTMLDivElement>) => void; onDrop: (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void }) => {
    const columnStyles: Record<ColumnId, { border: string, badge: string }> = { todo: { border: 'border-slate-500', badge: 'bg-slate-500 text-white' }, inProgress: { border: 'border-blue-500', badge: 'bg-blue-500 text-white' }, done: { border: 'border-green-500', badge: 'bg-green-500 text-white' }, };
    
    return (
        <div
        data-column-id={column.id}
        onDragOver={onDragOver}
        onDrop={(e) => onDrop(e, column.id)}
        className={`bg-black/30 backdrop-blur-lg rounded-2xl p-4 border-t-4 ${columnStyles[column.id].border} h-full transition-colors duration-300 min-h-[300px]`}
        >
            <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-white">{column.title}</h2>
                <span className={`text-sm font-semibold px-3 py-1 rounded-full ${columnStyles[column.id].badge}`}>{column.tasks.length}</span>
            </div>
            <div className="space-y-4">
                {column.tasks.map(task => (<TaskCard key={task.id} task={task} onDragStart={onDragStart} />))}
            </div>
        </div>
    );
};


// --- MAIN PAGE COMPONENT ---
const SprintPlannerPage = () => {
    const [columns, setColumns] = useState<Record<ColumnId, Column>>(initialData);
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
        e.dataTransfer.setData('taskId', taskId);
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => e.preventDefault();

    const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnId: ColumnId) => {
        const taskId = e.dataTransfer.getData('taskId');
        let sourceColumnId: ColumnId | undefined;
        let taskToMove: Task | undefined;

        // Find the task and its source column
        for (const colId in columns) {
            const column = columns[colId as ColumnId];
            const foundTask = column.tasks.find(t => t.id === taskId);
            if (foundTask) {
                sourceColumnId = colId as ColumnId;
                taskToMove = foundTask;
                break;
            }
        }
        
        if (!taskToMove || !sourceColumnId || sourceColumnId === targetColumnId) return;

        // Remove task from source
        const newSourceTasks = columns[sourceColumnId].tasks.filter(t => t.id !== taskId);
        // Add task to target
        const newTargetTasks = [...columns[targetColumnId].tasks, taskToMove];
        
        setColumns({
            ...columns,
            [sourceColumnId]: { ...columns[sourceColumnId], tasks: newSourceTasks },
            [targetColumnId]: { ...columns[targetColumnId], tasks: newTargetTasks }
        });
    };

    const handleAddTask = (taskData: NewTaskData) => {
        const newTask: Task = {
            id: `task-${Date.now()}-${Math.random()}`, // More robust ID
            ...taskData,
        };

        setColumns(prev => ({
            ...prev,
            todo: {
                ...prev.todo,
                tasks: [newTask, ...prev.todo.tasks], // Add new task to the top of 'To Do'
            },
        }));

        setIsModalOpen(false); // Close modal on submission
    };

    return (
        <div className="relative min-h-screen w-full bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
            <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob"></div>
            <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-3xl opacity-20 animate-blob animation-delay-2000"></div>

            <NewTaskModal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} onAddTask={handleAddTask} />

            <div className="relative z-10">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
                    <div>
                        <h1 className="text-4xl font-bold text-white mb-1">Current Sprint: Sprint 24</h1>
                        <p className="text-indigo-300">Oct 1, 2025 - Oct 15, 2025</p>
                    </div>
                    <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 mt-4 sm:mt-0">
                        <PlusCircle size={20} />
                        Add New Task
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {Object.values(columns).map(column => (
                        <BoardColumn key={column.id} column={column} onDragOver={handleDragOver} onDrop={handleDrop} onDragStart={handleDragStart}/>
                    ))}
                </div>
            </div>
            
            {/* Global styles for animations */}
            <style>
                {`
                @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
                @keyframes scaleUp { from { opacity: 0; transform: scale(0.95); } to { opacity: 1; transform: scale(1); } }
                .animate-fadeIn { animation: fadeIn 0.3s ease-out forwards; }
                .animate-scaleUp { animation: scaleUp 0.3s ease-out forwards; }
                `}
            </style>
        </div>
    );
};

export default SprintPlannerPage;