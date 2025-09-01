import axios from 'axios';
import { API_CONFIG } from '../config/api.config';

interface LoginData {
    username: string;
    password: string;
}

interface RegisterData extends LoginData {
    email: string;
}

interface AuthResponse {
    success: boolean;
    token?: string;
    user?: {
        id: number;
        username: string;
        email: string;
        role: string;
    };
    error?: string;
}

class AuthService {
    private TOKEN_KEY = 'auth_token';
    private USER_KEY = 'auth_user';

    async login(data: LoginData): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/login`, data);
            if (response.data.success) {
                this.setToken(response.data.token);
                this.setUser(response.data.user);
                this.setupAxiosInterceptor();
            }
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Login failed'
            };
        }
    }

    async register(data: RegisterData): Promise<AuthResponse> {
        try {
            const response = await axios.post(`${API_CONFIG.BASE_URL}/auth/register`, data);
            if (response.data.success) {
                this.setToken(response.data.token);
                this.setUser(response.data.user);
                this.setupAxiosInterceptor();
            }
            return response.data;
        } catch (error: any) {
            return {
                success: false,
                error: error.response?.data?.error || 'Registration failed'
            };
        }
    }

    async verify(): Promise<boolean> {
        const token = this.getToken();
        if (!token) return false;

        try {
            const response = await axios.get(`${API_CONFIG.BASE_URL}/auth/verify`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            return response.data.success;
        } catch {
            this.logout();
            return false;
        }
    }

    logout(): void {
        localStorage.removeItem(this.TOKEN_KEY);
        localStorage.removeItem(this.USER_KEY);
        delete axios.defaults.headers.common['Authorization'];
        window.location.href = '/login';
    }

    getToken(): string | null {
        return localStorage.getItem(this.TOKEN_KEY);
    }

    setToken(token: string): void {
        localStorage.setItem(this.TOKEN_KEY, token);
    }

    getUser(): any {
        const user = localStorage.getItem(this.USER_KEY);
        return user ? JSON.parse(user) : null;
    }

    setUser(user: any): void {
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    }

    isAuthenticated(): boolean {
        return !!this.getToken();
    }

    setupAxiosInterceptor(): void {
        const token = this.getToken();
        if (token) {
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
    }
}

export const authService = new AuthService();