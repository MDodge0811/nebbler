import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { type ReactNode } from 'react';
import { LayoutAnimation } from 'react-native';
import Svg, { Path } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { calendarsUIColors } from '@constants/calendarsUI';

import { CalendarCheckbox } from './CalendarCheckbox';

const primaryNameStyle = tva({ base: 'text-[15px] font-bold text-typography-900' });
const standardNameStyle = tva({ base: 'flex-1 text-[15px] font-semibold text-typography-900' });
const headerStyle = tva({
  base: 'items-center gap-2.5 px-3.5 pt-3.5',
  variants: { closed: { true: 'pb-3.5', false: 'pb-2.5' } },
});

interface GroupCardProps {
  name: string;
  isPrimary: boolean;
  isOpen: boolean;
  onToggleOpen: () => void;
  checked: boolean;
  onToggleCheck: () => void;
  children: ReactNode;
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <Box className={open ? 'rotate-90' : 'rotate-0'}>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path
          d="M7 5L11 9L7 13"
          stroke={calendarsUIColors.textMuted}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </Box>
  );
}

export function GroupCard({
  name,
  isPrimary,
  isOpen,
  onToggleOpen,
  checked,
  onToggleCheck,
  children,
}: GroupCardProps) {
  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggleOpen();
  };

  if (isPrimary) {
    return (
      <Box className="mx-3 mb-2.5 overflow-hidden rounded-2xl border-[1.5px] border-brand-primary-border bg-brand-primary-light">
        <Pressable onPress={handleToggle}>
          <HStack className={headerStyle({ closed: false })}>
            <ChevronIcon open={isOpen} />
            <Box className="flex-1">
              <HStack className="items-center gap-2">
                <Text className={primaryNameStyle({})}>{name}</Text>
                <Box className="rounded-[5px] border border-brand-primary-border bg-background-0 px-[7px] py-0.5">
                  <Text className="text-[9px] font-bold tracking-[0.6px] text-brand-primary">
                    AVAILABILITY
                  </Text>
                </Box>
              </HStack>
            </Box>
            <CalendarCheckbox
              checked={checked}
              color={calendarsUIColors.primary}
              onToggle={onToggleCheck}
            />
          </HStack>
        </Pressable>
        {isOpen && <Box className="pb-1.5">{children}</Box>}
      </Box>
    );
  }

  return (
    <Box className="mx-3 mb-1.5 overflow-hidden rounded-[14px] border border-brand-border bg-background-0">
      <Pressable onPress={handleToggle}>
        <HStack className={headerStyle({ closed: !isOpen })}>
          <ChevronIcon open={isOpen} />
          <Text className={standardNameStyle({})}>{name}</Text>
          <CalendarCheckbox
            checked={checked}
            color={calendarsUIColors.primary}
            onToggle={onToggleCheck}
          />
        </HStack>
      </Pressable>
      {isOpen && <Box className="pb-1.5">{children}</Box>}
    </Box>
  );
}
