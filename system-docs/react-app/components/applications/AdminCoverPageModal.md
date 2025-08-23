# AdminCoverPageModal

This component displays a modal with the details of an application for an admin user.

## Props

```typescript
interface CoverPageModalProps {
    application: Application;
    isOpen: boolean;
    onClose: () => void;
}
```

## Logic

- When the modal is opened, it fetches the application PDF, any post-grant reports, and the decision for the application.
- It displays the application details, a link to the PDF, a link to the post-grant report (if available), and the decision.
- It uses the `Review` component to display the application form data.
