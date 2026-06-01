import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { StyleSheet } from 'react-native';

export const containerStyle = tva({ base: 'flex-1 bg-background-0' });
export const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
export const valueStyle = tva({ base: 'mt-1 text-base text-typography-900' });
export const dateTimeTextStyle = tva({ base: 'text-base text-typography-900' });
export const dateTimeSeparatorStyle = tva({ base: 'text-base text-typography-400' });
export const dividerStyle = tva({ base: 'h-px bg-outline-200' });
export const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
export const chevronStyle = tva({ base: 'text-base text-typography-400' });
export const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });

export const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1 },
  calendarDot: { width: 10, height: 10, borderRadius: 5 },
  busyBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
  },
  titleInput: {
    fontSize: 16,
    color: '#262627',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  descriptionInput: {
    fontSize: 16,
    color: '#262627',
    minHeight: 100,
    textAlignVertical: 'top',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#E5E5E5',
    borderRadius: 8,
  },
  deleteButton: {
    marginHorizontal: 16,
    marginTop: 24,
    marginBottom: 16,
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: '#FEE2E2',
    alignItems: 'center' as const,
  },
  deleteButtonText: {
    fontSize: 16,
    fontWeight: '600' as const,
    color: '#DC2626',
  },
});
