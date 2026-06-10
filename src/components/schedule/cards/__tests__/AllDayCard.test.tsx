import { render, screen } from '@testing-library/react-native';

import { AllDayCard } from '../AllDayCard';

describe('AllDayCard', () => {
  it('renders the event title', () => {
    render(<AllDayCard title="Birthday" />);
    expect(screen.getByText('Birthday')).toBeTruthy();
  });

  it('renders comment chip when commentCount > 0', () => {
    render(<AllDayCard title="Birthday" commentCount={4} />);
    expect(screen.getByLabelText('4 comments')).toBeTruthy();
  });

  it('does not render comment chip when commentCount is 0', () => {
    render(<AllDayCard title="Birthday" commentCount={0} />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('does not render comment chip when commentCount is absent', () => {
    render(<AllDayCard title="Birthday" />);
    expect(screen.queryByLabelText(/comment/)).toBeNull();
  });

  it('renders unread comment chip when hasUnreadComments is true', () => {
    render(<AllDayCard title="Birthday" commentCount={1} hasUnreadComments />);
    expect(screen.getByLabelText('1 comment, unread')).toBeTruthy();
  });
});
