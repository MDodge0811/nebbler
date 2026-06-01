import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable as RNPressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text as RNText,
  TextInput,
  View,
} from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ZodError } from 'zod';

import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { VStack } from '@/components/ui/vstack';
import { ColorSwatchGrid } from '@components/ui/ColorSwatchGrid';
import { CALENDAR_PALETTE, calendarsUIColors } from '@constants/calendarsUI';
import type { CalendarGroup } from '@database/schema';
import { CreateCalendarSchema } from '@database/schemas';
import { useCalendarGroups, useCalendarGroupMutations } from '@hooks/useCalendarGroups';
import { useCalendars, useCalendarMutations } from '@hooks/useCalendars';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { useOwnerRole } from '@hooks/useRoles';
import type { RootStackParamList } from '@navigation/types';

// --- SVG Icons (matching mockup viewBox=22) ---

function LockIcon({
  size = 22,
  color = calendarsUIColors.textSecondary,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Rect x={4} y={10} width={14} height={10} rx={2.5} stroke={color} strokeWidth={1.6} />
      <Path
        d="M7 10V7C7 4.8 8.8 3 11 3C13.2 3 15 4.8 15 7V10"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Circle cx={11} cy={15} r={1.5} fill={color} />
    </Svg>
  );
}

function PeopleIcon({
  size = 22,
  color = calendarsUIColors.textSecondary,
}: {
  size?: number;
  color?: string;
}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 22 22" fill="none">
      <Circle cx={8} cy={7} r={3} stroke={color} strokeWidth={1.6} />
      <Path
        d="M2 18C2 14.7 4.7 13 8 13C11.3 13 14 14.7 14 18"
        stroke={color}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
      <Circle cx={16} cy={8} r={2.5} stroke={color} strokeWidth={1.4} />
      <Path
        d="M14 18C14 15.5 15.5 14 17.5 14C19.5 14 20 15 20 16.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

function CheckIcon({ size = 14, color = '#fff' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 14 14" fill="none">
      <Path
        d="M3 7L6 10L11 4"
        stroke={color}
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

function ChevronDownIcon({ color = calendarsUIColors.textMuted }: { color?: string }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// --- Styles ---

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const errorTextStyle = tva({ base: 'mt-1 text-sm text-error-600' });

const styles = StyleSheet.create({
  scrollContent: { flexGrow: 1, paddingBottom: 40 },
  formContent: { padding: 16, paddingTop: 20, gap: 24 },

  // Section label
  sectionLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: calendarsUIColors.textMuted,
    letterSpacing: 0.3,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  requiredStar: {
    color: calendarsUIColors.danger,
    marginLeft: 2,
  },

  // Header
  headerCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: calendarsUIColors.surfaceHover,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCreateButton: {
    paddingHorizontal: 18,
    paddingVertical: 8,
    borderRadius: 10,
  },
  headerCreateButtonText: {
    fontSize: 14,
    fontWeight: '700',
    letterSpacing: 0.1,
  },

  // Preview card
  previewCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    backgroundColor: calendarsUIColors.surface,
    borderWidth: 1,
    borderColor: calendarsUIColors.border,
    gap: 14,
  },
  previewIcon: {
    width: 52,
    height: 52,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  previewLetter: {
    fontSize: 24,
    fontWeight: '600',
    color: calendarsUIColors.text,
  },
  previewEmoji: {
    fontSize: 24,
  },
  previewName: {
    fontSize: 17,
    fontWeight: '600',
    letterSpacing: -0.2,
  },
  previewType: {
    fontSize: 13,
    color: calendarsUIColors.textMuted,
    marginTop: 2,
    textTransform: 'capitalize',
  },

  // Name input
  nameInput: {
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

  // Type cards — horizontal row
  typeCardsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  typeCard: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surface,
  },
  typeCardSelected: {
    borderWidth: 2,
    borderColor: calendarsUIColors.primary,
    backgroundColor: calendarsUIColors.primaryLight,
  },
  typeIconBox: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  typeLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: calendarsUIColors.text,
    textAlign: 'center',
  },
  typeDescription: {
    fontSize: 11,
    color: calendarsUIColors.textSecondary,
    textAlign: 'center',
    lineHeight: 15,
  },

  // Group picker
  groupPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surfaceHover,
  },
  groupPickerText: {
    fontSize: 15,
    fontWeight: '500',
    color: calendarsUIColors.text,
  },
  groupPickerPlaceholder: {
    fontSize: 15,
    fontWeight: '500',
    color: calendarsUIColors.textMuted,
  },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
    color: calendarsUIColors.text,
  },

  // Description
  descriptionInput: {
    width: '100%',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: calendarsUIColors.border,
    backgroundColor: calendarsUIColors.surfaceHover,
    fontSize: 15,
    fontWeight: '400',
    color: calendarsUIColors.text,
    minHeight: 80,
    textAlignVertical: 'top',
    lineHeight: 22,
  },

  // Add description link
  addDescriptionText: {
    fontSize: 15,
    fontWeight: '500',
    color: calendarsUIColors.primary,
  },

  // Bottom sheet
  sheetContent: {
    paddingBottom: 50,
  },
  sheetTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: calendarsUIColors.text,
    paddingHorizontal: 16,
    paddingTop: 4,
    paddingBottom: 12,
  },
  sheetItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: calendarsUIColors.border,
  },
  sheetItemText: {
    fontSize: 16,
    color: calendarsUIColors.text,
  },
  sheetItemSelected: {
    fontSize: 16,
    color: calendarsUIColors.primary,
    fontWeight: '600',
  },
});

// --- Inline components ---

function SectionLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <RNText style={styles.sectionLabel}>
      {label}
      {required && <RNText style={styles.requiredStar}>*</RNText>}
    </RNText>
  );
}

function CalendarPreviewCard({ name, type, color }: { name: string; type: string; color: string }) {
  const hasName = name.trim().length > 0;
  // Tinted background: 8% opacity of the selected color
  const tintBg = `${color}14`;
  const tintBorder = `${color}30`;

  return (
    <View style={styles.previewCard}>
      <View style={[styles.previewIcon, { backgroundColor: tintBg, borderColor: tintBorder }]}>
        {hasName ? (
          <RNText style={styles.previewLetter}>{name.trim()[0]!.toUpperCase()}</RNText>
        ) : (
          <RNText style={styles.previewEmoji}>{'📅'}</RNText>
        )}
      </View>
      <View>
        <RNText
          style={[
            styles.previewName,
            { color: hasName ? calendarsUIColors.text : calendarsUIColors.textMuted },
          ]}
        >
          {hasName ? name.trim() : 'Calendar name'}
        </RNText>
        <RNText style={styles.previewType}>{type} calendar</RNText>
      </View>
    </View>
  );
}

const TYPE_OPTIONS = [
  {
    value: 'private' as const,
    label: 'Private',
    description: 'Your events, your schedule.',
    Icon: LockIcon,
  },
  {
    value: 'social' as const,
    label: 'Social',
    description: 'For a group — like game night or family.',
    Icon: PeopleIcon,
  },
];

function TypeCard({
  option,
  selected,
  onPress,
}: {
  option: (typeof TYPE_OPTIONS)[number];
  selected: boolean;
  onPress: () => void;
}) {
  const { Icon } = option;
  const iconBg = selected ? `${calendarsUIColors.primary}18` : `${calendarsUIColors.textMuted}10`;
  const iconColor = selected ? calendarsUIColors.primary : calendarsUIColors.textMuted;

  return (
    <Pressable style={[styles.typeCard, selected && styles.typeCardSelected]} onPress={onPress}>
      <View style={[styles.typeIconBox, { backgroundColor: iconBg }]}>
        <Icon size={22} color={iconColor} />
      </View>
      <RNText style={styles.typeLabel}>{option.label}</RNText>
      <RNText style={styles.typeDescription}>{option.description}</RNText>
    </Pressable>
  );
}

function GroupPickerSheet({
  sheetRef,
  groups,
  selectedId,
  onSelect,
}: {
  sheetRef: RefObject<BottomSheetModal | null>;
  groups: CalendarGroup[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
}) {
  const renderBackdrop = useCallback(
    (props: BottomSheetBackdropProps) => (
      <BottomSheetBackdrop
        {...props}
        appearsOnIndex={0}
        disappearsOnIndex={-1}
        pressBehavior="close"
      />
    ),
    []
  );

  const handleSelect = useCallback(
    (id: string | null) => {
      onSelect(id);
      sheetRef.current?.dismiss();
    },
    [onSelect, sheetRef]
  );

  return (
    <BottomSheetModal ref={sheetRef} enableDynamicSizing backdropComponent={renderBackdrop}>
      <BottomSheetScrollView contentContainerStyle={styles.sheetContent}>
        <RNText style={styles.sheetTitle}>Choose Group</RNText>
        <RNPressable style={styles.sheetItem} onPress={() => handleSelect(null)}>
          <RNText style={selectedId === null ? styles.sheetItemSelected : styles.sheetItemText}>
            No group (ungrouped)
          </RNText>
          {selectedId === null && <CheckIcon size={14} color={calendarsUIColors.primary} />}
        </RNPressable>
        {groups.map((g) => (
          <RNPressable key={g.id} style={styles.sheetItem} onPress={() => handleSelect(g.id)}>
            <RNText style={selectedId === g.id ? styles.sheetItemSelected : styles.sheetItemText}>
              {g.name}
            </RNText>
            {selectedId === g.id && <CheckIcon size={14} color={calendarsUIColors.primary} />}
          </RNPressable>
        ))}
      </BottomSheetScrollView>
    </BottomSheetModal>
  );
}

// --- Dirty check ---

export interface CreateCalendarDirtyState {
  name: string;
  type: 'private' | 'social';
  selectedColor: string;
  groupId: string | null;
  showAsBusy: boolean;
  description: string;
}

export function isCreateCalendarDirty(
  state: CreateCalendarDirtyState,
  defaultColor: string
): boolean {
  return (
    state.name.trim() !== '' ||
    state.type !== 'private' ||
    state.selectedColor !== defaultColor ||
    state.groupId !== null ||
    !state.showAsBusy ||
    state.description.trim() !== ''
  );
}

// --- Screen ---

export function CreateCalendarScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { authUser } = useCurrentUser();
  const { data: existingCalendars = [] } = useCalendars();
  const { data: groups = [] } = useCalendarGroups();
  const { createCalendar } = useCalendarMutations();
  const { addCalendarToGroup } = useCalendarGroupMutations();
  const { ownerRole } = useOwnerRole();

  // Default color: first palette entry not used by existing calendars
  const defaultColor = useMemo(() => {
    const usedColors = new Set(existingCalendars.map((c) => c.color).filter(Boolean));
    return CALENDAR_PALETTE.find((p) => !usedColors.has(p.hex))?.hex ?? CALENDAR_PALETTE[0].hex;
  }, [existingCalendars]);

  // Form state
  const [name, setName] = useState('');
  const [type, setType] = useState<'private' | 'social'>('private');
  const [selectedColor, setSelectedColor] = useState<string>(defaultColor);
  const [groupId, setGroupId] = useState<string | null>(null);
  const [showAsBusy, setShowAsBusy] = useState(true);
  const [description, setDescription] = useState('');
  const [showDescription, setShowDescription] = useState(false);
  const groupSheetRef = useRef<BottomSheetModal>(null);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);

  // Update default color when it changes (calendars loaded async)
  useEffect(() => {
    setSelectedColor(defaultColor);
  }, [defaultColor]);

  const isDirty = isCreateCalendarDirty(
    { name, type, selectedColor, groupId, showAsBusy, description },
    defaultColor
  );

  const isValid = name.trim().length > 0 && ownerRole !== null;

  const handleClose = useCallback(() => {
    if (isDirty) {
      Alert.alert('Discard Changes?', 'You have unsaved changes that will be lost.', [
        { text: 'Keep Editing', style: 'cancel' },
        { text: 'Discard', style: 'destructive', onPress: () => navigation.goBack() },
      ]);
    } else {
      navigation.goBack();
    }
  }, [isDirty, navigation]);

  const handleSave = useCallback(async () => {
    if (!authUser || !ownerRole || isSaving) return;

    try {
      CreateCalendarSchema.parse({
        name,
        type,
        color: selectedColor,
        groupId: groupId ?? null,
        affectsAvailability: showAsBusy,
        description: description || undefined,
      });
      setFormErrors({});
    } catch (err) {
      if (err instanceof ZodError) {
        const errors: Record<string, string> = {};
        err.issues.forEach((issue) => {
          const field = String(issue.path[0]);
          errors[field] ??= issue.message;
        });
        setFormErrors(errors);
      }
      return;
    }

    setIsSaving(true);
    try {
      const trimmedDescription = description.trim();
      const calendarId = await createCalendar(
        {
          ownerId: authUser.id,
          type,
          name: name.trim(),
          ...(trimmedDescription ? { description: trimmedDescription } : {}),
          color: selectedColor,
          affectsAvailability: showAsBusy,
        },
        ownerRole.id
      );

      if (groupId && calendarId) {
        await addCalendarToGroup(groupId, calendarId);
      }

      navigation.replace('CalendarDetail', { calendarId: calendarId });
    } finally {
      setIsSaving(false);
    }
  }, [
    authUser,
    ownerRole,
    isSaving,
    name,
    type,
    selectedColor,
    groupId,
    showAsBusy,
    description,
    createCalendar,
    addCalendarToGroup,
    navigation,
  ]);

  // Native header matching mockup: circular X button, bold title, filled Create button
  useEffect(() => {
    navigation.setOptions({
      title: 'New Calendar',
      headerTitleStyle: { fontSize: 17, fontWeight: '700' },
      headerLeft: () => (
        <RNPressable onPress={handleClose} hitSlop={8} style={styles.headerCloseButton}>
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
          onPress={() => {
            void handleSave();
          }}
          disabled={!isValid || isSaving}
          hitSlop={8}
          style={[
            styles.headerCreateButton,
            {
              backgroundColor: isValid ? calendarsUIColors.primary : calendarsUIColors.surfaceHover,
              opacity: isValid ? 1 : 0.7,
            },
          ]}
        >
          <RNText
            style={[
              styles.headerCreateButtonText,
              { color: isValid ? '#FFFFFF' : calendarsUIColors.textMuted },
            ]}
          >
            Create
          </RNText>
        </RNPressable>
      ),
    });
  }, [navigation, handleClose, handleSave, isValid, isSaving]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.formContent}>
          {/* Preview Card */}
          <CalendarPreviewCard name={name} type={type} color={selectedColor} />

          {/* Name */}
          <VStack>
            <SectionLabel label="Name" required />
            <TextInput
              style={styles.nameInput}
              placeholder="Calendar name"
              placeholderTextColor={calendarsUIColors.textMuted}
              value={name}
              onChangeText={(text) => {
                setName(text);
                if (formErrors.name) {
                  setFormErrors((prev) => {
                    const next = { ...prev };
                    delete next.name;
                    return next;
                  });
                }
              }}
              autoFocus
              returnKeyType="done"
              maxLength={100}
            />
            {formErrors.name && <Text className={errorTextStyle({})}>{formErrors.name}</Text>}
          </VStack>

          {/* Type */}
          <VStack>
            <SectionLabel label="Type" required />
            <View style={styles.typeCardsRow}>
              {TYPE_OPTIONS.map((option) => (
                <TypeCard
                  key={option.value}
                  option={option}
                  selected={type === option.value}
                  onPress={() => setType(option.value)}
                />
              ))}
            </View>
          </VStack>

          {/* Color */}
          <VStack>
            <SectionLabel label="Color" />
            <ColorSwatchGrid value={selectedColor} onChange={setSelectedColor} />
          </VStack>

          {/* Calendar Group */}
          <VStack>
            <SectionLabel label="Calendar Group" />
            <Pressable style={styles.groupPicker} onPress={() => groupSheetRef.current?.present()}>
              <RNText
                style={selectedGroup ? styles.groupPickerText : styles.groupPickerPlaceholder}
              >
                {selectedGroup?.name ?? 'No group (ungrouped)'}
              </RNText>
              <ChevronDownIcon />
            </Pressable>
          </VStack>

          {/* Show as Busy */}
          <View style={styles.toggleRow}>
            <RNText style={styles.toggleLabel}>Show as busy</RNText>
            <Switch
              value={showAsBusy}
              onValueChange={setShowAsBusy}
              trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
              thumbColor="#FFFFFF"
            />
          </View>

          {/* Description */}
          {!showDescription ? (
            <Pressable onPress={() => setShowDescription(true)}>
              <RNText style={styles.addDescriptionText}>+ Add description</RNText>
            </Pressable>
          ) : (
            <VStack>
              <SectionLabel label="Description" />
              <TextInput
                style={styles.descriptionInput}
                placeholder="What's this calendar for?"
                placeholderTextColor={calendarsUIColors.textMuted}
                value={description}
                onChangeText={setDescription}
                multiline
                numberOfLines={3}
                maxLength={500}
                autoFocus
              />
              {formErrors.description && (
                <Text className={errorTextStyle({})}>{formErrors.description}</Text>
              )}
            </VStack>
          )}
        </View>
      </ScrollView>

      <GroupPickerSheet
        sheetRef={groupSheetRef}
        groups={groups}
        selectedId={groupId}
        onSelect={setGroupId}
      />
    </KeyboardAvoidingView>
  );
}
