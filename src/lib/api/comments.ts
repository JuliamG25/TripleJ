import { apiClient } from './client';
import type { Comment } from '../types';

export interface CommentsResponse {
  comments: any[];
}

export interface SingleCommentResponse {
  comment: any;
}

const transformComment = (comment: any): Comment => ({
  id: comment._id || comment.id,
  taskId: comment.taskId._id || comment.taskId.id || comment.taskId,
  author: {
    id: comment.author._id || comment.author.id,
    name: comment.author.name,
    email: comment.author.email,
    role: comment.author.role,
    avatar: comment.author.avatar,
  },
  content: comment.content,
  createdAt: new Date(comment.createdAt),
});

export const commentsApi = {
  async getByTaskId(taskId: string): Promise<Comment[]> {
    const response = await apiClient.get<CommentsResponse>(`/api/comments?taskId=${taskId}`);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al obtener comentarios');
    }

    return response.data.comments.map(transformComment);
  },

  async create(data: { taskId: string; content: string }): Promise<Comment> {
    const response = await apiClient.post<SingleCommentResponse>('/api/comments', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.message || 'Error al crear comentario');
    }

    return transformComment(response.data.comment);
  },

  async delete(id: string): Promise<void> {
    const response = await apiClient.delete(`/api/comments/${id}`);
    
    if (!response.success) {
      throw new Error(response.message || 'Error al eliminar comentario');
    }
  },
};
