import { fireEvent, render } from '@testing-library/react-native';
import { Text } from 'react-native';

import { PersonRow } from '../PersonRow';

const sarah = {
  id: 'u1',
  first_name: 'Sarah',
  last_name: 'Chen',
  email: 'sarah@example.com',
  avatar_color: null,
};

describe('PersonRow', () => {
  it('renders the display name', () => {
    const { getByText } = render(<PersonRow user={sarah} trailing={<Text>action</Text>} />);
    expect(getByText('Sarah Chen')).toBeTruthy();
  });

  it('renders the trailing slot', () => {
    const { getByText } = render(<PersonRow user={sarah} trailing={<Text>my-trailing</Text>} />);
    expect(getByText('my-trailing')).toBeTruthy();
  });

  it('invokes onPress when the row is pressed', () => {
    const onPress = jest.fn();
    const { getByTestId } = render(
      <PersonRow user={sarah} trailing={<Text>x</Text>} onPress={onPress} />
    );
    fireEvent.press(getByTestId('person-row'));
    expect(onPress).toHaveBeenCalled();
  });

  it('renders without Pressable when onPress is omitted', () => {
    const { getByTestId } = render(<PersonRow user={sarah} trailing={<Text>x</Text>} />);
    expect(getByTestId('person-row')).toBeTruthy();
  });

  it('renders a string subtitle under the name', () => {
    const { getByText } = render(
      <PersonRow user={sarah} trailing={<Text>x</Text>} subtitle="@sarah · 2 shared" />
    );
    expect(getByText('@sarah · 2 shared')).toBeTruthy();
  });

  it('omits the subtitle slot when not provided', () => {
    const { queryByText } = render(<PersonRow user={sarah} trailing={<Text>x</Text>} />);
    expect(queryByText('@sarah · 2 shared')).toBeNull();
  });

  it('truncates long names to a single line', () => {
    const longName = {
      ...sarah,
      first_name: 'Sarahbethanymariannakatlyn',
      last_name: 'Chendelvecciowinterbottom',
    };
    const { getByText } = render(<PersonRow user={longName} trailing={<Text>x</Text>} />);
    const nameEl = getByText('Sarahbethanymariannakatlyn Chendelvecciowinterbottom') as unknown as {
      props: { numberOfLines: number };
    };
    expect(nameEl.props.numberOfLines).toBe(1);
  });
});
