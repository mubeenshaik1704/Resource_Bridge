import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT token from localStorage to every outgoing request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('resource_bridge_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Authentication APIs
export const loginUser = async (usernameOrEmail, password) => {
  const response = await api.post('/auth/login', { usernameOrEmail, password });
  if (response.data.token) {
    localStorage.setItem('resource_bridge_token', response.data.token);
    localStorage.setItem('resource_bridge_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const registerSchool = async (schoolData) => {
  const response = await api.post('/auth/register-school', schoolData);
  if (response.data.token) {
    localStorage.setItem('resource_bridge_token', response.data.token);
    localStorage.setItem('resource_bridge_user', JSON.stringify(response.data.user));
  }
  return response.data;
};

export const getCurrentUser = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

export const logoutUser = () => {
  localStorage.removeItem('resource_bridge_token');
  localStorage.removeItem('resource_bridge_user');
};

export const checkSystemHealth = async () => {
  const response = await api.get('/health');
  return response.data;
};

export const fetchStats = async () => {
  const response = await api.get('/stats');
  return response.data;
};

export const fetchSchools = async () => {
  const response = await api.get('/schools');
  return response.data;
};

export const updateSchoolProfile = async (id, schoolData) => {
  const response = await api.put(`/schools/${id}`, schoolData);
  return response.data;
};

export const fetchResources = async (params = {}) => {
  const response = await api.get('/resources', { params });
  return response.data;
};

export const createResource = async (resourceData) => {
  const response = await api.post('/resources', resourceData);
  return response.data;
};

export const updateResource = async (id, resourceData) => {
  const response = await api.put(`/resources/${id}`, resourceData);
  return response.data;
};

export const deleteResource = async (id) => {
  const response = await api.delete(`/resources/${id}`);
  return response.data;
};

export const updateResourceLifecycle = async (id, data) => {
  const response = await api.patch(`/resources/${id}/lifecycle`, data);
  return response.data;
};

export const fetchRequirements = async (params = {}) => {
  const response = await api.get('/requirements', { params });
  return response.data;
};

export const submitRequirement = async (requirementData) => {
  const response = await api.post('/requirements', requirementData);
  return response.data;
};

export const deleteRequirement = async (id) => {
  const response = await api.delete(`/requirements/${id}`);
  return response.data;
};

export const fetchAllocations = async () => {
  const response = await api.get('/allocations');
  return response.data;
};

export const triggerAllocationScan = async () => {
  const response = await api.post('/allocations/scan');
  return response.data;
};

export const fetchDecisions = async () => {
  const response = await api.get('/decisions');
  return response.data;
};

export const submitOfficerDecision = async (decisionData) => {
  const response = await api.post('/decisions', decisionData);
  return response.data;
};

export const reseedData = async () => {
  const response = await api.post('/seed');
  return response.data;
};

// ── AI Decision-Support ────────────────────────────────────────────────────
// Sends a requirementId to the backend AI endpoint.
// Backend calls Gemini, returns ranked candidates with scores and reasons.
// The API key is NEVER exposed to the frontend — all AI calls go through /api/ai.
export const analyzeAllocationsWithAI = async (requirementId) => {
  const response = await api.post('/ai/analyze-allocations', { requirementId });
  return response.data;
};

export default api;
