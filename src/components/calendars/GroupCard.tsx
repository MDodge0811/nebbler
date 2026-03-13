import { type ReactNode } from 'react';
import { LayoutAnimation, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { CalendarCheckbox } from './CalendarCheckbox';

const COLORS = {
  primaryLight: '#E8FBF1',
  primaryMid: '#D0F5E3',
  primaryBorder: '#A8EDCB',
  primary: '#00DB74',
  border: '#E8E8EC',
  surface: '#FFFFFF',
  textMuted: '#9B9BA8',
};

const primaryNameStyle = tva({ base: 'text-[15px] font-bold text-typography-900' });
const standardNameStyle = tva({ base: 'flex-1 text-[15px] font-semibold text-typography-900' });

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
    <View style={{ transform: [{ rotate: open ? '90deg' : '0deg' }] }}>
      <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
        <Path
          d="M7 5L11 9L7 13"
          stroke={COLORS.textMuted}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </Svg>
    </View>
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
      <View style={styles.primaryCard}>
        <Pressable onPress={handleToggle}>
          <HStack style={styles.header}>
            <ChevronIcon open={isOpen} />
            <View style={styles.titleContainer}>
              <HStack style={styles.titleRow}>
                <Text className={primaryNameStyle({})}>{name}</Text>
                <View style={styles.availabilityBadge}>
                  <Text style={styles.availabilityText}>AVAILABILITY</Text>
                </View>
              </HStack>
            </View>
            <CalendarCheckbox checked={checked} color={COLORS.primary} onToggle={onToggleCheck} />
          </HStack>
        </Pressable>
        {isOpen && <View style={styles.body}>{children}</View>}
      </View>
    );
  }

  return (
    <View style={styles.standardCard}>
      <Pressable onPress={handleToggle}>
        <HStack style={[styles.header, !isOpen && styles.headerClosed]}>
          <ChevronIcon open={isOpen} />
          <Text className={standardNameStyle({})}>{name}</Text>
          <CalendarCheckbox checked={checked} color={COLORS.primary} onToggle={onToggleCheck} />
        </HStack>
      </Pressable>
      {isOpen && <View style={styles.body}>{children}</View>}
    </View>
  );
}

const styles = StyleSheet.create({
  primaryCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 16,
    backgroundColor: COLORS.primaryLight,
    borderWidth: 1.5,
    borderColor: COLORS.primaryBorder,
    overflow: 'hidden',
  },
  standardCard: {
    marginHorizontal: 12,
    marginBottom: 6,
    borderRadius: 14,
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.border,
    overflow: 'hidden',
  },
  header: {
    alignItems: 'center',
    gap: 10,
    paddingTop: 14,
    paddingBottom: 10,
    paddingHorizontal: 14,
  },
  headerClosed: {
    paddingBottom: 14,
  },
  titleContainer: {
    flex: 1,
  },
  titleRow: {
    alignItems: 'center',
    gap: 8,
  },
  availabilityBadge: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
    borderColor: COLORS.primaryBorder,
  },
  availabilityText: {
    fontSize: 9,
    fontWeight: '700',
    color: COLORS.primary,
    letterSpacing: 0.6,
  },
  body: {
    paddingBottom: 6,
  },
});
