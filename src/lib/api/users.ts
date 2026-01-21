import { apiClient } from './client';
import type { User } from '../types';

export interface UsersResponse {
  users: any[];
}

const transformUser = (user: any): User => ({
  id: user._id || user.id,
  name: user.name,
  email: user.email,
  role: user.role,
  avatar: user.avatar,
});

export const usersApi = {
  async getAll(filters?: { role?: string }): Promise<User[]> {
    const params = new URLSearchParams();
    if (filters?.role) params.append('role', filters.role);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<UsersResponse>(`/api/users${query}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener usuarios');
    }

    return response.data.users.map(transformUser);
  },
};
