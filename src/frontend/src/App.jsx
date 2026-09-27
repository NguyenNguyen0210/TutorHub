import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import AppRoutes from './routes';
import ErrorBoundary from './components/common/ErrorBoundary';
import { ToastProvider } from './components/ui/Toast';
import { DialogProvider } from './components/ui/Dialog';
import { useAuthStore } from './store/authStore';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

export default function App() {
  useEffect(() => {
    useAuthStore.getState().revalidateSession();
  }, []);

  return (
    <ErrorBoundary>
      <ToastProvider>
        <DialogProvider>
          <QueryClientProvider client={queryClient}>
            <BrowserRouter>
              <AppRoutes />
            </BrowserRouter>
          </QueryClientProvider>
        </DialogProvider>
      </ToastProvider>
    </ErrorBoundary>
  );
}
