import { Box, Container } from '@chakra-ui/react';
import { Header } from '../navigation/Header';
import { Outlet, useLocation } from 'react-router-dom';
import { ErrorBoundary } from '../error/ErrorBoundary';

export function Layout() {
  const location = useLocation();
  const isArtworksPage = location.pathname === '/artworks' || location.pathname === '/';
  const isAdminPage = location.pathname.startsWith('/admin');
  const isClassementPage = location.pathname === '/classement';
  const useWideContainer = isArtworksPage || isAdminPage || isClassementPage;

  return (
    <Box minH="100vh">
      <ErrorBoundary>
        <Header />
        <Box pt={{ base: '64px', md: 0 }}> {/* Add padding for mobile nav */}
          <Container size={useWideContainer ? 'wide' : 'regular'} py={8}>
            <Outlet />
          </Container>
        </Box>
      </ErrorBoundary>
    </Box>
  );
} 