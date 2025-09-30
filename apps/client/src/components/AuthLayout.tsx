import { Flex } from '@chakra-ui/react';
import type { ReactNode } from 'react';

interface AuthLayoutProps {
  children: ReactNode;
}

export function AuthLayout({ children }: AuthLayoutProps) {
  return (
    <Flex minH="100vh" align="center" justify="center" bg="gray.50" px={4}>
      {children}
    </Flex>
  );
}
