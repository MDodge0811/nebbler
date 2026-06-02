'use client';
import { createToast, createToastHook } from '@gluestack-ui/core/toast/creator';
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import { cssInterop } from 'nativewind';
import React from 'react';
import { Text, View } from 'react-native';

// AnimationWrapper / AnimatePresence default to View — keep it simple, no
// animation library needed for an MVP toast.
export const useToast = createToastHook(View, View);

const SCOPE = 'TOAST';

const Root = withStyleContext(View, SCOPE);

const UIToast = createToast({
  Root,
  Title: Text,
  Description: Text,
});

cssInterop(UIToast, { className: 'style' });
cssInterop(UIToast.Title, { className: 'style' });
cssInterop(UIToast.Description, { className: 'style' });

const toastStyle = tva({
  base: 'p-4 mx-3 my-1 rounded-xl gap-1 web:pointer-events-auto shadow-hard-2 border border-outline-100',
  variants: {
    action: {
      error: 'bg-error-700',
      warning: 'bg-warning-600',
      success: 'bg-success-600',
      info: 'bg-info-600',
      muted: 'bg-background-800',
    },
    variant: {
      solid: '',
      outline: 'border bg-background-0',
    },
  },
});

const toastTitleStyle = tva({
  base: 'text-typography-0 font-medium font-body text-left text-sm',
  parentVariants: {
    variant: { solid: '', outline: 'text-typography-900' },
  },
});

const toastDescriptionStyle = tva({
  base: 'text-typography-50 font-normal font-body text-left text-xs',
  parentVariants: {
    variant: { solid: '', outline: 'text-typography-700' },
  },
});

type IToastProps = React.ComponentPropsWithoutRef<typeof UIToast> &
  VariantProps<typeof toastStyle>;

export const Toast = React.forwardRef<React.ComponentRef<typeof UIToast>, IToastProps>(
  function Toast({ className, variant = 'solid', action = 'muted', ...props }, ref) {
    return (
      <UIToast
        ref={ref}
        context={{ variant, action }}
        className={toastStyle({ variant, action, class: className })}
        {...props}
      />
    );
  }
);

type IToastTitleProps = React.ComponentPropsWithoutRef<typeof UIToast.Title>;

export const ToastTitle = React.forwardRef<
  React.ComponentRef<typeof UIToast.Title>,
  IToastTitleProps
>(function ToastTitle({ className, ...props }, ref) {
  const { variant: parentVariant } = useStyleContext(SCOPE) as { variant?: 'solid' | 'outline' };
  return (
    <UIToast.Title
      ref={ref}
      className={toastTitleStyle({ parentVariants: { variant: parentVariant }, class: className })}
      {...props}
    />
  );
});

type IToastDescriptionProps = React.ComponentPropsWithoutRef<typeof UIToast.Description>;

export const ToastDescription = React.forwardRef<
  React.ComponentRef<typeof UIToast.Description>,
  IToastDescriptionProps
>(function ToastDescription({ className, ...props }, ref) {
  const { variant: parentVariant } = useStyleContext(SCOPE) as { variant?: 'solid' | 'outline' };
  return (
    <UIToast.Description
      ref={ref}
      className={toastDescriptionStyle({
        parentVariants: { variant: parentVariant },
        class: className,
      })}
      {...props}
    />
  );
});
