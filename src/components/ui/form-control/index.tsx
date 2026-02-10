import React from 'react';
import { View, Text as RNText, type ViewProps, type TextProps } from 'react-native';

type IFormControlProps = ViewProps & {
  className?: string;
  isInvalid?: boolean;
  isDisabled?: boolean;
  isRequired?: boolean;
};

const FormControl = React.forwardRef<React.ComponentRef<typeof View>, IFormControlProps>(
  function FormControl({ className, ...props }, ref) {
    const classes = ['flex-col gap-1', className].filter(Boolean).join(' ');
    return <View ref={ref} {...props} className={classes} />;
  }
);

FormControl.displayName = 'FormControl';

type IFormControlLabelProps = ViewProps & { className?: string };

const FormControlLabel = React.forwardRef<React.ComponentRef<typeof View>, IFormControlLabelProps>(
  function FormControlLabel({ className, ...props }, ref) {
    const classes = ['flex-row items-center mb-1', className].filter(Boolean).join(' ');
    return <View ref={ref} {...props} className={classes} />;
  }
);

FormControlLabel.displayName = 'FormControlLabel';

type IFormControlLabelTextProps = TextProps & { className?: string };

const FormControlLabelText = React.forwardRef<
  React.ComponentRef<typeof RNText>,
  IFormControlLabelTextProps
>(function FormControlLabelText({ className, ...props }, ref) {
  const classes = ['text-sm font-medium text-text-primary', className].filter(Boolean).join(' ');
  return <RNText ref={ref} {...props} className={classes} />;
});

FormControlLabelText.displayName = 'FormControlLabelText';

type IFormControlErrorProps = ViewProps & { className?: string };

const FormControlError = React.forwardRef<React.ComponentRef<typeof View>, IFormControlErrorProps>(
  function FormControlError({ className, ...props }, ref) {
    const classes = ['flex-row items-center mt-1', className].filter(Boolean).join(' ');
    return <View ref={ref} {...props} className={classes} />;
  }
);

FormControlError.displayName = 'FormControlError';

type IFormControlErrorTextProps = TextProps & { className?: string };

const FormControlErrorText = React.forwardRef<
  React.ComponentRef<typeof RNText>,
  IFormControlErrorTextProps
>(function FormControlErrorText({ className, ...props }, ref) {
  const classes = ['text-sm text-error', className].filter(Boolean).join(' ');
  return <RNText ref={ref} {...props} className={classes} />;
});

FormControlErrorText.displayName = 'FormControlErrorText';

export {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
};
