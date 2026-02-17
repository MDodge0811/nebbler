import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { UserAvatar } from '@components/schedule/UserAvatar';
import { OverflowMenu } from '@components/schedule/OverflowMenu';

const headerContainerStyle = tva({ base: 'bg-background-0' });
const headerRowStyle = tva({ base: 'h-14 items-center justify-between px-4' });
const leftZoneStyle = tva({ base: 'flex-row flex-1 items-center gap-3' });
const monthTextStyle = tva({ base: 'text-lg font-bold text-typography-900' });
const yearTextStyle = tva({ base: 'text-lg text-typography-400' });

interface ScheduleHeaderProps {
  onNavigateToProfile: () => void;
  /** ISO date string (YYYY-MM-DD) controlling the displayed month/year. Defaults to today. */
  displayDate?: string;
}

export function ScheduleHeader({ onNavigateToProfile, displayDate }: ScheduleHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user: dbUser, authUser } = useCurrentUser();

  const date = displayDate ? new Date(displayDate + 'T12:00:00') : new Date();
  const monthName = date.toLocaleDateString('en-US', { month: 'long' });
  const year = date.getFullYear().toString();

  return (
    <Box className={headerContainerStyle({})} style={{ paddingTop: insets.top }}>
      <HStack className={headerRowStyle({})}>
        <Box className={leftZoneStyle({})}>
          <UserAvatar
            userId={authUser?.id ?? ''}
            firstName={dbUser?.first_name}
            lastName={dbUser?.last_name}
            fallbackName={authUser?.email ?? '?'}
            onPress={onNavigateToProfile}
          />
          <Text className={monthTextStyle({})}>{monthName}</Text>
          <Text className={yearTextStyle({})}>{year}</Text>
        </Box>

        <OverflowMenu />
      </HStack>
    </Box>
  );
}
