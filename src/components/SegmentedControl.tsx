import { tva } from '@gluestack-ui/utils/nativewind-utils';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

export interface SegmentedControlOption {
  label: string;
  value: string;
}

interface SegmentedControlProps {
  options: SegmentedControlOption[];
  value: string;
  onChange: (value: string) => void;
}

const segmentStyle = tva({
  base: 'flex-1 items-center justify-center rounded-[10px] border px-3 py-2.5',
  variants: {
    selected: {
      true: 'border-brand-border bg-background-0 shadow-sm',
      false: 'border-transparent bg-transparent',
    },
  },
});

const segmentTextStyle = tva({
  base: 'text-[14px]',
  variants: {
    selected: {
      true: 'font-semibold text-brand-text',
      false: 'font-medium text-brand-text-secondary',
    },
  },
});

/**
 * Generic pill-style segmented control. Renders each option as a flex-1 button;
 * the selected segment gets a raised (surface + border + shadow) treatment.
 */
export function SegmentedControl({ options, value, onChange }: SegmentedControlProps) {
  return (
    <Box className="flex-row gap-1 rounded-[12px] border border-brand-border bg-background-50 p-[3px]">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => onChange(opt.value)}
            accessibilityRole="button"
            accessibilityState={{ selected }}
            accessibilityLabel={opt.label}
            className={segmentStyle({ selected })}
          >
            <Text className={segmentTextStyle({ selected })}>{opt.label}</Text>
          </Pressable>
        );
      })}
    </Box>
  );
}
