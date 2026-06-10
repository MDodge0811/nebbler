import { render, screen, fireEvent } from '@testing-library/react-native';
import React from 'react';

import type { MainTabScreenProps } from '@navigation/types';

import { SettingsScreen } from '../SettingsScreen';

jest.mock('@hooks/useAuth', () => ({
  useAuth: () => ({
    user: { id: 'user-123', email: 'test@example.com' },
    clerkUser: null,
    signOut: jest.fn(),
  }),
}));

jest.mock('@powersync/react', () => ({
  useQuery: jest.fn().mockReturnValue({ data: [], isLoading: false, error: undefined }),
  useStatus: jest.fn().mockReturnValue({ connected: true, hasSynced: true }),
}));

jest.mock('@components/SyncStatusIndicator', () => ({
  SyncStatusIndicator: () => null,
}));

function makeNavigation(navigate = jest.fn()) {
  return {
    navigate,
    goBack: jest.fn(),
    dispatch: jest.fn(),
    setOptions: jest.fn(),
  } as unknown as MainTabScreenProps<'Settings'>['navigation'];
}

function makeRoute() {
  return {
    key: 'Settings',
    name: 'Settings' as const,
    params: undefined,
  } as MainTabScreenProps<'Settings'>['route'];
}

describe('SettingsScreen', () => {
  it('renders a Profile row at the top', () => {
    render(<SettingsScreen navigation={makeNavigation()} route={makeRoute()} />);
    expect(screen.getByLabelText('Profile')).toBeTruthy();
    expect(screen.getByText('Profile')).toBeTruthy();
  });

  it('pressing Profile row navigates to Profile screen', () => {
    const navigate = jest.fn();
    render(<SettingsScreen navigation={makeNavigation(navigate)} route={makeRoute()} />);
    fireEvent.press(screen.getByLabelText('Profile'));
    expect(navigate).toHaveBeenCalledWith('Profile');
  });

  it('renders the email section', () => {
    render(<SettingsScreen navigation={makeNavigation()} route={makeRoute()} />);
    expect(screen.getByText('test@example.com')).toBeTruthy();
  });
});
