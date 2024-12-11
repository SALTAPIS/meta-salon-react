import {
  Box,
  Container,
  Flex,
  Text,
  useColorMode,
  IconButton,
  HStack,
  Button,
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { NavMenu } from './NavMenu';
import { Link as RouterLink } from 'react-router-dom';
import { Logo } from './Logo';

export function Header() {
  const { colorMode, toggleColorMode } = useColorMode();

  return (
    <Box as="header" py={4} borderBottomWidth={1}>
      <Container size="wide">
        <Flex align="center" justify="space-between">
          <HStack as={RouterLink} to="/" spacing={2} cursor="pointer">
            <Logo />
            <Text 
              fontSize="xl" 
              fontWeight="bold"
              fontFamily="'Allan', cursive"
              letterSpacing="wide"
              textTransform="none"
              style={{ fontWeight: 700 }}
            >
              Meta.Salon
            </Text>
          </HStack>

          <HStack spacing={4}>
            <Button as={RouterLink} to="/game" variant="ghost" size="sm">
              The Salon Game
            </Button>
            <Button as={RouterLink} to="/artworks" variant="ghost" size="sm">
              Artworks
            </Button>
            <Button as={RouterLink} to="/classement" variant="ghost" size="sm">
              Classement
            </Button>
            <Button as={RouterLink} to="/submit" variant="ghost" size="sm">
              Submit Art
            </Button>
          </HStack>

          <HStack spacing={4}>
            <IconButton
              aria-label="Toggle color mode"
              icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
              onClick={toggleColorMode}
              variant="ghost"
            />
            <NavMenu />
          </HStack>
        </Flex>
      </Container>
    </Box>
  );
} 