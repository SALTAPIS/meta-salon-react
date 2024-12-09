import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { Outlet } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import optimizedTheme from './theme/optimized';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  console.log('[App] Rendering App component');
  return (
    <>
      <ColorModeScript initialColorMode={optimizedTheme.config.initialColorMode} />
      <ChakraProvider theme={optimizedTheme}>
        <QueryClientProvider client={queryClient}>
          <AuthProvider>
            <Outlet />
          </AuthProvider>
        </QueryClientProvider>
      </ChakraProvider>
    </>
  );
}
