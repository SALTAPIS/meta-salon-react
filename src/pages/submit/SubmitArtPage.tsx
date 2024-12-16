import { useState, type ChangeEvent, type FormEvent } from 'react';
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  VStack,
  useToast,
  Alert,
  AlertIcon,
  Text,
  Heading,
  SimpleGrid,
  Image,
  Badge,
  HStack,
  useColorModeValue,
  Select,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { ArtworkService } from '../../services/ArtworkService';
import { useNavigate } from 'react-router-dom';
import { useChallenges } from '../../hooks/useChallenges';

export default function SubmitArtPage() {
  const { user } = useAuth();
  const { challenges } = useChallenges();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [selectedChallenge, setSelectedChallenge] = useState<string>('');
  const [step, setStep] = useState<'draft' | 'submit'>('draft');
  const [draftId, setDraftId] = useState<string | null>(null);

  const bgColor = useColorModeValue('white', 'gray.800');
  const borderColor = useColorModeValue('gray.200', 'gray.700');

  const handleImageChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCreateDraft = async (e: FormEvent) => {
    e.preventDefault();
    if (!user || !imageFile) return;

    try {
      setIsLoading(true);
      setError(null);

      const artworkId = await ArtworkService.createDraftArtwork(
        title,
        description,
        imageFile
      );

      setDraftId(artworkId);
      setStep('submit');

      toast({
        title: 'Draft created successfully',
        description: 'Now you can submit it to a challenge',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create draft');
      toast({
        title: 'Failed to create draft',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitToChallenge = async () => {
    if (!draftId || !selectedChallenge) return;

    try {
      setIsLoading(true);
      setError(null);

      await ArtworkService.submitArtworkToChallenge(
        draftId,
        selectedChallenge,
        99 // Updated submission fee
      );

      toast({
        title: 'Artwork submitted successfully',
        description: 'Your artwork has been submitted to the challenge',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/artworks');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit to challenge');
      toast({
        title: 'Failed to submit to challenge',
        description: err instanceof Error ? err.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="container.xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading 
            size="xl" 
            mb={2}
            fontFamily="Allan"
          >
            Submit your Artwork to the Open Challenge
          </Heading>
          <Text color="gray.600">Share your creation and compete for rewards</Text>
        </Box>

        {error && (
          <Alert status="error">
            <AlertIcon />
            {error}
          </Alert>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={8}>
          <Box
            as="form"
            onSubmit={handleCreateDraft}
            p={6}
            borderWidth={1}
            borderRadius="lg"
            bg={bgColor}
            borderColor={borderColor}
          >
            <VStack spacing={4}>
              {step === 'draft' ? (
                <>
                  <FormControl isRequired>
                    <FormLabel>Title</FormLabel>
                    <Input
                      value={title}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setTitle(e.target.value)}
                      placeholder="Enter artwork title"
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Description</FormLabel>
                    <Textarea
                      value={description}
                      onChange={(e: ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
                      placeholder="Describe your artwork"
                      rows={4}
                    />
                  </FormControl>

                  <FormControl isRequired>
                    <FormLabel>Image</FormLabel>
                    <Button
                      as="label"
                      htmlFor="file-upload"
                      colorScheme="blue"
                      variant="outline"
                      cursor="pointer"
                      width="full"
                      py={2}
                    >
                      {imageFile ? 'Change Image' : 'Upload Image'}
                      <Input
                        id="file-upload"
                        type="file"
                        accept="image/*"
                        onChange={handleImageChange}
                        display="none"
                      />
                    </Button>
                    {imageFile && (
                      <Text fontSize="sm" color="green.500" mt={1}>
                        Selected: {imageFile.name}
                      </Text>
                    )}
                    <Text fontSize="sm" color="gray.500" mt={1}>
                      Supported formats: JPG, PNG, GIF (max 10MB)
                    </Text>
                  </FormControl>

                  <Alert status="info" mt={4}>
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Submission Fee: 99 SLN</Text>
                      <Text fontSize="sm">This fee will be required when submitting to the challenge</Text>
                    </Box>
                  </Alert>

                  <Button
                    type="submit"
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText="Creating draft..."
                    width="full"
                    mt={4}
                    isDisabled={!title || !description || !imageFile}
                  >
                    Create Draft
                  </Button>
                </>
              ) : (
                <>
                  <FormControl isRequired>
                    <FormLabel>Select Challenge</FormLabel>
                    <Select
                      placeholder="Choose a challenge"
                      value={selectedChallenge}
                      onChange={(e: ChangeEvent<HTMLSelectElement>) => setSelectedChallenge(e.target.value)}
                    >
                      {challenges?.map((challenge) => (
                        <option key={challenge.id} value={challenge.id}>
                          {challenge.title}
                        </option>
                      ))}
                    </Select>
                  </FormControl>

                  <Alert status="info">
                    <AlertIcon />
                    <Box>
                      <Text fontWeight="bold">Submission Fee: 99 SLN</Text>
                      <Text fontSize="sm">This amount will be deducted from your balance upon submission</Text>
                    </Box>
                  </Alert>

                  <Button
                    colorScheme="blue"
                    isLoading={isLoading}
                    loadingText="Submitting..."
                    width="full"
                    mt={4}
                    onClick={handleSubmitToChallenge}
                    isDisabled={!selectedChallenge}
                  >
                    Submit to Challenge (99 SLN)
                  </Button>
                </>
              )}
            </VStack>
          </Box>

          {preview && (
            <Box
              borderWidth={1}
              borderRadius="lg"
              overflow="hidden"
              bg={bgColor}
              borderColor={borderColor}
            >
              <Image
                src={preview}
                alt="Preview"
                objectFit="cover"
                width="100%"
                height="400px"
              />
              <Box p={4}>
                <Heading size="md" mb={2}>{title || 'Untitled'}</Heading>
                <Text color="gray.600" noOfLines={3}>
                  {description || 'No description'}
                </Text>
                <HStack mt={4}>
                  <Badge colorScheme="blue">
                    {step === 'draft' ? 'Draft' : 'Ready to Submit'}
                  </Badge>
                </HStack>
              </Box>
            </Box>
          )}
        </SimpleGrid>
      </VStack>
    </Container>
  );
} 