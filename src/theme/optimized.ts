import { extendTheme } from '@chakra-ui/react';

const optimizedTheme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
    cssVarPrefix: 'salon',
  },
  styles: {
    global: (props: { colorMode: 'light' | 'dark' }) => ({
      body: {
        bg: props.colorMode === 'light' ? 'white' : 'gray.900',
        color: props.colorMode === 'light' ? 'gray.800' : 'whiteAlpha.900',
      },
      '*::placeholder': {
        color: props.colorMode === 'light' ? 'gray.400' : 'whiteAlpha.400',
      },
      '*, *::before, &::after': {
        borderColor: props.colorMode === 'light' ? 'gray.200' : 'whiteAlpha.300',
      },
    }),
  },
  components: {
    Modal: {
      baseStyle: (props: { colorMode: 'light' | 'dark' }) => ({
        overlay: {
          bg: 'blackAlpha.600',
          zIndex: 1400,
        },
        dialogContainer: {
          zIndex: 1500,
        },
        dialog: {
          bg: props.colorMode === 'light' ? 'white' : 'gray.800',
          zIndex: 1500,
        },
        closeButton: {
          zIndex: 1501,
        },
      }),
    },
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
        px: { base: 4, md: 6, lg: 8, xl: 12 },
      },
      sizes: {
        regular: {
          maxW: 'container.xl'
        },
        wide: {
          maxW: '2400px'
        },
        full: {
          maxW: '100%'
        }
      },
      defaultProps: {
        size: 'regular'
      }
    },
  },
  semanticTokens: {
    colors: {
      'chakra-body-bg': { _light: 'white', _dark: 'gray.900' },
      'chakra-body-text': { _light: 'gray.800', _dark: 'whiteAlpha.900' },
    },
  },
});

export default optimizedTheme; 