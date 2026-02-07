import { useQuery, usePowerSync } from '@powersync/react';
import type { User } from '@database/schema';

export function useUsers() {
  return useQuery<User>('SELECT * FROM users ORDER BY inserted_at DESC');
}

export function useUser(id: string) {
  return useQuery<User>('SELECT * FROM users WHERE id = ?', [id]);
}

export function useUserMutations() {
  const powerSync = usePowerSync();

  const createUser = async (attrs: {
    first_name: string;
    last_name: string;
    email: string;
    username: string;
    display_name?: string;
    password_hash: string;
  }) => {
    const id = generateUUID();
    const now = new Date().toISOString();

    await powerSync.execute(
      `INSERT INTO users (id, first_name, last_name, email, username, display_name, inserted_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id,
        attrs.first_name,
        attrs.last_name,
        attrs.email,
        attrs.username,
        attrs.display_name ?? null,
        now,
        now,
      ]
    );

    return id;
  };

  const updateUser = async (id: string, updates: Partial<Omit<User, 'id'>>) => {
    const setClauses: string[] = [];
    const values: (string | null)[] = [];

    const fields = ['first_name', 'last_name', 'email', 'username', 'display_name'] as const;
    for (const field of fields) {
      if (updates[field] !== undefined) {
        setClauses.push(`${field} = ?`);
        values.push(updates[field] ?? null);
      }
    }

    setClauses.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(id);

    await powerSync.execute(`UPDATE users SET ${setClauses.join(', ')} WHERE id = ?`, values);
  };

  const deleteUser = async (id: string) => {
    await powerSync.execute('DELETE FROM users WHERE id = ?', [id]);
  };

  return {
    createUser,
    updateUser,
    deleteUser,
  };
}

function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}
