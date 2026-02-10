import React from 'react';
import { Text as RNText, type TextProps } from 'react-native';

type ITextProps = TextProps & {
  className?: string;
  bold?: boolean;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl';
};

const sizeClasses: Record<string, string> = {
  xs: 'text-xs',
  sm: 'text-sm',
  md: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
  '2xl': 'text-2xl',
};

const Text = React.forwardRef<React.ComponentRef<typeof RNText>, ITextProps>(function Text(
  { className, bold, size = 'md', ...props },
  ref
) {
  const classes = ['text-text-primary', sizeClasses[size], bold ? 'font-bold' : '', className]
    .filter(Boolean)
    .join(' ');

  return <RNText ref={ref} {...props} className={classes} />;
});

Text.displayName = 'Text';
export { Text };
