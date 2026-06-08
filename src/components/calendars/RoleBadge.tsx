import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

export type CalendarRole = 'owner' | 'admin' | 'member';

const LABELS: Record<CalendarRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  member: 'Member',
};

const badgeStyle = tva({
  base: 'rounded-md border px-2 py-0.5',
  variants: {
    role: {
      owner: 'border-brand-primary-border bg-brand-primary-light',
      admin: 'border-brand-role-admin-border bg-brand-role-admin-bg',
      member: 'border-brand-border bg-typography-50',
    },
  },
});

const labelStyle = tva({
  base: 'text-[11px] font-semibold tracking-[0.2px]',
  variants: {
    role: {
      owner: 'text-brand-success-text',
      admin: 'text-brand-role-admin-text',
      member: 'text-brand-text-secondary',
    },
  },
});

interface RoleBadgeProps {
  role: CalendarRole | string;
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const resolved: CalendarRole = role === 'owner' || role === 'admin' ? role : 'member';
  return (
    <Box className={badgeStyle({ role: resolved })}>
      <Text className={labelStyle({ role: resolved })}>{LABELS[resolved]}</Text>
    </Box>
  );
}
