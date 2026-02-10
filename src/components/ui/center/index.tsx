import React from 'react';
import { View, type ViewProps } from 'react-native';

type ICenterProps = ViewProps & { className?: string };

const Center = React.forwardRef<React.ComponentRef<typeof View>, ICenterProps>(function Center(
  { className, ...props },
  ref
) {
  const classes = ['items-center justify-center', className].filter(Boolean).join(' ');

  return <View ref={ref} {...props} className={classes} />;
});

Center.displayName = 'Center';
export { Center };
