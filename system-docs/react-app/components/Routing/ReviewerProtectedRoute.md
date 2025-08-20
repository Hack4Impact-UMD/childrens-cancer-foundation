# ReviewerProtectedRoute

This component protects a route, making it accessible only to users with the "reviewer" role.

## Props

```typescript
interface ReviewerProtectedRouteProps {
  element: React.ReactNode;
}
```

## Logic

- It checks the user's authentication status and their custom claims.
- If the user is a reviewer, it renders the provided `element`.
- Otherwise, it redirects the user to the `/protected-page`.
