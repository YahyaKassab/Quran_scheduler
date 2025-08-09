import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error.response?.data || error.message);
    return Promise.reject(error);
  }
);

// Surah API endpoints
export const surahAPI = {
  // Initialize surahs in database
  initialize: () => api.post('/surahs/initialize'),
  
  // Get all surahs
  getAll: () => api.get('/surahs'),
  
  // Get single surah by number
  getByNumber: (number) => api.get(`/surahs/${number}`),
  
  // Get memorization status for all surahs
  getMemorizationStatus: (userId = 'default_user') => 
    api.get('/surahs/status/all', { params: { userId } }),
  
  // Get pages for a specific surah with memorization status
  getSurahPages: (number, userId = 'default_user') => 
    api.get(`/surahs/${number}/pages`, { params: { userId } }),
  
  // Update memorization status for a single page
  updateMemorizationStatus: (data) => api.put('/surahs/status', data),
  
  // Batch update memorization statuses
  batchUpdateMemorizationStatus: (updates, userId = 'default_user') =>
    api.put('/surahs/status/batch', { updates, userId }),
};

// Schedule API endpoints
export const scheduleAPI = {
  // Generate new schedule
  generate: (data) => api.post('/schedules/generate', data),
  
  // Get all schedules
  getAll: (userId = 'default_user') => api.get('/schedules', { params: { userId } }),
  
  // Get today's assignments
  getTodaysAssignments: (userId = 'default_user') => 
    api.get('/schedules/today', { params: { userId } }),
  
  // Get single schedule by ID
  getById: (id) => api.get(`/schedules/${id}`),
  
  // Update assignment completion status
  updateAssignmentCompletion: (data) => api.put('/schedules/assignment/complete', data),
  
  // Delete schedule
  delete: (id) => api.delete(`/schedules/${id}`),
};

// Progress API endpoints
export const progressAPI = {
  // Get progress statistics
  getStats: (userId = 'default_user') => api.get('/progress/stats', { params: { userId } }),
  
  // Get recent activity
  getRecent: (userId = 'default_user', limit = 10) => 
    api.get('/progress/recent', { params: { userId, limit } }),
};

export default api;