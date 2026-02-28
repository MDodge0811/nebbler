import { memo, useCallback, useMemo, forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { BottomSheetModal, BottomSheetView } from '@gorhom/bottom-sheet';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { VStack } from '@/components/ui/vstack';
import { HStack } from '@/components/ui/hstack';
import { Box } from '@/components/ui/box';
import Svg, { Path } from 'react-native-svg';
import type { FeedEvent } from '@hooks/useScheduleFeed';

const actionStyle = tva({ base: 'items-center px-4 py-3' });
const labelStyle = tva({ base: 'ml-3 text-base text-typography-800' });
const separatorStyle = tva({ base: 'mx-4 border-b border-outline-200' });

interface EventMeatballSheetProps {
  event: FeedEvent | null;
  onEdit?: (event: FeedEvent) => void;
  onDelete?: (event: FeedEvent) => void;
  onShare?: (event: FeedEvent) => void;
}

function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.85 2.85a1.5 1.5 0 0 1 2.12 0l.18.18a1.5 1.5 0 0 1 0 2.12L7.5 14.8l-3.3.83.83-3.3 9.82-9.48z"
        stroke="#374151"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function DeleteIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M3 5h14M8 5V3h4v2M6 5v11a2 2 0 0 0 2 2h4a2 2 0 0 0 2-2V5"
        stroke="#EF4444"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ShareIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M15 7a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM5 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM15 19a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM7.59 11.51l4.83 2.98M12.41 5.51l-4.83 2.98"
        stroke="#374151"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export const EventMeatballSheet = memo(
  forwardRef<BottomSheetModal, EventMeatballSheetProps>(function EventMeatballSheet(
    { event, onEdit, onDelete, onShare },
    ref
  ) {
    const snapPoints = useMemo(() => ['25%'], []);

    const handleEdit = useCallback(() => {
      if (event) onEdit?.(event);
    }, [event, onEdit]);

    const handleDelete = useCallback(() => {
      if (event) onDelete?.(event);
    }, [event, onDelete]);

    const handleShare = useCallback(() => {
      if (event) onShare?.(event);
    }, [event, onShare]);

    return (
      <BottomSheetModal ref={ref} snapPoints={snapPoints} enableDynamicSizing={false}>
        <BottomSheetView style={styles.container}>
          <VStack>
            <Pressable onPress={handleEdit} accessibilityRole="button" accessibilityLabel="Edit">
              <HStack className={actionStyle({})}>
                <EditIcon />
                <Text className={labelStyle({})}>Edit</Text>
              </HStack>
            </Pressable>
            <Box className={separatorStyle({})} />
            <Pressable
              onPress={handleDelete}
              accessibilityRole="button"
              accessibilityLabel="Delete"
            >
              <HStack className={actionStyle({})}>
                <DeleteIcon />
                <Text className={labelStyle({})} style={styles.deleteText}>
                  Delete
                </Text>
              </HStack>
            </Pressable>
            <Box className={separatorStyle({})} />
            <Pressable onPress={handleShare} accessibilityRole="button" accessibilityLabel="Share">
              <HStack className={actionStyle({})}>
                <ShareIcon />
                <Text className={labelStyle({})}>Share</Text>
              </HStack>
            </Pressable>
          </VStack>
        </BottomSheetView>
      </BottomSheetModal>
    );
  })
);

const styles = StyleSheet.create({
  container: {
    paddingBottom: 16,
  },
  deleteText: {
    color: '#EF4444',
  },
});
