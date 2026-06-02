import { fireEvent, render } from '@testing-library/react-native';

import { CALENDAR_PALETTE } from '@constants/calendarsUI';

import { ColorSwatchGrid } from '../ColorSwatchGrid';

describe('ColorSwatchGrid', () => {
  it('renders all 12 swatches', () => {
    const { getAllByTestId } = render(
      <ColorSwatchGrid value={CALENDAR_PALETTE[0].hex} onChange={() => {}} />
    );
    expect(getAllByTestId(/color-swatch-/)).toHaveLength(12);
  });

  it('marks the selected swatch with a check overlay', () => {
    const { queryByTestId } = render(
      <ColorSwatchGrid value={CALENDAR_PALETTE[2].hex} onChange={() => {}} />
    );
    expect(queryByTestId(`color-swatch-${CALENDAR_PALETTE[2].hex}-selected`)).toBeTruthy();
    expect(queryByTestId(`color-swatch-${CALENDAR_PALETTE[0].hex}-selected`)).toBeNull();
  });

  it('fires onChange with the tapped swatch hex', () => {
    const onChange = jest.fn();
    const { getByTestId } = render(
      <ColorSwatchGrid value={CALENDAR_PALETTE[0].hex} onChange={onChange} />
    );
    fireEvent.press(getByTestId(`color-swatch-${CALENDAR_PALETTE[5].hex}`));
    expect(onChange).toHaveBeenCalledWith(CALENDAR_PALETTE[5].hex);
  });

  it('matches the selected swatch case-insensitively', () => {
    const lowercase = CALENDAR_PALETTE[2].hex.toLowerCase();
    const { queryByTestId } = render(<ColorSwatchGrid value={lowercase} onChange={() => {}} />);
    // Stored value happens to be lowercase; palette uses uppercase — still highlights it.
    expect(queryByTestId(`color-swatch-${CALENDAR_PALETTE[2].hex}-selected`)).toBeTruthy();
  });
});
