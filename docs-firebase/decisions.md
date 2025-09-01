# decisions

This collection stores the final decisions for each application.

## Fields

```typescript
interface Decision {
  applicationId: string;
  decision: 'accepted' | 'rejected';
  notes: string;
}
```
