import { render } from '@testing-library/react-native';
import { RsvpBadge } from '../RsvpBadge';

describe('RsvpBadge', () => {
  it('renders Going label', () => {
    const { getByText } = render(<RsvpBadge status="going" />);
    expect(getByText('Going')).toBeTruthy();
  });
  it('renders Not Going label', () => {
    const { getByText } = render(<RsvpBadge status="not_going" />);
    expect(getByText('Not Going')).toBeTruthy();
  });
  it('returns null for null status', () => {
    const { toJSON } = render(<RsvpBadge status={null} />);
    expect(toJSON()).toBeNull();
  });
});
