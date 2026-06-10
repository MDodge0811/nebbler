import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { CalendarPickerSheet } from '@components/CalendarPickerSheet';
import { ConnectionPicker } from '@components/people/ConnectionPicker';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useWritableCalendars, type WritableCalendar } from '@hooks/useWritableCalendars';
import { getCalendarColor } from '@utils/calendarColor';

import { useCreateEventFormContext } from './CreateEventFormContext';
import {
  ChevronDownIcon,
  ChevronRightIcon,
  CloseIcon,
  HeatmapIcon,
  LocationIcon,
  NextArrowIcon,
} from './icons';

const labelStyle = tva({
  base: 'mb-2 text-[13px] font-semibold uppercase tracking-wide text-brand-text-muted',
});
const cardStyle = tva({
  base: 'rounded-[14px] border border-brand-border bg-background-0 px-4 py-3.5',
});
const titleInputStyle = tva({
  base: 'rounded-[14px] border-[1.5px] border-brand-border bg-background-50 px-4 py-3.5 text-[18px] font-semibold text-brand-text',
});
const descriptionInputStyle = tva({
  base: 'min-h-[80px] rounded-[12px] border-[1.5px] border-brand-border bg-background-50 px-[14px] py-3 text-[15px] text-brand-text',
});
const calRowLabelStyle = tva({ base: 'mb-0.5 text-[13px] text-brand-text-muted' });
const calNameStyle = tva({ base: 'text-[15px] font-medium text-brand-text' });
const socialBadgeStyle = tva({
  base: 'rounded-md bg-brand-primary-light px-2 py-[2px] text-[11px] font-semibold uppercase tracking-wide text-brand-primary',
});
const placeholderRowLabelStyle = tva({ base: 'mb-0.5 text-[13px] text-brand-text-muted' });
const placeholderRowValueStyle = tva({ base: 'text-[15px] font-medium text-brand-text-muted' });
const comingSoonStyle = tva({ base: 'text-[11px] font-semibold uppercase text-brand-text-muted' });
const findTimeTitleStyle = tva({ base: 'text-[14px] font-bold text-brand-primary' });
const findTimeSubtitleStyle = tva({ base: 'text-[12px] text-brand-success-text' });
const findTimeCountStyle = tva({ base: 'text-[12px] font-semibold text-brand-primary' });

interface Screen1HeaderProps {
  isEdit: boolean;
  canAdvance: boolean;
  onClose: () => void;
  onNext: () => void;
}

function Screen1Header({ isEdit, canAdvance, onClose, onNext }: Screen1HeaderProps) {
  const nextColor = canAdvance ? '#FFFFFF' : calendarsUIColors.textMuted;
  return (
    <Box className="flex-row items-center justify-between border-b border-brand-divider px-4 pb-3 pt-2">
      <Pressable
        onPress={onClose}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Close"
        className="h-9 w-9 items-center justify-center rounded-full bg-background-50"
      >
        <CloseIcon />
      </Pressable>
      <Text className="text-[17px] font-bold text-brand-text">
        {isEdit ? 'Edit Event' : 'New Event'}
      </Text>
      <Pressable
        onPress={onNext}
        disabled={!canAdvance}
        hitSlop={8}
        accessibilityRole="button"
        accessibilityLabel="Next"
      >
        <DynamicColorView
          className="flex-row items-center gap-1 rounded-[10px] px-4 py-2"
          backgroundColor={canAdvance ? calendarsUIColors.primary : '#F1F1F4'}
        >
          <DynamicColorText className="text-[14px] font-bold" color={nextColor}>
            Next
          </DynamicColorText>
          <NextArrowIcon color={nextColor} />
        </DynamicColorView>
      </Pressable>
    </Box>
  );
}

interface CalendarRowProps {
  isSocial: boolean;
  calColor: string;
  calendarName: string;
  onOpenPicker: () => void;
}

/**
 * Calendar field: a non-interactive indicator (color dot, name, "Social" badge)
 * when launched from a social calendar — the calendar is locked (NEB-133) — or a
 * tappable picker row otherwise.
 */
function CalendarRow({ isSocial, calColor, calendarName, onOpenPicker }: CalendarRowProps) {
  const inner = (
    <Box className="flex-row items-center gap-3">
      <Box className="flex-1">
        <Text className={calRowLabelStyle({})}>Calendar</Text>
        <Box className="flex-row items-center gap-2">
          <DynamicColorView
            className="h-[10px] w-[10px] rounded-[3px]"
            backgroundColor={calColor}
          />
          <Text className={calNameStyle({})}>{calendarName}</Text>
          {isSocial ? <Text className={socialBadgeStyle({})}>Social</Text> : null}
        </Box>
      </Box>
      {isSocial ? null : <ChevronDownIcon />}
    </Box>
  );

  if (isSocial) {
    return (
      <Box className={cardStyle({})} accessibilityState={{ disabled: true }}>
        {inner}
      </Box>
    );
  }
  return (
    <Pressable onPress={onOpenPicker} accessibilityRole="button" className={cardStyle({})}>
      {inner}
    </Pressable>
  );
}

/** Find-a-Time subtitle: member count (social) or "everyone's free" + people count. */
function findTimeSubtitle(isSocial: boolean, memberCount: number, peopleCount: number): string {
  if (isSocial) {
    return `${memberCount} ${memberCount === 1 ? 'member' : 'members'}`;
  }
  return `See when everyone's free · ${peopleCount} ${peopleCount === 1 ? 'person' : 'people'}`;
}

interface Screen1Props {
  onNext: () => void;
  onClose: () => void;
}

export function Screen1WhatWho({ onNext, onClose }: Screen1Props) {
  const form = useCreateEventFormContext();
  const { authUser } = useCurrentUser();
  const { data: writableCalendars = [] } = useWritableCalendars(authUser?.id);
  const [showCalendarPicker, setShowCalendarPicker] = useState(false);

  const selectedCalendar = writableCalendars.find((c) => c.id === form.calendarId) ?? null;
  const calColor = form.calendarId ? getCalendarColor(form.calendarId) : calendarsUIColors.primary;
  const calendarName = selectedCalendar?.name ?? 'Select calendar';

  const handleCalendarSelect = (cal: WritableCalendar) => {
    form.setCalendarId(cal.id);
    setShowCalendarPicker(false);
  };

  const peopleCount = form.peopleIds.length;
  // Social mode always shows Find a Time (members are implicit); default mode
  // gates it behind ≥1 manually added person.
  const showFindTime = form.isSocial || peopleCount > 0;

  const advance = () => {
    if (form.isScreen1Valid) onNext();
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      className="flex-1 bg-background-0"
    >
      <Screen1Header
        isEdit={form.mode === 'edit'}
        canAdvance={form.isScreen1Valid}
        onClose={onClose}
        onNext={advance}
      />

      {/* Step indicator: dot1 filled, dot2 hollow */}
      <Box className="flex-row gap-2 px-4 pb-1 pt-3">
        <Box className="h-[3px] flex-1 rounded-full bg-brand-primary" />
        <Box className="h-[3px] flex-1 rounded-full bg-brand-border" />
      </Box>

      <ScrollView
        contentContainerClassName="gap-5 px-4 pb-24 pt-4"
        keyboardShouldPersistTaps="handled"
      >
        {/* Calendar row — non-interactive indicator in social mode, picker otherwise. */}
        <CalendarRow
          isSocial={form.isSocial}
          calColor={calColor}
          calendarName={calendarName}
          onOpenPicker={() => setShowCalendarPicker(true)}
        />

        {/* Title */}
        <TextInput
          className={titleInputStyle({})}
          placeholder="Event title"
          placeholderTextColor={calendarsUIColors.textMuted}
          value={form.title}
          onChangeText={form.setTitle}
          autoFocus={form.mode === 'create'}
          returnKeyType="done"
        />

        {/* Description */}
        <Box>
          <Text className={labelStyle({})}>Description</Text>
          <TextInput
            className={descriptionInputStyle({})}
            textAlignVertical="top"
            placeholder="Add details about this event…"
            placeholderTextColor={calendarsUIColors.textMuted}
            value={form.description}
            onChangeText={form.setDescription}
            multiline
            numberOfLines={3}
          />
        </Box>

        {/* Location placeholder — non-functional, no field write */}
        <Box
          className={`flex-row items-center gap-3 ${cardStyle({})}`}
          accessibilityState={{ disabled: true }}
        >
          <LocationIcon />
          <Box className="flex-1">
            <Text className={placeholderRowLabelStyle({})}>Location</Text>
            <Text className={placeholderRowValueStyle({})}>Add a location…</Text>
          </Box>
          <Text className={comingSoonStyle({})}>Coming soon</Text>
        </Box>

        {/* People */}
        <Box className={cardStyle({})}>
          <ConnectionPicker
            selectedIds={form.peopleIds}
            onChange={form.setPeopleIds}
            calendarColor={calColor}
            variant={form.isSocial ? 'social' : 'default'}
            memberCount={form.memberCount}
          />
        </Box>

        {/* Find a Time card — appears once ≥1 person selected */}
        {showFindTime ? (
          <Pressable
            onPress={advance}
            disabled={!form.isScreen1Valid}
            accessibilityRole="button"
            accessibilityLabel="Find a time"
            className="flex-row items-center gap-3 rounded-[14px] border border-brand-primary-border bg-brand-primary-light px-4 py-3.5"
          >
            <HeatmapIcon />
            <Box className="flex-1">
              <Text className={findTimeTitleStyle({})}>Find a Time</Text>
              <Text className={findTimeSubtitleStyle({})}>
                {findTimeSubtitle(form.isSocial, form.memberCount, peopleCount)}
              </Text>
            </Box>
            <Box className="flex-row items-center gap-1">
              <Text className={findTimeCountStyle({})}>Next</Text>
              <ChevronRightIcon color={calendarsUIColors.primary} />
            </Box>
          </Pressable>
        ) : null}
      </ScrollView>

      <CalendarPickerSheet
        visible={showCalendarPicker}
        calendars={writableCalendars}
        selectedCalendarId={form.calendarId}
        onSelect={handleCalendarSelect}
        onClose={() => setShowCalendarPicker(false)}
      />
    </KeyboardAvoidingView>
  );
}
