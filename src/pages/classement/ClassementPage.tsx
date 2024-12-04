import { Container, Heading, Table, Thead, Tbody, Tr, Th, Td, VStack } from '@chakra-ui/react';

export default function ClassementPage() {
  return (
    <Container maxW="4xl" py={8}>
      <VStack spacing={6} align="stretch">
        <Heading as="h1" size="xl">Classement</Heading>
        <Table variant="simple">
          <Thead>
            <Tr>
              <Th>Rank</Th>
              <Th>Artist</Th>
              <Th>Score</Th>
              <Th>Artworks</Th>
            </Tr>
          </Thead>
          <Tbody>
            {/* Placeholder rows - will be replaced with real data */}
            <Tr>
              <Td>1</Td>
              <Td>Coming Soon</Td>
              <Td>-</Td>
              <Td>-</Td>
            </Tr>
          </Tbody>
        </Table>
      </VStack>
    </Container>
  );
} 