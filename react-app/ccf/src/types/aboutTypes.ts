export type ApplicationAboutType = "Research" | "NextGen" | "NonResearch";

export interface AboutPage {
    id: ApplicationAboutType;
    /** Optional heading to display above the content */
    title?: string;
    /** Markdown body for the About page */
    content: string;
}

