import React from 'react';
import { View, type ViewProps } from 'react-native';

type IVStackProps = ViewProps & {
  className?: string;
  space?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const spaceClasses: Record<string, string> = {
  xs: 'gap-1',
  sm: 'gap-2',
  md: 'gap-3',
  lg: 'gap-4',
  xl: 'gap-5',
  '2xl': 'gap-6',
};

const VStack = React.forwardRef<React.ComponentRef<typeof View>, IVStackProps>(function VStack(
  { className, space, ...props },
  ref
) {
  const classes = ['flex-col', space ? spaceClasses[space] : '', className]
    .filter(Boolean)
    .join(' ');

  return <View ref={ref} {...props} className={classes} />;
});

VStack.displayName = 'VStack';
export { VStack };
