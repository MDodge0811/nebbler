import { render, screen } from '@testing-library/react-native';

import { CommentChip } from '../CommentChip';

describe('CommentChip', () => {
  it('returns null when count is 0', () => {
    const { toJSON } = render(<CommentChip count={0} />);
    expect(toJSON()).toBeNull();
  });

  it('renders with a count of 1', () => {
    render(<CommentChip count={1} />);
    expect(screen.getByLabelText('1 comment')).toBeTruthy();
  });

  it('renders with a count > 1', () => {
    render(<CommentChip count={5} />);
    expect(screen.getByLabelText('5 comments')).toBeTruthy();
  });

  it('renders unread state with correct label', () => {
    render(<CommentChip count={3} hasUnread />);
    expect(screen.getByLabelText('3 comments, unread')).toBeTruthy();
  });

  it('renders read state (no unread indicator) by default', () => {
    render(<CommentChip count={2} />);
    expect(screen.getByLabelText('2 comments')).toBeTruthy();
  });
});
