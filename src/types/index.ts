export enum UserRole {
  ADMIN = 'ADMIN',
  MANAGER = 'MANAGER',
  EMPLOYEE = 'EMPLOYEE',
}

export enum EmploymentStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  ON_LEAVE = 'ON_LEAVE',
}

export enum LeaveType {
  CASUAL = 'CASUAL',
  SICK = 'SICK',
  EARNED = 'EARNED',
  UNPAID = 'UNPAID',
}

export enum LeaveStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

export interface User {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  role: UserRole;
  departmentId: number;
  departmentName: string;
  designation: string;
  avatarUrl?: string;
}

export interface Employee {
  id: number;
  employeeId: string;
  fullName: string;
  email: string;
  phoneNumber: string;
  departmentId: number;
  departmentName: string;
  designation: string;
  dateOfJoining: string;
  reportingManagerId?: number;
  reportingManagerName: string;
  employmentStatus: EmploymentStatus;
  role: UserRole;
  avatarUrl?: string;
}

export interface Department {
  id: number;
  name: string;
  description: string;
  headEmployeeId?: number;
  headName: string;
  employeeCount: number;
  createdAt: string;
}

export interface LeaveRequest {
  id: number;
  applicationId: string;
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  departmentName: string;
  designation: string;
  leaveType: LeaveType;
  startDate: string;
  endDate: string;
  numberOfDays: number;
  reason: string;
  supportingDocumentName?: string;
  appliedDate: string;
  status: LeaveStatus;
  reviewedBy?: string;
  reviewedDate?: string;
  rejectionReason?: string;
}

export interface LeaveBalanceItem {
  leaveType: LeaveType;
  label: string;
  totalAllowed: number;
  used: number;
  pending: number;
  remaining: number;
}

export interface LeaveBalance {
  employeeId: number;
  year: number;
  casual: LeaveBalanceItem;
  sick: LeaveBalanceItem;
  earned: LeaveBalanceItem;
  unpaid: LeaveBalanceItem;
}

export interface LeavePolicy {
  id: number;
  leaveType: LeaveType;
  displayName: string;
  annualAllowance: number;
  description: string;
  isActive: boolean;
  carryForwardAllowed: boolean;
  updatedAt: string;
}

export interface Notification {
  id: number;
  title: string;
  message: string;
  category: 'LEAVE_APPLIED' | 'LEAVE_APPROVED' | 'LEAVE_REJECTED' | 'EMPLOYEE_CREATED' | 'SYSTEM';
  targetRole: UserRole | 'ALL';
  recipientEmployeeId?: number;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

export interface MonthlyLeaveStat {
  month: string;
  approved: number;
  pending: number;
  rejected: number;
  total: number;
}

export interface DepartmentDistributionStat {
  name: string;
  value: number;
  color: string;
}

export interface LeaveTypeDistributionStat {
  name: string;
  value: number;
  leaveType: LeaveType;
  color: string;
}

export interface LeaveTrendStat {
  month: string;
  applications: number;
  approvals: number;
}

export interface DashboardStatistics {
  // Admin metrics
  totalEmployees: number;
  totalDepartments: number;
  pendingLeaves: number;
  approvedLeaves: number;
  rejectedLeaves: number;
  // Manager metrics
  teamSize?: number;
  employeesOnLeave?: number;
  // Trends / Charts
  monthlyLeaveStats: MonthlyLeaveStat[];
  departmentDistribution: DepartmentDistributionStat[];
  leaveTypeDistribution: LeaveTypeDistributionStat[];
  leaveTrends: LeaveTrendStat[];
}

export interface AuthCredentials {
  email: string;
  password: string;
  rememberMe?: boolean;
}

export interface AuthResponse {
  token: string;
  tokenType: 'Bearer';
  user: User;
  isMockAuth?: boolean;
}

export interface ApiError {
  status: number;
  message: string;
  timestamp?: string;
  details?: Record<string, string>;
}
