# applications

This collection stores the grant applications submitted by applicants.

## Fields

```typescript
interface Application {
  decision: 'pending' | 'accepted' | 'rejected';
  creatorId: string;
  applicationId: string;
  grantType: 'research' | 'nextgen' | 'nonresearch';
  file: string; // Name of the file in Firebase Storage
  applicationCycle: string;
  submitTime: any; // Firestore Timestamp
  title: string;
  institution: string;
  amountRequested: string;
  principalInvestigator?: string;
  typesOfCancerAddressed?: string;
  namesOfStaff?: string;
  institutionAddress?: string;
  institutionPhoneNumber?: string;
  institutionEmail?: string;
  adminOfficialName?: string;
  adminPhoneNumber?: string;
  adminEmail?: string;
  includedPublishedPaper?: string;
  creditAgreement?: string;
  patentApplied?: string;
  includedFundingInfo?: string;
  dates?: string;
  continuation?: string;
  requestor?: string;
  timeframe?: string;
}
```
