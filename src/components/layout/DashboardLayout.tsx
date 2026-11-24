import React, { useState } from 'react';
import { AppSidebar } from '@/src/components/layout/AppSidebar';
import { AppHeader, BreadcrumbItem } from '@/src/components/layout/AppHeader';

interface DashboardLayoutProps {
  breadcrumbs: BreadcrumbItem[];
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  children: React.ReactNode;
}

export function DashboardLayout({
  breadcrumbs,
  title,
  subtitle,
  actions,
  children,
}: DashboardLayoutProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <div className="min-h-screen bg-slate-50">
      <AppSidebar
        mobileOpen={mobileOpen}
        onCloseMobile={() => setMobileOpen(false)}
      />

      <div className="lg:pl-64 flex min-h-screen flex-col">
        <AppHeader
          breadcrumbs={breadcrumbs}
          onOpenMobileMenu={() => setMobileOpen(true)}
        />

        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-[1360px] space-y-6">
            {(title || actions) && (
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="min-w-0">
                  {title && (
                    <h1 className="text-2xl font-bold tracking-tight text-slate-900">
                      {title}
                    </h1>
                  )}
                  {subtitle && (
                    <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
                  )}
                </div>
                {actions && (
                  <div className="flex flex-wrap items-center gap-2.5 shrink-0">
                    {actions}
                  </div>
                )}
              </div>
            )}

            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
