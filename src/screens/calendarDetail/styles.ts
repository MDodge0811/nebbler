import { tva } from '@gluestack-ui/utils/nativewind-utils';

export const containerStyle = tva({ base: 'flex-1 bg-background-0' });
export const scrollStyle = tva({ base: 'pb-[120px]' });
export const headerBtnStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-[18px] bg-typography-50',
});
export const headerCardStyle = tva({ base: 'border-b-[0.5px] border-brand-border p-4 pt-5' });
export const headerRowStyle = tva({ base: 'mb-3.5 flex-row items-center gap-3.5' });
export const tileStyle = tva({
  base: 'h-14 w-14 items-center justify-center rounded-2xl border-2',
});
export const tileLetterStyle = tva({ base: 'text-[26px] font-bold' });
export const headerInfoStyle = tva({ base: 'flex-1 gap-1.5' });
export const headerNameStyle = tva({
  base: 'text-[22px] font-bold tracking-[-0.4px] text-brand-text',
});
export const metaRowStyle = tva({ base: 'flex-row items-center gap-4' });
export const metaTextStyle = tva({ base: 'text-sm text-brand-text-secondary' });
export const metaOwnerNameStyle = tva({ base: 'font-semibold text-brand-text' });
export const metaLinkStyle = tva({ base: 'text-sm font-semibold text-brand-primary' });
export const descriptionBubbleStyle = tva({
  base: 'mt-3 rounded-xl bg-typography-50 px-3.5 py-2.5',
});
export const descriptionTextStyle = tva({
  base: 'text-sm leading-[21px] text-brand-text-secondary',
});
export const sectionLabelStyle = tva({
  base: 'px-4 pb-2 pt-5 text-[13px] font-semibold tracking-[0.3px] text-brand-text-muted',
});
export const eventListStyle = tva({
  base: 'mx-4 overflow-hidden rounded-[14px] border border-brand-border',
});
export const emptyEventsStyle = tva({
  base: 'mx-4 items-center rounded-[14px] border border-brand-border bg-background-0 p-6',
});
export const emptyEventsTextStyle = tva({ base: 'text-sm italic text-brand-text-muted' });
export const membersCardStyle = tva({
  base: 'mx-4 overflow-hidden rounded-[14px] border border-brand-border bg-background-0',
});
export const membersHeaderStyle = tva({
  base: 'flex-row items-center justify-between px-4 py-3.5',
});
export const membersHeaderLeftStyle = tva({ base: 'flex-row items-center gap-2.5' });
export const stackedAvatarsStyle = tva({ base: 'flex-row' });
export const stackedAvatarStyle = tva({
  base: 'h-7 w-7 items-center justify-center rounded-[14px] border-2 border-background-0',
});
export const stackedAvatarTextStyle = tva({ base: 'text-[11px] font-bold' });
export const membersHeaderLabelStyle = tva({ base: 'text-[15px] font-medium text-brand-text' });
export const inviteBtnStyle = tva({ base: 'items-center bg-brand-primary-light px-4 py-3' });
export const inviteTextStyle = tva({ base: 'text-sm font-semibold text-brand-primary' });
export const fabPositionStyle = tva({ base: 'absolute bottom-8 right-5' });
export const fabSurfaceStyle = tva({
  base: 'h-14 w-14 items-center justify-center rounded-2xl shadow-lg',
});
export const headerSaveStyle = tva({
  base: 'rounded-[10px] px-[18px] py-2',
  variants: {
    enabled: { true: 'bg-brand-primary opacity-100', false: 'bg-typography-50 opacity-70' },
  },
});
export const headerSaveTextStyle = tva({
  base: 'text-sm font-bold',
  variants: {
    enabled: { true: 'text-background-0', false: 'text-brand-text-muted' },
  },
});
export const editBodyStyle = tva({ base: 'gap-4 p-4 pt-5' });
export const editTitleStyle = tva({ base: 'text-center text-[17px] font-bold text-brand-text' });
export const previewCardStyle = tva({
  base: 'flex-row items-center gap-3.5 rounded-2xl border border-brand-border bg-background-0 p-4',
});
export const previewTileStyle = tva({
  base: 'h-[52px] w-[52px] items-center justify-center rounded-[14px] border-2',
});
export const previewLetterStyle = tva({ base: 'text-2xl font-semibold' });
export const previewNameStyle = tva({
  base: 'text-[17px] font-semibold tracking-[-0.2px]',
  variants: {
    filled: { true: 'text-brand-text', false: 'text-brand-text-muted' },
  },
});
export const previewTypeStyle = tva({
  base: 'mt-0.5 text-[13px] capitalize text-brand-text-muted',
});
export const textInputStyle = tva({
  base: 'w-full rounded-xl border-[1.5px] border-brand-border bg-typography-50 px-3.5 py-3 text-base font-medium text-brand-text',
});
export const textAreaStyle = tva({ base: 'min-h-20 leading-[22px]' });
export const swatchRowStyle = tva({
  base: 'flex-row flex-wrap gap-2 rounded-[14px] border border-brand-border bg-background-0 p-3',
});
export const swatchStyle = tva({
  base: 'h-9 w-9 rounded-[10px]',
  variants: {
    selected: { true: 'border-[2.5px] border-background-0' },
  },
});
export const dangerCardStyle = tva({
  base: 'rounded-[14px] border border-brand-danger-border bg-brand-danger-light p-4',
});
export const dangerCopyStyle = tva({
  base: 'mb-3 text-[13px] leading-[19px] text-brand-danger-text',
});
export const dangerBtnStyle = tva({ base: 'items-center rounded-xl bg-brand-danger px-4 py-3' });
export const dangerBtnTextStyle = tva({ base: 'text-[15px] font-bold text-background-0' });
export const testAffordanceStyle = tva({ base: 'absolute left-0 top-0 h-px w-px opacity-0' });
export const toastStyle = tva({
  base: 'absolute left-5 right-5 top-4 z-[100] rounded-[14px] px-[18px] py-3.5 shadow-lg',
  variants: {
    success: { true: 'bg-brand-primary', false: 'bg-brand-danger' },
  },
});
export const toastTextStyle = tva({
  base: 'text-center text-[15px] font-semibold text-background-0',
});
