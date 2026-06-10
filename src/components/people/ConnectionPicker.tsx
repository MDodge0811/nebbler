import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useMemo, useState } from 'react';
import { TextInput } from 'react-native';

import { Box } from '@/components/ui/box';
import { DynamicColorText, DynamicColorView } from '@/components/ui/dynamic';
import { Pressable } from '@/components/ui/pressable';
import { Text } from '@/components/ui/text';
import { PersonRow } from '@components/people/PersonRow';
import { calendarsUIColors } from '@constants/calendarsUI';
import { useConnections, type HydratedConnection } from '@hooks/useConnections';
import { useCurrentUser } from '@hooks/useCurrentUser';
import { getAvatarColor, getInitials } from '@utils/avatarColor';
import { displayName } from '@utils/displayName';

const labelStyle = tva({
  base: 'text-[13px] font-semibold uppercase tracking-wide text-brand-text-muted',
});
const memberSuffixStyle = tva({ base: 'text-[11px] text-brand-text-secondary' });
const bannerStyle = tva({
  base: 'rounded-[12px] border border-brand-primary-border bg-brand-primary-light px-[14px] py-[10px]',
});
const bannerTextStyle = tva({ base: 'text-[13px] leading-[18px] text-brand-success-text' });
const searchInputStyle = tva({
  base: 'rounded-[12px] border-[1.5px] border-brand-border bg-background-50 px-[14px] py-3 text-[14px] text-brand-text',
});
const resultsStyle = tva({
  base: 'mt-1 max-h-[220px] overflow-hidden rounded-[12px] border border-brand-border bg-background-0',
});
const emptyStyle = tva({ base: 'px-[14px] py-3 text-center text-[13px] text-brand-text-muted' });
const chipNameStyle = tva({ base: 'text-[13px] font-medium text-brand-text' });
const chipRemoveStyle = tva({ base: 'text-[13px] text-brand-text-muted' });

export interface ConnectionPickerProps {
  /** Currently selected people, as their user ids (a connection's `other_user_id`). */
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  /** Calendar accent color used for chips/avatars. */
  calendarColor?: string;
  /** `'social'` surfaces the member-count suffix + auto-include banner (NEB-133). */
  variant?: 'default' | 'social';
  /** Calendar member count, shown in the social variant header suffix. */
  memberCount?: number;
}

function connectionName(c: HydratedConnection): string {
  return displayName({
    id: c.other_user_id,
    first_name: c.first_name,
    last_name: c.last_name,
    email: null,
  });
}

/**
 * Reusable people picker over the current user's connections. Outputs an array
 * of selected user ids (each a connection's `other_user_id`). Selected people
 * render as removable chips above a search-filtered results list.
 *
 * NEB-133 reuses this with `variant='social'` + `memberCount` to show the
 * "calendar members included automatically" banner.
 */
export function ConnectionPicker({
  selectedIds,
  onChange,
  calendarColor,
  variant = 'default',
  memberCount = 0,
}: ConnectionPickerProps) {
  const { authUser } = useCurrentUser();
  const { connections } = useConnections(authUser?.id);
  const [search, setSearch] = useState('');

  const accent = calendarColor ?? calendarsUIColors.primary;
  const isSocial = variant === 'social';

  const selectedConnections = useMemo(
    () => connections.filter((c) => selectedIds.includes(c.other_user_id)),
    [connections, selectedIds]
  );

  const filteredResults = useMemo(() => {
    const q = search.trim().toLowerCase();
    return connections.filter((c) => {
      if (selectedIds.includes(c.other_user_id)) return false;
      if (!q) return true;
      return connectionName(c).toLowerCase().includes(q);
    });
  }, [connections, selectedIds, search]);

  const add = (id: string) => {
    if (!selectedIds.includes(id)) onChange([...selectedIds, id]);
    setSearch('');
  };

  const remove = (id: string) => {
    onChange(selectedIds.filter((x) => x !== id));
  };

  return (
    <Box>
      <Box className="mb-2 flex-row items-center gap-2">
        <Text className={labelStyle({})}>People</Text>
        {isSocial ? (
          <Text className={memberSuffixStyle({})}>
            {'·'} {memberCount} calendar members
          </Text>
        ) : null}
      </Box>

      {isSocial ? (
        <Box className={`mb-2 ${bannerStyle({})}`}>
          <Text className={bannerTextStyle({})}>
            All calendar members are included automatically. Add extra guests below.
          </Text>
        </Box>
      ) : null}

      {selectedConnections.length > 0 ? (
        <Box className="mb-2 flex-row flex-wrap gap-[6px]">
          {selectedConnections.map((c) => {
            const baseColor = c.avatar_color ?? getAvatarColor(c.other_user_id);
            const initials = getInitials(c.first_name, c.last_name, undefined);
            return (
              <DynamicColorView
                key={c.other_user_id}
                className="flex-row items-center gap-[6px] rounded-full border py-[5px] pl-[5px] pr-[10px]"
                backgroundColor={`${accent}12`}
                borderColor={`${accent}25`}
              >
                <DynamicColorView
                  className="h-6 w-6 items-center justify-center rounded-full"
                  backgroundColor={`${baseColor}25`}
                >
                  <DynamicColorText className="text-[11px] font-bold" color={baseColor}>
                    {initials}
                  </DynamicColorText>
                </DynamicColorView>
                <Text className={chipNameStyle({})}>{connectionName(c)}</Text>
                <Pressable
                  onPress={() => remove(c.other_user_id)}
                  hitSlop={8}
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${connectionName(c)}`}
                >
                  <Text className={chipRemoveStyle({})}>{'✕'}</Text>
                </Pressable>
              </DynamicColorView>
            );
          })}
        </Box>
      ) : null}

      <TextInput
        className={searchInputStyle({})}
        placeholder={isSocial ? 'Add extra guests…' : 'Add people…'}
        placeholderTextColor={calendarsUIColors.textMuted}
        value={search}
        onChangeText={setSearch}
        autoCorrect={false}
      />

      {search.trim().length > 0 ? (
        <Box className={resultsStyle({})}>
          {filteredResults.length > 0 ? (
            filteredResults.slice(0, 8).map((c) => (
              <PersonRow
                key={c.other_user_id}
                user={{
                  id: c.other_user_id,
                  first_name: c.first_name,
                  last_name: c.last_name,
                  avatar_color: c.avatar_color,
                }}
                trailing={<Text className={chipRemoveStyle({})}>{'＋'}</Text>}
                onPress={() => add(c.other_user_id)}
              />
            ))
          ) : (
            <Text className={emptyStyle({})}>No connections found</Text>
          )}
        </Box>
      ) : null}
    </Box>
  );
}
