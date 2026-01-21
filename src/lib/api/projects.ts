import { apiClient } from './client';
import type { Project } from '../types';

export interface ProjectResponse {
  projects: any[];
}

export interface SingleProjectResponse {
  project: any;
}

const transformProject = (project: any): Project => ({
  id: project._id || project.id,
  name: project.name,
  description: project.description,
  leader: {
    id: project.leader._id || project.leader.id,
    name: project.leader.name,
    email: project.leader.email,
    role: project.leader.role,
    avatar: project.leader.avatar,
  },
  members: (project.members || []).map((member: any) => ({
    id: member._id || member.id,
    name: member.name,
    email: member.email,
    role: member.role,
    avatar: member.avatar,
  })),
  tasks: [],
  createdAt: new Date(project.createdAt),
});

export const projectsApi = {
  async getAll(): Promise<Project[]> {
    const response = await apiClient.get<ProjectResponse>('/api/projects');
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener proyectos');
    }

    return response.data.projects.map(transformProject);
  },

  async getById(id: string): Promise<Project> {
    const response = await apiClient.get<SingleProjectResponse>(`/api/projects/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener proyecto');
    }

    return transformProject(response.data.project);
  },

  async create(data: { name: string; description: string; members?: string[] }): Promise<Project> {
    const response = await apiClient.post<SingleProjectResponse>('/api/projects', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al crear proyecto');
    }

    return transformProject(response.data.project);
  },

  async update(id: string, data: Partial<Project>): Promise<Project> {
    const response = await apiClient.put<SingleProjectResponse>(`/api/projects/${id}`, data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al actualizar proyecto');
    }

    return transformProject(response.data.project);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/projects/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar proyecto');
    }
  },

  async updateMembers(projectId: string, action: 'add' | 'remove', userId: string): Promise<Project> {
    const response = await apiClient.put<SingleProjectResponse>(
      `/api/projects/${projectId}/members`,
      { action, userId }
    );
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al gestionar miembros');
    }

    return transformProject(response.data.project);
  },
};
