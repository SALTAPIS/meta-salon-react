import React from 'react';
import {
  Container,
  Grid,
  GridItem,
} from '@chakra-ui/react';
import { TokenBalance } from '../../components/token/TokenBalance';
import { VotePacks } from '../../components/token/VotePacks';
import { ProtectedRoute } from '../../components/auth/ProtectedRoute';

export default function TokensPage() {
  return (
    <ProtectedRoute>
      <Container maxW="container.xl" py={8}>
        <Grid
          templateColumns={{ base: '1fr', lg: 'repeat(2, 1fr)' }}
          gap={8}
        >
          <GridItem>
            <TokenBalance />
          </GridItem>
          <GridItem>
            <VotePacks />
          </GridItem>
        </Grid>
      </Container>
    </ProtectedRoute>
  );
} 