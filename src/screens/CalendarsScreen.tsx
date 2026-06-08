import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, Line } from 'react-native-svg';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
import { HStack } from '@/components/ui/hstack';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { CalendarIcon } from '@components/calendars/CalendarIcon';
import { CalendarRow } from '@components/calendars/CalendarRow';
import { DraggableCalendarRow } from '@components/calendars/DraggableCalendarRow';
import { DropZone } from '@components/calendars/DropZone';
import { EditableGroupName } from '@components/calendars/EditableGroupName';
import { EditGroupCard } from '@components/calendars/EditGroupCard';
import { GroupCard } from '@components/calendars/GroupCard';
import { PlusMenuPopover } from '@components/calendars/PlusMenuPopover';
import { calendarsUIColors, UNGROUPED_DROP_ZONE_ID } from '@constants/calendarsUI';
import { useCalendarGroupMutations } from '@hooks/useCalendarGroups';
import { useCalendarsListData } from '@hooks/useCalendarsListData';
import { useCurrentUser } from '@hooks/useCurrentUser';
import type { RootStackParamList } from '@navigation/types';
import { useCalendarsDisplayStore } from '@stores/useCalendarsDisplayStore';
import { useDragStore } from '@stores/useDragStore';
import { getCalendarColor } from '@utils/calendarColor';

const containerStyle = tva({ base: 'flex-1 bg-brand-background' });
const headerStyle = tva({ base: 'items-center justify-between px-5 pb-3.5 pt-2' });
const headerActionsStyle = tva({ base: 'items-center gap-2' });
const editButtonStyle = tva({
  base: 'rounded-lg border border-brand-border bg-background-0 px-3.5 py-[7px]',
});
const editButtonTextStyle = tva({ base: 'text-sm font-semibold text-brand-text' });
const doneButtonStyle = tva({
  base: 'rounded-lg border border-brand-primary-border bg-brand-primary-light px-3.5 py-[7px]',
});
const doneButtonTextStyle = tva({ base: 'text-sm font-bold text-brand-primary' });
const plusButtonStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-lg border border-brand-border bg-background-0',
  variants: { active: { true: 'border-brand-primary-border bg-brand-primary-light' } },
});
const titleStyle = tva({ base: 'text-[28px] font-bold text-typography-900' });
const ungroupedSectionStyle = tva({ base: 'mx-3 mb-2.5 mt-1.5' });
const ungroupedTitleStyle = tva({
  base: 'mb-1.5 ml-1 text-[15px] font-semibold text-typography-600',
});
const emptyTextStyle = tva({ base: 'py-4 text-center text-sm italic text-typography-400' });
const createGroupButtonStyle = tva({
  base: 'mx-3 mb-5 mt-1 rounded-[14px] border-[1.5px] border-dashed border-brand-primary-border bg-brand-primary-light',
});
const createGroupContentStyle = tva({ base: 'items-center justify-center gap-2 py-3.5' });
const createGroupIconStyle = tva({
  base: 'h-7 w-7 items-center justify-center rounded-[7px] border-[1.5px] border-dashed border-brand-primary-border',
});
const createGroupLabelStyle = tva({ base: 'text-[14px] font-semibold text-brand-primary' });
const dragOverlayStyle = tva({
  base: 'absolute left-5 right-5 rounded-xl bg-background-0 shadow-lg',
});
const dragOverlayContentStyle = tva({ base: 'items-center gap-2.5 px-3.5 py-2.5' });
const newGroupCardStyle = tva({
  base: 'mx-3 mb-2.5 rounded-[14px] border border-brand-border bg-background-0 p-3',
});

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CalendarsScreen() {
  const navigation = useNavigation<NavigationProp>();
  const insets = useSafeAreaInsets();
  const { user } = useCurrentUser();
  const {
    primaryGroupId,
    sortedGroups,
    groupCalendarsMap,
    ungroupedCalendars,
    memberCountMap,
    calendarsById,
    allMemberships,
  } = useCalendarsListData();

  const { createGroup, updateGroup, deleteGroup, moveCalendarBetweenGroups } =
    useCalendarGroupMutations();
  const toggleCalendar = useCalendarsDisplayStore((s) => s.toggleCalendar);
  const setGroupVisibility = useCalendarsDisplayStore((s) => s.setGroupVisibility);
  const isCalendarVisible = useCalendarsDisplayStore((s) => s.isCalendarVisible);

  const [editing, setEditing] = useState(false);
  const [plusMenuOpen, setPlusMenuOpen] = useState(false);
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({});
  const [newGroupName, setNewGroupName] = useState('');
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);

  // Default: all groups open
  const isGroupOpen = useCallback((groupId: string) => openGroups[groupId] ?? true, [openGroups]);

  const toggleGroup = useCallback((groupId: string) => {
    setOpenGroups((prev) => ({ ...prev, [groupId]: !(prev[groupId] ?? true) }));
  }, []);

  const isGroupChecked = useCallback(
    (groupId: string) => {
      const calendarIds = groupCalendarsMap[groupId] ?? [];
      if (calendarIds.length === 0) return false;
      return calendarIds.every((id) => isCalendarVisible(id));
    },
    [groupCalendarsMap, isCalendarVisible]
  );

  const handleToggleGroupCheck = useCallback(
    (groupId: string) => {
      const calendarIds = groupCalendarsMap[groupId] ?? [];
      if (calendarIds.length === 0) return;
      const allVisible = calendarIds.every((id) => isCalendarVisible(id));
      setGroupVisibility(calendarIds, !allVisible);
    },
    [groupCalendarsMap, isCalendarVisible, setGroupVisibility]
  );

  const handleCalendarPress = useCallback(
    (calendarId: string) => {
      navigation.navigate('CalendarDetail', { calendarId });
    },
    [navigation]
  );

  const handleNewCalendar = useCallback(() => {
    setPlusMenuOpen(false);
    navigation.navigate('CreateCalendar');
  }, [navigation]);

  const handleNewGroup = useCallback(() => {
    setPlusMenuOpen(false);
    setNewGroupName('');
    setIsCreatingGroup(true);
  }, []);

  const handleSubmitNewGroup = useCallback(async () => {
    const trimmed = newGroupName.trim();
    if (!trimmed || !user) {
      setIsCreatingGroup(false);
      return;
    }
    try {
      await createGroup(user.id, trimmed);
    } catch (e) {
      console.error('Failed to create group:', e);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    } finally {
      setIsCreatingGroup(false);
      setNewGroupName('');
    }
  }, [newGroupName, user, createGroup]);

  const handleImportCalendar = useCallback(() => {
    setPlusMenuOpen(false);
  }, []);

  // Pending group name edits tracked locally
  const [editedNames, setEditedNames] = useState<Record<string, string>>({});

  const getEditedName = useCallback(
    (groupId: string, originalName: string) => editedNames[groupId] ?? originalName,
    [editedNames]
  );

  const handleNameChange = useCallback((groupId: string, name: string) => {
    setEditedNames((prev) => ({ ...prev, [groupId]: name }));
  }, []);

  const handleNameBlur = useCallback(
    async (groupId: string, originalName: string) => {
      const edited = editedNames[groupId];
      const trimmed = edited?.trim();
      if (trimmed && trimmed !== originalName) {
        try {
          await updateGroup(groupId, { name: trimmed });
        } catch (e) {
          console.error('Failed to rename group:', e);
          Alert.alert('Error', 'Failed to rename group. Please try again.');
        }
      }
      setEditedNames((prev) => {
        const next = { ...prev };
        delete next[groupId];
        return next;
      });
    },
    [editedNames, updateGroup]
  );

  const handleDeleteGroup = useCallback(
    async (groupId: string) => {
      try {
        await deleteGroup(groupId);
      } catch (e) {
        console.error('Failed to delete group:', e);
        Alert.alert('Error', 'Failed to delete group. Please try again.');
      }
    },
    [deleteGroup]
  );

  // Default mode content
  const renderDefaultMode = useMemo(() => {
    const sections: React.ReactNode[] = [];

    for (const group of sortedGroups) {
      const isPrimary = group.id === primaryGroupId;
      const calendarIds = groupCalendarsMap[group.id] ?? [];

      sections.push(
        <GroupCard
          key={group.id}
          name={group.name ?? ''}
          isPrimary={isPrimary}
          isOpen={isGroupOpen(group.id)}
          onToggleOpen={() => toggleGroup(group.id)}
          checked={isGroupChecked(group.id)}
          onToggleCheck={() => handleToggleGroupCheck(group.id)}
        >
          {calendarIds.map((cid) => {
            const cal = calendarsById[cid];
            if (!cal) return null;
            return (
              <CalendarRow
                key={cid}
                calendar={cal}
                memberCount={memberCountMap[cid] ?? 0}
                isChecked={isCalendarVisible(cid)}
                onToggle={() => toggleCalendar(cid)}
                onPress={() => handleCalendarPress(cid)}
                isInPrimaryGroup={isPrimary}
              />
            );
          })}
        </GroupCard>
      );
    }

    if (ungroupedCalendars.length > 0) {
      sections.push(
        <Box key="ungrouped" className={ungroupedSectionStyle({})}>
          <Text className={ungroupedTitleStyle({})}>Ungrouped</Text>
          {ungroupedCalendars.map((cal) => (
            <CalendarRow
              key={cal.id}
              calendar={cal}
              memberCount={memberCountMap[cal.id] ?? 0}
              isChecked={isCalendarVisible(cal.id)}
              onToggle={() => toggleCalendar(cal.id)}
              onPress={() => handleCalendarPress(cal.id)}
              isInPrimaryGroup={false}
            />
          ))}
        </Box>
      );
    }

    return sections;
  }, [
    sortedGroups,
    primaryGroupId,
    groupCalendarsMap,
    calendarsById,
    memberCountMap,
    ungroupedCalendars,
    isGroupOpen,
    toggleGroup,
    isGroupChecked,
    handleToggleGroupCheck,
    isCalendarVisible,
    toggleCalendar,
    handleCalendarPress,
  ]);

  // Handle drop: move calendar to a new group (or ungroup)
  const handleDrop = useCallback(
    async (calendarId: string, sourceGroupId: string | null, targetGroupId: string | null) => {
      if (sourceGroupId === targetGroupId) return;

      const membership = sourceGroupId
        ? allMemberships.find(
            (m) => m.calendar_id === calendarId && m.calendar_group_id === sourceGroupId
          )
        : null;

      try {
        await moveCalendarBetweenGroups(membership?.id ?? null, targetGroupId, calendarId);
      } catch (e) {
        console.error('Failed to move calendar:', e);
        Alert.alert('Error', 'Failed to move calendar. Please try again.');
      }
    },
    [allMemberships, moveCalendarBetweenGroups]
  );

  const editModeProps = useMemo(
    () => ({
      sortedGroups,
      primaryGroupId,
      groupCalendarsMap,
      calendarsById,
      ungroupedCalendars,
      getEditedName,
      handleNameChange,
      handleNameBlur,
      handleDeleteGroup,
      handleNewGroup,
      handleDrop,
    }),
    [
      sortedGroups,
      primaryGroupId,
      groupCalendarsMap,
      calendarsById,
      ungroupedCalendars,
      getEditedName,
      handleNameChange,
      handleNameBlur,
      handleDeleteGroup,
      handleNewGroup,
      handleDrop,
    ]
  );

  return (
    <DynamicColorView className={containerStyle({})} paddingTop={insets.top}>
      {/* Header */}
      <HStack className={headerStyle({})}>
        <Text className={titleStyle({})}>Calendars</Text>
        <HStack className={headerActionsStyle({})}>
          {editing ? (
            <Pressable onPress={() => setEditing(false)} className={doneButtonStyle({})}>
              <Text className={doneButtonTextStyle({})}>Done</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => setEditing(true)} className={editButtonStyle({})}>
                <Text className={editButtonTextStyle({})}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => setPlusMenuOpen(true)}
                className={plusButtonStyle({ active: plusMenuOpen })}
              >
                <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                  <Line
                    x1={10}
                    y1={4}
                    x2={10}
                    y2={16}
                    stroke={plusMenuOpen ? calendarsUIColors.primary : '#1A1A1F'}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                  <Line
                    x1={4}
                    y1={10}
                    x2={16}
                    y2={10}
                    stroke={plusMenuOpen ? calendarsUIColors.primary : '#1A1A1F'}
                    strokeWidth={2}
                    strokeLinecap="round"
                  />
                </Svg>
              </Pressable>
            </>
          )}
        </HStack>
      </HStack>

      {/* Content */}
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-10"
        showsVerticalScrollIndicator={false}
      >
        {editing ? <EditModeContent {...editModeProps} /> : renderDefaultMode}

        {isCreatingGroup && (
          <Box className={newGroupCardStyle({})}>
            <EditableGroupName
              value={newGroupName}
              onChangeText={setNewGroupName}
              onSubmit={() => {
                void handleSubmitNewGroup();
              }}
              autoFocus
            />
          </Box>
        )}
      </ScrollView>

      {editing && <DragOverlay />}

      <PlusMenuPopover
        visible={plusMenuOpen}
        onClose={() => setPlusMenuOpen(false)}
        onNewCalendar={handleNewCalendar}
        onNewGroup={handleNewGroup}
        onImportCalendar={handleImportCalendar}
      />
    </DynamicColorView>
  );
}

type CalendarsListDataReturn = ReturnType<typeof useCalendarsListData>;

interface EditModeContentProps {
  sortedGroups: CalendarsListDataReturn['sortedGroups'];
  primaryGroupId: string | null;
  groupCalendarsMap: CalendarsListDataReturn['groupCalendarsMap'];
  calendarsById: CalendarsListDataReturn['calendarsById'];
  ungroupedCalendars: CalendarsListDataReturn['ungroupedCalendars'];
  getEditedName: (groupId: string, originalName: string) => string;
  handleNameChange: (groupId: string, name: string) => void;
  handleNameBlur: (groupId: string, originalName: string) => void;
  handleDeleteGroup: (groupId: string) => void;
  handleNewGroup: () => void;
  handleDrop: (
    calendarId: string,
    sourceGroupId: string | null,
    targetGroupId: string | null
  ) => void;
}

function EditModeContent({
  sortedGroups,
  primaryGroupId,
  groupCalendarsMap,
  calendarsById,
  ungroupedCalendars,
  getEditedName,
  handleNameChange,
  handleNameBlur,
  handleDeleteGroup,
  handleNewGroup,
  handleDrop,
}: EditModeContentProps) {
  const activeDropZoneId = useDragStore((s) => s.activeDropZoneId);
  const registerDropZone = useDragStore((s) => s.registerDropZone);

  const onDropZoneLayout = useCallback(
    (groupId: string, layout: { y: number; height: number }) => {
      registerDropZone(groupId, layout);
    },
    [registerDropZone]
  );

  return (
    <>
      {sortedGroups.map((group) => {
        const isPrimary = group.id === primaryGroupId;
        const calendarIds = groupCalendarsMap[group.id] ?? [];

        return (
          <EditGroupCard
            key={group.id}
            name={getEditedName(group.id, group.name ?? '')}
            isPrimary={isPrimary}
            onNameChange={(name) => handleNameChange(group.id, name)}
            onNameBlur={() => handleNameBlur(group.id, group.name ?? '')}
            onDelete={isPrimary ? undefined : () => handleDeleteGroup(group.id)}
          >
            {calendarIds.map((cid) => {
              const cal = calendarsById[cid];
              if (!cal) return null;
              return (
                <DraggableCalendarRow
                  key={cid}
                  calendar={cal}
                  isInPrimaryGroup={isPrimary}
                  sourceGroupId={group.id}
                  onDrop={handleDrop}
                />
              );
            })}
            <DropZone
              groupId={group.id}
              isActive={activeDropZoneId === group.id}
              onLayout={onDropZoneLayout}
            />
          </EditGroupCard>
        );
      })}

      {/* Ungrouped section */}
      <Box className={ungroupedSectionStyle({})}>
        <Text className={ungroupedTitleStyle({})}>Ungrouped</Text>
        {ungroupedCalendars.length > 0 ? (
          ungroupedCalendars.map((cal) => (
            <DraggableCalendarRow
              key={cal.id}
              calendar={cal}
              isInPrimaryGroup={false}
              sourceGroupId={null}
              onDrop={handleDrop}
            />
          ))
        ) : (
          <Text className={emptyTextStyle({})}>Drag calendars here to ungroup them</Text>
        )}
        <DropZone
          groupId={UNGROUPED_DROP_ZONE_ID}
          isActive={activeDropZoneId === UNGROUPED_DROP_ZONE_ID}
          onLayout={onDropZoneLayout}
        />
      </Box>

      {/* Create Group button */}
      <Pressable onPress={handleNewGroup} className={createGroupButtonStyle({})}>
        <HStack className={createGroupContentStyle({})}>
          <Box className={createGroupIconStyle({})}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 3V13M3 8H13"
                stroke={calendarsUIColors.primary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </Box>
          <Text className={createGroupLabelStyle({})}>Create Group</Text>
        </HStack>
      </Pressable>
    </>
  );
}

const dragOverlayNameStyle = tva({ base: 'text-[15px] font-medium text-typography-900' });

function DragOverlay() {
  const isDragging = useDragStore((s) => s.isDragging);
  const draggedCalendar = useDragStore((s) => s.draggedCalendar);
  const pageY = useDragStore((s) => s.dragPageY);

  if (!isDragging || !draggedCalendar || pageY === 0) return null;

  const color = draggedCalendar.color ?? getCalendarColor(draggedCalendar.id);

  return (
    <DynamicColorView className={dragOverlayStyle({})} top={pageY - 24} pointerEvents="none">
      <HStack className={dragOverlayContentStyle({})}>
        <CalendarIcon
          calendarName={draggedCalendar.name ?? ''}
          calendarId={draggedCalendar.id}
          color={color}
        />
        <Text className={dragOverlayNameStyle({})}>{draggedCalendar.name}</Text>
      </HStack>
    </DynamicColorView>
  );
}
