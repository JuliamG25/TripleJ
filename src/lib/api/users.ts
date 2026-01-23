import { apiClient } from './client';
import type { User } from '../types';

export interface CreateUserData {
  name: string;
  email: string;
  password: string;
  role: 'administrador' | 'lider' | 'desarrollador';
}

export interface UsersResponse {
  users: User[];
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  password?: string;
  role?: 'administrador' | 'lider' | 'desarrollador';
}

export const usersApi = {
  async getAll(role?: string): Promise<User[]> {
    const query = role ? `?role=${role}` : '';
    const response = await apiClient.get<UsersResponse>(`/api/users${query}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener usuarios');
    }

    return response.data.users.map(user => ({
      id: String(user.id || (user as any)._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    }));
  },

  async create(userData: CreateUserData): Promise<User> {
    const response = await apiClient.post<{ user: any }>('/api/users', userData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al crear usuario');
    }

    const { user } = response.data;
    return {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  },

  async update(id: string, userData: UpdateUserData): Promise<User> {
    const response = await apiClient.put<{ user: any }>(`/api/users/${id}`, userData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al actualizar usuario');
    }

    const { user } = response.data;
    return {
      id: String(user.id || user._id),
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
    };
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/users/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar usuario');
    }
  },
};
