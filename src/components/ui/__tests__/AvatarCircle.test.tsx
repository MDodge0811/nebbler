import { render } from '@testing-library/react-native';
import { AvatarCircle } from '../AvatarCircle';

const baseUser = {
  id: 'u1',
  first_name: 'Sarah',
  last_name: 'Chen',
  email: 'sarah@example.com',
  avatar_color: null as string | null,
};

describe('AvatarCircle', () => {
  it('renders the initials from first + last name', () => {
    const { getByText } = render(<AvatarCircle user={baseUser} size={56} />);
    expect(getByText('SC')).toBeTruthy();
  });

  it('uses avatar_color when present', () => {
    const user = { ...baseUser, avatar_color: '#FF6B6B' };
    const { getByTestId } = render(<AvatarCircle user={user} size={56} />);
    const circle = getByTestId('avatar-circle');
    expect(circle.props.style.backgroundColor).toBe('#FF6B6B15');
    expect(circle.props.style.borderColor).toBe('#FF6B6B30');
  });

  it('falls back to deterministic color when avatar_color is null', () => {
    const { getByTestId } = render(<AvatarCircle user={baseUser} size={56} />);
    const circle = getByTestId('avatar-circle');
    // getAvatarColor('u1') is deterministic; just assert it's set to one of the AVATAR_COLORS
    expect(circle.props.style.backgroundColor).toMatch(/^#[0-9A-F]{6}15$/i);
  });

  it('falls back to email local-part initial when names missing', () => {
    const user = { ...baseUser, first_name: null, last_name: null };
    const { getByText } = render(<AvatarCircle user={user} size={56} />);
    expect(getByText('S')).toBeTruthy();
  });

  it.each([32, 40, 56, 80])('renders at size %i', (size) => {
    const { getByTestId } = render(
      <AvatarCircle user={baseUser} size={size as 32 | 40 | 56 | 80} />
    );
    const circle = getByTestId('avatar-circle');
    expect(circle.props.style.width).toBe(size);
    expect(circle.props.style.height).toBe(size);
    expect(circle.props.style.borderRadius).toBe(size / 2);
  });
});
