import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import { useCallback, useEffect } from 'react';
import { Alert, Pressable as RNPressable, Text as RNText } from 'react-native';

import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { useEventMutations } from '@hooks/useCalendarEvents';
import { useEventDetail } from '@hooks/useEventDetail';
import { useEventEditForm } from '@hooks/useEventEditForm';
import type { RootStackParamList } from '@navigation/types';
import { getCalendarColor } from '@utils/calendarColor';

import { EventEditForm } from './eventDetail/EventEditForm';
import { EventReadView } from './eventDetail/EventReadView';
import { FreeBusyView } from './eventDetail/FreeBusyView';

export function EventDetailScreen() {
  const navigation = useNavigation();
  const route = useRoute<RouteProp<RootStackParamList, 'EventDetail'>>();
  const { eventId } = route.params;

  const { event, calendar, creator, permissions } = useEventDetail(eventId);
  const { deleteEvent } = useEventMutations();
  const form = useEventEditForm(event);
  const { isEditing, isValid, isSaving, enterEditMode, handleCancelEdit, handleSaveEdit } = form;

  // Navigate back if event becomes null (deleted by another client)
  useEffect(() => {
    if (event === null && !isEditing) {
      const timer = setTimeout(() => {
        Alert.alert('Event Deleted', 'This event has been deleted.');
        navigation.goBack();
      }, 100);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [event, isEditing, navigation]);

  const handleDelete = useCallback(() => {
    if (!event) {
      Alert.alert('Already Deleted', 'This event was already deleted.');
      navigation.goBack();
      return;
    }

    Alert.alert(`Delete "${event.title}"?`, "This can't be undone.", [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          void deleteEvent(event.id).then(() => {
            navigation.goBack();
          });
        },
      },
    ]);
  }, [event, deleteEvent, navigation]);

  // --- Header configuration ---
  useEffect(() => {
    if (isEditing) {
      navigation.setOptions({
        title: 'Edit Event',
        headerLeft: () => (
          <RNPressable onPress={handleCancelEdit} hitSlop={8}>
            <RNText style={{ fontSize: 16, color: '#666666' }}>Cancel</RNText>
          </RNPressable>
        ),
        headerRight: () => (
          <RNPressable
            onPress={() => {
              void handleSaveEdit();
            }}
            disabled={!isValid || isSaving}
            hitSlop={8}
          >
            <RNText
              style={{ fontSize: 16, fontWeight: '600', color: isValid ? '#00DB74' : '#D4D4D4' }}
            >
              Save
            </RNText>
          </RNPressable>
        ),
      });
    } else {
      navigation.setOptions({
        title: 'Event Details',
        headerLeft: () => (
          <RNPressable onPress={() => navigation.goBack()} hitSlop={8}>
            <RNText style={{ fontSize: 16, color: '#666666' }}>{'‹'} Back</RNText>
          </RNPressable>
        ),
        headerRight: () =>
          permissions.canEdit && !permissions.isFreeBusy ? (
            <RNPressable onPress={enterEditMode} hitSlop={8}>
              <RNText style={{ fontSize: 16, fontWeight: '600', color: '#00DB74' }}>Edit</RNText>
            </RNPressable>
          ) : null,
      });
    }
  }, [
    navigation,
    isEditing,
    isValid,
    isSaving,
    permissions.canEdit,
    permissions.isFreeBusy,
    handleCancelEdit,
    handleSaveEdit,
    enterEditMode,
  ]);

  if (!event) {
    return (
      <Box className="flex-1 items-center justify-center bg-background-0">
        <Text className="text-base text-typography-400">Loading...</Text>
      </Box>
    );
  }

  const calendarColor = calendar ? getCalendarColor(calendar.id) : '#00DB74';

  if (permissions.isFreeBusy) {
    return <FreeBusyView event={event} calendar={calendar} calendarColor={calendarColor} />;
  }

  if (isEditing) {
    return <EventEditForm form={form} calendar={calendar} calendarColor={calendarColor} />;
  }

  return (
    <EventReadView
      event={event}
      calendar={calendar}
      creator={creator}
      calendarColor={calendarColor}
      canDelete={permissions.canDelete}
      onDelete={handleDelete}
    />
  );
}
