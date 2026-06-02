import { Box } from '@/components/ui/box';

export const GRAB_HANDLE_HEIGHT = 8;

export function GrabHandle() {
  return (
    <Box
      className="h-2 items-center justify-center"
      testID="grab-handle"
      accessibilityRole="adjustable"
      accessibilityLabel="Drag to expand or collapse calendar"
    >
      <Box className="h-1 w-10 rounded-[2px] bg-brand-handle" />
    </Box>
  );
}
