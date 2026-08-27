import Review from '../../types/review-types';

type ReviewFeedback = Review['feedback'];

/**
 * Only the overall score and the summary block submission — the other feedback
 * sections are optional, so a reviewer with nothing to add to a section can
 * still submit.
 */
export const getMissingRequiredReviewFields = (
    overall: string,
    feedback: Pick<ReviewFeedback, 'summary'>
): string[] => {
    const missing: string[] = [];
    if (!overall || !overall.trim()) missing.push('an overall score');
    if (!feedback?.summary || !feedback.summary.trim()) missing.push('the summary');
    return missing;
};

export const canSubmitReview = (
    overall: string,
    feedback: Pick<ReviewFeedback, 'summary'>
): boolean => getMissingRequiredReviewFields(overall, feedback).length === 0;
