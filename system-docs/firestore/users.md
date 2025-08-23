# users

This collection stores general information about all users.

## Fields

```typescript
interface User {
  uid: string;
  email: string;
  role: 'admin' | 'applicant' | 'reviewer';
  name?: string;
  title?: string;
  institutionalAffiliation?: string;
  principalInvestigator?: string;
}
```
