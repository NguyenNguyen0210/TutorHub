import React, { useEffect } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createBrowserRouter, RouterProvider } from 'react-router-dom';
import AppRoutes from './routes';
import ScrollToTop from './components/common/ScrollToTop';
import ErrorBoundary, { PageErrorFallback } from './components/common/ErrorBoundary';
import NetworkStatus from './components/common/NetworkStatus';
import { ToastProvider } from './components/ui/Toast';
import { DialogProvider } from './components/ui/Dialog';
import { useAuthStore } from './store/authStore';
import RequestFeedback from './components/common/RequestFeedback';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 60000,
    },
  },
});

// A data router lets editors block in-app navigation and browser Back before losing changes.
const router = createBrowserRouter([{ path: '*', element: <><ScrollToTop /><AppRoutes /></>, errorElement: <PageErrorFallback /> }]);

export default function App() {
  useEffect(() => {
    useAuthStore.getState().revalidateSession();
  }, []);

  return (
    <ErrorBoundary>
      <NetworkStatus />
      <QueryClientProvider client={queryClient}>
        <ToastProvider>
          <RequestFeedback />
          <DialogProvider>
            <RouterProvider router={router} />
          </DialogProvider>
        </ToastProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
