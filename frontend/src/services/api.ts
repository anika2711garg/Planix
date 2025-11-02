// Base API configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Generic API response type
interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

// Generic API request function
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const url = `${API_BASE_URL}${endpoint}`;
    const response = await fetch(url, {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || `HTTP error! status: ${response.status}` };
    }

    return { data };
  } catch (error) {
    return { error: error instanceof Error ? error.message : 'Unknown error occurred' };
  }
}

// User types
export interface User {
  id: string;
  name: string;
  email: string;
  role?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Team types
export interface Team {
  id: string;
  name: string;
  description?: string;
  members?: User[];
  createdAt?: string;
  updatedAt?: string;
}

// Backlog item types
export interface BacklogItem {
  id: string;
  title: string;
  description?: string;
  storyPoints: number;
  priority: 'High' | 'Medium' | 'Low';
  status: string;
  assigneeId?: string;
  sprintId?: string;
  createdAt?: string;
  updatedAt?: string;
}

// Sprint types
export interface Sprint {
  id: string;
  name: string;
  description?: string;
  startDate: string;
  endDate: string;
  status: 'Planning' | 'Active' | 'Completed';
  teamId?: string;
  backlogItems?: BacklogItem[];
  createdAt?: string;
  updatedAt?: string;
}

// Task completion types
export interface TaskCompletion {
  id: string;
  taskId: string;
  userId: string;
  completedAt: string;
  timeSpent?: number;
  notes?: string;
}

// Velocity metrics types
export interface VelocityMetric {
  id: string;
  sprintId: string;
  teamId: string;
  plannedVelocity: number;
  actualVelocity: number;
  date: string;
}

// Notification types
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}

// User API
export const userApi = {
  getAll: () => apiRequest<User[]>('/user'),
  create: (userData: Omit<User, 'id'>) => 
    apiRequest<User>('/user', {
      method: 'POST',
      body: JSON.stringify(userData),
    }),
  update: (id: string, userData: Partial<User>) =>
    apiRequest<User>('/user', {
      method: 'PUT',
      body: JSON.stringify({ id, ...userData }),
    }),
  delete: (id: string) =>
    apiRequest('/user', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Team API
export const teamApi = {
  getAll: () => apiRequest<Team[]>('/teams'),
  create: (teamData: Omit<Team, 'id'>) =>
    apiRequest<Team>('/teams', {
      method: 'POST',
      body: JSON.stringify(teamData),
    }),
  update: (id: string, teamData: Partial<Team>) =>
    apiRequest<Team>('/teams', {
      method: 'PUT',
      body: JSON.stringify({ id, ...teamData }),
    }),
  delete: (id: string) =>
    apiRequest('/teams', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Backlog API
export const backlogApi = {
  getAll: () => {
    const token = localStorage.getItem('auth_token');
    return apiRequest<BacklogItem[]>('/backlog', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      }
    });
  },
  create: (itemData: Omit<BacklogItem, 'id'>) => {
    const token = localStorage.getItem('auth_token');
    return apiRequest<BacklogItem>('/backlog', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(itemData),
    });
  },
  update: (id: string, itemData: Partial<BacklogItem>) => {
    const token = localStorage.getItem('auth_token');
    return apiRequest<BacklogItem>('/backlog', {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id, ...itemData }),
    });
  },
  delete: (id: string) => {
    const token = localStorage.getItem('auth_token');
    return apiRequest('/backlog', {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ id }),
    });
  },
};

// Sprint API
export const sprintApi = {
  getAll: () => apiRequest<Sprint[]>('/sprints'),
  create: (sprintData: Omit<Sprint, 'id'>) =>
    apiRequest<Sprint>('/sprints', {
      method: 'POST',
      body: JSON.stringify(sprintData),
    }),
  update: (id: string, sprintData: Partial<Sprint>) =>
    apiRequest<Sprint>('/sprints', {
      method: 'PUT',
      body: JSON.stringify({ id, ...sprintData }),
    }),
  delete: (id: string) =>
    apiRequest('/sprints', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Task Completion API
export const taskCompletionApi = {
  getAll: () => apiRequest<TaskCompletion[]>('/taskcompletion'),
  create: (completionData: Omit<TaskCompletion, 'id'>) =>
    apiRequest<TaskCompletion>('/taskcompletion', {
      method: 'POST',
      body: JSON.stringify(completionData),
    }),
  update: (id: string, completionData: Partial<TaskCompletion>) =>
    apiRequest<TaskCompletion>('/taskcompletion', {
      method: 'PUT',
      body: JSON.stringify({ id, ...completionData }),
    }),
  delete: (id: string) =>
    apiRequest('/taskcompletion', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Velocity API
export const velocityApi = {
  getAll: () => apiRequest<VelocityMetric[]>('/velocity'),
  create: (velocityData: Omit<VelocityMetric, 'id'>) =>
    apiRequest<VelocityMetric>('/velocity', {
      method: 'POST',
      body: JSON.stringify(velocityData),
    }),
  update: (id: string, velocityData: Partial<VelocityMetric>) =>
    apiRequest<VelocityMetric>('/velocity', {
      method: 'PUT',
      body: JSON.stringify({ id, ...velocityData }),
    }),
  delete: (id: string) =>
    apiRequest('/velocity', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Notification API
export const notificationApi = {
  getAll: () => apiRequest<Notification[]>('/notification'),
  create: (notificationData: Omit<Notification, 'id'>) =>
    apiRequest<Notification>('/notification', {
      method: 'POST',
      body: JSON.stringify(notificationData),
    }),
  update: (id: string, notificationData: Partial<Notification>) =>
    apiRequest<Notification>('/notification', {
      method: 'PUT',
      body: JSON.stringify({ id, ...notificationData }),
    }),
  delete: (id: string) =>
    apiRequest('/notification', {
      method: 'DELETE',
      body: JSON.stringify({ id }),
    }),
};

// Dashboard API
export const dashboardApi = {
  getData: () => apiRequest('/Dashboard'),
};

// Performance API
export const performanceApi = {
  getData: () => apiRequest('/performance'),
};

// Adaptive Planning API
export const adaptiveApi = {
  getData: () => apiRequest('/adaptive'),
};

// Main API object for easy access
export const api = {
  users: userApi,
  teams: teamApi,
  backlog: backlogApi,
  sprints: sprintApi,
  notifications: notificationApi,
  performance: performanceApi,
  adaptive: adaptiveApi,
};