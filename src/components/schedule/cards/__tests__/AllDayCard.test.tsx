import { render, screen, fireEvent } from '@testing-library/react-native';

import { AllDayCard } from '../AllDayCard';

describe('AllDayCard', () => {
  it('renders the event title', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" />);
    expect(screen.getByText('Birthday')).toBeTruthy();
  });

  it('calls onPress when tapped (all-day events open the event)', () => {
    const onPress = jest.fn();
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" onPress={onPress} />);
    fireEvent.press(screen.getByLabelText('Birthday'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('calls onLongPress when long-pressed (meatball menu)', () => {
    const onLongPress = jest.fn();
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" onLongPress={onLongPress} />);
    fireEvent(screen.getByLabelText('Birthday'), 'longPress');
    expect(onLongPress).toHaveBeenCalledTimes(1);
  });

  it('renders star indicator when starred is true', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" starred />);
    expect(screen.getByLabelText('Starred')).toBeTruthy();
  });

  it('does not render star indicator when starred is false', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" starred={false} />);
    expect(screen.queryByLabelText('Starred')).toBeNull();
  });

  it('does not render star indicator when starred is absent', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" />);
    expect(screen.queryByLabelText('Starred')).toBeNull();
  });

  it('renders comment chip when commentCount > 0', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" commentCount={4} />);
    expect(screen.getByLabelText('4 comments')).toBeTruthy();
  });

  it('does not render comment chip when commentCount is 0', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" commentCount={0} />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('does not render comment chip when commentCount is absent', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('renders unread comment chip when hasUnreadComments is true', () => {
    render(<AllDayCard title="Birthday" tintColor="#FF6B6B" commentCount={1} hasUnreadComments />);
    expect(screen.getByLabelText('1 comment, unread')).toBeTruthy();
  });
});
