import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation, useRoute, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useCallback, useEffect, useRef, useState } from 'react';
import { Pressable as RNPressable, Text as RNText, View } from 'react-native';

import { DeleteCalendarConfirmModal } from '@components/calendars/DeleteCalendarConfirmModal';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useCalendarDetail } from '@hooks/useCalendarDetail';
import { useCalendarEditForm } from '@hooks/useCalendarEditForm';
import type { RootStackParamList } from '@navigation/types';

import { CalendarDetailEditBody } from './calendarDetail/CalendarDetailEditBody';
import { CalendarDetailView } from './calendarDetail/CalendarDetailView';
import { BackIcon, CloseIcon, EditIcon } from './calendarDetail/icons';
import { styles } from './calendarDetail/styles';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
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
            <CloseIcon />
          </RNPressable>
        ),
        headerRight: () => (
          <RNPressable
            onPress={() => {
              void handleSave();
            }}
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
        <View
          pointerEvents="none"
          style={[
            styles.toast,
            {
              backgroundColor:
                form.toast.kind === 'success'
                  ? calendarsUIColors.primary
                  : calendarsUIColors.danger,
            },
          ]}
        >
          <RNText style={styles.toastText}>{form.toast.text}</RNText>
        </View>
      )}
    </View>
  );
}
