
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
    { name: 'Home', path: '/admin/dashboard' },
    { name: 'Account Settings', path: '/admin/settings' },
    { name: 'All Accounts', path: '/admin/all-accounts' },
    { name: 'Assign Reviewers', path: '/admin/assign-reviewers' },
    { name: 'Whitelist Reviewers', path: '/admin/whitelist-reviewers' },
    { name: 'Assign Awards', path: '/admin/grant-awards' },
    { name: 'Post-Grant Reports', path: '/admin/post-grant-reports' },
    { name: 'Application Cycle', path: '/admin/edit-information' },
    { name: 'Logout', path: '/login' }
];

export const reviewerSidebar: SideBarTypes[] = [
    { name: 'Home', path: '/reviewer/dashboard' },
    { name: 'Account Settings', path: '/reviewer/settings' },
    { name: 'All Applications', path: '/reviewer/dashboard/all-applications' },
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

// Dynamic sidebar for applicants that includes decisions link during Final Decisions stage
export const getApplicantSidebarItems = async (): Promise<SideBarTypes[]> => {
    try {
        // Import here to avoid circular dependency
        const { getCurrentCycle } = await import('../backend/application-cycle');
        const { getUsersCurrentCycleAppplications } = await import('../backend/application-filters');
        const { getDecisionData } = await import('../services/decision-data-service');

        const currentCycle = await getCurrentCycle();

        const baseSidebar: SideBarTypes[] = [
            { name: 'Home', path: '/applicant/dashboard' },
            { name: 'Account Settings', path: '/applicant/settings' }
        ];

        // Add decisions link with exclamation icon if in Final Decisions stage
        if (currentCycle.stage === "Final Decisions") {
            baseSidebar.splice(1, 0, { name: 'Decisions', path: '/applicant/decisions' });
        }

        // Post-grant reports are now shown in the main dashboard instead of sidebar

        baseSidebar.push({ name: 'Logout', path: '/login' });

        return baseSidebar;
    } catch (error) {
        console.error('Error fetching application cycle for sidebar:', error);
        // Fall back to basic sidebar if there's an error
        return applicantSidebar;
    }
};
