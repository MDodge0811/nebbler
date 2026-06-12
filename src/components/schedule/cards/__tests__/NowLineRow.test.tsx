import { render, screen } from '@testing-library/react-native';

import { NowLineRow } from '../NowLineRow';

describe('NowLineRow', () => {
  it('renders the label', () => {
    render(<NowLineRow label="NOW · 9:32" />);
    expect(screen.getByLabelText('NOW · 9:32')).toBeTruthy();
  });

  it('renders with any time string', () => {
    render(<NowLineRow label="NOW · 3:45 PM" />);
    expect(screen.getByLabelText('NOW · 3:45 PM')).toBeTruthy();
  });
});
