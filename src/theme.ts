import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
    disableTransitionOnChange: true,
  },
  styles: {
    global: {
      body: {
        minHeight: '100vh',
        overscrollBehavior: 'none',
        WebkitTapHighlightColor: 'transparent',
      },
    },
  },
  components: {
    Button: {
      baseStyle: {
        _hover: {
          transform: 'none',
        },
      },
    },
    Badge: {
      baseStyle: {
        textTransform: 'none',
      },
    },
  },
  breakpoints: {
    sm: '30em',
    md: '48em',
    lg: '62em',
    xl: '80em',
    '2xl': '96em',
  },
});

export default theme; 