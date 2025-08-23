export default interface ApplicationCycle {
    id: string;
    name: string;
    current: boolean;
    stage: 'Applications Open' | 'Applications Closed' | 'Review' | 'Grading' | 'Final Decisions';
    researchDeadline: Date;
    nextGenDeadline: Date;
    nonResearchDeadline: Date;
    allApplicationsDeadline: Date;
    reviewerDeadline: Date;
    startDate: Date;
    endDate: Date;
    postGrantReportDeadline?: Date;
}