import "./AdminPostGrantReports.css";
import logo from "../../assets/ccf-logo.png";
import Sidebar from "../../components/sidebar/Sidebar";
import { useState, useEffect } from "react";
import { FaSearch, FaEye, FaDownload } from "react-icons/fa";
import { collection, getDocs, query, where } from "firebase/firestore";
import { db } from "../../index";
import { getSidebarbyRole } from "../../types/sidebar-types";
import { PostGrantReport } from "../../types/post-grant-report-types";
import { ref, getDownloadURL } from "firebase/storage";
import { getAllPostGrantReports } from "../../backend/post-grant-reports";
import { storage } from "../../index";
import { ApplicationInfo } from "../../types/application-types";

interface PostGrantReportWithApplication extends PostGrantReport {
    applicationTitle?: string;
    principalInvestigator?: string;
    institution?: string;
    grantType?: string;
}

interface ApplicationWithReportStatus extends ApplicationInfo {
    reportStatus: 'submitted' | 'pending' | 'overdue' | 'no-report';
    reportData?: PostGrantReport;
    deadline?: Date;
}

function AdminPostGrantReports(): JSX.Element {
    const sidebarItems = getSidebarbyRole("admin");
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState("");
    const [grantTypeFilter, setGrantTypeFilter] = useState("");
    const [applicationsWithReports, setApplicationsWithReports] = useState<ApplicationWithReportStatus[]>([]);
    const [loading, setLoading] = useState(true);
    const [uniqueGrantTypes, setUniqueGrantTypes] = useState<string[]>([]);

    useEffect(() => {
        const fetchAllApplicationsWithReports = async () => {
            setLoading(true);
            try {
                // Get all applications (we'll filter for accepted ones after getting decision data)
                const applicationsSnapshot = await getDocs(collection(db, "applications"));

                // Get all submitted reports
                const reportsData = await getAllPostGrantReports();

                // Create a map of reports by applicationId for quick lookup
                const reportsMap = new Map<string, PostGrantReport>();
                reportsData.forEach(report => {
                    if (report.applicationId) {
                        reportsMap.set(report.applicationId.toString(), report);
                    }
                });

                // Get decision data for all applications to determine which are accepted
                const { getMultipleDecisionData } = await import("../../services/decision-data-service");
                const applicationIds = applicationsSnapshot.docs.map(doc => doc.id);
                const decisionDataMap = await getMultipleDecisionData(applicationIds);

                const applicationsWithReportStatus: ApplicationWithReportStatus[] = [];
                const currentDate = new Date();

                // Process all applications and filter for accepted ones
                for (const doc of applicationsSnapshot.docs) {
                    const applicationData = doc.data() as ApplicationInfo;
                    const applicationId = doc.id; // Use the document ID
                    const decisionData = decisionDataMap[applicationId];

                    // Check if this application is accepted
                    const isAccepted = decisionData?.isAccepted === true ||
                        applicationData.decision?.toLowerCase() === 'accepted' ||
                        decisionData?.decision?.toLowerCase() === 'accepted';

                    // Only include accepted applications
                    if (isAccepted) {
                        const reportData = reportsMap.get(applicationId);

                        let reportStatus: 'submitted' | 'pending' | 'overdue' | 'no-report' = 'no-report';
                        let deadline: Date | undefined;

                        if (reportData) {
                            // Report exists
                            if (reportData.status === 'submitted') {
                                reportStatus = 'submitted';
                            } else if (reportData.status === 'pending') {
                                reportStatus = 'pending';
                            } else if (reportData.status === 'overdue') {
                                reportStatus = 'overdue';
                            }
                            deadline = reportData.deadline;
                        } else {
                            // No report submitted - mark as pending
                            reportStatus = 'pending';
                        }

                        applicationsWithReportStatus.push({
                            ...applicationData,
                            applicationId: parseInt(applicationId) || applicationData.applicationId, // Ensure we have the right ID
                            reportStatus,
                            reportData,
                            deadline
                        });
                    }
                }

                // Note: We're not adding reports without corresponding applications anymore
                // to avoid duplicates. All reports should be associated with accepted applications.

                // Debug: Log applications with report status
                console.log('Applications with report status:', applicationsWithReportStatus.map(app => ({
                    applicationId: app.applicationId,
                    applicationIdType: typeof app.applicationId,
                    applicationIdString: app.applicationId?.toString(),
                    title: app.title,
                    reportStatus: app.reportStatus,
                    hasReport: !!app.reportData
                })));

                setApplicationsWithReports(applicationsWithReportStatus);

                // Extract unique grant types (assuming grantType is in the application data)
                const grantTypes = applicationsWithReportStatus
                    .map(app => (app as any).grantType || 'Unknown')
                    .filter((type, index, arr) => type && arr.indexOf(type) === index)
                    .sort();
                setUniqueGrantTypes(grantTypes as string[]);
            } catch (error) {
                console.error("Error fetching applications and reports:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAllApplicationsWithReports();
    }, []);

    const filteredApplications = applicationsWithReports.filter(app => {
        const matchesSearch =
            app.applicationId?.toString().includes(searchTerm) ||
            app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.principalInvestigator?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.institution?.toLowerCase().includes(searchTerm.toLowerCase()) ||
            app.institutionEmail?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = !statusFilter || app.reportStatus === statusFilter;
        const matchesGrantType = !grantTypeFilter || (app as any).grantType === grantTypeFilter;

        return matchesSearch && matchesStatus && matchesGrantType;
    });

    const handleViewPDF = async (report: PostGrantReportWithApplication) => {
        if (report.pdf) {
            try {
                // Handle different possible PDF path formats
                let pdfPath = report.pdf;

                // If the path doesn't start with 'pdfs/', add it
                if (!pdfPath.startsWith('pdfs/')) {
                    pdfPath = `pdfs/${pdfPath}`;
                }

                console.log('Attempting to access PDF at path:', pdfPath);
                const pdfRef = ref(storage, pdfPath);
                const url = await getDownloadURL(pdfRef);
                window.open(url, '_blank');
            } catch (error) {
                console.error("Error opening PDF:", error);

                // Try alternative path formats
                try {
                    const alternativePaths = [
                        report.pdf,
                        `pdfs/${report.pdf}`,
                        report.pdf.replace('pdfs/', ''),
                        report.pdf.replace(/^.*\//, 'pdfs/')
                    ];

                    for (const path of alternativePaths) {
                        try {
                            console.log('Trying alternative path:', path);
                            const pdfRef = ref(storage, path);
                            const url = await getDownloadURL(pdfRef);
                            window.open(url, '_blank');
                            return; // Success, exit the function
                        } catch (pathError) {
                            console.log('Path failed:', path, pathError);
                            continue;
                        }
                    }

                    // If all paths fail, show error
                    alert("Unable to access PDF. The file may not exist or you may not have permission to view it.");
                } catch (fallbackError) {
                    console.error("All PDF access attempts failed:", fallbackError);
                    alert("Error accessing PDF. Please contact an administrator.");
                }
            }
        } else {
            alert("No PDF file associated with this report.");
        }
    };

    const getStatusColor = (status?: string) => {
        switch (status) {
            case 'submitted':
                return '#28a745';
            case 'pending':
                return '#ffc107';
            case 'overdue':
                return '#dc3545';
            default:
                return '#6c757d';
        }
    };

    const formatDate = (date: any) => {
        if (!date) return 'N/A';
        const dateObj = date.toDate ? date.toDate() : new Date(date);
        return dateObj.toLocaleDateString();
    };

    if (loading) {
        return (
            <div>
                <Sidebar links={sidebarItems} />
                <div className="dashboard-container">
                    <div className="loading">Loading post-grant reports...</div>
                </div>
            </div>
        );
    }

    return (
        <div>
            <Sidebar links={sidebarItems} />
            <div className="dashboard-container">
                <div className="AdminPostGrantReports">
                    <div className="ApplicantDashboard-header-container">
                        <img src={logo} className="ApplicantDashboard-logo" alt="logo" />
                        <h1 className="ApplicantDashboard-header">
                            Post-Grant Reports Management
                        </h1>
                    </div>

                    <div className="search-filter-container">
                        <div className="search-bar">
                            <FaSearch className="search-icon" />
                            <input
                                type="text"
                                placeholder="Search by Application ID, Title, PI, Institution, or Email"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="filters">
                            <div className="filter">
                                <select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value)}
                                    aria-label="Filter by status"
                                >
                                    <option value="">All Statuses</option>
                                    <option value="submitted">Submitted</option>
                                    <option value="pending">Pending</option>
                                    <option value="overdue">Overdue</option>
                                    <option value="no-report">No Report</option>
                                </select>
                            </div>
                            <div className="filter">
                                <select
                                    value={grantTypeFilter}
                                    onChange={(e) => setGrantTypeFilter(e.target.value)}
                                    aria-label="Filter by grant type"
                                >
                                    <option value="">All Grant Types</option>
                                    {uniqueGrantTypes.map(type => (
                                        <option key={type} value={type}>
                                            {type}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="reports-table-container">
                        <table className="reports-table">
                            <thead>
                                <tr>
                                    {/* <th>Application ID</th> */}
                                    <th>Application Title</th>
                                    <th>Principal Investigator</th>
                                    <th>Institution</th>
                                    <th>Grant Type</th>
                                    <th>Status</th>
                                    <th>Submitted Date</th>
                                    {/* <th>Deadline</th> */}
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredApplications.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="no-data">
                                            {searchTerm || statusFilter || grantTypeFilter
                                                ? "No applications match your search criteria."
                                                : "No accepted applications found."}
                                        </td>
                                    </tr>
                                ) : (
                                    filteredApplications.map((app) => (
                                        <tr key={app.applicationId}>
                                            {/* <td className="application-id-cell">{app.applicationId?.toString() || 'N/A'}</td> */}
                                            <td>{app.title || 'N/A'}</td>
                                            <td>{app.principalInvestigator || 'N/A'}</td>
                                            <td>{app.institution || 'N/A'}</td>
                                            <td>{(app as any).grantType || 'N/A'}</td>
                                            <td>
                                                <span
                                                    className="status-badge"
                                                    style={{ backgroundColor: getStatusColor(app.reportStatus) }}
                                                >
                                                    {app.reportStatus}
                                                </span>
                                            </td>
                                            <td>{app.reportData ? formatDate(app.reportData.submittedAt) : 'N/A'}</td>
                                            {/* <td>{formatDate(app.deadline)}</td> */}
                                            <td>
                                                <div className="action-buttons">
                                                    {app.reportData?.pdf && (
                                                        <button
                                                            className="action-btn view-btn"
                                                            onClick={() => handleViewPDF(app.reportData!)}
                                                            title="View PDF"
                                                        >
                                                            <FaEye />
                                                        </button>
                                                    )}
                                                    {app.reportData?.pdf && (
                                                        <button
                                                            className="action-btn download-btn"
                                                            onClick={() => handleViewPDF(app.reportData!)}
                                                            title="Download PDF"
                                                        >
                                                            <FaDownload />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    <div className="summary-stats">
                        <div className="stat-item">
                            <span className="stat-label">Total Applications:</span>
                            <span className="stat-value">{applicationsWithReports.length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Reports Submitted:</span>
                            <span className="stat-value">{applicationsWithReports.filter(app => app.reportStatus === 'submitted').length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Pending Reports:</span>
                            <span className="stat-value">{applicationsWithReports.filter(app => app.reportStatus === 'pending').length}</span>
                        </div>
                        <div className="stat-item">
                            <span className="stat-label">Overdue Reports:</span>
                            <span className="stat-value">{applicationsWithReports.filter(app => app.reportStatus === 'overdue').length}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default AdminPostGrantReports;
