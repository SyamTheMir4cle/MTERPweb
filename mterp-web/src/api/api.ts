import axios from 'axios';

// API Base URL - use local backend or production
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor to add Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('userToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('userToken');
      localStorage.removeItem('userData');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

// === TOOL MANAGEMENT API ===

export const getToolDashboard = async (search = '') => {
  const response = await api.get(`/tools/dashboard?search=${search}`);
  return response.data;
};

export const assignToolToProject = async (data: {
  toolId: string;
  projectId: string;
  quantity: number;
  notes?: string;
}) => {
  const response = await api.put(`/tools/${data.toolId}/assign`, data);
  return response.data;
};

export const tagToolUsage = async (data: {
  projectToolId: string;
  usedByWorker: string;
  workItem: string;
  notes?: string;
}) => {
  const response = await api.post('/inventory/usage', data);
  return response.data;
};

export const getProjectTools = async (projectId: string) => {
  const response = await api.get(`/inventory/project/${projectId}`);
  return response.data;
};

export const returnToolToWarehouse = async (data: {
  projectToolId: string;
  quantity: number;
}) => {
  const response = await api.post('/inventory/return-warehouse', data);
  return response.data;
};

export default api;
