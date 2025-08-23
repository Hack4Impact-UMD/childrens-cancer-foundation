# ApplicationBox

This component displays a box with summary information about an application.

## Props

```typescript
interface ApplicationBoxProps {
    id?: string;
    applicationType: string;
    dueDate: string;
    status?: string;
    title?: string;
    principalInvestigator?: string;
    onClick?: (dueDate: string, applicationId?: string) => void;
    onModalOpen?: (applicationId: string) => void;
}
```

## Logic

- Displays the application type, title, and principal investigator.
- Has a button with the due date that triggers the `onClick` handler.
- Has a button to open a modal with the application details, which triggers the `onModalOpen` handler.
