import React from 'react';
import {
  Pressable,
  Text as RNText,
  ActivityIndicator,
  type PressableProps,
  type TextProps,
} from 'react-native';

type ButtonAction = 'primary' | 'secondary' | 'positive' | 'negative';
type ButtonVariant = 'solid' | 'outline' | 'link';
type ButtonSize = 'xs' | 'sm' | 'md' | 'lg' | 'xl';

type IButtonProps = PressableProps & {
  className?: string;
  action?: ButtonAction;
  variant?: ButtonVariant;
  size?: ButtonSize;
  isDisabled?: boolean;
};

const actionClasses: Record<ButtonAction, string> = {
  primary: 'bg-primary-500 active:bg-primary-700',
  secondary: 'bg-gray-500 active:bg-gray-700',
  positive: 'bg-success active:opacity-80',
  negative: 'bg-error active:opacity-80',
};

const variantClasses: Record<ButtonVariant, string> = {
  solid: '',
  outline: 'bg-transparent border border-border',
  link: 'bg-transparent px-0',
};

const sizeClasses: Record<ButtonSize, string> = {
  xs: 'px-3 h-8',
  sm: 'px-4 h-9',
  md: 'px-5 h-10',
  lg: 'px-6 h-11',
  xl: 'px-7 h-12',
};

const Button = React.forwardRef<React.ComponentRef<typeof Pressable>, IButtonProps>(function Button(
  {
    className,
    action = 'primary',
    variant = 'solid',
    size = 'md',
    isDisabled,
    disabled,
    children,
    ...props
  },
  ref
) {
  const isActuallyDisabled = isDisabled || disabled;
  const classes = [
    'rounded flex-row items-center justify-center gap-2',
    variant === 'solid' ? actionClasses[action] : '',
    variantClasses[variant],
    sizeClasses[size],
    isActuallyDisabled ? 'opacity-40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <Pressable ref={ref} {...props} disabled={isActuallyDisabled} className={classes}>
      {children}
    </Pressable>
  );
});

Button.displayName = 'Button';

type IButtonTextProps = TextProps & {
  className?: string;
};

const ButtonText = React.forwardRef<React.ComponentRef<typeof RNText>, IButtonTextProps>(
  function ButtonText({ className, ...props }, ref) {
    const classes = ['text-white font-semibold text-base', className].filter(Boolean).join(' ');

    return <RNText ref={ref} {...props} className={classes} />;
  }
);

ButtonText.displayName = 'ButtonText';

const ButtonSpinner = React.forwardRef<
  React.ComponentRef<typeof ActivityIndicator>,
  { className?: string; color?: string }
>(function ButtonSpinner({ color = '#fff', ...props }, ref) {
  return <ActivityIndicator ref={ref} size="small" color={color} {...props} />;
});

ButtonSpinner.displayName = 'ButtonSpinner';

export { Button, ButtonText, ButtonSpinner };
