/**
 * NULL//ROOT Core API Client
 * Authoritative Neural Backend Gateway
 */

const API_BASE_URL =
  (import.meta as any).env?.VITE_API_URL || 'http://localhost:8000';

export interface ApiErrorResponse {
  error?: string;
  status_code?: number;
  message?: string;
  detail?: string;
  details?: any;
}

export class ApiClient {
  private static token: string | null = localStorage.getItem('null_root_token');

  static setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('null_root_token', token);
    } else {
      localStorage.removeItem('null_root_token');
    }
  }

  static getToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('null_root_token');
    }
    return this.token;
  }

  static getSessionId(): string {
    let sid = localStorage.getItem('null_root_session_id');
    if (!sid) {
      sid = 'session_' + Math.random().toString(36).substring(2, 10);
      localStorage.setItem('null_root_session_id', sid);
    }
    return sid;
  }

  static async post<T>(endpoint: string, data: any): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        responseData.message ||
        responseData.detail ||
        `HTTP_${response.status}: Request failed`;
      const error = new Error(errorMsg) as Error & { status?: number; data?: any };
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return responseData as T;
  }

  static async get<T>(endpoint: string): Promise<T> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getToken();

    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    const responseData = await response.json().catch(() => ({}));

    if (!response.ok) {
      const errorMsg =
        responseData.message ||
        responseData.detail ||
        `HTTP_${response.status}: Request failed`;
      const error = new Error(errorMsg) as Error & { status?: number; data?: any };
      error.status = response.status;
      error.data = responseData;
      throw error;
    }

    return responseData as T;
  }
}
