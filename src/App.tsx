import { ChakraProvider, ColorModeScript } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { router } from './routes';
import optimizedTheme from './theme/optimized';
import { QueryProvider } from './components/providers/QueryProvider';

export default function App() {
  return (
    <>
      <ColorModeScript initialColorMode={optimizedTheme.config.initialColorMode} />
      <ChakraProvider theme={optimizedTheme}>
        <QueryProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </QueryProvider>
      </ChakraProvider>
    </>
  );
}
