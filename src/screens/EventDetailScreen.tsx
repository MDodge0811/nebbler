import { useCallback, useEffect, useState } from 'react';
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
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { HStack } from '@/components/ui/hstack';
import { VStack } from '@/components/ui/vstack';
import { Pressable } from '@/components/ui/pressable';
import { useEventDetail } from '@hooks/useEventDetail';
import { useEventMutations } from '@hooks/useCalendarEvents';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { CalendarPickerSheet } from '@components/CalendarPickerSheet';
import { CreateEventSchema } from '@database/schemas';
import { getCalendarColor } from '@utils/calendarColor';
import { formatEventDateTime, formatDateShort, formatTime } from '@utils/formatTime';
import type { RootStackParamList } from '@navigation/types';
import { ZodError } from 'zod';

// --- Styles ---

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
const valueStyle = tva({ base: 'mt-1 text-base text-typography-900' });
const dateTimeTextStyle = tva({ base: 'text-base text-typography-900' });
const dateTimeSeparatorStyle = tva({ base: 'text-base text-typography-400' });
const dividerStyle = tva({ base: 'h-px bg-outline-200' });
const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
const chevronStyle = tva({ base: 'text-base text-typography-400' });
const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  calendarDot: { width: 10, height: 10, borderRadius: 5 },
  busyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
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
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center' as const,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
});

type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;

// --- Component ---

export function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EventDetail'>>();
  const { eventId } = route.params;

  const { event, calendar, creator, permissions } = useEventDetail(eventId);
  const { updateEvent, deleteEvent } = useEventMutations();
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);

  // --- Edit mode state ---
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartTime, setEditStartTime] = useState(new Date());
  const [editEndTime, setEditEndTime] = useState(new Date());
  const [editCalendarId, setEditCalendarId] = useState<string | null>(null);
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  // Navigate back if event becomes null (deleted by another client)
  useEffect(() => {
    if (event === null && !isEditing) {
      // Small delay to avoid navigation during render
      const timer = setTimeout(() => {
        Alert.alert('Event Deleted', 'This event has been deleted.');
        navigation.goBack();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [event, isEditing, navigation]);

  // --- Edit mode helpers ---

  const enterEditMode = useCallback(() => {
    if (!event) return;
    setEditTitle(event.title ?? '');
    setEditDescription(event.description ?? '');
    setEditStartTime(new Date(event.start_time ?? new Date()));
    setEditEndTime(new Date(event.end_time ?? new Date()));
    setEditCalendarId(event.calendar_id);
    setFormErrors({});
    setPickerTarget(null);
    setIsEditing(true);
  }, [event]);

  const isDirty =
    isEditing && event
      ? editTitle !== (event.title ?? '') ||
        editDescription !== (event.description ?? '') ||
        editStartTime.toISOString() !== new Date(event.start_time ?? '').toISOString() ||
        editEndTime.toISOString() !== new Date(event.end_time ?? '').toISOString() ||
        editCalendarId !== event.calendar_id
      : false;

  const isValid = isEditing && editTitle.trim().length > 0 && editEndTime > editStartTime;

  const handleCancelEdit = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            setIsEditing(false);
            setFormErrors({});
            setPickerTarget(null);
          },
        },
      ]);
    } else {
      setIsEditing(false);
      setFormErrors({});
      setPickerTarget(null);
    }
  }, [isDirty]);

  const handleSaveEdit = useCallback(async () => {
    if (!event || isSaving) return;

    try {
      CreateEventSchema.parse({
        title: editTitle,
        calendarId: editCalendarId,
        startTime: editStartTime,
        endTime: editEndTime,
        description: editDescription || undefined,
      });
      setFormErrors({});
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = String(issue.path[0]);
          if (!errors[field]) errors[field] = issue.message;
        });
        setFormErrors(errors);
      }
      return;
    }

    setIsSaving(true);
    try {
      await updateEvent(event.id, {
        title: editTitle.trim(),
        description: editDescription.trim() || null,
        start_time: editStartTime.toISOString(),
        end_time: editEndTime.toISOString(),
        calendar_id: editCalendarId,
      });
      setIsEditing(false);
      setFormErrors({});
      setPickerTarget(null);
    } finally {
      setIsSaving(false);
    }
  }, [
    event,
    isSaving,
    editTitle,
    editDescription,
    editStartTime,
    editEndTime,
    editCalendarId,
    updateEvent,
  ]);

  const handleDelete = useCallback(() => {
    if (!event) {
      Alert.alert('Already Deleted', 'This event was already deleted.');
      navigation.goBack();
      return;
    }

    Alert.alert(`Delete "${event.title}"?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteEvent(event.id);
          navigation.goBack();
        },
      },
    ]);
  }, [event, deleteEvent, navigation]);

  // --- Date/time picker handlers (edit mode) ---

  const handleStartChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      if (pickerTarget === 'startDate') {
        const next = new Date(editStartTime);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setEditStartTime(next);
        if (editEndTime <= next) setEditEndTime(new Date(next.getTime() + 60 * 60 * 1000));
      } else {
        const next = new Date(editStartTime);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setEditStartTime(next);
        if (editEndTime <= next) setEditEndTime(new Date(next.getTime() + 60 * 60 * 1000));
      }

      setFormErrors((prev) => {
        if (!prev.endTime) return prev;
        const next = { ...prev };
        delete next.endTime;
        return next;
      });
    },
    [pickerTarget, editStartTime, editEndTime]
  );

  const handleEndChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      if (pickerTarget === 'endDate') {
        const next = new Date(editEndTime);
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
        setEditEndTime(next);
      } else {
        const next = new Date(editEndTime);
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
        setEditEndTime(next);
      }

      setFormErrors((prev) => {
        if (!prev.endTime) return prev;
        const next = { ...prev };
        delete next.endTime;
        return next;
      });
    },
    [pickerTarget, editEndTime]
  );

  const handleCalendarSelect = useCallback((cal: WritableCalendar) => {
    setEditCalendarId(cal.id);
    setShowCalendarPicker(false);
  }, []);

  const endTimeError =
    formErrors.endTime ||
    (isEditing && editEndTime <= editStartTime ? 'End time must be after start time' : undefined);
  const showEndError = !!formErrors.endTime;

  // --- Header configuration ---

  useEffect(() => {
    if (isEditing) {
      navigation.setOptions({
        title: 'Edit Event',
        headerLeft: () => (
          <RNPressable onPress={handleCancelEdit} hitSlop={8}>
            <RNText style={{ fontSize: 16, color: '#666666' }}>Cancel</RNText>
          </RNPressable>
        ),
        headerRight: () => (
          <RNPressable onPress={handleSaveEdit} disabled={!isValid || isSaving} hitSlop={8}>
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
    } else {
      navigation.setOptions({
        title: 'Event Details',
        headerLeft: () => (
          <RNPressable onPress={() => navigation.goBack()} hitSlop={8}>
            <RNText style={{ fontSize: 16, color: '#666666' }}>{'\u2039'} Back</RNText>
          </RNPressable>
        ),
        headerRight: () =>
          permissions.canEdit && !permissions.isFreeBusy ? (
            <RNPressable onPress={enterEditMode} hitSlop={8}>
              <RNText style={{ fontSize: 16, fontWeight: '600', color: '#00DB74' }}>Edit</RNText>
            </RNPressable>
          ) : null,
      });
    }
  }, [
    navigation,
    isEditing,
    isValid,
    isSaving,
    permissions.canEdit,
    permissions.isFreeBusy,
    handleCancelEdit,
    handleSaveEdit,
    enterEditMode,
  ]);

  // --- Render ---

  if (!event) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-0">
        <Text className="text-base text-typography-400">Loading...</Text>
      </Box>
    );
  }

  const calendarColor = calendar ? getCalendarColor(calendar.id) : '#00DB74';

  // Free/busy mode — show minimal info
  if (permissions.isFreeBusy) {
    return (
      <Box className={containerStyle({})}>
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <VStack className="px-4 pt-4">
            {/* Calendar dot */}
            <HStack className="items-center py-4">
              <View
                style={[styles.calendarDot, { backgroundColor: calendarColor, marginRight: 10 }]}
              />
              <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Calendar'}</Text>
            </HStack>
            <View className={dividerStyle({})} />

            {/* Time */}
            <VStack className="py-4">
              <Text className={sectionLabelStyle({})}>Time</Text>
              <Text className={valueStyle({})}>
                {event.start_time && event.end_time
                  ? formatEventDateTime(event.start_time, event.end_time)
                  : ''}
              </Text>
            </VStack>
            <View className={dividerStyle({})} />

            {/* Busy badge */}
            <VStack className="items-start py-4">
              <View style={styles.busyBadge}>
                <Text className="text-sm text-typography-600">Busy</Text>
              </View>
            </VStack>
          </VStack>
        </ScrollView>
      </Box>
    );
  }

  // --- Edit mode ---
  if (isEditing) {
    const editCalendar = writableCalendars.find((c) => c.id === editCalendarId);

    return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className={containerStyle({})}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <VStack className="px-4 pt-4">
            {/* Title */}
            <TextInput
              style={styles.titleInput}
              placeholder="Event title"
              placeholderTextColor="#A3A3A3"
              value={editTitle}
              onChangeText={setEditTitle}
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
                      backgroundColor: editCalendar
                        ? getCalendarColor(editCalendar.id)
                        : calendarColor,
                      marginRight: 10,
                    },
                  ]}
                />
                <Text className={calendarNameStyle({})}>
                  {editCalendar?.name ?? calendar?.name ?? 'Calendar'}
                </Text>
                <Text className={chevronStyle({})}>&#x203A;</Text>
              </HStack>
            </Pressable>
            <View className={dividerStyle({})} />

            {/* Start date/time */}
            <VStack className="py-4">
              <Text className={sectionLabelStyle({})}>Starts</Text>
              <HStack className="mt-1 items-center">
                <Pressable onPress={() => setPickerTarget('startDate')}>
                  <Text className={dateTimeTextStyle({})}>{formatDateShort(editStartTime)}</Text>
                </Pressable>
                <Text className={dateTimeSeparatorStyle({})}> &middot; </Text>
                <Pressable onPress={() => setPickerTarget('startTime')}>
                  <Text className={dateTimeTextStyle({})}>{formatTime(editStartTime)}</Text>
                </Pressable>
              </HStack>
            </VStack>

            {(pickerTarget === 'startDate' || pickerTarget === 'startTime') && (
              <DateTimePicker
                value={editStartTime}
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
                    {formatDateShort(editEndTime)}
                  </Text>
                </Pressable>
                <Text className={dateTimeSeparatorStyle({})}> &middot; </Text>
                <Pressable onPress={() => setPickerTarget('endTime')}>
                  <Text
                    className={dateTimeTextStyle({})}
                    style={showEndError ? { color: '#DC2626' } : undefined}
                  >
                    {formatTime(editEndTime)}
                  </Text>
                </Pressable>
              </HStack>
              {showEndError && endTimeError && (
                <Text className={errorTextStyle({})}>{endTimeError}</Text>
              )}
            </VStack>

            {(pickerTarget === 'endDate' || pickerTarget === 'endTime') && (
              <DateTimePicker
                value={editEndTime}
                mode={pickerTarget === 'endDate' ? 'date' : 'time'}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={handleEndChange}
                minuteInterval={5}
              />
            )}

            <View className={dividerStyle({})} />

            {/* Description */}
            <VStack className="py-4">
              <Text className={sectionLabelStyle({})}>Description</Text>
              <TextInput
                style={styles.descriptionInput}
                placeholder="Add a description"
                placeholderTextColor="#A3A3A3"
                value={editDescription}
                onChangeText={setEditDescription}
                multiline
                numberOfLines={4}
              />
            </VStack>
          </VStack>
        </ScrollView>

        <CalendarPickerSheet
          visible={showCalendarPicker}
          calendars={writableCalendars}
          selectedCalendarId={editCalendarId}
          onSelect={handleCalendarSelect}
          onClose={() => setShowCalendarPicker(false)}
        />
      </KeyboardAvoidingView>
    );
  }

  // --- View mode ---
  return (
    <Box className={containerStyle({})}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <VStack className="px-4 pt-4">
          {/* Title */}
          <VStack className="py-4">
            <Text className="text-xl font-bold text-typography-900">{event.title}</Text>
          </VStack>
          <View className={dividerStyle({})} />

          {/* Calendar */}
          <HStack className="items-center py-4">
            <View
              style={[styles.calendarDot, { backgroundColor: calendarColor, marginRight: 10 }]}
            />
            <Text className={calendarNameStyle({})}>{calendar?.name ?? 'Calendar'}</Text>
          </HStack>
          <View className={dividerStyle({})} />

          {/* Creator */}
          {creator && (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Created by</Text>
                <Text className={valueStyle({})}>
                  {creator.display_name ||
                    `${creator.first_name ?? ''} ${creator.last_name ?? ''}`.trim() ||
                    creator.email}
                </Text>
              </VStack>
              <View className={dividerStyle({})} />
            </>
          )}

          {/* Date/time */}
          <VStack className="py-4">
            <Text className={sectionLabelStyle({})}>Date & Time</Text>
            <Text className={valueStyle({})}>
              {event.start_time && event.end_time
                ? formatEventDateTime(event.start_time, event.end_time)
                : ''}
            </Text>
          </VStack>
          <View className={dividerStyle({})} />

          {/* Description */}
          {event.description ? (
            <>
              <VStack className="py-4">
                <Text className={sectionLabelStyle({})}>Description</Text>
                <Text className={valueStyle({})}>{event.description}</Text>
              </VStack>
              <View className={dividerStyle({})} />
            </>
          ) : null}
        </VStack>

        {/* Delete button */}
        {permissions.canDelete && (
          <RNPressable style={styles.deleteButton} onPress={handleDelete}>
            <RNText style={styles.deleteButtonText}>Delete Event</RNText>
          </RNPressable>
        )}
      </ScrollView>
    </Box>
  );
}
