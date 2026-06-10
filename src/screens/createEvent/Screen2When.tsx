import { tva } from '@gluestack-ui/utils/nativewind-utils';
import type { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Alert, Platform, ScrollView, Switch } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import type { PickerTarget } from '@/types/eventForm';
import { EditDateTimeRow } from '@components/EditDateTimeRow';
import { SegmentedControl } from '@components/SegmentedControl';
import { calendarsUIColors } from '@constants/calendarsUI';
import { formatDateShort } from '@utils/formatTime';

import { useCreateEventFormContext, type ShowAs } from './CreateEventFormContext';
import { BackIcon, BellIcon, ChevronDownIcon, HeatmapIcon, RepeatIcon, ShowAsIcon } from './icons';

const cardStyle = tva({ base: 'rounded-[14px] border border-brand-border bg-background-0' });
const toggleLabelStyle = tva({ base: 'text-[15px] font-medium text-brand-text' });
const dividerStyle = tva({ base: 'h-px bg-brand-divider' });
const allDayValueStyle = tva({ base: 'text-[15px] text-brand-text' });
const sectionLabelStyle = tva({ base: 'text-[13px] text-brand-text-secondary' });
const placeholderTitleStyle = tva({ base: 'text-[14px] font-bold text-brand-text' });
const placeholderSubtitleStyle = tva({ base: 'mt-0.5 text-[12px] text-brand-text-muted' });
const moreRowLabelStyle = tva({ base: 'flex-1 text-[15px] text-brand-text' });
const moreRowValueStyle = tva({ base: 'text-[13px] text-brand-text-muted' });
const moreHeaderStyle = tva({
  base: 'text-[13px] font-semibold uppercase tracking-wide text-brand-text-muted',
});
const subtitleStyle = tva({ base: 'text-[12px] text-brand-text-muted' });

function applyDatePart(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setFullYear(picked.getFullYear(), picked.getMonth(), picked.getDate());
  return next;
}

function applyTimePart(base: Date, picked: Date): Date {
  const next = new Date(base);
  next.setHours(picked.getHours(), picked.getMinutes(), 0, 0);
  return next;
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

interface Screen2Props {
  onBack: () => void;
  onSaved: () => void;
}

export function Screen2When({ onBack, onSaved }: Screen2Props) {
  const form = useCreateEventFormContext();
  const [pickerTarget, setPickerTarget] = useState<PickerTarget>(null);
  const [moreExpanded, setMoreExpanded] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleStartChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!date) return;
    const next =
      pickerTarget === 'startDate'
        ? applyDatePart(form.startTime, date)
        : applyTimePart(form.startTime, date);
    form.setStartTime(next);
    if (form.endTime <= next) form.setEndTime(addHours(next, 1));
  };

  const handleEndChange = (_e: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setPickerTarget(null);
    if (!date) return;
    const next =
      pickerTarget === 'endDate'
        ? applyDatePart(form.endTime, date)
        : applyTimePart(form.endTime, date);
    form.setEndTime(next);
  };

  const handleSave = async () => {
    if (!form.isScreen2Valid || isSaving) return;
    setIsSaving(true);
    try {
      await form.save();
      onSaved();
    } catch {
      Alert.alert('Could not save event', 'Something went wrong. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Box className="flex-1 bg-background-0">
      {/* Header */}
      <Box className="flex-row items-center justify-between border-b border-brand-divider px-4 pb-3 pt-2">
        <Pressable
          onPress={onBack}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Back"
          className="h-9 w-9 items-center justify-center rounded-full bg-background-50"
        >
          <BackIcon />
        </Pressable>
        <Box className="flex-1 items-center">
          <Text className="text-[17px] font-bold text-brand-text">Pick a Time</Text>
          {form.title.trim() ? (
            <Text numberOfLines={1} className={subtitleStyle({})}>
              {form.title.trim()}
            </Text>
          ) : null}
        </Box>
        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={!form.isScreen2Valid || isSaving}
          hitSlop={8}
          accessibilityRole="button"
          accessibilityLabel="Save"
        >
          <DynamicColorView
            className="rounded-[10px] px-4 py-2"
            backgroundColor={form.isScreen2Valid ? calendarsUIColors.primary : '#F1F1F4'}
          >
            <DynamicColorText
              className="text-[14px] font-bold"
              color={form.isScreen2Valid ? '#FFFFFF' : calendarsUIColors.textMuted}
            >
              Save
            </DynamicColorText>
          </DynamicColorView>
        </Pressable>
      </Box>

      {/* Step indicator: dot1 done, dot2 filled */}
      <Box className="flex-row gap-2 px-4 pb-1 pt-3">
        <Box className="h-[3px] flex-1 rounded-full bg-brand-primary" />
        <Box className="h-[3px] flex-1 rounded-full bg-brand-primary" />
      </Box>

      <ScrollView
        contentContainerClassName="gap-4 px-4 pb-24 pt-3"
        keyboardShouldPersistTaps="handled"
      >
        {/* Date & time card (REAL) */}
        <Box className={cardStyle({})}>
          {/* All-day toggle */}
          <Box className="flex-row items-center justify-between px-4 py-3">
            <Text className={toggleLabelStyle({})}>All day</Text>
            <Switch
              value={form.isAllDay}
              onValueChange={form.setIsAllDay}
              trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
              thumbColor="#FFFFFF"
            />
          </Box>
          <Box className={`mx-4 ${dividerStyle({})}`} />

          {form.isAllDay ? (
            <Box className="px-4">
              <Box className="py-4">
                <Text className={sectionLabelStyle({})}>Starts</Text>
                <Pressable onPress={() => setPickerTarget('startDate')} className="mt-1">
                  <Text className={allDayValueStyle({})}>{formatDateShort(form.startTime)}</Text>
                </Pressable>
              </Box>
              <Box className={dividerStyle({})} />
              <Box className="py-4">
                <Text className={sectionLabelStyle({})}>Ends</Text>
                <Pressable onPress={() => setPickerTarget('endDate')} className="mt-1">
                  <Text className={allDayValueStyle({})}>{formatDateShort(form.endTime)}</Text>
                </Pressable>
              </Box>
            </Box>
          ) : (
            <Box className="px-4">
              <EditDateTimeRow
                label="Starts"
                value={form.startTime}
                dateTarget="startDate"
                timeTarget="startTime"
                pickerTarget={pickerTarget}
                setPickerTarget={setPickerTarget}
                onChange={handleStartChange}
              />
              <Box className={dividerStyle({})} />
              <EditDateTimeRow
                label="Ends"
                value={form.endTime}
                dateTarget="endDate"
                timeTarget="endTime"
                pickerTarget={pickerTarget}
                setPickerTarget={setPickerTarget}
                onChange={handleEndChange}
                showError={!form.isScreen2Valid}
                errorText={form.endTimeError}
              />
            </Box>
          )}
        </Box>

        {/* Heatmap placeholder (PLACEHOLDER, non-interactive) */}
        <Box
          className={`flex-row items-center gap-3 px-4 py-4 ${cardStyle({})}`}
          accessibilityState={{ disabled: true }}
        >
          <HeatmapIcon />
          <Box className="flex-1">
            <Text className={placeholderTitleStyle({})}>Find a Time</Text>
            <Text className={placeholderSubtitleStyle({})}>
              See when everyone's free (coming soon)
            </Text>
          </Box>
        </Box>

        {/* More options (PLACEHOLDER, collapsed by default) */}
        <Box className={cardStyle({})}>
          <Pressable
            onPress={() => setMoreExpanded((v) => !v)}
            accessibilityRole="button"
            className="flex-row items-center justify-between px-4 py-3.5"
          >
            <Text className={moreHeaderStyle({})}>More options</Text>
            <ChevronDownIcon />
          </Pressable>
          {moreExpanded ? (
            <Box>
              <Box className={`mx-4 ${dividerStyle({})}`} />
              <Box
                className="flex-row items-center gap-3 px-4 py-3.5"
                accessibilityState={{ disabled: true }}
              >
                <RepeatIcon />
                <Text className={moreRowLabelStyle({})}>Repeat</Text>
                <Text className={moreRowValueStyle({})}>Does not repeat</Text>
              </Box>
              <Box className={`mx-4 ${dividerStyle({})}`} />
              <Box className="gap-2.5 px-4 py-3.5">
                <Box className="flex-row items-center gap-3">
                  <ShowAsIcon />
                  <Text className={moreRowLabelStyle({})}>Show as</Text>
                </Box>
                <SegmentedControl
                  options={[
                    { label: 'Busy', value: 'busy' },
                    { label: 'Free', value: 'free' },
                  ]}
                  value={form.showAs}
                  onChange={(v) => form.setShowAs(v as ShowAs)}
                />
              </Box>
              <Box className={`mx-4 ${dividerStyle({})}`} />
              <Box
                className="flex-row items-center gap-3 px-4 py-3.5"
                accessibilityState={{ disabled: true }}
              >
                <BellIcon />
                <Text className={moreRowLabelStyle({})}>Reminder</Text>
                <Text className={moreRowValueStyle({})}>None</Text>
              </Box>
            </Box>
          ) : null}
        </Box>
      </ScrollView>
    </Box>
  );
}
