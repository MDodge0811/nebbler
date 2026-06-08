import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Text } from '@/components/ui/text';

const ICONS: Record<string, string> = {
  private: '🔒',
  social: '👥',
  public: '🌐',
};

interface CalendarTypeBadgeProps {
  type: 'private' | 'social' | 'public' | string;
  color: string;
}

export function CalendarTypeBadge({ type, color }: CalendarTypeBadgeProps) {
  const label = type.charAt(0).toUpperCase() + type.slice(1);
  return (
    <DynamicColorView
      className="flex-row items-center gap-[5px] self-start rounded-lg border-[1px] px-2.5 py-[3px]"
      backgroundColor={`${color}14`}
      borderColor={`${color}30`}
    >
      <Text className="text-[11px]">{ICONS[type] ?? ''}</Text>
      <DynamicColorText className="text-[12px] font-semibold tracking-[0.2px]" color={color}>
        {label}
      </DynamicColorText>
    </DynamicColorView>
  );
}
