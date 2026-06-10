import { useNavigation, useRoute } from '@react-navigation/native';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, BackHandler, useWindowDimensions } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { DynamicColorView } from '@/components/ui/dynamic';
import type { RootStackScreenProps } from '@navigation/types';

import {
  CreateEventFormProvider,
  useCreateEventFormContext,
  type CreateEventRouteParams,
} from './CreateEventFormContext';
import { Screen1WhatWho } from './Screen1WhatWho';
import { Screen2When } from './Screen2When';

/**
 * Inner shell — runs inside the form provider so it can read `isDirty` for the
 * discard guard. Owns the two-page horizontal slide and platform back handling.
 */
function CreateEventShellInner() {
  const navigation = useNavigation<RootStackScreenProps<'CreateEvent'>['navigation']>();
  const form = useCreateEventFormContext();
  const { width } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  const [page, setPage] = useState(0);
  const translateX = useSharedValue(0);
  const pageRef = useRef(0);
  // When true, the next dismissal bypasses the discard guard (e.g. after a save).
  const bypassGuardRef = useRef(false);

  const goToPage = useCallback(
    (next: 0 | 1) => {
      pageRef.current = next;
      setPage(next);
      translateX.value = withTiming(next === 1 ? -width : 0, { duration: 260 });
    },
    [translateX, width]
  );

  // iOS: disable the swipe-to-dismiss gesture while on page 1 so the OS swipe
  // doesn't dismiss the whole flow — Screen 2's Back button handles return.
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: page === 0 });
  }, [navigation, page]);

  // Single source of truth for the discard prompt. Guards every dismissal —
  // X button, Android back on page 0, iOS edge swipe, and programmatic goBack.
  useEffect(() => {
    const unsub = navigation.addListener('beforeRemove', (e) => {
      if (!form.isDirty || bypassGuardRef.current) return;
      e.preventDefault();
      Alert.alert('Discard event?', 'Your changes will be lost.', [
        { text: 'Keep editing', style: 'cancel' },
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => navigation.dispatch(e.data.action),
        },
      ]);
    });
    return unsub;
  }, [navigation, form.isDirty]);

  // Android hardware back: page 1 → page 0 (consume); page 0 → goBack (the
  // beforeRemove listener owns the discard Alert).
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (pageRef.current === 1) {
        goToPage(0);
        return true;
      }
      navigation.goBack();
      return true;
    });
    return () => sub.remove();
  }, [goToPage, navigation]);

  const handleSaved = useCallback(() => {
    // A successful save leaves the form dirty; skip the discard guard.
    bypassGuardRef.current = true;
    navigation.goBack();
  }, [navigation]);

  const sliderStyle = useAnimatedStyle(() => ({
    flexDirection: 'row',
    width: width * 2,
    flex: 1,
    transform: [{ translateX: translateX.value }],
  }));
  const pageStyle = useMemo(() => ({ width }), [width]);

  return (
    <DynamicColorView className="flex-1 bg-background-0" paddingTop={insets.top}>
      <Animated.View style={sliderStyle}>
        <Animated.View style={pageStyle}>
          <Screen1WhatWho onNext={() => goToPage(1)} onClose={() => navigation.goBack()} />
        </Animated.View>
        <Animated.View style={pageStyle}>
          <Screen2When onBack={() => goToPage(0)} onSaved={handleSaved} />
        </Animated.View>
      </Animated.View>
    </DynamicColorView>
  );
}

/**
 * Two-phase CreateEvent flow shell (NEB-137). A single full-screen route hosting
 * Screen 1 (What & Who) and Screen 2 (When) as horizontally-sliding pages over
 * one shared form-state context.
 */
export function CreateEventScreen() {
  const route = useRoute<RootStackScreenProps<'CreateEvent'>['route']>();
  const params = route.params as CreateEventRouteParams | undefined;

  return (
    <CreateEventFormProvider params={params}>
      <CreateEventShellInner />
    </CreateEventFormProvider>
  );
}
