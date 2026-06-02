import { tva } from '@gluestack-ui/utils/nativewind-utils';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Platform } from 'react-native';

import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import type { PickerTarget } from '@/types/eventForm';
import { formatDateShort, formatTime } from '@utils/formatTime';

const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
const dateTimeTextStyle = tva({ base: 'text-base text-typography-900' });
const dateTimeSeparatorStyle = tva({ base: 'text-base text-typography-400' });
const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });

interface EditDateTimeRowProps {
  label: string;
  value: Date;
  dateTarget: Exclude<PickerTarget, null>;
  timeTarget: Exclude<PickerTarget, null>;
  pickerTarget: PickerTarget;
  setPickerTarget: (target: PickerTarget) => void;
  onChange: (event: DateTimePickerEvent, date?: Date) => void;
  showError?: boolean | undefined;
  errorText?: string | undefined;
}

/** A labelled "date · time" row with an inline native picker and optional error. */
export function EditDateTimeRow({
  label,
  value,
  dateTarget,
  timeTarget,
  pickerTarget,
  setPickerTarget,
  onChange,
  showError = false,
  errorText,
}: EditDateTimeRowProps) {
  const errorStyle = showError ? { color: '#DC2626' } : undefined;
  const pickerOpen = pickerTarget === dateTarget || pickerTarget === timeTarget;

  return (
    <>
      <VStack className="py-4">
        <Text className={sectionLabelStyle({})}>{label}</Text>
        <HStack className="mt-1 items-center">
          <Pressable onPress={() => setPickerTarget(dateTarget)}>
            <Text className={dateTimeTextStyle({})} style={errorStyle}>
              {formatDateShort(value)}
            </Text>
          </Pressable>
          <Text className={dateTimeSeparatorStyle({})}> &middot; </Text>
          <Pressable onPress={() => setPickerTarget(timeTarget)}>
            <Text className={dateTimeTextStyle({})} style={errorStyle}>
              {formatTime(value)}
            </Text>
          </Pressable>
        </HStack>
        {showError && errorText && <Text className={errorTextStyle({})}>{errorText}</Text>}
      </VStack>

      {pickerOpen && (
        <DateTimePicker
          value={value}
          mode={pickerTarget === dateTarget ? 'date' : 'time'}
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          onChange={onChange}
          minuteInterval={5}
        />
      )}
    </>
  );
}
