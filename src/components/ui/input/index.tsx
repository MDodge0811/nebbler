import React from 'react';
import { View, TextInput, type ViewProps, type TextInputProps } from 'react-native';

type InputVariant = 'outline' | 'underlined' | 'rounded';
type InputSize = 'sm' | 'md' | 'lg' | 'xl';

type IInputProps = ViewProps & {
  className?: string;
  variant?: InputVariant;
  size?: InputSize;
  isDisabled?: boolean;
  isReadOnly?: boolean;
  isInvalid?: boolean;
};

const variantClasses: Record<InputVariant, string> = {
  outline: 'rounded border border-border',
  underlined: 'rounded-none border-b border-border',
  rounded: 'rounded-full border border-border',
};

const sizeClasses: Record<InputSize, string> = {
  sm: 'h-9',
  md: 'h-10',
  lg: 'h-11',
  xl: 'h-12',
};

const InputContext = React.createContext<{
  variant: InputVariant;
  size: InputSize;
  isDisabled: boolean;
}>({
  variant: 'outline',
  size: 'md',
  isDisabled: false,
});

const Input = React.forwardRef<React.ComponentRef<typeof View>, IInputProps>(function Input(
  { className, variant = 'outline', size = 'md', isDisabled = false, children, ...props },
  ref
) {
  const classes = [
    'flex-row items-center overflow-hidden bg-background',
    'focus-within:border-primary-500',
    variantClasses[variant],
    sizeClasses[size],
    isDisabled ? 'opacity-40' : '',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <InputContext.Provider value={{ variant, size, isDisabled }}>
      <View ref={ref} {...props} className={classes}>
        {children}
      </View>
    </InputContext.Provider>
  );
});

Input.displayName = 'Input';

type IInputFieldProps = TextInputProps & {
  className?: string;
};

const InputField = React.forwardRef<React.ComponentRef<typeof TextInput>, IInputFieldProps>(
  function InputField({ className, ...props }, ref) {
    const { isDisabled } = React.useContext(InputContext);

    const classes = ['flex-1 text-text-primary px-3 h-full text-base', className]
      .filter(Boolean)
      .join(' ');

    return (
      <TextInput
        ref={ref}
        editable={!isDisabled}
        placeholderTextColor="#999"
        {...props}
        className={classes}
      />
    );
  }
);

InputField.displayName = 'InputField';

export { Input, InputField };
