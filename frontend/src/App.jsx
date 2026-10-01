import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { SnackbarProvider } from 'notistack';
import { useJsApiLoader } from '@react-google-maps/api';
import { ThemeModeProvider } from './contexts/ThemeModeContext';
import { AuthProvider } from './contexts/AuthContext';
import { queryClient } from './services/queryClient';
import AppRouter from './app/AppRouter';
import { GOOGLE_MAPS_API_KEY, GOOGLE_MAPS_LIBRARIES } from './config/googleMaps';
import { lazy, Suspense } from 'react';

const GpsOverridePanel = lazy(() => import('./components/dev/GpsOverridePanel'));
const isDev = import.meta.env.DEV;

export default function App() {
  // Load Google Maps globally so Distance Matrix is available everywhere
  useJsApiLoader({
    googleMapsApiKey: GOOGLE_MAPS_API_KEY,
    libraries: GOOGLE_MAPS_LIBRARIES,
  });

  return (
    <QueryClientProvider client={queryClient}>
      <ThemeModeProvider>
        <SnackbarProvider maxSnack={3} anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
          <BrowserRouter>
            <AuthProvider>
              <AppRouter />
              {isDev && (
                <Suspense fallback={null}>
                  <GpsOverridePanel />
                </Suspense>
              )}
            </AuthProvider>
          </BrowserRouter>
        </SnackbarProvider>
      </ThemeModeProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
