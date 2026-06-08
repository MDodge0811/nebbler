import { type ReactNode } from 'react';
import { Alert } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';

import { EditableGroupName } from './EditableGroupName';

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
  onDelete?: (() => void) | undefined;
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
      <Box className="mx-3 mb-2.5 rounded-2xl border-[1.5px] border-brand-primary-border bg-brand-primary-light">
        <HStack className="items-center gap-2 px-3 pb-2.5 pt-3">
          <EditableGroupName
            value={name}
            onChangeText={onNameChange}
            onSubmit={onNameBlur}
            autoFocus={autoFocusName}
          />
          <Box className="shrink-0 rounded-[5px] border border-brand-primary-border bg-background-0 px-[7px] py-0.5">
            <Text className="text-[9px] font-bold tracking-[0.6px] text-brand-primary">
              AVAILABILITY
            </Text>
          </Box>
        </HStack>
        <Box className="pb-1.5">{children}</Box>
      </Box>
    );
  }

  return (
    <Box className="mx-3 mb-1.5 rounded-[14px] border border-brand-border bg-background-0">
      <HStack className="items-center gap-2 px-3 pb-2.5 pt-3">
        <EditableGroupName
          value={name}
          onChangeText={onNameChange}
          onSubmit={onNameBlur}
          autoFocus={autoFocusName}
        />
        <Pressable
          onPress={handleDelete}
          className="h-[34px] w-[34px] shrink-0 items-center justify-center rounded-lg bg-brand-danger-light"
        >
          <TrashIcon />
        </Pressable>
      </HStack>
      <Box className="pb-1.5">{children}</Box>
    </Box>
  );
}
