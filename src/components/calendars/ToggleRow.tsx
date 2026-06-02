import { Switch } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';

interface ToggleRowProps {
  checked: boolean;
  onChange: (next: boolean) => void;
  label: string;
  description?: string;
}

export function ToggleRow({ checked, onChange, label, description }: ToggleRowProps) {
  return (
    <Box className="flex-row items-center justify-between gap-[14px] rounded-[14px] border border-brand-border bg-background-0 px-4 py-3.5">
      <Box className="flex-1">
        <Text className="text-[15px] font-semibold text-brand-text">{label}</Text>
        {description ? (
          <Text className="mt-[3px] text-[13px] leading-[18px] text-brand-text-secondary">
            {description}
          </Text>
        ) : null}
      </Box>
      <Switch
        value={checked}
        onValueChange={onChange}
        trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
        thumbColor="#FFFFFF"
      />
    </Box>
  );
}
