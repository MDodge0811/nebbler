import Svg, { Path, Rect } from 'react-native-svg';

import { calendarsUIColors } from '@constants/calendarsUI';

interface IconProps {
  color?: string;
}

export function CloseIcon({ color = calendarsUIColors.text }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path d="M5 5L15 15M15 5L5 15" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function BackIcon({ color = calendarsUIColors.text }: IconProps) {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M12 4L6 10L12 16"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronRightIcon({ color = calendarsUIColors.textMuted }: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function ChevronDownIcon({ color = calendarsUIColors.textMuted }: IconProps) {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M4 6L8 10L12 6"
        stroke={color}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function NextArrowIcon({ color = '#FFFFFF' }: IconProps) {
  return (
    <Svg width={14} height={14} viewBox="0 0 14 14" fill="none">
      <Path
        d="M5 3L9 7L5 11"
        stroke={color}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function LocationIcon({ color = calendarsUIColors.textSecondary }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M9 1.5C6 1.5 3.5 4 3.5 7C3.5 11.5 9 16.5 9 16.5C9 16.5 14.5 11.5 14.5 7C14.5 4 12 1.5 9 1.5Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinejoin="round"
      />
      <Path
        d="M9 9.5C10.38 9.5 11.5 8.38 11.5 7C11.5 5.62 10.38 4.5 9 4.5C7.62 4.5 6.5 5.62 6.5 7C6.5 8.38 7.62 9.5 9 9.5Z"
        stroke={color}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function HeatmapIcon({ color = calendarsUIColors.primary }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Rect x={2} y={2} width={4} height={4} rx={1} fill={color} opacity={0.3} />
      <Rect x={7} y={2} width={4} height={4} rx={1} fill={color} opacity={0.7} />
      <Rect x={12} y={2} width={4} height={4} rx={1} fill={color} opacity={1} />
      <Rect x={2} y={7} width={4} height={4} rx={1} fill={color} opacity={0.6} />
      <Rect x={7} y={7} width={4} height={4} rx={1} fill={color} opacity={0.2} />
      <Rect x={12} y={7} width={4} height={4} rx={1} fill={color} opacity={0.8} />
      <Rect x={2} y={12} width={4} height={4} rx={1} fill={color} opacity={0.9} />
      <Rect x={7} y={12} width={4} height={4} rx={1} fill={color} opacity={0.5} />
      <Rect x={12} y={12} width={4} height={4} rx={1} fill={color} opacity={0.4} />
    </Svg>
  );
}

export function RepeatIcon({ color = calendarsUIColors.textSecondary }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M13 2L15.5 4.5L13 7"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M2.5 8.5V7.5C2.5 5.8 3.8 4.5 5.5 4.5H15.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
      <Path
        d="M5 16L2.5 13.5L5 11"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15.5 9.5V10.5C15.5 12.2 14.2 13.5 12.5 13.5H2.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function ShowAsIcon({ color = calendarsUIColors.textSecondary }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path d="M9 4.5V9L12 11" stroke={color} strokeWidth={1.4} strokeLinecap="round" />
      <Path
        d="M9 16C12.87 16 16 12.87 16 9C16 5.13 12.87 2 9 2C5.13 2 2 5.13 2 9C2 12.87 5.13 16 9 16Z"
        stroke={color}
        strokeWidth={1.4}
      />
    </Svg>
  );
}

export function BellIcon({ color = calendarsUIColors.textSecondary }: IconProps) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M13.5 6.5C13.5 4 11.5 2 9 2C6.5 2 4.5 4 4.5 6.5C4.5 11 3 12.5 3 12.5H15C15 12.5 13.5 11 13.5 6.5Z"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7.5 12.5V13.5C7.5 14.3 8.2 15 9 15C9.8 15 10.5 14.3 10.5 13.5V12.5"
        stroke={color}
        strokeWidth={1.4}
        strokeLinecap="round"
      />
    </Svg>
  );
}
