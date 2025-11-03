import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { PlusCircle, Edit, Calendar, Users, Target, Clock } from 'lucide-react';
import RLRecommendations from '../components/RLRecommendations';
import { RLPrediction, getRLPrediction } from '../services/rlPlanningApi';

// Type definitions
interface User {
  id: number;
  username: string;
  email: string;
}

interface Team {
  id: number;
  name: string;
  members: User[];
}

interface Sprint {
  id: number;
  name: string;
  goals: string;
  startDate: string;
  endDate: string;
  teamId: number;
  team: Team;
}

interface Task {
  id: number;
  title: string;
  description: string;
  storyPoints: number;
  priority: number;
  status: string;
  ownerId?: number;
  owner?: User;
  type: string;
  sprintId: number;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

const SprintPlannerPage: React.FC = () => {
  const { user } = useAuth();
  
  // State management
  const [rlPrediction, setRlPrediction] = useState<RLPrediction>();
  const [isLoadingPrediction, setIsLoadingPrediction] = useState(false);

  // Get RL predictions when tasks change
  const fetchRLPredictions = async (tasks: Task[]) => {
    setIsLoadingPrediction(true);
    try {
      const { data, error } = await getRLPrediction({
        backlogItems: tasks,
        teamCapacity: sprint?.team?.members.length ? sprint.team.members.length * 10 : 40, // Estimate 10 story points per team member
        sprintGoals: sprint?.goals ? [sprint.goals] : [],
        currentVelocity: 30, // TODO: Calculate from historical data
      });

      if (error) {
        console.error('Error getting RL predictions:', error);
        return;
      }

      setRlPrediction(data);
    } catch (error) {
      console.error('Error getting RL predictions:', error);
    } finally {
      setIsLoadingPrediction(false);
    }
  };

  // Apply RL recommendations
  const handleApplyRecommendations = (reorderedItems: Task[]) => {
    // Update your tasks state with the reordered items
    // This depends on how you're managing state in your app
    // For example:
    // setTasks(reorderedItems);
  };
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [currentSprint, setCurrentSprint] = useState<Sprint | null>(null);
  const [teams, setTeams] = useState<Team[]>([]);
  const [columns, setColumns] = useState<Record<string, Column>>({
    todo: { id: 'todo', title: 'To Do', tasks: [] },
    inProgress: { id: 'inProgress', title: 'In Progress', tasks: [] },
    done: { id: 'done', title: 'Done', tasks: [] }
  });

  // Modal states
  const [showSprintModal, setShowSprintModal] = useState(false);
  const [showTaskModal, setShowTaskModal] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Form states
  const [sprintForm, setSprintForm] = useState({
    name: '',
    goals: '',
    startDate: '',
    endDate: '',
    teamId: ''
  });
  
  const [taskForm, setTaskForm] = useState({
    title: '',
    description: '',
    storyPoints: 0,
    priority: 1,
    ownerId: '',
    type: 'task'
  });

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{type: 'success' | 'error', text: string} | null>(null);

  // API Functions
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
        setTeams(data || []);
      }
    } catch (error) {
      console.error('Error fetching teams:', error);
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
        setSprints(data || []);
        if (data.length > 0 && !currentSprint) {
          setCurrentSprint(data[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching sprints:', error);
    }
  };

  const fetchSprintTasks = async (sprintId: number) => {
    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch(`http://localhost:3000/api/sprint-tasks?sprintId=${sprintId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        
        // Organize tasks by status
        const newColumns = {
          todo: { id: 'todo', title: 'To Do', tasks: [] as Task[] },
          inProgress: { id: 'inProgress', title: 'In Progress', tasks: [] as Task[] },
          done: { id: 'done', title: 'Done', tasks: [] as Task[] }
        };

        data.forEach((task: Task) => {
          if (task.status === 'todo') {
            newColumns.todo.tasks.push(task);
          } else if (task.status === 'inProgress') {
            newColumns.inProgress.tasks.push(task);
          } else if (task.status === 'done') {
            newColumns.done.tasks.push(task);
          }
        });

        setColumns(newColumns);
      }
    } catch (error) {
      console.error('Error fetching sprint tasks:', error);
    }
  };

  // Task Status Management
  const updateTaskStatus = async (taskId: number, newStatus: string) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3000/api/sprint-tasks`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ id: taskId, status: newStatus })
      });

      if (response.ok) {
        await fetchSprintTasks(currentSprint!.id);
        setMessage({ type: 'success', text: 'Task status updated successfully!' });
        setTimeout(() => setMessage(null), 3000);
      } else {
        throw new Error('Failed to update task status');
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update task status' });
      setTimeout(() => setMessage(null), 3000);
    } finally {
      setLoading(false);
    }
  };

  // Drag and Drop Handlers
  const handleDragStart = (e: React.DragEvent, taskId: number) => {
    e.dataTransfer.setData('text/plain', taskId.toString());
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (e: React.DragEvent, status: string) => {
    e.preventDefault();
    const taskId = parseInt(e.dataTransfer.getData('text/plain'));
    updateTaskStatus(taskId, status);
  };

  // Event Handlers
  const handleCreateSprint = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const response = await fetch('http://localhost:3000/api/sprints', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...sprintForm,
          teamId: parseInt(sprintForm.teamId),
          startDate: new Date(sprintForm.startDate),
          endDate: new Date(sprintForm.endDate),
          scopeAdjusted: false
        })
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: 'Sprint created successfully!' });
        setShowSprintModal(false);
        setSprintForm({ name: '', goals: '', startDate: '', endDate: '', teamId: '' });
        fetchSprints();
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to create sprint' });
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Error creating sprint' });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentSprint) return;

    setLoading(true);

    try {
      const token = localStorage.getItem('auth_token');
      const method = editingTask ? 'PUT' : 'POST';
      const body = editingTask 
        ? { ...taskForm, id: editingTask.id, ownerId: taskForm.ownerId ? parseInt(taskForm.ownerId) : null }
        : { ...taskForm, sprintId: currentSprint.id, ownerId: taskForm.ownerId ? parseInt(taskForm.ownerId) : null, status: 'todo' };

      const response = await fetch('http://localhost:3000/api/sprint-tasks', {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      const data = await response.json();

      if (response.ok) {
        setMessage({ type: 'success', text: `Task ${editingTask ? 'updated' : 'created'} successfully!` });
        setShowTaskModal(false);
        setTaskForm({ title: '', description: '', storyPoints: 0, priority: 1, ownerId: '', type: 'task' });
        setEditingTask(null);
        fetchSprintTasks(currentSprint.id);
      } else {
        setMessage({ type: 'error', text: data.error || `Failed to ${editingTask ? 'update' : 'create'} task` });
      }
    } catch (error) {
      setMessage({ type: 'error', text: `Error ${editingTask ? 'updating' : 'creating'} task` });
    } finally {
      setLoading(false);
    }
  };

  // Initialize data
  useEffect(() => {
    if (user) {
      fetchTeams();
      fetchSprints();
    }
  }, [user]);

  useEffect(() => {
    if (currentSprint) {
      fetchSprintTasks(currentSprint.id);
    }
  }, [currentSprint]);

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Debug effect for modal state
  useEffect(() => {
    console.log('showTaskModal changed:', showTaskModal);
  }, [showTaskModal]);

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access sprint planning.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="bg-white shadow rounded-lg mb-6">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Sprint Planner</h1>
                {currentSprint && (
                  <div className="mt-2 flex items-center space-x-4 text-sm text-gray-600">
                    <div className="flex items-center">
                      <Calendar className="w-4 h-4 mr-1" />
                      {new Date(currentSprint.startDate).toLocaleDateString()} - {new Date(currentSprint.endDate).toLocaleDateString()}
                    </div>
                    <div className="flex items-center">
                      <Users className="w-4 h-4 mr-1" />
                      Team: {currentSprint.team.name}
                    </div>
                    <div className="flex items-center">
                      <Target className="w-4 h-4 mr-1" />
                      Goals: {currentSprint.goals}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => setShowSprintModal(true)}
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                >
                  <PlusCircle className="w-4 h-4 mr-2" />
                  New Sprint
                </button>
                {/* {currentSprint && (
                  <button
                    onClick={() => {
                      console.log('Add Task button clicked');
                      console.log('Current Sprint:', currentSprint);
                      setShowTaskModal(true);
                      console.log('Modal state set to true');
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Add Task
                  </button>
                )} */}
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

        {/* Sprint Selection */}
        {sprints.length > 0 && (
          <div className="bg-white shadow rounded-lg mb-6">
            <div className="px-6 py-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Sprint
              </label>
              <select
                value={currentSprint?.id || ''}
                onChange={(e) => {
                  const sprint = sprints.find(s => s.id === parseInt(e.target.value));
                  setCurrentSprint(sprint || null);
                }}
                className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select a sprint...</option>
                {sprints.map((sprint) => (
                  <option key={sprint.id} value={sprint.id}>
                    {sprint.name} - {sprint.team.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Sprint Board or Empty State */}
        {currentSprint ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {Object.values(columns).map((column) => (
              <div 
                key={column.id} 
                className="bg-white rounded-lg shadow"
                onDragOver={handleDragOver}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-medium text-gray-900">
                    {column.title} ({column.tasks.length})
                  </h3>
                </div>
                <div className="min-h-96 p-4 space-y-3">
                  {column.tasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      className="p-4 bg-white border rounded-lg shadow-sm hover:shadow-md transition-shadow cursor-move"
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h4 className="font-medium text-gray-900 mb-2">
                            {task.title}
                          </h4>
                          {task.description && (
                            <p className="text-sm text-gray-600 mb-3">
                              {task.description}
                            </p>
                          )}
                          <div className="flex items-center space-x-4 text-xs text-gray-500 mb-3">
                            <span className="inline-flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {task.storyPoints} pts
                            </span>
                            {task.owner && (
                              <span>
                                Assigned: {task.owner.username}
                              </span>
                            )}
                            <span className={`px-2 py-1 rounded-full text-xs ${
                              task.priority >= 3 ? 'bg-red-100 text-red-800' :
                              task.priority >= 2 ? 'bg-yellow-100 text-yellow-800' :
                              'bg-green-100 text-green-800'
                            }`}>
                              {task.priority >= 3 ? 'High' : task.priority >= 2 ? 'Medium' : 'Low'}
                            </span>
                          </div>
                        </div>
                        <div className="flex space-x-1 ml-2">
                          <button
                            onClick={() => {
                              setEditingTask(task);
                              setTaskForm({
                                title: task.title,
                                description: task.description,
                                storyPoints: task.storyPoints,
                                priority: task.priority,
                                ownerId: task.ownerId?.toString() || '',
                                type: task.type
                              });
                              setShowTaskModal(true);
                            }}
                            className="p-1 text-gray-400 hover:text-blue-600"
                          >
                            <Edit className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="bg-white shadow rounded-lg">
            <div className="px-6 py-12 text-center">
              <Target className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No Sprint Selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                {sprints.length === 0 
                  ? "Get started by creating a new sprint."
                  : "Select a sprint from the dropdown above to view tasks."
                }
              </p>
              {sprints.length === 0 && (
                <div className="mt-6">
                  <button
                    onClick={() => setShowSprintModal(true)}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                  >
                    <PlusCircle className="w-4 h-4 mr-2" />
                    Create Sprint
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Sprint Modal */}
        {showSprintModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  Create New Sprint
                </h3>
                <form onSubmit={handleCreateSprint} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Sprint Name
                    </label>
                    <input
                      type="text"
                      value={sprintForm.name}
                      onChange={(e) => setSprintForm({...sprintForm, name: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Goals
                    </label>
                    <textarea
                      value={sprintForm.goals}
                      onChange={(e) => setSprintForm({...sprintForm, goals: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      rows={3}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Team
                    </label>
                    <select
                      value={sprintForm.teamId}
                      onChange={(e) => setSprintForm({...sprintForm, teamId: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    >
                      <option value="">Select a team...</option>
                      {teams.map((team) => (
                        <option key={team.id} value={team.id}>
                          {team.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Start Date
                      </label>
                      <input
                        type="date"
                        value={sprintForm.startDate}
                        onChange={(e) => setSprintForm({...sprintForm, startDate: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        End Date
                      </label>
                      <input
                        type="date"
                        value={sprintForm.endDate}
                        onChange={(e) => setSprintForm({...sprintForm, endDate: e.target.value})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        required
                      />
                    </div>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowSprintModal(false);
                        setSprintForm({ name: '', goals: '', startDate: '', endDate: '', teamId: '' });
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
                      {loading ? 'Creating...' : 'Create Sprint'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Task Modal */}
        {showTaskModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
            <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
              <div className="mt-3">
                <h3 className="text-lg font-medium text-gray-900 mb-4">
                  {editingTask ? 'Edit Task' : 'Create New Task'}
                </h3>
                <form onSubmit={handleCreateTask} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Task Title
                    </label>
                    <input
                      type="text"
                      value={taskForm.title}
                      onChange={(e) => setTaskForm({...taskForm, title: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Description
                    </label>
                    <textarea
                      value={taskForm.description}
                      onChange={(e) => setTaskForm({...taskForm, description: e.target.value})}
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
                        value={taskForm.storyPoints}
                        onChange={(e) => setTaskForm({...taskForm, storyPoints: parseInt(e.target.value) || 0})}
                        className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        min="0"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">
                        Priority
                      </label>
                      <select
                        value={taskForm.priority}
                        onChange={(e) => setTaskForm({...taskForm, priority: parseInt(e.target.value)})}
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
                      value={taskForm.ownerId}
                      onChange={(e) => setTaskForm({...taskForm, ownerId: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Unassigned</option>
                      {currentSprint?.team?.members?.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.username}
                        </option>
                      )) || []}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      Type
                    </label>
                    <select
                      value={taskForm.type}
                      onChange={(e) => setTaskForm({...taskForm, type: e.target.value})}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="task">Task</option>
                      <option value="bug">Bug</option>
                      <option value="story">User Story</option>
                      <option value="epic">Epic</option>
                    </select>
                  </div>
                  <div className="flex justify-end space-x-3 pt-4">
                    <button
                      type="button"
                      onClick={() => {
                        setShowTaskModal(false);
                        setEditingTask(null);
                        setTaskForm({ title: '', description: '', storyPoints: 0, priority: 1, ownerId: '', type: 'task' });
                      }}
                      className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-green-600 hover:bg-green-700 disabled:opacity-50"
                    >
                      {loading ? 'Saving...' : (editingTask ? 'Update Task' : 'Create Task')}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SprintPlannerPage;
