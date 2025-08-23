import "./AdminWhitelistReviewers.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch, FaPlus, FaTrash, FaEdit } from "react-icons/fa";
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy } from "firebase/firestore";
import { db } from "../../index";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { WhitelistEntry, WhitelistFormData } from "../../types/whitelist-types";
import { auth } from "../../index";

function AdminWhitelistReviewers(): JSX.Element {
    const sidebarItems = getSidebarbyRole("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const [affiliationFilter, setAffiliationFilter] = useState("");
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
            const whitelistRef = collection(db, "reviewer-whitelist");
            const q = query(whitelistRef, orderBy("email"));
            const querySnapshot = await getDocs(q);

            const entries: WhitelistEntry[] = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                addedAt: doc.data().addedAt?.toDate() || new Date()
            })) as WhitelistEntry[];

            setWhitelistEntries(entries);

            // Extract unique affiliations
            const affiliations = entries
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
        return matchesSearch && matchesAffiliation;
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
                        </div>

                        {loading ? (
                            <div className="loading">Loading whitelist entries...</div>
                        ) : filteredEntries.length === 0 ? (
                            <div className="no-entries">
                                {searchTerm || affiliationFilter ? 'No entries match your filters.' : 'No emails in the whitelist yet.'}
                            </div>
                        ) : (
                            <table className="whitelist-table">
                                <thead>
                                    <tr>
                                        <th>Email</th>
                                        <th>Name</th>
                                        <th>Title</th>
                                        <th>Institution</th>
                                        <th>Added</th>
                                        <th>Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredEntries.map((entry) => (
                                        <tr key={entry.id}>
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
