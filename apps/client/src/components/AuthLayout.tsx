import { Box, Flex, Heading, Image, Stack, Text } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Flex
      minH="100vh"
      align="center"
      justify="center"
      bg="linear-gradient(180deg, #0f111a 0%, #151826 40%, #0f111a 100%)"
      color="rgba(255,255,255,0.92)"
      px={4}
      py={{ base: 10, md: 16 }}
    >
      <Stack
        direction={{ base: 'column', lg: 'row' }}
        align="center"
        gap={{ base: 12, lg: 16 }}
        w="full"
        maxW="6xl"
      >
        <Stack gap={6} align={{ base: 'center', lg: 'flex-start' }} textAlign={{ base: 'center', lg: 'left' }}>

          <Box maxW="lg">
            <Heading size="xl" fontWeight="semibold" letterSpacing="tight">
              Macro Planner
            </Heading>
            <Text mt={3} fontSize={{ base: 'md', md: 'lg' }} color="whiteAlpha.700">
              Balance macros, build meals, and stay on track across every device.
            </Text>
          </Box>
        </Stack>
        <Box w="full" maxW="md">
          {children}
        </Box>
      </Stack>
    </Flex>
  );
}
