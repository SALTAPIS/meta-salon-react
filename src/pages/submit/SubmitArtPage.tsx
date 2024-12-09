import { useState, useEffect, type ChangeEvent } from 'react';
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
} from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { ArtworkService } from '../../services/ArtworkService';
import type { Album, Challenge } from '../../types/database.types';

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

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      try {
        const [userAlbums, activeChalls] = await Promise.all([
          ArtworkService.getUserAlbums(user.id),
          ArtworkService.getActiveChallenges()
        ]);

        console.log('Loaded albums:', userAlbums); // Debug log
        setAlbums(userAlbums);
        setChallenges(activeChalls);
        
        // Set default album if exists
        const defaultAlbum = userAlbums.find(album => album.is_default);
        console.log('Default album:', defaultAlbum); // Debug log
        if (defaultAlbum) {
          setSelectedAlbumId(defaultAlbum.id);
        }

        // Set default challenge
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
    const file = event.target.files?.[0];
    if (!file) return;

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

  const handleSubmit = async () => {
    if (!user || !selectedFile || !title || !selectedAlbumId || !selectedChallengeId) {
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

      const { url: imageUrl, metadata } = await ArtworkService.uploadArtwork(user.id, selectedFile);

      const artwork = await ArtworkService.createArtwork(
        user.id,
        selectedAlbumId,
        title,
        description,
        imageUrl,
        metadata
      );

      await ArtworkService.submitToChallenge(artwork.id, selectedChallengeId, submissionFee);

      toast({
        title: 'Artwork submitted successfully',
        description: 'Your artwork has been submitted to the challenge',
        status: 'success',
        duration: 5000,
        isClosable: true,
      });

      navigate('/artworks');
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

  const handleConfirmSubmit = () => {
    onClose();
    handleSubmit();
  };

  const handleTitleChange = (e: ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value);
  };

  const handleDescriptionChange = (e: ChangeEvent<HTMLTextAreaElement>) => {
    setDescription(e.target.value);
  };

  const handleAlbumChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedAlbumId(e.target.value);
  };

  const handleChallengeChange = (e: ChangeEvent<HTMLSelectElement>) => {
    setSelectedChallengeId(e.target.value);
    const challenge = challenges.find((c: Challenge) => c.id === e.target.value);
    if (challenge) {
      setSubmissionFee(challenge.submission_fee);
    }
  };

  return (
    <Container maxW="container.md" py={8}>
      <VStack spacing={8} align="stretch">
        <Heading>Submit Artwork</Heading>

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
                {album.name || 'Untitled Album'}
              </option>
            ))}
          </Select>
        </FormControl>

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

        <Alert status="info">
          <AlertIcon />
          <Text>
            Submitting this artwork will cost {submissionFee} SLN. The artwork will be displayed in the challenge for voting.
          </Text>
        </Alert>

        <Button
          colorScheme="blue"
          size="lg"
          isLoading={isLoading}
          onClick={onOpen}
          isDisabled={!selectedFile || !title || !selectedAlbumId || !selectedChallengeId}
        >
          Submit Artwork
        </Button>
      </VStack>

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Confirm Submission</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4} align="stretch">
              <Text>
                You are about to submit your artwork "{title}" to the challenge.
              </Text>
              <Text fontWeight="bold">
                This will cost {submissionFee} SLN.
              </Text>
              <Text>
                Are you sure you want to proceed?
              </Text>
            </VStack>
          </ModalBody>
          <ModalFooter>
            <HStack spacing={4}>
              <Button variant="ghost" onClick={onClose}>Cancel</Button>
              <Button colorScheme="blue" onClick={handleConfirmSubmit} isLoading={isLoading}>
                Confirm & Submit
              </Button>
            </HStack>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
} 