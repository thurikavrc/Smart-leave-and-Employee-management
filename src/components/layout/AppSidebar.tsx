import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Building2,
  CalendarCheck,
  FileText,
  BarChart3,
  Bell,
  Settings,
  UserCircle,
  ClipboardCheck,
  History,
  CalendarPlus,
  Wallet,
  X,
  Briefcase,
} from 'lucide-react';
import { UserRole } from '@/src/types';
import { useAuth } from '@/src/hooks/useAuth';
import { useNotifications } from '@/src/hooks/useNotifications';
import { cn } from '@/src/lib/utils';

interface NavItem {
  label: string;
  to: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number;
}

interface AppSidebarProps {
  mobileOpen: boolean;
  onCloseMobile: () => void;
}

export function AppSidebar({ mobileOpen, onCloseMobile }: AppSidebarProps) {
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  if (!user) return null;

  const getNavItems = (role: UserRole): NavItem[] => {
    switch (role) {
      case UserRole.ADMIN:
        return [
          { label: 'Admin Dashboard', to: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Employees', to: '/admin/employees', icon: Users },
          { label: 'Departments', to: '/admin/departments', icon: Building2 },
          { label: 'Leave Management', to: '/admin/leaves', icon: CalendarCheck },
          { label: 'Leave Policies', to: '/admin/policies', icon: FileText },
          { label: 'Reports & Analytics', to: '/admin/reports', icon: BarChart3 },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
          { label: 'Settings', to: '/admin/settings', icon: Settings },
          { label: 'Profile', to: '/profile', icon: UserCircle },
        ];
      case UserRole.MANAGER:
        return [
          { label: 'Manager Dashboard', to: '/manager/dashboard', icon: LayoutDashboard },
          { label: 'My Team', to: '/manager/team', icon: Users },
          { label: 'Pending Approvals', to: '/manager/approvals', icon: ClipboardCheck },
          { label: 'Team Leave History', to: '/manager/history', icon: History },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
          { label: 'Profile', to: '/profile', icon: UserCircle },
        ];
      case UserRole.EMPLOYEE:
      default:
        return [
          { label: 'Employee Dashboard', to: '/employee/dashboard', icon: LayoutDashboard },
          { label: 'Apply for Leave', to: '/employee/apply', icon: CalendarPlus },
          { label: 'My Leave Requests', to: '/employee/requests', icon: CalendarCheck },
          { label: 'Leave Balance', to: '/employee/balance', icon: Wallet },
          { label: 'Notifications', to: '/notifications', icon: Bell, badge: unreadCount },
          { label: 'My Profile', to: '/profile', icon: UserCircle },
        ];
    }
  };

  const navItems = getNavItems(user.role);

  const roleLabel =
    user.role === UserRole.ADMIN
      ? 'HR Administration'
      : user.role === UserRole.MANAGER
        ? 'Team Management'
        : 'Employee Self-Service';

  const sidebarBody = (
    <div className="flex h-full flex-col bg-slate-900 text-slate-200">
      {/* Brand Lockup */}
      <div className="flex h-16 items-center justify-between border-b border-slate-800 px-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-indigo-600 text-white">
            <Briefcase className="h-4.5 w-4.5" />
          </div>
          <span className="truncate font-semibold text-sm tracking-tight text-white">
            SmartLeave HR
          </span>
        </div>

        <button
          type="button"
          onClick={onCloseMobile}
          className="rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-white lg:hidden cursor-pointer"
          aria-label="Close navigation menu"
        >
          <X className="h-5 w-5" />
        </button>
      </div>

      {/* Workspace Role Section */}
      <div className="px-4 pt-5 pb-2">
        <p className="px-2 text-xs font-medium text-slate-400">{roleLabel}</p>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 pb-6" aria-label="Main navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              onClick={onCloseMobile}
              className={({ isActive }) =>
                cn(
                  'flex items-center justify-between gap-2.5 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors whitespace-nowrap',
                  isActive
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                )
              }
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="h-4 w-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </span>
              {typeof item.badge === 'number' && item.badge > 0 && (
                <span className="rounded-md bg-indigo-500/30 px-1.5 py-0.5 text-[11px] font-semibold text-indigo-100 tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Bottom Workspace Info */}
      <div className="border-t border-slate-800 p-4">
        <div className="rounded-lg bg-slate-800/70 px-3 py-2.5">
          <p className="text-xs font-medium text-slate-200 truncate">{user.departmentName}</p>
          <p className="mt-0.5 text-xs text-slate-400 truncate font-mono tabular-nums">
            {user.employeeId}
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Fixed Sidebar */}
      <aside className="hidden lg:fixed lg:inset-y-0 lg:left-0 lg:z-30 lg:block lg:w-64 lg:border-r lg:border-slate-800">
        {sidebarBody}
      </aside>

      {/* Mobile Slide-Over Sidebar */}
      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/50 backdrop-blur-[1px]"
            onClick={onCloseMobile}
            aria-hidden="true"
          />
          <aside className="fixed inset-y-0 left-0 z-50 w-72 max-w-[85vw] shadow-xl">
            {sidebarBody}
          </aside>
        </div>
      )}
    </>
  );
}
