import {
  isCreateCalendarDirty,
  type CreateCalendarDirtyState,
} from '@screens/CreateCalendarScreen';

const DEFAULT_COLOR = '#00DB74';

const pristine = (): CreateCalendarDirtyState => ({
  name: '',
  type: 'private',
  selectedColor: DEFAULT_COLOR,
  groupId: null,
  showAsBusy: true,
  description: '',
});

describe('isCreateCalendarDirty', () => {
  it('returns false for a pristine form', () => {
    expect(isCreateCalendarDirty(pristine(), DEFAULT_COLOR)).toBe(false);
  });

  it('treats whitespace-only name as pristine', () => {
    expect(isCreateCalendarDirty({ ...pristine(), name: '   ' }, DEFAULT_COLOR)).toBe(false);
  });

  it('is dirty when name has content', () => {
    expect(isCreateCalendarDirty({ ...pristine(), name: 'Book Club' }, DEFAULT_COLOR)).toBe(true);
  });

  it('is dirty when type changed from private', () => {
    expect(isCreateCalendarDirty({ ...pristine(), type: 'social' }, DEFAULT_COLOR)).toBe(true);
  });

  it('is dirty when color differs from the default', () => {
    expect(isCreateCalendarDirty({ ...pristine(), selectedColor: '#FF0000' }, DEFAULT_COLOR)).toBe(
      true
    );
  });

  it('is dirty when a group is selected', () => {
    expect(isCreateCalendarDirty({ ...pristine(), groupId: 'group-1' }, DEFAULT_COLOR)).toBe(true);
  });

  it('is dirty when show-as-busy is toggled off', () => {
    expect(isCreateCalendarDirty({ ...pristine(), showAsBusy: false }, DEFAULT_COLOR)).toBe(true);
  });

  it('is dirty when a description is entered', () => {
    expect(isCreateCalendarDirty({ ...pristine(), description: 'notes' }, DEFAULT_COLOR)).toBe(
      true
    );
  });
});
