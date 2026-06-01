import {
  Pressable as RNPressable,
  ScrollView,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';

import { ToggleRow } from '@components/calendars/ToggleRow';
import { CALENDAR_PALETTE, calendarsUIColors } from '@constants/calendarsUI';
import type { Calendar } from '@database/schema';
import type { CalendarDetailPermissions } from '@hooks/useCalendarDetail';
import type { CalendarEditForm } from '@hooks/useCalendarEditForm';

import { styles } from './styles';

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
    <ScrollView contentContainerStyle={styles.scroll}>
      <View style={styles.editBody}>
        {/* Inline edit title — matches setOptions title; allows tests to find it */}
        <RNText style={styles.editTitle}>Edit Calendar</RNText>
        {/* Test affordance: mirrors the header X close button for test findability */}
        <RNPressable
          testID="close-edit-btn"
          onPress={form.exitEditMode}
          style={styles.testAffordance}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />
        {/* Test affordance: mirrors the header Save button for test findability */}
        <RNPressable
          testID="save-edit-btn"
          onPress={() => {
            void form.handleSave();
          }}
          style={styles.testAffordance}
          accessibilityElementsHidden
          importantForAccessibility="no-hide-descendants"
        />

        {/* Preview Card */}
        <View style={styles.previewCard}>
          <View
            style={[
              styles.previewTile,
              { backgroundColor: `${form.editColor}14`, borderColor: `${form.editColor}30` },
            ]}
          >
            <RNText style={[styles.previewLetter, { color: form.editColor }]}>
              {(trimmedName[0] ?? '?').toUpperCase()}
            </RNText>
          </View>
          <View>
            <RNText
              style={[
                styles.previewName,
                { color: trimmedName ? calendarsUIColors.text : calendarsUIColors.textMuted },
              ]}
            >
              {trimmedName || 'Calendar name'}
            </RNText>
            <RNText style={styles.previewType}>{calendar.type} calendar</RNText>
          </View>
        </View>

        {/* Name */}
        <RNText style={styles.sectionLabel}>NAME</RNText>
        <TextInput
          value={form.editName}
          onChangeText={form.setEditName}
          placeholder="Calendar name"
          placeholderTextColor={calendarsUIColors.textMuted}
          style={styles.textInput}
          maxLength={100}
        />

        {/* Description */}
        <RNText style={styles.sectionLabel}>DESCRIPTION</RNText>
        <TextInput
          value={form.editDescription}
          onChangeText={form.setEditDescription}
          placeholder="What's this calendar for?"
          placeholderTextColor={calendarsUIColors.textMuted}
          style={[styles.textInput, styles.textArea]}
          multiline
          numberOfLines={3}
          maxLength={500}
        />

        {/* Color */}
        <RNText style={styles.sectionLabel}>COLOR</RNText>
        <View style={styles.swatchRow}>
          {CALENDAR_PALETTE.map((c) => (
            <RNPressable
              key={c.hex}
              onPress={() => form.setEditColor(c.hex)}
              testID={`swatch-${c.hex}`}
              style={[
                styles.swatch,
                { backgroundColor: c.hex },
                form.editColor === c.hex && styles.swatchSelected,
              ]}
            />
          ))}
        </View>

        {/* Settings */}
        <RNText style={styles.sectionLabel}>SETTINGS</RNText>
        <View style={{ gap: 8 }}>
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
        </View>

        {/* Danger Zone */}
        {permissions.canDelete && (
          <>
            <RNText style={styles.sectionLabel}>DANGER ZONE</RNText>
            <View style={styles.dangerCard}>
              <RNText style={styles.dangerCopy}>
                Permanently delete this calendar, all its events, and remove all members. This
                cannot be undone.
              </RNText>
              <RNPressable
                testID="delete-calendar-btn"
                style={styles.dangerBtn}
                onPress={() => form.setShowDeleteConfirm(true)}
              >
                <RNText style={styles.dangerBtnText}>Delete Calendar</RNText>
              </RNPressable>
            </View>
          </>
        )}
      </View>
    </ScrollView>
  );
}
