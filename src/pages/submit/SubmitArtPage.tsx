import { useState, useEffect } from 'react';
import type { ChangeEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Heading,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  Button,
  Box,
  Text,
  useToast,
  Select,
  Image,
  HStack,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
  ModalCloseButton,
  Alert,
  AlertIcon,
  FormHelperText,
  Tabs,
  TabList,
  Tab,
  TabPanels,
  TabPanel,
  SimpleGrid,
  Card,
  CardBody,
  Badge,
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { ArtworkService } from '../../services/ArtworkService';
import type { Album, Challenge, Artwork } from '../../types/database.types';

const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/gif'];

export default function SubmitArtPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  const { isOpen, onOpen, onClose } = useDisclosure();
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [selectedChallengeId, setSelectedChallengeId] = useState<string>('');
  const [submissionFee, setSubmissionFee] = useState<number>(99);
  const [draftArtworks, setDraftArtworks] = useState<Artwork[]>([]);
  const [selectedArtwork, setSelectedArtwork] = useState<Artwork | null>(null);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [userAlbums, activeChalls, drafts] = await Promise.all([
          ArtworkService.getUserAlbums(user.id),
          ArtworkService.getActiveChallenges(),
          ArtworkService.getDraftArtworks(user.id)
        ]);

        console.log('Loaded albums:', userAlbums);
        setAlbums(userAlbums);
        setChallenges(activeChalls);
        setDraftArtworks(drafts);
        
        const defaultAlbum = userAlbums.find(album => album.is_default);
        console.log('Default album:', defaultAlbum);
        if (defaultAlbum) {
          setSelectedAlbumId(defaultAlbum.id);
        }

        const openChallenge = activeChalls.find((c: Challenge) => c.type === 'open');
        if (openChallenge) {
          setSelectedChallengeId(openChallenge.id);
          setSubmissionFee(openChallenge.submission_fee);
        }
      } catch (error) {
        console.error('Error loading data:', error);
        toast({
          title: 'Error loading data',
          description: error instanceof Error ? error.message : 'Unknown error',
          status: 'error',
          duration: 5000,
          isClosable: true,
        });
      }
    };

    loadData();
  }, [user, navigate, toast]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    if (file.size > MAX_FILE_SIZE) {
      toast({
        title: 'File too large',
        description: 'Maximum file size is 10MB',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      toast({
        title: 'Invalid file type',
        description: 'Only JPG, PNG, and GIF files are allowed',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSubmitToChallenge = async () => {
    if (!user || !selectedArtwork || !selectedChallengeId) {
      toast({
        title: 'Missing required fields',
        description: 'Please select an artwork and challenge',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Submitting to challenge...');
      await ArtworkService.submitToChallenge(selectedArtwork.id, selectedChallengeId, submissionFee);
      console.log('Challenge submission complete');

      toast({
        title: 'Artwork submitted successfully',
        description: 'Your artwork has been submitted to the challenge',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh draft artworks
      const drafts = await ArtworkService.getDraftArtworks(user.id);
      setDraftArtworks(drafts);

      // Clear selection
      setSelectedArtwork(null);
      onClose();

    } catch (error) {
      console.error('Error submitting artwork:', error);
      toast({
        title: 'Error submitting artwork',
        description: error instanceof Error ? error.message : 'Unknown error',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTitleChange = (event: ChangeEvent<HTMLInputElement>) => {
    setTitle(event.target.value);
  };

  const handleDescriptionChange = (event: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(event.target.value);
  };

  const handleAlbumChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlbumId(event.target.value);
  };

  const handleChallengeChange = (event: ChangeEvent<HTMLSelectElement>) => {
    setSelectedChallengeId(event.target.value);
    const challenge = challenges.find((c: Challenge) => c.id === event.target.value);
    if (challenge) {
      setSubmissionFee(challenge.submission_fee);
    }
  };

  const handleArtworkSelect = (artwork: Artwork) => {
    setSelectedArtwork(artwork);
    onOpen();
  };

  const handleUpload = async () => {
    if (!user) {
      toast({
        title: 'Authentication required',
        description: 'Please log in to upload artwork',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    if (!selectedFile || !title || !selectedAlbumId) {
      toast({
        title: 'Missing required fields',
        description: 'Please fill in all required fields',
        status: 'error',
        duration: 5000,
        isClosable: true,
      });
      return;
    }

    try {
      setIsLoading(true);
      console.log('Starting artwork upload...');

      console.log('Uploading artwork file...');
      const { url: imageUrl, metadata } = await ArtworkService.uploadArtwork(user.id, selectedFile);
      console.log('Artwork uploaded successfully:', { imageUrl, metadata });

      console.log('Creating artwork record...');
      const artwork = await ArtworkService.createArtwork(
        user.id,
        selectedAlbumId,
        title,
        description,
        imageUrl,
        metadata
      );
      console.log('Artwork record created:', artwork);

      toast({
        title: 'Artwork uploaded successfully',
        description: 'Your artwork has been saved as a draft',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      // Refresh draft artworks
      const drafts = await ArtworkService.getDraftArtworks(user.id);
      setDraftArtworks(drafts);

      // Clear form
      setTitle('');
      setDescription('');
      setSelectedFile(null);
      setPreviewUrl(null);

    } catch (error) {
      console.error('Error uploading artwork:', error);
      toast({
        title: 'Error uploading artwork',
        description: error instanceof Error ? error.message : 'Unknown error',
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
        <Heading>Submit Artwork</Heading>

        <Tabs>
          <TabList>
            <Tab>Upload New Artwork</Tab>
            <Tab>Submit to Challenge</Tab>
          </TabList>

          <TabPanels>
            <TabPanel>
              <VStack spacing={6} align="stretch">
                <FormControl isRequired>
                  <FormLabel>Title</FormLabel>
                  <Input
                    value={title}
                    onChange={handleTitleChange}
                    placeholder="Enter artwork title"
                  />
                </FormControl>

                <FormControl>
                  <FormLabel>Description</FormLabel>
                  <Textarea
                    value={description}
                    onChange={handleDescriptionChange}
                    placeholder="Enter artwork description"
                    rows={4}
                  />
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Album</FormLabel>
                  <Select
                    value={selectedAlbumId}
                    onChange={handleAlbumChange}
                    placeholder="Select album"
                  >
                    {albums.map((album: Album) => (
                      <option key={album.id} value={album.id}>
                        {album.title || 'Untitled Album'}
                      </option>
                    ))}
                  </Select>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Artwork Image</FormLabel>
                  <Input
                    type="file"
                    accept="image/jpeg,image/png,image/gif"
                    onChange={handleFileChange}
                  />
                  <FormHelperText>
                    Maximum file size: 10MB. Supported formats: JPG, PNG, GIF
                  </FormHelperText>
                </FormControl>

                {previewUrl && (
                  <Box borderWidth={1} borderRadius="lg" p={4}>
                    <Image
                      src={previewUrl}
                      alt="Preview"
                      maxH="400px"
                      objectFit="contain"
                    />
                  </Box>
                )}

                <Button
                  colorScheme="blue"
                  size="lg"
                  isLoading={isLoading}
                  onClick={handleUpload}
                  isDisabled={!selectedFile || !title || !selectedAlbumId}
                >
                  Upload Artwork
                </Button>
              </VStack>
            </TabPanel>

            <TabPanel>
              <VStack spacing={6} align="stretch">
                <Heading size="md">Draft Artworks</Heading>
                
                <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={6}>
                  {draftArtworks.map((artwork: Artwork) => (
                    <Card key={artwork.id} variant="outline">
                      <CardBody>
                        <Image
                          src={artwork.image_url}
                          alt={artwork.title}
                          borderRadius="lg"
                          mb={4}
                        />
                        <VStack align="stretch" spacing={2}>
                          <Heading size="sm">{artwork.title}</Heading>
                          <Text noOfLines={2}>{artwork.description}</Text>
                          <Badge colorScheme="yellow">Draft</Badge>
                          <Button
                            colorScheme="blue"
                            onClick={() => handleArtworkSelect(artwork)}
                          >
                            Submit to Challenge
                          </Button>
                        </VStack>
                      </CardBody>
                    </Card>
                  ))}
                </SimpleGrid>

                {draftArtworks.length === 0 && (
                  <Alert status="info">
                    <AlertIcon />
                    <Text>
                      No draft artworks available. Upload a new artwork first.
                    </Text>
                  </Alert>
                )}
              </VStack>
            </TabPanel>
          </TabPanels>
        </Tabs>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Submit to Challenge</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              {selectedArtwork && (
                <Box borderWidth={1} borderRadius="lg" p={4}>
                  <Image
                    src={selectedArtwork.image_url}
                    alt={selectedArtwork.title}
                    maxH="200px"
                    objectFit="contain"
                  />
                  <Text mt={2} fontWeight="bold">{selectedArtwork.title}</Text>
                </Box>
              )}

              <FormControl isRequired>
                <FormLabel>Challenge</FormLabel>
                <Select
                  value={selectedChallengeId}
                  onChange={handleChallengeChange}
                >
                  <option value="">Select challenge</option>
                  {challenges.map((challenge: Challenge) => (
                    <option key={challenge.id} value={challenge.id}>
                      {challenge.title} ({challenge.submission_fee} SLN)
                    </option>
                  ))}
                </Select>
                <FormHelperText>
                  Submission fee: {submissionFee} SLN
                </FormHelperText>
              </FormControl>

              <Alert status="info">
                <AlertIcon />
                <Text>
                  Submitting this artwork will cost {submissionFee} SLN. The artwork will be displayed in the challenge for voting.
                </Text>
              </Alert>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button
                colorScheme="blue"
                onClick={handleSubmitToChallenge}
                isLoading={isLoading}
                isDisabled={!selectedChallengeId}
              >
                Submit to Challenge
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 