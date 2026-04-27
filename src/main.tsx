
import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import App from './App.tsx';
import './index.css';
import './i18n/i18n.ts'; // Import i18n configuration

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2 * 60 * 1000, // 2 minutes
      gcTime: 30 * 60 * 1000, // 30 minutes — keep cache long enough that
                              // tab switches stay instant after navigation.
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      // Show last-known data while a background refetch runs instead of
      // flashing the skeleton on every remount. Critical for the mentor /
      // student dashboards where users tab back and forth frequently.
      placeholderData: (previousData: unknown) => previousData,
      retry: (failureCount, error) => {
        // Do not retry on 4xx client errors (bad request, auth, not found, etc.)
        if (error instanceof AxiosError && error.response) {
          const status = error.response.status;
          if (status >= 400 && status < 500) {
            return false;
          }
        }
        // Retry up to 3 times on server errors and network errors
        return failureCount < 3;
      },
    },
    mutations: {
      retry: false, // Never retry mutations automatically
    },
  },
});

// Apply dark mode on initial load if needed
const isDarkMode = localStorage.getItem('theme') === 'dark' ||
  (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);

if (isDarkMode) {
  document.documentElement.classList.add('dark');
} else {
  document.documentElement.classList.remove('dark');
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>,
);
