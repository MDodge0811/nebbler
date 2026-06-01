import { render, fireEvent } from '@testing-library/react-native';
import { Switch } from 'react-native';

import { ToggleRow } from '../ToggleRow';

describe('ToggleRow', () => {
  it('calls onChange when toggled', () => {
    const onChange = jest.fn();
    const { UNSAFE_getByType } = render(
      <ToggleRow checked={false} onChange={onChange} label="RSVP Enabled" description="d" />
    );
    fireEvent(UNSAFE_getByType(Switch), 'valueChange', true);
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it('renders label and description', () => {
    const { getByText } = render(
      <ToggleRow
        checked={true}
        onChange={() => {}}
        label="Show as busy"
        description="counts toward availability"
      />
    );
    expect(getByText('Show as busy')).toBeTruthy();
    expect(getByText('counts toward availability')).toBeTruthy();
  });
});
