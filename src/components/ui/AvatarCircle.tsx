import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { getAvatarColor, getInitials } from '@utils/avatarColor';

type AvatarCircleSize = 32 | 40 | 56 | 80;

type AvatarUser = {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email?: string | null;
  avatar_color: string | null;
};

interface AvatarCircleProps {
  user: AvatarUser;
  size: AvatarCircleSize;
}

const circleStyle = tva({
  base: 'items-center justify-center rounded-full border-[1.5px]',
  variants: {
    size: {
      32: 'h-8 w-8',
      40: 'h-10 w-10',
      56: 'h-14 w-14',
      80: 'h-20 w-20',
    },
  },
});

const initialStyle = tva({
  base: 'font-bold',
  variants: {
    size: {
      32: 'text-[13px]',
      40: 'text-base',
      56: 'text-[22px]',
      80: 'text-[32px]',
    },
  },
});

export function AvatarCircle({ user, size }: AvatarCircleProps) {
  const baseColor = user.avatar_color ?? getAvatarColor(user.id);
  const initials = getInitials(user.first_name, user.last_name, user.email ?? undefined);

  return (
    <DynamicColorView
      testID="avatar-circle"
      className={circleStyle({ size })}
      backgroundColor={`${baseColor}15`}
      borderColor={`${baseColor}30`}
    >
      <DynamicColorText className={initialStyle({ size })} color={baseColor}>
        {initials}
      </DynamicColorText>
    </DynamicColorView>
  );
}
