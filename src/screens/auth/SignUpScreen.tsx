import { useSignUp } from '@clerk/clerk-expo';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';

import { Box } from '@/components/ui/box';
import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { AuthStackScreenProps } from '@navigation/types';
import { extractClerkError } from '@utils/clerkError';

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
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
}

export function SignUpScreen({ navigation }: AuthStackScreenProps<'SignUp'>) {
  const { signUp, isLoaded } = useSignUp();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});
  const [genericError, setGenericError] = useState<string | undefined>();

  const submit = useCallback(async () => {
    if (!isLoaded || submitting) return;

    const fieldErrors: FormErrors = {};
    if (!firstName.trim()) fieldErrors.firstName = 'First name is required';
    if (!lastName.trim()) fieldErrors.lastName = 'Last name is required';
    if (!email.trim()) fieldErrors.email = 'Email is required';
    if (password.length < 8) {
      fieldErrors.password = 'Password must be at least 8 characters';
    }
    if (Object.keys(fieldErrors).length > 0) {
      setErrors(fieldErrors);
      return;
    }

    setErrors({});
    setGenericError(undefined);
    setSubmitting(true);

    try {
      await signUp.create({
        emailAddress: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      });
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });
      navigation.navigate('VerifyCode', { email: email.trim(), mode: 'sign-up' });
    } catch (err) {
      setGenericError(extractClerkError(err, 'Could not create your account. Try again.'));
    } finally {
      setSubmitting(false);
    }
  }, [email, firstName, isLoaded, lastName, navigation, password, signUp, submitting]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box className={scrollContentStyle({})}>
          <Box className={headerStyle({})}>
            <Text className={titleStyle({})}>Create your account</Text>
            <Text className={subtitleStyle({})}>Sign up with email and password</Text>
          </Box>

          {genericError && (
            <Box className={errorBannerStyle({})}>
              <Text className={errorBannerTextStyle({})}>{genericError}</Text>
            </Box>
          )}

          <VStack className={formStyle({})}>
            <FormControl isInvalid={!!errors.firstName} isRequired>
              <FormControlLabel>
                <FormControlLabelText>First name</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!errors.firstName}>
                <InputField
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </Input>
              {errors.firstName && (
                <FormControlError>
                  <FormControlErrorText>{errors.firstName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.lastName} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Last name</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!errors.lastName}>
                <InputField
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </Input>
              {errors.lastName && (
                <FormControlError>
                  <FormControlErrorText>{errors.lastName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.email} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Email</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!errors.email}>
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Input>
              {errors.email && (
                <FormControlError>
                  <FormControlErrorText>{errors.email}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!errors.password} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!errors.password}>
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="At least 8 characters"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </Input>
              {errors.password ? (
                <FormControlError>
                  <FormControlErrorText>{errors.password}</FormControlErrorText>
                </FormControlError>
              ) : (
                <FormControlHelper>
                  <FormControlHelperText>
                    Clerk enforces a minimum of 8 characters by default.
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            </FormControl>

            <Button
              onPress={() => {
                void submit();
              }}
              isDisabled={submitting || !isLoaded}
            >
              {submitting && <ButtonSpinner />}
              <ButtonText>{submitting ? 'Creating account…' : 'Create account'}</ButtonText>
            </Button>
          </VStack>

          <Box className={footerStyle({})}>
            <Text className={footerTextStyle({})}>Already have an account?</Text>
            <Text className={linkTextStyle({})} onPress={() => navigation.navigate('Login')}>
              Sign in
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
