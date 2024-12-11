import {
    Container,
    VStack,
    Heading,
    Tabs,
    TabList,
    TabPanels,
    Tab,
    TabPanel,
    Card,
    CardHeader,
    CardBody,
    Text,
    HStack,
    Badge,
    Box,
    Divider,
    Code,
    Alert,
    AlertIcon,
    AlertTitle,
    AlertDescription,
  } from '@chakra-ui/react';
  import { UserManagement } from '../../components/admin/UserManagement';
  import { ArtworkManagement } from '../../components/admin/ArtworkManagement';
  import { useSession } from '../../hooks/useSession';
  import { useAuth } from '../../hooks/useAuth';
  
  export function AdminDashboard() {
    const { user } = useAuth();
    const { session } = useSession();
  
    if (!user) {
      return (
        <Container maxW="container.xl" py={8}>
          <Alert
            status="warning"
            variant="subtle"
            flexDirection="column"
            alignItems="center"
            justifyContent="center"
            textAlign="center"
            height="200px"
            borderRadius="lg"
          >
            <AlertIcon boxSize="40px" mr={0} />
            <AlertTitle mt={4} mb={1} fontSize="lg">
              Not Signed In
            </AlertTitle>
            <AlertDescription maxWidth="sm">
              Please sign in first to access the admin dashboard.
            </AlertDescription>
          </Alert>
        </Container>
      );
    }
  
    return (
      <Container maxW="container.xl" py={8}>
        <VStack spacing={8} align="stretch">
          <Box>
            <HStack justify="space-between" align="center" mb={2}>
              <Heading size="lg">Admin Dashboard</Heading>
              <Badge colorScheme="red" p={2} fontSize="md">Admin Mode</Badge>
            </HStack>
            <Divider />
          </Box>
  
          <Tabs variant="enclosed">
            <TabList>
              <Tab>User Management</Tab>
              <Tab>Artworks</Tab>
              <Tab>Debug Info</Tab>
            </TabList>
  
            <TabPanels>
              {/* User Management Tab */}
              <TabPanel>
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
              </TabPanel>
  
              {/* Artworks Tab */}
              <TabPanel>
                <ArtworkManagement />
              </TabPanel>
  
              {/* Debug Info Tab */}
              <TabPanel>
                <Card>
                  <CardHeader>
                    <Heading size="md">Debug Information</Heading>
                  </CardHeader>
                  <CardBody>
                    <VStack align="stretch" spacing={4}>
                      <Box>
                        <Text fontWeight="bold" mb={2}>Session Info:</Text>
                        <Code p={4} borderRadius="md" width="100%">
                          {JSON.stringify(session, null, 2)}
                        </Code>
                      </Box>
                    </VStack>
                  </CardBody>
                </Card>
              </TabPanel>
            </TabPanels>
          </Tabs>
        </VStack>
      </Container>
    );
  }