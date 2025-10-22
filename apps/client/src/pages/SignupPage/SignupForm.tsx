import { Box, Button, Heading, Input, Stack, Text, chakra } from '@chakra-ui/react';
import { ChangeEvent, FormEvent, useState } from 'react';
import { Link as RouterLink, useNavigate } from 'react-router-dom';

import { useAuth } from '../../providers/AuthProvider';

const Label = chakra('label');
const FormEl = chakra('form');
const LinkEl = chakra(RouterLink);

export function SignupForm() {
  const navigate = useNavigate();
  const { signup, loading, error, clearError } = useAuth();

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
      await signup(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to signup';
      setFormError(message);
    }
  };

  return (
    <FormEl
      onSubmit={handleSubmit}
      bg="rgba(17, 19, 29, 0.92)"
      borderRadius="2xl"
      border="1px solid rgba(94, 234, 212, 0.2)"
      boxShadow="0 20px 45px rgba(15, 17, 26, 0.45)"
      w="100%"
      maxW="md"
      px={{ base: 6, md: 10 }}
      py={{ base: 8, md: 10 }}
    >
      <Stack gap={6}>
        <Heading size="lg" textAlign="center" color="white">
          Create your account
        </Heading>

        <Box>
          <Label htmlFor="signup-username" display="block" fontWeight="semibold" mb={2} color="whiteAlpha.800">
            Username
          </Label>
          <Input
            id="signup-username"
            value={username}
            onChange={handleUsernameChange}
            placeholder="user"
            autoComplete="username"
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            color="whiteAlpha.900"
            _placeholder={{ color: 'whiteAlpha.600' }}
            _focus={{ borderColor: '#5eead4', boxShadow: '0 0 0 1px #5eead4' }}
          />
        </Box>

        <Box>
          <Label htmlFor="signup-password" display="block" fontWeight="semibold" mb={2} color="whiteAlpha.800">
            Password
          </Label>
          <Input
            id="signup-password"
            type="password"
            value={password}
            onChange={handlePasswordChange}
            placeholder="********"
            autoComplete="new-password"
            bg="whiteAlpha.100"
            borderColor="whiteAlpha.200"
            color="whiteAlpha.900"
            _placeholder={{ color: 'whiteAlpha.600' }}
            _focus={{ borderColor: '#5eead4', boxShadow: '0 0 0 1px #5eead4' }}
          />
        </Box>

        {(formError || error) && (
          <Text color="#fca5a5" fontSize="sm">
            {formError ?? error}
          </Text>
        )}

        <Button
          type="submit"
          bg="#5eead4"
          color="#0f111a"
          fontWeight="semibold"
          _hover={{ bg: '#5eead4', transform: 'translateY(-1px)', boxShadow: '0 10px 22px rgba(94, 234, 212, 0.25)' }}
          _focusVisible={{ boxShadow: '0 0 0 3px rgba(94, 234, 212, 0.45)' }}
          _active={{ bg: '#34d9c1' }}
          loading={loading}
          w="full"
        >
          Sign up
        </Button>

        <Text fontSize="sm" textAlign="center" color="whiteAlpha.700">
          Already have an account?{' '}
          <LinkEl to="/login" color="#5eead4" fontWeight="semibold">
            Log in
          </LinkEl>
        </Text>
      </Stack>
    </FormEl>
  );
}
