import React from 'react';

import { Text } from '@/components/ui/text';

type ITextProps = React.ComponentProps<typeof Text>;

export interface DynamicColorTextProps extends ITextProps {
  /** Runtime text color (hex/rgba). Applied via inline style. */
  color: string;
}

/**
 * The single sanctioned door for runtime text color.
 *
 * Static styling stays in `className`; only the runtime color is applied via the
 * one inline `style` allowed in the codebase (this file is under
 * `components/ui/dynamic/**`, the path the styling lint rules exempt). Use this
 * instead of an inline `style={{ color }}` or an eslint-disable.
 */
export const DynamicColorText = React.forwardRef<
  React.ComponentRef<typeof Text>,
  DynamicColorTextProps
>(function DynamicColorText({ color, style, ...props }, ref) {
  return <Text ref={ref} style={[{ color }, style]} {...props} />;
});

DynamicColorText.displayName = 'DynamicColorText';
