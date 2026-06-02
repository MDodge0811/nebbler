/**
 * Shared types for the event create/edit forms.
 *
 * `PickerTarget` lives here (a leaf `type` module) rather than in
 * `@components/EditDateTimeRow` so the form hooks (`useCreateEventForm`,
 * `useEventEditForm`) can import it without a hook → component dependency.
 */

/** Which date/time field the inline native picker is currently editing. */
export type PickerTarget = 'startDate' | 'startTime' | 'endDate' | 'endTime' | null;
