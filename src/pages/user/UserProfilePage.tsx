import { useState } from 'react';
import { useParams, Link as RouterLink } from 'react-router-dom';
import {
  Container,
  Box,
  VStack,
  HStack,
  Heading,
  Text,
  Avatar,
  Badge,
  Button,
  Tabs,
  TabList,
  TabPanels,
  TabPanel,
  Tab,
  SimpleGrid,
  useColorModeValue,
  Image,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';

type Artwork = {
  id: string;
  title: string;
  image_url: string;
  created_at: string;
};

export function UserProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { user } = useAuth();
  const [artworks] = useState<Artwork[]>([]);
  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const isOwnProfile = user?.username === username;

  return (
    <Container maxW="container.xl" py={8}>
      {/* Profile Header */}
      <HStack spacing={8} mb={8} align="flex-start" justify="space-between">
        <HStack spacing={6}>
          <Avatar
            size="2xl"
            name={username}
            src={user?.avatar_url || undefined}
          />
          <VStack align="flex-start" spacing={2}>
            <Heading size="xl">{username}</Heading>
            {user?.role && (
              <Badge colorScheme="purple" fontSize="md">
                {user.role}
              </Badge>
            )}
          </VStack>
        </HStack>

        {isOwnProfile ? (
          <Button
            as={RouterLink}
            to={`/${username}/dashboard`}
            colorScheme="blue"
          >
            Dashboard
          </Button>
        ) : null}
      </HStack>

      {/* Content Tabs */}
      <Tabs variant="line">
        <TabList>
          <Tab>Recent</Tab>
          <Tab>Albums</Tab>
        </TabList>

        <TabPanels>
          {/* Recent Tab */}
          <TabPanel p={0} pt={6}>
            <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
              {artworks.map((artwork) => (
                <Box
                  key={artwork.id}
                  borderRadius="lg"
                  overflow="hidden"
                  bg={bgColor}
                  borderWidth={1}
                  borderColor={borderColor}
                >
                  <Image
                    src={artwork.image_url}
                    alt={artwork.title}
                    width="100%"
                    height="300px"
                    objectFit="cover"
                  />
                  <Box p={4}>
                    <Text fontWeight="bold">{artwork.title}</Text>
                    <Text color="gray.500" fontSize="sm">
                      {new Date(artwork.created_at).toLocaleDateString()}
                    </Text>
                  </Box>
                </Box>
              ))}
            </SimpleGrid>
          </TabPanel>

          {/* Albums Tab */}
          <TabPanel>
            <Text>Albums coming soon...</Text>
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Container>
  );
} 