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
} from '@/components/ui/form-control';
import { Input, InputField } from '@/components/ui/input';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { useSignInFlow, useSignUpFlow } from '@hooks/useAuthFlows';
import type { AuthStackScreenProps } from '@navigation/types';

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

export function VerifyCodeScreen({ route, navigation }: AuthStackScreenProps<'VerifyCode'>) {
  const { email, mode } = route.params;
  const isSignUp = mode === 'sign-up';

  const { isReady: signInReady, verifyEmailCode: verifySignIn } = useSignInFlow();
  const { isReady: signUpReady, verifyEmailCode: verifySignUp } = useSignUpFlow();
  const isReady = isSignUp ? signUpReady : signInReady;

  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [codeError, setCodeError] = useState<string | undefined>();
  const [genericError, setGenericError] = useState<string | undefined>();

  const verify = useCallback(async () => {
    const trimmed = code.trim();
    if (!trimmed) {
      setCodeError('Verification code is required');
      return;
    }
    if (!isReady || submitting) return;

    setCodeError(undefined);
    setGenericError(undefined);
    setSubmitting(true);

    try {
      // On 'complete', ClerkPowerSyncBridge picks up the new session.
      await (isSignUp ? verifySignUp(trimmed) : verifySignIn(trimmed));
    } catch (err) {
      setGenericError(err instanceof Error ? err.message : 'Could not verify the code. Try again.');
    } finally {
      setSubmitting(false);
    }
  }, [code, isReady, isSignUp, submitting, verifySignIn, verifySignUp]);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box className={scrollContentStyle({})}>
          <Box className={headerStyle({})}>
            <Text className={titleStyle({})}>Check your email</Text>
            <Text className={subtitleStyle({})}>
              We sent a 6-digit code to {email}. Enter it below to{' '}
              {isSignUp ? 'finish signing up' : 'sign in'}.
            </Text>
          </Box>

          {genericError && (
            <Box className={errorBannerStyle({})}>
              <Text className={errorBannerTextStyle({})}>{genericError}</Text>
            </Box>
          )}

          <VStack className={formStyle({})}>
            <FormControl isInvalid={!!codeError}>
              <FormControlLabel>
                <FormControlLabelText>Verification code</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!codeError}>
                <InputField
                  value={code}
                  onChangeText={setCode}
                  placeholder="123456"
                  keyboardType="number-pad"
                  autoComplete="one-time-code"
                  maxLength={6}
                />
              </Input>
              {codeError && (
                <FormControlError>
                  <FormControlErrorText>{codeError}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button
              onPress={() => {
                void verify();
              }}
              isDisabled={submitting}
            >
              {submitting && <ButtonSpinner />}
              <ButtonText>{submitting ? 'Verifying…' : 'Verify and continue'}</ButtonText>
            </Button>
          </VStack>

          <Box className={footerStyle({})}>
            <Text className={footerTextStyle({})}>Wrong email?</Text>
            <Text className={linkTextStyle({})} onPress={() => navigation.goBack()}>
              Go back
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
