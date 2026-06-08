import { tva } from '@gluestack-ui/utils/nativewind-utils';
import React from 'react';
import { Modal } from 'react-native';
import Svg, { Path, Rect } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';

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
        stroke={calendarsUIColors.textSecondary}
        strokeWidth={1.5}
      />
      <Path d="M2 7H16" stroke={calendarsUIColors.textSecondary} strokeWidth={1.5} />
      <Path
        d="M6 2V5"
        stroke={calendarsUIColors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M12 2V5"
        stroke={calendarsUIColors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <Path
        d="M9 10V14M7 12H11"
        stroke={calendarsUIColors.textSecondary}
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
        stroke={calendarsUIColors.textSecondary}
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
      <Path
        d="M9 9V13M7 11H11"
        stroke={calendarsUIColors.textSecondary}
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
        stroke={calendarsUIColors.textSecondary}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 12.5V14C3 14.6 3.4 15 4 15H14C14.6 15 15 14.6 15 14V12.5"
        stroke={calendarsUIColors.textSecondary}
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
      <HStack className="items-center gap-2.5 px-3.5 py-3">
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
      <Pressable className="flex-1" onPress={onClose}>
        <Box className="absolute right-4 top-[60px] min-w-[180px] rounded-xl border border-brand-border bg-background-0 py-1 shadow-lg">
          <MenuItem icon={<CalendarPlusIcon />} label="New Calendar" onPress={onNewCalendar} />
          <Box className="mx-2.5 h-px bg-brand-border" />
          <MenuItem icon={<FolderPlusIcon />} label="New Group" onPress={onNewGroup} />
          <Box className="mx-2.5 h-px bg-brand-border" />
          <MenuItem icon={<ImportIcon />} label="Import Calendar" onPress={onImportCalendar} />
        </Box>
      </Pressable>
    </Modal>
  );
}
