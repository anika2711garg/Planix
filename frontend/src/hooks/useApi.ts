import { useState, useEffect } from 'react';
import { 
  backlogApi, 
  sprintApi, 
  userApi, 
  teamApi, 
  taskCompletionApi, 
  velocityApi, 
  notificationApi,
  BacklogItem,
  Sprint,
  User,
  Team,
  TaskCompletion,
  VelocityMetric,
  Notification
} from '../services/api';

// Hook for backlog management
export const useBacklog = () => {
  const [items, setItems] = useState<BacklogItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadItems = async () => {
    setLoading(true);
    setError(null);
    const response = await backlogApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setItems(response.data || []);
    }
    setLoading(false);
  };

  const addItem = async (itemData: Omit<BacklogItem, 'id'>) => {
    const response = await backlogApi.create(itemData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setItems(prev => [...prev, response.data!]);
      return true;
    }
  };

  const updateItem = async (id: string, itemData: Partial<BacklogItem>) => {
    const response = await backlogApi.update(id, itemData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setItems(prev => prev.map(item => 
        item.id === id ? { ...item, ...itemData } : item
      ));
      return true;
    }
  };

  const deleteItem = async (id: string) => {
    const response = await backlogApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setItems(prev => prev.filter(item => item.id !== id));
      return true;
    }
  };

  return {
    items,
    loading,
    error,
    loadItems,
    addItem,
    updateItem,
    deleteItem,
    setError
  };
};

// Hook for sprint management
export const useSprints = () => {
  const [sprints, setSprints] = useState<Sprint[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadSprints = async () => {
    setLoading(true);
    setError(null);
    const response = await sprintApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setSprints(response.data || []);
    }
    setLoading(false);
  };

  const addSprint = async (sprintData: Omit<Sprint, 'id'>) => {
    const response = await sprintApi.create(sprintData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setSprints(prev => [...prev, response.data!]);
      return true;
    }
  };

  const updateSprint = async (id: string, sprintData: Partial<Sprint>) => {
    const response = await sprintApi.update(id, sprintData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setSprints(prev => prev.map(sprint => 
        sprint.id === id ? { ...sprint, ...sprintData } : sprint
      ));
      return true;
    }
  };

  const deleteSprint = async (id: string) => {
    const response = await sprintApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setSprints(prev => prev.filter(sprint => sprint.id !== id));
      return true;
    }
  };

  return {
    sprints,
    loading,
    error,
    loadSprints,
    addSprint,
    updateSprint,
    deleteSprint,
    setError
  };
};

// Hook for user management
export const useUsers = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);
    const response = await userApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setUsers(response.data || []);
    }
    setLoading(false);
  };

  const addUser = async (userData: Omit<User, 'id'>) => {
    const response = await userApi.create(userData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setUsers(prev => [...prev, response.data!]);
      return true;
    }
  };

  const updateUser = async (id: string, userData: Partial<User>) => {
    const response = await userApi.update(id, userData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setUsers(prev => prev.map(user => 
        user.id === id ? { ...user, ...userData } : user
      ));
      return true;
    }
  };

  const deleteUser = async (id: string) => {
    const response = await userApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setUsers(prev => prev.filter(user => user.id !== id));
      return true;
    }
  };

  return {
    users,
    loading,
    error,
    loadUsers,
    addUser,
    updateUser,
    deleteUser,
    setError
  };
};

// Hook for team management
export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTeams = async () => {
    setLoading(true);
    setError(null);
    const response = await teamApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setTeams(response.data || []);
    }
    setLoading(false);
  };

  const addTeam = async (teamData: Omit<Team, 'id'>) => {
    const response = await teamApi.create(teamData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setTeams(prev => [...prev, response.data!]);
      return true;
    }
  };

  const updateTeam = async (id: string, teamData: Partial<Team>) => {
    const response = await teamApi.update(id, teamData);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setTeams(prev => prev.map(team => 
        team.id === id ? { ...team, ...teamData } : team
      ));
      return true;
    }
  };

  const deleteTeam = async (id: string) => {
    const response = await teamApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setTeams(prev => prev.filter(team => team.id !== id));
      return true;
    }
  };

  return {
    teams,
    loading,
    error,
    loadTeams,
    addTeam,
    updateTeam,
    deleteTeam,
    setError
  };
};

// Hook for notifications
export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadNotifications = async () => {
    setLoading(true);
    setError(null);
    const response = await notificationApi.getAll();
    if (response.error) {
      setError(response.error);
    } else {
      setNotifications(response.data || []);
    }
    setLoading(false);
  };

  const markAsRead = async (id: string) => {
    const response = await notificationApi.update(id, { read: true });
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setNotifications(prev => prev.map(notification => 
        notification.id === id ? { ...notification, read: true } : notification
      ));
      return true;
    }
  };

  const deleteNotification = async (id: string) => {
    const response = await notificationApi.delete(id);
    if (response.error) {
      setError(response.error);
      return false;
    } else {
      setNotifications(prev => prev.filter(notification => notification.id !== id));
      return true;
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return {
    notifications,
    loading,
    error,
    unreadCount,
    loadNotifications,
    markAsRead,
    deleteNotification,
    setError
  };
};

// Hook for dashboard data
export const useDashboard = () => {
  const [dashboardData, setDashboardData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadDashboardData = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const token = localStorage.getItem('auth_token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }

      const response = await fetch('http://localhost:3000/api/Dashboard', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch dashboard data');
      }

      const result = await response.json();
      if (result.success) {
        setDashboardData(result.data);
      } else {
        setError(result.error || 'Failed to load dashboard data');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  return {
    dashboardData,
    loading,
    error,
    refreshData: loadDashboardData,
    setError
  };
};