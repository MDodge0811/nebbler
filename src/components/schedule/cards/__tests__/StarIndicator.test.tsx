import { render, screen } from '@testing-library/react-native';

import { StarIndicator } from '../StarIndicator';

describe('StarIndicator', () => {
  it('renders with the "Starred" accessibility label', () => {
    render(<StarIndicator />);
    expect(screen.getByLabelText('Starred')).toBeTruthy();
  });
});
