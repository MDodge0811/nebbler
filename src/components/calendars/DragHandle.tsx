import Svg, { Path } from 'react-native-svg';

export function DragHandle() {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18" fill="none">
      <Path
        d="M6 4H6.01M6 9H6.01M6 14H6.01M12 4H12.01M12 9H12.01M12 14H12.01"
        stroke="#9B9BA8"
        strokeWidth={2.5}
        strokeLinecap="round"
      />
    </Svg>
  );
}
