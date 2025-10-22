import { Box, Button, Container, Flex, Link as ChakraLink, Stack, Text } from '@chakra-ui/react';
import { NavLink, Outlet } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';

import { useMacroData } from '../features/macro/MacroDataProvider';
import { useAuth } from '../providers/AuthProvider';
import { AppFooter } from './AppFooter';
import 'react-toastify/dist/ReactToastify.css';

const navLinks = [
  { to: '/', label: 'Dashboard' },
  { to: '/meals', label: 'Meals' },
  { to: '/ingredients', label: 'Ingredients' },
  { to: '/info', label: 'Info' }
];

export function AppLayout() {
  const { logout, user } = useAuth();
  const { error, clearError } = useMacroData();

  return (
    <Box
      minH="100vh"
      bg="linear-gradient(180deg, #0f111a 0%, #151826 40%, #0f111a 100%)"
      color="rgba(255,255,255,0.92)"
      pb={10}
    >
      <Box as="header" borderBottomWidth="1px" borderColor="whiteAlpha.100">
        <Container maxW="6xl" py={{ base: 4, md: 6 }}>
          <Stack
            direction={{ base: 'column', md: 'row' }}
            align={{ base: 'flex-start', md: 'center' }}
            justify="space-between"
            gap={4}
          >
            <Box>
              <Text fontSize={{ base: 'xl', md: '2xl' }} fontWeight="semibold" letterSpacing="tight">
                Macro Planner
              </Text>
              <Text fontSize="sm" color="app.textMuted">
                Welcome back{user?.username ? `, ${user.username}` : ''}!
              </Text>
            </Box>

            <Flex
              as="nav"
              gap={{ base: 2, md: 4 }}
              flexWrap="wrap"
              justify={{ base: 'flex-start', md: 'center' }}
              w={{ base: 'full', md: 'auto' }}
            >
              {navLinks.map((link) => (
                <NavLink key={link.to} to={link.to} style={{ textDecoration: 'none' }}>
                  {({ isActive }) => (
                    <ChakraLink
                      px={4}
                      py={2}
                      borderRadius="full"
                      fontSize="sm"
                      fontWeight="medium"
                      bg={isActive ? 'rgba(94, 234, 212, 0.16)' : 'transparent'}
                      color={isActive ? '#5eead4' : 'rgba(226, 232, 240, 0.72)'}
                      boxShadow={isActive ? '0 0 0 1px rgba(94, 234, 212, 0.25)' : undefined}
                      _hover={{ textDecoration: 'none', bg: 'whiteAlpha.100' }}
                    >
                      {link.label}
                    </ChakraLink>
                  )}
                </NavLink>
              ))}
            </Flex>

            <Flex align="center" gap={3} w={{ base: 'full', md: 'auto' }} justify={{ base: 'stretch', md: 'flex-end' }}>
              <Button
                variant="outline"
                colorScheme="teal"
                borderColor="whiteAlpha.300"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={() => {
                  clearError();
                  logout();
                }}
                w={{ base: 'full', md: 'auto' }}
              >
                Logout
              </Button>
            </Flex>
          </Stack>
        </Container>
      </Box>

      {error && (
        <Container maxW="6xl" mt={6}>
          <Box
            bg="rgba(248, 113, 113, 0.12)"
            border="1px solid rgba(248, 113, 113, 0.35)"
            borderRadius="card"
            px={5}
            py={4}
            color="#fca5a5"
          >
            <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} gap={3}>
              <Text fontWeight="medium">{error}</Text>
              <Button
                size="sm"
                variant="ghost"
                color="app.textMuted"
                _hover={{ bg: 'whiteAlpha.100' }}
                onClick={clearError}
              >
                Dismiss
              </Button>
            </Flex>
          </Box>
        </Container>
      )}

      <Container maxW="6xl" pt={{ base: 6, md: 10 }}>
        <Outlet />
      </Container>

      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar
        newestOnTop
        closeOnClick
        pauseOnHover={false}
        draggable
        theme="dark"
      />

      <AppFooter />
    </Box>
  );
}
