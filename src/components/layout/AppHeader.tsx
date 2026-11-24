import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronRight, LogOut, Menu, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/src/components/ui/dropdown-menu';
import { NotificationDropdown } from '@/src/components/common/NotificationDropdown';
import { UserAvatar } from '@/src/components/common/UserAvatar';
import { useAuth } from '@/src/hooks/useAuth';

export interface BreadcrumbItem {
  label: string;
  to?: string;
}

interface AppHeaderProps {
  breadcrumbs: BreadcrumbItem[];
  onOpenMobileMenu: () => void;
}

export function AppHeader({ breadcrumbs, onOpenMobileMenu }: AppHeaderProps) {
  const { user, logout, getDefaultRouteForRole } = useAuth();
  const navigate = useNavigate();

  if (!user) return null;

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 sm:px-6">
      {/* Left: Mobile Menu Trigger & Breadcrumbs */}
      <div className="flex items-center gap-3 min-w-0">
        <button
          type="button"
          onClick={onOpenMobileMenu}
          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 hover:text-slate-900 lg:hidden cursor-pointer shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="h-5 w-5" />
        </button>

        <nav aria-label="Breadcrumb" className="flex items-center gap-1.5 text-sm min-w-0 overflow-hidden">
          <Link
            to={getDefaultRouteForRole(user.role)}
            className="text-slate-500 hover:text-slate-900 transition-colors whitespace-nowrap hidden sm:inline"
          >
            Workspace
          </Link>
          {breadcrumbs.map((crumb, idx) => {
            const isLast = idx === breadcrumbs.length - 1;
            return (
              <React.Fragment key={`${crumb.label}-${idx}`}>
                <ChevronRight className="h-4 w-4 text-slate-400 shrink-0 hidden sm:inline" />
                {crumb.to && !isLast ? (
                  <Link
                    to={crumb.to}
                    className="text-slate-500 hover:text-slate-900 transition-colors truncate"
                  >
                    {crumb.label}
                  </Link>
                ) : (
                  <span
                    className={
                      isLast
                        ? 'font-semibold text-slate-900 truncate'
                        : 'text-slate-500 truncate'
                    }
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            );
          })}
        </nav>
      </div>

      {/* Right: Notification Bell & User Profile Dropdown */}
      <div className="flex items-center gap-3 shrink-0">
        <NotificationDropdown />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex items-center gap-2.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-left hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-600 transition-colors cursor-pointer"
            >
              <UserAvatar name={user.fullName} avatarUrl={user.avatarUrl} size="sm" />
              <div className="hidden md:block min-w-0">
                <p className="text-xs font-semibold text-slate-900 truncate max-w-[140px]">
                  {user.fullName}
                </p>
                <p className="text-[11px] text-slate-500 truncate max-w-[140px]">
                  {user.role}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="text-sm font-semibold text-slate-900 truncate">{user.fullName}</p>
              <p className="text-xs font-normal text-slate-500 truncate">{user.email}</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <UserIcon className="h-4 w-4 text-slate-500" />
              <span>My Profile</span>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={handleLogout}
              className="text-red-700 focus:bg-red-50 focus:text-red-800"
            >
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
