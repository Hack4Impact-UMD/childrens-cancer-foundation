import "./AdminDashboardViewAll.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../index";

function AdminDashboardViewAll(): JSX.Element {
    const [searchTerm, setSearchTerm] = useState("");
    const [affiliationFilter, setaffiliationFilter] = useState("");
    const [accountTypeFilter, setAccountTypeFilter] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);

    const sidebarItems = [
        {name: "Home", path: "/"},
        {name: "Account Settings", path: "/settings"},
        {name: "All Accounts", path: "/admin-all-accounts"},
        {name: "Logout", path: "/login"}
    ];

    // Fetch data from Firestore collections
    useEffect(() => {
        const fetchAllAccounts = async () => {
            setLoading(true);
            try {
                // Fetch from all three collections
                const adminSnapshot = await getDocs(collection(db, "admins"));
                const applicantSnapshot = await getDocs(collection(db, "applicants"));
                const reviewerSnapshot = await getDocs(collection(db, "reviewers"));
                
                // Process admin accounts
                const adminAccounts = adminSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || "N/A",
                        email: data.email || "",
                        type: "Admin"
                    };
                });
                
                // Process applicant accounts
                const applicantAccounts = applicantSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || "N/A",
                        email: data.email || "",
                        type: "Applicant"
                    };
                });
                
                // Process reviewer accounts
                const reviewerAccounts = reviewerSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || "N/A",
                        email: data.email || "",
                        type: "Reviewer"
                    };
                });
                
                // Combine all accounts
                const allAccounts = [...adminAccounts, ...applicantAccounts, ...reviewerAccounts];
                setAccounts(allAccounts);
                
                // Extract unique affiliations for dropdown
                const affiliations = allAccounts.map(account => account.affiliation);
                const uniqueAffiliationSet = new Set(affiliations);
                // Convert set to array and filter out empty values
                const uniqueAffiliationArray = Array.from(uniqueAffiliationSet)
                    .filter(affiliation => affiliation && affiliation !== "N/A")
                    .sort();
                    
                setUniqueAffiliations(uniqueAffiliationArray);
            } catch (error) {
                console.error("Error fetching accounts:", error);
            } finally {
                setLoading(false);
            }
        };
        
        fetchAllAccounts();
    }, []);

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
                                    value={affiliationFilter}
                                    onChange={(e) => setaffiliationFilter(e.target.value)}
                                >
                                    <option value="">All affiliations</option>
                                    {uniqueAffiliations.map(affiliation => (
                                        <option key={affiliation} value={affiliation}>
                                            {affiliation}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter">
                                <select 
                                    value={accountTypeFilter}
                                    onChange={(e) => setAccountTypeFilter(e.target.value)}
                                >
                                    <option value="">Account Type</option>
                                    <option value="Admin">Admin</option>
                                    <option value="Applicant">Applicant</option>
                                    <option value="Reviewer">Reviewer</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="ApplicantDashboard-sections-content">
                        <div className="accounts-table-container">
                            <div className="accounts-header">
                                <h2>ALL ACCOUNTS</h2>
                            </div>
                            {loading ? (
                                <div className="loading-message">Loading accounts...</div>
                            ) : (
                            <table className="accounts-table">
                                <thead>
                                    <tr>
                                        <th></th>
                                        <th>Name</th>
                                        <th>affiliation/Hospital Affiliation</th>
                                        <th>Email</th>
                                        <th>Type</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {accounts
                                        .filter(account => {
                                            // Filter by search term
                                            const searchFilter = searchTerm.toLowerCase();
                                            return (
                                                searchTerm === "" || 
                                                account.name.toLowerCase().includes(searchFilter) ||
                                                account.email.toLowerCase().includes(searchFilter) ||
                                                account.affiliation.toLowerCase().includes(searchFilter)
                                            );
                                        })
                                        .filter(account => {
                                            // Filter by affiliation
                                            return affiliationFilter === "" || 
                                                  account.affiliation.toLowerCase().includes(affiliationFilter.toLowerCase());
                                        })
                                        .filter(account => {
                                            // Filter by account type
                                            return accountTypeFilter === "" || account.type === accountTypeFilter;
                                        })
                                        .map((account) => (
                                        <tr key={account.id}>
                                            <td>
                                                <input type="checkbox" />
                                            </td>
                                            <td>{account.name}</td>
                                            <td>{account.affiliation}</td>
                                            <td>{account.email}</td>
                                            <td>{account.type}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AdminDashboardViewAll;