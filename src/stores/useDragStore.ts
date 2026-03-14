import { create } from 'zustand';
import type { Calendar } from '@database/schema';

interface DropZoneRect {
  groupId: string;
  y: number;
  height: number;
}

interface DragStore {
  isDragging: boolean;
  draggedCalendar: Calendar | null;
  sourceGroupId: string | null;
  activeDropZoneId: string | null;
  dragPageY: number;
  dropZones: DropZoneRect[];

  startDrag: (calendar: Calendar, sourceGroupId: string | null) => void;
  endDrag: () => string | null;
  cancelDrag: () => void;
  setActiveDropZone: (groupId: string | null) => void;
  updateDragPosition: (pageY: number) => void;
  registerDropZone: (groupId: string, rect: { y: number; height: number }) => void;
  findDropZone: (pageY: number) => string | null;
  reset: () => void;
}

const initialState = {
  isDragging: false as const,
  draggedCalendar: null as Calendar | null,
  sourceGroupId: null as string | null,
  activeDropZoneId: null as string | null,
  dragPageY: 0,
  dropZones: [] as DropZoneRect[],
};

export const useDragStore = create<DragStore>()((set, get) => ({
  ...initialState,

  startDrag: (calendar, sourceGroupId) =>
    set({
      isDragging: true,
      draggedCalendar: calendar,
      sourceGroupId,
      activeDropZoneId: null,
    }),

  endDrag: () => {
    const activeId = get().activeDropZoneId;
    set({
      isDragging: false,
      draggedCalendar: null,
      sourceGroupId: null,
      activeDropZoneId: null,
      dragPageY: 0,
    });
    return activeId;
  },

  cancelDrag: () =>
    set({
      isDragging: false,
      draggedCalendar: null,
      sourceGroupId: null,
      activeDropZoneId: null,
      dragPageY: 0,
    }),

  setActiveDropZone: (groupId) => set({ activeDropZoneId: groupId }),

  updateDragPosition: (pageY) => set({ dragPageY: pageY }),

  registerDropZone: (groupId, rect) => {
    const zones = get().dropZones;
    const idx = zones.findIndex((z) => z.groupId === groupId);
    const next = [...zones];
    if (idx >= 0) {
      next[idx] = { groupId, ...rect };
    } else {
      next.push({ groupId, ...rect });
    }
    set({ dropZones: next });
  },

  findDropZone: (pageY) => {
    for (const zone of get().dropZones) {
      if (pageY >= zone.y && pageY <= zone.y + zone.height) {
        return zone.groupId;
      }
    }
    return null;
  },

  reset: () => set(initialState),
}));
