import { ScrollView } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { CalendarTypeBadge } from '@components/calendars/CalendarTypeBadge';
import { EventRow } from '@components/calendars/EventRow';
import { MemberRow } from '@components/calendars/MemberRow';
import type { Calendar, Event } from '@database/schema';
import type { CalendarDetailMember, CalendarDetailPermissions } from '@hooks/useCalendarDetail';

import { ChevronRight, PlusIcon } from './icons';
import {
  descriptionBubbleStyle,
  descriptionTextStyle,
  emptyEventsStyle,
  emptyEventsTextStyle,
  eventListStyle,
  fabPositionStyle,
  fabSurfaceStyle,
  headerCardStyle,
  headerInfoStyle,
  headerNameStyle,
  headerRowStyle,
  inviteBtnStyle,
  inviteTextStyle,
  membersCardStyle,
  membersHeaderLabelStyle,
  membersHeaderLeftStyle,
  membersHeaderStyle,
  metaLinkStyle,
  metaOwnerNameStyle,
  metaRowStyle,
  metaTextStyle,
  scrollStyle,
  sectionLabelStyle,
  stackedAvatarsStyle,
  stackedAvatarStyle,
  stackedAvatarTextStyle,
  tileLetterStyle,
  tileStyle,
} from './styles';

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
      <ScrollView contentContainerClassName={scrollStyle({})}>
        {/* Header card */}
        <Box className={headerCardStyle({})}>
          <Box className={headerRowStyle({})}>
            <DynamicColorView
              className={tileStyle({})}
              backgroundColor={`${color}14`}
              borderColor={`${color}30`}
            >
              <DynamicColorText className={tileLetterStyle({})} color={color}>
                {firstLetter}
              </DynamicColorText>
            </DynamicColorView>
            <Box className={headerInfoStyle({})}>
              <Text className={headerNameStyle({})}>{calendar.name}</Text>
              <CalendarTypeBadge type={calendar.type ?? 'private'} color={color} />
            </Box>
          </Box>
          <Box className={metaRowStyle({})}>
            <Text className={metaTextStyle({})}>
              <Text className={metaOwnerNameStyle({})}>{ownerName || 'You'}</Text>
              {'  · Owner'}
            </Text>
            {!isPrivate && (
              <Pressable onPress={onToggleMembers}>
                <Text className={metaLinkStyle({})}>{members.length} members</Text>
              </Pressable>
            )}
          </Box>
          {calendar.description ? (
            <Box className={descriptionBubbleStyle({})}>
              <Text className={descriptionTextStyle({})}>{calendar.description}</Text>
            </Box>
          ) : null}
        </Box>

        {/* Upcoming events */}
        <Text className={sectionLabelStyle({})}>UPCOMING EVENTS ({upcomingEvents.length})</Text>
        {upcomingEvents.length === 0 ? (
          <Box className={emptyEventsStyle({})}>
            <Text className={emptyEventsTextStyle({})}>No upcoming events.</Text>
          </Box>
        ) : (
          <Box className={eventListStyle({})}>
            {upcomingEvents.map((event) => (
              <EventRow
                key={event.id}
                event={event}
                calendarColor={color}
                isFreeBusy={permissions.isFreeBusy}
                onPress={() => onEventPress(event.id)}
              />
            ))}
          </Box>
        )}

        {/* Members (social/public only) */}
        {!isPrivate && (
          <>
            <Text className={sectionLabelStyle({})}>MEMBERS</Text>
            <Box className={membersCardStyle({})}>
              <Pressable onPress={onToggleMembers} className={membersHeaderStyle({})}>
                <Box className={membersHeaderLeftStyle({})}>
                  <Box className={stackedAvatarsStyle({})}>
                    {members.slice(0, 3).map((m, i) => (
                      <DynamicColorView
                        key={m.id}
                        className={`${stackedAvatarStyle({})}${i > 0 ? ' -ml-2' : ''}`}
                        backgroundColor={`${color}20`}
                        zIndex={3 - i}
                      >
                        <DynamicColorText className={stackedAvatarTextStyle({})} color={color}>
                          {m.avatar_initial}
                        </DynamicColorText>
                      </DynamicColorView>
                    ))}
                  </Box>
                  <Text className={membersHeaderLabelStyle({})}>{members.length} members</Text>
                </Box>
                <Box className={membersExpanded ? 'rotate-90' : 'rotate-0'}>
                  <ChevronRight />
                </Box>
              </Pressable>
              {membersExpanded && (
                <>
                  {members.map((m) => (
                    <MemberRow key={m.id} member={m} calendarColor={color} />
                  ))}
                  <Pressable
                    className={inviteBtnStyle({})}
                    // TODO: NEB-64 — push CalendarMembersScreen for invite flow.
                    onPress={() => {}}
                  >
                    <Text className={inviteTextStyle({})}>+ Invite Members</Text>
                  </Pressable>
                </>
              )}
            </Box>
          </>
        )}
      </ScrollView>

      {permissions.canCreateEvent && (
        <Pressable testID="add-event-fab" onPress={onCreateEvent} className={fabPositionStyle({})}>
          <DynamicColorView
            className={fabSurfaceStyle({})}
            backgroundColor={color}
            shadowColor={color}
          >
            <PlusIcon />
          </DynamicColorView>
        </Pressable>
      )}
    </>
  );
}
