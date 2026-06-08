import { tva } from '@gluestack-ui/utils/nativewind-utils';

export const containerStyle = tva({ base: 'flex-1 bg-background-0' });
export const sectionLabelStyle = tva({ base: 'text-sm text-typography-500' });
export const valueStyle = tva({ base: 'mt-1 text-base text-typography-900' });
export const dateTimeTextStyle = tva({ base: 'text-base text-typography-900' });
export const dateTimeSeparatorStyle = tva({ base: 'text-base text-typography-400' });
export const dividerStyle = tva({ base: 'h-px bg-outline-200' });
export const calendarNameStyle = tva({ base: 'flex-1 text-base text-typography-900' });
export const chevronStyle = tva({ base: 'text-base text-typography-400' });
export const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });

export const calendarDotStyle = tva({ base: 'mr-2.5 h-2.5 w-2.5 rounded-full' });
export const busyBadgeStyle = tva({ base: 'rounded-xl bg-brand-surface-muted px-3 py-1' });
export const titleInputStyle = tva({ base: 'px-0 py-2 text-base text-typography-900' });
export const descriptionInputStyle = tva({
  base: 'min-h-[100px] rounded-lg border border-typography-100 px-3 py-2 text-base text-typography-900',
});
export const deleteButtonStyle = tva({
  base: 'mx-4 mb-4 mt-6 items-center rounded-xl bg-error-50 py-3.5',
});
export const deleteButtonTextStyle = tva({ base: 'text-base font-semibold text-error-600' });
