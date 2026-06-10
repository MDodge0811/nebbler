import { fireEvent, render } from '@testing-library/react-native';

import { SectionHeader } from '../SectionHeader';

describe('SectionHeader', () => {
  it('renders the label', () => {
    const { getByText } = render(<SectionHeader label="Your Connections" />);
    expect(getByText('Your Connections')).toBeTruthy();
  });

  it('renders the count when provided', () => {
    const { getByText } = render(<SectionHeader label="Your Connections" count={7} />);
    expect(getByText('(7)')).toBeTruthy();
  });

  it('renders a badge only when greater than zero', () => {
    const { queryByText, rerender } = render(<SectionHeader label="Pending Requests" badge={0} />);
    expect(queryByText('0')).toBeNull();
    rerender(<SectionHeader label="Pending Requests" badge={2} />);
    expect(queryByText('2')).toBeTruthy();
  });

  it('toggles when collapsible', () => {
    const onToggle = jest.fn();
    const { getByText } = render(
      <SectionHeader label="Sent Requests" collapsible open={false} onToggle={onToggle} />
    );
    fireEvent.press(getByText('Sent Requests'));
    expect(onToggle).toHaveBeenCalledTimes(1);
  });
});
