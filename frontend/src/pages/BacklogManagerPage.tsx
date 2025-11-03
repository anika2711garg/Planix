import { useState, useMemo, useEffect } from "react";
import { Plus, Wand2, ChevronDown, ChevronUp, X, Sparkles } from "lucide-react";

// --- TYPE DEFINITIONS ---
type Priority = "High" | "Medium" | "Low";
type SortDirection = "ascending" | "descending";
type SortableKeys = "id" | "title" | "storyPoints" | "priority" | "status";

interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}

interface MessageState {
  type: 'success' | 'error';
  text: string;
}

interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  storyPoints?: number;
  priority: Priority;
  status: string;
  type?: string;
  ownerId?: string;
  sprintId?: string;
}

// Initial mock data with corrected types
const initialBacklogData: BacklogItem[] = [
  {
    id: "TASK-101",
    title: "Implement OAuth2 social login",
    storyPoints: 8,
    priority: "High",
    status: "To Do",
  },
  {
    id: "TASK-102",
    title: "Add email notification system",
    storyPoints: 13,
    priority: "High",
    status: "Ready for Dev",
  },
  {
    id: "TASK-103",
    title: "Create user profile page",
    storyPoints: 5,
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "TASK-104",
    title: "Implement dark mode toggle",
    storyPoints: 3,
    priority: "Low",
    status: "In Progress",
  },
  {
    id: "TASK-105",
    title: "Add search functionality",
    storyPoints: 8,
    priority: "High",
    status: "In Refinement",
  }
];

// Helper functions
const getPriorityClasses = (priority: Priority): string => {
  switch (priority) {
    case "High":
      return "text-red-400 bg-red-500/10 border-red-500/30";
    case "Medium":
      return "text-amber-400 bg-amber-500/10 border-amber-500/30";
    case "Low":
      return "text-green-400 bg-green-500/10 border-green-500/30";
    default:
      return "text-gray-400 bg-gray-500/10 border-gray-500/30";
  }
};

const getStatusClasses = (status: string): string => {
  switch (status) {
    case "Done":
      return "text-green-400 bg-green-500/10";
    case "In Progress":
      return "text-blue-400 bg-blue-500/10";
    case "Blocked":
      return "text-red-400 bg-red-500/10";
    default:
      return "text-gray-400 bg-gray-500/10";
  }
};

// Header Component
const SortableHeader: React.FC<{
  sortKey: SortableKeys;
  children: React.ReactNode;
  sortConfig: SortConfig;
  requestSort: (key: SortableKeys) => void;
}> = ({ sortKey, children, sortConfig, requestSort }) => {
  const isSorted = sortConfig?.key === sortKey;
  const icon = isSorted ? (
    sortConfig?.direction === "ascending" ? (
      <ChevronUp size={16} />
    ) : (
      <ChevronDown size={16} />
    )
  ) : (
    <ChevronDown size={16} className="opacity-30" />
  );

  return (
    <th
      className="px-6 py-4 text-left text-sm font-semibold text-gray-400 uppercase tracking-wider cursor-pointer hover:text-white transition-colors"
      onClick={() => requestSort(sortKey)}
    >
      <div className="flex items-center gap-2">
        {children} {icon}
      </div>
    </th>
  );
};

// Add Item Modal Component
const AddItemModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<BacklogItem, "id" | "status">) => void;
}> = ({ isOpen, onClose, onAddItem }) => {
  const [title, setTitle] = useState("");
  const [storyPoints, setStoryPoints] = useState<number | "">("");
  const [priority, setPriority] = useState<Priority>("Medium");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || storyPoints === "") return;
    onAddItem({ title, storyPoints: Number(storyPoints), priority });
    setTitle("");
    setStoryPoints("");
    setPriority("Medium");
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-lg p-8 bg-slate-800/80 border border-white/10 rounded-2xl shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
        >
          <X size={24} />
        </button>
        <h2 className="text-2xl font-bold text-white mb-6">Add New Backlog Item</h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-300 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full pl-4 pr-4 py-3 bg-transparent border-b-2 border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
              placeholder="e.g., Implement 2FA"
              required
            />
          </div>
          <div className="flex gap-6">
            <div className="flex-1">
              <label htmlFor="storyPoints" className="block text-sm font-medium text-gray-300 mb-2">
                Story Points
              </label>
              <input
                id="storyPoints"
                type="number"
                value={storyPoints}
                onChange={(e) =>
                  setStoryPoints(e.target.value === "" ? "" : parseInt(e.target.value, 10))
                }
                className="w-full pl-4 pr-4 py-3 bg-transparent border-b-2 border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g., 8"
                min="0"
                required
              />
            </div>
            <div className="flex-1">
              <label htmlFor="priority" className="block text-sm font-medium text-gray-300 mb-2">
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full pl-4 pr-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end gap-4 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 rounded-lg text-gray-300 hover:bg-white/10 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-600 text-white font-bold hover:opacity-90 transition-opacity"
            >
              Add Task
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Main Component
const BacklogManagerPage: React.FC = () => {
  // State declarations
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>(initialBacklogData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<MessageState | null>(null);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderCriteria, setReorderCriteria] = useState('priority');
  const [sortConfig, setSortConfig] = useState<SortConfig>({
    key: "priority",
    direction: "ascending",
  });

  // Sort items
  const sortedItems = useMemo(() => {
    const sortableItems = [...backlogItems];
    sortableItems.sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];
      
      if (!aValue || !bValue) return 0;
      
      if (typeof aValue === 'string' && typeof bValue === 'string') {
        const comparison = aValue.localeCompare(bValue);
        return sortConfig.direction === "ascending" ? comparison : -comparison;
      }
      
      if (typeof aValue === 'number' && typeof bValue === 'number') {
        if (aValue < bValue) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
      }
      
      return 0;
    });
    return sortableItems;
  }, [backlogItems, sortConfig]);

  // Handlers
  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = "ascending";
    if (sortConfig.key === key && sortConfig.direction === "ascending") {
      direction = "descending";
    }
    setSortConfig({ key, direction });
  };

  const handleAddItem = (item: Omit<BacklogItem, "id" | "status">) => {
    const newItem: BacklogItem = {
      id: `TASK-${Math.floor(111 + Math.random() * 888)}`,
      status: "To Do",
      ...item,
    };
    setBacklogItems((current) => [newItem, ...current]);
  };

  const handleAiReorder = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/rl-planning", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sprintId: backlogItems[0]?.sprintId,
          criteria: reorderCriteria
        })
      });

      const data = await response.json();
      if (response.ok) {
        setBacklogItems(data.prediction.reorderedItems);
        
        // Show AI recommendations
        const recommendations = data.prediction.recommendations
          .map((rec: any) => `${rec.title}: ${rec.message}`)
          .join('\n');
          
        setMessage({
          type: 'success',
          text: `Successfully reordered items using AI.\n\nRecommendations:\n${recommendations}\n\nConfidence: ${(data.prediction.confidence * 100).toFixed(1)}%\n\nReasoning: ${data.prediction.reasoning}`
        });
      } else {
        throw new Error(data.message || 'Failed to reorder items');
      }
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to reorder items'
      });
    } finally {
      setLoading(false);
      setShowReorderModal(false);
    }
  };

  // Initialize data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await fetch("/api/backlog");
        if (response.ok) {
          const data = await response.json();
          setBacklogItems(data);
        } else {
          throw new Error('Failed to fetch backlog items');
        }
      } catch (error) {
        setMessage({
          type: 'error',
          text: 'Failed to fetch backlog items'
        });
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="relative w-full overflow-y-auto p-4 sm:p-6 md:p-8 text-white">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob" />
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000" />

        <div className="relative z-10">
          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">Product Backlog</h1>
              <p className="text-indigo-300">Manage, sort, and prioritize all user stories and tasks.</p>
            </div>
            <div className="flex gap-4">
              <button
                onClick={() => setIsModalOpen(true)}
                className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
              >
                <Plus size={20} />
                Add New Item
              </button>
              <button
                onClick={() => setShowReorderModal(true)}
                disabled={loading}
                className="flex items-center gap-2 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 disabled:opacity-50"
              >
                <Wand2 size={20} />
                AI Reorder
              </button>
            </div>
          </div>

          {/* Message Display */}
          {message && (
            <div
              className={`mb-4 p-4 rounded-lg ${
                message.type === 'success' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
              }`}
            >
              {message.text}
            </div>
          )}

          {/* Main Table */}
          <div className="bg-black/30 backdrop-blur-lg rounded-2xl border border-white/10 shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[800px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <SortableHeader
                      sortKey="id"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    >
                      ID
                    </SortableHeader>
                    <SortableHeader
                      sortKey="title"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    >
                      Title
                    </SortableHeader>
                    <SortableHeader
                      sortKey="storyPoints"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    >
                      Points
                    </SortableHeader>
                    <SortableHeader
                      sortKey="priority"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    >
                      Priority
                    </SortableHeader>
                    <SortableHeader
                      sortKey="status"
                      sortConfig={sortConfig}
                      requestSort={requestSort}
                    >
                      Status
                    </SortableHeader>
                  </tr>
                </thead>
                <tbody>
                  {sortedItems.map((item) => (
                    <tr
                      key={item.id}
                      className="border-b border-white/5 hover:bg-white/5 transition-colors duration-200"
                    >
                      <td className="px-6 py-4 text-sm text-gray-400 font-mono">
                        {item.id}
                      </td>
                      <td className="px-6 py-4 text-sm text-white font-medium">
                        {item.title}
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-xs font-bold w-8 h-8 flex items-center justify-center rounded-full">
                          {item.storyPoints}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-xs border ${getPriorityClasses(
                            item.priority
                          )}`}
                        >
                          {item.priority}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">
                        <span
                          className={`px-3 py-1 rounded-full font-semibold text-xs ${getStatusClasses(
                            item.status
                          )}`}
                        >
                          {item.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* AI Reorder Modal */}
      {showReorderModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full">
            <button
              onClick={() => setShowReorderModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <X size={24} />
            </button>
            <div className="p-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-amber-500" />
                AI Backlog Reorder
              </h3>
              <p className="mt-2 text-gray-600">
                Let AI intelligently reorder your backlog items based on your selected criteria.
              </p>
              
              <div className="mt-6">
                <label className="block text-sm font-medium text-gray-700">
                  Reorder Criteria
                </label>
                <select
                  value={reorderCriteria}
                  onChange={(e) => setReorderCriteria(e.target.value)}
                  className="mt-1 w-full rounded-md border border-gray-300 py-2 px-3 shadow-sm focus:border-amber-500 focus:outline-none focus:ring-1 focus:ring-amber-500"
                >
                  <option value="priority">Priority Based</option>
                  <option value="complexity">Complexity (Simple First)</option>
                  <option value="dependencies">Dependency Analysis</option>
                  <option value="sprint_readiness">Sprint Readiness</option>
                </select>
                <p className="mt-2 text-sm text-gray-500">
                  {reorderCriteria === 'priority' && 'Order by business priority and quick wins'}
                  {reorderCriteria === 'complexity' && 'Prioritize simpler items for momentum'}
                  {reorderCriteria === 'dependencies' && 'Minimize dependency blockers'}
                  {reorderCriteria === 'sprint_readiness' && 'Focus on well-defined items'}
                </p>
              </div>

              <div className="mt-8 flex justify-end gap-3">
                <button
                  onClick={() => setShowReorderModal(false)}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  onClick={handleAiReorder}
                  disabled={loading}
                  className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white rounded-lg hover:from-amber-600 hover:to-yellow-600 disabled:opacity-50"
                >
                  <Wand2 size={18} />
                  {loading ? "Reordering..." : "Apply AI Reorder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Item Modal */}
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </div>
  );
};

export default BacklogManagerPage;