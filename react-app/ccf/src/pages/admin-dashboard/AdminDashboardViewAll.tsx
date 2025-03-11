import "./AdminDashboardViewAll.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState } from "react";
import { FaSearch } from "react-icons/fa";

function AdminDashboardViewAll(): JSX.Element {
    const [searchTerm, setSearchTerm] = useState("");
    const [institutionFilter, setInstitutionFilter] = useState("");
    const [accountTypeFilter, setAccountTypeFilter] = useState("");

    const sidebarItems = [
        {name: "Home", path: "/"},
        {name: "Account Settings", path: "/settings"},
        {name: "All Accounts", path: "/admin-all-accounts"},
        {name: "Logout", path: "/login"}
    ];

    // Dummy data for the accounts table
    const accounts = [
        { id: 1, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 2, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 3, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Inactive" },
        { id: 4, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 5, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 6, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Inactive" },
        { id: 7, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 8, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 9, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 10, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 11, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 12, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Inactive" },
        { id: 13, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
        { id: 14, name: "John Lee", institution: "Holy Cross Hospital", email: "jlee@gmail.com", status: "Active" },
    ];

    return (
        <div>
            <Sidebar links={sidebarItems}/>
            <div className="dashboard-container">
                <div className="AdminViewAll">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo"/>
                        <h1 className="ApplicantDashboard-header">
                            View All Accounts
                        </h1>
                    </div>

                    <div className="search-filter-container">
                        <div className="search-bar">
                            <FaSearch className="search-icon" />
                            <input 
                                type="text" 
                                placeholder="Search" 
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters">
                            <div className="filter">
                                <select 
                                    value={institutionFilter}
                                    onChange={(e) => setInstitutionFilter(e.target.value)}
                                >
                                    <option value="">Institution</option>
                                    <option value="holy-cross">Holy Cross Hospital</option>
                                    <option value="other">Other Institutions</option>
                                </select>
                            </div>
                            <div className="filter">
                                <select 
                                    value={accountTypeFilter}
                                    onChange={(e) => setAccountTypeFilter(e.target.value)}
                                >
                                    <option value="">Account Type</option>
                                    <option value="admin">Admin</option>
                                    <option value="applicant">Applicant</option>
                                    <option value="reviewer">Reviewer</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="ApplicantDashboard-sections-content">
                        <div className="accounts-table-container">
                            <div className="accounts-header">
                                <h2>ALL ACCOUNTS</h2>
                            </div>
                            <table className="accounts-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Name</th>
                                        <th>Institution/Hospital Affiliation</th>
                                        <th>Email</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts.map((account) => (
                                        <tr key={account.id} className={account.status === "Inactive" ? "inactive-row" : ""}>
                                            <td>
                                                <input type="checkbox" />
                                            </td>
                                            <td>{account.name}</td>
                                            <td>{account.institution}</td>
                                            <td>{account.email}</td>
                                            <td>
                                                <span className={`status-indicator ${account.status.toLowerCase()}`}>
                                                    {account.status}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardViewAll;