# FAQComponent

This component displays a list of FAQ items with expandable answers.

## Props

```typescript
interface FAQComponentProps {
    faqs: FAQItem[];
}

interface FAQItem {
    id: string;
    question: string;
    answer: string;
}
```

## Features

- **Expandable Questions**: Click on any question to expand/collapse its answer
- **Markdown Support**: Answers support markdown formatting for rich text display
- **Empty State**: Shows a helpful message when no FAQs are available
- **Animated Icons**: Question icons rotate when expanded/collapsed
- **Responsive Design**: Adapts to different screen sizes

## Logic

- Displays a list of FAQ questions and their corresponding answers
- Answers are initially hidden and can be toggled by clicking on the question
- Uses the MarkdownPreviewer component to render formatted answers
- Handles empty state gracefully with a user-friendly message
- Includes debugging console logs for troubleshooting

## Styling

- Uses `FAQComponent.css` for styling
- Questions are styled with a red border and bold text
- Answers are displayed in a bordered container with markdown formatting
- Empty state has a subtle gray background with italic text

## Recent Changes

- Added empty state handling to prevent blank displays
- Added console logging for debugging purposes
- Improved error handling and user experience
- Added support for markdown rendering in answers
