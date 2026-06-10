import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import { useEventById, useEventMutations } from '@hooks/useCalendarEvents';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useEventResponseMutations } from '@hooks/useEventResponses';
import { useWritableCalendars } from '@hooks/useWritableCalendars';

export type ShowAs = 'busy' | 'free';

/** Route params accepted by the CreateEvent flow shell. */
export interface CreateEventRouteParams {
  mode?: 'create' | 'edit';
  eventId?: string;
  preselectedCalendarId?: string;
  preselectedPeople?: string[];
  socialContext?: { calendarId: string };
}

/** Full form state + setters shared by Screen 1 and Screen 2. */
export interface CreateEventFormValue {
  calendarId: string | null;
  setCalendarId: (id: string | null) => void;
  title: string;
  setTitle: (v: string) => void;
  description: string;
  setDescription: (v: string) => void;
  location: string | null;
  setLocation: (v: string | null) => void;
  peopleIds: string[];
  setPeopleIds: (ids: string[]) => void;
  startTime: Date;
  setStartTime: (d: Date) => void;
  endTime: Date;
  setEndTime: (d: Date) => void;
  isAllDay: boolean;
  setIsAllDay: (v: boolean) => void;
  rrule: string | null;
  setRrule: (v: string | null) => void;
  showAs: ShowAs;
  setShowAs: (v: ShowAs) => void;
  reminderMinutes: number | null;
  setReminderMinutes: (v: number | null) => void;
  mode: 'create' | 'edit';
  eventId: string | null;
  // Derived
  isScreen1Valid: boolean;
  isScreen2Valid: boolean;
  isDirty: boolean;
  endTimeError: string | undefined;
  // Actions
  save: () => Promise<void>;
}

function getNextWholeHour(): Date {
  const d = new Date();
  d.setMinutes(0, 0, 0);
  d.setHours(d.getHours() + 1);
  return d;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

/** Normalize a date to the start of its calendar day (local). */
function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

/** Normalize a date to the end of its calendar day (local). */
function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

interface DirtyInput {
  title: string;
  description: string;
  peopleIds: string[];
  location: string | null;
  startTime: Date;
  endTime: Date;
  defaultStart: Date;
  defaultEnd: Date;
}

/** Whether the user has touched any field away from its create-mode default. */
function computeIsDirty(s: DirtyInput): boolean {
  return (
    s.title.trim() !== '' ||
    s.description.trim() !== '' ||
    s.peopleIds.length > 0 ||
    s.location !== null ||
    s.startTime.getTime() !== s.defaultStart.getTime() ||
    s.endTime.getTime() !== s.defaultEnd.getTime()
  );
}

const CreateEventFormContext = createContext<CreateEventFormValue | null>(null);

interface ProviderProps {
  params: CreateEventRouteParams | undefined;
  children: ReactNode;
}

/** Resolve `mode` + initial ids from the route params (pure). */
function resolveInitial(params: CreateEventRouteParams | undefined) {
  return {
    mode: params?.mode === 'edit' ? ('edit' as const) : ('create' as const),
    routeEventId: params?.eventId ?? null,
    initialCalendarId: params?.preselectedCalendarId ?? params?.socialContext?.calendarId ?? null,
    initialPeople: params?.preselectedPeople ?? [],
  };
}

/**
 * Owns the entire CreateEvent form state. Mounted once by the shell so Screen 1
 * and Screen 2 share a single state object (bidirectional nav preserves inputs).
 */
export function CreateEventFormProvider({ params, children }: ProviderProps) {
  const { authUser } = useCurrentUser();
  const currentUserId = authUser?.id;
  const { data: writableCalendars = [] } = useWritableCalendars(currentUserId);
  const { createEvent, updateEvent } = useEventMutations();
  const { createResponse } = useEventResponseMutations();

  const { mode, routeEventId, initialCalendarId, initialPeople } = useMemo(
    () => resolveInitial(params),
    [params]
  );

  const defaultStart = useMemo(() => getNextWholeHour(), []);
  const defaultEnd = useMemo(() => addHours(defaultStart, 1), [defaultStart]);

  const [calendarId, setCalendarId] = useState<string | null>(initialCalendarId);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState<string | null>(null);
  const [peopleIds, setPeopleIds] = useState<string[]>(initialPeople);
  const [startTime, setStartTime] = useState<Date>(defaultStart);
  const [endTime, setEndTime] = useState<Date>(defaultEnd);
  const [isAllDay, setIsAllDay] = useState(false);
  const [rrule, setRrule] = useState<string | null>(null);
  const [showAs, setShowAs] = useState<ShowAs>('busy');
  const [reminderMinutes, setReminderMinutes] = useState<number | null>(null);

  // Load + prefill the event being edited (edit mode only).
  const editEvent = useEventById(mode === 'edit' && routeEventId ? routeEventId : undefined);
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (mode !== 'edit' || prefilledRef.current || !editEvent) return;
    prefilledRef.current = true;
    setTitle(editEvent.title ?? '');
    setDescription(editEvent.description ?? '');
    setCalendarId(editEvent.calendar_id ?? null);
    if (editEvent.start_time) setStartTime(new Date(editEvent.start_time));
    if (editEvent.end_time) setEndTime(new Date(editEvent.end_time));
    setIsAllDay(editEvent.is_all_day === 1);
    setShowAs(editEvent.show_as === 'free' ? 'free' : 'busy');
  }, [mode, editEvent]);

  // Default the calendar to the first writable one in create mode if none chosen.
  useEffect(() => {
    if (mode !== 'create' || calendarId) return;
    const first = writableCalendars[0];
    if (first) setCalendarId(first.id);
  }, [mode, calendarId, writableCalendars]);

  const isScreen1Valid = title.trim().length > 0 && !!calendarId;
  const isScreen2Valid = endTime > startTime;
  const endTimeError = endTime <= startTime ? 'End time must be after start time' : undefined;

  const isDirty = computeIsDirty({
    title,
    description,
    peopleIds,
    location,
    startTime,
    endTime,
    defaultStart,
    defaultEnd,
  });

  const save = useCallback(async () => {
    if (!currentUserId || !calendarId) {
      throw new Error('Missing user or calendar');
    }

    const start = isAllDay ? startOfDay(startTime) : startTime;
    const end = isAllDay ? endOfDay(endTime) : endTime;
    const trimmedTitle = title.trim();
    const trimmedDescription = description.trim();

    if (mode === 'edit' && routeEventId) {
      await updateEvent(routeEventId, {
        title: trimmedTitle,
        description: trimmedDescription || null,
        calendar_id: calendarId,
        start_time: start.toISOString(),
        end_time: end.toISOString(),
        is_all_day: isAllDay ? 1 : 0,
        show_as: showAs,
      });
      return;
    }

    const newEventId = await createEvent({
      calendarId,
      createdByUserId: currentUserId,
      title: trimmedTitle,
      ...(trimmedDescription ? { description: trimmedDescription } : {}),
      startTime: start.toISOString(),
      endTime: end.toISOString(),
      isAllDay,
      showAs,
    });

    if (newEventId) {
      for (const personId of peopleIds) {
        await createResponse(newEventId, personId, 'pending');
      }
    }
  }, [
    currentUserId,
    calendarId,
    isAllDay,
    startTime,
    endTime,
    title,
    description,
    mode,
    routeEventId,
    showAs,
    peopleIds,
    createEvent,
    updateEvent,
    createResponse,
  ]);

  const value = useMemo<CreateEventFormValue>(
    () => ({
      calendarId,
      setCalendarId,
      title,
      setTitle,
      description,
      setDescription,
      location,
      setLocation,
      peopleIds,
      setPeopleIds,
      startTime,
      setStartTime,
      endTime,
      setEndTime,
      isAllDay,
      setIsAllDay,
      rrule,
      setRrule,
      showAs,
      setShowAs,
      reminderMinutes,
      setReminderMinutes,
      mode,
      eventId: routeEventId,
      isScreen1Valid,
      isScreen2Valid,
      isDirty,
      endTimeError,
      save,
    }),
    [
      calendarId,
      title,
      description,
      location,
      peopleIds,
      startTime,
      endTime,
      isAllDay,
      rrule,
      showAs,
      reminderMinutes,
      mode,
      routeEventId,
      isScreen1Valid,
      isScreen2Valid,
      isDirty,
      endTimeError,
      save,
    ]
  );

  return (
    <CreateEventFormContext.Provider value={value}>{children}</CreateEventFormContext.Provider>
  );
}

/** Access the shared CreateEvent form state. Must be used within the provider. */
export function useCreateEventFormContext(): CreateEventFormValue {
  const ctx = useContext(CreateEventFormContext);
  if (!ctx) {
    throw new Error('useCreateEventFormContext must be used within CreateEventFormProvider');
  }
  return ctx;
}
