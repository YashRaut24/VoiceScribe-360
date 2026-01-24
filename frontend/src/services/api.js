const API_BASE_URL = 'http://localhost:3000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  removeToken() {
    this.token = null;
    localStorage.removeItem('token');
  }

  async request(endpoint, options = {}) {
    const url = `${API_BASE_URL}${endpoint}`;
    const config = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    if (this.token) {
      config.headers.Authorization = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, config);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Something went wrong');
      }

      return data;
    } catch (error) {
      throw error;
    }
  }

  // Auth methods
  async login(email, password, userType) {
    const response = await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password, userType }),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  async register(userData) {
    const response = await this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
    
    if (response.token) {
      this.setToken(response.token);
    }
    
    return response;
  }

  // Appointments
  async getAppointments() {
    return this.request('/appointments');
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  // Medical Records
  async getMedicalRecords() {
    return this.request('/medical-records');
  }

  async createMedicalRecord(recordData) {
    return this.request('/medical-records', {
      method: 'POST',
      body: JSON.stringify(recordData),
    });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  // Symptoms
  async createSymptom(symptomsText, severity = 'mild') {
    return this.request('/symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptomsText, severity }),
    });
  }

  async getSymptoms() {
    return this.request('/symptoms');
  }
}

export default new ApiService();
