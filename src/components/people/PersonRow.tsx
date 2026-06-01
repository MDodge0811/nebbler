import type { ReactNode } from 'react';
import { View, Pressable, Text, StyleSheet } from 'react-native';
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
    <View testID="person-row" style={styles.row}>
      <AvatarCircle user={user} size={40} />
      <Text numberOfLines={1} ellipsizeMode="tail" style={styles.name}>
        {name}
      </Text>
      <View style={styles.trailing}>{trailing}</View>
    </View>
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

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 12,
  },
  name: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: '#1A1A1F',
  },
  trailing: {
    flexShrink: 0,
  },
});
