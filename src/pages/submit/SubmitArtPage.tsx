import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Heading, VStack, FormControl, FormLabel, Input, Textarea, Button, Box, Text, useToast, Select, Image } from '@chakra-ui/react';
import { useAuth } from '../../hooks/useAuth';
import { ArtworkService } from '../../services/ArtworkService';
import type { Album } from '../../types/database.types';

export default function SubmitArtPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const toast = useToast();
  
  const [isLoading, setIsLoading] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    // Load user's albums
    const loadAlbums = async () => {
      try {
        const userAlbums = await ArtworkService.getUserAlbums(user.id);
        setAlbums(userAlbums);
        
        // Set default album if exists
        const defaultAlbum = userAlbums.find((album: Album) => album.is_default);
        if (defaultAlbum) {
          setSelectedAlbumId(defaultAlbum.id);
        }
      } catch (error) {
        console.error('Error loading albums:', error);
        toast({
          title: 'Error loading albums',
          description: 'Please try again later',
          status: 'error',
          duration: 5000,
        });
      }
    };

    loadAlbums();
  }, [user, navigate, toast]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: 'File too large',
        description: 'Please select an image under 10MB',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    // Validate file type
    if (!file.type.startsWith('image/')) {
      toast({
        title: 'Invalid file type',
        description: 'Please select an image file',
        status: 'error',
        duration: 5000,
      });
      return;
    }

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !selectedFile || !selectedAlbumId) return;

    setIsLoading(true);
    try {
      // Upload artwork image and get metadata
      const { url: imageUrl, metadata } = await ArtworkService.uploadArtwork(user.id, selectedFile);

      // Create artwork record
      await ArtworkService.createArtwork(
        user.id,
        selectedAlbumId,
        title,
        description || null,
        imageUrl,
        metadata
      );

      toast({
        title: 'Artwork uploaded successfully',
        description: 'Your artwork has been saved to your album',
        status: 'success',
        duration: 5000,
      });

      // Navigate to artworks page
      navigate('/artworks');
    } catch (error) {
      console.error('Error submitting artwork:', error);
      toast({
        title: 'Error submitting artwork',
        description: error instanceof Error ? error.message : 'Please try again later',
        status: 'error',
        duration: 5000,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="2xl" py={8}>
      <VStack spacing={8} align="stretch">
        <Box>
          <Heading as="h1" size="xl" mb={4}>Submit Your Artwork</Heading>
          <Text fontSize="lg">
            Join the Meta.Salon community by submitting your digital artwork for review and exhibition.
          </Text>
        </Box>

        <form onSubmit={handleSubmit}>
          <VStack spacing={6}>
            <FormControl isRequired>
              <FormLabel>Artwork Title</FormLabel>
              <Input
                placeholder="Enter the title of your artwork"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Album</FormLabel>
              <Select
                placeholder="Select album"
                value={selectedAlbumId}
                onChange={(e) => setSelectedAlbumId(e.target.value)}
              >
                {albums.map((album) => (
                  <option key={album.id} value={album.id}>
                    {album.name}
                  </option>
                ))}
              </Select>
            </FormControl>

            <FormControl>
              <FormLabel>Description</FormLabel>
              <Textarea
                placeholder="Tell us about your artwork..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </FormControl>

            <FormControl isRequired>
              <FormLabel>Upload Artwork</FormLabel>
              <Input
                type="file"
                accept="image/*"
                p={1}
                onChange={handleFileChange}
              />
              <Text fontSize="sm" color="gray.500" mt={1}>
                Supported formats: JPG, PNG, GIF (max 10MB)
              </Text>
            </FormControl>

            {previewUrl && (
              <Box borderWidth="1px" borderRadius="lg" overflow="hidden">
                <Image
                  src={previewUrl}
                  alt="Artwork preview"
                  maxH="400px"
                  w="full"
                  objectFit="contain"
                />
              </Box>
            )}

            <Button
              colorScheme="blue"
              size="lg"
              w="full"
              type="submit"
              isLoading={isLoading}
              loadingText="Uploading..."
              isDisabled={!title || !selectedFile || !selectedAlbumId}
            >
              Submit Artwork
            </Button>
          </VStack>
        </form>
      </VStack>
    </Container>
  );
} 