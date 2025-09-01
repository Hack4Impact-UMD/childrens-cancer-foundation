import "./AdminWhitelistReviewers.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaTrash } from "react-icons/fa";
import { collection, getDocs, addDoc, deleteDoc, doc, query, orderBy } from "firebase/firestore";
import { db } from "../../index";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { WhitelistEntry, WhitelistFormData } from "../../types/whitelist-types";
import { auth } from "../../index";

function AdminWhitelistReviewers(): JSX.Element {
    const sidebarItems = getSidebarbyRole("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const [affiliationFilter, setAffiliationFilter] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [whitelistEntries, setWhitelistEntries] = useState<WhitelistEntry[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueAffiliations, setUniqueAffiliations] = useState<string[]>([]);
    const [showAddForm, setShowAddForm] = useState(false);
    const [formData, setFormData] = useState<WhitelistFormData>({
        email: "",
        firstName: "",
        lastName: "",
        affiliation: "",
        title: ""
    });

    useEffect(() => {
        fetchWhitelistEntries();
    }, []);

    const fetchWhitelistEntries = async () => {
        setLoading(true);
        try {
            // Fetch whitelist entries
            const whitelistRef = collection(db, "reviewer-whitelist");
            const whitelistQuery = query(whitelistRef, orderBy("email"));
            const whitelistSnapshot = await getDocs(whitelistQuery);

            const whitelistEntries: WhitelistEntry[] = whitelistSnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                addedAt: doc.data().addedAt?.toDate() || new Date()
            })) as WhitelistEntry[];

            // Fetch actual reviewer accounts
            const reviewersRef = collection(db, "reviewers");
            const reviewersSnapshot = await getDocs(reviewersRef);

            const reviewersData: { [email: string]: any } = {};
            reviewersSnapshot.docs.forEach(doc => {
                const data = doc.data();
                if (data.email) {
                    reviewersData[data.email.toLowerCase()] = data;
                }
            });

            // Merge whitelist with actual reviewer data
            const mergedEntries: WhitelistEntry[] = whitelistEntries.map(entry => {
                const reviewerData = reviewersData[entry.email.toLowerCase()];

                if (reviewerData) {
                    // If reviewer has created an account, use their actual data
                    return {
                        ...entry,
                        firstName: reviewerData.firstName || entry.firstName,
                        lastName: reviewerData.lastName || entry.lastName,
                        name: reviewerData.firstName && reviewerData.lastName
                            ? `${reviewerData.firstName} ${reviewerData.lastName}`
                            : entry.name,
                        title: reviewerData.title || entry.title,
                        affiliation: reviewerData.affiliation || entry.affiliation,
                        institution: reviewerData.affiliation || entry.institution,
                        hasAccount: true
                    };
                } else {
                    // If no account yet, use whitelist data
                    return {
                        ...entry,
                        hasAccount: false
                    };
                }
            });

            setWhitelistEntries(mergedEntries);

            // Extract unique affiliations from merged data
            const affiliations = mergedEntries
                .map(entry => entry.affiliation || entry.institution)
                .filter((affiliation): affiliation is string => affiliation !== undefined && affiliation !== null && affiliation.trim() !== '');
            const uniqueAffiliationSet = new Set(affiliations);
            const uniqueAffiliationArray = Array.from(uniqueAffiliationSet).sort();
            setUniqueAffiliations(uniqueAffiliationArray);
        } catch (error) {
            console.error("Error fetching whitelist entries:", error);
        } finally {
            setLoading(false);
        }
    };

    const handleAddToWhitelist = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            const user = auth.currentUser;
            if (!user) {
                throw new Error('User not authenticated');
            }

            const whitelistData = {
                email: formData.email.toLowerCase().trim(),
                firstName: formData.firstName.trim(),
                lastName: formData.lastName.trim(),
                affiliation: formData.affiliation.trim(),
                title: formData.title.trim(),
                addedAt: new Date(),
                addedBy: user.email || user.uid,
                status: 'active'
            };

            await addDoc(collection(db, 'reviewer-whitelist'), whitelistData);

            // Reset form and refresh data
            setFormData({
                email: "",
                firstName: "",
                lastName: "",
                affiliation: "",
                title: ""
            });
            setShowAddForm(false);
            await fetchWhitelistEntries();
        } catch (error) {
            console.error('Error adding to whitelist:', error);
        }
    };

    const handleDeleteEntry = async (id: string) => {
        if (window.confirm('Are you sure you want to remove this email from the whitelist?')) {
            try {
                await deleteDoc(doc(db, 'reviewer-whitelist', id));
                await fetchWhitelistEntries();
            } catch (error) {
                console.error('Error deleting whitelist entry:', error);
            }
        }
    };

    const filteredEntries = whitelistEntries.filter(entry => {
        const matchesSearch = entry.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            entry.name?.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesAffiliation = !affiliationFilter ||
            entry.affiliation === affiliationFilter ||
            entry.institution === affiliationFilter;
        const matchesStatus = !statusFilter ||
            (statusFilter === 'registered' && entry.hasAccount) ||
            (statusFilter === 'pending' && !entry.hasAccount);
        return matchesSearch && matchesAffiliation && matchesStatus;
    });

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="AdminWhitelist">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo" />
                        <h1 className="ApplicantDashboard-header">
                            Reviewer Whitelist Management
                        </h1>
                    </div>

                    <div className="search-filter-container">
                        <div className="search-bar">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by email or name"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters">
                            <div className="filter">
                                <select
                                    value={affiliationFilter}
                                    onChange={(e) => setAffiliationFilter(e.target.value)}
                                    aria-label="Filter by institution"
                                >
                                    <option value="">All Institutions</option>
                                    {uniqueAffiliations.map(aff => (
                                        <option key={aff} value={aff}>
                                            {aff}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div className="filter">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    aria-label="Filter by account status"
                                >
                                    <option value="">All Status</option>
                                    <option value="registered">Registered</option>
                                    <option value="pending">Pending</option>
                                </select>
                            </div>
                            <button
                                className="add-button"
                                onClick={() => setShowAddForm(true)}
                            >
                                <FaPlus /> Add Email
                            </button>
                        </div>
                    </div>

                    {showAddForm && (
                        <div className="add-form-overlay">
                            <div className="add-form">
                                <h3>Add Email to Whitelist</h3>
                                <form onSubmit={handleAddToWhitelist}>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="email">Email *</label>
                                            <input
                                                id="email"
                                                type="email"
                                                value={formData.email}
                                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                                required
                                                placeholder="Enter email address"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="title">Title</label>
                                            <input
                                                id="title"
                                                type="text"
                                                value={formData.title}
                                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                                placeholder="Enter title"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-row">
                                        <div className="form-group">
                                            <label htmlFor="firstName">First Name</label>
                                            <input
                                                id="firstName"
                                                type="text"
                                                value={formData.firstName}
                                                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                                                placeholder="Enter first name"
                                            />
                                        </div>
                                        <div className="form-group">
                                            <label htmlFor="lastName">Last Name</label>
                                            <input
                                                id="lastName"
                                                type="text"
                                                value={formData.lastName}
                                                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                                                placeholder="Enter last name"
                                            />
                                        </div>
                                    </div>
                                    <div className="form-group">
                                        <label htmlFor="affiliation">Institution</label>
                                        <input
                                            id="affiliation"
                                            type="text"
                                            value={formData.affiliation}
                                            onChange={(e) => setFormData({ ...formData, affiliation: e.target.value })}
                                            placeholder="Enter institution name"
                                        />
                                    </div>
                                    <div className="form-actions">
                                        <button type="submit" className="submit-button">Add to Whitelist</button>
                                        <button
                                            type="button"
                                            className="cancel-button"
                                            onClick={() => setShowAddForm(false)}
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    <div className="whitelist-table-container">
                        <div className="whitelist-header">
                            <h2>Whitelisted Emails ({filteredEntries.length})</h2>
                            <div className="whitelist-stats">
                                <span className="stat">
                                    Registered: {whitelistEntries.filter(entry => entry.hasAccount).length}
                                </span>
                                <span className="stat">
                                    Pending: {whitelistEntries.filter(entry => !entry.hasAccount).length}
                                </span>
                            </div>
                        </div>

                        {loading ? (
                            <div className="loading">Loading whitelist entries...</div>
                        ) : filteredEntries.length === 0 ? (
                            <div className="no-entries">
                                {searchTerm || affiliationFilter || statusFilter ? 'No entries match your filters.' : 'No emails in the whitelist yet.'}
                            </div>
                        ) : (
                            <table className="whitelist-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Title</th>
                                        <th>Institution</th>
                                        <th>Account Status</th>
                                        <th>Added</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id} className={entry.hasAccount ? "has-account" : "no-account"}>
                                            <td>{entry.email}</td>
                                            <td>
                                                {entry.firstName && entry.lastName
                                                    ? `${entry.firstName} ${entry.lastName}`
                                                    : entry.firstName || entry.lastName || entry.name || '-'
                                                }
                                            </td>
                                            <td>{entry.title || entry.specialty || '-'}</td>
                                            <td>{entry.affiliation || entry.institution || '-'}</td>
                                            <td>
                                                <span className={`status-badge ${entry.hasAccount ? 'registered' : 'pending'}`}>
                                                    {entry.hasAccount ? 'Registered' : 'Pending'}
                                                </span>
                                            </td>
                                            <td>
                                                {entry.addedAt instanceof Date
                                                    ? entry.addedAt.toLocaleDateString()
                                                    : new Date(entry.addedAt).toLocaleDateString()
                                                }
                                            </td>
                                            <td>
                                                <button
                                                    className="delete-button"
                                                    onClick={() => entry.id && handleDeleteEntry(entry.id)}
                                                    title="Remove from whitelist"
                                                >
                                                    <FaTrash />
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminWhitelistReviewers;
