import React, { forwardRef } from 'react';
import { InputProps } from './types';
import './styles.css';

const Input = forwardRef<HTMLInputElement, InputProps>(({
  label,
  error,
  className = '',
  type = 'text',
  fullWidth = false,
  helperText,
  ...props
}, ref) => {
  const inputId = props.id || `input-${Math.random().toString(36).substr(2, 9)}`;
  const hasError = !!error;
  
  return (
    <div className={`input ${fullWidth ? 'input--full-width' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="input__label">
          {label}
        </label>
      )}
      <input
        {...props}
        ref={ref}
        id={inputId}
        type={type}
        className={`input__field ${hasError ? 'input__field--error' : ''}`}
      />
      {(error || helperText) && (
        <p className={`input__helper-text ${hasError ? 'input__helper-text--error' : ''}`}>
          {error || helperText}
        </p>
      )}
    </div>
  );
});

Input.displayName = 'Input';

export default Input;
