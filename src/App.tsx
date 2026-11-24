import React from 'react';
import { BrowserRouter } from 'react-router-dom';
import { Toaster } from 'sonner';
import { AuthProvider } from '@/src/context/AuthContext';
import { NotificationProvider } from '@/src/context/NotificationContext';
import { AppRoutes } from '@/src/routes/AppRoutes';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <NotificationProvider>
          <AppRoutes />
          <Toaster position="top-right" richColors closeButton />
        </NotificationProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
