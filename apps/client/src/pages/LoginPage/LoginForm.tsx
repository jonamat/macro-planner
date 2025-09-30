import { Box, Button, Heading, Input, Stack, Text, chakra } from '@chakra-ui/react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../providers/AuthProvider';

const Label = chakra('label');
const FormEl = chakra('form');
const LinkEl = chakra(RouterLink);

export function LoginForm() {
  const navigate = useNavigate();
  const { login, loading, error, clearError } = useAuth();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const handleUsernameChange = (event: ChangeEvent<HTMLInputElement>) => {
    setUsername(event.currentTarget.value);
  };

  const handlePasswordChange = (event: ChangeEvent<HTMLInputElement>) => {
    setPassword(event.currentTarget.value);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setFormError(null);
    clearError();

    if (!username.trim() || !password) {
      setFormError('Username and password are required');
      return;
    }

    try {
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to login';
      setFormError(message);
    }
  };

  return (
    <FormEl onSubmit={handleSubmit} bg="white" p={8} borderRadius="lg" boxShadow="lg" w="100%" maxW="sm">
      <Stack gap={6}>
        <Heading size="lg" textAlign="center">
          Macro Planner
        </Heading>

        <Box>
          <Label htmlFor="auth-username" display="block" fontWeight="semibold" mb={2}>
            Username
          </Label>
          <Input
            id="auth-username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="user"
            autoComplete="username"
            bg="gray.50"
          />
        </Box>

        <Box>
          <Label htmlFor="auth-password" display="block" fontWeight="semibold" mb={2}>
            Password
          </Label>
          <Input
            id="auth-password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="********"
            autoComplete="current-password"
            bg="gray.50"
          />
        </Box>

        {(formError || error) && (
          <Text color="red.600" fontSize="sm">
            {formError ?? error}
          </Text>
        )}

        <Button type="submit" colorScheme="teal" loading={loading}>
          Login
        </Button>
        <Text fontSize="sm" textAlign="center" color="gray.600">
          Need an account?{' '}
          <LinkEl to="/signup" color="teal.600" fontWeight="semibold">
            Sign up
          </LinkEl>
        </Text>
      </Stack>
    </FormEl>
  );
}
