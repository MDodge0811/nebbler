import { render, fireEvent } from '@testing-library/react-native';
import { DeleteCalendarConfirmModal } from '../DeleteCalendarConfirmModal';

describe('DeleteCalendarConfirmModal', () => {
  it('returns null when not visible', () => {
    const { queryByText } = render(
      <DeleteCalendarConfirmModal
        visible={false}
        calendarName="X"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(queryByText(/Delete/)).toBeNull();
  });

  it('renders calendar name in the title', () => {
    const { getByText } = render(
      <DeleteCalendarConfirmModal
        visible
        calendarName="Game Night"
        onCancel={jest.fn()}
        onConfirm={jest.fn()}
      />
    );
    expect(getByText('Delete Game Night?')).toBeTruthy();
  });

  it('calls onCancel and onConfirm', () => {
    const onCancel = jest.fn();
    const onConfirm = jest.fn();
    const { getByText } = render(
      <DeleteCalendarConfirmModal
        visible
        calendarName="X"
        onCancel={onCancel}
        onConfirm={onConfirm}
      />
    );
    fireEvent.press(getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
    fireEvent.press(getByText('Delete'));
    expect(onConfirm).toHaveBeenCalled();
  });
});
