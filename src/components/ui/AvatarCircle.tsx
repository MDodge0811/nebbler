import { View, Text, StyleSheet, type ViewStyle } from 'react-native';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

type AvatarCircleSize = 32 | 40 | 56 | 80;

type AvatarUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  avatar_color: string | null;
};

interface AvatarCircleProps {
  user: AvatarUser;
  size: AvatarCircleSize;
}

export function AvatarCircle({ user, size }: AvatarCircleProps) {
  const baseColor = user.avatar_color ?? getAvatarColor(user.id);
  const initials = getInitials(user.first_name, user.last_name, user.email ?? undefined);
  const fontSize = Math.round(size * 0.4);

  const circleStyle: ViewStyle = StyleSheet.flatten([
    styles.circle,
    {
      width: size,
      height: size,
      borderRadius: size / 2,
      backgroundColor: `${baseColor}15`,
      borderColor: `${baseColor}30`,
    },
  ]);

  return (
    <View testID="avatar-circle" style={circleStyle}>
      <Text style={[styles.initial, { color: baseColor, fontSize }]}>{initials}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
  },
  initial: {
    fontWeight: '700',
  },
});
