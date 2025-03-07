import React from 'react';
import { ButtonProps } from './types';
import './styles.css';

const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  type = 'button',
  fullWidth = false,
  disabled = false,
  loading = false,
  children,
  className = '',
  ...props
}) => {
  const baseClass = 'button';
  const variantClass = `button--${variant}`;
  const sizeClass = `button--${size}`;
  const widthClass = fullWidth ? 'button--full-width' : '';
  const loadingClass = loading ? 'button--loading' : '';
  
  const combinedClasses = [
    baseClass,
    variantClass,
    sizeClass,
    widthClass,
    loadingClass,
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={combinedClasses}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <>
          <span className="button__loader"></span>
          <span className="button__text">{children}</span>
        </>
      ) : (
        children
      )}
    </button>
  );
};

export default Button;
