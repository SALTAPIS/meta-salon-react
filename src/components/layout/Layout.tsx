import React from 'react';
import { Outlet } from 'react-router-dom';
import { Box, Container } from '@chakra-ui/react';
import { Header } from '../navigation/Header';
import { ErrorBoundary } from '../error/ErrorBoundary';

export function Layout() {
  return (
    <Box minH="100vh">
      <ErrorBoundary>
        <Header />
        <Container maxW="7xl" py={8}>
          <Outlet />
        </Container>
      </ErrorBoundary>
    </Box>
  );
} 