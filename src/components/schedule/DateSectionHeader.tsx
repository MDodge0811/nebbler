import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { formatSectionDate } from '@utils/formatTime';
import { useScheduleStore } from '@stores/useScheduleStore';

const containerStyle = tva({ base: 'bg-background-0 px-4 py-2' });
const labelStyle = tva({ base: 'text-sm font-semibold text-typography-500' });

interface DateSectionHeaderProps {
  dateString: string;
}

export function DateSectionHeader({ dateString }: DateSectionHeaderProps) {
  const today = useScheduleStore((s) => s.today);
  const label = formatSectionDate(dateString, today);

  return (
    <Box className={containerStyle({})}>
      <Text className={labelStyle({})}>{label}</Text>
    </Box>
  );
}
