import { useState, useMemo } from "react";
import { Plus, Wand2, ChevronDown, ChevronUp, X } from "lucide-react";

// --- TYPE DEFINITIONS ---
type Priority = "High" | "Medium" | "Low";
type SortDirection = "ascending" | "descending";
type SortableKeys = "id" | "title" | "storyPoints" | "priority" | "status";

interface BacklogItem {
  id: string;
  title: string;
  storyPoints: number;
  priority: Priority;
  status: string;
}

interface SortConfig {
  key: SortableKeys;
  direction: SortDirection;
}

// --- INITIAL MOCK DATA ---
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
  },
  {
    id: "TASK-106",
    title: "Build analytics dashboard",
    storyPoints: 13,
    priority: "Medium",
    status: "To Do",
  },
  {
    id: "TASK-107",
    title: "Create admin panel",
    storyPoints: 21,
    priority: "High",
    status: "Blocked",
  },
  {
    id: "TASK-108",
    title: "Implement file upload feature",
    storyPoints: 8,
    priority: "Medium",
    status: "Done",
  },
  {
    id: "TASK-109",
    title: "Add multi-language support",
    storyPoints: 13,
    priority: "Low",
    status: "In Refinement",
  },
  {
    id: "TASK-110",
    title: "Setup monitoring and logging",
    storyPoints: 5,
    priority: "Medium",
    status: "To Do",
  },
];

// --- HELPER FUNCTIONS ---
const getPriorityClasses = (priority: Priority) => {
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

const getStatusClasses = (status: string) => {
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

// --- HEADER COMPONENT FOR THE TABLE ---
const SortableHeader = ({
  sortKey,
  children,
  sortConfig,
  requestSort,
}: {
  sortKey: SortableKeys;
  children: React.ReactNode;
  sortConfig: SortConfig | null;
  requestSort: (key: SortableKeys) => void;
}) => {
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

// --- "ADD ITEM" MODAL COMPONENT ---
const AddItemModal = ({
  isOpen,
  onClose,
  onAddItem,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAddItem: (item: Omit<BacklogItem, "id" | "status">) => void;
}) => {
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
        <h2 className="text-2xl font-bold text-white mb-6">
          Add New Backlog Item
        </h2>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium text-gray-300 mb-2"
            >
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
              <label
                htmlFor="storyPoints"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Story Points
              </label>
              <input
                id="storyPoints"
                type="number"
                value={storyPoints}
                onChange={(e) =>
                  setStoryPoints(
                    e.target.value === "" ? "" : parseInt(e.target.value, 10)
                  )
                }
                className="w-full pl-4 pr-4 py-3 bg-transparent border-b-2 border-gray-600 text-white placeholder-gray-500 focus:outline-none focus:border-indigo-500 transition-colors"
                placeholder="e.g., 8"
                min="0"
                required
              />
            </div>
            <div className="flex-1">
              <label
                htmlFor="priority"
                className="block text-sm font-medium text-gray-300 mb-2"
              >
                Priority
              </label>
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
                className="w-full pl-4 pr-4 py-3 bg-slate-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option>High</option>
                <option>Medium</option>
                <option>Low</option>
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

// --- MAIN PAGE COMPONENT ---
const BacklogManagerPage = () => {
  const [backlogItems, setBacklogItems] =
    useState<BacklogItem[]>(initialBacklogData);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [sortConfig, setSortConfig] = useState<SortConfig | null>({
    key: "priority",
    direction: "ascending",
  });

  const sortedItems = useMemo(() => {
    const sortableItems = [...backlogItems];
    if (sortConfig !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === "ascending" ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [backlogItems, sortConfig]);
const [loading, setLoading] = useState(false);

  const requestSort = (key: SortableKeys) => {
    let direction: SortDirection = "ascending";
    if (
      sortConfig &&
      sortConfig.key === key &&
      sortConfig.direction === "ascending"
    ) {
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
    setBacklogItems((currentItems) => [newItem, ...currentItems]);
  };
const handleAiReorder = async () => {
  setLoading(true);
  try {
    const response = await fetch("/api/ai/reorder", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sprintId: 1 }), // Replace 1 with your real sprint ID if needed
    });

    const data = await response.json();

    if (data.success && Array.isArray(data.reordered)) {
      setBacklogItems(data.reordered);
      alert("✅ AI Suggested Priority Order Applied!");
    } else {
      alert("⚠️ AI Reorder failed: " + (data.error || "Unexpected response"));
    }
  } catch (error) {
    console.error("Error triggering AI reorder:", error);
    alert("❌ Something went wrong while reordering tasks.");
  } finally {
    setLoading(false);
  }
};

  return (
    <>
      <div className="relative min-h-screen w-full overflow-y-auto bg-slate-900 p-4 sm:p-6 md:p-8 text-white">
        {/* Animated Aurora Background */}
        <div className="absolute top-0 -left-4 w-72 h-72 bg-purple-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob"></div>
        <div className="absolute top-0 -right-4 w-72 h-72 bg-indigo-600 rounded-full mix-blend-screen filter blur-xl opacity-30 animate-blob animation-delay-2000"></div>

        <div className="relative z-10">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
            <div>
              <h1 className="text-4xl font-bold text-white mb-1">
                Product Backlog
              </h1>
              <p className="text-indigo-300">
                Manage, sort, and prioritize all user stories and tasks.
              </p>
            </div>
            <button
              onClick={() => setIsModalOpen(true)}
              className="flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-600 text-white font-bold px-5 py-3 rounded-lg shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
            >
              <Plus size={20} />
              Add New Item
            </button>
          </div>

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

          <div className="mt-8 flex justify-center">
            <div className="mt-8 flex justify-center">
  <button
    onClick={handleAiReorder}
    disabled={loading}
    className={`flex items-center gap-3 bg-gradient-to-r from-yellow-500 via-orange-500 to-red-500 
      hover:from-yellow-600 hover:to-red-600 text-white font-bold px-6 py-3 rounded-lg 
      shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300 
      ${loading ? "opacity-70 cursor-not-allowed" : ""}`}
  >
    <Wand2 size={20} />
    {loading ? "Reordering..." : "Suggest Priority Order (AI)"}
  </button>
</div>

          </div>
        </div>
      </div>
      <AddItemModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onAddItem={handleAddItem}
      />
    </>
  );
};

export default BacklogManagerPage;
