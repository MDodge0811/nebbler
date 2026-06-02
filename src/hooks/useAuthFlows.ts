import { useSignIn, useSignUp, useSSO } from '@clerk/clerk-expo';
import * as WebBrowser from 'expo-web-browser';
import { useCallback } from 'react';

import type { OAuthStrategy } from '@/types/auth';

/**
 * Auth-flow adapter — the **only** place outside `useAuth.ts` / `App.tsx`
 * that imports the identity provider's flow hooks.
 *
 * The auth screens (`LoginScreen`, `SignUpScreen`, `VerifyCodeScreen`) drive
 * sign-in / sign-up / OAuth through the app-shaped hooks exported here, so they
 * never touch Clerk's API or error shapes directly. Swapping the identity
 * provider means rewriting this file (plus `useAuth.ts`) — not the screens.
 *
 * See `.claude/rules/auth.md` and the vendor-containment rules in
 * `eslint.config.js`.
 */

// Required so OAuth redirects complete on iOS. Safe to call at module load.
WebBrowser.maybeCompleteAuthSession();

const DEFAULT_ERROR = 'Something went wrong. Try again.';
const REGISTER_ERROR = 'Could not create your account. Try again.';
const VERIFY_ERROR = 'Could not verify the code. Try again.';

/**
 * Error thrown by the auth-flow adapter. `.message` is always a
 * user-presentable string, so callers can surface it directly.
 */
class AuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthError';
  }
}

/** Normalizes an unknown provider error into a friendly, user-facing string. */
function toAuthError(err: unknown, fallback = DEFAULT_ERROR): AuthError {
  if (err instanceof AuthError) return err;
  const maybe = err as {
    errors?: { message?: string; longMessage?: string }[];
    message?: string;
  };
  const message =
    maybe.errors?.[0]?.longMessage ?? maybe.errors?.[0]?.message ?? maybe.message ?? fallback;
  return new AuthError(message);
}

/** Outcome of a password sign-in attempt. */
export type PasswordSignInResult = 'complete' | 'needs_more_steps';

/** Email + password / email-OTP sign-in flow. */
export function useSignInFlow() {
  const { signIn, setActive, isLoaded } = useSignIn();

  const signInWithPassword = useCallback(
    async (email: string, password: string): Promise<PasswordSignInResult> => {
      if (!isLoaded) throw new AuthError(DEFAULT_ERROR);
      try {
        const result = await signIn.create({ identifier: email, password });
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
          return 'complete';
        }
        return 'needs_more_steps';
      } catch (err) {
        throw toAuthError(err);
      }
    },
    [isLoaded, signIn, setActive]
  );

  const sendEmailCode = useCallback(
    async (email: string): Promise<void> => {
      if (!isLoaded) throw new AuthError(DEFAULT_ERROR);
      try {
        await signIn.create({ strategy: 'email_code', identifier: email });
      } catch (err) {
        throw toAuthError(err);
      }
    },
    [isLoaded, signIn]
  );

  const verifyEmailCode = useCallback(
    async (code: string): Promise<void> => {
      if (!isLoaded) throw new AuthError(VERIFY_ERROR);
      try {
        const result = await signIn.attemptFirstFactor({ strategy: 'email_code', code });
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
        }
      } catch (err) {
        throw toAuthError(err, VERIFY_ERROR);
      }
    },
    [isLoaded, signIn, setActive]
  );

  return { isReady: isLoaded, signInWithPassword, sendEmailCode, verifyEmailCode };
}

/** Parameters for creating a new account. */
export interface RegisterParams {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}

/** Email + password sign-up flow with email-code verification. */
export function useSignUpFlow() {
  const { signUp, setActive, isLoaded } = useSignUp();

  const register = useCallback(
    async ({ email, password, firstName, lastName }: RegisterParams): Promise<void> => {
      if (!isLoaded) throw new AuthError(REGISTER_ERROR);
      try {
        const attempt = await signUp.create({ emailAddress: email, password, firstName, lastName });
        await attempt.prepareEmailAddressVerification({ strategy: 'email_code' });
      } catch (err) {
        throw toAuthError(err, REGISTER_ERROR);
      }
    },
    [isLoaded, signUp]
  );

  const verifyEmailCode = useCallback(
    async (code: string): Promise<void> => {
      if (!isLoaded) throw new AuthError(VERIFY_ERROR);
      try {
        const result = await signUp.attemptEmailAddressVerification({ code });
        if (result.status === 'complete') {
          await setActive({ session: result.createdSessionId });
        }
      } catch (err) {
        throw toAuthError(err, VERIFY_ERROR);
      }
    },
    [isLoaded, signUp, setActive]
  );

  return { isReady: isLoaded, register, verifyEmailCode };
}

/** OAuth / SSO sign-in flow (Google / Apple / Facebook). */
export function useOAuthSignIn() {
  const { startSSOFlow } = useSSO();

  const signInWith = useCallback(
    async (strategy: OAuthStrategy): Promise<void> => {
      try {
        const { createdSessionId, setActive } = await startSSOFlow({ strategy });
        if (createdSessionId && setActive) {
          await setActive({ session: createdSessionId });
        }
      } catch (err) {
        throw toAuthError(err);
      }
    },
    [startSSOFlow]
  );

  return { signInWith };
}
