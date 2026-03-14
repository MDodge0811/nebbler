import { useState } from 'react';
import { StyleSheet, TextInput } from 'react-native';
import { calendarsUIColors } from '@constants/calendarsUI';

interface EditableGroupNameProps {
  value: string;
  onChangeText: (text: string) => void;
  onSubmit: () => void;
  autoFocus?: boolean;
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
      style={[
        styles.input,
        {
          borderColor: isFocused ? calendarsUIColors.primary : calendarsUIColors.border,
          backgroundColor: isFocused ? '#FFFFFF' : calendarsUIColors.surfaceHover,
        },
      ]}
    />
  );
}

const styles = StyleSheet.create({
  input: {
    flex: 1,
    fontSize: 15,
    fontWeight: '600',
    color: '#1A1A1F',
    letterSpacing: -0.2,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    borderWidth: 1.5,
  },
});
