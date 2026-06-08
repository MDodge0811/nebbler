import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CalendarPickerSheet } from '@components/CalendarPickerSheet';
import { EditDateTimeRow } from '@components/EditDateTimeRow';
import type { Calendar } from '@database/schema';
import type { EventEditForm as EventEditFormState } from '@hooks/useEventEditForm';
import { getCalendarColor } from '@utils/calendarColor';

import {
  calendarDotStyle,
  calendarNameStyle,
  chevronStyle,
  containerStyle,
  descriptionInputStyle,
  dividerStyle,
  sectionLabelStyle,
  titleInputStyle,
} from './styles';

interface EventEditFormProps {
  form: EventEditFormState;
  calendar: Calendar | null;
  calendarColor: string;
}

export function EventEditForm({ form, calendar, calendarColor }: EventEditFormProps) {
  const editCalendar = form.writableCalendars.find((c) => c.id === form.editCalendarId);
  const dotColor = editCalendar ? getCalendarColor(editCalendar.id) : calendarColor;
  const calendarName = editCalendar?.name ?? calendar?.name ?? 'Calendar';

  const endTimeError =
    form.formErrors.endTime ??
    (form.editEndTime <= form.editStartTime ? 'End time must be after start time' : undefined);
  const showEndError = !!form.formErrors.endTime;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
        <VStack className="px-4 pt-4">
          {/* Title */}
          <TextInput
            className={titleInputStyle({})}
            placeholder="Event title"
            placeholderTextColor="#A3A3A3"
            value={form.editTitle}
            onChangeText={form.setEditTitle}
            autoFocus
            returnKeyType="done"
          />
          <Box className={dividerStyle({})} />

          {/* Calendar row */}
          <Pressable className="py-4" onPress={() => form.setShowCalendarPicker(true)}>
            <HStack className="items-center">
              <DynamicColorView className={calendarDotStyle({})} backgroundColor={dotColor} />
              <Text className={calendarNameStyle({})}>{calendarName}</Text>
              <Text className={chevronStyle({})}>&#x203A;</Text>
            </HStack>
          </Pressable>
          <Box className={dividerStyle({})} />

          {/* Start date/time */}
          <EditDateTimeRow
            label="Starts"
            value={form.editStartTime}
            dateTarget="startDate"
            timeTarget="startTime"
            pickerTarget={form.pickerTarget}
            setPickerTarget={form.setPickerTarget}
            onChange={form.handleStartChange}
          />
          <Box className={dividerStyle({})} />

          {/* End date/time */}
          <EditDateTimeRow
            label="Ends"
            value={form.editEndTime}
            dateTarget="endDate"
            timeTarget="endTime"
            pickerTarget={form.pickerTarget}
            setPickerTarget={form.setPickerTarget}
            onChange={form.handleEndChange}
            showError={showEndError}
            errorText={endTimeError}
          />
          <Box className={dividerStyle({})} />

          {/* Description */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Description</Text>
            <TextInput
              className={descriptionInputStyle({})}
              textAlignVertical="top"
              placeholder="Add a description"
              placeholderTextColor="#A3A3A3"
              value={form.editDescription}
              onChangeText={form.setEditDescription}
              multiline
              numberOfLines={4}
            />
          </VStack>
        </VStack>
      </ScrollView>

      <CalendarPickerSheet
        visible={form.showCalendarPicker}
        calendars={form.writableCalendars}
        selectedCalendarId={form.editCalendarId}
        onSelect={form.handleCalendarSelect}
        onClose={() => form.setShowCalendarPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
