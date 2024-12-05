import { ChakraProvider } from '@chakra-ui/react';
import { RouterProvider } from 'react-router-dom';
import { AuthProvider } from './components/auth/AuthProvider';
import { router } from './routes';
import optimizedTheme from './theme/optimized';

export default function App() {
  return (
    <ChakraProvider theme={optimizedTheme} resetCSS={false}>
      <AuthProvider>
        <RouterProvider router={router} />
      </AuthProvider>
    </ChakraProvider>
  );
}
