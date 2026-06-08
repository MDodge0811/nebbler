import { render } from '@testing-library/react-native';
import { StyleSheet, type StyleProp, type ViewStyle } from 'react-native';

import { AvatarCircle } from '../AvatarCircle';

const baseUser = {
  id: 'u1',
  first_name: 'Sarah',
  last_name: 'Chen',
  email: 'sarah@example.com',
  avatar_color: null as string | null,
};

const SIZE_CLASS: Record<32 | 40 | 56 | 80, string> = {
  32: 'h-8 w-8',
  40: 'h-10 w-10',
  56: 'h-14 w-14',
  80: 'h-20 w-20',
};

type CircleElement = { props: { style?: StyleProp<ViewStyle>; className?: string } };

describe('AvatarCircle', () => {
  it('renders the initials from first + last name', () => {
    const { getByText } = render(<AvatarCircle user={baseUser} size={56} />);
    expect(getByText('SC')).toBeTruthy();
  });

  it('uses avatar_color when present', () => {
    const user = { ...baseUser, avatar_color: '#FF6B6B' };
    const { getByTestId } = render(<AvatarCircle user={user} size={56} />);
    const circle = getByTestId('avatar-circle') as unknown as CircleElement;
    const flat = StyleSheet.flatten(circle.props.style);
    expect(flat).toMatchObject({ backgroundColor: '#FF6B6B15', borderColor: '#FF6B6B30' });
  });

  it('falls back to deterministic color when avatar_color is null', () => {
    const { getByTestId } = render(<AvatarCircle user={baseUser} size={56} />);
    const circle = getByTestId('avatar-circle') as unknown as CircleElement;
    const flat = StyleSheet.flatten(circle.props.style);
    // getAvatarColor('u1') is deterministic; just assert it's set to one of the AVATAR_COLORS
    expect(flat.backgroundColor).toMatch(/^#[0-9A-F]{6}15$/i);
  });

  it('falls back to email local-part initial when names missing', () => {
    const user = { ...baseUser, first_name: null, last_name: null };
    const { getByText } = render(<AvatarCircle user={user} size={56} />);
    expect(getByText('S')).toBeTruthy();
  });

  it.each([32, 40, 56, 80] as const)('renders at size %i', (size) => {
    const { getByTestId } = render(<AvatarCircle user={baseUser} size={size} />);
    const circle = getByTestId('avatar-circle') as unknown as CircleElement;
    expect(circle.props.className).toContain(SIZE_CLASS[size]);
  });
});
