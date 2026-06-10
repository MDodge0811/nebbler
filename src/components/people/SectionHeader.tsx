import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';

interface SectionHeaderProps {
  label: string;
  /** Muted `(n)` count after the label. */
  count?: number;
  /** Primary-colored pill badge (e.g. pending-request count). Hidden when 0/undefined. */
  badge?: number;
  /** Render as a tappable collapse toggle with a caret. */
  collapsible?: boolean;
  open?: boolean;
  onToggle?: () => void;
}

/**
 * Uppercase section header for the People-tab lists (Pending Requests / Your
 * Connections / Sent Requests). Optionally shows a count, a primary badge, and a
 * collapse caret.
 */
export function SectionHeader({
  label,
  count,
  badge,
  collapsible = false,
  open = false,
  onToggle,
}: SectionHeaderProps) {
  const inner = (
    <Box className="flex-row items-center gap-2 px-4 pb-2 pt-4" testID="section-header">
      {collapsible ? (
        <Text className="text-xs text-brand-text-muted">{open ? '⌄' : '›'}</Text>
      ) : null}
      <Text className="text-[13px] font-semibold uppercase tracking-[0.3px] text-brand-text-muted">
        {label}
      </Text>
      {count != null ? <Text className="text-xs text-brand-text-muted">({count})</Text> : null}
      {badge != null && badge > 0 ? (
        <Box className="min-w-[18px] items-center rounded-[10px] bg-brand-primary px-[7px] py-px">
          <Text className="text-[11px] font-bold text-typography-white">{badge}</Text>
        </Box>
      ) : null}
    </Box>
  );

  if (collapsible && onToggle) {
    return (
      <Pressable onPress={onToggle} accessibilityRole="button">
        {inner}
      </Pressable>
    );
  }
  return inner;
}
