import { useState } from 'react';
import { KeyboardAvoidingView, Platform } from 'react-native';
import { Center } from '@components/ui/center';
import { Box } from '@components/ui/box';
import { VStack } from '@components/ui/vstack';
import { Heading } from '@components/ui/heading';
import { Text } from '@components/ui/text';
import { Input, InputField } from '@components/ui/input';
import { Button, ButtonText, ButtonSpinner } from '@components/ui/button';
import { FormControl, FormControlLabel, FormControlLabelText } from '@components/ui/form-control';
import { Alert, AlertText } from '@components/ui/alert';
import { useAuth } from '@hooks/useAuth';

export function SignInScreen() {
  const { signIn, isLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSignIn = async () => {
    setError(null);
    if (!email.trim() || !password.trim()) {
      setError('Please enter both email and password.');
      return;
    }
    try {
      await signIn(email, password);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Sign in failed');
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className="flex-1"
    >
      <Center className="flex-1 bg-background px-6">
        <Box className="w-full max-w-sm">
          <VStack space="xl">
            <VStack space="xs" className="items-center mb-8">
              <Heading size="2xl">Nebbler</Heading>
              <Text className="text-text-secondary">Sign in to your account</Text>
            </VStack>

            {error && (
              <Alert action="error">
                <AlertText>{error}</AlertText>
              </Alert>
            )}

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Email</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="you@example.com"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </Input>
            </FormControl>

            <FormControl>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input>
                <InputField
                  placeholder="Enter your password"
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </Input>
            </FormControl>

            <Button onPress={handleSignIn} isDisabled={isLoading} className="mt-4">
              {isLoading && <ButtonSpinner />}
              <ButtonText>{isLoading ? 'Signing in...' : 'Sign In'}</ButtonText>
            </Button>
          </VStack>
        </Box>
      </Center>
    </KeyboardAvoidingView>
  );
}
