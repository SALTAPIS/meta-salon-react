import {
  VStack,
  FormControl,
  FormLabel,
  Input,
  FormErrorMessage,
  Textarea,
  Button,
} from '@chakra-ui/react';
import type { ProfileFormData } from '../../types/profile.types';

interface ProfileFormProps {
  data: ProfileFormData;
  usernameError: string;
  isSubmitting: boolean;
  isUpdating: boolean;
  onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  onUsernameBlur: () => void;
  onSubmit: (e: React.FormEvent) => void;
}

export function ProfileForm({
  data,
  usernameError,
  isSubmitting,
  isUpdating,
  onChange,
  onUsernameBlur,
  onSubmit,
}: ProfileFormProps) {
  return (
    <form onSubmit={onSubmit}>
      <VStack spacing={6} align="stretch">
        {/* Username */}
        <FormControl isInvalid={!!usernameError}>
          <FormLabel>Username</FormLabel>
          <Input
            name="username"
            value={data.username || ''}
            onChange={onChange}
            onBlur={onUsernameBlur}
            placeholder="Choose a unique username"
          />
          <FormErrorMessage>{usernameError}</FormErrorMessage>
        </FormControl>

        {/* Display Name */}
        <FormControl>
          <FormLabel>Display Name</FormLabel>
          <Input
            name="display_name"
            value={data.display_name || ''}
            onChange={onChange}
            placeholder="How should we call you?"
          />
        </FormControl>

        {/* Bio */}
        <FormControl>
          <FormLabel>Bio</FormLabel>
          <Textarea
            name="bio"
            value={data.bio || ''}
            onChange={onChange}
            placeholder="Tell us about yourself"
            rows={4}
          />
        </FormControl>

        {/* Website */}
        <FormControl>
          <FormLabel>Website</FormLabel>
          <Input
            name="website"
            value={data.website || ''}
            onChange={onChange}
            placeholder="Your personal website"
          />
        </FormControl>

        <Button
          type="submit"
          colorScheme="blue"
          isLoading={isSubmitting || isUpdating}
          loadingText="Saving..."
          isDisabled={!!usernameError}
        >
          Save Changes
        </Button>
      </VStack>
    </form>
  );
} 