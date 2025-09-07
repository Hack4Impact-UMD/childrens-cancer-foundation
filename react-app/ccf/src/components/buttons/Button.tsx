import React from 'react';
import './Button.css';

interface ButtonProps {
  variant?: 'blue' | 'red';
  width?: string;
  height?: string;
  borderRadius?: string;
  fontWeight?: number | string;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  children: React.ReactNode;
  className?: string;
  title?: string;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'blue',
  width,
  height,
  borderRadius = '20px',
  fontWeight = 400,
  onClick,
  disabled = false,
  type = 'button',
  children,
  className = '',
  title,
}) => {
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={`custom-button ${variant} ${className}`}
      style={{ 
        width,
        height,
        borderRadius,
        fontWeight,
      }}
      title={title}
    >
      {children}
    </button>
  );
};

export default Button;