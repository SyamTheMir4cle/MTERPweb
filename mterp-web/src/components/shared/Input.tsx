import React, { useState } from 'react';
import { LucideIcon, Eye, EyeOff } from 'lucide-react';
import './Input.css';

interface InputProps {
  label?: string;
  placeholder?: string;
  value: string;
  onChangeText?: (text: string) => void;
  onChange?: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void;
  type?: 'text' | 'password' | 'email' | 'number' | 'date';
  icon?: LucideIcon;
  error?: string;
  disabled?: boolean;
  maxLength?: number;
  multiline?: boolean;
  numberOfLines?: number;
  style?: React.CSSProperties;
  className?: string;
}

export default function Input({
  label,
  placeholder,
  value,
  onChangeText,
  onChange,
  type = 'text',
  icon: Icon,
  error,
  disabled = false,
  maxLength,
  multiline = false,
  numberOfLines = 3,
  style,
  className = '',
}: InputProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    if (onChange) {
      onChange(e);
    }
    if (onChangeText) {
      onChangeText(e.target.value);
    }
  };

  const inputType = type === 'password' && showPassword ? 'text' : type;

  if (multiline) {
    return (
      <div className={`input-wrapper ${className}`} style={style}>
        {label && <label className="input-label">{label}</label>}
        <div className={`input-container ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}>
          {Icon && <Icon size={20} className="input-icon" />}
          <textarea
            className="input-field input-textarea"
            placeholder={placeholder}
            value={value}
            onChange={handleChange}
            disabled={disabled}
            maxLength={maxLength}
            rows={numberOfLines}
          />
        </div>
        {error && <span className="input-error-text">{error}</span>}
      </div>
    );
  }

  return (
    <div className={`input-wrapper ${className}`} style={style}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}>
        {Icon && <Icon size={20} className="input-icon" />}
        <input
          type={inputType}
          className="input-field"
          placeholder={placeholder}
          value={value}
          onChange={handleChange}
          disabled={disabled}
          maxLength={maxLength}
        />
        {type === 'password' && (
          <button
            type="button"
            className="input-toggle"
            onClick={() => setShowPassword(!showPassword)}
          >
            {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
          </button>
        )}
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
