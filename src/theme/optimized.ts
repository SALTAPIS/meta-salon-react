import { extendTheme } from '@chakra-ui/react';

const optimizedTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
    cssVarPrefix: 'salon',
  },
  styles: {
    global: {
      'html, body': {
        backgroundColor: 'white',
        color: 'gray.800',
      },
      '*': {
        // Disable animations and transitions globally
        transition: 'none !important',
        animation: 'none !important',
        // Use hardware acceleration
        transform: 'translateZ(0)',
        backfaceVisibility: 'hidden',
        perspective: 1000,
      },
    },
  },
  components: {
    Button: {
      defaultProps: {
        variant: 'solid',
      },
      baseStyle: {
        _hover: { transform: 'none' },
        _active: { transform: 'none' },
      },
    },
    Badge: {
      baseStyle: {
        textTransform: 'none',
      },
    },
    Container: {
      baseStyle: {
        maxW: 'container.xl',
      },
    },
  },
});

export default optimizedTheme; 