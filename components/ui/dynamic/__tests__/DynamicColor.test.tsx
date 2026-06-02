import { render } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { DynamicColorText, DynamicColorView } from '../index';

describe('DynamicColorView', () => {
  it('applies backgroundColor and borderColor via inline style', () => {
    const { getByTestId } = render(
      <DynamicColorView
        testID="dyn-view"
        backgroundColor="#00DB74"
        borderColor="#FF6B6B30"
        className="h-9 w-9 rounded-2xl"
      />
    );
    const flat = StyleSheet.flatten(getByTestId('dyn-view').props.style);
    expect(flat).toMatchObject({ backgroundColor: '#00DB74', borderColor: '#FF6B6B30' });
  });

  it('omits color keys that are not provided', () => {
    const { getByTestId } = render(
      <DynamicColorView testID="dyn-view" backgroundColor="#00DB74" />
    );
    const flat = StyleSheet.flatten(getByTestId('dyn-view').props.style) ?? {};
    expect(flat.backgroundColor).toBe('#00DB74');
    expect('borderColor' in flat).toBe(false);
  });

  it('forwards className to the underlying Box', () => {
    const { getByTestId } = render(
      <DynamicColorView testID="dyn-view" backgroundColor="#000000" className="rounded-2xl" />
    );
    expect(getByTestId('dyn-view').props.className).toContain('rounded-2xl');
  });

  it('applies shadowColor and zIndex via inline style', () => {
    const { getByTestId } = render(
      <DynamicColorView testID="dyn-view" backgroundColor="#00DB74" shadowColor="#00DB74" zIndex={3} />
    );
    const flat = StyleSheet.flatten(getByTestId('dyn-view').props.style);
    expect(flat).toMatchObject({ backgroundColor: '#00DB74', shadowColor: '#00DB74', zIndex: 3 });
  });

  it('omits shadowColor and zIndex when not provided', () => {
    const { getByTestId } = render(
      <DynamicColorView testID="dyn-view" backgroundColor="#00DB74" />
    );
    const flat = StyleSheet.flatten(getByTestId('dyn-view').props.style) ?? {};
    expect('shadowColor' in flat).toBe(false);
    expect('zIndex' in flat).toBe(false);
  });
});

describe('DynamicColorText', () => {
  it('applies color via inline style', () => {
    const { getByText } = render(
      <DynamicColorText color="#1A1A1F" className="text-base font-bold">
        Hello
      </DynamicColorText>
    );
    const flat = StyleSheet.flatten(getByText('Hello').props.style);
    expect(flat).toMatchObject({ color: '#1A1A1F' });
  });

  it('forwards className to the underlying Text', () => {
    const { getByText } = render(
      <DynamicColorText color="#1A1A1F" className="text-base">
        Hello
      </DynamicColorText>
    );
    expect(getByText('Hello').props.className).toContain('text-base');
  });
});
