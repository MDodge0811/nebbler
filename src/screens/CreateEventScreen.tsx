import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';

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

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  calendarDot: { width: 10, height: 10, borderRadius: 5 },
  titleInput: {
    fontSize: 16,
    color: '#262627',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#262627',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
  },
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
        <RNPressable onPress={handleClose} hitSlop={8}>
          <RNText style={{ fontSize: 16, color: '#666666' }}>&#x2715;</RNText>
        </RNPressable>
      ),
      headerRight: () => (
        <RNPressable
          onPress={() => {
            void handleSave();
          }}
          disabled={!isValid || isSaving}
          hitSlop={8}
        >
          <RNText
            style={{
              fontSize: 16,
              fontWeight: '600',
              color: isValid ? '#00DB74' : '#D4D4D4',
            }}
          >
            Save
          </RNText>
        </RNPressable>
      ),
    });
  }, [navigation, handleClose, handleSave, isValid, isSaving]);

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
            value={form.title}
            onChangeText={form.setTitle}
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
            value={form.startTime}
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
            value={form.endTime}
            dateTarget="endDate"
            timeTarget="endTime"
            pickerTarget={form.pickerTarget}
            setPickerTarget={form.setPickerTarget}
            onChange={form.handleEndChange}
            showError={form.showEndError}
            errorText={form.endTimeError}
          />
          <View className={dividerStyle({})} />

          {/* Description */}
          {form.showDescription ? (
            <VStack className="py-4">
              <Text className={sectionLabelStyle({})}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
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
