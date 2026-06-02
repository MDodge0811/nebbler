import { Modal } from 'react-native';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

interface Props {
  visible: boolean;
  calendarName: string;
  onCancel: () => void;
  onConfirm: () => void;
}

export function DeleteCalendarConfirmModal({ visible, calendarName, onCancel, onConfirm }: Props) {
  if (!visible) return null;
  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <Box className="flex-1 items-center justify-center bg-brand-scrim/40 p-6">
        <Box className="w-full max-w-[320px] rounded-[20px] bg-background-0 p-6">
          <Text className="mb-2 text-center text-lg font-bold text-brand-text">
            Delete {calendarName}?
          </Text>
          <Text className="mb-5 text-center text-sm leading-[21px] text-brand-text-secondary">
            This will remove all events and members. This can't be undone.
          </Text>
          <Box className="flex-row gap-2.5">
            <Pressable
              className="flex-1 items-center rounded-xl border border-brand-border bg-typography-50 px-4 py-3"
              onPress={onCancel}
            >
              <Text className="text-[15px] font-semibold text-brand-text">Cancel</Text>
            </Pressable>
            <Pressable
              className="flex-1 items-center rounded-xl bg-brand-danger px-4 py-3"
              onPress={onConfirm}
            >
              <Text className="text-[15px] font-bold text-typography-white">Delete</Text>
            </Pressable>
          </Box>
        </Box>
      </Box>
    </Modal>
  );
}
