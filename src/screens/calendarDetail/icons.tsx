import Svg, { Path } from 'react-native-svg';

import { calendarsUIColors } from '@constants/calendarsUI';

export function BackIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M13 4L7 10L13 16"
        stroke={calendarsUIColors.text}
        strokeWidth={2}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

export function EditIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M14.5 3.5L16.5 5.5L6 16H4V14L14.5 3.5Z"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinejoin="round"
      />
      <Path
        d="M12.5 5.5L14.5 7.5"
        stroke={calendarsUIColors.text}
        strokeWidth={1.6}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function CloseIcon() {
  return (
    <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
      <Path
        d="M5 5L15 15M15 5L5 15"
        stroke={calendarsUIColors.text}
        strokeWidth={2}
        strokeLinecap="round"
      />
    </Svg>
  );
}

export function PlusIcon() {
  return (
    <Svg width={24} height={24} viewBox="0 0 20 20" fill="none">
      <Path d="M10 4V16M4 10H16" stroke="#FFFFFF" strokeWidth={2.2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronRight() {
  return (
    <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
      <Path
        d="M6 4L10 8L6 12"
        stroke={calendarsUIColors.textMuted}
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}
