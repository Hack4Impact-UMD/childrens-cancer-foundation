export interface WhitelistEntry {
    id?: string;
    email: string;
    firstName?: string;
    lastName?: string;
    name?: string; // Alternative field name for existing data
    affiliation?: string;
    institution?: string; // Alternative field name for existing data
    title?: string;
    specialty?: string; // Alternative field name for existing data
    addedAt: Date;
    addedBy: string;
    status: 'active' | 'inactive';
    hasAccount?: boolean; // Indicates if the reviewer has created an account
}

export interface WhitelistFormData {
    email: string;
    firstName: string;
    lastName: string;
    affiliation: string;
    title: string;
}

export interface WhitelistFilters {
    searchTerm: string;
    affiliationFilter: string;
    statusFilter: 'all' | 'active' | 'inactive';
}
