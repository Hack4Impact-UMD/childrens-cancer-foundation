# Button

This is a customizable button component.

## Props

```typescript
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
}
```

## Logic

- The button can have different visual styles (`variant`).
- The width, height, border radius, and font weight can be customized.
- It can be disabled and can have different types (`button`, `submit`, `reset`).
