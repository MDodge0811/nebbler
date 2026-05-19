import { useCallback, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useSignIn, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
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
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import type { AuthStackScreenProps } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const scrollContentStyle = tva({ base: 'flex-grow justify-center p-6' });
const headerStyle = tva({ base: 'mb-8 items-center' });
const titleStyle = tva({ base: 'text-3xl font-bold text-typography-900' });
const subtitleStyle = tva({ base: 'mt-2 text-center text-typography-600' });
const formStyle = tva({ base: 'gap-4' });
const buttonRowStyle = tva({ base: 'gap-2' });
const errorBannerStyle = tva({ base: 'mb-4 rounded-lg bg-error-50 p-3' });
const errorBannerTextStyle = tva({ base: 'text-center text-error-600' });
const dividerStyle = tva({ base: 'my-6 flex-row items-center' });
const dividerLineStyle = tva({ base: 'flex-1 border-t border-typography-200' });
const dividerTextStyle = tva({ base: 'mx-3 text-typography-500' });
const socialStyle = tva({ base: 'gap-3' });
const footerStyle = tva({ base: 'mt-6 flex-row items-center justify-center' });
const footerTextStyle = tva({ base: 'text-typography-600' });
const linkTextStyle = tva({ base: 'ml-1 font-semibold text-primary-500' });

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
});

// Required so OAuth redirects complete on iOS.
WebBrowser.maybeCompleteAuthSession();

type OAuthStrategy = 'oauth_google' | 'oauth_apple' | 'oauth_facebook';

interface FormErrors {
  email?: string;
  password?: string;
}

export function LoginScreen({ navigation }: AuthStackScreenProps<'Login'>) {
  const { signIn, setActive, isLoaded } = useSignIn();
  const { startSSOFlow } = useSSO();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState<null | 'password' | 'code'>(null);
  const [fieldErrors, setFieldErrors] = useState<FormErrors>({});
  const [genericError, setGenericError] = useState<string | undefined>();
  const [oauthInFlight, setOauthInFlight] = useState<OAuthStrategy | null>(null);

  const passwordSignIn = useCallback(async () => {
    if (!isLoaded || !signIn || submitting) return;

    const trimmed = email.trim();
    const errors: FormErrors = {};
    if (!trimmed) errors.email = 'Email is required';
    if (!password) errors.password = 'Password is required';
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    setFieldErrors({});
    setGenericError(undefined);
    setSubmitting('password');

    try {
      const result = await signIn.create({ identifier: trimmed, password });

      if (result.status === 'complete' && setActive) {
        await setActive({ session: result.createdSessionId });
        // ClerkPowerSyncBridge will pick up the new session.
        return;
      }

      // Multi-factor or other intermediate states — surface a message and
      // let the user choose the code path.
      setGenericError('Additional verification is required. Try the email code option.');
    } catch (err) {
      setGenericError(extractClerkError(err));
    } finally {
      setSubmitting(null);
    }
  }, [email, isLoaded, password, setActive, signIn, submitting]);

  const sendCode = useCallback(async () => {
    if (!isLoaded || !signIn || submitting) return;

    const trimmed = email.trim();
    if (!trimmed) {
      setFieldErrors({ email: 'Email is required' });
      return;
    }

    setFieldErrors({});
    setGenericError(undefined);
    setSubmitting('code');

    try {
      await signIn.create({ strategy: 'email_code', identifier: trimmed });
      navigation.navigate('VerifyCode', { email: trimmed, mode: 'sign-in' });
    } catch (err) {
      setGenericError(extractClerkError(err));
    } finally {
      setSubmitting(null);
    }
  }, [email, isLoaded, navigation, signIn, submitting]);

  const oauth = useCallback(
    async (strategy: OAuthStrategy) => {
      if (oauthInFlight) return;
      setOauthInFlight(strategy);
      setGenericError(undefined);

      try {
        const { createdSessionId, setActive: ssoSetActive } = await startSSOFlow({ strategy });
        if (createdSessionId && ssoSetActive) {
          await ssoSetActive({ session: createdSessionId });
        }
      } catch (err) {
        setGenericError(extractClerkError(err));
      } finally {
        setOauthInFlight(null);
      }
    },
    [oauthInFlight, startSSOFlow]
  );

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box className={scrollContentStyle({})}>
          <Box className={headerStyle({})}>
            <Text className={titleStyle({})}>Welcome to Nebbler</Text>
            <Text className={subtitleStyle({})}>Sign in to continue</Text>
          </Box>

          {genericError && (
            <Box className={errorBannerStyle({})}>
              <Text className={errorBannerTextStyle({})}>{genericError}</Text>
            </Box>
          )}

          <VStack className={formStyle({})}>
            <FormControl isInvalid={!!fieldErrors.email}>
              <FormControlLabel>
                <FormControlLabelText>Email</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!fieldErrors.email}>
                <InputField
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoComplete="email"
                />
              </Input>
              {fieldErrors.email && (
                <FormControlError>
                  <FormControlErrorText>{fieldErrors.email}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!fieldErrors.password}>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!fieldErrors.password}>
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Your password"
                  secureTextEntry
                  autoComplete="current-password"
                />
              </Input>
              {fieldErrors.password ? (
                <FormControlError>
                  <FormControlErrorText>{fieldErrors.password}</FormControlErrorText>
                </FormControlError>
              ) : (
                <FormControlHelper>
                  <FormControlHelperText>
                    Leave blank to receive a one-time code by email.
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            </FormControl>

            <VStack className={buttonRowStyle({})}>
              <Button onPress={passwordSignIn} isDisabled={!isLoaded || submitting !== null}>
                {submitting === 'password' && <ButtonSpinner />}
                <ButtonText>
                  {submitting === 'password' ? 'Signing in…' : 'Sign in with password'}
                </ButtonText>
              </Button>
              <Button
                variant="outline"
                onPress={sendCode}
                isDisabled={!isLoaded || submitting !== null}
              >
                {submitting === 'code' && <ButtonSpinner />}
                <ButtonText>
                  {submitting === 'code' ? 'Sending code…' : 'Email me a code instead'}
                </ButtonText>
              </Button>
            </VStack>
          </VStack>

          <Box className={dividerStyle({})}>
            <Box className={dividerLineStyle({})} />
            <Text className={dividerTextStyle({})}>or continue with</Text>
            <Box className={dividerLineStyle({})} />
          </Box>

          <VStack className={socialStyle({})}>
            <Button
              variant="outline"
              onPress={() => oauth('oauth_google')}
              isDisabled={!!oauthInFlight}
            >
              {oauthInFlight === 'oauth_google' && <ButtonSpinner />}
              <ButtonText>Continue with Google</ButtonText>
            </Button>
            <Button
              variant="outline"
              onPress={() => oauth('oauth_apple')}
              isDisabled={!!oauthInFlight}
            >
              {oauthInFlight === 'oauth_apple' && <ButtonSpinner />}
              <ButtonText>Continue with Apple</ButtonText>
            </Button>
            <Button
              variant="outline"
              onPress={() => oauth('oauth_facebook')}
              isDisabled={!!oauthInFlight}
            >
              {oauthInFlight === 'oauth_facebook' && <ButtonSpinner />}
              <ButtonText>Continue with Facebook</ButtonText>
            </Button>
          </VStack>

          <Box className={footerStyle({})}>
            <Text className={footerTextStyle({})}>New to Nebbler?</Text>
            <Text className={linkTextStyle({})} onPress={() => navigation.navigate('SignUp')}>
              Create an account
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function extractClerkError(err: unknown): string {
  const maybe = err as { errors?: { message?: string; longMessage?: string }[]; message?: string };
  return (
    maybe?.errors?.[0]?.longMessage ??
    maybe?.errors?.[0]?.message ??
    maybe?.message ??
    'Something went wrong. Try again.'
  );
}
