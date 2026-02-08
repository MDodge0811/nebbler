import { useQuery, usePowerSync } from '@powersync/react';
import type { TestItem } from '@database/schema';

/**
 * Hook to fetch all test items with real-time updates
 */
export function useTestItems() {
  return useQuery<TestItem>('SELECT * FROM test_items ORDER BY inserted_at DESC');
}

/**
 * Hook to fetch a single test item by ID
 */
export function useTestItem(id: string) {
  return useQuery<TestItem>('SELECT * FROM test_items WHERE id = ?', [id]);
}

/**
 * Hook providing CRUD operations for test items
 */
export function useTestItemMutations() {
  const powerSync = usePowerSync();

  const createItem = async (name: string, description: string) => {
    const id = generateUUID();
    const now = new Date().toISOString();

    await powerSync.execute(
      `INSERT INTO test_items (id, name, description, completed, inserted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [id, name, description, 0, now, now]
    );

    return id;
  };

  const updateItem = async (id: string, updates: Partial<Omit<TestItem, 'id'>>) => {
    const setClauses: string[] = [];
    const values: (string | number | null)[] = [];

    if (updates.name !== undefined && updates.name !== null) {
      setClauses.push('name = ?');
      values.push(updates.name);
    }
    if (updates.description !== undefined && updates.description !== null) {
      setClauses.push('description = ?');
      values.push(updates.description);
    }
    if (updates.completed !== undefined && updates.completed !== null) {
      setClauses.push('completed = ?');
      values.push(updates.completed);
    }

    values.push(id);

    await powerSync.execute(`UPDATE test_items SET ${setClauses.join(', ')} WHERE id = ?`, values);
  };

  const deleteItem = async (id: string) => {
    await powerSync.execute('DELETE FROM test_items WHERE id = ?', [id]);
  };

  const toggleComplete = async (id: string, currentValue: number) => {
    await updateItem(id, { completed: currentValue === 0 ? 1 : 0 });
  };

  return {
    createItem,
    updateItem,
    deleteItem,
    toggleComplete,
  };
}

/**
 * Generate a UUID v4
 * Simple implementation for client-side ID generation
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
