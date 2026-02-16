import { tva } from '@gluestack-ui/utils/nativewind-utils';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Box } from '@/components/ui/box';
import { Text } from '@/components/ui/text';
import { Pressable } from '@/components/ui/pressable';
import { VStack } from '@/components/ui/vstack';
import type { DrawerContentComponentProps } from '@react-navigation/drawer';

const containerStyle = tva({ base: 'flex-1 bg-background-0' });
const headerStyle = tva({ base: 'px-5 pb-4 border-b border-outline-200' });
const headerTextStyle = tva({ base: 'text-lg font-bold text-typography-900' });
const menuStyle = tva({ base: 'px-2 pt-2' });
const menuItemStyle = tva({ base: 'px-3 py-3 rounded-md active:bg-background-100' });
const menuItemTextStyle = tva({ base: 'text-base text-typography-700' });

export function DrawerContent({ navigation }: DrawerContentComponentProps) {
  const insets = useSafeAreaInsets();

  return (
    <Box className={containerStyle({})} style={{ paddingTop: insets.top }}>
      <Box className={headerStyle({})}>
        <Text className={headerTextStyle({})}>Menu</Text>
      </Box>

      <VStack className={menuStyle({})}>
        <Pressable
          className={menuItemStyle({})}
          onPress={() => navigation.closeDrawer()}
          accessibilityRole="button"
        >
          <Text className={menuItemTextStyle({})}>Settings</Text>
        </Pressable>
        <Pressable
          className={menuItemStyle({})}
          onPress={() => navigation.closeDrawer()}
          accessibilityRole="button"
        >
          <Text className={menuItemTextStyle({})}>Create Calendar</Text>
        </Pressable>
      </VStack>
    </Box>
  );
}
