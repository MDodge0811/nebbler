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

/** Immutable snapshot of the form's original values, captured once at init. */
interface OriginalSnapshot {
  title: string;
  description: string;
  peopleIds: string[];
  location: string | null;
  startTime: number;
  endTime: number;
  calendarId: string | null;
  isAllDay: boolean;
  showAs: ShowAs;
}

/** Live form values compared against the original snapshot to derive dirtiness. */
interface DirtyInput {
  title: string;
  description: string;
  peopleIds: string[];
  location: string | null;
  startTime: Date;
  endTime: Date;
  calendarId: string | null;
  isAllDay: boolean;
  showAs: ShowAs;
}

/** Compare two id lists ignoring order (set semantics). */
function sameIds(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const setB = new Set(b);
  return a.every((id) => setB.has(id));
}

/** Whether any live field differs from the captured original snapshot. */
function computeIsDirty(s: DirtyInput, original: OriginalSnapshot): boolean {
  return (
    s.title.trim() !== original.title.trim() ||
    s.description.trim() !== original.description.trim() ||
    !sameIds(s.peopleIds, original.peopleIds) ||
    s.location !== original.location ||
    s.startTime.getTime() !== original.startTime ||
    s.endTime.getTime() !== original.endTime ||
    s.calendarId !== original.calendarId ||
    s.isAllDay !== original.isAllDay ||
    s.showAs !== original.showAs
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

  // Baseline of the form's original values. `isDirty` is computed against this,
  // not the create-mode defaults, so a pristine edit (or create) is never dirty.
  const originalRef = useRef<OriginalSnapshot | null>(null);
  const [baselineReady, setBaselineReady] = useState(false);

  // Load + prefill the event being edited (edit mode only).
  const editEvent = useEventById(mode === 'edit' && routeEventId ? routeEventId : undefined);
  const prefilledRef = useRef(false);
  useEffect(() => {
    if (mode !== 'edit' || prefilledRef.current || !editEvent) return;
    prefilledRef.current = true;
    const nextTitle = editEvent.title ?? '';
    const nextDescription = editEvent.description ?? '';
    const nextCalendarId = editEvent.calendar_id ?? null;
    const nextStart = editEvent.start_time ? new Date(editEvent.start_time) : startTime;
    const nextEnd = editEvent.end_time ? new Date(editEvent.end_time) : endTime;
    const nextIsAllDay = editEvent.is_all_day === 1;
    const nextShowAs: ShowAs = editEvent.show_as === 'free' ? 'free' : 'busy';
    setTitle(nextTitle);
    setDescription(nextDescription);
    setCalendarId(nextCalendarId);
    setStartTime(nextStart);
    setEndTime(nextEnd);
    setIsAllDay(nextIsAllDay);
    setShowAs(nextShowAs);
    // Capture the baseline from the prefilled values so a pristine edit isn't dirty.
    originalRef.current = {
      title: nextTitle,
      description: nextDescription,
      peopleIds: [...peopleIds],
      location,
      startTime: nextStart.getTime(),
      endTime: nextEnd.getTime(),
      calendarId: nextCalendarId,
      isAllDay: nextIsAllDay,
      showAs: nextShowAs,
    };
    setBaselineReady(true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, editEvent]);

  // Default the calendar to the first writable one in create mode if none chosen,
  // then capture the create-mode baseline once (from the resolved initial values).
  useEffect(() => {
    if (mode !== 'create') return;
    let resolvedCalendarId = calendarId;
    if (!resolvedCalendarId) {
      const first = writableCalendars[0];
      if (first) {
        resolvedCalendarId = first.id;
        setCalendarId(first.id);
      }
    }
    if (originalRef.current === null) {
      originalRef.current = {
        title,
        description,
        peopleIds: [...peopleIds],
        location,
        startTime: startTime.getTime(),
        endTime: endTime.getTime(),
        calendarId: resolvedCalendarId,
        isAllDay,
        showAs,
      };
      setBaselineReady(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, calendarId, writableCalendars]);

  const isScreen1Valid = title.trim().length > 0 && !!calendarId;
  const isScreen2Valid = endTime > startTime;
  const endTimeError = endTime <= startTime ? 'End time must be after start time' : undefined;

  // `baselineReady` is read so isDirty recomputes on the render that first sets
  // the ref-stored baseline; the ref itself wouldn't trigger a re-render.
  const isDirty =
    !baselineReady || originalRef.current === null
      ? false
      : computeIsDirty(
          {
            title,
            description,
            peopleIds,
            location,
            startTime,
            endTime,
            calendarId,
            isAllDay,
            showAs,
          },
          originalRef.current
        );

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

    if (!newEventId) {
      throw new Error('Event created but no id returned — invites not written');
    }
    for (const personId of peopleIds) {
      await createResponse(newEventId, personId, 'pending');
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
