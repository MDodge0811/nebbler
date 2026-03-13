import React from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { HStack } from '@/components/ui/hstack';

const COLORS = {
  text: '#1A1A1F',
  textSecondary: '#6B6B78',
  surface: '#FFFFFF',
  border: '#E8E8EC',
  surfaceHover: '#F5F5F5',
};

const menuItemStyle = tva({ base: 'text-[14px] font-medium text-typography-900' });

function CalendarPlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect
        x={2}
        y={4}
        width={14}
        height={12}
        rx={2}
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
      />
      <Path d="M2 7H16" stroke={COLORS.textSecondary} strokeWidth={1.5} />
      <Path d="M6 2V5" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
      <Path d="M12 2V5" stroke={COLORS.textSecondary} strokeWidth={1.5} strokeLinecap="round" />
      <Path
        d="M9 10V14M7 12H11"
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function FolderPlusIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M2 5C2 4.4 2.4 4 3 4H7L9 6H15C15.6 6 16 6.4 16 7V14C16 14.6 15.6 15 15 15H3C2.4 15 2 14.6 2 14V5Z"
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 9V13M7 11H11"
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function ImportIcon() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 3V11M9 11L5.5 7.5M9 11L12.5 7.5"
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12.5V14C3 14.6 3.4 15 4 15H14C14.6 15 15 14.6 15 14V12.5"
        stroke={COLORS.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

interface PlusMenuPopoverProps {
  visible: boolean;
  onClose: () => void;
  onNewCalendar: () => void;
  onNewGroup: () => void;
  onImportCalendar: () => void;
}

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
}

function MenuItem({ icon, label, onPress }: MenuItemProps) {
  return (
    <Pressable onPress={onPress}>
      <HStack style={styles.menuItem}>
        {icon}
        <Text className={menuItemStyle({})}>{label}</Text>
      </HStack>
    </Pressable>
  );
}

export function PlusMenuPopover({
  visible,
  onClose,
  onNewCalendar,
  onNewGroup,
  onImportCalendar,
}: PlusMenuPopoverProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <View style={styles.menu}>
          <MenuItem icon={<CalendarPlusIcon />} label="New Calendar" onPress={onNewCalendar} />
          <View style={styles.separator} />
          <MenuItem icon={<FolderPlusIcon />} label="New Group" onPress={onNewGroup} />
          <View style={styles.separator} />
          <MenuItem icon={<ImportIcon />} label="Import Calendar" onPress={onImportCalendar} />
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
  },
  menu: {
    position: 'absolute',
    top: 60,
    right: 16,
    backgroundColor: COLORS.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 4,
    minWidth: 180,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 12,
    elevation: 8,
  },
  menuItem: {
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  separator: {
    height: 1,
    backgroundColor: COLORS.border,
    marginHorizontal: 10,
  },
});
