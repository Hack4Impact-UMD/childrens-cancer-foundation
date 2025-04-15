import "./AdminDashboardViewAll.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch } from "react-icons/fa";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../../index";
import MailtoLink from "../../components/MailtoLink";
import sendIcon from "../../assets/email_send-solid.png";

function AdminDashboardViewAll(): JSX.Element {
    const [searchTerm, setSearchTerm] = useState("");
    const [affiliationFilter, setAffiliationFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [applicationCycleFilter, setApplicationCycleFilter] = useState("");
    const [decisionFilter, setDecisionFilter] = useState("");
    const [grantTypeFilter, setGrantTypeFilter] = useState("");
    const [cancerTypeFilter, setCancerTypeFilter] = useState("");
    const [accounts, setAccounts] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
    const [uniqueStatuses, setUniqueStatuses] = useState<string[]>([]);
    const [uniqueApplicationCycles, setUniqueApplicationCycles] = useState<string[]>([]);
    const [uniqueDecisions, setUniqueDecisions] = useState<string[]>([]);
    const [uniqueGrantTypes, setUniqueGrantTypes] = useState<string[]>([]);
    const [uniqueCancerTypes, setUniqueCancerTypes] = useState<string[]>([]);
    const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

    const sidebarItems = [
        { name: "Home", path: "/" },
        { name: "Account Settings", path: "/settings" },
        { name: "All Accounts", path: "/admin-all-accounts" },
        { name: "Logout", path: "/login" },
    ];

    useEffect(() => {
        const fetchAllAccounts = async () => {
            setLoading(true);
            try {
                const adminSnapshot = await getDocs(collection(db, "admins"));
                const applicantSnapshot = await getDocs(collection(db, "applicants"));
                const reviewerSnapshot = await getDocs(collection(db, "reviewers"));

                const adminAccounts = adminSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || data.institution || data.hospitalAffiliation || "N/A",
                        status: data.status || "Active",
                        accountNumber: data.accountNumber || doc.id,
                        applicationCycle: data.applicationCycle || "N/A",
                        decision: data.decision || "N/A",
                        grantType: data.grantType || "N/A",
                        cancerType: data.cancerType || "N/A",
                        email: data.email || "N/A",
                    };
                });

                const applicantAccounts = applicantSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || data.institution || data.hospitalAffiliation || "N/A",
                        status: data.status || "Pending",
                        accountNumber: data.accountNumber || doc.id,
                        applicationCycle: data.applicationCycle || "N/A",
                        decision: data.decision || "N/A",
                        grantType: data.grantType || "N/A",
                        cancerType: data.cancerType || "N/A",
                        email: data.email || "N/A",

                    };
                });

                const reviewerAccounts = reviewerSnapshot.docs.map((doc) => {
                    const data = doc.data();
                    return {
                        id: doc.id,
                        name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
                        affiliation: data.affiliation || data.institution || data.hospitalAffiliation || "N/A",
                        status: data.status || "Active",
                        accountNumber: data.accountNumber || doc.id,
                        applicationCycle: data.applicationCycle || "N/A",
                        decision: data.decision || "N/A",
                        grantType: data.grantType || "N/A",
                        cancerType: data.cancerType || "N/A",
                        email: data.email || "N/A",
                    };
                });

                const allAccounts = [...adminAccounts, ...applicantAccounts, ...reviewerAccounts];
                setAccounts(allAccounts);

                const affiliations = allAccounts.map(account => account.affiliation);
                const uniqueAffiliationSet = new Set(affiliations);
                const uniqueAffiliationArray = Array.from(uniqueAffiliationSet)
                    .filter(affiliation => affiliation && affiliation !== "N/A")
                    .sort();
                setUniqueAffiliations(uniqueAffiliationArray);

                const statuses = allAccounts.map(account => account.status);
                const uniqueStatusSet = new Set(statuses);
                const uniqueStatusArray = Array.from(uniqueStatusSet)
                    .filter(status => status)
                    .sort();
                setUniqueStatuses(uniqueStatusArray);

                const applicationCycles = allAccounts.map(account => account.applicationCycle);
                const uniqueApplicationCycleSet = new Set(applicationCycles);
                const uniqueApplicationCycleArray = Array.from(uniqueApplicationCycleSet)
                    .filter(cycle => cycle && cycle !== "N/A")
                    .sort();
                setUniqueApplicationCycles(uniqueApplicationCycleArray);

                const decisions = allAccounts.map(account => account.decision);
                const uniqueDecisionSet = new Set(decisions);
                const uniqueDecisionArray = Array.from(uniqueDecisionSet)
                    .filter(decision => decision && decision !== "N/A")
                    .sort();
                setUniqueDecisions(uniqueDecisionArray);

                const grantTypes = allAccounts.map(account => account.grantType);
                const uniqueGrantTypeSet = new Set(grantTypes);
                const uniqueGrantTypeArray = Array.from(uniqueGrantTypeSet)
                    .filter(grantType => grantType && grantType !== "N/A")
                    .sort();
                setUniqueGrantTypes(uniqueGrantTypeArray);

                const cancerTypes = allAccounts.map(account => account.cancerType);
                const uniqueCancerTypeSet = new Set(cancerTypes);
                const uniqueCancerTypeArray = Array.from(uniqueCancerTypeSet)
                    .filter(cancerType => cancerType && cancerType !== "N/A")
                    .sort();
                setUniqueCancerTypes(uniqueCancerTypeArray);

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
                                value={applicationCycleFilter}
                                onChange={(e) => setApplicationCycleFilter(e.target.value)}
                            >
                                <option value="">Application Cycle</option>
                                {uniqueApplicationCycles.map(cycle => (
                                    <option key={cycle} value={cycle}>
                                        {cycle}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter">
                            <select
                                value={decisionFilter}
                                onChange={(e) => setDecisionFilter(e.target.value)}
                            >
                                <option value="">Decision</option>
                                {uniqueDecisions.map(decision => (
                                    <option key={decision} value={decision}>
                                        {decision}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter">
                            <select
                                value={grantTypeFilter}
                                onChange={(e) => setGrantTypeFilter(e.target.value)}
                            >
                                <option value="">Grant Type</option>
                                {uniqueGrantTypes.map(grantType => (
                                    <option key={grantType} value={grantType}>
                                        {grantType}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div className="filter">
                            <select
                                value={cancerTypeFilter}
                                onChange={(e) => setCancerTypeFilter(e.target.value)}
                            >
                                <option value="">Cancer Type</option>
                                {uniqueCancerTypes.map(cancerType => (
                                    <option key={cancerType} value={cancerType}>
                                        {cancerType}
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
                                            <th>Status</th>
                                            <th>Email</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {accounts
                                            .filter(account => {
                                                const searchFilter = searchTerm.toLowerCase();
                                                return (
                                                    searchTerm === "" ||
                                                    account.name.toLowerCase().includes(searchFilter) ||
                                                    account.affiliation.toLowerCase().includes(searchFilter) ||
                                                    account.accountNumber.toLowerCase().includes(searchFilter)
                                                );
                                            })
                                            .filter(account => {
                                                return affiliationFilter === "" ||
                                                    account.affiliation.toLowerCase().includes(affiliationFilter.toLowerCase());
                                            })
                                            .filter(account => {
                                                return statusFilter === "" ||
                                                    account.status.toLowerCase().includes(statusFilter.toLowerCase());
                                            })
                                            .filter(account => {
                                                return applicationCycleFilter === "" ||
                                                    account.applicationCycle.toLowerCase().includes(applicationCycleFilter.toLowerCase());
                                            })
                                            .filter(account => {
                                                return decisionFilter === "" ||
                                                    account.decision.toLowerCase().includes(decisionFilter.toLowerCase());
                                            })
                                            .filter(account => {
                                                return grantTypeFilter === "" ||
                                                    account.grantType.toLowerCase().includes(grantTypeFilter.toLowerCase());
                                            })
                                            .filter(account => {
                                                return cancerTypeFilter === "" ||
                                                    account.cancerType.toLowerCase().includes(cancerTypeFilter.toLowerCase());
                                            })
                                            .map((account) => (
                                                <tr key={account.id}>
                                                    <td>
                                                        <input 
                                                          type="checkbox" 
                                                          onChange={(e) => {
                                                            const checked = e.target.checked;
                                                            const email = account.email;

                                                            setSelectedEmails((prev) =>
                                                            checked ? [...prev, email] : prev.filter((e) => e !== email)
                                                            );
                                                          }}

                                                          checked={selectedEmails.includes(account.email)}
                                                        />
                                                    </td>
                                                    <td>{account.name}</td>
                                                    <td>{account.affiliation}</td>
                                                    <td>
                                                        <div className="status-container">
                                                            <span className={`status-icon ${account.status.toLowerCase() === 'active' ? 'active' : 'inactive'}`}></span>
                                                            <span className="status-text">{account.status}</span>
                                                        </div>
                                                    </td>

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