import { useCallback, useEffect, useRef, useState } from 'react';
import { ZodError } from 'zod';

import { CALENDAR_PALETTE } from '@constants/calendarsUI';
import type { Calendar } from '@database/schema';
import { UpdateCalendarSchema, type UpdateCalendarFormData } from '@database/schemas';
import { useCalendarMutations } from '@hooks/useCalendars';

export type CalendarToast = { kind: 'success' | 'error'; text: string } | null;

interface EditFlags {
  rsvp: boolean;
  discoverable: boolean;
  affectsAvailability: boolean;
}

function buildCalendarUpdates(
  parsed: UpdateCalendarFormData,
  calendar: Calendar,
  flags: EditFlags
): Partial<Omit<Calendar, 'id'>> {
  const updates: Partial<Omit<Calendar, 'id'>> = {
    name: parsed.name,
    ...(parsed.description !== undefined ? { description: parsed.description } : {}),
    ...(parsed.color !== undefined ? { color: parsed.color } : {}),
    rsvp_enabled: flags.rsvp ? 1 : 0,
    affects_availability: flags.affectsAvailability ? 1 : 0,
  };
  if (calendar.type === 'public') {
    updates.discoverable = flags.discoverable ? 1 : 0;
  }
  return updates;
}

/**
 * Owns edit-mode state, validation, toast feedback, and save/delete handlers for
 * CalendarDetailScreen. `onDeleted` fires after a successful delete so the screen
 * can navigate away.
 */
export function useCalendarEditForm(calendar: Calendar | null, onDeleted: () => void) {
  const { updateCalendar, deleteCalendar } = useCalendarMutations();

  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState<string>('');
  const [editRsvp, setEditRsvp] = useState(false);
  const [editDiscoverable, setEditDiscoverable] = useState(false);
  const [editAffectsAvailability, setEditAffectsAvailability] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<CalendarToast>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ kind, text });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const enterEditMode = useCallback(() => {
    if (!calendar) return;
    setEditName(calendar.name ?? '');
    setEditDescription(calendar.description ?? '');
    setEditColor(calendar.color ?? CALENDAR_PALETTE[0].hex);
    setEditRsvp(calendar.rsvp_enabled === 1);
    setEditDiscoverable(calendar.discoverable === 1);
    setEditAffectsAvailability(calendar.affects_availability !== 0);
    setMode('edit');
  }, [calendar]);

  const exitEditMode = useCallback(() => {
    setMode('view');
  }, []);

  const handleSave = useCallback(async () => {
    if (!calendar) return;
    let parsed: UpdateCalendarFormData;
    try {
      parsed = UpdateCalendarSchema.parse({
        name: editName,
        description: editDescription,
        color: editColor,
        rsvpEnabled: editRsvp,
        discoverable: editDiscoverable,
        affectsAvailability: editAffectsAvailability,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        showToast('error', e.issues[0]?.message ?? 'Invalid input.');
      }
      return;
    }

    const updates = buildCalendarUpdates(parsed, calendar, {
      rsvp: editRsvp,
      discoverable: editDiscoverable,
      affectsAvailability: editAffectsAvailability,
    });

    try {
      await updateCalendar(calendar.id, updates);
      setMode('view');
      showToast('success', 'Changes saved!');
    } catch {
      showToast('error', "Couldn't save changes. Try again.");
    }
  }, [
    calendar,
    editName,
    editDescription,
    editColor,
    editRsvp,
    editDiscoverable,
    editAffectsAvailability,
    updateCalendar,
    showToast,
  ]);

  const handleConfirmDelete = useCallback(async () => {
    if (!calendar) return;
    try {
      await deleteCalendar(calendar.id);
      setShowDeleteConfirm(false);
      // TODO: NEB-62 — drive a global toast on the CalendarsList screen ("{name} deleted.").
      onDeleted();
    } catch {
      setShowDeleteConfirm(false);
      showToast('error', "Couldn't delete calendar.");
    }
  }, [calendar, deleteCalendar, onDeleted, showToast]);

  const canSaveName = editName.trim().length > 0;

  return {
    mode,
    editName,
    setEditName,
    editDescription,
    setEditDescription,
    editColor,
    setEditColor,
    editRsvp,
    setEditRsvp,
    editDiscoverable,
    setEditDiscoverable,
    editAffectsAvailability,
    setEditAffectsAvailability,
    showDeleteConfirm,
    setShowDeleteConfirm,
    toast,
    canSaveName,
    showToast,
    enterEditMode,
    exitEditMode,
    handleSave,
    handleConfirmDelete,
  };
}

export type CalendarEditForm = ReturnType<typeof useCalendarEditForm>;
