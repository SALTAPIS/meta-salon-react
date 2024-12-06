import {
  FormControl,
  FormLabel,
  Button,
  Avatar,
  HStack,
  IconButton,
  VStack,
} from '@chakra-ui/react';
import { DeleteIcon } from '@chakra-ui/icons';

interface AvatarUploadProps {
  currentAvatarUrl?: string | null;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  onFileSelect: (file: File) => void;
  onRemove: () => void;
  selectedFile: File | null;
}

export function AvatarUpload({
  currentAvatarUrl,
  displayName,
  username,
  email,
  onFileSelect,
  onRemove,
  selectedFile,
}: AvatarUploadProps) {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onFileSelect(file);
    }
  };

  return (
    <FormControl>
      <FormLabel>Profile Picture</FormLabel>
      <HStack spacing={4}>
        <Avatar
          size="xl"
          src={selectedFile ? URL.createObjectURL(selectedFile) : currentAvatarUrl || undefined}
          name={displayName || username || email || ''}
        />
        <VStack>
          <Button
            as="label"
            htmlFor="avatar-upload"
            colorScheme="blue"
            cursor="pointer"
          >
            Upload New Picture
            <input
              id="avatar-upload"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              style={{ display: 'none' }}
            />
          </Button>
          {(currentAvatarUrl || selectedFile) && (
            <IconButton
              aria-label="Remove avatar"
              icon={<DeleteIcon />}
              onClick={onRemove}
              variant="ghost"
              colorScheme="red"
            />
          )}
        </VStack>
      </HStack>
    </FormControl>
  );
} 