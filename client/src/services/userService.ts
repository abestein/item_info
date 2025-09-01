import axios from 'axios';
import { authService } from './authService';
import type { 
  User, 
  UserCreateDTO, 
  UserUpdateDTO, 
  UserListParams, 
  UserListResponse,
  UserPermissionsResponse,
  PagePermission
} from '../types/user.types';

const API_URL = 'http://192.168.254.20:3000/api';

class UserService {
  private getAuthHeaders() {
    const token = authService.getToken();
    if (!token) {
      throw new Error('No authentication token found');
    }
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    };
  }

  private handleError(error: any) {
    if (error.response?.status === 401) {
      authService.logout();
      throw new Error('Authentication failed');
    }
    if (error.response?.status === 403) {
      throw new Error('Access denied. Admin privileges required.');
    }
    if (error.response?.data?.error) {
      throw new Error(error.response.data.error);
    }
    throw new Error(error.message || 'An unexpected error occurred');
  }

  async getUsers(params: UserListParams = {}): Promise<UserListResponse> {
    try {
      const response = await axios.get(`${API_URL}/users`, {
        headers: this.getAuthHeaders(),
        params
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getUser(id: number): Promise<User> {
    try {
      const response = await axios.get(`${API_URL}/users/${id}`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async createUser(user: UserCreateDTO): Promise<User> {
    try {
      const response = await axios.post(`${API_URL}/users`, user, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async updateUser(id: number, user: UserUpdateDTO): Promise<User> {
    try {
      const response = await axios.put(`${API_URL}/users/${id}`, user, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async deleteUser(id: number): Promise<void> {
    try {
      await axios.delete(`${API_URL}/users/${id}`, {
        headers: this.getAuthHeaders()
      });
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  // Validation helpers
  validateUsername(username: string): string | null {
    if (!username || username.length < 3) {
      return 'Username must be at least 3 characters long';
    }
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return 'Username can only contain letters, numbers, and underscores';
    }
    return null;
  }

  validatePassword(password: string): string | null {
    if (!password || password.length < 8) {
      return 'Password must be at least 8 characters long';
    }
    if (!/(?=.*[a-z])/.test(password)) {
      return 'Password must contain at least one lowercase letter';
    }
    if (!/(?=.*[A-Z])/.test(password)) {
      return 'Password must contain at least one uppercase letter';
    }
    if (!/(?=.*\d)/.test(password)) {
      return 'Password must contain at least one number';
    }
    if (!/(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?])/.test(password)) {
      return 'Password must contain at least one special character';
    }
    return null;
  }

  validateEmail(email: string): string | null {
    if (!email) {
      return 'Email is required';
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return 'Please enter a valid email address';
    }
    return null;
  }

  // Permissions management
  async getUserPermissions(userId: number): Promise<UserPermissionsResponse> {
    try {
      const response = await axios.get(`${API_URL}/users/${userId}/permissions`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async updateUserPermissions(userId: number, permissions: string[] | null): Promise<void> {
    try {
      await axios.put(`${API_URL}/users/${userId}/permissions`, 
        { permissions }, 
        { headers: this.getAuthHeaders() }
      );
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getAvailablePages(): Promise<PagePermission[]> {
    try {
      const response = await axios.get(`${API_URL}/permissions/pages`, {
        headers: this.getAuthHeaders()
      });
      return response.data;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }
}

export const userService = new UserService();
