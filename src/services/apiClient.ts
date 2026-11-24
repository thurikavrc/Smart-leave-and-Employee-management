import axios, { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { ApiError } from '@/src/types';

/**
 * Centralized Axios client configured for the external Java Spring Boot REST API.
 * Base URL defaults to http://localhost:8080/api and can be overridden via VITE_API_BASE_URL.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

/**
 * Toggle mock mode via environment variable.
 * Defaults to true for standalone frontend demonstration until the Spring Boot backend is running.
 */
export const IS_MOCK_MODE =
  import.meta.env.VITE_USE_MOCK_API !== 'false';

export const TOKEN_STORAGE_KEY = 'slms_jwt_token';
export const USER_STORAGE_KEY = 'slms_auth_user';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Attach JWT Authorization header on every outgoing request to Spring Security
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token =
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(TOKEN_STORAGE_KEY);
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Normalize Spring Boot REST error responses
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError<ApiError>) => {
    const normalizedError: ApiError = {
      status: error.response?.status || 500,
      message:
        error.response?.data?.message ||
        error.message ||
        'An unexpected error occurred while communicating with the server.',
      timestamp: error.response?.data?.timestamp,
      details: error.response?.data?.details,
    };

    if (normalizedError.status === 401) {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
    }

    return Promise.reject(normalizedError);
  }
);
