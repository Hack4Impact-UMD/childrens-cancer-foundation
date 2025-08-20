# ApplicantProtectedRoute

This component protects a route, making it accessible only to users with the "applicant" role.

## Props

```typescript
interface ApplicantProtectedRouteProps {
  element: React.ReactNode;
}
```

## Logic

- It checks the user's authentication status and their custom claims.
- If the user is an applicant, it renders the provided `element`.
- Otherwise, it redirects the user to the `/protected-page`.
