import React from 'react';
import { View, type ViewProps } from 'react-native';

type IDividerProps = ViewProps & {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
};

const Divider = React.forwardRef<React.ComponentRef<typeof View>, IDividerProps>(function Divider(
  { className, orientation = 'horizontal', ...props },
  ref
) {
  const orientationClass = orientation === 'vertical' ? 'w-px h-full' : 'h-px w-full';
  const classes = ['bg-border', orientationClass, className].filter(Boolean).join(' ');

  return <View ref={ref} {...props} className={classes} />;
});

Divider.displayName = 'Divider';
export { Divider };
