import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter, Target, Clock, User, AlertCircle, Sparkles } from 'lucide-react';

// Types
interface BacklogItem {
  id: number;
  type: string;
  title: string;
  description?: string;
  storyPoints?: number;
  ownerId?: number;
  priority?: number;
  status: string;
  sprintId?: number;
  createdAt: string;
  updatedAt: string;
  owner?: {
    id: number;
    username: string;
  };
  sprint?: {
    id: number;
    name: string;
  };
}

interface Team {
  id: number;
  name: string;
  members: Array<{
    id: number;
    username: string;
  }>;
}

interface Sprint {
  id: number;
  name: string;
  status: string;
}

const BacklogManagerPage: React.FC = () => {
  // State management
  const [backlogItems, setBacklogItems] = useState<BacklogItem[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<BacklogItem | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  
  // AI Reorder state
  const [isReordering, setIsReordering] = useState(false);
  const [showReorderModal, setShowReorderModal] = useState(false);
  const [reorderCriteria, setReorderCriteria] = useState('priority');
  const [reorderResult, setReorderResult] = useState<any>(null);
  
  // Form state
  const [itemForm, setItemForm] = useState({
    type: 'story',
    title: '',
    description: '',
    storyPoints: 0,
    priority: 2,
    ownerId: '',
    status: 'todo',
    sprintId: ''
  });

  // Fetch data
  const fetchBacklogItems = async () => {
    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/backlog', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBacklogItems(data);
      } else {
        throw new Error('Failed to fetch backlog items');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to fetch backlog items' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/teams', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTeams(data);
      }
    } catch (error) {
      console.error('Failed to fetch teams:', error);
    }
  };

  const fetchSprints = async () => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/sprints', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSprints(data);
      }
    } catch (error) {
      console.error('Failed to fetch sprints:', error);
    }
  };

  // Get all team members
  const getAllMembers = () => {
    const members: Array<{id: number, username: string}> = [];
    teams.forEach(team => {
      team.members.forEach(member => {
        if (!members.find(m => m.id === member.id)) {
          members.push(member);
        }
      });
    });
    return members;
  };

  // Event handlers
  const handleCreateItem = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/backlog', {
        method: editingItem ? 'PUT' : 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editingItem ? 
          { 
            id: editingItem.id, 
            ...itemForm, 
            ownerId: itemForm.ownerId ? parseInt(itemForm.ownerId) : null,
            sprintId: itemForm.sprintId ? parseInt(itemForm.sprintId) : null
          } :
          { 
            ...itemForm, 
            ownerId: itemForm.ownerId ? parseInt(itemForm.ownerId) : null,
            sprintId: itemForm.sprintId ? parseInt(itemForm.sprintId) : null
          }
        )
      });

      if (response.ok) {
        setMessage({ type: 'success', text: `Backlog item ${editingItem ? 'updated' : 'created'} successfully!` });
        setShowModal(false);
        setEditingItem(null);
        setItemForm({ type: 'story', title: '', description: '', storyPoints: 0, priority: 2, ownerId: '', status: 'todo', sprintId: '' });
        await fetchBacklogItems();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error(`Failed to ${editingItem ? 'update' : 'create'} backlog item`);
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Failed to ${editingItem ? 'update' : 'create'} backlog item` });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteItem = async (id: number) => {
    if (!confirm('Are you sure you want to delete this backlog item?')) return;

    setLoading(true);
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/backlog', {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id })
      });

      if (response.ok) {
        setMessage({ type: 'success', text: 'Backlog item deleted successfully!' });
        await fetchBacklogItems();
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to delete backlog item');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to delete backlog item' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // AI Reorder function
  const handleAIReorder = async () => {
    setIsReordering(true);
    console.log('Starting AI Reorder...');
    try {
      const token = localStorage.getItem('auth_token');
      console.log('Token found:', !!token);
      
      const requestBody = {
        criteria: reorderCriteria,
        sprintId: null, // For product backlog reordering
        teamCapacity: 50, // Example capacity
        sprintGoals: [] // Could be added later
      };
      console.log('Request body:', requestBody);
      
      const response = await fetch('http://localhost:3000/api/ai-reorder', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });
      
      console.log('Response status:', response.status);
      console.log('Response ok:', response.ok);

      if (response.ok) {
        const data = await response.json();
        setReorderResult(data.result);
        setMessage({ 
          type: 'success', 
          text: `AI reordered ${data.result.reorderedItems.length} items with ${data.result.confidence}% confidence!`
        });
        await fetchBacklogItems(); // Refresh the list
        setTimeout(() => setMessage(null), 5000);
      } else {
        const errorData = await response.text();
        console.error('AI Reorder API Error:', {
          status: response.status,
          statusText: response.statusText,
          error: errorData
        });
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }
    } catch (error) {
      console.error('AI Reorder Error Details:', error);
      setMessage({ 
        type: 'error', 
        text: `Failed to reorder: ${error instanceof Error ? error.message : 'Unknown error'}` 
      });
      setTimeout(() => setMessage(null), 5000);
    } finally {
      setIsReordering(false);
      setShowReorderModal(false);
    }
  };

  // Filter backlog items
  const filteredItems = backlogItems.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || item.type === filterType;
    const matchesPriority = filterPriority === 'all' || item.priority?.toString() === filterPriority;
    
    return matchesSearch && matchesType && matchesPriority;
  });

  // Priority color mapping
  const getPriorityColor = (priority?: number) => {
    switch (priority) {
      case 1: return 'text-green-600 bg-green-100';
      case 2: return 'text-yellow-600 bg-yellow-100';
      case 3: return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getPriorityLabel = (priority?: number) => {
    switch (priority) {
      case 1: return 'Low';
      case 2: return 'Medium';
      case 3: return 'High';
      default: return 'Unknown';
    }
  };

  // Type color mapping
  const getTypeColor = (type: string) => {
    switch (type) {
      case 'story': return 'text-blue-600 bg-blue-100';
      case 'task': return 'text-green-600 bg-green-100';
      case 'bug': return 'text-red-600 bg-red-100';
      case 'epic': return 'text-purple-600 bg-purple-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  // Initialize data
  useEffect(() => {
    fetchBacklogItems();
    fetchTeams();
    fetchSprints();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Product Backlog</h1>
                <p className="text-gray-600 mt-2">Manage your product backlog items</p>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setShowReorderModal(true)}
                  disabled={isReordering || backlogItems.length === 0}
                  className="inline-flex items-center px-4 py-2 border border-purple-300 text-sm font-medium rounded-md text-purple-700 bg-purple-50 hover:bg-purple-100 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Sparkles className="w-4 h-4 mr-2" />
                  {isReordering ? 'AI Reordering...' : 'AI Reorder'}
                </button>
                <button
                  onClick={() => setShowModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Add Item
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Message Display */}
        {message && (
          <div className={`mb-6 p-4 rounded-md ${
            message.type === 'success' 
              ? 'bg-green-50 text-green-800 border border-green-200' 
              : 'bg-red-50 text-red-800 border border-red-200'
          }`}>
            {message.text}
          </div>
        )}

        {/* Filters */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Search className="w-4 h-4 inline mr-1" />
                  Search
                </label>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search items..."
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <Filter className="w-4 h-4 inline mr-1" />
                  Type
                </label>
                <select
                  value={filterType}
                  onChange={(e) => setFilterType(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Types</option>
                  <option value="story">User Story</option>
                  <option value="task">Task</option>
                  <option value="bug">Bug</option>
                  <option value="epic">Epic</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Priority
                </label>
                <select
                  value={filterPriority}
                  onChange={(e) => setFilterPriority(e.target.value)}
                  className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Priorities</option>
                  <option value="1">Low</option>
                  <option value="2">Medium</option>
                  <option value="3">High</option>
                </select>
              </div>
              <div className="flex items-end">
                <div className="text-sm text-gray-600">
                  Showing {filteredItems.length} of {backlogItems.length} items
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Backlog Items */}
        <div className="bg-white shadow rounded-lg">
          {loading ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-500">Loading backlog items...</div>
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No backlog items</h3>
              <p className="mt-1 text-sm text-gray-500">
                {backlogItems.length === 0 
                  ? "Get started by adding your first backlog item."
                  : "No items match your current filters."
                }
              </p>
              {backlogItems.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add First Item
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {filteredItems.map((item) => (
                <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getTypeColor(item.type)}`}>
                          {item.type}
                        </span>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getPriorityColor(item.priority)}`}>
                          {getPriorityLabel(item.priority)}
                        </span>
                        {item.storyPoints && (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <Clock className="w-3 h-3 mr-1" />
                            {item.storyPoints} pts
                          </span>
                        )}
                        {item.owner && (
                          <span className="inline-flex items-center text-xs text-gray-500">
                            <User className="w-3 h-3 mr-1" />
                            {item.owner.username}
                          </span>
                        )}
                      </div>
                      <h3 className="text-lg font-medium text-gray-900 mb-2">
                        {item.title}
                      </h3>
                      {item.description && (
                        <p className="text-gray-600 mb-3">
                          {item.description}
                        </p>
                      )}
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span>Status: {item.status}</span>
                        {item.sprint && (
                          <span>Sprint: {item.sprint.name}</span>
                        )}
                        <span>Created: {new Date(item.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                    <div className="flex space-x-2 ml-4">
                      <button
                        onClick={() => {
                          setEditingItem(item);
                          setItemForm({
                            type: item.type,
                            title: item.title,
                            description: item.description || '',
                            storyPoints: item.storyPoints || 0,
                            priority: item.priority || 2,
                            ownerId: item.ownerId?.toString() || '',
                            status: item.status,
                            sprintId: item.sprintId?.toString() || ''
                          });
                          setShowModal(true);
                        }}
                        className="p-2 text-gray-400 hover:text-blue-600"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteItem(item.id)}
                        className="p-2 text-gray-400 hover:text-red-600"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingItem ? 'Edit Backlog Item' : 'Create New Backlog Item'}
                </h3>
                <form onSubmit={handleCreateItem} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={itemForm.type}
                      onChange={(e) => setItemForm({...itemForm, type: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="story">User Story</option>
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                      <option value="epic">Epic</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Title
                    </label>
                    <input
                      type="text"
                      value={itemForm.title}
                      onChange={(e) => setItemForm({...itemForm, title: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={itemForm.description}
                      onChange={(e) => setItemForm({...itemForm, description: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Story Points
                      </label>
                      <input
                        type="number"
                        value={itemForm.storyPoints}
                        onChange={(e) => setItemForm({...itemForm, storyPoints: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={itemForm.priority}
                        onChange={(e) => setItemForm({...itemForm, priority: parseInt(e.target.value)})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value={1}>Low</option>
                        <option value={2}>Medium</option>
                        <option value={3}>High</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Assignee
                    </label>
                    <select
                      value={itemForm.ownerId}
                      onChange={(e) => setItemForm({...itemForm, ownerId: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {getAllMembers().map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Status
                    </label>
                    <select
                      value={itemForm.status}
                      onChange={(e) => setItemForm({...itemForm, status: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sprint
                    </label>
                    <select
                      value={itemForm.sprintId}
                      onChange={(e) => setItemForm({...itemForm, sprintId: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">No Sprint</option>
                      {sprints.map((sprint) => (
                        <option key={sprint.id} value={sprint.id}>
                          {sprint.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowModal(false);
                        setEditingItem(null);
                        setItemForm({ type: 'story', title: '', description: '', storyPoints: 0, priority: 2, ownerId: '', status: 'todo', sprintId: '' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingItem ? 'Update Item' : 'Create Item')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* AI Reorder Modal */}
        {showReorderModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center">
                  <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                  AI Backlog Reorder
                </h3>
                <p className="text-sm text-gray-600 mb-4">
                  Let AI intelligently reorder your backlog items based on priority, complexity, and dependencies.
                </p>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reorder Criteria
                    </label>
                    <select
                      value={reorderCriteria}
                      onChange={(e) => setReorderCriteria(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                    >
                      <option value="priority">Priority Based</option>
                      <option value="complexity">Complexity (Simple First)</option>
                      <option value="dependencies">Dependency Analysis</option>
                      <option value="sprint_readiness">Sprint Readiness</option>
                    </select>
                    <p className="text-xs text-gray-500 mt-1">
                      {reorderCriteria === 'priority' && 'Order by business priority and quick wins'}
                      {reorderCriteria === 'complexity' && 'Prioritize simpler items for momentum'}
                      {reorderCriteria === 'dependencies' && 'Minimize dependency blockers'}
                      {reorderCriteria === 'sprint_readiness' && 'Focus on well-defined items'}
                    </p>
                  </div>

                  {reorderResult && (
                    <div className="bg-purple-50 p-3 rounded-md">
                      <h4 className="text-sm font-medium text-purple-900 mb-2">Last Reorder Result:</h4>
                      <p className="text-xs text-purple-700 mb-1">
                        <strong>Confidence:</strong> {reorderResult.confidence}%
                      </p>
                      <p className="text-xs text-purple-700 mb-1">
                        <strong>Reasoning:</strong> {reorderResult.reasoning}
                      </p>
                      {reorderResult.suggestions && reorderResult.suggestions.length > 0 && (
                        <div className="mt-2">
                          <p className="text-xs font-medium text-purple-900">Suggestions:</p>
                          <ul className="text-xs text-purple-700 list-disc list-inside">
                            {reorderResult.suggestions.map((suggestion: string, index: number) => (
                              <li key={index}>{suggestion}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setShowReorderModal(false)}
                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 border border-gray-300 rounded-md hover:bg-gray-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    onClick={handleAIReorder}
                    disabled={isReordering}
                    className="px-4 py-2 text-sm font-medium text-white bg-purple-600 border border-transparent rounded-md hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isReordering ? 'Reordering...' : 'AI Reorder'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default BacklogManagerPage;