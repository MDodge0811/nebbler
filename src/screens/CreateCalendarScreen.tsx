import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { BottomSheetBackdrop, BottomSheetModal, BottomSheetScrollView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { type RefObject, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, KeyboardAvoidingView, Platform, ScrollView, Switch, TextInput } from 'react-native';
import Svg, { Circle, Path, Rect } from 'react-native-svg';
import { ZodError } from 'zod';

import { Box } from '@/components/ui/box';
import { DynamicColorView } from '@/components/ui/dynamic';
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
const formContentStyle = tva({ base: 'gap-6 p-4 pt-5' });
const sectionLabelStyle = tva({
  base: 'mb-2 text-[13px] font-semibold uppercase tracking-[0.3px] text-brand-text-muted',
});
const requiredStarStyle = tva({ base: 'ml-0.5 text-brand-danger' });
const headerCloseButtonStyle = tva({
  base: 'h-9 w-9 items-center justify-center rounded-full bg-typography-50',
});
const headerCreateButtonStyle = tva({
  base: 'rounded-[10px] px-[18px] py-2',
  variants: {
    valid: { true: 'bg-brand-primary opacity-100', false: 'bg-typography-50 opacity-70' },
  },
});
const headerCreateTextStyle = tva({
  base: 'text-sm font-bold tracking-[0.1px]',
  variants: { valid: { true: 'text-typography-white', false: 'text-brand-text-muted' } },
});
const previewCardStyle = tva({
  base: 'flex-row items-center gap-[14px] rounded-2xl border border-brand-border bg-background-0 p-4',
});
const previewIconStyle = tva({
  base: 'h-[52px] w-[52px] items-center justify-center rounded-[14px] border-2',
});
const previewLetterStyle = tva({ base: 'text-2xl font-semibold text-brand-text' });
const previewEmojiStyle = tva({ base: 'text-2xl' });
const previewNameStyle = tva({
  base: 'text-[17px] font-semibold tracking-[-0.2px]',
  variants: { hasName: { true: 'text-brand-text', false: 'text-brand-text-muted' } },
});
const previewTypeStyle = tva({ base: 'mt-0.5 text-[13px] capitalize text-brand-text-muted' });
const nameInputStyle = tva({
  base: 'w-full rounded-xl border-[1.5px] border-brand-border bg-typography-50 px-[14px] py-3 text-base font-medium text-brand-text',
});
const typeCardsRowStyle = tva({ base: 'flex-row gap-2' });
const typeCardStyle = tva({
  base: 'flex-1 items-center gap-1.5 rounded-[14px] border-[1.5px] border-brand-border bg-background-0 px-2 py-3',
  variants: { selected: { true: 'border-2 border-brand-primary bg-brand-primary-light' } },
});
const typeIconBoxStyle = tva({ base: 'h-10 w-10 items-center justify-center rounded-[10px]' });
const typeLabelStyle = tva({ base: 'text-center text-sm font-semibold text-brand-text' });
const typeDescriptionStyle = tva({
  base: 'text-center text-[11px] leading-[15px] text-brand-text-secondary',
});
const groupPickerStyle = tva({
  base: 'flex-row items-center justify-between rounded-xl border-[1.5px] border-brand-border bg-typography-50 px-[14px] py-3',
});
const groupPickerTextStyle = tva({
  base: 'text-[15px] font-medium',
  variants: { selected: { true: 'text-brand-text', false: 'text-brand-text-muted' } },
});
const toggleRowStyle = tva({ base: 'flex-row items-center justify-between' });
const toggleLabelStyle = tva({ base: 'text-[15px] font-medium text-brand-text' });
const descriptionInputStyle = tva({
  base: 'min-h-[80px] w-full rounded-xl border-[1.5px] border-brand-border bg-typography-50 px-[14px] py-3 text-[15px] font-normal leading-[22px] text-brand-text',
});
const addDescriptionTextStyle = tva({ base: 'text-[15px] font-medium text-brand-primary' });
const sheetContentStyle = tva({ base: 'pb-[50px]' });
const sheetTitleStyle = tva({ base: 'px-4 pb-3 pt-1 text-[17px] font-semibold text-brand-text' });
const sheetItemStyle = tva({
  base: 'flex-row items-center justify-between border-b border-brand-border px-4 py-3.5',
});
const sheetItemTextStyle = tva({
  base: 'text-base',
  variants: { selected: { true: 'font-semibold text-brand-primary', false: 'text-brand-text' } },
});

// --- Inline components ---

function SectionLabel({ label, required }: { label: string; required?: boolean }) {
  return (
    <Text className={sectionLabelStyle({})}>
      {label}
      {required && <Text className={requiredStarStyle({})}>*</Text>}
    </Text>
  );
}

function CalendarPreviewCard({ name, type, color }: { name: string; type: string; color: string }) {
  const hasName = name.trim().length > 0;
  // Tinted background: 8% opacity of the selected color
  const tintBg = `${color}14`;
  const tintBorder = `${color}30`;

  return (
    <Box className={previewCardStyle({})}>
      <DynamicColorView
        className={previewIconStyle({})}
        backgroundColor={tintBg}
        borderColor={tintBorder}
      >
        {hasName ? (
          <Text className={previewLetterStyle({})}>{name.trim()[0]!.toUpperCase()}</Text>
        ) : (
          <Text className={previewEmojiStyle({})}>{'📅'}</Text>
        )}
      </DynamicColorView>
      <Box>
        <Text className={previewNameStyle({ hasName })}>
          {hasName ? name.trim() : 'Calendar name'}
        </Text>
        <Text className={previewTypeStyle({})}>{type} calendar</Text>
      </Box>
    </Box>
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
    <Pressable className={typeCardStyle({ selected })} onPress={onPress}>
      <DynamicColorView className={typeIconBoxStyle({})} backgroundColor={iconBg}>
        <Icon size={22} color={iconColor} />
      </DynamicColorView>
      <Text className={typeLabelStyle({})}>{option.label}</Text>
      <Text className={typeDescriptionStyle({})}>{option.description}</Text>
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
      <BottomSheetScrollView>
        <Box className={sheetContentStyle({})}>
          <Text className={sheetTitleStyle({})}>Choose Group</Text>
          <Pressable className={sheetItemStyle({})} onPress={() => handleSelect(null)}>
            <Text className={sheetItemTextStyle({ selected: selectedId === null })}>
              No group (ungrouped)
            </Text>
            {selectedId === null && <CheckIcon size={14} color={calendarsUIColors.primary} />}
          </Pressable>
          {groups.map((g) => (
            <Pressable key={g.id} className={sheetItemStyle({})} onPress={() => handleSelect(g.id)}>
              <Text className={sheetItemTextStyle({ selected: selectedId === g.id })}>
                {g.name}
              </Text>
              {selectedId === g.id && <CheckIcon size={14} color={calendarsUIColors.primary} />}
            </Pressable>
          ))}
        </Box>
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
        <Pressable onPress={handleClose} hitSlop={8} className={headerCloseButtonStyle({})}>
          <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
            <Path
              d="M5 5L15 15M15 5L5 15"
              stroke={calendarsUIColors.text}
              strokeWidth={2}
              strokeLinecap="round"
            />
          </Svg>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          onPress={() => {
            void handleSave();
          }}
          disabled={!isValid || isSaving}
          hitSlop={8}
          className={headerCreateButtonStyle({ valid: isValid })}
        >
          <Text className={headerCreateTextStyle({ valid: isValid })}>Create</Text>
        </Pressable>
      ),
    });
  }, [navigation, handleClose, handleSave, isValid, isSaving]);

  const selectedGroup = groups.find((g) => g.id === groupId);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      className={containerStyle({})}
    >
      <ScrollView contentContainerClassName="grow pb-10" keyboardShouldPersistTaps="handled">
        <Box className={formContentStyle({})}>
          {/* Preview Card */}
          <CalendarPreviewCard name={name} type={type} color={selectedColor} />

          {/* Name */}
          <VStack>
            <SectionLabel label="Name" required />
            <TextInput
              className={nameInputStyle({})}
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
            <Box className={typeCardsRowStyle({})}>
              {TYPE_OPTIONS.map((option) => (
                <TypeCard
                  key={option.value}
                  option={option}
                  selected={type === option.value}
                  onPress={() => setType(option.value)}
                />
              ))}
            </Box>
          </VStack>

          {/* Color */}
          <VStack>
            <SectionLabel label="Color" />
            <ColorSwatchGrid value={selectedColor} onChange={setSelectedColor} />
          </VStack>

          {/* Calendar Group */}
          <VStack>
            <SectionLabel label="Calendar Group" />
            <Pressable
              className={groupPickerStyle({})}
              onPress={() => groupSheetRef.current?.present()}
            >
              <Text className={groupPickerTextStyle({ selected: Boolean(selectedGroup) })}>
                {selectedGroup?.name ?? 'No group (ungrouped)'}
              </Text>
              <ChevronDownIcon />
            </Pressable>
          </VStack>

          {/* Show as Busy */}
          <Box className={toggleRowStyle({})}>
            <Text className={toggleLabelStyle({})}>Show as busy</Text>
            <Switch
              value={showAsBusy}
              onValueChange={setShowAsBusy}
              trackColor={{ false: calendarsUIColors.border, true: calendarsUIColors.primary }}
              thumbColor="#FFFFFF"
            />
          </Box>

          {/* Description */}
          {!showDescription ? (
            <Pressable onPress={() => setShowDescription(true)}>
              <Text className={addDescriptionTextStyle({})}>+ Add description</Text>
            </Pressable>
          ) : (
            <VStack>
              <SectionLabel label="Description" />
              <TextInput
                className={descriptionInputStyle({})}
                textAlignVertical="top"
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
        </Box>
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
