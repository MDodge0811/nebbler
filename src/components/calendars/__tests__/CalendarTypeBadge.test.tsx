import { render } from '@testing-library/react-native';
import { CalendarTypeBadge } from '../CalendarTypeBadge';

describe('CalendarTypeBadge', () => {
  it('renders the capitalized label', () => {
    const { getByText } = render(<CalendarTypeBadge type="social" color="#A78BFA" />);
    expect(getByText('Social')).toBeTruthy();
  });

  it('renders private with lock icon', () => {
    const { getByText } = render(<CalendarTypeBadge type="private" color="#00DB74" />);
    expect(getByText('🔒')).toBeTruthy();
    expect(getByText('Private')).toBeTruthy();
  });

  it('renders public with globe icon', () => {
    const { getByText } = render(<CalendarTypeBadge type="public" color="#00DB74" />);
    expect(getByText('🌐')).toBeTruthy();
  });
});
