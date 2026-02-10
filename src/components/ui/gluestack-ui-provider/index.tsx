import React from 'react';
import { View, type ViewProps } from 'react-native';

type GluestackUIProviderProps = {
  children?: React.ReactNode;
  style?: ViewProps['style'];
};

export function GluestackUIProvider({ children, style }: GluestackUIProviderProps) {
  return <View style={[{ flex: 1, height: '100%', width: '100%' }, style]}>{children}</View>;
}
