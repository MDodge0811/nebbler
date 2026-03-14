import { useDragStore } from '../useDragStore';
import type { Calendar } from '@database/schema';

const mockCalendar = {
  id: 'cal-1',
  name: 'Work',
  type: 'private',
  owner_id: 'user-1',
  color: '#FF0000',
} as unknown as Calendar;

describe('useDragStore', () => {
  beforeEach(() => {
    useDragStore.getState().reset();
  });

  describe('startDrag / endDrag lifecycle', () => {
    it('startDrag sets isDragging and stores calendar', () => {
      useDragStore.getState().startDrag(mockCalendar, 'group-1');
      const state = useDragStore.getState();
      expect(state.isDragging).toBe(true);
      expect(state.draggedCalendar).toBe(mockCalendar);
      expect(state.sourceGroupId).toBe('group-1');
    });

    it('startDrag resets activeDropZoneId', () => {
      useDragStore.getState().setActiveDropZone('zone-1');
      useDragStore.getState().startDrag(mockCalendar, null);
      expect(useDragStore.getState().activeDropZoneId).toBeNull();
    });

    it('endDrag returns activeDropZoneId and resets state', () => {
      useDragStore.getState().startDrag(mockCalendar, 'group-1');
      useDragStore.getState().setActiveDropZone('zone-2');
      const result = useDragStore.getState().endDrag();
      expect(result).toBe('zone-2');

      const state = useDragStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedCalendar).toBeNull();
      expect(state.activeDropZoneId).toBeNull();
      expect(state.dragPageY).toBe(0);
    });

    it('endDrag returns null when no active drop zone', () => {
      useDragStore.getState().startDrag(mockCalendar, null);
      expect(useDragStore.getState().endDrag()).toBeNull();
    });
  });

  describe('cancelDrag', () => {
    it('resets all drag state', () => {
      useDragStore.getState().startDrag(mockCalendar, 'group-1');
      useDragStore.getState().updateDragPosition(500);
      useDragStore.getState().cancelDrag();

      const state = useDragStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedCalendar).toBeNull();
      expect(state.dragPageY).toBe(0);
    });
  });

  describe('updateDragPosition', () => {
    it('updates dragPageY', () => {
      useDragStore.getState().updateDragPosition(350);
      expect(useDragStore.getState().dragPageY).toBe(350);
    });
  });

  describe('registerDropZone / findDropZone', () => {
    it('registers a new drop zone', () => {
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      expect(useDragStore.getState().dropZones).toHaveLength(1);
    });

    it('updates an existing drop zone', () => {
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      useDragStore.getState().registerDropZone('zone-a', { y: 200, height: 60 });
      const zones = useDragStore.getState().dropZones;
      expect(zones).toHaveLength(1);
      expect(zones[0].y).toBe(200);
      expect(zones[0].height).toBe(60);
    });

    it('findDropZone returns groupId when pageY is inside a zone', () => {
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      useDragStore.getState().registerDropZone('zone-b', { y: 200, height: 50 });
      expect(useDragStore.getState().findDropZone(125)).toBe('zone-a');
      expect(useDragStore.getState().findDropZone(225)).toBe('zone-b');
    });

    it('findDropZone returns null when pageY is outside all zones', () => {
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      expect(useDragStore.getState().findDropZone(50)).toBeNull();
      expect(useDragStore.getState().findDropZone(160)).toBeNull();
    });

    it('findDropZone matches zone boundaries inclusively', () => {
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      expect(useDragStore.getState().findDropZone(100)).toBe('zone-a');
      expect(useDragStore.getState().findDropZone(150)).toBe('zone-a');
    });
  });

  describe('reset', () => {
    it('restores all state to defaults', () => {
      useDragStore.getState().startDrag(mockCalendar, 'group-1');
      useDragStore.getState().updateDragPosition(300);
      useDragStore.getState().registerDropZone('zone-a', { y: 100, height: 50 });
      useDragStore.getState().reset();

      const state = useDragStore.getState();
      expect(state.isDragging).toBe(false);
      expect(state.draggedCalendar).toBeNull();
      expect(state.dragPageY).toBe(0);
      expect(state.dropZones).toEqual([]);
    });
  });
});
