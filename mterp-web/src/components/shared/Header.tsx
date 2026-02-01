import React from 'react';
import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './Header.css';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  rightContent?: React.ReactNode;
  style?: React.CSSProperties;
}

export default function Header({
  title,
  subtitle,
  showBack = true,
  rightContent,
  style,
}: HeaderProps) {
  const navigate = useNavigate();

  return (
    <header className="header" style={style}>
      <div className="header-left">
        {showBack && (
          <button className="header-back" onClick={() => navigate(-1)}>
            <ChevronLeft size={24} />
          </button>
        )}
        <div className="header-text">
          <h1 className="header-title">{title}</h1>
          {subtitle && <p className="header-subtitle">{subtitle}</p>}
        </div>
      </div>
      {rightContent && <div className="header-right">{rightContent}</div>}
    </header>
  );
}
