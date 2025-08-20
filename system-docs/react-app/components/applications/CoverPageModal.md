# CoverPageModal

This component displays a modal with the details of an application.

## Props

```typescript
interface CoverPageModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
}
```

## Logic

- When the modal is opened, it fetches the application PDF.
- It displays the application details and a link to the PDF.
- It uses the `Review` component to display the application form data.
