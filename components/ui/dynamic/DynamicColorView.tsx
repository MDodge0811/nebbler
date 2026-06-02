import React from 'react';
import type { ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';

type IBoxProps = React.ComponentProps<typeof Box>;

export interface DynamicColorViewProps extends IBoxProps {
  /** Runtime background color (hex/rgba). Applied via inline style. */
  backgroundColor?: string;
  /** Runtime border color (hex/rgba). Applied via inline style. */
  borderColor?: string;
}

/**
 * The single sanctioned door for runtime background/border colors.
 *
 * Static styling stays in `className`; only the runtime color is applied via the
 * one inline `style` allowed in the codebase (this file is under
 * `components/ui/dynamic/**`, the path the styling lint rules exempt). Use this
 * instead of an inline `style={{ backgroundColor }}` or an eslint-disable.
 */
export const DynamicColorView = React.forwardRef<
  React.ComponentRef<typeof Box>,
  DynamicColorViewProps
>(function DynamicColorView({ backgroundColor, borderColor, style, ...props }, ref) {
  const dynamicStyle: ViewStyle = {};
  if (backgroundColor !== undefined) {
    dynamicStyle.backgroundColor = backgroundColor;
  }
  if (borderColor !== undefined) {
    dynamicStyle.borderColor = borderColor;
  }

  return <Box ref={ref} style={[dynamicStyle, style]} {...props} />;
});

DynamicColorView.displayName = 'DynamicColorView';
