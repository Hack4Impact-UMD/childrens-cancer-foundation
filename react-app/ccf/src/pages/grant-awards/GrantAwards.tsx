import { useState, useEffect, ChangeEvent, useCallback, useMemo } from 'react';
import "./GrantAwards.css";
import { FaDownload, FaSortUp, FaSortDown, FaComments, FaTimes, FaSync } from 'react-icons/fa';
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { db } from '../..';
import { getSidebarbyRole } from '../../types/sidebar-types';
import { getReviewsForApplicationAdmin, checkAndUpdateApplicationStatus } from '../../services/review-service';
import {
    getMultipleDecisionData,
    updateDecisionComments,
    updateFundingDecision
} from '../../services/decision-data-service';
import { GrantAwardApplication } from '../../types/application-types';
import { getAllCycles } from "../../backend/application-cycle";
import ApplicationCycle from "../../types/applicationCycle-types";

type SortField = 'name' | 'programType' | 'institution' | 'finalScore' | 'requested' | 'recommended';
type SortDirection = 'asc' | 'desc';

type ColumnKey =
    | 'name'
    | 'programType'
    | 'institution'
    | 'finalScore'
    | 'requested'
    | 'recommended'
    | 'acceptance'
    | 'comments'
    | 'save'
    | 'title'
    | 'applicationCycle'
    | 'submitTime'
    | 'typesOfCancerAddressed'
    | 'adminOfficialName'
    | 'adminEmail'
    | 'adminPhoneNumber'
    | 'institutionEmail'
    | 'requestor'
    | 'timeframe';

interface CommentModalProps {
    isOpen: boolean;
    application: GrantAwardApplication | null;
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
                    <p className="comment-note">Note: Comments here will be shared with the applicant.</p>
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
    const [applications, setApplications] = useState<GrantAwardApplication[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [cycles, setCycles] = useState<ApplicationCycle[]>([]);
    const [selectedCycle, setSelectedCycle] = useState<string>('All');
    const [selectedProgramType, setSelectedProgramType] = useState<'All' | 'research' | 'nextgen' | 'nonresearch'>('All');
    const [sortConfig, setSortConfig] = useState<{
        field: SortField;
        direction: SortDirection;
    }>({
        field: 'finalScore',
        direction: 'asc'
    });
    const [commentModal, setCommentModal] = useState({
        isOpen: false,
        application: null as GrantAwardApplication | null
    });
    const [savingChanges, setSavingChanges] = useState<{ [key: string]: boolean }>({});
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [columnsOpen, setColumnsOpen] = useState<boolean>(false);
    const [visibleColumns, setVisibleColumns] = useState<Record<ColumnKey, boolean>>({
        name: true,
        programType: true,
        institution: true,
        finalScore: true,
        requested: true,
        recommended: true,
        acceptance: true,
        comments: true,
        save: true,
        // optional off by default
        title: false,
        applicationCycle: false,
        submitTime: false,
        typesOfCancerAddressed: false,
        adminOfficialName: false,
        adminEmail: false,
        adminPhoneNumber: false,
        institutionEmail: false,
        requestor: false,
        timeframe: false
    });

    const sidebarItems = getSidebarbyRole("admin");

    // Function to check and update application scores if needed
    const checkAndUpdateScores = async (applicationsData: GrantAwardApplication[]) => {
        const applicationsToUpdate = applicationsData.filter(app =>
            !app.finalScoreAvailable && app.finalScore === 0
        );

        if (applicationsToUpdate.length > 0) {
            console.log(`Checking ${applicationsToUpdate.length} applications for score updates...`);

            for (const app of applicationsToUpdate) {
                try {
                    await checkAndUpdateApplicationStatus(app.id);
                } catch (error) {
                    console.warn(`Failed to update scores for application ${app.id}:`, error);
                }
            }
        }
    };

    const fetchApplications = useCallback(async () => {
        try {
            setLoading(true);
            const applicationsRef = collection(db, "applications");
            const querySnapshot = await getDocs(applicationsRef);

            const applicationsData: GrantAwardApplication[] = [];
            const applicationIds: string[] = [];

            // First, collect all application data and IDs
            for (const doc of querySnapshot.docs) {
                const data: any = doc.data();
                applicationIds.push(doc.id);

                // Get final score from application document (stored when both reviews are completed)
                let finalScore = data.averageScore || 0;
                let finalScoreAvailable = data.reviewStatus === 'completed';

                // Map Firestore data to GrantAwardApplication interface (without admin data)
                const application: GrantAwardApplication = {
                    id: doc.id,
                    name: data.principalInvestigator || "Unknown",
                    programType: data.grantType || "Unknown",
                    institution: data.institution || "Unknown Institution",
                    finalScore,
                    requested: (data.amountRequested !== undefined && data.amountRequested !== null && data.amountRequested !== "") ? `$${data.amountRequested}` : "",
                    recommended: "$0", // Will be populated from admin data
                    comments: "", // Will be populated from admin data
                    isAccepted: false,
                    title: data.title || "",
                    applicationCycle: data.applicationCycle || "",
                    submitTime: data.submitTime ? new Date(data.submitTime.toDate()).toLocaleDateString() : "",
                    typesOfCancerAddressed: data.typesOfCancerAddressed || "",
                    adminOfficialName: data.adminOfficialName || "",
                    adminEmail: data.adminEmail || "",
                    adminPhoneNumber: data.adminPhoneNumber || "",
                    institutionEmail: data.institutionEmail || "",
                    requestor: data.requestor || "",
                    timeframe: data.timeframe || "",
                    finalScoreAvailable
                };

                applicationsData.push(application);
            }

            // Get admin data for all applications
            const adminDataMap = await getMultipleDecisionData(applicationIds);

            // Merge admin data with application data
            const finalApplicationsData = applicationsData.map(app => ({
                ...app,
                recommended: `$${adminDataMap[app.id]?.fundingAmount || "0"}`,
                comments: adminDataMap[app.id]?.comments || "",
                isAccepted: adminDataMap[app.id]?.isAccepted ?? false
            }));

            setApplications(finalApplicationsData);
            setLoading(false);

            // Check and update scores for applications that might need it
            await checkAndUpdateScores(finalApplicationsData);
        } catch (error) {
            console.error("Error fetching applications:", error);
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        (async () => {
            try {
                const all = await getAllCycles();
                setCycles(all);
            } catch (e) {
                console.error("Failed to load cycles", e);
            } finally {
                fetchApplications();
            }
        })();
    }, [fetchApplications]);

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as Element;
            if (columnsOpen && !target.closest('.columns-group')) {
                setColumnsOpen(false);
            }
        };

        if (columnsOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [columnsOpen]);

    const cycleOptions = useMemo(() => {
        const cycleNamesFromCollection = cycles.map(c => c.name).filter(Boolean);
        const cycleNamesFromApps = Array.from(new Set(applications.map(a => a.applicationCycle).filter(Boolean))) as string[];
        return Array.from(new Set([...cycleNamesFromCollection, ...cycleNamesFromApps]));
    }, [cycles, applications]);

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement>,
        applicationId: string,
        field: 'recommended'
    ) => {
        const { value } = e.target;
        const updatedApplications = [...applications];
        const existingIndex = updatedApplications.findIndex(a => a.id === applicationId);
        if (existingIndex === -1) return;
        const appToUpdate = updatedApplications[existingIndex];

        if (field === 'recommended') {
            appToUpdate.recommended = value;
            const valueWithoutSign = value.replace('$', '').replace(/,/g, '');
            const recommendedAmount = Number(valueWithoutSign) || 0;
            appToUpdate.isAccepted = recommendedAmount > 0;
        }
        setApplications(updatedApplications);
    };

    const handleAcceptanceToggle = (applicationId: string) => {
        const updatedApplications = [...applications];
        const index = updatedApplications.findIndex(a => a.id === applicationId);
        if (index === -1) return;
        const appToUpdate = updatedApplications[index];
        appToUpdate.isAccepted = !appToUpdate.isAccepted;
        if (!appToUpdate.isAccepted) {
            appToUpdate.recommended = "$0";
        }
        setApplications(updatedApplications);
    };

    const saveChangesToFirestore = async (applicationId: string) => {
        const appToUpdate = applications.find(a => a.id === applicationId);
        if (!appToUpdate) return;
        const appId = appToUpdate.id;

        try {
            setSavingChanges(prev => ({ ...prev, [appId]: true }));

            // Extract numeric value from recommended amount
            const recommendedAmount = parseFloat(appToUpdate.recommended.replace(/\$|,/g, '')) || 0;

            // Determine if application is accepted based on recommended amount
            const decision = recommendedAmount > 0 ? "accepted" : "pending";

            // Update admin data (comments and funding decision) in separate collection
            await updateFundingDecision(appId, recommendedAmount, decision, appToUpdate.isAccepted);

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
            await updateDecisionComments(id, comments);

            // Update local state
            setApplications(prevApps =>
                prevApps.map(app =>
                    app.id === id ? { ...app, comments } : app
                )
            );

            console.log("Comments saved successfully");
        } catch (error) {
            console.error("Error saving comments:", error);
        }
    };

    const openCommentModal = (app: GrantAwardApplication) => {
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

    const handleDownloadCSV = (data: GrantAwardApplication[]) => {
        const headerMap: { key: ColumnKey; label: string }[] = [
            { key: 'title', label: 'Title' },
            { key: 'name', label: 'Name (Last, First)' },
            { key: 'programType', label: 'Program Type' },
            { key: 'institution', label: 'Institution' },
            { key: 'applicationCycle', label: 'Cycle' },
            { key: 'submitTime', label: 'Submitted' },
            { key: 'typesOfCancerAddressed', label: 'Types of Cancer Addressed' },
            { key: 'adminOfficialName', label: 'Admin Official Name' },
            { key: 'adminEmail', label: 'Admin Email' },
            { key: 'adminPhoneNumber', label: 'Admin Phone' },
            { key: 'institutionEmail', label: 'Institution Email' },
            { key: 'requestor', label: 'Requestor' },
            { key: 'timeframe', label: 'Timeframe' },
            { key: 'finalScore', label: 'Final Avg. Score' },
            { key: 'requested', label: 'Requested' },
            { key: 'recommended', label: 'Recommended' },
            { key: 'acceptance', label: 'Accepted' },
            { key: 'comments', label: 'Comments' },
        ];
        const visibleHeaderMap = headerMap.filter(h => visibleColumns[h.key]);
        const headers = visibleHeaderMap.map(h => h.label);

        const csvContent = [
            headers.join(','),
            ...data.map(app => visibleHeaderMap.map(h => {
                switch (h.key) {
                    case 'title': return `"${(app.title || '').replace(/"/g, '""')}"`;
                    case 'name': return `"${app.name.replace(/"/g, '""')}"`;
                    case 'programType': return `"${app.programType.replace(/"/g, '""')}"`;
                    case 'institution': return `"${app.institution.replace(/"/g, '""')}"`;
                    case 'applicationCycle': return `"${(app.applicationCycle || '').replace(/"/g, '""')}"`;
                    case 'submitTime': return `"${(app.submitTime || '').replace(/"/g, '""')}"`;
                    case 'typesOfCancerAddressed': return `"${(app.typesOfCancerAddressed || '').replace(/"/g, '""')}"`;
                    case 'adminOfficialName': return `"${(app.adminOfficialName || '').replace(/"/g, '""')}"`;
                    case 'adminEmail': return `"${(app.adminEmail || '').replace(/"/g, '""')}"`;
                    case 'adminPhoneNumber': return `"${(app.adminPhoneNumber || '').replace(/"/g, '""')}"`;
                    case 'institutionEmail': return `"${(app.institutionEmail || '').replace(/"/g, '""')}"`;
                    case 'requestor': return `"${(app.requestor || '').replace(/"/g, '""')}"`;
                    case 'timeframe': return `"${(app.timeframe || '').replace(/"/g, '""')}"`;
                    case 'finalScore': return String(app.finalScore);
                    case 'requested': return `"${String(app.requested).replace(/"/g, '""')}"`;
                    case 'recommended': return `"${String(app.recommended).replace(/"/g, '""')}"`;
                    case 'acceptance': return `"${app.isAccepted ? 'Accepted' : 'Rejected'}"`;
                    case 'comments': return `"${app.comments.replace(/"/g, '""')}"`;
                    default: return '';
                }
            }).join(','))
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

    const saveAllChanges = async (data: GrantAwardApplication[]) => {
        try {
            for (const app of data) await saveChangesToFirestore(app.id);
        } catch (error) {
            console.error("Error saving changes:", error);
        }
    };

    const refreshScores = async () => {
        try {
            setLoading(true);
            // Check and update scores for all applications
            for (const app of applications) {
                try {
                    await checkAndUpdateApplicationStatus(app.id);
                } catch (error) {
                    console.warn(`Failed to update scores for application ${app.id}:`, error);
                }
            }
            // Reload the applications data
            await fetchApplications();
        } catch (error) {
            console.error("Error refreshing scores:", error);
        } finally {
            setLoading(false);
        }
    };

    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredApplications = applications.filter(app => {
        if (selectedCycle !== 'All' && app.applicationCycle !== selectedCycle) return false;
        if (selectedProgramType !== 'All' && app.programType !== selectedProgramType) return false;
        if (!normalizedQuery) return true;
        const haystack = `${app.name} ${app.programType} ${app.institution} ${app.comments} ${app.title || ''}`.toLowerCase();
        return haystack.includes(normalizedQuery);
    });

    const sortedApplications = [...filteredApplications].sort((a, b) => {
        const field = sortConfig.field;
        const direction = sortConfig.direction;
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
                                    <button className="download-btn" onClick={() => handleDownloadCSV(sortedApplications)} title="Download CSV" aria-label="Download applications as CSV">
                                        <FaDownload />
                                    </button>
                                    <span className="refresh-text">Refresh Scores</span>
                                    <button
                                        className="refresh-btn"
                                        onClick={refreshScores}
                                        disabled={loading}
                                        title="Refresh application scores"
                                        aria-label="Refresh application scores"
                                    >
                                        <FaSync className={loading ? 'spinning' : ''} />
                                    </button>
                                </div>
                            </div>
                            <div className="top-controls">
                                <div className="filter-group">
                                    <label htmlFor="cycle-select">Cycle:</label>
                                    <select id="cycle-select" value={selectedCycle} onChange={(e) => setSelectedCycle(e.target.value)}>
                                        <option value={'All'}>All</option>
                                        {cycleOptions.map(cn => (
                                            <option key={cn} value={cn}>{cn}</option>
                                        ))}
                                    </select>
                                </div>
                                <div className="filter-group">
                                    <label htmlFor="type-select">Type:</label>
                                    <select id="type-select" value={selectedProgramType} onChange={(e) => setSelectedProgramType(e.target.value as any)}>
                                        <option value={'All'}>All</option>
                                        <option value={'research'}>research</option>
                                        <option value={'nextgen'}>nextgen</option>
                                        <option value={'nonresearch'}>nonresearch</option>
                                    </select>
                                </div>
                                <div className="search-group">
                                    <input
                                        type="text"
                                        placeholder="Search by name, program type, or institution"
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                    />
                                </div>
                                <div className={`columns-group ${columnsOpen ? 'columns-open' : ''}`}>
                                    <button
                                        type="button"
                                        className="columns-toggle"
                                        aria-haspopup="true"
                                        onClick={() => setColumnsOpen(o => !o)}
                                    >
                                        <span>Columns</span>
                                    </button>
                                    {columnsOpen && (
                                        <div className="columns-dropdown">
                                            <div className="columns-dropdown-header">Select columns to show</div>
                                            <div className="columns-menu" onClick={(e) => e.stopPropagation()}>
                                                {(
                                                    [
                                                        { key: 'title', label: 'Title' },
                                                        { key: 'name', label: 'Name' },
                                                        { key: 'programType', label: 'Program Type' },
                                                        { key: 'institution', label: 'Institution' },
                                                        { key: 'applicationCycle', label: 'Cycle' },
                                                        { key: 'submitTime', label: 'Submitted' },
                                                        { key: 'typesOfCancerAddressed', label: 'Types of Cancer Addressed' },
                                                        { key: 'adminOfficialName', label: 'Admin Official' },
                                                        { key: 'adminEmail', label: 'Admin Email' },
                                                        { key: 'adminPhoneNumber', label: 'Admin Phone' },
                                                        { key: 'institutionEmail', label: 'Inst. Email' },
                                                        { key: 'requestor', label: 'Requestor' },
                                                        { key: 'timeframe', label: 'Timeframe' },
                                                        { key: 'finalScore', label: 'Final Score' },
                                                        { key: 'requested', label: 'Requested' },
                                                        { key: 'recommended', label: 'Recommended' },
                                                        { key: 'acceptance', label: 'Acceptance' },
                                                        { key: 'comments', label: 'Comments' },
                                                        { key: 'save', label: 'Save' },
                                                    ] as { key: ColumnKey; label: string }[]
                                                ).map(c => (
                                                    <label key={c.key} className="column-toggle">
                                                        <input
                                                            type="checkbox"
                                                            checked={visibleColumns[c.key]}
                                                            onChange={(e) => setVisibleColumns(prev => ({ ...prev, [c.key]: e.target.checked }))}
                                                        />
                                                        <span>{c.label}</span>
                                                    </label>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                            {loading ? (
                                <div className="loading-indicator">Loading applications...</div>
                            ) : (
                                <div className="table-scroll-wrapper">
                                    <table className="applications-table">
                                        <thead>
                                            <tr>
                                                {visibleColumns.title && (
                                                    <th>Title</th>
                                                )}
                                                {visibleColumns.name && (
                                                    <th onClick={() => handleSort('name')} className="sortable">
                                                        Name (Last, First) {getSortIcon('name')}
                                                    </th>
                                                )}
                                                {visibleColumns.programType && (
                                                    <th onClick={() => handleSort('programType')} className="sortable">
                                                        Program Type {getSortIcon('programType')}
                                                    </th>
                                                )}
                                                {visibleColumns.institution && (
                                                    <th onClick={() => handleSort('institution')} className="sortable">
                                                        Institution {getSortIcon('institution')}
                                                    </th>
                                                )}
                                                {visibleColumns.applicationCycle && (
                                                    <th>Cycle</th>
                                                )}
                                                {visibleColumns.submitTime && (
                                                    <th>Submitted</th>
                                                )}
                                                {visibleColumns.typesOfCancerAddressed && (
                                                    <th>Types of Cancer Addressed</th>
                                                )}
                                                {visibleColumns.adminOfficialName && (
                                                    <th>Admin Official Name</th>
                                                )}
                                                {visibleColumns.adminEmail && (
                                                    <th>Admin Email</th>
                                                )}
                                                {visibleColumns.adminPhoneNumber && (
                                                    <th>Admin Phone</th>
                                                )}
                                                {visibleColumns.institutionEmail && (
                                                    <th>Institution Email</th>
                                                )}
                                                {visibleColumns.requestor && (
                                                    <th>Requestor</th>
                                                )}
                                                {visibleColumns.timeframe && (
                                                    <th>Timeframe</th>
                                                )}
                                                {visibleColumns.finalScore && (
                                                    <th onClick={() => handleSort('finalScore')} className="sortable">
                                                        Final Avg. Score {getSortIcon('finalScore')}
                                                    </th>
                                                )}
                                                {visibleColumns.requested && (
                                                    <th onClick={() => handleSort('requested')} className="sortable">
                                                        Requested {getSortIcon('requested')}
                                                    </th>
                                                )}
                                                {visibleColumns.recommended && (
                                                    <th onClick={() => handleSort('recommended')} className="sortable">
                                                        Recommended {getSortIcon('recommended')}
                                                    </th>
                                                )}
                                                {visibleColumns.acceptance && (<th>Acceptance</th>)}
                                                {visibleColumns.comments && (<th>Comments</th>)}
                                                {visibleColumns.save && (<th>Save</th>)}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedApplications.map((app) => (
                                                <tr key={app.id}>
                                                    {visibleColumns.title && (
                                                        <td className={!app.title ? 'cell-empty' : ''}>{app.title || '—'}</td>
                                                    )}
                                                    {visibleColumns.name && (<td className={!app.name ? 'cell-empty' : ''}>{app.name || '—'}</td>)}
                                                    {visibleColumns.programType && (<td className={!app.programType ? 'cell-empty' : ''}>{app.programType || '—'}</td>)}
                                                    {visibleColumns.institution && (<td className={!app.institution ? 'cell-empty' : ''}>{app.institution || '—'}</td>)}
                                                    {visibleColumns.applicationCycle && (
                                                        <td className={!app.applicationCycle ? 'cell-empty' : ''}>{app.applicationCycle || '—'}</td>
                                                    )}
                                                    {visibleColumns.submitTime && (
                                                        <td className={!app.submitTime ? 'cell-empty' : ''}>{app.submitTime || '—'}</td>
                                                    )}
                                                    {visibleColumns.typesOfCancerAddressed && (
                                                        <td className={!app.typesOfCancerAddressed ? 'cell-empty' : ''}>{app.typesOfCancerAddressed || '—'}</td>
                                                    )}
                                                    {visibleColumns.adminOfficialName && (
                                                        <td className={!app.adminOfficialName ? 'cell-empty' : ''}>{app.adminOfficialName || '—'}</td>
                                                    )}
                                                    {visibleColumns.adminEmail && (
                                                        <td className={!app.adminEmail ? 'cell-empty' : ''}>{app.adminEmail || '—'}</td>
                                                    )}
                                                    {visibleColumns.adminPhoneNumber && (
                                                        <td className={!app.adminPhoneNumber ? 'cell-empty' : ''}>{app.adminPhoneNumber || '—'}</td>
                                                    )}
                                                    {visibleColumns.institutionEmail && (
                                                        <td className={!app.institutionEmail ? 'cell-empty' : ''}>{app.institutionEmail || '—'}</td>
                                                    )}
                                                    {visibleColumns.requestor && (
                                                        <td className={!app.requestor ? 'cell-empty' : ''}>{app.requestor || '—'}</td>
                                                    )}
                                                    {visibleColumns.timeframe && (
                                                        <td className={!app.timeframe ? 'cell-empty' : ''}>{app.timeframe || '—'}</td>
                                                    )}
                                                    {visibleColumns.finalScore && (
                                                        <td className={!app.finalScoreAvailable ? 'cell-empty' : ''}>
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
                                                    )}
                                                    {visibleColumns.requested && (<td className={!app.requested ? 'cell-empty' : ''}>{app.requested || '—'}</td>)}
                                                    {visibleColumns.recommended && (
                                                        <td>
                                                            <input
                                                                type="text"
                                                                value={app.recommended}
                                                                onChange={(e) => handleInputChange(e, app.id, 'recommended')}
                                                                className="editable-input currency-input"
                                                                title="Recommended Amount"
                                                                aria-label={`Recommended funding amount for ${app.name}`}
                                                            />
                                                        </td>
                                                    )}
                                                    {visibleColumns.acceptance && (
                                                        <td>
                                                            <button
                                                                className={`acceptance-toggle-btn ${app.isAccepted ? 'accepted' : 'rejected'}`}
                                                                onClick={() => handleAcceptanceToggle(app.id)}
                                                                title={app.isAccepted ? 'Click to reject' : 'Click to accept'}
                                                            >
                                                                {app.isAccepted ? 'Accepted' : 'Rejected'}
                                                            </button>
                                                        </td>
                                                    )}
                                                    {visibleColumns.comments && (
                                                        <td>
                                                            <button
                                                                className="comment-btn"
                                                                onClick={() => openCommentModal(app)}
                                                            >
                                                                <FaComments />
                                                                {app.comments && <span className="comment-indicator"></span>}
                                                            </button>
                                                        </td>
                                                    )}
                                                    {visibleColumns.save && (
                                                        <td>
                                                            <button
                                                                className="save-row-btn"
                                                                onClick={() => saveChangesToFirestore(app.id)}
                                                                disabled={savingChanges[app.id]}
                                                            >
                                                                {savingChanges[app.id] ? 'Saving...' : 'Save'}
                                                            </button>
                                                        </td>
                                                    )}
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            )}
                            <div className="table-footer">
                                <button
                                    className="save-progress-btn"
                                    onClick={() => saveAllChanges(sortedApplications)}
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