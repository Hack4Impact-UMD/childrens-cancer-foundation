import { useState, useEffect, ChangeEvent } from 'react';
import "./GrantAwards.css";
import { FaDownload, FaSortUp, FaSortDown, FaComments, FaTimes } from 'react-icons/fa';
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../..';
import { getSidebarbyRole } from '../../types/sidebar-types';
import { getReviewsForApplication } from '../../services/review-service';
import {
    getMultipleAdminData,
    updateAdminComments,
    updateFundingDecision,
    AdminData
} from '../../services/admin-data-service';

type SortField = 'name' | 'programType' | 'institution' | 'finalScore' | 'requested' | 'recommended';
type SortDirection = 'asc' | 'desc';

interface Application {
    id: string;
    name: string;
    programType: string;
    institution: string;
    finalScore: number;
    requested: string;
    recommended: string;
    comments: string;
}

interface CommentModalProps {
    isOpen: boolean;
    application: Application | null;
    onClose: () => void;
    onSave: (id: string, comments: string) => void;
}

function CommentModal({ isOpen, application, onClose, onSave }: CommentModalProps) {
    const [comment, setComment] = useState("");

    useEffect(() => {
        if (application) {
            setComment(application.comments || "");
        }
    }, [application]);

    if (!isOpen || !application) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container">
                <div className="modal-header">
                    <h3>Add Comments for {application.name}</h3>
                    <button className="close-button" onClick={onClose} title="Close modal" aria-label="Close comment modal">
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    <textarea
                        className="comment-textarea"
                        value={comment}
                        onChange={(e) => setComment(e.target.value)}
                        placeholder="Enter your comments here..."
                        rows={6}
                    />
                </div>
                <div className="modal-footer">
                    <button className="cancel-button" onClick={onClose}>Cancel</button>
                    <button
                        className="save-button"
                        onClick={() => {
                            onSave(application.id, comment);
                            onClose();
                        }}
                    >
                        Save Comments
                    </button>
                </div>
            </div>
        </div>
    );
}

function GrantAwards(): JSX.Element {
    const [applications, setApplications] = useState<Application[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [sortConfig, setSortConfig] = useState<{
        field: SortField;
        direction: SortDirection;
    }>({
        field: 'finalScore',
        direction: 'asc'
    });
    const [commentModal, setCommentModal] = useState({
        isOpen: false,
        application: null as Application | null
    });
    const [savingChanges, setSavingChanges] = useState<{ [key: string]: boolean }>({});

    const sidebarItems = getSidebarbyRole("admin");

    useEffect(() => {
        fetchApplications();
    }, []);

    const fetchApplications = async () => {
        try {
            setLoading(true);
            const applicationsRef = collection(db, "applications");
            const querySnapshot = await getDocs(applicationsRef);

            const applicationsData: Application[] = [];
            const applicationIds: string[] = [];

            // First, collect all application data and IDs
            for (const doc of querySnapshot.docs) {
                const data = doc.data();
                applicationIds.push(doc.id);

                // Get final score from reviews collection
                let finalScore = 0;
                try {
                    const reviewSummary = await getReviewsForApplication(doc.id);
                    if (reviewSummary.primaryReview?.status === 'completed' &&
                        reviewSummary.secondaryReview?.status === 'completed') {
                        finalScore = ((reviewSummary.primaryReview.score || 0) + (reviewSummary.secondaryReview.score || 0)) / 2;
                    }
                } catch (error) {
                    console.log(`No reviews found for application ${doc.id}`);
                }

                // Map Firestore data to Application interface (without admin data)
                const application: Application = {
                    id: doc.id,
                    name: data.principalInvestigator || "Unknown",
                    programType: data.grantType || "Unknown",
                    institution: data.institution || "Unknown Institution",
                    finalScore,
                    requested: `$${data.amountRequested || "0"}`,
                    recommended: "$0", // Will be populated from admin data
                    comments: "" // Will be populated from admin data
                };

                applicationsData.push(application);
            }

            // Get admin data for all applications
            const adminDataMap = await getMultipleAdminData(applicationIds);

            // Merge admin data with application data
            const finalApplicationsData = applicationsData.map(app => ({
                ...app,
                recommended: `$${adminDataMap[app.id]?.fundingAmount || "0"}`,
                comments: adminDataMap[app.id]?.comments || ""
            }));

            setApplications(finalApplicationsData);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching applications:", error);
            setLoading(false);
        }
    };

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement>,
        index: number,
        field: 'recommended'
    ) => {
        const { value } = e.target;
        const updatedApplications = [...applications];
        const appToUpdate = updatedApplications[index];

        if (field === 'recommended') {
            appToUpdate.recommended = value;
        }

        setApplications(updatedApplications);
        // No firebase updates until save button is clicked
    };

    const saveChangesToFirestore = async (index: number) => {
        const appToUpdate = applications[index];
        const appId = appToUpdate.id;

        try {
            setSavingChanges(prev => ({ ...prev, [appId]: true }));

            // Extract numeric value from recommended amount
            const recommendedAmount = parseFloat(appToUpdate.recommended.replace(/\$|,/g, '')) || 0;

            // Determine if application is accepted based on recommended amount
            const decision = recommendedAmount > 0 ? "accepted" : "pending";

            // Update admin data (comments and funding decision) in separate collection
            await updateFundingDecision(appId, recommendedAmount, decision);

            // Update only the decision field in the applications collection (no sensitive data)
            const applicationRef = doc(db, "applications", appId);
            await updateDoc(applicationRef, {
                decision: decision
            });

            setSavingChanges(prev => ({ ...prev, [appId]: false }));

            // Show success indication
            console.log(`Changes saved for ${appToUpdate.name}`);
        } catch (error) {
            console.error("Error updating application:", error);
            setSavingChanges(prev => ({ ...prev, [appId]: false }));
        }
    };

    const handleCommentsChange = async (id: string, comments: string) => {
        try {
            // Save comments to admin data collection
            await updateAdminComments(id, comments);

            // Update local state
            setApplications(prevApps =>
                prevApps.map(app =>
                    app.id === id ? { ...app, comments } : app
                )
            );

            console.log("Comments saved successfully");
        } catch (error) {
            console.error("Error saving comments:", error);
            alert("Error saving comments. Please try again.");
        }
    };

    const openCommentModal = (app: Application) => {
        setCommentModal({
            isOpen: true,
            application: app
        });
    };

    const closeCommentModal = () => {
        setCommentModal({
            isOpen: false,
            application: null
        });
    };

    const handleSort = (field: SortField) => {
        const direction: SortDirection =
            field === sortConfig.field && sortConfig.direction === 'asc' ? 'desc' : 'asc';

        setSortConfig({ field, direction });

        const sortedApplications = [...applications].sort((a, b) => {
            if (field === 'finalScore') {
                return direction === 'asc' ? a[field] - b[field] : b[field] - a[field];
            }

            if (field === 'requested' || field === 'recommended') {
                const aValue = parseInt(String(a[field]).replace(/\$|,/g, '')) || 0;
                const bValue = parseInt(String(b[field]).replace(/\$|,/g, '')) || 0;
                return direction === 'asc' ? aValue - bValue : bValue - aValue;
            }

            return direction === 'asc'
                ? a[field].localeCompare(b[field])
                : b[field].localeCompare(a[field]);
        });

        setApplications(sortedApplications);
    };

    const getSortIcon = (field: SortField) => {
        const isActive = sortConfig.field === field;
        const isAsc = sortConfig.direction === 'asc';

        return (
            <div className="sort-icons">
                <FaSortUp className={`sort-icon ${isActive && isAsc ? 'active' : ''}`} />
                <FaSortDown className={`sort-icon ${isActive && !isAsc ? 'active' : ''}`} />
            </div>
        );
    };

    const handleDownloadCSV = () => {
        const headers = ['Name (Last, First)', 'Program Type', 'Institution', 'Final Avg. Score', 'Requested', 'Recommended', 'Comments'];
        const csvContent = [
            headers.join(','),
            ...applications.map(app => [
                `"${app.name.replace(/"/g, '""')}"`,
                `"${app.programType.replace(/"/g, '""')}"`,
                `"${app.institution.replace(/"/g, '""')}"`,
                app.finalScore,
                `"${String(app.requested).replace(/"/g, '""')}"`,
                `"${String(app.recommended).replace(/"/g, '""')}"`,
                `"${app.comments.replace(/"/g, '""')}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'grant_applications.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const saveAllChanges = async () => {
        try {
            for (let i = 0; i < applications.length; i++) {
                await saveChangesToFirestore(i);
            }
            alert("All changes saved successfully!");
        } catch (error) {
            console.error("Error saving changes:", error);
            alert("Error saving changes. Please try again.");
        }
    };

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="AdminViewAll">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo" />
                        <h1 className="ApplicantDashboard-header">
                            Award Recommendations
                        </h1>
                    </div>

                    <div className="ApplicantDashboard-sections-content">
                        <div className="accounts-table-container">
                            <div className="section-header">
                                <h2>CURRENT APPLICATIONS</h2>
                                <div className="header-actions">
                                    <span className="download-text">Download as CSV</span>
                                    <button className="download-btn" onClick={handleDownloadCSV} title="Download CSV" aria-label="Download applications as CSV">
                                        <FaDownload />
                                    </button>
                                </div>
                            </div>
                            {loading ? (
                                <div className="loading-indicator">Loading applications...</div>
                            ) : (
                                <div className="table-scroll-wrapper">
                                    <table className="applications-table">
                                        <thead>
                                            <tr>
                                                <th onClick={() => handleSort('name')} className="sortable">
                                                    Name (Last, First) {getSortIcon('name')}
                                                </th>
                                                <th onClick={() => handleSort('programType')} className="sortable">
                                                    Program Type {getSortIcon('programType')}
                                                </th>
                                                <th onClick={() => handleSort('institution')} className="sortable">
                                                    Institution {getSortIcon('institution')}
                                                </th>
                                                <th onClick={() => handleSort('finalScore')} className="sortable">
                                                    Final Avg. Score {getSortIcon('finalScore')}
                                                </th>
                                                <th onClick={() => handleSort('requested')} className="sortable">
                                                    Requested {getSortIcon('requested')}
                                                </th>
                                                <th onClick={() => handleSort('recommended')} className="sortable">
                                                    Recommended {getSortIcon('recommended')}
                                                </th>
                                                <th>Comments</th>
                                                <th>Save</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {applications.map((app, index) => (
                                                <tr key={app.id}>
                                                    <td>{app.name}</td>
                                                    <td>{app.programType}</td>
                                                    <td>{app.institution}</td>
                                                    <td>
                                                        <input
                                                            type="number"
                                                            step="0.1"
                                                            value={app.finalScore}
                                                            readOnly
                                                            className="editable-input score-input readonly"
                                                            title="Final Average Score"
                                                            aria-label={`Final average score for ${app.name}`}
                                                        />
                                                    </td>
                                                    <td>{app.requested}</td>
                                                    <td>
                                                        <input
                                                            type="text"
                                                            value={app.recommended}
                                                            onChange={(e) => handleInputChange(e, index, 'recommended')}
                                                            className="editable-input currency-input"
                                                            title="Recommended Amount"
                                                            aria-label={`Recommended funding amount for ${app.name}`}
                                                        />
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="comment-btn"
                                                            onClick={() => openCommentModal(app)}
                                                        >
                                                            <FaComments />
                                                            {app.comments && <span className="comment-indicator"></span>}
                                                        </button>
                                                    </td>
                                                    <td>
                                                        <button
                                                            className="save-row-btn"
                                                            onClick={() => saveChangesToFirestore(index)}
                                                            disabled={savingChanges[app.id]}
                                                        >
                                                            {savingChanges[app.id] ? 'Saving...' : 'Save'}
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="table-footer">
                                <button
                                    className="save-progress-btn"
                                    onClick={saveAllChanges}
                                    disabled={Object.values(savingChanges).some(v => v)}
                                >
                                    Save All Changes
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <CommentModal
                isOpen={commentModal.isOpen}
                application={commentModal.application}
                onClose={closeCommentModal}
                onSave={handleCommentsChange}
            />
        </div>
    );
}

export default GrantAwards;