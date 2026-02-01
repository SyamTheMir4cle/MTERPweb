import React from 'react';
import { LucideIcon } from 'lucide-react';
import './IconButton.css';

interface IconButtonProps {
  icon: LucideIcon;
  onClick: () => void;
  size?: number;
  color?: string;
  backgroundColor?: string;
  variant?: 'default' | 'ghost';
  disabled?: boolean;
  style?: React.CSSProperties;
  className?: string;
}

export default function IconButton({
  icon: Icon,
  onClick,
  size = 20,
  color = 'var(--text-primary)',
  backgroundColor = 'var(--bg-secondary)',
  variant = 'default',
  disabled = false,
  style,
  className = '',
}: IconButtonProps) {
  return (
    <button
      type="button"
      className={`icon-button icon-button-${variant} ${disabled ? 'icon-button-disabled' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
      style={{ backgroundColor: variant === 'ghost' ? 'transparent' : backgroundColor, ...style }}
    >
      <Icon size={size} color={color} />
    </button>
  );
}
