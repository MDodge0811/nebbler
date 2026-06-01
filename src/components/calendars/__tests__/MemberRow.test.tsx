import { render } from '@testing-library/react-native';

import { MemberRow } from '../MemberRow';

const member = {
  id: 'm1',
  user_id: 'u1',
  role_id: 'r1',
  role_level: 40,
  role_name: 'owner',
  display_name: 'Sarah Chen',
  avatar_initial: 'S',
};

describe('MemberRow', () => {
  it('renders display name and role badge', () => {
    const { getByText } = render(<MemberRow member={member} calendarColor="#A78BFA" />);
    expect(getByText('Sarah Chen')).toBeTruthy();
    expect(getByText('S')).toBeTruthy();
    expect(getByText('Owner')).toBeTruthy();
  });
});
