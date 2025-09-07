import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';

interface ButtonProps extends MuiButtonProps {
  variant?: 'blue' | 'red';
  width?: string;
  height?: string;
  borderRadius?: string;
  fontWeight?: number | string;
  children: React.ReactNode;
}

const Button: React.FC<ButtonProps> = ({
  variant = 'blue',
  width,
  height,
  borderRadius = '20px',
  fontWeight = 400,
  children,
  ...rest
}) => {
  const color = variant === 'red' ? 'error' : 'primary';

  return (
    <MuiButton
      variant="contained"
      color={color}
      sx={{
        width,
        height,
        borderRadius,
        fontWeight,
        textTransform: 'none',
      }}
      {...rest}
    >
      {children}
    </MuiButton>
  );
};

export default Button;