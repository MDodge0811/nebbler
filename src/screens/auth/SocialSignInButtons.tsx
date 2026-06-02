import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Button, ButtonText, ButtonSpinner } from '@/components/ui/button';
import { VStack } from '@/components/ui/vstack';
import type { OAuthStrategy } from '@/types/auth';

const socialStyle = tva({ base: 'gap-3' });

interface SocialSignInButtonsProps {
  oauthInFlight: OAuthStrategy | null;
  onPress: (strategy: OAuthStrategy) => void;
}

const PROVIDERS: { strategy: OAuthStrategy; label: string }[] = [
  { strategy: 'oauth_google', label: 'Continue with Google' },
  { strategy: 'oauth_apple', label: 'Continue with Apple' },
  { strategy: 'oauth_facebook', label: 'Continue with Facebook' },
];

/** The OAuth provider button column on LoginScreen. */
export function SocialSignInButtons({ oauthInFlight, onPress }: SocialSignInButtonsProps) {
  return (
    <VStack className={socialStyle({})}>
      {PROVIDERS.map(({ strategy, label }) => (
        <Button
          key={strategy}
          variant="outline"
          onPress={() => onPress(strategy)}
          isDisabled={!!oauthInFlight}
        >
          {oauthInFlight === strategy && <ButtonSpinner />}
          <ButtonText>{label}</ButtonText>
        </Button>
      ))}
    </VStack>
  );
}
