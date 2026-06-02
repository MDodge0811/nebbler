import React from 'react';
import type { ViewStyle } from 'react-native';

import { Box } from '@/components/ui/box';

type IBoxProps = React.ComponentProps<typeof Box>;

export interface DynamicColorViewProps extends IBoxProps {
  /** Runtime background color (hex/rgba). Applied via inline style. */
  backgroundColor?: string;
  /** Runtime border color (hex/rgba). Applied via inline style. */
  borderColor?: string;
  /** Runtime shadow color (hex/rgba). Applied via inline style. */
  shadowColor?: string;
  /** Runtime stacking order. Applied via inline style for index-driven layering. */
  zIndex?: number;
  /** Runtime absolute top offset (px). Applied via inline style for drag/gesture-driven positioning. */
  top?: number;
  /** Runtime top padding (px). Applied via inline style for safe-area-inset-driven spacing. */
  paddingTop?: number;
  /** Runtime bottom padding (px). Applied via inline style for safe-area-inset-driven spacing. */
  paddingBottom?: number;
}

/**
 * The single sanctioned door for runtime styling that can't be a static
 * `className` — background/border/shadow color and index-driven `zIndex`.
 *
 * Static styling stays in `className`; only the runtime values are applied via
 * the one inline `style` allowed in the codebase (this file is under
 * `components/ui/dynamic/**`, the path the styling lint rules exempt). Use this
 * instead of an inline `style={{ backgroundColor }}` or an eslint-disable.
 */
export const DynamicColorView = React.forwardRef<
  React.ComponentRef<typeof Box>,
  DynamicColorViewProps
>(function DynamicColorView(
  {
    backgroundColor,
    borderColor,
    shadowColor,
    zIndex,
    top,
    paddingTop,
    paddingBottom,
    style,
    ...props
  },
  ref
) {
  const dynamicStyle: ViewStyle = {};
  if (backgroundColor !== undefined) {
    dynamicStyle.backgroundColor = backgroundColor;
  }
  if (borderColor !== undefined) {
    dynamicStyle.borderColor = borderColor;
  }
  if (shadowColor !== undefined) {
    dynamicStyle.shadowColor = shadowColor;
  }
  if (zIndex !== undefined) {
    dynamicStyle.zIndex = zIndex;
  }
  if (top !== undefined) {
    dynamicStyle.top = top;
  }
  if (paddingTop !== undefined) {
    dynamicStyle.paddingTop = paddingTop;
  }
  if (paddingBottom !== undefined) {
    dynamicStyle.paddingBottom = paddingBottom;
  }

  return <Box ref={ref} style={[dynamicStyle, style]} {...props} />;
});

DynamicColorView.displayName = 'DynamicColorView';
