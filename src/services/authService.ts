import {
  AuthCredentials,
  AuthResponse,
  User,
  UserRole,
} from '@/src/types';
import {
  apiClient,
  IS_MOCK_MODE,
  TOKEN_STORAGE_KEY,
  USER_STORAGE_KEY,
} from '@/src/services/apiClient';
import { mockStore } from '@/src/services/mockStore';

/**
 * DEMO MOCK AUTHENTICATION ONLY
 * Separated intentionally from backend JWT authentication.
 * Never treat demo credentials or client-side mock tokens as secure or production-ready.
 */
export interface DemoAccountInfo {
  role: UserRole;
  label: string;
  email: string;
  password: string;
  fullName: string;
  designation: string;
}

export const DEMO_ACCOUNTS: DemoAccountInfo[] = [
  {
    role: UserRole.ADMIN,
    label: 'HR Administrator',
    email: 'admin@company.com',
    password: 'password123',
    fullName: 'Claire Sterling',
    designation: 'Director of People Operations',
  },
  {
    role: UserRole.MANAGER,
    label: 'Engineering Manager',
    email: 'manager@company.com',
    password: 'password123',
    fullName: 'Marcus Vance',
    designation: 'Engineering Manager',
  },
  {
    role: UserRole.EMPLOYEE,
    label: 'Software Employee',
    email: 'employee@company.com',
    password: 'password123',
    fullName: 'Liam Mercer',
    designation: 'Senior Full Stack Developer',
  },
];

async function performMockLogin(credentials: AuthCredentials): Promise<AuthResponse> {
  await new Promise((resolve) => setTimeout(resolve, 450));

  const matchedDemo = DEMO_ACCOUNTS.find(
    (acc) =>
      acc.email.toLowerCase() === credentials.email.trim().toLowerCase() &&
      acc.password === credentials.password
  );

  const matchedEmployee = mockStore.employees.find(
    (emp) => emp.email.toLowerCase() === credentials.email.trim().toLowerCase()
  );

  if (!matchedDemo && !(matchedEmployee && credentials.password === 'password123')) {
    throw {
      status: 401,
      message: 'Invalid email or password. Use one of the demo accounts or check your credentials.',
    };
  }

  const emp = matchedEmployee || mockStore.employees[0];
  const user: User = {
    id: emp.id,
    employeeId: emp.employeeId,
    fullName: emp.fullName,
    email: emp.email,
    role: matchedDemo ? matchedDemo.role : emp.role,
    departmentId: emp.departmentId,
    departmentName: emp.departmentName,
    designation: emp.designation,
    avatarUrl: emp.avatarUrl,
  };

  return {
    token: `demo-mock-jwt-token-${user.role.toLowerCase()}-${Date.now()}`,
    tokenType: 'Bearer',
    user,
    isMockAuth: true,
  };
}

export const authService = {
  /**
   * POST /auth/login
   * Authenticates user against Spring Security JWT endpoint or temporary mock auth.
   */
  async login(credentials: AuthCredentials): Promise<AuthResponse> {
    let responseData: AuthResponse;

    if (IS_MOCK_MODE) {
      responseData = await performMockLogin(credentials);
    } else {
      const { data } = await apiClient.post<AuthResponse>('/auth/login', {
        email: credentials.email,
        password: credentials.password,
      });
      responseData = data;
    }

    const storage = credentials.rememberMe ? localStorage : sessionStorage;
    storage.setItem(TOKEN_STORAGE_KEY, responseData.token);
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(responseData.user));
    return responseData;
  },

  /**
   * POST /auth/register
   * Registers a new account via the Spring Boot backend.
   */
  async register(payload: {
    fullName: string;
    email: string;
    password: string;
    departmentId: number;
    designation: string;
  }): Promise<AuthResponse> {
    if (IS_MOCK_MODE) {
      await new Promise((resolve) => setTimeout(resolve, 400));
      throw {
        status: 501,
        message: 'Self-registration is handled by the Spring Boot backend once connected.',
      };
    }
    const { data } = await apiClient.post<AuthResponse>('/auth/register', payload);
    return data;
  },

  logout(): void {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    localStorage.removeItem(USER_STORAGE_KEY);
    sessionStorage.removeItem(TOKEN_STORAGE_KEY);
    sessionStorage.removeItem(USER_STORAGE_KEY);
  },

  getStoredUser(): User | null {
    const raw =
      localStorage.getItem(USER_STORAGE_KEY) ||
      sessionStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as User;
    } catch {
      return null;
    }
  },

  getStoredToken(): string | null {
    return (
      localStorage.getItem(TOKEN_STORAGE_KEY) ||
      sessionStorage.getItem(TOKEN_STORAGE_KEY)
    );
  },
};
