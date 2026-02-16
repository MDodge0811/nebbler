import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { UserAvatar } from './UserAvatar';
import { OverflowMenu } from './OverflowMenu';

const headerContainerStyle = tva({ base: 'bg-background-0' });
const headerRowStyle = tva({ base: 'h-14 items-center justify-between px-4' });
const leftZoneStyle = tva({ base: 'flex-row flex-1 items-center gap-3' });
const monthTextStyle = tva({ base: 'text-lg font-bold text-typography-900' });
const yearTextStyle = tva({ base: 'text-lg text-typography-400' });

interface ScheduleHeaderProps {
  onNavigateToProfile: () => void;
}

export function ScheduleHeader({ onNavigateToProfile }: ScheduleHeaderProps) {
  const insets = useSafeAreaInsets();
  const { user: dbUser, authUser } = useCurrentUser();

  const now = new Date();
  const monthName = now.toLocaleDateString('en-US', { month: 'long' });
  const year = now.getFullYear().toString();

  return (
    <Box className={headerContainerStyle({})} style={{ paddingTop: insets.top }}>
      <HStack className={headerRowStyle({})}>
        <Box className={leftZoneStyle({})}>
          <UserAvatar
            userId={authUser?.id ?? ''}
            firstName={dbUser?.first_name}
            lastName={dbUser?.last_name}
            fallbackName={authUser?.email ?? authUser?.username ?? '?'}
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
