import { Container, Heading, VStack, FormControl, FormLabel, Input, Textarea, Button, Box, Text } from '@chakra-ui/react';

export default function SubmitArtPage() {
  return (
    <Container maxW="2xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>Submit Your Artwork</Heading>
          <Text fontSize="lg">
            Join the Meta.Salon community by submitting your digital artwork for review and exhibition.
          </Text>
        </Box>

        <form onSubmit={(e) => e.preventDefault()}>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Artwork Title</FormLabel>
              <Input placeholder="Enter the title of your artwork" />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Description</FormLabel>
              <Textarea placeholder="Tell us about your artwork..." />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Upload Artwork</FormLabel>
              <Input type="file" accept="image/*" p={1} />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Supported formats: JPG, PNG, GIF (max 10MB)
              </Text>
            </FormControl>

            <Button colorScheme="blue" size="lg" w="full" type="submit">
              Submit Artwork
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
} 