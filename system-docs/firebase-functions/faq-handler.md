# FAQ Handler

The FAQ handler (`faq-handler.ts`) provides backend functions for managing Frequently Asked Questions in the Firebase Firestore database.

## Location
- **File**: `src/backend/faq-handler.ts`
- **Collection**: `FAQs` in Firestore

## Functions

### `getFAQs()`
- **Purpose**: Fetches all FAQ items from the Firebase database
- **Returns**: `Promise<Array<FAQItem>>`
- **Features**:
  - Queries the "FAQs" collection
  - Maps Firestore documents to FAQItem objects
  - Includes error handling and debugging logs
  - Returns empty array on error

### `getFAQData()`
- **Purpose**: Fetches FAQ data as JSON objects
- **Returns**: `Promise<Array<JSON>>`
- **Usage**: Alternative format for FAQ data retrieval

### `uploadFAQ(faq: FAQItem)`
- **Purpose**: Updates an existing FAQ item in the database
- **Parameters**: `faq` - FAQItem object with id, question, and answer
- **Usage**: Used for editing existing FAQ entries

### `uploadFAQBatch(faqs: Array<FAQItem>)`
- **Purpose**: Updates multiple FAQ items at once
- **Parameters**: `faqs` - Array of FAQItem objects
- **Usage**: Bulk update functionality for multiple FAQs

### `addFAQ(faq: FAQItem)`
- **Purpose**: Creates a new FAQ item in the database
- **Parameters**: `faq` - FAQItem object with id, question, and answer
- **Usage**: Used for adding new FAQ entries

### `createNewFAQ(question: string, answer: string)`
- **Purpose**: Creates a new FAQ with auto-generated ID
- **Parameters**: 
  - `question` - The FAQ question text
  - `answer` - The FAQ answer text (supports markdown)
- **Returns**: `Promise<FAQItem>` - The created FAQ item
- **Features**:
  - Auto-generates unique ID using timestamp
  - Trims whitespace from input
  - Includes error handling and logging
  - Used by the admin UI for creating new FAQs

### `initializeSampleFAQs()`
- **Purpose**: Populates the database with sample FAQ data
- **Features**:
  - Creates 5 sample FAQ entries
  - Includes relevant questions about grant applications
  - Provides comprehensive answers with markdown support
  - Includes error handling and success logging

## Sample FAQ Data

The `initializeSampleFAQs()` function creates the following sample questions:

1. **"What types of grants does the Children's Cancer Foundation offer?"**
   - Explains Research Grants, NextGen Grants, and Non-Research Grants

2. **"How do I apply for a grant?"**
   - Step-by-step application process instructions

3. **"What is the application deadline?"**
   - Information about cycle-specific deadlines

4. **"How will I know if my application was accepted?"**
   - Notification and status checking procedures

5. **"What documents do I need to submit with my application?"**
   - Required documentation list

## Data Structure

```typescript
interface FAQItem {
    id: string;
    question: string;
    answer: string;
}
```

## Error Handling

- All functions include try-catch blocks
- Console logging for debugging purposes
- Graceful fallbacks for failed operations
- Empty array returns for failed queries

## Usage Examples

### Fetching FAQs
```typescript
import { getFAQs } from '../backend/faq-handler';

const faqs = await getFAQs();
console.log('Loaded FAQs:', faqs);
```

### Adding a New FAQ
```typescript
import { addFAQ } from '../backend/faq-handler';

const newFAQ = {
    id: "new-faq-1",
    question: "What is the grant amount?",
    answer: "Grant amounts vary by type and cycle."
};

await addFAQ(newFAQ);
```

### Creating a New FAQ with Auto-Generated ID
```typescript
import { createNewFAQ } from '../backend/faq-handler';

const newFAQ = await createNewFAQ(
    "What is the grant amount?",
    "Grant amounts vary by type and cycle."
);
```

### Initializing Sample Data
```typescript
import { initializeSampleFAQs } from '../backend/faq-handler';

await initializeSampleFAQs();
```

## Integration Points

- **Applicant Dashboard**: Displays FAQs to applicants
- **Admin Dashboard**: Allows FAQ management and initialization
- **Reviewer Dashboard**: Shows FAQs to reviewers
- **Firebase Firestore**: Stores FAQ data in "FAQs" collection

## Recent Updates

### FAQ Integration Fix
- Added comprehensive error handling
- Implemented debugging console logs
- Created sample data initialization function
- Enhanced data fetching reliability
- Added support for markdown content in answers
