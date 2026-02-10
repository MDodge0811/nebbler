import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

type IHeadingProps = TextProps & {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl';
};

const sizeClasses: Record<string, string> = {
  xs: 'text-xs font-bold',
  sm: 'text-sm font-bold',
  md: 'text-base font-bold',
  lg: 'text-lg font-bold',
  xl: 'text-xl font-bold',
  '2xl': 'text-2xl font-bold',
  '3xl': 'text-3xl font-bold',
  '4xl': 'text-4xl font-bold',
  '5xl': 'text-5xl font-bold',
};

const Heading = React.forwardRef<React.ComponentRef<typeof RNText>, IHeadingProps>(function Heading(
  { className, size = 'lg', ...props },
  ref
) {
  const classes = ['text-text-primary', sizeClasses[size], className].filter(Boolean).join(' ');

  return <RNText ref={ref} {...props} className={classes} accessibilityRole="header" />;
});

Heading.displayName = 'Heading';
export { Heading };
