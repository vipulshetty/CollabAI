import axios from 'axios';

const API_URL = process.env.NEXT_PUBLIC_API_URL;

const apiService = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
});

// Request interceptor
apiService.interceptors.request.use(
  (config) => {
    // You can add auth tokens or other headers here
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
apiService.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      window.location.href = '/auth/signin';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const meetingsApi = {
  getUpcoming: () => apiService.get('/meetings/upcoming'),
  getRecent: () => apiService.get('/meetings/recent'),
  create: (data: any) => apiService.post('/meetings', data),
  join: (meetingId: string) => apiService.post(`/meetings/${meetingId}/join`),
  end: (meetingId: string) => apiService.post(`/meetings/${meetingId}/end`),
  getSummary: (meetingId: string) => apiService.get(`/meetings/${meetingId}/summary`),
  getTranscript: (meetingId: string) => apiService.get(`/meetings/${meetingId}/transcript`),
};

export const analyticsApi = {
  getData: () => apiService.get('/analytics'),
};

export const authApi = {
  getCurrentUser: () => apiService.get('/auth/user'),
  logout: () => apiService.post('/auth/logout'),
};

export default apiService;
