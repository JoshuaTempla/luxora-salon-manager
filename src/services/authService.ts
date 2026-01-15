// Authentication operations

import { apiClient } from './api';

export interface User {
  id: string;
  username: string;
  role: string;
}

export interface LoginDto {
  username: string;
  password: string;
}

export interface RegisterDto {
  username: string;
  password: string;
  role?: string;
}

export interface AuthResponse {
  user: User;
  token?: string; // If you're using JWT tokens
}

export const authService = {
  // Login
  async login(credentials: LoginDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login', credentials);
    
    // Store token if provided
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  // Register new user
  async register(userData: RegisterDto): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/register', userData);
    
    // Store token if provided
    if (response.token) {
      localStorage.setItem('auth_token', response.token);
    }
    
    return response;
  },

  // Logout
  async logout(): Promise<void> {
    localStorage.removeItem('auth_token');
    // Optionally call backend logout endpoint if you have one
    // await apiClient.post('/auth/logout');
  },

  // Get current user
  async getCurrentUser(): Promise<User> {
    return apiClient.get<User>('/auth/me');
  },

  // Check if user is authenticated
  isAuthenticated(): boolean {
    return !!localStorage.getItem('auth_token');
  },

  // Get stored token
  getToken(): string | null {
    return localStorage.getItem('auth_token');
  },
};