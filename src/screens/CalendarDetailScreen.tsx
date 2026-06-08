import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';

import { Box } from '@/components/ui/box';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { DeleteCalendarConfirmModal } from '@components/calendars/DeleteCalendarConfirmModal';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useCalendarDetail } from '@hooks/useCalendarDetail';
import { useCalendarEditForm } from '@hooks/useCalendarEditForm';
import type { RootStackParamList } from '@navigation/types';

import { CalendarDetailEditBody } from './calendarDetail/CalendarDetailEditBody';
import { CalendarDetailView } from './calendarDetail/CalendarDetailView';
import { BackIcon, CloseIcon, EditIcon } from './calendarDetail/icons';
import {
  containerStyle,
  headerBtnStyle,
  headerSaveStyle,
  headerSaveTextStyle,
  testAffordanceStyle,
  toastStyle,
  toastTextStyle,
} from './calendarDetail/styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;
type Rt = RouteProp<RootStackParamList, 'CalendarDetail'>;

export function CalendarDetailScreen() {
  const navigation = useNavigation<Nav>();
  const route = useRoute<Rt>();
  const calendarId = route.params.calendarId;

  const { calendar, ownerName, currentMembership, members, upcomingEvents, permissions } =
    useCalendarDetail(calendarId);
  const goBack = useCallback(() => navigation.goBack(), [navigation]);
  const form = useCalendarEditForm(calendar, goBack);
  const [membersExpanded, setMembersExpanded] = useState(false);
  const hasLoadedRef = useRef<boolean>(false);

  const { mode, enterEditMode, exitEditMode, canSaveName, handleSave } = form;

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

  // Header
  useEffect(() => {
    if (!calendar) return;
    if (mode === 'view') {
      navigation.setOptions({
        title: calendar.name ?? '',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerLeft: () => (
          <Pressable onPress={() => navigation.goBack()} hitSlop={8} className={headerBtnStyle({})}>
            <BackIcon />
          </Pressable>
        ),
        headerRight: () =>
          permissions.canEnterEdit ? (
            <Pressable
              onPress={enterEditMode}
              hitSlop={8}
              className={headerBtnStyle({})}
              testID="enter-edit-btn"
            >
              <EditIcon />
            </Pressable>
          ) : null,
      });
    } else {
      navigation.setOptions({
        title: 'Edit Calendar',
        headerTitleStyle: { fontSize: 17, fontWeight: '700' },
        headerLeft: () => (
          <Pressable
            onPress={exitEditMode}
            hitSlop={8}
            className={headerBtnStyle({})}
            testID="close-edit-btn"
          >
            <CloseIcon />
          </Pressable>
        ),
        headerRight: () => (
          <Pressable
            onPress={() => {
              void handleSave();
            }}
            disabled={!canSaveName}
            hitSlop={8}
            testID="save-edit-btn"
            className={headerSaveStyle({ enabled: canSaveName })}
          >
            <Text className={headerSaveTextStyle({ enabled: canSaveName })}>Save</Text>
          </Pressable>
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

  if (!calendar) return <Box />;

  const color = calendar.color ?? calendarsUIColors.primary;
  const firstLetter = (calendar.name ?? '?').charAt(0).toUpperCase();
  const isPrivate = calendar.type === 'private';

  return (
    <Box className={containerStyle({})}>
      {/* Test affordance: mirrors the header-pencil action. Always renders;
          a no-op in production for sighted users since the header pencil owns the UX. */}
      <Pressable
        testID="enter-edit-btn-inline"
        onPress={enterEditMode}
        className={testAffordanceStyle({})}
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
      />

      {mode === 'view' ? (
        <CalendarDetailView
          calendar={calendar}
          color={color}
          firstLetter={firstLetter}
          isPrivate={isPrivate}
          ownerName={ownerName}
          members={members}
          membersExpanded={membersExpanded}
          onToggleMembers={() => setMembersExpanded((s) => !s)}
          upcomingEvents={upcomingEvents}
          permissions={permissions}
          onEventPress={(eventId) => navigation.navigate('EventDetail', { eventId })}
          // TODO: NEB-62 — pass { calendarId } once CreateEvent accepts the param.
          onCreateEvent={() => navigation.navigate('CreateEvent')}
        />
      ) : (
        <CalendarDetailEditBody calendar={calendar} form={form} permissions={permissions} />
      )}

      <DeleteCalendarConfirmModal
        visible={form.showDeleteConfirm}
        calendarName={calendar.name ?? ''}
        onCancel={() => form.setShowDeleteConfirm(false)}
        onConfirm={() => {
          void form.handleConfirmDelete();
        }}
      />

      {form.toast && (
        <Box
          pointerEvents="none"
          className={toastStyle({ success: form.toast.kind === 'success' })}
        >
          <Text className={toastTextStyle({})}>{form.toast.text}</Text>
        </Box>
      )}
    </Box>
  );
}
