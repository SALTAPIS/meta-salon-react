import { Container, VStack, Heading } from '@chakra-ui/react';
import { UserManagement } from '../../components/admin/UserManagement';
import { EpochMonitor } from '../../components/admin/EpochMonitor';

export function AdminDashboard() {
  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading size="xl">Admin Dashboard</Heading>
        
        <EpochMonitor />

        <Heading size="lg" mt={8}>User Management</Heading>
        <UserManagement />
      </VStack>
    </Container>
  );
} 