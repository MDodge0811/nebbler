import { render } from '@testing-library/react-native';

import { RoleBadge } from '../RoleBadge';

describe('RoleBadge', () => {
  it.each(['owner', 'admin', 'member'] as const)('renders %s', (role) => {
    const { getByText } = render(<RoleBadge role={role} />);
    expect(getByText(role.charAt(0).toUpperCase() + role.slice(1))).toBeTruthy();
  });
});
