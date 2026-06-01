import { KeyboardAvoidingView, Platform, ScrollView, TextInput, View } from 'react-native';

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
  calendarNameStyle,
  chevronStyle,
  containerStyle,
  dividerStyle,
  sectionLabelStyle,
  styles,
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
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <VStack className="px-4 pt-4">
          {/* Title */}
          <TextInput
            style={styles.titleInput}
            placeholder="Event title"
            placeholderTextColor="#A3A3A3"
            value={form.editTitle}
            onChangeText={form.setEditTitle}
            autoFocus
            returnKeyType="done"
          />
          <View className={dividerStyle({})} />

          {/* Calendar row */}
          <Pressable className="py-4" onPress={() => form.setShowCalendarPicker(true)}>
            <HStack className="items-center">
              <View style={[styles.calendarDot, { backgroundColor: dotColor, marginRight: 10 }]} />
              <Text className={calendarNameStyle({})}>{calendarName}</Text>
              <Text className={chevronStyle({})}>&#x203A;</Text>
            </HStack>
          </Pressable>
          <View className={dividerStyle({})} />

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
          <View className={dividerStyle({})} />

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
          <View className={dividerStyle({})} />

          {/* Description */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Description</Text>
            <TextInput
              style={styles.descriptionInput}
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
