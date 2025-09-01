import axios from 'axios';

const API_URL = 'http://192.168.254.20:3000';

export interface User {
  id: number;
  username: string;
  email: string;
  role: string;
  createdAt: string;
  updatedAt: string;
}

export interface UserCreateDTO {
  username: string;
  email: string;
  password: string;
  role: string;
}

export interface UserUpdateDTO {
  username?: string;
  email?: string;
  password?: string;
  role?: string;
}

class UserService {
  private getAuthHeader() {
    const token = localStorage.getItem('token');
    if (!token) {
      throw new Error('No authentication token found');
    }
    return { 
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  async getUsers(): Promise<User[]> {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        // Redirect to login if token is invalid
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  async getUser(id: number): Promise<User> {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  async createUser(user: UserCreateDTO): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/users`, user, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  async updateUser(id: number, user: UserUpdateDTO): Promise<User> {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, user, {
        headers: this.getAuthHeader()
      });
      return response.data;
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: this.getAuthHeader()
      });
    } catch (error: any) {
      if (error.response?.status === 401) {
        window.location.href = '/login';
        throw new Error('Authentication failed');
      }
      throw error;
    }
  }
}

export const userService = new UserService();
