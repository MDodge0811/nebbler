import { StyleSheet, View } from 'react-native';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';

const COLORS = {
  border: '#E8E8EC',
  primaryBorder: '#A8EDCB',
  primaryLight: '#E8FBF1',
};

const hintStyle = tva({ base: 'text-xs italic text-typography-400 text-center' });

interface DropZoneProps {
  groupId: string;
  isActive: boolean;
  onLayout?: (groupId: string, layout: { y: number; height: number }) => void;
}

export function DropZone({ groupId, isActive, onLayout }: DropZoneProps) {
  return (
    <View
      style={[styles.container, isActive && styles.activeContainer]}
      onLayout={(e) => {
        if (onLayout) {
          const { y, height } = e.nativeEvent.layout;
          onLayout(groupId, { y, height });
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
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activeContainer: {
    borderColor: COLORS.primaryBorder,
    backgroundColor: COLORS.primaryLight,
  },
});
