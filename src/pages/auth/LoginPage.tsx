import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Eye,
  EyeOff,
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Info,
} from 'lucide-react';
import { Button } from '@/src/components/ui/button';
import { Input } from '@/src/components/ui/input';
import { Label } from '@/src/components/ui/label';
import { DEMO_ACCOUNTS, DemoAccountInfo } from '@/src/services/authService';
import { useAuth } from '@/src/hooks/useAuth';
import { IS_MOCK_MODE } from '@/src/services/apiClient';

export function LoginPage() {
  const navigate = useNavigate();
  const { login, getDefaultRouteForRole } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imgFailed, setImgFailed] = useState(false);

  const validate = (): boolean => {
    const errors: { email?: string; password?: string } = {};
    if (!email.trim()) {
      errors.email = 'Email address is required.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errors.email = 'Please enter a valid email address.';
    }
    if (!password) {
      errors.password = 'Password is required.';
    } else if (password.length < 6) {
      errors.password = 'Password must be at least 6 characters.';
    }
    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const executeLogin = async (targetEmail: string, targetPassword: string) => {
    setErrorMessage(null);
    setIsSubmitting(true);
    try {
      const loggedInUser = await login({
        email: targetEmail,
        password: targetPassword,
        rememberMe,
      });
      navigate(getDefaultRouteForRole(loggedInUser.role), { replace: true });
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setErrorMessage(apiErr?.message || 'Sign in failed. Please check your credentials.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    await executeLogin(email, password);
  };

  const handleDemoSelect = async (demo: DemoAccountInfo) => {
    setEmail(demo.email);
    setPassword(demo.password);
    setFieldErrors({});
    await executeLogin(demo.email, demo.password);
  };

  return (
    <div className="min-h-screen grid grid-cols-1 lg:grid-cols-12 bg-slate-50">
      {/* Left Architectural Brand Column */}
      <div className="relative hidden lg:flex lg:col-span-5 xl:col-span-6 flex-col justify-between overflow-hidden bg-slate-900 p-10 text-white">
        {!imgFailed && (
          <img
            src="/src/assets/images/login_office_architecture_1795537540265.jpg"
            alt="Modern enterprise workplace interior"
            referrerPolicy="no-referrer"
            onError={() => setImgFailed(true)}
            className="absolute inset-0 h-full w-full object-cover opacity-55"
          />
        )}
        <div
          className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-900/65 to-slate-900/50"
          aria-hidden="true"
        />

        <div className="relative z-10 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-600 text-white shadow-sm">
            <Briefcase className="h-5 w-5" />
          </div>
          <span className="text-lg font-semibold tracking-tight text-white">
            Smart Leave &amp; Employee Management
          </span>
        </div>

        <div className="relative z-10 max-w-lg space-y-4">
          <h1 className="text-3xl xl:text-4xl font-bold tracking-tight text-white leading-tight [text-wrap:balance]">
            Centralized HR operations, leave workflows, and workforce visibility.
          </h1>
          <p className="text-sm xl:text-base text-slate-200 leading-relaxed">
            Manage employee directories, department structures, leave approvals, and annual leave policies in one structured enterprise platform engineered for Java Spring Boot &amp; MySQL.
          </p>
        </div>

        <div className="relative z-10 flex items-center gap-4 text-xs text-slate-300">
          <span>Role-Based Access Control</span>
          <span aria-hidden="true">·</span>
          <span>JWT REST Architecture</span>
          <span aria-hidden="true">·</span>
          <span>Leave Analytics</span>
        </div>
      </div>

      {/* Right Sign-In Form Column */}
      <div className="lg:col-span-7 xl:col-span-6 flex flex-col justify-center px-4 py-10 sm:px-10 lg:px-14 bg-white">
        <div className="mx-auto w-full max-w-md space-y-6">
          {/* Mobile Brand Header */}
          <div className="flex items-center gap-2.5 lg:hidden">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-indigo-700 text-white">
              <Briefcase className="h-4.5 w-4.5" />
            </div>
            <span className="text-base font-bold text-slate-900">
              SmartLeave HR
            </span>
          </div>

          <div>
            <h2 className="text-2xl font-bold tracking-tight text-slate-900">
              Sign in to your workspace
            </h2>
            <p className="mt-1.5 text-sm text-slate-500">
              Enter your corporate email and password to access your role dashboard.
            </p>
          </div>

          {errorMessage && (
            <div
              className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800"
              role="alert"
            >
              <AlertCircle className="mt-0.5 h-4.5 w-4.5 shrink-0 text-red-700" />
              <span>{errorMessage}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div className="space-y-1.5">
              <Label htmlFor="login-email">Corporate Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="pl-9"
                />
              </div>
              {fieldErrors.email && (
                <p className="text-xs text-red-600">{fieldErrors.email}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="login-password">Password</Label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="pl-9 pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 cursor-pointer"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
              {fieldErrors.password && (
                <p className="text-xs text-red-600">{fieldErrors.password}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <label className="flex items-center gap-2 text-sm text-slate-600 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-300 text-indigo-700 focus:ring-indigo-600"
                />
                <span>Remember me</span>
              </label>
              <span className="text-xs text-slate-400">
                {IS_MOCK_MODE ? 'Demo Mode Active' : 'Spring Boot JWT'}
              </span>
            </div>

            <Button type="submit" className="w-full h-11" disabled={isSubmitting}>
              {isSubmitting ? 'Signing in...' : 'Sign In'}
              {!isSubmitting && <ArrowRight className="h-4 w-4" />}
            </Button>
          </form>

          {/* Clearly Separated Demo Accounts Panel */}
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 space-y-3">
            <div className="flex items-start gap-2">
              <Info className="mt-0.5 h-4 w-4 text-indigo-700 shrink-0" />
              <div>
                <p className="text-xs font-semibold text-slate-900">
                  Demo Login Accounts (Temporary Mock Authentication)
                </p>
                <p className="mt-0.5 text-xs text-slate-500">
                  For UI demonstration only — not secure or production-ready. Real JWT authentication connects to <code className="font-mono text-[11px] text-slate-700">POST /auth/login</code>.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-2">
              {DEMO_ACCOUNTS.map((demo) => (
                <button
                  key={demo.role}
                  type="button"
                  disabled={isSubmitting}
                  onClick={() => handleDemoSelect(demo)}
                  className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-3.5 py-2.5 text-left hover:border-indigo-300 hover:bg-indigo-50/40 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900">
                      {demo.label} ({demo.role})
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      {demo.email} · {demo.password}
                    </p>
                  </div>
                  <span className="text-xs font-medium text-indigo-700 shrink-0">
                    Sign in
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
