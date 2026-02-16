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
  FormControlHelper,
  FormControlHelperText,
} from '@/components/ui/form-control';
import { useRegister } from '@hooks/useAuthMutations';
import { RegisterSchema } from '@database/schemas';
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
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export function RegisterScreen({ navigation }: AuthStackScreenProps<'Register'>) {
  const registerMutation = useRegister();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [formErrors, setFormErrors] = useState<FormErrors>({});

  const validateAndRegister = async () => {
    try {
      RegisterSchema.parse({ firstName, lastName, email, password, confirmPassword });
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

    registerMutation.mutate({ firstName, lastName, email, password });
  };

  const handleNavigateToLogin = () => {
    registerMutation.reset();
    navigation.navigate('Login');
  };

  const mutationError =
    registerMutation.error instanceof Error ? registerMutation.error.message : null;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <Box className={scrollContentStyle({})}>
          <Box className={headerStyle({})}>
            <Text className={titleStyle({})}>Create Account</Text>
            <Text className={subtitleStyle({})}>Sign up to get started with Nebbler</Text>
          </Box>

          {mutationError && (
            <Box className={errorBannerStyle({})}>
              <Text className={errorBannerTextStyle({})}>{mutationError}</Text>
            </Box>
          )}

          <VStack className={formStyle({})}>
            <FormControl isInvalid={!!formErrors.firstName} isRequired>
              <FormControlLabel>
                <FormControlLabelText>First Name</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.firstName}>
                <InputField
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="First name"
                  autoCapitalize="words"
                  autoComplete="given-name"
                />
              </Input>
              {formErrors.firstName && (
                <FormControlError>
                  <FormControlErrorText>{formErrors.firstName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.lastName} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Last Name</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.lastName}>
                <InputField
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Last name"
                  autoCapitalize="words"
                  autoComplete="family-name"
                />
              </Input>
              {formErrors.lastName && (
                <FormControlError>
                  <FormControlErrorText>{formErrors.lastName}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.email} isRequired>
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

            <FormControl isInvalid={!!formErrors.password} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Password</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.password}>
                <InputField
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </Input>
              {formErrors.password ? (
                <FormControlError>
                  <FormControlErrorText>{formErrors.password}</FormControlErrorText>
                </FormControlError>
              ) : (
                <FormControlHelper>
                  <FormControlHelperText>
                    At least 8 characters with uppercase, lowercase, and a number
                  </FormControlHelperText>
                </FormControlHelper>
              )}
            </FormControl>

            <FormControl isInvalid={!!formErrors.confirmPassword} isRequired>
              <FormControlLabel>
                <FormControlLabelText>Confirm Password</FormControlLabelText>
              </FormControlLabel>
              <Input isInvalid={!!formErrors.confirmPassword}>
                <InputField
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  secureTextEntry
                  autoComplete="new-password"
                />
              </Input>
              {formErrors.confirmPassword && (
                <FormControlError>
                  <FormControlErrorText>{formErrors.confirmPassword}</FormControlErrorText>
                </FormControlError>
              )}
            </FormControl>

            <Button onPress={validateAndRegister} isDisabled={registerMutation.isPending}>
              {registerMutation.isPending && <ButtonSpinner />}
              <ButtonText>
                {registerMutation.isPending ? 'Creating Account...' : 'Create Account'}
              </ButtonText>
            </Button>
          </VStack>

          <Box className={footerStyle({})}>
            <Text className={footerTextStyle({})}>Already have an account?</Text>
            <Text className={linkTextStyle({})} onPress={handleNavigateToLogin}>
              Sign In
            </Text>
          </Box>
        </Box>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
