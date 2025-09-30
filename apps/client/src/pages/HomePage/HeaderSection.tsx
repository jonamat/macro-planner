import { Box, Button, Flex, Heading, Text } from '@chakra-ui/react';

interface HeaderSectionProps {
  username?: string | undefined;
  onLogout: () => void;
  onCalculate: () => void;
  calculateDisabled: boolean;
  isCalculating?: boolean;
}

export function HeaderSection({
  username,
  onLogout,
  onCalculate,
  calculateDisabled,
  isCalculating = false
}: HeaderSectionProps) {
  return (
    <Flex
      justify="space-between"
      align={{ base: 'stretch', md: 'center' }}
      direction={{ base: 'column', md: 'row' }}
      gap={4}
      mb={8}
    >
      <Box>
        <Heading size="lg">Macro Planner</Heading>
        <Text color="gray.600">Welcome back{username ? `, ${username}` : ''}</Text>
      </Box>
      <Flex gap={3} align="center" wrap="wrap">
        <Button onClick={onCalculate} colorScheme="teal" disabled={calculateDisabled} loading={isCalculating}>
          Calculate
        </Button>
        <Button onClick={onLogout} variant="ghost" colorScheme="red">
          Logout
        </Button>
      </Flex>
    </Flex>
  );
}
