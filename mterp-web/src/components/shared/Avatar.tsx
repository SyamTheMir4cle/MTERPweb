import React from 'react';
import './Avatar.css';

interface AvatarProps {
  name?: string;
  src?: string;
  size?: 'small' | 'medium' | 'large';
  style?: React.CSSProperties;
  className?: string;
}

export default function Avatar({
  name = '',
  src,
  size = 'medium',
  style,
  className = '',
}: AvatarProps) {
  const getInitials = (name: string) => {
    return name.charAt(0).toUpperCase();
  };

  return (
    <div className={`avatar avatar-${size} ${className}`} style={style}>
      {src ? (
        <img src={src} alt={name} className="avatar-image" />
      ) : (
        <span className="avatar-initials">{getInitials(name)}</span>
      )}
    </div>
  );
}
