import { renderHook } from '@testing-library/react-native';
import { useCalendarGroupMutations } from '../useCalendarGroups';

const mockExecute = jest.fn();
const mockWriteTransaction = jest.fn();

jest.mock('@powersync/react', () => ({
  usePowerSync: () => ({ execute: mockExecute, writeTransaction: mockWriteTransaction }),
}));

describe('useCalendarGroupMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [{ id: 'mock-uuid' }] } });
    mockWriteTransaction.mockImplementation(async (cb) => {
      const tx = { execute: mockExecute };
      return cb(tx);
    });
  });

  describe('createGroup (transaction pattern)', () => {
    it('calls writeTransaction', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.createGroup('user-1', 'My Group');

      expect(mockWriteTransaction).toHaveBeenCalled();
    });

    it('first INSERT uses uuid() and RETURNING id', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.createGroup('user-1', 'My Group');

      const firstSql = mockExecute.mock.calls[0][0] as string;
      expect(firstSql).toEqual(expect.stringContaining('uuid()'));
      expect(firstSql).toEqual(expect.stringContaining('RETURNING id'));
    });

    it('second INSERT uses captured id as calendar_group_id FK', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.createGroup('user-1', 'My Group');

      const secondParams = mockExecute.mock.calls[1][1] as unknown[];
      expect(secondParams[0]).toBe('mock-uuid');
    });

    it('second INSERT uses uuid() for its own id', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.createGroup('user-1', 'My Group');

      const secondSql = mockExecute.mock.calls[1][0] as string;
      expect(secondSql).toEqual(expect.stringContaining('uuid()'));
    });

    it('returns the group id', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      const id = await result.current.createGroup('user-1', 'My Group');

      expect(id).toBe('mock-uuid');
    });
  });

  describe('addCalendarToGroup (simple pattern)', () => {
    it('uses uuid() in SQL for id generation', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.addCalendarToGroup('group-1', 'cal-1');

      const sql = mockExecute.mock.calls[0][0] as string;
      expect(sql).toEqual(expect.stringContaining('uuid()'));
    });

    it('uses RETURNING id to capture the generated id', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.addCalendarToGroup('group-1', 'cal-1');

      const sql = mockExecute.mock.calls[0][0] as string;
      expect(sql).toEqual(expect.stringContaining('RETURNING id'));
    });

    it('does not pass an id value in params', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      await result.current.addCalendarToGroup('group-1', 'cal-1');

      const params = mockExecute.mock.calls[0][1] as unknown[];
      // Params should be: [groupId, calendarId, viewMode, inserted_at, updated_at]
      expect(params).toHaveLength(5);
      expect(params[0]).toBe('group-1');
      expect(params[1]).toBe('cal-1');
    });

    it('returns the id from the query result', async () => {
      const { result } = renderHook(() => useCalendarGroupMutations());
      const id = await result.current.addCalendarToGroup('group-1', 'cal-1');

      expect(id).toBe('mock-uuid');
    });
  });
});
