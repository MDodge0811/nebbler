import { useRef } from 'react';
import { StyleSheet, View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';

const hintStyle = tva({ base: 'text-xs italic text-typography-400 text-center' });

interface DropZoneProps {
  groupId: string;
  isActive: boolean;
  onLayout?: (groupId: string, layout: { y: number; height: number }) => void;
}

export function DropZone({ groupId, isActive, onLayout }: DropZoneProps) {
  const viewRef = useRef<View>(null);

  return (
    <View
      ref={viewRef}
      style={[styles.container, isActive && styles.activeContainer]}
      onLayout={() => {
        if (onLayout) {
          viewRef.current?.measureInWindow((_x, y, _w, h) => {
            onLayout(groupId, { y, height: h });
          });
        }
      }}
    >
      <Text className={hintStyle({})}>{isActive ? 'Drop here' : 'Drag calendars here'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 8,
    marginTop: 4,
    marginBottom: 6,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: calendarsUIColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    borderColor: calendarsUIColors.primaryBorder,
    backgroundColor: calendarsUIColors.primaryLight,
  },
});
