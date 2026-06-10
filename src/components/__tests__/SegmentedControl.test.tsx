import { fireEvent, render } from '@testing-library/react-native';

import { SegmentedControl } from '../SegmentedControl';

const options = [
  { label: 'Busy', value: 'busy' },
  { label: 'Free', value: 'free' },
];

describe('SegmentedControl', () => {
  it('renders all options', () => {
    const { getByText } = render(
      <SegmentedControl options={options} value="busy" onChange={() => {}} />
    );
    expect(getByText('Busy')).toBeTruthy();
    expect(getByText('Free')).toBeTruthy();
  });

  it('calls onChange with the pressed option value', () => {
    const onChange = jest.fn();
    const { getByText } = render(
      <SegmentedControl options={options} value="busy" onChange={onChange} />
    );
    fireEvent.press(getByText('Free'));
    expect(onChange).toHaveBeenCalledWith('free');
  });

  it('marks the selected segment via accessibilityState', () => {
    const { getByLabelText } = render(
      <SegmentedControl options={options} value="free" onChange={() => {}} />
    );
    const free = getByLabelText('Free') as { props: { accessibilityState?: unknown } };
    const busy = getByLabelText('Busy') as { props: { accessibilityState?: unknown } };
    expect(free.props.accessibilityState).toEqual({ selected: true });
    expect(busy.props.accessibilityState).toEqual({ selected: false });
  });
});
