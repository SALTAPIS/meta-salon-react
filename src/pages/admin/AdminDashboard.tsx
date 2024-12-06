import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardHeader,
  CardBody,
  Stack,
  Divider,
  HStack,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/auth/useAuth';
import { UserManagement } from '../../components/admin/UserManagement';

export function AdminDashboard() {
  const { user } = useAuth();

  if (!user) {
    return (
      <Container maxW="container.xl" py={8}>
        <Text>Please log in to access the admin dashboard.</Text>
      </Container>
    );
  }

  return (
    <Container maxW="container.xl" py={8}>
      <Stack spacing={8}>
        <Box>
          <HStack justify="space-between" align="center" mb={2}>
            <Heading size="lg">Admin Dashboard</Heading>
            <Badge colorScheme="red" p={2} fontSize="md">Admin Mode</Badge>
          </HStack>
          <Divider />
        </Box>

        <Card>
          <CardHeader>
            <HStack justify="space-between" align="center">
              <Heading size="md">User Management</Heading>
              <Text color="gray.500" fontSize="sm">
                Manage all users and their permissions
              </Text>
            </HStack>
          </CardHeader>
          <CardBody>
            <UserManagement />
          </CardBody>
        </Card>
      </Stack>
    </Container>
  );
} 