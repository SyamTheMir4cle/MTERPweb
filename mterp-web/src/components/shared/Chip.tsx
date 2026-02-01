import React from 'react';
import './Chip.css';

interface ChipProps {
  label: string;
  onPress?: () => void;
  selected?: boolean;
  variant?: 'outline' | 'filled';
  size?: 'small' | 'medium';
  style?: React.CSSProperties;
}

export default function Chip({
  label,
  onPress,
  selected = false,
  variant = 'outline',
  size = 'medium',
  style,
}: ChipProps) {
  return (
    <button
      type="button"
      className={`chip chip-${variant} chip-${size} ${selected ? 'chip-selected' : ''}`}
      onClick={onPress}
      style={style}
    >
      {label}
    </button>
  );
}
