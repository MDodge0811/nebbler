import { useEffect, useState } from 'react';
import {
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Text as RNText,
  View,
} from 'react-native';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import Svg, { Path } from 'react-native-svg';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useCalendarDetail } from '@hooks/useCalendarDetail';
import { CalendarTypeBadge } from '@components/calendars/CalendarTypeBadge';
import { EventRow } from '@components/calendars/EventRow';
import { MemberRow } from '@components/calendars/MemberRow';
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

  const { calendar, ownerName, members, upcomingEvents, permissions } =
    useCalendarDetail(calendarId);
  const [membersExpanded, setMembersExpanded] = useState(false);

  // Header
  useEffect(() => {
    if (!calendar) return;
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
            onPress={() => {
              /* edit mode wired in Task 6 */
            }}
            hitSlop={8}
            style={styles.headerBtn}
            testID="enter-edit-btn"
          >
            <EditIcon />
          </RNPressable>
        ) : null,
    });
  }, [navigation, calendar, permissions.canEnterEdit]);

  if (!calendar) return <View />;

  const color = calendar.color ?? calendarsUIColors.primary;
  const firstLetter = (calendar.name ?? '?').charAt(0).toUpperCase();
  const isPrivate = calendar.type === 'private';

  return (
    <View className={containerStyle({})} style={styles.flex}>
      <ScrollView contentContainerStyle={styles.scroll}>
        {/* Header card */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View
              style={[styles.tile, { backgroundColor: `${color}14`, borderColor: `${color}30` }]}
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
});
