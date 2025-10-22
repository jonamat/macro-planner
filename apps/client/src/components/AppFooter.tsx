import { Box, Container, Flex, Link, Stack, Text } from '@chakra-ui/react';

export function AppFooter() {
  return (
    <Box
      as="footer"
      mt={{ base: 10, md: 16 }}
      py={{ base: 6, md: 8 }}
      bg="rgba(14, 16, 24, 0.92)"
      borderTop="1px solid rgba(94, 234, 212, 0.15)"
      backdropFilter="blur(12px)"
    >
      <Container maxW="6xl">
        <Flex direction={{ base: 'column', md: 'row' }} align={{ base: 'flex-start', md: 'center' }} justify="space-between" gap={6}>
          <Stack gap={1}>
            <Text fontSize="sm" color="rgba(245, 247, 255, 0.75)">
              Crafted with macros in mind · © {new Date().getFullYear()}
            </Text>
            <Text fontSize="xs" color="rgba(148, 197, 255, 0.7)">
              Placeholder credits · swap me with your name or team later on.
            </Text>
          </Stack>

          <Flex gap={4} wrap="wrap">
            <Link
              href="/info"
              fontSize="sm"
              color="app.accent"
              _hover={{ textDecoration: 'underline', color: 'app.accentMuted' }}
            >
              Info &amp; Usage
            </Link>
            <Link
              href="https://github.com/example/macro-planner"
              target="_blank"
              rel="noreferrer"
              fontSize="sm"
              color="app.textMuted"
              _hover={{ color: 'app.accent' }}
            >
              GitHub
            </Link>
            <Link
              href="#"
              fontSize="sm"
              color="app.textMuted"
              _hover={{ color: 'app.accent' }}
            >
              Support
            </Link>
          </Flex>
        </Flex>
      </Container>
    </Box>
  );
}
