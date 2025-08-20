# applicationCycles

This collection stores information about the application cycles.

## Fields

```typescript
interface ApplicationCycle {
  id: string;
  name: string;
  current: boolean;
  stage: 'Applications Open' | 'Applications Closed' | 'Review' | 'Grading' | 'Decisions Released';
  researchDeadline: any; // Firestore Timestamp
  nextGenDeadline: any; // Firestore Timestamp
  nonResearchDeadline: any; // Firestore Timestamp
}
```
