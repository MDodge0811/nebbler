import React from 'react';
import { View, type ViewProps } from 'react-native';

type IBoxProps = ViewProps & { className?: string };

const Box = React.forwardRef<React.ComponentRef<typeof View>, IBoxProps>(function Box(
  { className, ...props },
  ref
) {
  return <View ref={ref} {...props} className={className} />;
});

Box.displayName = 'Box';
export { Box };
