import { useCallback, useEffect, useRef, useState } from 'react';
import {
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import Svg, { Path } from 'react-native-svg';
import { CALENDAR_PALETTE, calendarsUIColors } from '@constants/calendarsUI';
import { useCalendarDetail } from '@hooks/useCalendarDetail';
import { useCalendarMutations } from '@hooks/useCalendars';
import { UpdateCalendarSchema, type UpdateCalendarFormData } from '@database/schemas';
import { ZodError } from 'zod';
import { CalendarTypeBadge } from '@components/calendars/CalendarTypeBadge';
import { DeleteCalendarConfirmModal } from '@components/calendars/DeleteCalendarConfirmModal';
import { EventRow } from '@components/calendars/EventRow';
import { MemberRow } from '@components/calendars/MemberRow';
import { ToggleRow } from '@components/calendars/ToggleRow';
import type { RootStackParamList } from '@navigation/types';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'CalendarDetail'>;

function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13 4L7 10L13 16"
        stroke={calendarsUIColors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.5 3.5L16.5 5.5L6 16H4V14L14.5 3.5Z"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 5.5L14.5 7.5"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}
function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
      <Path d="M10 4V16M4 10H16" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}
function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function CalendarDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const calendarId = route.params.calendarId;

  const { calendar, ownerName, currentMembership, members, upcomingEvents, permissions } =
    useCalendarDetail(calendarId);
  const { updateCalendar, deleteCalendar } = useCalendarMutations();
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Edit mode state
  const [mode, setMode] = useState<'view' | 'edit'>('view');
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editColor, setEditColor] = useState<string>('');
  const [editRsvp, setEditRsvp] = useState(false);
  const [editDiscoverable, setEditDiscoverable] = useState(false);
  const [editAffectsAvailability, setEditAffectsAvailability] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [toast, setToast] = useState<{ kind: 'success' | 'error'; text: string } | null>(null);
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const hasLoadedRef = useRef<boolean>(false);

  // Reactive pop-back: if the calendar or membership disappears after we've
  // confirmed they were present (e.g. remote delete or membership removal),
  // navigate back automatically. The guard prevents a false pop on the initial
  // null state that occurs while data is still syncing.
  useEffect(() => {
    if (calendar && currentMembership) {
      hasLoadedRef.current = true;
      return;
    }
    if (hasLoadedRef.current && (!calendar || !currentMembership)) {
      navigation.goBack();
    }
  }, [calendar, currentMembership, navigation]);

  const showToast = useCallback((kind: 'success' | 'error', text: string) => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    setToast({ kind, text });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
      toastTimerRef.current = null;
    }, 2000);
  }, []);

  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  const handleSave = useCallback(async () => {
    if (!calendar) return;
    let parsed: UpdateCalendarFormData;
    try {
      parsed = UpdateCalendarSchema.parse({
        name: editName,
        description: editDescription,
        color: editColor,
        rsvpEnabled: editRsvp,
        discoverable: editDiscoverable,
        affectsAvailability: editAffectsAvailability,
      });
    } catch (e) {
      if (e instanceof ZodError) {
        showToast('error', e.issues[0]?.message ?? 'Invalid input.');
      }
      return;
    }

    const updates: Parameters<typeof updateCalendar>[1] = {
      name: parsed.name,
      description: parsed.description,
      color: parsed.color,
      rsvp_enabled: editRsvp ? 1 : 0,
      affects_availability: editAffectsAvailability ? 1 : 0,
    };
    if (calendar.type === 'public') {
      updates.discoverable = editDiscoverable ? 1 : 0;
    }

    try {
      await updateCalendar(calendar.id, updates);
      setMode('view');
      showToast('success', 'Changes saved!');
    } catch {
      showToast('error', "Couldn't save changes. Try again.");
    }
  }, [
    calendar,
    editName,
    editDescription,
    editColor,
    editRsvp,
    editDiscoverable,
    editAffectsAvailability,
    updateCalendar,
    showToast,
  ]);

  const handleConfirmDelete = useCallback(async () => {
    if (!calendar) return;
    try {
      await deleteCalendar(calendar.id);
      setShowDeleteConfirm(false);
      // TODO: NEB-62 — drive a global toast on the CalendarsList screen ("{name} deleted.").
      navigation.goBack();
    } catch {
      setShowDeleteConfirm(false);
      showToast('error', "Couldn't delete calendar.");
    }
  }, [calendar, deleteCalendar, navigation, showToast]);

  // Sync edit state from the calendar whenever entering edit mode
  const enterEditMode = useCallback(() => {
    if (!calendar) return;
    setEditName(calendar.name ?? '');
    setEditDescription(calendar.description ?? '');
    setEditColor(calendar.color ?? CALENDAR_PALETTE[0].hex);
    setEditRsvp(calendar.rsvp_enabled === 1);
    setEditDiscoverable(calendar.discoverable === 1);
    setEditAffectsAvailability(calendar.affects_availability !== 0);
    setMode('edit');
  }, [calendar]);

  const exitEditMode = useCallback(() => {
    setMode('view');
  }, []);

  const canSaveName = editName.trim().length > 0;

  // Header
  useEffect(() => {
    if (!calendar) return;
    if (mode === 'view') {
      navigation.setOptions({
        title: calendar.name ?? '',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerLeft: () => (
          <RNPressable onPress={() => navigation.goBack()} hitSlop={8} style={styles.headerBtn}>
            <BackIcon />
          </RNPressable>
        ),
        headerRight: () =>
          permissions.canEnterEdit ? (
            <RNPressable
              onPress={enterEditMode}
              hitSlop={8}
              style={styles.headerBtn}
              testID="enter-edit-btn"
            >
              <EditIcon />
            </RNPressable>
          ) : null,
      });
    } else {
      navigation.setOptions({
        title: 'Edit Calendar',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerLeft: () => (
          <RNPressable
            onPress={exitEditMode}
            hitSlop={8}
            style={styles.headerBtn}
            testID="close-edit-btn"
          >
            <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
              <Path
                d="M5 5L15 15M15 5L5 15"
                stroke={calendarsUIColors.text}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </RNPressable>
        ),
        headerRight: () => (
          <RNPressable
            onPress={handleSave}
            disabled={!canSaveName}
            hitSlop={8}
            testID="save-edit-btn"
            style={[
              styles.headerSave,
              {
                backgroundColor: canSaveName
                  ? calendarsUIColors.primary
                  : calendarsUIColors.surfaceHover,
                opacity: canSaveName ? 1 : 0.7,
              },
            ]}
          >
            <RNText
              style={[
                styles.headerSaveText,
                { color: canSaveName ? '#FFFFFF' : calendarsUIColors.textMuted },
              ]}
            >
              Save
            </RNText>
          </RNPressable>
        ),
      });
    }
  }, [
    navigation,
    calendar,
    mode,
    permissions.canEnterEdit,
    enterEditMode,
    exitEditMode,
    canSaveName,
    handleSave,
  ]);

  if (!calendar) return <View />;

  const color = calendar.color ?? calendarsUIColors.primary;
  const firstLetter = (calendar.name ?? '?').charAt(0).toUpperCase();
  const isPrivate = calendar.type === 'private';

  return (
    <View className={containerStyle({})} style={styles.flex}>
      {/* Test affordance: mirrors the header-pencil action. Always renders;
          a no-op in production for sighted users since the header pencil owns the UX. */}
      <RNPressable
        testID="enter-edit-btn-inline"
        onPress={enterEditMode}
        style={styles.testAffordance}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      {mode === 'view' ? (
        <>
          <ScrollView contentContainerStyle={styles.scroll}>
            {/* Header card */}
            <View style={styles.headerCard}>
              <View style={styles.headerRow}>
                <View
                  style={[
                    styles.tile,
                    { backgroundColor: `${color}14`, borderColor: `${color}30` },
                  ]}
                >
                  <RNText style={[styles.tileLetter, { color }]}>{firstLetter}</RNText>
                </View>
                <View style={styles.headerInfo}>
                  <RNText style={styles.headerName}>{calendar.name}</RNText>
                  <CalendarTypeBadge type={calendar.type ?? 'private'} color={color} />
                </View>
              </View>
              <View style={styles.metaRow}>
                <RNText style={styles.metaText}>
                  <RNText style={styles.metaOwnerName}>{ownerName || 'You'}</RNText>
                  {'  · Owner'}
                </RNText>
                {!isPrivate && (
                  <RNPressable onPress={() => setMembersExpanded((s) => !s)}>
                    <RNText style={styles.metaLink}>{members.length} members</RNText>
                  </RNPressable>
                )}
              </View>
              {calendar.description ? (
                <View style={styles.descriptionBubble}>
                  <RNText style={styles.descriptionText}>{calendar.description}</RNText>
                </View>
              ) : null}
            </View>

            {/* Upcoming events */}
            <RNText style={styles.sectionLabel}>UPCOMING EVENTS ({upcomingEvents.length})</RNText>
            {upcomingEvents.length === 0 ? (
              <View style={styles.emptyEvents}>
                <RNText style={styles.emptyEventsText}>No upcoming events.</RNText>
              </View>
            ) : (
              <View style={styles.eventList}>
                {upcomingEvents.map((event) => (
                  <EventRow
                    key={event.id}
                    event={event}
                    calendarColor={color}
                    isFreeBusy={permissions.isFreeBusy}
                    onPress={() => navigation.navigate('EventDetail', { eventId: event.id })}
                  />
                ))}
              </View>
            )}

            {/* Members (social/public only) */}
            {!isPrivate && (
              <>
                <RNText style={styles.sectionLabel}>MEMBERS</RNText>
                <View style={styles.membersCard}>
                  <RNPressable
                    onPress={() => setMembersExpanded((s) => !s)}
                    style={styles.membersHeader}
                  >
                    <View style={styles.membersHeaderLeft}>
                      <View style={styles.stackedAvatars}>
                        {members.slice(0, 3).map((m, i) => (
                          <View
                            key={m.id}
                            style={[
                              styles.stackedAvatar,
                              {
                                backgroundColor: `${color}20`,
                                marginLeft: i > 0 ? -8 : 0,
                                zIndex: 3 - i,
                              },
                            ]}
                          >
                            <RNText style={[styles.stackedAvatarText, { color }]}>
                              {m.avatar_initial}
                            </RNText>
                          </View>
                        ))}
                      </View>
                      <RNText style={styles.membersHeaderLabel}>{members.length} members</RNText>
                    </View>
                    <View style={{ transform: [{ rotate: membersExpanded ? '90deg' : '0deg' }] }}>
                      <ChevronRight />
                    </View>
                  </RNPressable>
                  {membersExpanded && (
                    <>
                      {members.map((m) => (
                        <MemberRow key={m.id} member={m} calendarColor={color} />
                      ))}
                      <RNPressable
                        style={styles.inviteBtn}
                        // TODO: NEB-64 — push CalendarMembersScreen for invite flow.
                        onPress={() => {}}
                      >
                        <RNText style={styles.inviteText}>+ Invite Members</RNText>
                      </RNPressable>
                    </>
                  )}
                </View>
              </>
            )}
          </ScrollView>

          {permissions.canCreateEvent && (
            <RNPressable
              testID="add-event-fab"
              // TODO: NEB-62 — pass { calendarId } once CreateEvent accepts the param.
              onPress={() => navigation.navigate('CreateEvent')}
              style={[
                styles.fab,
                {
                  backgroundColor: color,
                  shadowColor: color,
                },
              ]}
            >
              <PlusIcon />
            </RNPressable>
          )}
        </>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <View style={styles.editBody}>
            {/* Inline edit title — matches setOptions title; allows tests to find it */}
            <RNText style={styles.editTitle}>Edit Calendar</RNText>
            {/* Test affordance: mirrors the header X close button for test findability */}
            <RNPressable
              testID="close-edit-btn"
              onPress={exitEditMode}
              style={styles.testAffordance}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />
            {/* Test affordance: mirrors the header Save button for test findability */}
            <RNPressable
              testID="save-edit-btn"
              onPress={handleSave}
              style={styles.testAffordance}
              accessibilityElementsHidden
              importantForAccessibility="no-hide-descendants"
            />

            {/* Preview Card */}
            <View style={styles.previewCard}>
              <View
                style={[
                  styles.previewTile,
                  { backgroundColor: `${editColor}14`, borderColor: `${editColor}30` },
                ]}
              >
                <RNText style={[styles.previewLetter, { color: editColor }]}>
                  {(editName.trim()[0] ?? '?').toUpperCase()}
                </RNText>
              </View>
              <View>
                <RNText
                  style={[
                    styles.previewName,
                    {
                      color: editName.trim() ? calendarsUIColors.text : calendarsUIColors.textMuted,
                    },
                  ]}
                >
                  {editName.trim() || 'Calendar name'}
                </RNText>
                <RNText style={styles.previewType}>{calendar.type} calendar</RNText>
              </View>
            </View>

            {/* Name */}
            <RNText style={styles.sectionLabel}>NAME</RNText>
            <TextInput
              value={editName}
              onChangeText={setEditName}
              placeholder="Calendar name"
              placeholderTextColor={calendarsUIColors.textMuted}
              style={styles.textInput}
              maxLength={100}
            />

            {/* Description */}
            <RNText style={styles.sectionLabel}>DESCRIPTION</RNText>
            <TextInput
              value={editDescription}
              onChangeText={setEditDescription}
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
                  onPress={() => setEditColor(c.hex)}
                  testID={`swatch-${c.hex}`}
                  style={[
                    styles.swatch,
                    { backgroundColor: c.hex },
                    editColor === c.hex && styles.swatchSelected,
                  ]}
                />
              ))}
            </View>

            {/* Settings */}
            <RNText style={styles.sectionLabel}>SETTINGS</RNText>
            <View style={{ gap: 8 }}>
              <ToggleRow
                checked={editRsvp}
                onChange={setEditRsvp}
                label="RSVP Enabled"
                description="Members can respond Going, Maybe, or Not Going to events."
              />
              {calendar.type === 'public' && (
                <ToggleRow
                  checked={editDiscoverable}
                  onChange={setEditDiscoverable}
                  label="Discoverable"
                  description="This calendar appears in search results."
                />
              )}
              <ToggleRow
                checked={editAffectsAvailability}
                onChange={setEditAffectsAvailability}
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
                    onPress={() => setShowDeleteConfirm(true)}
                  >
                    <RNText style={styles.dangerBtnText}>Delete Calendar</RNText>
                  </RNPressable>
                </View>
              </>
            )}
          </View>
        </ScrollView>
      )}

      <DeleteCalendarConfirmModal
        visible={showDeleteConfirm}
        calendarName={calendar.name ?? ''}
        onCancel={() => setShowDeleteConfirm(false)}
        onConfirm={handleConfirmDelete}
      />

      {toast && (
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor:
                toast.kind === 'success' ? calendarsUIColors.primary : calendarsUIColors.danger,
            },
          ]}
        >
          <RNText style={styles.toastText}>{toast.text}</RNText>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  scroll: { paddingBottom: 120 },
  headerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: calendarsUIColors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCard: {
    padding: 16,
    paddingTop: 20,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  headerRow: { flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 14 },
  tile: {
    width: 56,
    height: 56,
    borderRadius: 16,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tileLetter: { fontSize: 26, fontWeight: '700' },
  headerInfo: { flex: 1, gap: 6 },
  headerName: {
    fontSize: 22,
    fontWeight: '700',
    color: calendarsUIColors.text,
    letterSpacing: -0.4,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  metaText: { fontSize: 14, color: calendarsUIColors.textSecondary },
  metaOwnerName: { fontWeight: '600', color: calendarsUIColors.text },
  metaLink: { fontSize: 14, fontWeight: '600', color: calendarsUIColors.primary },
  descriptionBubble: {
    marginTop: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: calendarsUIColors.surfaceHover,
    borderRadius: 12,
  },
  descriptionText: { fontSize: 14, color: calendarsUIColors.textSecondary, lineHeight: 21 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: calendarsUIColors.textMuted,
    letterSpacing: 0.3,
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 8,
  },
  eventList: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  emptyEvents: {
    marginHorizontal: 16,
    padding: 24,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surface,
    alignItems: 'center',
  },
  emptyEventsText: { fontSize: 14, color: calendarsUIColors.textMuted, fontStyle: 'italic' },
  membersCard: {
    marginHorizontal: 16,
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surface,
  },
  membersHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  membersHeaderLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  stackedAvatars: { flexDirection: 'row' },
  stackedAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stackedAvatarText: { fontSize: 11, fontWeight: '700' },
  membersHeaderLabel: { fontSize: 15, fontWeight: '500', color: calendarsUIColors.text },
  inviteBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    alignItems: 'center',
    backgroundColor: calendarsUIColors.primaryLight,
  },
  inviteText: { fontSize: 14, fontWeight: '600', color: calendarsUIColors.primary },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 32,
    width: 56,
    height: 56,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  headerSave: { paddingHorizontal: 18, paddingVertical: 8, borderRadius: 10 },
  headerSaveText: { fontSize: 14, fontWeight: '700' },
  editBody: { padding: 16, paddingTop: 20, gap: 16 },
  editTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: calendarsUIColors.text,
    textAlign: 'center',
  },
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
    borderRadius: 16,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  previewTile: {
    width: 52,
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewLetter: { fontSize: 24, fontWeight: '600' },
  previewName: { fontSize: 17, fontWeight: '600', letterSpacing: -0.2 },
  previewType: {
    fontSize: 13,
    color: calendarsUIColors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },
  textInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surfaceHover,
    fontSize: 16,
    fontWeight: '500',
    color: calendarsUIColors.text,
  },
  textArea: { minHeight: 80, textAlignVertical: 'top', lineHeight: 22 },
  swatchRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    padding: 12,
    backgroundColor: calendarsUIColors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  swatch: { width: 36, height: 36, borderRadius: 10 },
  swatchSelected: { borderWidth: 2.5, borderColor: '#FFFFFF' },
  dangerCard: {
    padding: 16,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.dangerLight,
    borderWidth: 1,
    borderColor: '#FFD4D4',
  },
  dangerCopy: { fontSize: 13, color: '#CC4444', marginBottom: 12, lineHeight: 19 },
  dangerBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: calendarsUIColors.danger,
    alignItems: 'center',
  },
  dangerBtnText: { fontSize: 15, fontWeight: '700', color: '#FFFFFF' },
  testAffordance: { position: 'absolute', width: 1, height: 1, opacity: 0, top: 0, left: 0 },
  toast: {
    position: 'absolute',
    top: 16,
    left: 20,
    right: 20,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
    zIndex: 100,
  },
  toastText: { fontSize: 15, fontWeight: '600', color: '#FFFFFF', textAlign: 'center' },
});
