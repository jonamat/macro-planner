import { Box, Button, Flex, Heading, chakra } from '@chakra-ui/react';
import type { FormEvent, ReactNode } from 'react';
import { useEffect } from 'react';

const ModalSurface = chakra('div');
const FormEl = chakra('form');

interface SimpleModalProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onSubmit: () => void;
  isSubmitting: boolean;
  children: ReactNode;
  onDelete?: (() => void) | undefined;
  isDeleting?: boolean;
  deleteLabel?: string;
}

export function SimpleModal({
  open,
  title,
  onClose,
  onSubmit,
  isSubmitting,
  children,
  onDelete,
  isDeleting,
  deleteLabel
}: SimpleModalProps) {
  if (!open) return null;

  useEffect(() => {
    const handler = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.stopPropagation();
        onClose();
      }
    };

    window.addEventListener('keydown', handler);
    return () => {
      window.removeEventListener('keydown', handler);
    };
  }, [onClose]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    onSubmit();
  };

  return (
    <ModalSurface
      position="fixed"
      inset="0"
      bg="rgba(9, 10, 15, 0.75)"
      backdropFilter="blur(12px)"
      display="flex"
      alignItems="center"
      justifyContent="center"
      zIndex="modal"
      onClick={onClose}
    >
      <Box
        bg="app.surfaceActive"
        borderRadius="1.25rem"
        boxShadow="0 22px 80px rgba(4, 6, 12, 0.65)"
        w="calc(100% - 2rem)"
        maxW="lg"
        p={{ base: 5, md: 6 }}
        border="1px solid rgba(94, 234, 212, 0.05)"
        onClick={(event) => event.stopPropagation()}
      >
        <Flex justify="space-between" align={{ base: 'flex-start', sm: 'center' }} mb={6} gap={4}>
          <Heading size="md" letterSpacing="wide">
            {title}
          </Heading>
          <Button variant="ghost" size="sm" onClick={onClose} _hover={{ bg: 'whiteAlpha.100' }}>
            Close
          </Button>
        </Flex>
        <FormEl onSubmit={handleSubmit} display="flex" flexDirection="column" gap={5}>
          {children}
          <Flex justify="flex-end" gap={3} wrap="wrap">
            {onDelete && (
              <Button
                variant="outline"
                borderColor="rgba(248, 113, 113, 0.65)"
                color="app.error"
                _hover={{ bg: 'rgba(248, 113, 113, 0.12)' }}
                onClick={onDelete}
                loading={isDeleting}
                mr="auto"
              >
                {deleteLabel ?? 'Delete'}
              </Button>
            )}
            <Button
              variant="ghost"
              color="app.textMuted"
              _hover={{ bg: 'rgba(148, 163, 184, 0.12)' }}
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              bg="app.accent"
              color="#061216"
              _hover={{ bg: 'app.accentMuted' }}
              type="submit"
              loading={isSubmitting}
            >
              Save
            </Button>
          </Flex>
        </FormEl>
      </Box>
    </ModalSurface>
  );
}
