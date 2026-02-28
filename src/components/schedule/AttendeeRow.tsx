import { memo } from 'react';
import { View, StyleSheet } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

const overflowStyle = tva({ base: 'font-semibold text-typography-400' });

export interface Attendee {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  displayName: string;
}

interface AttendeeRowProps {
  attendees: Attendee[];
  maxVisible?: number;
  size?: number;
}

export const AttendeeRow = memo(function AttendeeRow({
  attendees,
  maxVisible = 4,
  size = 24,
}: AttendeeRowProps) {
  if (attendees.length === 0) return null;

  const visible = attendees.slice(0, maxVisible);
  const overflow = attendees.length - maxVisible;
  const overlap = Math.round(size * 0.33);
  const fontSize = Math.round(size * 0.4);
  const borderWidth = 2;

  return (
    <View style={styles.row} accessibilityLabel={`${attendees.length} attendees`}>
      {visible.map((attendee, index) => {
        const backgroundColor = getAvatarColor(attendee.id);
        const initials = getInitials(attendee.firstName, attendee.lastName, attendee.displayName);
        return (
          <View
            key={attendee.id}
            style={[
              styles.avatar,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                backgroundColor,
                borderWidth,
                marginLeft: index === 0 ? 0 : -overlap,
                zIndex: visible.length - index,
              },
            ]}
          >
            <Text style={[styles.initials, { fontSize: fontSize - borderWidth }]}>{initials}</Text>
          </View>
        );
      })}
      {overflow > 0 && (
        <Text className={overflowStyle({})} style={{ fontSize, marginLeft: 4 }}>
          +{overflow}
        </Text>
      )}
    </View>
  );
});

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    alignItems: 'center',
    justifyContent: 'center',
    borderColor: '#FFFFFF',
  },
  initials: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
});
