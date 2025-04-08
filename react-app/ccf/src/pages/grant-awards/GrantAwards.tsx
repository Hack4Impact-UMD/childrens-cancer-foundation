import { useState, ChangeEvent } from 'react';
import "./GrantAwards.css";
import { FaDownload, FaSortUp, FaSortDown } from 'react-icons/fa';
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";

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

function GrantAwards(): JSX.Element {
    const [applications, setApplications] = useState<Application[]>([
        {
            id: "app1",
            name: "Lee, John",
            programType: "NeoGen",
            institution: "Holy Cross Hospital",
            finalScore: 3.5,
            requested: "$10,000",
            recommended: "$10,000",
            comments: ""
        },
        {
            id: "app2",
            name: "Smith, Jane",
            programType: "NeoGen",
            institution: "Holy Cross Hospital",
            finalScore: 3.8,
            requested: "$12,000",
            recommended: "$10,000",
            comments: ""
        }
    ]);

    const [sortConfig, setSortConfig] = useState<{
        field: SortField;
        direction: SortDirection;
    }>({
        field: 'finalScore',
        direction: 'asc'
    });

    const sidebarItems = [
        { name: "Home", path: "/" },
        { name: "Account Settings", path: "/settings" },
        { name: "Grant Awards", path: "/grant-awards" },
        { name: "Logout", path: "/login" }
    ];

    const handleInputChange = (
        e: ChangeEvent<HTMLInputElement>,
        index: number,
        field: 'finalScore' | 'recommended'
    ) => {
        const { value } = e.target;
        const updatedApplications = [...applications];
        const appToUpdate = updatedApplications[index];

        if (field === 'finalScore') {
            const score = parseFloat(value);
            if (!isNaN(score)) {
                appToUpdate.finalScore = score;
            } else if (value === "") {
                appToUpdate.finalScore = 0;
            }
        } else if (field === 'recommended') {
            appToUpdate.recommended = value;
        }

        setApplications(updatedApplications);
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
                                <button className="download-btn" onClick={handleDownloadCSV}>
                                    <FaDownload />
                                </button>
                            </div>
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
                                                        onChange={(e) => handleInputChange(e, index, 'finalScore')}
                                                        className="editable-input score-input"
                                                    />
                                                </td>
                                                <td>{app.requested}</td>
                                                <td>
                                                    <input
                                                        type="text"
                                                        value={app.recommended}
                                                        onChange={(e) => handleInputChange(e, index, 'recommended')}
                                                        className="editable-input currency-input"
                                                    />
                                                </td>
                                                <td>{/* Comments cell - currently not editable */}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="table-footer">
                                <button className="save-progress-btn">Save Progress</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GrantAwards;