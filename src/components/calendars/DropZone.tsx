import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useRef } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/ui/text';

const hintStyle = tva({ base: 'text-center text-xs italic text-typography-400' });
const containerStyle = tva({
  base: 'mx-2 mb-1.5 mt-1 items-center justify-center rounded-[10px] border-[1.5px] border-dashed border-brand-border py-3',
  variants: {
    active: { true: 'border-brand-primary-border bg-brand-primary-light' },
  },
});

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
      className={containerStyle({ active: isActive })}
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
