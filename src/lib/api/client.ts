const API_BASE_URL = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:4321';

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  count?: number;
}

class ApiClient {
  private getToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('fesc-token');
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const token = this.getToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...options,
        headers,
      });

      let data;
      try {
        data = await response.json();
      } catch (e) {
        // Si la respuesta no es JSON, crear un error
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }

      if (!response.ok) {
        const errorMessage = data?.message || `Error ${response.status}: ${response.statusText}`;
        
        // Si es error de autenticación, limpiar token
        if (response.status === 401) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('fesc-token');
            localStorage.removeItem('fesc-user');
          }
        }
        
        throw new Error(errorMessage);
      }

      return data;
    } catch (error: any) {
      // Mejorar mensajes de error
      if (error.message.includes('Failed to fetch') || error.message.includes('NetworkError')) {
        throw new Error('Error de conexión. Verifica que el servidor esté corriendo y MongoDB esté conectado.');
      }
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: any): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient();
