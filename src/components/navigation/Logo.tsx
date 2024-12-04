import { Box } from '@chakra-ui/react';
import { useColorMode } from '@chakra-ui/react';

export function Logo() {
  const { colorMode } = useColorMode();
  
  return (
    <Box as="svg" 
      width="24px" 
      height="24px" 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      style={{
        filter: colorMode === 'dark' ? 'invert(1)' : undefined,
        transition: 'filter 0.2s'
      }}
    >
      <path 
        d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM15 12C15 13.66 13.66 15 12 15C10.34 15 9 13.66 9 12C9 10.34 10.34 9 12 9C13.66 9 15 10.34 15 12Z" 
        fill="currentColor"
      />
    </Box>
  );
} 