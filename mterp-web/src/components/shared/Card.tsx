import React from 'react';
import './Card.css';

interface CardProps {
  children: React.ReactNode;
  onClick?: () => void;
  style?: React.CSSProperties;
  className?: string;
}

export default function Card({ children, onClick, style, className = '' }: CardProps) {
  return (
    <div
      className={`card-component ${onClick ? 'card-clickable' : ''} ${className}`}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
}
