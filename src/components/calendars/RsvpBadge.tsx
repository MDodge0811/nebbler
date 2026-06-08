import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

export type RsvpStatus = 'going' | 'maybe' | 'not_going';

const LABELS: Record<RsvpStatus, string> = {
  going: 'Going',
  maybe: 'Maybe',
  not_going: 'Not Going',
};

const badgeStyle = tva({
  base: 'rounded-md border px-2 py-0.5',
  variants: {
    status: {
      going: 'border-brand-primary-border bg-brand-primary-light',
      maybe: 'border-brand-rsvp-maybe-border bg-brand-rsvp-maybe-bg',
      not_going: 'border-brand-danger-border bg-brand-danger-light',
    },
  },
});

const labelStyle = tva({
  base: 'text-[11px] font-semibold tracking-[0.2px]',
  variants: {
    status: {
      going: 'text-brand-success-text',
      maybe: 'text-brand-rsvp-maybe-text',
      not_going: 'text-brand-danger-text',
    },
  },
});

interface RsvpBadgeProps {
  status: RsvpStatus | null | undefined;
}

export function RsvpBadge({ status }: RsvpBadgeProps) {
  if (!status) return null;
  return (
    <Box className={badgeStyle({ status })}>
      <Text className={labelStyle({ status })}>{LABELS[status]}</Text>
    </Box>
  );
}
