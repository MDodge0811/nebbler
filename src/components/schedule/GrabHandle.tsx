import { View } from 'react-native';

export const GRAB_HANDLE_HEIGHT = 8;

export function GrabHandle() {
  return (
    <View
      style={{
        height: GRAB_HANDLE_HEIGHT,
        alignItems: 'center',
        justifyContent: 'center',
      }}
      testID="grab-handle"
      accessibilityRole="adjustable"
      accessibilityLabel="Drag to expand or collapse calendar"
    >
      <View
        style={{
          width: 40,
          height: 4,
          borderRadius: 2,
          backgroundColor: '#D1D5DB',
        }}
      />
    </View>
  );
}
