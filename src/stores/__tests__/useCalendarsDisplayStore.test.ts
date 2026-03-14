import { useCalendarsDisplayStore } from '../useCalendarsDisplayStore';

describe('useCalendarsDisplayStore', () => {
  beforeEach(() => {
    useCalendarsDisplayStore.setState({
      hiddenCalendarIds: {},
    });
  });

  describe('toggleCalendar', () => {
    it('hides a visible calendar', () => {
      useCalendarsDisplayStore.getState().toggleCalendar('cal-1');
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('cal-1')).toBe(false);
    });

    it('shows a hidden calendar', () => {
      useCalendarsDisplayStore.getState().toggleCalendar('cal-1');
      useCalendarsDisplayStore.getState().toggleCalendar('cal-1');
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('cal-1')).toBe(true);
    });

    it('does not affect other calendars', () => {
      useCalendarsDisplayStore.getState().toggleCalendar('cal-1');
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('cal-2')).toBe(true);
    });
  });

  describe('isCalendarVisible', () => {
    it('returns true for calendars not in hiddenCalendarIds', () => {
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('any-id')).toBe(true);
    });

    it('returns false for hidden calendars', () => {
      useCalendarsDisplayStore.setState({ hiddenCalendarIds: { 'cal-1': true } });
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('cal-1')).toBe(false);
    });
  });

  describe('setGroupVisibility', () => {
    it('hides all calendars in a batch', () => {
      useCalendarsDisplayStore.getState().setGroupVisibility(['cal-1', 'cal-2', 'cal-3'], false);
      const state = useCalendarsDisplayStore.getState();
      expect(state.isCalendarVisible('cal-1')).toBe(false);
      expect(state.isCalendarVisible('cal-2')).toBe(false);
      expect(state.isCalendarVisible('cal-3')).toBe(false);
    });

    it('shows all calendars in a batch', () => {
      useCalendarsDisplayStore.setState({
        hiddenCalendarIds: { 'cal-1': true, 'cal-2': true },
      });
      useCalendarsDisplayStore.getState().setGroupVisibility(['cal-1', 'cal-2'], true);
      const state = useCalendarsDisplayStore.getState();
      expect(state.isCalendarVisible('cal-1')).toBe(true);
      expect(state.isCalendarVisible('cal-2')).toBe(true);
    });

    it('does not affect calendars outside the batch', () => {
      useCalendarsDisplayStore.setState({ hiddenCalendarIds: { 'cal-other': true } });
      useCalendarsDisplayStore.getState().setGroupVisibility(['cal-1', 'cal-2'], false);
      expect(useCalendarsDisplayStore.getState().isCalendarVisible('cal-other')).toBe(false);
    });
  });
});
