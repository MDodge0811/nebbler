import type { ReactNode } from 'react';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { AvatarCircle } from '@components/ui/AvatarCircle';
import { displayName } from '@utils/displayName';

type PersonRowUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  avatar_color: string | null;
};

interface PersonRowProps {
  user: PersonRowUser;
  trailing: ReactNode;
  /** Optional second line under the name (e.g. `@username · 2 shared`). A string is
   * rendered in the muted secondary style; pass a node for custom content. */
  subtitle?: ReactNode;
  onPress?: () => void;
}

export function PersonRow({ user, trailing, subtitle, onPress }: PersonRowProps) {
  const name = displayName({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email ?? null,
  });

  const content = (
    <Box testID="person-row" className="flex-row items-center gap-3 px-4 py-2.5">
      <AvatarCircle user={user} size={40} />
      <Box className="flex-1">
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          className="text-[15px] font-medium text-brand-text"
        >
          {name}
        </Text>
        {subtitle != null ? (
          <Box className="mt-px">
            {typeof subtitle === 'string' ? (
              <Text numberOfLines={1} className="text-[13px] text-brand-text-muted">
                {subtitle}
              </Text>
            ) : (
              subtitle
            )}
          </Box>
        ) : null}
      </Box>
      <Box className="shrink-0">{trailing}</Box>
    </Box>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} accessibilityRole="button">
        {content}
      </Pressable>
    );
  }
  return content;
}
