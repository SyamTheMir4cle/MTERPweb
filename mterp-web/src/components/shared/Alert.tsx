import React from 'react';
import { X, CheckCircle2, AlertCircle, Info } from 'lucide-react';
import './Alert.css';

interface AlertProps {
  visible: boolean;
  type: 'success' | 'error' | 'info';
  title: string;
  message: string;
  onClose: () => void;
}

export default function Alert({
  visible,
  type,
  title,
  message,
  onClose,
}: AlertProps) {
  if (!visible) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 size={48} className="alert-icon alert-icon-success" />;
      case 'error':
        return <AlertCircle size={48} className="alert-icon alert-icon-error" />;
      default:
        return <Info size={48} className="alert-icon alert-icon-info" />;
    }
  };

  return (
    <div className="alert-overlay" onClick={onClose}>
      <div className="alert-modal" onClick={(e) => e.stopPropagation()}>
        <button className="alert-close" onClick={onClose}>
          <X size={24} />
        </button>
        {getIcon()}
        <h3 className="alert-title">{title}</h3>
        <p className="alert-message">{message}</p>
        <button className={`alert-button alert-button-${type}`} onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}
