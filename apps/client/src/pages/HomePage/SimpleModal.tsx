import { Box, Button, Flex, Heading, chakra } from '@chakra-ui/react';
import type { FormEvent, ReactNode } from 'react';

const ModalSurface = chakra('div');
const FormEl = chakra('form');

interface SimpleModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  children: ReactNode;
}

export function SimpleModal({ open, title, onClose, onSubmit, isSubmitting, children }: SimpleModalProps) {
  if (!open) return null;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <ModalSurface
      position="fixed"
      inset="0"
      bg="blackAlpha.600"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="modal"
      onClick={onClose}
    >
      <Box
        bg="white"
        borderRadius="lg"
        boxShadow="2xl"
        w="100%"
        maxW="lg"
        p={6}
        onClick={(event) => event.stopPropagation()}
      >
        <Flex justify="space-between" align="center" mb={4}>
          <Heading size="md">{title}</Heading>
          <Button variant="ghost" size="sm" onClick={onClose}>
            Close
          </Button>
        </Flex>
        <FormEl onSubmit={handleSubmit} display="flex" flexDirection="column" gap={5}>
          {children}
          <Flex justify="flex-end" gap={3}>
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button colorScheme="teal" type="submit" loading={isSubmitting}>
              Save
            </Button>
          </Flex>
        </FormEl>
      </Box>
    </ModalSurface>
  );
}
