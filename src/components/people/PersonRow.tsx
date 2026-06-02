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
  onPress?: () => void;
}

export function PersonRow({ user, trailing, onPress }: PersonRowProps) {
  const name = displayName({
    id: user.id,
    first_name: user.first_name,
    last_name: user.last_name,
    email: user.email ?? null,
  });

  const content = (
    <Box testID="person-row" className="flex-row items-center gap-3 px-4 py-2.5">
      <AvatarCircle user={user} size={40} />
      <Text
        numberOfLines={1}
        ellipsizeMode="tail"
        className="flex-1 text-[15px] font-medium text-brand-text"
      >
        {name}
      </Text>
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
