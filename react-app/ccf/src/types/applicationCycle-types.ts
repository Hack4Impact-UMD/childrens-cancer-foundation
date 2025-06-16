export default interface ApplicationCycle {
    current: boolean;
    endDate: Date;
    name: string;
    nextGenDeadline: Date;
    nonResearchDeadline: Date;
    researchDeadline: Date;
    reviewerDeadline: Date;
    startDate: Date;
    stage: "Applications Open" | "Reviews Open" | "Reviews Closed" | "Final Decision"
}