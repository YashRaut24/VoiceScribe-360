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

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
        const err = new Error(data.message || 'Something went wrong');
        err.errors = data.errors || [];
        throw err;
    }

    return data;
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

  async verifyToken() {
    return this.request('/auth/verify');
  }

  // Appointments
  async getAppointments() {
    return this.request('/appointments');
  }

  async getConsultationRequests() {
    return this.request('/consultation-requests');
  }

  async getMyOnlineConsultations() {
      return this.request('/my-online-consultations');
  }

  async getConsultationSession(appointmentId) {
    return this.request(`/consultation-session/${appointmentId}`);
  }

  async updateConsultationStatus(id, status) {
    return this.request(`/appointments/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status })
      });
  }

  async getActiveConsultations() {
    return this.request('/active-consultations');
  }

  async createAppointment(appointmentData) {
    return this.request('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  }

  async updateAppointmentStatus(id, status) {
      return this.request(`/appointments/${id}/status`, {
          method: 'PATCH',
          body: JSON.stringify({ status })
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

  async updateMedicalRecord(id, recordData) {
      return this.request(`/medical-records/${id}`, {
          method: 'PATCH',
          body: JSON.stringify(recordData),
      });
  }

  // Doctors
  async getDoctors() {
    return this.request('/doctors');
  }

  // Patients
  async getPatients() {
      return this.request('/patients');
  }

  // Dashboard
  async getDashboardStats() {
      return this.request('/dashboard/stats');
  }

  // Audio
  async uploadAudio(audioBlob) {
      const formData = new FormData();
      formData.append('audio', audioBlob, 'consultation.webm');

      const url = `${API_BASE_URL}/upload-audio`;
      const response = await fetch(url, {
          method: 'POST',
          headers: {
              Authorization: `Bearer ${this.token}`
          },
          body: formData
      });

      const data = await response.json();

      if (!response.ok) {
          const err = new Error(data.message || 'Audio upload failed');
          err.errors = data.errors || [];
          throw err;
      }

      return data;
  }

  // SOAP Notes
  async generateSoap(transcript) {
      return this.request('/generate-soap', {
          method: 'POST',
          body: JSON.stringify({ transcript })
      });
  }

  async analyzeSymptoms(symptoms) {
    return this.request('/analyze-symptoms', {
        method: 'POST',
        body: JSON.stringify({ symptoms })
    });
  }

  // Symptoms
  async getSymptoms() {
    return this.request('/symptoms');
  }

  async createSymptom(symptomsText) {
    return this.request('/symptoms', {
      method: 'POST',
      body: JSON.stringify({ symptomsText }),
    });
  }

  async deleteSymptom(id) {
    return this.request(`/symptoms/${id}`, {
        method: 'DELETE'
    });
}

async getNotifications() {
    return this.request('/notifications');
}

async markNotificationRead(id) {
    return this.request(`/notifications/${id}/read`, {
        method: 'PATCH'
    });
}
}

export default new ApiService();
