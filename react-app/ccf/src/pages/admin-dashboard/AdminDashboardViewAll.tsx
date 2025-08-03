import "./AdminDashboardViewAll.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../index";
import MailtoLink from "../../components/MailtoLink";
import sendIcon from "../../assets/email_send-solid.png";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { UserData } from "../../types/usertypes";

function AdminDashboardViewAll(): JSX.Element {
    const sidebarItems = getSidebarbyRole("admin")
    const [searchTerm, setSearchTerm] = useState("");
    const [affiliationFilter, setAffiliationFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("")
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
    const roles = ["Reviewer", "Applicant"];
    // Stores the emails of accounts selected via checkboxes in the table
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);
    
    useEffect(() => {
        const fetchAllAccounts = async () => {
            setLoading(true);
            try {
                const applicantSnapshot = await getDocs(collection(db, "applicants"));
                const reviewerSnapshot = await getDocs(collection(db, "reviewers"));

                const applicantAccounts = applicantSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return data as UserData
                });

                const reviewerAccounts = reviewerSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return data as UserData
                });

                const allAccounts = [...applicantAccounts, ...reviewerAccounts];
                setAccounts(allAccounts);

                const affiliations = allAccounts.map(account => account.affiliation);
                const uniqueAffiliationSet = new Set(affiliations);
                const uniqueAffiliationArray = Array.from(uniqueAffiliationSet)
                    .filter(affiliation => affiliation != null)
                    .map(aff => aff as string)
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
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="AdminViewAll">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo" />
                        <h1 className="ApplicantDashboard-header">
                            Administrator Dashboard
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
                                onChange={(e) => setAffiliationFilter(e.target.value)}
                            >
                                <option value="">Institution</option>
                                {uniqueAffiliations.map(aff => (
                                    <option key={aff} value={aff}>
                                        {aff}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter">
                            <select
                                value={roleFilter}
                                onChange={(e) => setRoleFilter(e.target.value)}
                            >
                                <option value="">Role</option>
                                {roles.map(role => (
                                    <option key={role} value={role}>
                                        {role}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
                    <div className="ApplicantDashboard-sections-content">
                        <div className="accounts-table-container">
                            <div className="accounts-header">
                                <h2>ALL ACCOUNTS</h2>

                                {/* Only send email to selected accounts using MailtoLink */}
                                <MailtoLink
                                    to={selectedEmails}                                    
                                    subject="Important Update from CCF"
                                    body="Hello, This is a message from the CCF admin team. Please check your account for updates. Thank you!"
                                >
                                    <button className="send-email-button">
                                    <img src={sendIcon} alt="Send Email"></img>
                                    Send Email
                                    </button>
                                </MailtoLink>
                            </div>
                            {loading ? (
                                <div className="loading-message">Loading accounts...</div>
                            ) : (
                                <table className="accounts-table">
                                    <thead>
                                        <tr>
                                            <th></th>
                                            <th>Name</th>
                                            <th>Institution/Hospital Affiliation</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts
                                            .filter(account => {
                                                const searchFilter = searchTerm.toLowerCase();
                                                return (
                                                    searchTerm === "" ||
                                                    account.firstName?.toLowerCase()?.includes(searchFilter) ||
                                                    account.lastName?.toLowerCase()?.includes(searchFilter) ||
                                                    account.affiliation?.toLowerCase()?.includes(searchFilter) ||
                                                    account.email?.toLowerCase()?.includes(searchFilter)
                                                );
                                            })
                                            .filter(account => {
                                                return affiliationFilter === "" ||
                                                    account.affiliation.includes(affiliationFilter);
                                            })
                                            .filter(account => {
                                                return roleFilter === "" ||
                                                    (account.role && account.role.toLowerCase() == roleFilter.toLowerCase());
                                            })
                                            .map((account) => (
                                                <tr key={account.id}>
                                                    <td>
                                                        <input 
                                                          type="checkbox" 
                                                          // When checkbox is toggled, add/remove the email from selectedEmails
                                                          onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            const email = account.email;

                                                            setSelectedEmails((prev) =>
                                                            checked ? [...prev, email] : prev.filter((e) => e !== email)
                                                            );
                                                          }}
                                                          // Keeps the checkbox visually in sync with state
                                                          checked={selectedEmails.includes(account.email)}
                                                        />
                                                    </td>
                                                    <td>{account.firstName + " " + account.lastName}</td>
                                                    <td>{account.affiliation}</td>

                                                    <td>{account.email}</td>
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
}

export default AdminDashboardViewAll;