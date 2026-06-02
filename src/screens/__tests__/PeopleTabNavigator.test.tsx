import { fireEvent, render } from '@testing-library/react-native';

import { AddConnectionHeaderButton } from '../PeopleTabNavigator';

describe('AddConnectionHeaderButton', () => {
  it('renders an accessible "Add connection" button', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<AddConnectionHeaderButton onPress={onPress} />);
    expect(getByLabelText('Add connection')).toBeTruthy();
  });

  it('invokes onPress when tapped (wired by the navigator to navigate("AddConnection"))', () => {
    const onPress = jest.fn();
    const { getByLabelText } = render(<AddConnectionHeaderButton onPress={onPress} />);
    fireEvent.press(getByLabelText('Add connection'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });
});
