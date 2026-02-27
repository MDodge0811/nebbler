import { memo } from 'react';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { formatSectionDate } from '@utils/formatTime';

const containerStyle = tva({ base: 'bg-background-0 px-4 py-2' });
const labelStyle = tva({ base: 'text-sm font-semibold text-typography-500' });

interface DateSectionHeaderProps {
  dateString: string;
  today: string;
}

export const DateSectionHeader = memo(function DateSectionHeader({
  dateString,
  today,
}: DateSectionHeaderProps) {
  const label = formatSectionDate(dateString, today);

  return (
    <Box className={containerStyle({})}>
      <Text className={labelStyle({})}>{label}</Text>
    </Box>
  );
});
