# Breadcrumbs

This component displays the breadcrumb navigation for the application form.

## Props

```typescript
interface BreadcrumbsProps {
    formStep: number;
    setFormStep: (step: number) => void;
}
```

## Logic

- It shows the different steps of the application form.
- The current step is highlighted.
- The user can click on a step to navigate to it.
