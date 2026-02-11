import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { Input, InputField } from '@/components/ui/input';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
} from '@/components/ui/form-control';
import { useLogin } from '@hooks/useAuthMutations';
import { LoginSchema } from '@database/schemas';
import type { AuthStackScreenProps } from '@navigation/types';
import { ZodError } from 'zod';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const scrollContentStyle = tva({ base: 'flex-grow justify-center p-6' });
const headerStyle = tva({ base: 'mb-8 items-center' });
const titleStyle = tva({ base: 'text-3xl font-bold text-typography-900' });
const subtitleStyle = tva({ base: 'mt-2 text-center text-typography-600' });
const formStyle = tva({ base: 'gap-4' });
const errorBannerStyle = tva({ base: 'mb-4 rounded-lg bg-error-50 p-3' });
const errorBannerTextStyle = tva({ base: 'text-center text-error-600' });
const footerStyle = tva({ base: 'mt-6 flex-row items-center justify-center' });
const footerTextStyle = tva({ base: 'text-typography-600' });
const linkTextStyle = tva({ base: 'ml-1 font-semibold text-primary-500' });

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const loginMutation = useLogin();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateAndLogin = async () => {
    try {
      LoginSchema.parse({ email, password });
      setFormErrors({});
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: FormErrors = {};
        err.issues.forEach((issue) => {
          const field = issue.path[0] as keyof FormErrors;
          if (!errors[field]) {
            errors[field] = issue.message;
          }
        });
        setFormErrors(errors);
      }
      return;
    }

    loginMutation.mutate({ email, password });
  };

  const handleNavigateToRegister = () => {
    loginMutation.reset();
    navigation.navigate('Register');
  };

  const mutationError = loginMutation.error instanceof Error ? loginMutation.error.message : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box className={scrollContentStyle({})}>
          <Box className={headerStyle({})}>
            <Text className={titleStyle({})}>Welcome Back</Text>
            <Text className={subtitleStyle({})}>Sign in to continue to Nebbler</Text>
          </Box>

          {mutationError && (
            <Box className={errorBannerStyle({})}>
              <Text className={errorBannerTextStyle({})}>{mutationError}</Text>
            </Box>
          )}

          <VStack className={formStyle({})}>
            <FormControl isInvalid={!!formErrors.email}>
              <FormControlLabel>
                <FormControlLabelText>Email</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.email}>
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Input>
              {formErrors.email && (
                <FormControlError>
                  <FormControlErrorText>{formErrors.email}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.password}>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.password}>
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  secureTextEntry
                  autoComplete="password"
                />
              </Input>
              {formErrors.password && (
                <FormControlError>
                  <FormControlErrorText>{formErrors.password}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button onPress={validateAndLogin} isDisabled={loginMutation.isPending}>
              {loginMutation.isPending && <ButtonSpinner />}
              <ButtonText>{loginMutation.isPending ? 'Signing In...' : 'Sign In'}</ButtonText>
            </Button>
          </VStack>

          <Box className={footerStyle({})}>
            <Text className={footerTextStyle({})}>Don&apos;t have an account?</Text>
            <Text className={linkTextStyle({})} onPress={handleNavigateToRegister}>
              Sign Up
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
