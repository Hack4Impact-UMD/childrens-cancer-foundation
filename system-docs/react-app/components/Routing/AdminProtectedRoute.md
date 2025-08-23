# AdminProtectedRoute

This component protects a route, making it accessible only to users with the "admin" role.

## Props

```typescript
interface AdminProtectedRouteProps {
  element: React.ReactNode;
}
```

## Logic

- It checks the user's authentication status and their custom claims.
- If the user is an admin, it renders the provided `element`.
- Otherwise, it redirects the user to the `/protected-page`.
