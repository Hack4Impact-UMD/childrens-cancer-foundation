
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
    {name: 'Home', path: '/admin/home'},
    {name: 'Account Settings', path: '/admin/account-settings'},
    { name: 'All Accounts', path: '/admin/all-accounts' },
    { name: 'Assign Reviewers', path: '/admin/assign-reviewers' },
    { name: 'Assign Awards', path: '/admin/assign-awards' },
    { name: 'Database', path: '/admin/database' },
];

export const reviewerSidebar: SideBarTypes[] = [
    {name: 'Home', path: '/reviewer/home'},
    {name: 'Account Settings', path: '/reviewer/account-settings'},
    { name: 'Assigned Applications', path: '/reviewer/assigned-applications' },
    { name: 'All Applications', path: '/reviewer/all-applications' },
];

export const applicantSidebar: SideBarTypes[] = [
    {name: 'Home', path: '/applicant/home'},
    {name: 'Account Settings', path: '/applicant/account-settings'},
    {name: 'Applications', path: '/applicant/applications'},
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