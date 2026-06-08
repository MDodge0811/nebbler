import { ScrollView, TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { ToggleRow } from '@components/calendars/ToggleRow';
import { CALENDAR_PALETTE, calendarsUIColors } from '@constants/calendarsUI';
import type { Calendar } from '@database/schema';
import type { CalendarDetailPermissions } from '@hooks/useCalendarDetail';
import type { CalendarEditForm } from '@hooks/useCalendarEditForm';

import {
  dangerBtnStyle,
  dangerBtnTextStyle,
  dangerCardStyle,
  dangerCopyStyle,
  editBodyStyle,
  editTitleStyle,
  previewCardStyle,
  previewLetterStyle,
  previewNameStyle,
  previewTileStyle,
  previewTypeStyle,
  scrollStyle,
  sectionLabelStyle,
  swatchRowStyle,
  swatchStyle,
  testAffordanceStyle,
  textAreaStyle,
  textInputStyle,
} from './styles';

interface CalendarDetailEditBodyProps {
  calendar: Calendar;
  form: CalendarEditForm;
  permissions: CalendarDetailPermissions;
}

/** Edit-mode body for CalendarDetailScreen: preview, fields, settings, and danger zone. */
export function CalendarDetailEditBody({
  calendar,
  form,
  permissions,
}: CalendarDetailEditBodyProps) {
  const trimmedName = form.editName.trim();

  return (
    <ScrollView contentContainerClassName={scrollStyle({})}>
      <Box className={editBodyStyle({})}>
        {/* Inline edit title — matches setOptions title; allows tests to find it */}
        <Text className={editTitleStyle({})}>Edit Calendar</Text>
        {/* Test affordance: mirrors the header X close button for test findability */}
        <Pressable
          testID="close-edit-btn"
          onPress={form.exitEditMode}
          className={testAffordanceStyle({})}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        {/* Test affordance: mirrors the header Save button for test findability */}
        <Pressable
          testID="save-edit-btn"
          onPress={() => {
            void form.handleSave();
          }}
          className={testAffordanceStyle({})}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        {/* Preview Card */}
        <Box className={previewCardStyle({})}>
          <DynamicColorView
            className={previewTileStyle({})}
            backgroundColor={`${form.editColor}14`}
            borderColor={`${form.editColor}30`}
          >
            <DynamicColorText className={previewLetterStyle({})} color={form.editColor}>
              {(trimmedName[0] ?? '?').toUpperCase()}
            </DynamicColorText>
          </DynamicColorView>
          <Box>
            <Text className={previewNameStyle({ filled: !!trimmedName })}>
              {trimmedName || 'Calendar name'}
            </Text>
            <Text className={previewTypeStyle({})}>{calendar.type} calendar</Text>
          </Box>
        </Box>

        {/* Name */}
        <Text className={sectionLabelStyle({})}>NAME</Text>
        <TextInput
          value={form.editName}
          onChangeText={form.setEditName}
          placeholder="Calendar name"
          placeholderTextColor={calendarsUIColors.textMuted}
          className={textInputStyle({})}
          maxLength={100}
        />

        {/* Description */}
        <Text className={sectionLabelStyle({})}>DESCRIPTION</Text>
        <TextInput
          value={form.editDescription}
          onChangeText={form.setEditDescription}
          placeholder="What's this calendar for?"
          placeholderTextColor={calendarsUIColors.textMuted}
          className={`${textInputStyle({})} ${textAreaStyle({})}`}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Color */}
        <Text className={sectionLabelStyle({})}>COLOR</Text>
        <Box className={swatchRowStyle({})}>
          {CALENDAR_PALETTE.map((c) => (
            <Pressable
              key={c.hex}
              onPress={() => form.setEditColor(c.hex)}
              testID={`swatch-${c.hex}`}
            >
              <DynamicColorView
                className={swatchStyle({ selected: form.editColor === c.hex })}
                backgroundColor={c.hex}
              />
            </Pressable>
          ))}
        </Box>

        {/* Settings */}
        <Text className={sectionLabelStyle({})}>SETTINGS</Text>
        <Box className="gap-2">
          <ToggleRow
            checked={form.editRsvp}
            onChange={form.setEditRsvp}
            label="RSVP Enabled"
            description="Members can respond Going, Maybe, or Not Going to events."
          />
          {calendar.type === 'public' && (
            <ToggleRow
              checked={form.editDiscoverable}
              onChange={form.setEditDiscoverable}
              label="Discoverable"
              description="This calendar appears in search results."
            />
          )}
          <ToggleRow
            checked={form.editAffectsAvailability}
            onChange={form.setEditAffectsAvailability}
            label="Show as busy"
            description="Events on this calendar count toward your availability in Find Time."
          />
        </Box>

        {/* Danger Zone */}
        {permissions.canDelete && (
          <>
            <Text className={sectionLabelStyle({})}>DANGER ZONE</Text>
            <Box className={dangerCardStyle({})}>
              <Text className={dangerCopyStyle({})}>
                Permanently delete this calendar, all its events, and remove all members. This
                cannot be undone.
              </Text>
              <Pressable
                testID="delete-calendar-btn"
                className={dangerBtnStyle({})}
                onPress={() => form.setShowDeleteConfirm(true)}
              >
                <Text className={dangerBtnTextStyle({})}>Delete Calendar</Text>
              </Pressable>
            </Box>
          </>
        )}
      </Box>
    </ScrollView>
  );
}
