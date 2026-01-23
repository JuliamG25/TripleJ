import { apiClient } from './client';
import type { Meeting } from '../types';

export interface MeetingsResponse {
  meetings: any[];
}

export interface SingleMeetingResponse {
  meeting: any;
}

const transformMeeting = (meeting: any): Meeting => ({
  id: meeting._id || meeting.id,
  title: meeting.title,
  description: meeting.description,
  startDate: new Date(meeting.startDate),
  endDate: new Date(meeting.endDate),
  type: meeting.type,
  meetLink: meeting.meetLink,
  projectId: typeof meeting.projectId === 'object' ? meeting.projectId._id || meeting.projectId.id : meeting.projectId,
  participants: (meeting.participants || []).map((p: any) => ({
    id: p._id || p.id,
    name: p.name,
    email: p.email,
    role: p.role,
    avatar: p.avatar,
  })),
  createdBy: {
    id: meeting.createdBy._id || meeting.createdBy.id,
    name: meeting.createdBy.name,
    email: meeting.createdBy.email,
    role: meeting.createdBy.role,
    avatar: meeting.createdBy.avatar,
  },
  status: meeting.status,
  location: meeting.location,
  createdAt: new Date(meeting.createdAt),
  updatedAt: new Date(meeting.updatedAt),
});

export const meetingsApi = {
  async getAll(projectId?: string, startDate?: string, endDate?: string): Promise<Meeting[]> {
    const params = new URLSearchParams();
    if (projectId) params.append('projectId', projectId);
    if (startDate) params.append('startDate', startDate);
    if (endDate) params.append('endDate', endDate);
    
    const query = params.toString() ? `?${params.toString()}` : '';
    const response = await apiClient.get<MeetingsResponse>(`/api/meetings${query}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener reuniones');
    }

    return response.data.meetings.map(transformMeeting);
  },

  async getById(id: string): Promise<Meeting> {
    const response = await apiClient.get<SingleMeetingResponse>(`/api/meetings/${id}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener reunión');
    }

    return transformMeeting(response.data.meeting);
  },

  async create(data: {
    title: string;
    description: string;
    startDate: Date | string;
    endDate: Date | string;
    type: 'presencial' | 'virtual';
    meetLink?: string;
    projectId: string;
    participants?: string[];
    location?: string;
  }): Promise<Meeting> {
    const response = await apiClient.post<SingleMeetingResponse>('/api/meetings', {
      ...data,
      startDate: typeof data.startDate === 'string' ? data.startDate : data.startDate.toISOString(),
      endDate: typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString(),
    });
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al crear reunión');
    }

    return transformMeeting(response.data.meeting);
  },

  async update(id: string, data: Partial<Meeting>): Promise<Meeting> {
    const updateData: any = { ...data };
    if (data.startDate) {
      updateData.startDate = typeof data.startDate === 'string' ? data.startDate : data.startDate.toISOString();
    }
    if (data.endDate) {
      updateData.endDate = typeof data.endDate === 'string' ? data.endDate : data.endDate.toISOString();
    }
    
    const response = await apiClient.put<SingleMeetingResponse>(`/api/meetings/${id}`, updateData);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al actualizar reunión');
    }

    return transformMeeting(response.data.meeting);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/meetings/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar reunión');
    }
  },
};
