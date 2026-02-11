'use client';
import React from 'react';
import { createFormControl } from '@gluestack-ui/core/form-control/creator';
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import { View, Text } from 'react-native';
import { PrimitiveIcon } from '@gluestack-ui/core/icon/creator';
import { cssInterop } from 'nativewind';

const SCOPE = 'FORMCONTROL';

const Root = withStyleContext(View, SCOPE);

cssInterop(PrimitiveIcon, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      height: true,
      width: true,
      fill: true,
      color: 'classNameColor',
      stroke: true,
    },
  },
});

const UIFormControl = createFormControl({
  Root: Root,
  Error: View,
  ErrorText: Text,
  ErrorIcon: PrimitiveIcon,
  Label: View,
  LabelText: Text,
  LabelAstrick: Text,
  Helper: View,
  HelperText: Text,
});

const formControlStyle = tva({
  base: 'flex-col gap-1',
  variants: {
    size: {
      sm: '',
      md: '',
      lg: '',
    },
  },
  defaultVariants: {
    size: 'md',
  },
});

const formControlLabelStyle = tva({
  base: 'flex-row items-center justify-start',
});

const formControlLabelTextStyle = tva({
  base: 'text-typography-700 font-medium',
  parentVariants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
});

const formControlLabelAstrickStyle = tva({
  base: 'text-error-500 font-medium',
  parentVariants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
});

const formControlHelperStyle = tva({
  base: 'flex-row items-center justify-start',
});

const formControlHelperTextStyle = tva({
  base: 'text-typography-500',
  parentVariants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
});

const formControlErrorStyle = tva({
  base: 'flex-row items-center justify-start gap-1',
});

const formControlErrorTextStyle = tva({
  base: 'text-error-500',
  parentVariants: {
    size: {
      sm: 'text-xs',
      md: 'text-sm',
      lg: 'text-base',
    },
  },
});

const formControlErrorIconStyle = tva({
  base: 'fill-none text-error-500',
  parentVariants: {
    size: {
      sm: 'h-3.5 w-3.5',
      md: 'h-4 w-4',
      lg: 'h-5 w-5',
    },
  },
});

type IFormControlProps = Omit<
  React.ComponentPropsWithoutRef<typeof UIFormControl>,
  'context'
> &
  VariantProps<typeof formControlStyle> & { className?: string };

const FormControl = React.forwardRef<React.ElementRef<typeof UIFormControl>, IFormControlProps>(
  ({ className, size = 'md', ...props }, ref) => {
    return (
      <UIFormControl
        ref={ref}
        {...props}
        className={formControlStyle({ size, class: className })}
        context={{ size }}
      />
    );
  },
);

type IFormControlLabelProps = React.ComponentPropsWithoutRef<typeof UIFormControl.Label> & {
  className?: string;
};

const FormControlLabel = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Label>,
  IFormControlLabelProps
>(({ className, ...props }, ref) => {
  return (
    <UIFormControl.Label
      ref={ref}
      {...props}
      className={formControlLabelStyle({ class: className })}
    />
  );
});

type IFormControlLabelTextProps = React.ComponentPropsWithoutRef<
  typeof UIFormControl.Label.Text
> &
  VariantProps<typeof formControlLabelTextStyle> & { className?: string };

const FormControlLabelText = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Label.Text>,
  IFormControlLabelTextProps
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIFormControl.Label.Text
      ref={ref}
      {...props}
      className={formControlLabelTextStyle({
        parentVariants: { size: parentSize },
        class: className,
      })}
    />
  );
});

type IFormControlErrorProps = React.ComponentPropsWithoutRef<typeof UIFormControl.Error> & {
  className?: string;
};

const FormControlError = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Error>,
  IFormControlErrorProps
>(({ className, ...props }, ref) => {
  return (
    <UIFormControl.Error
      ref={ref}
      {...props}
      className={formControlErrorStyle({ class: className })}
    />
  );
});

type IFormControlErrorTextProps = React.ComponentPropsWithoutRef<
  typeof UIFormControl.Error.Text
> &
  VariantProps<typeof formControlErrorTextStyle> & { className?: string };

const FormControlErrorText = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Error.Text>,
  IFormControlErrorTextProps
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIFormControl.Error.Text
      ref={ref}
      {...props}
      className={formControlErrorTextStyle({
        parentVariants: { size: parentSize },
        class: className,
      })}
    />
  );
});

type IFormControlErrorIconProps = React.ComponentPropsWithoutRef<
  typeof UIFormControl.Error.Icon
> &
  VariantProps<typeof formControlErrorIconStyle> & { className?: string };

const FormControlErrorIcon = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Error.Icon>,
  IFormControlErrorIconProps
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIFormControl.Error.Icon
      ref={ref}
      {...props}
      className={formControlErrorIconStyle({
        parentVariants: { size: parentSize },
        class: className,
      })}
    />
  );
});

type IFormControlHelperProps = React.ComponentPropsWithoutRef<typeof UIFormControl.Helper> & {
  className?: string;
};

const FormControlHelper = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Helper>,
  IFormControlHelperProps
>(({ className, ...props }, ref) => {
  return (
    <UIFormControl.Helper
      ref={ref}
      {...props}
      className={formControlHelperStyle({ class: className })}
    />
  );
});

type IFormControlHelperTextProps = React.ComponentPropsWithoutRef<
  typeof UIFormControl.Helper.Text
> &
  VariantProps<typeof formControlHelperTextStyle> & { className?: string };

const FormControlHelperText = React.forwardRef<
  React.ElementRef<typeof UIFormControl.Helper.Text>,
  IFormControlHelperTextProps
>(({ className, ...props }, ref) => {
  const { size: parentSize } = useStyleContext(SCOPE);

  return (
    <UIFormControl.Helper.Text
      ref={ref}
      {...props}
      className={formControlHelperTextStyle({
        parentVariants: { size: parentSize },
        class: className,
      })}
    />
  );
});

FormControl.displayName = 'FormControl';
FormControlLabel.displayName = 'FormControlLabel';
FormControlLabelText.displayName = 'FormControlLabelText';
FormControlError.displayName = 'FormControlError';
FormControlErrorText.displayName = 'FormControlErrorText';
FormControlErrorIcon.displayName = 'FormControlErrorIcon';
FormControlHelper.displayName = 'FormControlHelper';
FormControlHelperText.displayName = 'FormControlHelperText';

export {
  FormControl,
  FormControlLabel,
  FormControlLabelText,
  FormControlError,
  FormControlErrorText,
  FormControlErrorIcon,
  FormControlHelper,
  FormControlHelperText,
};
