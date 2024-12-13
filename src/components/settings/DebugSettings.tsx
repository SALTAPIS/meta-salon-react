import {
  Box,
  FormControl,
  FormLabel,
  Switch,
  Text,
  VStack,
} from '@chakra-ui/react';
import { useDebugMode } from '../../hooks/useDebugMode';

export function DebugSettings() {
  const { debugMode, toggleDebugMode } = useDebugMode();

  return (
    <Box>
      <VStack spacing={4} align="stretch">
        <FormControl display="flex" alignItems="center">
          <FormLabel htmlFor="debug-mode" mb="0" flex="1">
            Debug Mode
            <Text fontSize="sm" color="gray.500">
              Show debug notifications and error messages
            </Text>
          </FormLabel>
          <Switch
            id="debug-mode"
            isChecked={debugMode}
            onChange={toggleDebugMode}
          />
        </FormControl>
      </VStack>
    </Box>
  );
} 