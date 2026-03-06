import axios, { AxiosInstance, AxiosError } from 'axios';

interface ApiConfig {
  baseURL: string;
  timeout?: number;
}

interface ApiResponse<T = any> {
  data: T;
  status: number;
  message?: string;
}

class MSMApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Restore token from localStorage
    const savedToken = localStorage.getItem('jwt_token');
    if (savedToken) {
      this.setToken(savedToken);
    }

    // Request interceptor
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response?.status === 401) {
          // Token expired
          localStorage.removeItem('jwt_token');
          localStorage.removeItem('user');
          window.location.href = '/auth';
        }
        return Promise.reject(error);
      }
    );
  }

  setToken(token: string) {
    this.token = token;
    localStorage.setItem('jwt_token', token);
    this.client.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  clearToken() {
    this.token = null;
    localStorage.removeItem('jwt_token');
    delete this.client.defaults.headers.common['Authorization'];
  }

  // Auth endpoints
  async login(email: string, password: string) {
    const response = await this.client.post('/auth/login', { email, password });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  async register(email: string, name: string, password: string) {
    const response = await this.client.post('/auth/register', { email, name, password });
    if (response.data.token) {
      this.setToken(response.data.token);
    }
    return response.data;
  }

  // Courses endpoints
  async getCourses() {
    const response = await this.client.get('/courses');
    return response.data;
  }

  async getCourse(courseId: string) {
    const response = await this.client.get(`/courses/${courseId}`);
    return response.data;
  }

  // Config endpoints
  async getConfig(courseId: string) {
    const response = await this.client.get(`/admin/courses/${courseId}/config`);
    return response.data;
  }

  async updateConfig(courseId: string, config: any) {
    const response = await this.client.put(`/admin/courses/${courseId}/config`, config);
    return response.data;
  }

  // Scenarios endpoints
  async getScenarios(courseId: string) {
    const response = await this.client.get(`/admin/courses/${courseId}/scenarios`);
    return response.data;
  }

  async getScenario(scenarioId: number) {
    const response = await this.client.get(`/admin/scenarios/${scenarioId}`);
    return response.data;
  }

  async createScenario(courseId: string, scenario: any) {
    const response = await this.client.post(`/admin/courses/${courseId}/scenarios`, scenario);
    return response.data;
  }

  // Simulation endpoints
  async startSimulation(studentId: string, courseId: string, scenarioId: number) {
    const response = await this.client.post('/api/simulations/start', {
      studentId,
      courseId,
      scenarioId,
    });
    return response.data;
  }

  async getSimulation(simulationId: number) {
    const response = await this.client.get(`/api/simulations/${simulationId}`);
    return response.data;
  }

  async updateSimulationState(simulationId: number, state: any) {
    const response = await this.client.post(`/api/simulations/${simulationId}/update-state`, {
      state,
    });
    return response.data;
  }

  async completeSimulation(simulationId: number, metrics: any) {
    const response = await this.client.post(`/api/simulations/${simulationId}/complete`, metrics);
    return response.data;
  }

  // Practice Logs endpoints
  async logAction(
    studentId: string,
    courseId: string,
    actionType: string,
    description: string,
    metadata: any
  ) {
    const response = await this.client.post('/admin/logs', {
      studentId,
      courseId,
      actionType,
      description,
      metadata,
    });
    return response.data;
  }

  async getLogs(courseId: string, filters?: any) {
    const response = await this.client.get(`/admin/logs/course/${courseId}`, {
      params: filters,
    });
    return response.data;
  }

  async getStudentLogs(studentId: string, courseId: string) {
    const response = await this.client.get(
      `/admin/logs/student/${studentId}/course/${courseId}`
    );
    return response.data;
  }

  async verifyLogIntegrity(studentId: string, courseId: string) {
    const response = await this.client.get(
      `/admin/logs/verify/${studentId}/course/${courseId}`
    );
    return response.data;
  }

  async exportLogsAsCSV(studentId: string, courseId: string) {
    const response = await this.client.get(
      `/admin/logs/student/${studentId}/course/${courseId}/export/csv`,
      {
        responseType: 'blob',
      }
    );
    return response.data;
  }

  // Admin endpoints
  async getCourseStatistics(courseId: string) {
    const response = await this.client.get(`/admin/courses/${courseId}/statistics`);
    return response.data;
  }

  async getScenarioStats(scenarioId: number) {
    const response = await this.client.get(`/admin/scenarios/${scenarioId}/stats`);
    return response.data;
  }

  // Generic request handler
  async request<T = any>(
    method: 'get' | 'post' | 'put' | 'delete' | 'patch',
    url: string,
    data?: any,
    config?: any
  ): Promise<T> {
    try {
      const response = await this.client[method](url, data, config);
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

// Export singleton instance
export const msmApi = new MSMApiClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export default MSMApiClient;
