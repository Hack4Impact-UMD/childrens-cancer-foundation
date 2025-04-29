export default interface Review {
    reviewer: string;
    application: string;
    cycle: string;
    score: number;
    significance: string;
    approach: string;
    feasibility: string;
    investigator: string;
    summary: string;
    internalNotes?: string;
}