import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ZodError } from 'zod';

import type { PickerTarget } from '@/types/eventForm';
import { CreateEventSchema } from '@database/schemas';
import { useEventMutations } from '@hooks/useCalendarEvents';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';

function getNextWholeHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function clearEndTimeError(prev: Record<string, string>): Record<string, string> {
  if (!prev.endTime) return prev;
  const next = { ...prev };
  delete next.endTime;
  return next;
}

/**
 * Owns all state, validation, and handlers for CreateEventScreen.
 * `onDone` is invoked after a successful save or a confirmed close.
 */
export function useCreateEventForm(onDone: () => void) {
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);
  const { createEvent } = useEventMutations();

  const defaultStart = useMemo(() => getNextWholeHour(), []);
  const defaultEnd = useMemo(() => addHours(defaultStart, 1), [defaultStart]);

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

  const calendar =
    writableCalendars.find((c) => c.id === selectedCalendarId) ?? writableCalendars.at(0);

  useEffect(() => {
    if (!selectedCalendarId && writableCalendars.length > 0) {
      setSelectedCalendarId(writableCalendars[0]!.id);
    }
  }, [selectedCalendarId, writableCalendars]);

  const isDirty =
    title.trim() !== '' ||
    description.trim() !== '' ||
    startTime.getTime() !== defaultStart.getTime() ||
    endTime.getTime() !== defaultEnd.getTime();

  const isValid = title.trim().length > 0 && endTime > startTime;

  const endTimeError =
    formErrors.endTime ?? (endTime <= startTime ? 'End time must be after start time' : undefined);
  const showEndError = !!formErrors.endTime;

  const handleCalendarSelect = useCallback((cal: WritableCalendar) => {
    setSelectedCalendarId(cal.id);
    setShowCalendarPicker(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: onDone },
      ]);
    } else {
      onDone();
    }
  }, [isDirty, onDone]);

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
          errors[field] ??= issue.message;
        });
        setFormErrors(errors);
      }
      return;
    }

    setIsSaving(true);
    try {
      const trimmedDescription = description.trim();
      await createEvent({
        calendarId: calendar.id,
        createdByUserId: authUser.id,
        title: title.trim(),
        ...(trimmedDescription ? { description: trimmedDescription } : {}),
        startTime: startTime.toISOString(),
        endTime: endTime.toISOString(),
      });
      onDone();
    } finally {
      setIsSaving(false);
    }
  }, [calendar, authUser, isSaving, title, description, startTime, endTime, createEvent, onDone]);

  const handleStartChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      const next = new Date(startTime);
      if (pickerTarget === 'startDate') {
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      setStartTime(next);
      if (endTime <= next) setEndTime(addHours(next, 1));

      setFormErrors(clearEndTimeError);
    },
    [pickerTarget, startTime, endTime]
  );

  const handleEndChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      const next = new Date(endTime);
      if (pickerTarget === 'endDate') {
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      setEndTime(next);

      setFormErrors(clearEndTimeError);
    },
    [pickerTarget, endTime]
  );

  return {
    writableCalendars,
    calendar,
    title,
    setTitle,
    description,
    setDescription,
    startTime,
    endTime,
    showDescription,
    setShowDescription,
    pickerTarget,
    setPickerTarget,
    selectedCalendarId,
    showCalendarPicker,
    setShowCalendarPicker,
    isValid,
    isSaving,
    endTimeError,
    showEndError,
    handleCalendarSelect,
    handleClose,
    handleSave,
    handleStartChange,
    handleEndChange,
  };
}

export type CreateEventForm = ReturnType<typeof useCreateEventForm>;
