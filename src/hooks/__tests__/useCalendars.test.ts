import { renderHook } from '@testing-library/react-native';
import { useCalendarMutations } from '../useCalendars';

const mockExecute = jest.fn();
const mockWriteTransaction = jest.fn();

jest.mock('@powersync/react', () => ({
  usePowerSync: () => ({ execute: mockExecute, writeTransaction: mockWriteTransaction }),
}));

describe('useCalendarMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [{ id: 'mock-uuid' }] } });
    mockWriteTransaction.mockImplementation(async (cb) => {
      const tx = { execute: mockExecute };
      return cb(tx);
    });
  });

  describe('createCalendar', () => {
    const attrs = {
      ownerId: 'user-1',
      type: 'private',
      name: 'My Calendar',
      description: 'Test description',
    };
    const ownerRoleId = 'role-1';

    it('calls writeTransaction', async () => {
      const { result } = renderHook(() => useCalendarMutations());
      await result.current.createCalendar(attrs, ownerRoleId);

      expect(mockWriteTransaction).toHaveBeenCalled();
    });

    it('first INSERT uses uuid() and RETURNING id', async () => {
      const { result } = renderHook(() => useCalendarMutations());
      await result.current.createCalendar(attrs, ownerRoleId);

      const firstSql = mockExecute.mock.calls[0][0] as string;
      expect(firstSql).toEqual(expect.stringContaining('uuid()'));
      expect(firstSql).toEqual(expect.stringContaining('RETURNING id'));
    });

    it('second INSERT uses captured id as calendar_id FK', async () => {
      const { result } = renderHook(() => useCalendarMutations());
      await result.current.createCalendar(attrs, ownerRoleId);

      const secondParams = mockExecute.mock.calls[1][1] as unknown[];
      expect(secondParams[0]).toBe('mock-uuid');
    });

    it('second INSERT uses uuid() for its own id', async () => {
      const { result } = renderHook(() => useCalendarMutations());
      await result.current.createCalendar(attrs, ownerRoleId);

      const secondSql = mockExecute.mock.calls[1][0] as string;
      expect(secondSql).toEqual(expect.stringContaining('uuid()'));
    });

    it('returns the calendar id', async () => {
      const { result } = renderHook(() => useCalendarMutations());
      const id = await result.current.createCalendar(attrs, ownerRoleId);

      expect(id).toBe('mock-uuid');
    });
  });
});
