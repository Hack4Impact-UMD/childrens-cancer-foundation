# FAQs

This collection stores the Frequently Asked Questions.

## Fields

```typescript
interface FAQItem {
  id: string;
  question: string;
  answer: string;
}
```

## Usage

The FAQs collection is used to store frequently asked questions that are displayed to users on their dashboards. The questions and answers support markdown formatting for rich text display.

### Key Functions

- `getFAQs()`: Fetches all FAQ items from the database
- `addFAQ(faq: FAQItem)`: Adds a new FAQ item to the database
- `uploadFAQ(faq: FAQItem)`: Updates an existing FAQ item
- `uploadFAQBatch(faqs: FAQItem[])`: Updates multiple FAQ items
- `initializeSampleFAQs()`: Populates the database with sample FAQ data

### Sample Data

The system includes sample FAQ data that can be initialized through the admin dashboard:

1. "What types of grants does the Children's Cancer Foundation offer?"
2. "How do I apply for a grant?"
3. "What is the application deadline?"
4. "How will I know if my application was accepted?"
5. "What documents do I need to submit with my application?"

### Access Control

- **Read**: All authenticated users can read FAQ data
- **Write**: Only admin users can create, update, or delete FAQ items
