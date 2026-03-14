import { createContext, useCallback, useContext, useRef, useState, type ReactNode } from 'react';
import type { Calendar } from '@database/schema';

interface DropZoneRect {
  groupId: string;
  y: number;
  height: number;
}

interface DragState {
  isDragging: boolean;
  draggedCalendar: Calendar | null;
  sourceGroupId: string | null;
  activeDropZoneId: string | null;
}

interface DragContextValue extends DragState {
  startDrag: (calendar: Calendar, sourceGroupId: string | null) => void;
  endDrag: () => string | null; // Returns active drop zone ID
  cancelDrag: () => void;
  setActiveDropZone: (groupId: string | null) => void;
  registerDropZone: (groupId: string, rect: { y: number; height: number }) => void;
  findDropZone: (pageY: number) => string | null;
}

const DragContextObj = createContext<DragContextValue | null>(null);

export function useDragContext() {
  const ctx = useContext(DragContextObj);
  if (!ctx) throw new Error('useDragContext must be used within DragProvider');
  return ctx;
}

export function DragProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<DragState>({
    isDragging: false,
    draggedCalendar: null,
    sourceGroupId: null,
    activeDropZoneId: null,
  });

  const dropZonesRef = useRef<DropZoneRect[]>([]);
  const activeDropZoneRef = useRef<string | null>(null);

  const startDrag = useCallback((calendar: Calendar, sourceGroupId: string | null) => {
    setState({
      isDragging: true,
      draggedCalendar: calendar,
      sourceGroupId,
      activeDropZoneId: null,
    });
    activeDropZoneRef.current = null;
  }, []);

  const endDrag = useCallback(() => {
    const activeId = activeDropZoneRef.current;
    setState({
      isDragging: false,
      draggedCalendar: null,
      sourceGroupId: null,
      activeDropZoneId: null,
    });
    activeDropZoneRef.current = null;
    return activeId;
  }, []);

  const cancelDrag = useCallback(() => {
    setState({
      isDragging: false,
      draggedCalendar: null,
      sourceGroupId: null,
      activeDropZoneId: null,
    });
    activeDropZoneRef.current = null;
  }, []);

  const setActiveDropZone = useCallback((groupId: string | null) => {
    activeDropZoneRef.current = groupId;
    setState((prev) => ({ ...prev, activeDropZoneId: groupId }));
  }, []);

  const registerDropZone = useCallback((groupId: string, rect: { y: number; height: number }) => {
    const zones = dropZonesRef.current;
    const idx = zones.findIndex((z) => z.groupId === groupId);
    if (idx >= 0) {
      zones[idx] = { groupId, ...rect };
    } else {
      zones.push({ groupId, ...rect });
    }
  }, []);

  const findDropZone = useCallback((pageY: number) => {
    for (const zone of dropZonesRef.current) {
      if (pageY >= zone.y && pageY <= zone.y + zone.height) {
        return zone.groupId;
      }
    }
    return null;
  }, []);

  return (
    <DragContextObj.Provider
      value={{
        ...state,
        startDrag,
        endDrag,
        cancelDrag,
        setActiveDropZone,
        registerDropZone,
        findDropZone,
      }}
    >
      {children}
    </DragContextObj.Provider>
  );
}
