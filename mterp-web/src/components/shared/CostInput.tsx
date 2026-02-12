import React, { useState } from 'react';
import { LucideIcon } from 'lucide-react';
import './Input.css';

interface CostInputProps {
  value: number;
  onChange: (value: number) => void;
  label?: string;
  placeholder?: string;
  className?: string;
  error?: string;
  disabled?: boolean;
  icon?: LucideIcon;
}

/**
 * Cost input that displays formatted numbers with dot separators (e.g. 2.000.000)
 * but stores the raw numeric value.
 */
export default function CostInput({ 
  value, 
  onChange, 
  label, 
  placeholder = '0', 
  className = '',
  error,
  disabled = false,
  icon: Icon
}: CostInputProps) {
  const [displayValue, setDisplayValue] = useState(value ? formatWithDots(value) : '');
  const [isFocused, setIsFocused] = useState(false);

  function formatWithDots(num: number): string {
    if (!num && num !== 0) return '';
    return new Intl.NumberFormat('id-ID').format(num);
  }

  function stripDots(str: string): string {
    return str.replace(/\./g, '');
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = stripDots(e.target.value);
    // Only allow numeric characters
    if (raw && !/^\d+$/.test(raw)) return;
    
    const numericValue = Number(raw) || 0;
    setDisplayValue(raw ? formatWithDots(numericValue) : '');
    onChange(numericValue);
  };

  const handleFocus = () => {
    setIsFocused(true);
    // Show raw number without dots when focused for easier editing
    if (value) {
      setDisplayValue(String(value));
    }
  };

  const handleBlur = () => {
    setIsFocused(false);
    // Format with dots when blurred
    setDisplayValue(value ? formatWithDots(value) : '');
  };

  // Sync external value changes
  const shown = isFocused ? displayValue : (value ? formatWithDots(value) : '');

  return (
    <div className={`input-wrapper ${className}`}>
      {label && <label className="input-label">{label}</label>}
      <div className={`input-container ${error ? 'input-error' : ''} ${disabled ? 'input-disabled' : ''}`}>
        {Icon && <Icon size={20} className="input-icon" />}
        <input
          type="text"
          inputMode="numeric"
          className="input-field"
          value={shown}
          placeholder={placeholder}
          onChange={handleChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          disabled={disabled}
        />
      </div>
      {error && <span className="input-error-text">{error}</span>}
    </div>
  );
}
