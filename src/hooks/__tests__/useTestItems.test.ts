import { renderHook } from '@testing-library/react-native';
import { useTestItemMutations } from '../useTestItems';

const mockExecute = jest.fn();

jest.mock('@powersync/react', () => ({
  usePowerSync: () => ({ execute: mockExecute }),
}));

describe('useTestItemMutations', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockExecute.mockResolvedValue({ rows: { _array: [{ id: 'mock-uuid' }] } });
  });

  describe('createItem', () => {
    it('uses uuid() in SQL for id generation', async () => {
      const { result } = renderHook(() => useTestItemMutations());
      await result.current.createItem('Test', 'A test item');

      const sql = mockExecute.mock.calls[0][0] as string;
      expect(sql).toEqual(expect.stringContaining('uuid()'));
    });

    it('uses RETURNING id to capture the generated id', async () => {
      const { result } = renderHook(() => useTestItemMutations());
      await result.current.createItem('Test', 'A test item');

      const sql = mockExecute.mock.calls[0][0] as string;
      expect(sql).toEqual(expect.stringContaining('RETURNING id'));
    });

    it('does not pass an id value in params', async () => {
      const { result } = renderHook(() => useTestItemMutations());
      await result.current.createItem('Test', 'A test item');

      const params = mockExecute.mock.calls[0][1] as unknown[];
      // Params should be: [name, description, completed, inserted_at, updated_at]
      expect(params).toHaveLength(5);
      expect(params[0]).toBe('Test');
      expect(params[1]).toBe('A test item');
    });

    it('returns the id from the query result', async () => {
      const { result } = renderHook(() => useTestItemMutations());
      const id = await result.current.createItem('Test', 'A test item');

      expect(id).toBe('mock-uuid');
    });
  });
});
