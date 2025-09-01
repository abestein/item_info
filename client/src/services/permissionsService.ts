import axios from 'axios';
import { authService } from './authService';
import type { PagePermission } from '../types/user.types';

const API_URL = 'http://192.168.254.20:3000/api';

class PermissionsService {
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

  async getAvailablePages(): Promise<PagePermission[]> {
    try {
      const response = await axios.get(`${API_URL}/permissions/pages`, {
        headers: this.getAuthHeaders()
      });
      return response.data.pages || response.data || [];
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async getRolePermissions(role: string): Promise<string[]> {
    try {
      const response = await axios.get(`${API_URL}/permissions/roles/${role}`, {
        headers: this.getAuthHeaders()
      });
      return response.data.permissions;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }

  async validatePermissions(permissions: string[]): Promise<boolean> {
    try {
      const response = await axios.post(`${API_URL}/permissions/validate`, 
        { permissions }, 
        { headers: this.getAuthHeaders() }
      );
      return response.data.valid;
    } catch (error: any) {
      this.handleError(error);
      throw error;
    }
  }
}

export const permissionsService = new PermissionsService();
