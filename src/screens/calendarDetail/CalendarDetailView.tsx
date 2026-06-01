import { Pressable as RNPressable, ScrollView, Text as RNText, View } from 'react-native';

import { CalendarTypeBadge } from '@components/calendars/CalendarTypeBadge';
import { EventRow } from '@components/calendars/EventRow';
import { MemberRow } from '@components/calendars/MemberRow';
import type { Calendar, Event } from '@database/schema';
import type { CalendarDetailMember, CalendarDetailPermissions } from '@hooks/useCalendarDetail';

import { ChevronRight, PlusIcon } from './icons';
import { styles } from './styles';

interface CalendarDetailViewProps {
  calendar: Calendar;
  color: string;
  firstLetter: string;
  isPrivate: boolean;
  ownerName: string;
  members: CalendarDetailMember[];
  membersExpanded: boolean;
  onToggleMembers: () => void;
  upcomingEvents: Event[];
  permissions: CalendarDetailPermissions;
  onEventPress: (eventId: string) => void;
  onCreateEvent: () => void;
}

/** Read-only body for CalendarDetailScreen: header card, events, members, and the create FAB. */
export function CalendarDetailView({
  calendar,
  color,
  firstLetter,
  isPrivate,
  ownerName,
  members,
  membersExpanded,
  onToggleMembers,
  upcomingEvents,
  permissions,
  onEventPress,
  onCreateEvent,
}: CalendarDetailViewProps) {
  return (
    <>
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
              <RNPressable onPress={onToggleMembers}>
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
                onPress={() => onEventPress(event.id)}
              />
            ))}
          </View>
        )}

        {/* Members (social/public only) */}
        {!isPrivate && (
          <>
            <RNText style={styles.sectionLabel}>MEMBERS</RNText>
            <View style={styles.membersCard}>
              <RNPressable onPress={onToggleMembers} style={styles.membersHeader}>
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
          onPress={onCreateEvent}
          style={[styles.fab, { backgroundColor: color, shadowColor: color }]}
        >
          <PlusIcon />
        </RNPressable>
      )}
    </>
  );
}
