import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useState } from 'react';
import { TextInput } from 'react-native';

const inputStyle = tva({
  base: 'flex-1 rounded-lg border-[1.5px] px-2.5 py-1.5 text-[15px] font-semibold tracking-[-0.2px] text-brand-text',
  variants: {
    focused: {
      true: 'border-brand-primary bg-background-0',
      false: 'border-brand-border bg-typography-50',
    },
  },
});

interface EditableGroupNameProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean | undefined;
}

export function EditableGroupName({
  value,
  onChangeText,
  onSubmit,
  autoFocus,
}: EditableGroupNameProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <TextInput
      value={value}
      onChangeText={onChangeText}
      onFocus={() => setIsFocused(true)}
      onBlur={() => {
        setIsFocused(false);
        onSubmit();
      }}
      onSubmitEditing={onSubmit}
      returnKeyType="done"
      autoFocus={autoFocus}
      className={inputStyle({ focused: isFocused })}
    />
  );
}
