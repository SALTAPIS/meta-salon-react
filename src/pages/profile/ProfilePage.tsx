import React from 'react';
import { Container } from '@chakra-ui/react';
import { UserProfile } from '../../components/profile/UserProfile';
import { UserStats } from '../../components/profile/UserStats';

export default function ProfilePage() {
  return (
    <Container maxW="4xl">
      <UserProfile />
      <UserStats />
    </Container>
  );
} 