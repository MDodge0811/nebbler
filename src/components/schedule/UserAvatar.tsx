import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

const containerStyle = tva({ base: 'items-center justify-center overflow-hidden' });
const initialsStyle = tva({ base: 'font-bold text-white' });

interface UserAvatarProps {
  userId: string;
  firstName?: string | null;
  lastName?: string | null;
  fallbackName: string;
  size?: number;
  onPress?: () => void;
}

export function UserAvatar({
  userId,
  firstName,
  lastName,
  fallbackName,
  size = 32,
  onPress,
}: UserAvatarProps) {
  const backgroundColor = getAvatarColor(userId);
  const initials = getInitials(firstName, lastName, fallbackName);
  const fontSize = Math.round(size * 0.4);
  const borderRadius = size / 2;

  return (
    <Pressable onPress={onPress} accessibilityRole="button" accessibilityLabel="User profile">
      <Box
        className={containerStyle({})}
        style={{ width: size, height: size, borderRadius, backgroundColor }}
      >
        <Text className={initialsStyle({})} style={{ fontSize }}>
          {initials}
        </Text>
      </Box>
    </Pressable>
  );
}
