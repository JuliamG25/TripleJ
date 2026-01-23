import { apiClient } from './client';
import type { User } from '../types';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  name: string;
  email: string;
  password: string;
  role?: 'administrador' | 'lider' | 'desarrollador';
}

export interface AuthResponse {
  user: User;
  token: string;
}

export const authApi = {
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const response = await apiClient.post<{ user: any; token: string }>(
      '/api/auth/login',
      credentials
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al iniciar sesión');
    }

    const { user, token } = response.data;
    
    // Preparar usuario con ID como string
    const userData = {
      id: String(user.id || user._id), // Asegurar que siempre sea string
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // Guardar token en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fesc-token', token);
      localStorage.setItem('fesc-user', JSON.stringify(userData));
    }

    return {
      user: userData,
      token,
    };
  },

  async register(data: RegisterData): Promise<AuthResponse> {
    const response = await apiClient.post<{ user: any; token: string }>(
      '/api/auth/register',
      data
    );

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al registrar usuario');
    }

    const { user, token } = response.data;
    
    // Preparar usuario con ID como string
    const userData = {
      id: String(user.id || user._id), // Asegurar que siempre sea string
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // Guardar token en localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fesc-token', token);
      localStorage.setItem('fesc-user', JSON.stringify(userData));
    }

    return {
      user: userData,
      token,
    };
  },

  async getMe(): Promise<User> {
    const response = await apiClient.get<{ user: any }>('/api/auth/me');

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener usuario');
    }

    const { user } = response.data;
    return {
      id: String(user.id || user._id), // Asegurar que siempre sea string
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  },

  logout(): void {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('fesc-token');
      localStorage.removeItem('fesc-user');
      window.location.href = '/login';
    }
  },

  getStoredUser(): User | null {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem('fesc-user');
    return stored ? JSON.parse(stored) : null;
  },

  isAuthenticated(): boolean {
    if (typeof window === 'undefined') return false;
    return !!localStorage.getItem('fesc-token');
  },

  async updateProfile(data: {
    name?: string;
    email?: string;
    avatar?: string;
    currentPassword?: string;
    newPassword?: string;
  }): Promise<User> {
    const response = await apiClient.put<{ user: any }>('/api/auth/profile', data);

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al actualizar perfil');
    }

    const { user } = response.data;
    const userData = {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // Actualizar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fesc-user', JSON.stringify(userData));
    }

    return userData;
  },

  async uploadAvatar(avatar: string): Promise<User> {
    const response = await apiClient.post<{ user: any }>('/api/auth/upload-avatar', { avatar });

    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al subir avatar');
    }

    const { user } = response.data;
    const userData = {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
    
    // Actualizar localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('fesc-user', JSON.stringify(userData));
    }

    return userData;
  },
};
