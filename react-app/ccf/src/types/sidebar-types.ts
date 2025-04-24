
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
    {name: 'Home', path: '/admin/dashboard'},
    {name: 'Account Settings', path: '/admin/settings'},
    { name: 'All Accounts', path: '/admin/all-accounts' },
    { name: 'Assign Reviewers', path: '/admin/assign-reviewers' },
    { name: 'Assign Awards', path: '/admin/grant-awards' },
    { name: 'Application Cycle', path: '/admin/edit-information' },
    { name: 'Logout', path: '/login'}
];

export const reviewerSidebar: SideBarTypes[] = [
    {name: 'Home', path: '/reviewer/dashboard'},
    {name: 'Account Settings', path: '/reviewer/settings'},
    { name: 'Assigned Applications', path: '/reviewer/assigned-applications' },
    { name: 'All Applications', path: '/reviewer/dashboard/all-applications' },
    { name: 'Logout', path: '/login'}
];

export const applicantSidebar: SideBarTypes[] = [
    {name: 'Home', path: '/applicant/dashboard'},
    {name: 'Account Settings', path: '/applicant/settings'},
    {name: 'Applications', path: '/applicant/applications'},
    { name: 'Logout', path: '/login'}
];

export const getSidebarbyRole = (role: differentUserRoles): SideBarTypes[] => {
    if(role === 'admin') {
        return adminSidebar;
    } else if(role === 'reviewer') {
        return reviewerSidebar;
    } else if(role === 'applicant') {
        return applicantSidebar;
    } else {
        return [];
    }
};
