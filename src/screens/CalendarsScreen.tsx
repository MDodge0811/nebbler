import React, { useCallback, useMemo, useState } from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import Svg, { Path, Line } from 'react-native-svg';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { SafeAreaView } from 'react-native-safe-area-context';
import { HStack } from '@/components/ui/hstack';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { GroupCard } from '@components/calendars/GroupCard';
import { CalendarRow } from '@components/calendars/CalendarRow';
import { EditGroupCard } from '@components/calendars/EditGroupCard';
import { DraggableCalendarRow } from '@components/calendars/DraggableCalendarRow';
import { DropZone } from '@components/calendars/DropZone';
import { CalendarIcon } from '@components/calendars/CalendarIcon';
import { useDragStore } from '@stores/useDragStore';
import { EditableGroupName } from '@components/calendars/EditableGroupName';
import { PlusMenuPopover } from '@components/calendars/PlusMenuPopover';
import { useCalendarsListData } from '@hooks/useCalendarsListData';
import { useCalendarGroupMutations } from '@hooks/useCalendarGroups';
import { useCalendarsDisplayStore } from '@stores/useCalendarsDisplayStore';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { calendarsUIColors, UNGROUPED_DROP_ZONE_ID } from '@constants/calendarsUI';
import { getCalendarColor } from '@utils/calendarColor';
import type { RootStackParamList } from '@navigation/types';

const titleStyle = tva({ base: 'text-[28px] font-bold text-typography-900' });
const ungroupedTitleStyle = tva({ base: 'text-[15px] font-semibold text-typography-600' });
const emptyTextStyle = tva({ base: 'text-sm italic text-typography-400 text-center py-4' });
const createGroupLabelStyle = tva({ base: 'text-[14px] font-semibold' });

type NavigationProp = NativeStackNavigationProp<RootStackParamList>;

export function CalendarsScreen() {
  const navigation = useNavigation<NavigationProp>();
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
      if (edited !== undefined && edited.trim() && edited.trim() !== originalName) {
        try {
          await updateGroup(groupId, { name: edited.trim() });
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
        <View key="ungrouped" style={styles.ungroupedSection}>
          <Text className={ungroupedTitleStyle({})} style={styles.ungroupedTitle}>
            Ungrouped
          </Text>
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
        </View>
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
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <HStack style={styles.header}>
        <Text className={titleStyle({})}>Calendars</Text>
        <HStack style={styles.headerActions}>
          {editing ? (
            <Pressable onPress={() => setEditing(false)} style={styles.doneButton}>
              <Text style={styles.doneButtonText}>Done</Text>
            </Pressable>
          ) : (
            <>
              <Pressable onPress={() => setEditing(true)} style={styles.editButton}>
                <Text style={styles.editButtonText}>Edit</Text>
              </Pressable>
              <Pressable
                onPress={() => setPlusMenuOpen(true)}
                style={[styles.plusButton, plusMenuOpen && styles.plusButtonActive]}
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
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {editing ? <EditModeContent {...editModeProps} /> : renderDefaultMode}

        {isCreatingGroup && (
          <View style={styles.newGroupCard}>
            <EditableGroupName
              value={newGroupName}
              onChangeText={setNewGroupName}
              onSubmit={handleSubmitNewGroup}
              autoFocus
            />
          </View>
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
    </SafeAreaView>
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
      <View style={styles.ungroupedSection}>
        <Text className={ungroupedTitleStyle({})} style={styles.ungroupedTitle}>
          Ungrouped
        </Text>
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
      </View>

      {/* Create Group button */}
      <Pressable onPress={handleNewGroup} style={styles.createGroupButton}>
        <HStack style={styles.createGroupContent}>
          <View style={styles.createGroupIcon}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                d="M8 3V13M3 8H13"
                stroke={calendarsUIColors.primary}
                strokeWidth={2}
                strokeLinecap="round"
              />
            </Svg>
          </View>
          <Text className={createGroupLabelStyle({})} style={{ color: calendarsUIColors.primary }}>
            Create Group
          </Text>
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
    <View style={[styles.dragOverlay, { top: pageY - 24 }]} pointerEvents="none">
      <HStack style={styles.dragOverlayContent}>
        <CalendarIcon
          calendarName={draggedCalendar.name ?? ''}
          calendarId={draggedCalendar.id}
          color={color}
        />
        <Text className={dragOverlayNameStyle({})}>{draggedCalendar.name}</Text>
      </HStack>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: calendarsUIColors.background,
  },
  header: {
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 14,
  },
  headerActions: {
    alignItems: 'center',
    gap: 8,
  },
  editButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
  },
  editButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1A1F',
  },
  doneButton: {
    paddingHorizontal: 14,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: calendarsUIColors.primaryLight,
    borderWidth: 1,
    borderColor: calendarsUIColors.primaryBorder,
  },
  doneButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: calendarsUIColors.primary,
  },
  plusButton: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  plusButtonActive: {
    backgroundColor: calendarsUIColors.primaryLight,
    borderColor: calendarsUIColors.primaryBorder,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  ungroupedSection: {
    marginHorizontal: 12,
    marginTop: 6,
    marginBottom: 10,
  },
  ungroupedTitle: {
    marginBottom: 6,
    marginLeft: 4,
  },
  createGroupButton: {
    marginHorizontal: 12,
    marginTop: 4,
    marginBottom: 20,
    borderRadius: 14,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: calendarsUIColors.primaryBorder,
    backgroundColor: calendarsUIColors.primaryLight,
  },
  createGroupContent: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
  },
  createGroupIcon: {
    width: 28,
    height: 28,
    borderRadius: 7,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: calendarsUIColors.primaryBorder,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dragOverlay: {
    position: 'absolute',
    left: 20,
    right: 20,
    borderRadius: 12,
    backgroundColor: calendarsUIColors.surface,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 10,
  },
  dragOverlayContent: {
    alignItems: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
  },
  newGroupCard: {
    marginHorizontal: 12,
    marginBottom: 10,
    borderRadius: 14,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    padding: 12,
  },
});
