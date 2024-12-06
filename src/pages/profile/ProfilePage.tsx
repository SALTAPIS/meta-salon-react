import {
  Container,
  Box,
  useColorModeValue,
  VStack,
  Heading,
  Text,
  Avatar,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
} from '@chakra-ui/react';
import { UserStats } from '../../components/profile/UserStats';
import { ProfileSettings } from '../../components/profile/ProfileSettings';
import { useAuth } from '../../hooks/auth/useAuth';

export default function ProfilePage() {
  const { user } = useAuth();
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  if (!user?.id) return null;

  return (
    <Container maxW="7xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box
          p={8}
          bg={bgColor}
          borderWidth="1px"
          borderColor={borderColor}
          borderRadius="lg"
          shadow="sm"
        >
          <VStack spacing={6} align="center">
            <Avatar
              size="2xl"
              name={user.display_name || user.email}
              src={user.avatar_url || undefined}
            />
            <Box textAlign="center">
              <Heading size="lg">{user.display_name || user.username || user.email}</Heading>
              <Text color="gray.500" mt={2}>
                @{user.username}
              </Text>
              <Text color="gray.500" mt={2}>
                Member since {new Date(user.created_at).toLocaleDateString()}
              </Text>
            </Box>
          </VStack>
        </Box>

        <Tabs variant="enclosed">
          <TabList>
            <Tab>Stats</Tab>
            <Tab>Settings</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <Box
                p={6}
                bg={bgColor}
                borderWidth="1px"
                borderColor={borderColor}
                borderRadius="lg"
                shadow="sm"
              >
                <VStack spacing={6} align="stretch">
                  <Heading size="md">Account Statistics</Heading>
                  <UserStats userId={user.id} />
                </VStack>
              </Box>
            </TabPanel>
            <TabPanel>
              <ProfileSettings />
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>
    </Container>
  );
} 