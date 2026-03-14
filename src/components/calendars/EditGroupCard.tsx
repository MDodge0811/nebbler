import { type ReactNode } from 'react';
import { Alert, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { EditableGroupName } from './EditableGroupName';
import { calendarsUIColors } from '@constants/calendarsUI';

function TrashIcon() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M2 4H14M5 4V3C5 2.4 5.4 2 6 2H10C10.6 2 11 2.4 11 3V4M6 7V12M10 7V12M4 4L4.7 13.1C4.8 13.6 5.2 14 5.7 14H10.3C10.8 14 11.2 13.6 11.3 13.1L12 4"
        stroke={calendarsUIColors.danger}
        strokeWidth={1.3}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface EditGroupCardProps {
  name: string;
  isPrimary: boolean;
  onNameChange: (name: string) => void;
  onNameBlur: () => void;
  onDelete?: () => void;
  autoFocusName?: boolean;
  children: ReactNode;
}

export function EditGroupCard({
  name,
  isPrimary,
  onNameChange,
  onNameBlur,
  onDelete,
  autoFocusName,
  children,
}: EditGroupCardProps) {
  const handleDelete = () => {
    Alert.alert(
      'Delete Group',
      `Delete "${name}"? Calendars in this group will become ungrouped.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: onDelete },
      ]
    );
  };

  if (isPrimary) {
    return (
      <View style={styles.primaryCard}>
        <HStack style={styles.header}>
          <EditableGroupName
            value={name}
            onChangeText={onNameChange}
            onSubmit={onNameBlur}
            autoFocus={autoFocusName}
          />
          <View style={styles.availabilityBadge}>
            <Text style={styles.availabilityText}>AVAILABILITY</Text>
          </View>
        </HStack>
        <View style={styles.body}>{children}</View>
      </View>
    );
  }

  return (
    <View style={styles.standardCard}>
      <HStack style={styles.header}>
        <EditableGroupName
          value={name}
          onChangeText={onNameChange}
          onSubmit={onNameBlur}
          autoFocus={autoFocusName}
        />
        <Pressable onPress={handleDelete} style={styles.deleteButton}>
          <TrashIcon />
        </Pressable>
      </HStack>
      <View style={styles.body}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: calendarsUIColors.primaryLight,
    borderWidth: 1.5,
    borderColor: calendarsUIColors.primaryBorder,
  },
  standardCard: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  header: {
    alignItems: 'center',
    gap: 8,
    paddingTop: 12,
    paddingBottom: 10,
    paddingHorizontal: 12,
  },
  availabilityBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: calendarsUIColors.primaryBorder,
    flexShrink: 0,
  },
  availabilityText: {
    fontSize: 9,
    fontWeight: '700',
    color: calendarsUIColors.primary,
    letterSpacing: 0.6,
  },
  deleteButton: {
    width: 34,
    height: 34,
    borderRadius: 8,
    backgroundColor: calendarsUIColors.dangerLight,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  body: {
    paddingBottom: 6,
  },
});
