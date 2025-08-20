# Modal

This component displays a modal dialog.

## Props

```typescript
interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    fullscreen?: boolean;
}
```

## Logic

- The modal is shown or hidden based on the `isOpen` prop.
- It can be displayed in fullscreen mode.
- The `onClose` function is called when the modal is closed.
