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
    return { Authorization: `Bearer ${token}` };
  }

  async getUsers(): Promise<User[]> {
    const response = await axios.get(`${API_URL}/users`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async getUser(id: number): Promise<User> {
    const response = await axios.get(`${API_URL}/users/${id}`, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async createUser(user: UserCreateDTO): Promise<User> {
    const response = await axios.post(`${API_URL}/users`, user, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async updateUser(id: number, user: UserUpdateDTO): Promise<User> {
    const response = await axios.put(`${API_URL}/users/${id}`, user, {
      headers: this.getAuthHeader()
    });
    return response.data;
  }

  async deleteUser(id: number): Promise<void> {
    await axios.delete(`${API_URL}/users/${id}`, {
      headers: this.getAuthHeader()
    });
  }
}

export const userService = new UserService();
