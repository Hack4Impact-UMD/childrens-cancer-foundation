
export interface SideBarTypes {
    name: string;
    path: string;
}

export type differentUserRoles = 'admin' | 'reviewer' | 'applicant';

export default interface SidebarProps {
    links: SideBarTypes[]; // Accepts an array of link objects as props
    role: differentUserRoles;
}

export const adminSidebar: SideBarTypes[] = [
    { name: 'Application Cycle', path: '/admin/edit-information' },
    { name: 'Home', path: '/admin/dashboard' },
    { name: 'Account Settings', path: '/admin/settings' },
    { name: 'View All Accounts', path: '/admin/all-accounts' },
    { name: 'Assign Reviewers', path: '/admin/assign-reviewers' },
    { name: 'Whitelist Reviewers', path: '/admin/whitelist-reviewers' },
    { name: 'Assign Awards', path: '/admin/grant-awards' },
    { name: 'Post-Grant Reports', path: '/admin/post-grant-reports' },
    { name: 'Logout', path: '/login' }
];

export const reviewerSidebar: SideBarTypes[] = [
    { name: 'Home', path: '/reviewer/dashboard' },
    { name: 'Account Settings', path: '/reviewer/settings' },
    { name: 'Application Database', path: '/reviewer/dashboard/all-applications' },
    { name: 'Logout', path: '/login' }
];

export const applicantSidebar: SideBarTypes[] = [
    { name: 'Home', path: '/applicant/dashboard' },
    { name: 'Account Settings', path: '/applicant/settings' },
    { name: 'Logout', path: '/login' }
];

export const getSidebarbyRole = (role: differentUserRoles): SideBarTypes[] => {
    if (role === 'admin') {
        return adminSidebar;
    } else if (role === 'reviewer') {
        return reviewerSidebar;
    } else if (role === 'applicant') {
        return applicantSidebar;
    } else {
        return [];
    }
};

// Dynamic sidebar for applicants that includes decisions link during Release Decisions stage
export const getApplicantSidebarItems = async (): Promise<SideBarTypes[]> => {
    try {
        const baseSidebar: SideBarTypes[] = [
            { name: 'Home', path: '/applicant/dashboard' },
            { name: 'Account Settings', path: '/applicant/settings' }
        ];

        baseSidebar.push({ name: 'Logout', path: '/login' });

        return baseSidebar;
    } catch (error) {
        console.error('Error fetching application cycle for sidebar:', error);
        // Fall back to basic sidebar if there's an error
        return applicantSidebar;
    }
};
