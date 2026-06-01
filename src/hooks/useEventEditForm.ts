import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useCallback, useState } from 'react';
import { Alert, Platform } from 'react-native';
import { ZodError } from 'zod';

import { type PickerTarget } from '@components/EditDateTimeRow';
import type { Event } from '@database/schema';
import { CreateEventSchema } from '@database/schemas';
import { useEventMutations } from '@hooks/useCalendarEvents';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';

interface DirtyState {
  editTitle: string;
  editDescription: string;
  editStartTime: Date;
  editEndTime: Date;
  editCalendarId: string | null;
}

function isFormDirty(state: DirtyState, event: Event): boolean {
  return (
    state.editTitle !== (event.title ?? '') ||
    state.editDescription !== (event.description ?? '') ||
    state.editStartTime.toISOString() !== new Date(event.start_time ?? '').toISOString() ||
    state.editEndTime.toISOString() !== new Date(event.end_time ?? '').toISOString() ||
    state.editCalendarId !== event.calendar_id
  );
}

function clearEndTimeError(prev: Record<string, string>): Record<string, string> {
  if (!prev.endTime) return prev;
  const next = { ...prev };
  delete next.endTime;
  return next;
}

/**
 * Owns all edit-mode state, validation, and handlers for EventDetailScreen.
 * Keeping it in a hook lets the screen body stay a thin orchestrator.
 */
export function useEventEditForm(event: Event | null) {
  const { updateEvent } = useEventMutations();
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);

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

  const exitEditMode = useCallback(() => {
    setIsEditing(false);
    setFormErrors({});
    setPickerTarget(null);
  }, []);

  const isDirty =
    isEditing && event
      ? isFormDirty(
          { editTitle, editDescription, editStartTime, editEndTime, editCalendarId },
          event
        )
      : false;

  const isValid = isEditing && editTitle.trim().length > 0 && editEndTime > editStartTime;

  const handleCancelEdit = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: exitEditMode },
      ]);
    } else {
      exitEditMode();
    }
  }, [isDirty, exitEditMode]);

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
          errors[field] ??= issue.message;
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

  const handleStartChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      const next = new Date(editStartTime);
      if (pickerTarget === 'startDate') {
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      setEditStartTime(next);
      if (editEndTime <= next) setEditEndTime(new Date(next.getTime() + 60 * 60 * 1000));

      setFormErrors(clearEndTimeError);
    },
    [pickerTarget, editStartTime, editEndTime]
  );

  const handleEndChange = useCallback(
    (_event: DateTimePickerEvent, date?: Date) => {
      if (Platform.OS === 'android') setPickerTarget(null);
      if (!date) return;

      const next = new Date(editEndTime);
      if (pickerTarget === 'endDate') {
        next.setFullYear(date.getFullYear(), date.getMonth(), date.getDate());
      } else {
        next.setHours(date.getHours(), date.getMinutes(), 0, 0);
      }
      setEditEndTime(next);

      setFormErrors(clearEndTimeError);
    },
    [pickerTarget, editEndTime]
  );

  const handleCalendarSelect = useCallback((cal: WritableCalendar) => {
    setEditCalendarId(cal.id);
    setShowCalendarPicker(false);
  }, []);

  return {
    writableCalendars,
    isEditing,
    isSaving,
    isDirty,
    isValid,
    editTitle,
    setEditTitle,
    editDescription,
    setEditDescription,
    editStartTime,
    editEndTime,
    editCalendarId,
    pickerTarget,
    setPickerTarget,
    formErrors,
    showCalendarPicker,
    setShowCalendarPicker,
    enterEditMode,
    handleCancelEdit,
    handleSaveEdit,
    handleStartChange,
    handleEndChange,
    handleCalendarSelect,
  };
}

export type EventEditForm = ReturnType<typeof useEventEditForm>;
export type { PickerTarget };
