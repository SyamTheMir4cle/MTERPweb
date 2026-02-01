import React from 'react';
import { LucideIcon, Plus } from 'lucide-react';
import './Section.css';

interface SectionProps {
  title: string;
  children: React.ReactNode;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: LucideIcon;
  style?: React.CSSProperties;
}

export default function Section({
  title,
  children,
  actionLabel,
  onAction,
  actionIcon: ActionIcon = Plus,
  style,
}: SectionProps) {
  return (
    <section className="section" style={style}>
      <div className="section-header">
        <h2 className="section-title">{title}</h2>
        {actionLabel && onAction && (
          <button className="section-action" onClick={onAction}>
            <ActionIcon size={16} />
            <span>{actionLabel}</span>
          </button>
        )}
      </div>
      <div className="section-content">{children}</div>
    </section>
  );
}
