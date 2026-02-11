'use client';
import React from 'react';
import { createInput } from '@gluestack-ui/core/input/creator';
import {
  tva,
  withStyleContext,
  useStyleContext,
  type VariantProps,
} from '@gluestack-ui/utils/nativewind-utils';
import { TextInput, View, Pressable } from 'react-native';
import { PrimitiveIcon } from '@gluestack-ui/core/icon/creator';
import { cssInterop } from 'nativewind';

const SCOPE = 'INPUT';

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

cssInterop(TextInput, { className: 'style' });

const UIInput = createInput({
  Root: Root,
  Icon: PrimitiveIcon,
  Slot: Pressable,
  Input: TextInput,
});

const inputStyle = tva({
  base: 'border-outline-300 flex-row items-center overflow-hidden rounded border data-[focus=true]:border-primary-500 data-[disabled=true]:opacity-40',
  variants: {
    variant: {
      outline: 'border-outline-300 data-[focus=true]:border-primary-500',
      filled:
        'border-transparent bg-background-50 data-[focus=true]:border-primary-500 data-[focus=true]:bg-background-0',
      underlined:
        'rounded-none border-0 border-b-2 border-outline-300 data-[focus=true]:border-primary-500',
    },
    size: {
      sm: 'h-9',
      md: 'h-10',
      lg: 'h-12',
    },
  },
  compoundVariants: [
    {
      variant: 'underlined',
      class: 'rounded-none border-0 border-b-2',
    },
  ],
  defaultVariants: {
    variant: 'outline',
    size: 'md',
  },
});

const inputFieldStyle = tva({
  base: 'h-full flex-1 px-3 text-typography-900 placeholder:text-typography-400 web:outline-none',
  parentVariants: {
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
});

const inputSlotStyle = tva({
  base: 'items-center justify-center web:disabled:cursor-not-allowed',
  parentVariants: {
    size: {
      sm: 'h-9 px-2',
      md: 'h-10 px-3',
      lg: 'h-12 px-3',
    },
  },
});

const inputIconStyle = tva({
  base: 'fill-none text-typography-400',
  parentVariants: {
    size: {
      sm: 'h-4 w-4',
      md: 'h-5 w-5',
      lg: 'h-6 w-6',
    },
  },
});

type IInputProps = Omit<React.ComponentPropsWithoutRef<typeof UIInput>, 'context'> &
  VariantProps<typeof inputStyle> & { className?: string; isInvalid?: boolean };

const Input = React.forwardRef<React.ElementRef<typeof UIInput>, IInputProps>(
  ({ className, variant = 'outline', size = 'md', ...props }, ref) => {
    return (
      <UIInput
        ref={ref}
        {...props}
        className={inputStyle({ variant, size, class: className })}
        context={{ variant, size }}
      />
    );
  },
);

type IInputFieldProps = React.ComponentPropsWithoutRef<typeof UIInput.Input> &
  VariantProps<typeof inputFieldStyle> & { className?: string };

const InputField = React.forwardRef<React.ElementRef<typeof UIInput.Input>, IInputFieldProps>(
  ({ className, ...props }, ref) => {
    const { size: parentSize } = useStyleContext(SCOPE);

    return (
      <UIInput.Input
        ref={ref}
        {...props}
        className={inputFieldStyle({
          parentVariants: { size: parentSize },
          class: className,
        })}
      />
    );
  },
);

type IInputSlotProps = React.ComponentPropsWithoutRef<typeof UIInput.Slot> &
  VariantProps<typeof inputSlotStyle> & { className?: string };

const InputSlot = React.forwardRef<React.ElementRef<typeof UIInput.Slot>, IInputSlotProps>(
  ({ className, ...props }, ref) => {
    const { size: parentSize } = useStyleContext(SCOPE);

    return (
      <UIInput.Slot
        ref={ref}
        {...props}
        className={inputSlotStyle({
          parentVariants: { size: parentSize },
          class: className,
        })}
      />
    );
  },
);

type IInputIconProps = React.ComponentPropsWithoutRef<typeof UIInput.Icon> &
  VariantProps<typeof inputIconStyle> & { className?: string };

const InputIcon = React.forwardRef<React.ElementRef<typeof UIInput.Icon>, IInputIconProps>(
  ({ className, ...props }, ref) => {
    const { size: parentSize } = useStyleContext(SCOPE);

    return (
      <UIInput.Icon
        ref={ref}
        {...props}
        className={inputIconStyle({
          parentVariants: { size: parentSize },
          class: className,
        })}
      />
    );
  },
);

Input.displayName = 'Input';
InputField.displayName = 'InputField';
InputSlot.displayName = 'InputSlot';
InputIcon.displayName = 'InputIcon';

export { Input, InputField, InputSlot, InputIcon };
