import { Outlet, useLocation } from 'react-router-dom';
import { Box, Container } from '@chakra-ui/react';
import { Header } from '../navigation/Header';
import { ErrorBoundary } from '../error/ErrorBoundary';

export function Layout() {
  const location = useLocation();
  const isArtworksPage = location.pathname === '/artworks' || location.pathname === '/';
  
  return (
    <Box minH="100vh">
      <ErrorBoundary>
        <Header />
        <Container size={isArtworksPage ? 'wide' : 'regular'} py={8}>
          <Outlet />
        </Container>
      </ErrorBoundary>
    </Box>
  );
} 