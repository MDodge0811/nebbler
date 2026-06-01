import { fireEvent, render } from '@testing-library/react-native';
import { ColorSwatchGrid } from '../ColorSwatchGrid';
import { CALENDAR_PALETTE } from '@constants/calendarsUI';

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
});
