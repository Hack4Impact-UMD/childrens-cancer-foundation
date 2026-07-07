// Maps cloud-function submission error messages to the user-facing toast text.
// The `includes(...)` cascade mirrors the messages thrown by submitApplication
// (functions/lib/index.js) and the client-side pre-checks in
// backend/applicant-form-submit.ts.
export const getSubmitErrorToast = (message: string | undefined): string => {
    if (message) {
        if (message.includes('Applications are currently closed')) {
            return 'Applications are currently closed. Please check back later.';
        } else if (message.includes('already submitted')) {
            return 'You have already submitted an application for this grant type.';
        } else if (message.includes('Deadline')) {
            return 'The deadline for this application type has passed.';
        } else if (message.includes('Only PDF files')) {
            return 'Please upload a PDF file.';
        } else if (message.includes('size exceeds')) {
            return 'File size exceeds 50MB limit. Please upload a smaller file.';
        } else if (message.includes('Invalid application data')) {
            return 'Please check your application data and try again.';
        }
        return message;
    }
    return 'Failed to submit application. Please try again.';
};
