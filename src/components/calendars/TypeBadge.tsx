import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';

type BadgeType = 'social' | 'public';

const LABELS: Record<BadgeType, string> = { social: 'Social', public: 'Public' };

const badgeStyle = tva({
  base: 'rounded-[5px] px-[7px] py-0.5',
  variants: {
    type: {
      social: 'bg-brand-type-social-bg',
      public: 'bg-brand-type-public-bg',
    },
  },
});

const labelStyle = tva({
  base: 'text-[10px] font-semibold tracking-[0.3px]',
  variants: {
    type: {
      social: 'text-brand-type-social-text',
      public: 'text-brand-type-public-text',
    },
  },
});

interface TypeBadgeProps {
  type: string | null;
}

export function TypeBadge({ type }: TypeBadgeProps) {
  if (type !== 'social' && type !== 'public') return null;
  return (
    <Box className={badgeStyle({ type })}>
      <Text className={labelStyle({ type })}>{LABELS[type]}</Text>
    </Box>
  );
}
