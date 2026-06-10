import { fireEvent, render } from '@testing-library/react-native';

import { ConfirmDialog } from '../ConfirmDialog';

const baseProps = {
  visible: true,
  title: 'Remove Connection?',
  message: 'Removing Sarah will also remove them from shared calendars.',
  confirmLabel: 'Remove',
  onConfirm: jest.fn(),
  onCancel: jest.fn(),
};

beforeEach(() => jest.clearAllMocks());

describe('ConfirmDialog', () => {
  it('renders the title, message and confirm label when visible', () => {
    const { getByText } = render(<ConfirmDialog {...baseProps} />);
    expect(getByText('Remove Connection?')).toBeTruthy();
    expect(getByText('Removing Sarah will also remove them from shared calendars.')).toBeTruthy();
    expect(getByText('Remove')).toBeTruthy();
  });

  it('renders nothing when not visible', () => {
    const { queryByTestId } = render(<ConfirmDialog {...baseProps} visible={false} />);
    expect(queryByTestId('confirm-dialog')).toBeNull();
  });

  it('fires onConfirm / onCancel', () => {
    const { getByTestId } = render(<ConfirmDialog {...baseProps} />);
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(baseProps.onConfirm).toHaveBeenCalledTimes(1);
    fireEvent.press(getByTestId('confirm-dialog-cancel'));
    expect(baseProps.onCancel).toHaveBeenCalledTimes(1);
  });

  it('disables confirm when confirmDisabled is set', () => {
    const onConfirm = jest.fn();
    const { getByTestId } = render(
      <ConfirmDialog {...baseProps} onConfirm={onConfirm} confirmDisabled />
    );
    fireEvent.press(getByTestId('confirm-dialog-confirm'));
    expect(onConfirm).not.toHaveBeenCalled();
  });
});
