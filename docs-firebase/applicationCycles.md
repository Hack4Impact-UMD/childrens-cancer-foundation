# applicationCycles

This collection stores information about the application cycles.

## Fields

```typescript
interface ApplicationCycle {
  id: string;
  name: string;
  current: boolean;
  stage: 'Applications Open' | 'Applications Closed' | 'Review' | 'Grading' | 'Final Decisions';
  researchDeadline: any; // Firestore Timestamp
  nextGenDeadline: any; // Firestore Timestamp
  nonResearchDeadline: any; // Firestore Timestamp
  allApplicationsDeadline: any; // Firestore Timestamp
  reviewerDeadline: any; // Firestore Timestamp
  startDate: any; // Firestore Timestamp
  endDate: any; // Firestore Timestamp
  postGrantReportDeadline?: any; // Firestore Timestamp - Deadline for post-grant reports
}
```

## Usage

- **Current Cycle**: Only one cycle can have `current: true` at a time
- **Stages**: The cycle progresses through different stages from application submission to final decisions
- **Deadlines**: Different deadlines for different grant types and review processes
- **Post-Grant Reports**: After applications are accepted, applicants must submit post-grant reports by the specified deadline
