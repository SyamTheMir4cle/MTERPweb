import React from 'react';
import './Divider.css';

interface DividerProps {
  style?: React.CSSProperties;
  className?: string;
}

export default function Divider({ style, className = '' }: DividerProps) {
  return <hr className={`divider ${className}`} style={style} />;
}
