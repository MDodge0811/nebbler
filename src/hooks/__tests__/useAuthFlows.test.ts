import { renderHook } from '@testing-library/react-native';

import { useOAuthSignIn, useSignInFlow, useSignUpFlow } from '@hooks/useAuthFlows';

// The adapter is the only place that knows Clerk; tests mock Clerk's flow hooks
// (not the adapter) so we verify the translation + error normalization.
const mockUseSignIn = jest.fn();
const mockUseSignUp = jest.fn();
const mockUseSSO = jest.fn();

jest.mock('@clerk/clerk-expo', () => ({
  useSignIn: (): unknown => mockUseSignIn(),
  useSignUp: (): unknown => mockUseSignUp(),
  useSSO: (): unknown => mockUseSSO(),
}));

jest.mock('expo-web-browser', () => ({ maybeCompleteAuthSession: jest.fn() }));

beforeEach(() => {
  jest.clearAllMocks();
});

describe('useSignInFlow', () => {
  it('signInWithPassword activates the session and reports completion', async () => {
    const create = jest.fn().mockResolvedValue({ status: 'complete', createdSessionId: 'sess-1' });
    const setActive = jest.fn();
    mockUseSignIn.mockReturnValue({ isLoaded: true, signIn: { create }, setActive });

    const { result } = renderHook(() => useSignInFlow());
    const outcome = await result.current.signInWithPassword('a@b.com', 'pw');

    expect(create).toHaveBeenCalledWith({ identifier: 'a@b.com', password: 'pw' });
    expect(setActive).toHaveBeenCalledWith({ session: 'sess-1' });
    expect(outcome).toBe('complete');
  });

  it('signInWithPassword reports needs_more_steps without activating', async () => {
    const create = jest.fn().mockResolvedValue({ status: 'needs_first_factor' });
    const setActive = jest.fn();
    mockUseSignIn.mockReturnValue({ isLoaded: true, signIn: { create }, setActive });

    const { result } = renderHook(() => useSignInFlow());
    const outcome = await result.current.signInWithPassword('a@b.com', 'pw');

    expect(outcome).toBe('needs_more_steps');
    expect(setActive).not.toHaveBeenCalled();
  });

  it('normalizes provider errors into a user-facing message', async () => {
    const create = jest.fn().mockRejectedValue({ errors: [{ longMessage: 'Wrong password.' }] });
    mockUseSignIn.mockReturnValue({ isLoaded: true, signIn: { create }, setActive: jest.fn() });

    const { result } = renderHook(() => useSignInFlow());
    await expect(result.current.signInWithPassword('a@b.com', 'pw')).rejects.toThrow(
      'Wrong password.'
    );
  });

  it('sendEmailCode requests an email_code strategy', async () => {
    const create = jest.fn().mockResolvedValue({});
    mockUseSignIn.mockReturnValue({ isLoaded: true, signIn: { create }, setActive: jest.fn() });

    const { result } = renderHook(() => useSignInFlow());
    await result.current.sendEmailCode('a@b.com');

    expect(create).toHaveBeenCalledWith({ strategy: 'email_code', identifier: 'a@b.com' });
  });

  it('verifyEmailCode confirms the first factor and activates the session', async () => {
    const attemptFirstFactor = jest
      .fn()
      .mockResolvedValue({ status: 'complete', createdSessionId: 'sess-2' });
    const setActive = jest.fn();
    mockUseSignIn.mockReturnValue({ isLoaded: true, signIn: { attemptFirstFactor }, setActive });

    const { result } = renderHook(() => useSignInFlow());
    await result.current.verifyEmailCode('123456');

    expect(attemptFirstFactor).toHaveBeenCalledWith({ strategy: 'email_code', code: '123456' });
    expect(setActive).toHaveBeenCalledWith({ session: 'sess-2' });
  });

  it('throws when the provider is not ready', async () => {
    mockUseSignIn.mockReturnValue({ isLoaded: false, signIn: undefined, setActive: undefined });

    const { result } = renderHook(() => useSignInFlow());
    expect(result.current.isReady).toBe(false);
    await expect(result.current.signInWithPassword('a@b.com', 'pw')).rejects.toThrow();
  });
});

describe('useSignUpFlow', () => {
  it('register creates the account and prepares email verification', async () => {
    const create = jest.fn().mockResolvedValue({});
    const prepareEmailAddressVerification = jest.fn().mockResolvedValue({});
    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: { create, prepareEmailAddressVerification },
      setActive: jest.fn(),
    });

    const { result } = renderHook(() => useSignUpFlow());
    await result.current.register({
      email: 'a@b.com',
      password: 'pw123456',
      firstName: 'Ann',
      lastName: 'Lee',
    });

    expect(create).toHaveBeenCalledWith({
      emailAddress: 'a@b.com',
      password: 'pw123456',
      firstName: 'Ann',
      lastName: 'Lee',
    });
    expect(prepareEmailAddressVerification).toHaveBeenCalledWith({ strategy: 'email_code' });
  });

  it('verifyEmailCode confirms the email address and activates the session', async () => {
    const attemptEmailAddressVerification = jest
      .fn()
      .mockResolvedValue({ status: 'complete', createdSessionId: 'sess-3' });
    const setActive = jest.fn();
    mockUseSignUp.mockReturnValue({
      isLoaded: true,
      signUp: { attemptEmailAddressVerification },
      setActive,
    });

    const { result } = renderHook(() => useSignUpFlow());
    await result.current.verifyEmailCode('654321');

    expect(attemptEmailAddressVerification).toHaveBeenCalledWith({ code: '654321' });
    expect(setActive).toHaveBeenCalledWith({ session: 'sess-3' });
  });
});

describe('useOAuthSignIn', () => {
  it('runs the SSO flow and activates the created session', async () => {
    const ssoSetActive = jest.fn();
    const startSSOFlow = jest
      .fn()
      .mockResolvedValue({ createdSessionId: 'sess-4', setActive: ssoSetActive });
    mockUseSSO.mockReturnValue({ startSSOFlow });

    const { result } = renderHook(() => useOAuthSignIn());
    await result.current.signInWith('oauth_google');

    expect(startSSOFlow).toHaveBeenCalledWith({ strategy: 'oauth_google' });
    expect(ssoSetActive).toHaveBeenCalledWith({ session: 'sess-4' });
  });

  it('does not activate when the SSO flow returns no session', async () => {
    const startSSOFlow = jest.fn().mockResolvedValue({ createdSessionId: null, setActive: null });
    mockUseSSO.mockReturnValue({ startSSOFlow });

    const { result } = renderHook(() => useOAuthSignIn());
    await expect(result.current.signInWith('oauth_apple')).resolves.toBeUndefined();
  });
});
