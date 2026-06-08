import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { CalendarPickerSheet } from '@components/CalendarPickerSheet';
import { EditDateTimeRow } from '@components/EditDateTimeRow';
import { useCreateEventForm } from '@hooks/useCreateEventForm';
import { getCalendarColor } from '@utils/calendarColor';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
const chevronStyle = tva({ base: 'text-base text-typography-400' });
const addDetailsStyle = tva({ base: 'text-base text-primary-500' });
const dividerStyle = tva({ base: 'h-px bg-outline-200' });
const calendarDotStyle = tva({ base: 'mr-2.5 h-2.5 w-2.5 rounded-full' });
const titleInputStyle = tva({ base: 'px-0 py-2 text-base text-typography-900' });
const descriptionInputStyle = tva({
  base: 'min-h-[100px] rounded-lg border border-typography-100 px-3 py-2 text-base text-typography-900',
});
const headerCloseStyle = tva({ base: 'text-base text-primary-300' });
const headerSaveStyle = tva({
  base: 'text-base font-semibold',
  variants: { enabled: { true: 'text-brand-primary', false: 'text-typography-300' } },
});

export function CreateEventScreen() {
  const navigation = useNavigation();
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const form = useCreateEventForm(goBack);

  const { calendar, handleClose, handleSave, isValid, isSaving } = form;
  const dotColor = calendar ? getCalendarColor(calendar.id) : '#00DB74';
  const calendarName = calendar?.name ?? 'Personal Calendar';

  // Configure native header with Close and Save buttons.
  useEffect(() => {
    navigation.setOptions({
      title: 'New Event',
      headerLeft: () => (
        <Pressable onPress={handleClose} hitSlop={8}>
          <Text className={headerCloseStyle({})}>&#x2715;</Text>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={!isValid || isSaving}
          hitSlop={8}
        >
          <Text className={headerSaveStyle({ enabled: isValid })}>Save</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleClose, handleSave, isValid, isSaving]);

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
            value={form.title}
            onChangeText={form.setTitle}
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
            value={form.startTime}
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
            value={form.endTime}
            dateTarget="endDate"
            timeTarget="endTime"
            pickerTarget={form.pickerTarget}
            setPickerTarget={form.setPickerTarget}
            onChange={form.handleEndChange}
            showError={form.showEndError}
            errorText={form.endTimeError}
          />
          <Box className={dividerStyle({})} />

          {/* Description */}
          {form.showDescription ? (
            <VStack className="py-4">
              <Text className={sectionLabelStyle({})}>Description</Text>
              <TextInput
                className={descriptionInputStyle({})}
                textAlignVertical="top"
                placeholder="Add a description"
                placeholderTextColor="#A3A3A3"
                value={form.description}
                onChangeText={form.setDescription}
                multiline
                numberOfLines={4}
                autoFocus
              />
            </VStack>
          ) : (
            <Pressable className="py-4" onPress={() => form.setShowDescription(true)}>
              <Text className={addDetailsStyle({})}>+ Add details</Text>
            </Pressable>
          )}
        </VStack>
      </ScrollView>

      <CalendarPickerSheet
        visible={form.showCalendarPicker}
        calendars={form.writableCalendars}
        selectedCalendarId={form.selectedCalendarId}
        onSelect={form.handleCalendarSelect}
        onClose={() => form.setShowCalendarPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
