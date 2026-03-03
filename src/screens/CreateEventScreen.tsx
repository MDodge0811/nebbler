import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useEventMutations } from '@hooks/useCalendarEvents';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';
import { CalendarPickerSheet } from '@components/CalendarPickerSheet';
import { CreateEventSchema } from '@database/schemas';
import { formatDateShort, formatTime } from '@utils/formatTime';
import { getCalendarColor } from '@utils/calendarColor';
import { ZodError } from 'zod';

// --- Styles ---

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
const dateTimeTextStyle = tva({ base: 'text-base text-typography-900' });
const dateTimeSeparatorStyle = tva({ base: 'text-base text-typography-400' });
const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });
const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
const chevronStyle = tva({ base: 'text-base text-typography-400' });
const addDetailsStyle = tva({ base: 'text-base text-primary-500' });
const descriptionLabelStyle = tva({ base: 'text-sm text-typography-500' });
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

// --- Helpers ---

function getNextWholeHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

// --- Component ---

export function CreateEventScreen() {
  const navigation = useNavigation();
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);
  const { createEvent } = useEventMutations();

  const defaultStart = useMemo(() => getNextWholeHour(), []);
  const defaultEnd = useMemo(() => addHours(defaultStart, 1), [defaultStart]);

  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState(defaultStart);
  const [endTime, setEndTime] = useState(defaultEnd);
  const [showDescription, setShowDescription] = useState(false);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [selectedCalendarId, setSelectedCalendarId] = useState<string | null>(null);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const titleInputRef = useRef<TextInput>(null);

  // Default to first writable calendar when available
  const calendar =
    writableCalendars.find((c) => c.id === selectedCalendarId) ?? writableCalendars[0];

  useEffect(() => {
    if (!selectedCalendarId && writableCalendars.length > 0) {
      setSelectedCalendarId(writableCalendars[0].id);
    }
  }, [selectedCalendarId, writableCalendars]);

  const handleCalendarSelect = useCallback((cal: WritableCalendar) => {
    setSelectedCalendarId(cal.id);
    setShowCalendarPicker(false);
  }, []);

  // Derived state
  const isDirty =
    title.trim() !== '' ||
    description.trim() !== '' ||
    startTime.getTime() !== defaultStart.getTime() ||
    endTime.getTime() !== defaultEnd.getTime();

  const isValid = title.trim().length > 0 && endTime > startTime;

  // --- Handlers ---

  const handleClose = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation]);

  const handleSave = useCallback(async () => {
    if (!calendar || !authUser || isSaving) return;

    try {
      CreateEventSchema.parse({
        title,
        calendarId: calendar.id,
        startTime,
        endTime,
        description: description || undefined,
      });
      setFormErrors({});
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = String(issue.path[0]);
          if (!errors[field]) {
            errors[field] = issue.message;
          }
        });
        setFormErrors(errors);
      }
      return;
    }

    setIsSaving(true);
    try {
      await createEvent({
        calendarId: calendar.id,
        createdByUserId: authUser.id,
        title: title.trim(),
        description: description.trim() || undefined,
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      navigation.goBack();
    } finally {
      setIsSaving(false);
    }
  }, [
    calendar,
    authUser,
    isSaving,
    title,
    description,
    startTime,
    endTime,
    createEvent,
    navigation,
  ]);

  const handleStartChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      if (pickerTarget === 'startDate') {
        const next = new Date(startTime);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setStartTime(next);
        if (endTime <= next) setEndTime(addHours(next, 1));
      } else {
        const next = new Date(startTime);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setStartTime(next);
        if (endTime <= next) setEndTime(addHours(next, 1));
      }

      setFormErrors((prev) => {
        if (!prev.endTime) return prev;
        const next = { ...prev };
        delete next.endTime;
        return next;
      });
    },
    [pickerTarget, startTime, endTime]
  );

  const handleEndChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      if (pickerTarget === 'endDate') {
        const next = new Date(endTime);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setEndTime(next);
      } else {
        const next = new Date(endTime);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setEndTime(next);
      }

      setFormErrors((prev) => {
        if (!prev.endTime) return prev;
        const next = { ...prev };
        delete next.endTime;
        return next;
      });
    },
    [pickerTarget, endTime]
  );

  const endTimeError =
    formErrors.endTime || (endTime <= startTime ? 'End time must be after start time' : undefined);
  const showEndError = !!formErrors.endTime;

  // Configure native header with Close and Save buttons
  useEffect(() => {
    navigation.setOptions({
      title: 'New Event',
      headerLeft: () => (
        <RNPressable onPress={handleClose} hitSlop={8}>
          <RNText style={{ fontSize: 16, color: '#666666' }}>&#x2715;</RNText>
        </RNPressable>
      ),
      headerRight: () => (
        <RNPressable onPress={handleSave} disabled={!isValid || isSaving} hitSlop={8}>
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

  // --- Render ---

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <VStack className="px-4 pt-4">
          {/* Title */}
          <TextInput
            ref={titleInputRef}
            style={styles.titleInput}
            placeholder="Event title"
            placeholderTextColor="#A3A3A3"
            value={title}
            onChangeText={setTitle}
            autoFocus
            returnKeyType="done"
          />
          <View className={dividerStyle({})} />

          {/* Calendar row */}
          <Pressable className="py-4" onPress={() => setShowCalendarPicker(true)}>
            <HStack className="items-center">
              <View
                style={[
                  styles.calendarDot,
                  {
                    backgroundColor: calendar ? getCalendarColor(calendar.id) : '#00DB74',
                    marginRight: 10,
                  },
                ]}
              />
              <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Personal Calendar'}</Text>
              <Text className={chevronStyle({})}>&#x203A;</Text>
            </HStack>
          </Pressable>
          <View className={dividerStyle({})} />

          {/* Start date/time */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Starts</Text>
            <HStack className="mt-1 items-center">
              <Pressable onPress={() => setPickerTarget('startDate')}>
                <Text className={dateTimeTextStyle({})}>{formatDateShort(startTime)}</Text>
              </Pressable>
              <Text className={dateTimeSeparatorStyle({})}> &middot; </Text>
              <Pressable onPress={() => setPickerTarget('startTime')}>
                <Text className={dateTimeTextStyle({})}>{formatTime(startTime)}</Text>
              </Pressable>
            </HStack>
          </VStack>

          {(pickerTarget === 'startDate' || pickerTarget === 'startTime') && (
            <DateTimePicker
              value={startTime}
              mode={pickerTarget === 'startDate' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleStartChange}
              minuteInterval={5}
            />
          )}

          <View className={dividerStyle({})} />

          {/* End date/time */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Ends</Text>
            <HStack className="mt-1 items-center">
              <Pressable onPress={() => setPickerTarget('endDate')}>
                <Text
                  className={dateTimeTextStyle({})}
                  style={showEndError ? { color: '#DC2626' } : undefined}
                >
                  {formatDateShort(endTime)}
                </Text>
              </Pressable>
              <Text className={dateTimeSeparatorStyle({})}> &middot; </Text>
              <Pressable onPress={() => setPickerTarget('endTime')}>
                <Text
                  className={dateTimeTextStyle({})}
                  style={showEndError ? { color: '#DC2626' } : undefined}
                >
                  {formatTime(endTime)}
                </Text>
              </Pressable>
            </HStack>
            {showEndError && endTimeError && (
              <Text className={errorTextStyle({})}>{endTimeError}</Text>
            )}
          </VStack>

          {(pickerTarget === 'endDate' || pickerTarget === 'endTime') && (
            <DateTimePicker
              value={endTime}
              mode={pickerTarget === 'endDate' ? 'date' : 'time'}
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              onChange={handleEndChange}
              minuteInterval={5}
            />
          )}

          <View className={dividerStyle({})} />

          {/* Description */}
          {!showDescription ? (
            <Pressable className="py-4" onPress={() => setShowDescription(true)}>
              <Text className={addDetailsStyle({})}>+ Add details</Text>
            </Pressable>
          ) : (
            <VStack className="py-4">
              <Text className={descriptionLabelStyle({})}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a description"
                placeholderTextColor="#A3A3A3"
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={4}
                autoFocus
              />
            </VStack>
          )}
        </VStack>
      </ScrollView>

      <CalendarPickerSheet
        visible={showCalendarPicker}
        calendars={writableCalendars}
        selectedCalendarId={selectedCalendarId}
        onSelect={handleCalendarSelect}
        onClose={() => setShowCalendarPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
