import { useState, useEffect, ChangeEvent, useCallback, useMemo } from 'react';
import "./GrantAwards.css";
import { FaDownload, FaSortUp, FaSortDown, FaComments, FaTimes, FaSync, FaFilePdf } from 'react-icons/fa';
import {
    FormControl,
    InputLabel,
    Select,
    MenuItem,
    Checkbox,
    ListItemText,
    OutlinedInput,
    Box,
    Chip,
    TextField,
    InputAdornment,
    Popover,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    Typography,
    Divider
} from '@mui/material';
import { Search as SearchIcon } from '@mui/icons-material';
import Sidebar from "../../components/sidebar/Sidebar";
import logo from "../../assets/ccf-logo.png";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { getDownloadURL, ref } from "firebase/storage";
import { db, storage } from '../..';
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
import { dynamicFieldsEngine, FieldInfo, FieldFilterOptions } from '../../services/dynamic-fields-engine';

type SortField = 'name' | 'programType' | 'institution' | 'finalScore' | 'requested' | 'recommended';
type SortDirection = 'asc' | 'desc';

type ColumnKey = string; // Dynamic column keys based on form fields

interface CommentModalProps {
    isOpen: boolean;
    application: GrantAwardApplication | null;
    onClose: () => void;
    onSave: (id: string, comments: string) => void;
}

interface TextModalProps {
    isOpen: boolean;
    title: string;
    content: string;
    onClose: () => void;
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

function TextModal({ isOpen, title, content, onClose }: TextModalProps) {
    if (!isOpen) return null;

    return (
        <div className="modal-overlay">
            <div className="modal-container text-modal">
                <div className="modal-header">
                    <h3>{title}</h3>
                    <button className="close-button" onClick={onClose} title="Close modal" aria-label="Close text modal">
                        <FaTimes />
                    </button>
                </div>
                <div className="modal-body">
                    <div className="text-content">
                        {content || 'No content available'}
                    </div>
                </div>
                <div className="modal-footer">
                    <button className="cancel-button" onClick={onClose}>Close</button>
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
    const [textModal, setTextModal] = useState({
        isOpen: false,
        title: '',
        content: ''
    });
    const [savingChanges, setSavingChanges] = useState<{ [key: string]: boolean }>({});
    const [searchQuery, setSearchQuery] = useState<string>("");
    const [columnsOpen, setColumnsOpen] = useState<boolean>(false);
    const [columnSearchQuery, setColumnSearchQuery] = useState<string>("");
    const [columnAnchorEl, setColumnAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [allAvailableFields, setAllAvailableFields] = useState<Map<string, FieldInfo>>(new Map());
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

    // Function to get filtered fields based on selected program type
    const getFilteredFields = useCallback(() => {
        // Return empty map if no fields are loaded yet
        if (allAvailableFields.size === 0) {
            return new Map<string, FieldInfo>();
        }
        
        if (selectedProgramType === 'All') {
            return allAvailableFields;
        }
        
        const filtered = new Map<string, FieldInfo>();
        for (const [key, fieldInfo] of Array.from(allAvailableFields.entries())) {
            if (fieldInfo.grantTypes.includes(selectedProgramType)) {
                filtered.set(key, fieldInfo);
            }
        }
        return filtered;
    }, [allAvailableFields, selectedProgramType]);

    // Function to discover all available fields using the dynamic fields engine
    const discoverAllAvailableFields = useCallback(async () => {
        try {
            console.log('Discovering available fields...');
            const fields = await dynamicFieldsEngine.getAllFields();
            console.log('Discovered fields:', fields.size, 'fields');
            setAllAvailableFields(fields);
        } catch (error) {
            console.error('Error discovering available fields:', error);
            // Set empty map as fallback
            setAllAvailableFields(new Map());
        }
    }, []);

    // Function to extract data from dynamic application using the engine
    const extractApplicationData = useCallback((data: any, formData?: Record<string, any>): Partial<GrantAwardApplication> => {
        return dynamicFieldsEngine.extractApplicationData(data, formData);
    }, []);

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

                // Extract data using the new dynamic extraction logic
                const extractedData = extractApplicationData(data, data.formData);

                // Map Firestore data to GrantAwardApplication interface (without admin data)
                const application: any = {
                    id: doc.id,
                    name: extractedData.name || "Unknown",
                    programType: data.grantType || "Unknown",
                    institution: extractedData.institution || "Unknown Institution",
                    finalScore,
                    requested: extractedData.requested || "",
                    recommended: "$0", // Will be populated from admin data
                    comments: "", // Will be populated from admin data
                    isAccepted: false,
                    title: extractedData.title || "",
                    applicationCycle: data.applicationCycle || "",
                    submitTime: data.submitTime ? new Date(data.submitTime.toDate()).toLocaleDateString() : "",
                    typesOfCancerAddressed: extractedData.typesOfCancerAddressed || "",
                    adminOfficialName: extractedData.adminOfficialName || "",
                    adminEmail: extractedData.adminEmail || "",
                    adminPhoneNumber: extractedData.adminPhoneNumber || "",
                    institutionEmail: extractedData.institutionEmail || "",
                    requestor: extractedData.requestor || "",
                    timeframe: extractedData.timeframe || "",
                    finalScoreAvailable,
                    // Add all dynamically extracted fields
                    ...extractedData
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
    }, [extractApplicationData]);

    useEffect(() => {
        (async () => {
            try {
                const all = await getAllCycles();
                setCycles(all);
                await discoverAllAvailableFields();
            } catch (e) {
                console.error("Failed to load cycles", e);
            } finally {
                fetchApplications();
            }
        })();
    }, [fetchApplications, discoverAllAvailableFields]);


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

    const openTextModal = (title: string, content: string) => {
        setTextModal({
            isOpen: true,
            title,
            content
        });
    };

    const closeTextModal = () => {
        setTextModal({
            isOpen: false,
            title: '',
            content: ''
        });
    };

    const generateFileDownloadUrl = async (fileName: string, applicationId: string): Promise<string | null> => {
        try {
            if (!fileName) return null;
            
            // The fileName is actually the hash generated by uploadFileToStorage
            // Files are stored in the 'pdfs/' folder with the hash as the filename
            const filePath = `pdfs/${fileName}`;
            
            try {
                const fileRef = ref(storage, filePath);
                const downloadUrl = await getDownloadURL(fileRef);
                return downloadUrl;
            } catch (error) {
                console.error('Error getting download URL for file:', fileName, error);
                return null;
            }
        } catch (error) {
            console.error('Error generating file download URL:', error);
            return null;
        }
    };

    const handleFileClick = async (fileName: string, applicationId: string) => {
        try {
            const downloadUrl = await generateFileDownloadUrl(fileName, applicationId);
            if (downloadUrl) {
                window.open(downloadUrl, '_blank');
            } else {
                alert('File not found or unable to generate download link');
            }
        } catch (error) {
            console.error('Error opening file:', error);
            alert('Error opening file');
        }
    };

    const handleColumnMenuOpen = (event: React.MouseEvent<HTMLButtonElement>) => {
        setColumnAnchorEl(event.currentTarget);
        setColumnsOpen(true);
    };

    const handleColumnMenuClose = () => {
        setColumnAnchorEl(null);
        setColumnsOpen(false);
        setColumnSearchQuery("");
    };

    const handleColumnToggle = (columnKey: string) => {
        setVisibleColumns(prev => ({
            ...prev,
            [columnKey]: !prev[columnKey]
        }));
    };

    const handleSelectAllColumns = () => {
        const filteredFields = getFilteredFields();
        if (filteredFields.size === 0) return;
        
        const allSelected = Array.from(filteredFields.keys()).every(key => visibleColumns[key]);
        
        const newVisibleColumns = { ...visibleColumns };
        Array.from(filteredFields.keys()).forEach(key => {
            newVisibleColumns[key] = !allSelected;
        });
        setVisibleColumns(newVisibleColumns);
    };

    const getFilteredAndSearchedColumns = useCallback(() => {
        const filteredFields = getFilteredFields();
        
        if (!columnSearchQuery.trim()) {
            return filteredFields;
        }
        
        const searchLower = columnSearchQuery.toLowerCase();
        const searched = new Map<string, FieldInfo>();
        
        for (const [key, fieldInfo] of Array.from(filteredFields.entries())) {
            if (fieldInfo.label.toLowerCase().includes(searchLower) || 
                key.toLowerCase().includes(searchLower)) {
                searched.set(key, fieldInfo);
            }
        }
        
        return searched;
    }, [getFilteredFields, columnSearchQuery]);

    const generatePDF = async (application: GrantAwardApplication) => {
        // Pre-generate download URLs for file fields
        const fileDownloadUrls: Record<string, string> = {};
        const filteredFields = getFilteredFields();
        
        if (filteredFields.size === 0) {
            console.warn('No fields available for PDF generation');
            return;
        }
        
        for (const [key, fieldInfo] of Array.from(filteredFields.entries())) {
            const value = (application as any)[key];
            if (value && key !== 'name' && key !== 'programType' && key !== 'institution' && 
                key !== 'title' && key !== 'requested' && key !== 'recommended' && 
                key !== 'isAccepted' && key !== 'finalScore' && key !== 'comments' &&
                key !== 'save' && key !== 'acceptance') {
                
                const isFileField = fieldInfo.type === 'file' || 
                    (typeof value === 'string' && 
                    (value.toLowerCase().includes('.pdf') || 
                     value.toLowerCase().includes('.doc') || 
                     value.toLowerCase().includes('.docx') ||
                     value.toLowerCase().includes('.txt') ||
                     /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value)));
                
                if (isFileField) {
                    try {
                        const downloadUrl = await generateFileDownloadUrl(String(value), application.id);
                        if (downloadUrl) {
                            fileDownloadUrls[key] = downloadUrl;
                        }
                    } catch (error) {
                        console.error('Error generating download URL for field:', key, error);
                    }
                }
            }
        }

        // Create fully dynamic HTML content for the PDF
        const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Application Report - ${application.programType || 'Application'}</title>
                <style>
                    body { font-family: Arial, sans-serif; margin: 20px; line-height: 1.6; }
                    .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
                    .field { margin-bottom: 15px; }
                    .field-label { font-weight: bold; margin-bottom: 5px; color: #333; }
                    .field-value { margin-left: 20px; }
                    .section { margin-bottom: 25px; border-bottom: 1px solid #ccc; padding-bottom: 15px; }
                    .file-link { color: #1976d2; text-decoration: underline; }
                    .file-unavailable { color: #666; }
                </style>
            </head>
            <body>
                <div class="header">
                    <h1>Children's Cancer Foundation</h1>
                    <h2>Application Report</h2>
                    <p>Program Type: ${application.programType || 'N/A'}</p>
                </div>
                
                <div class="section">
                    <h3>Application Data</h3>
                    ${Array.from(filteredFields.entries()).map(([key, fieldInfo]) => {
                        const value = (application as any)[key];
                        if (value !== undefined && value !== null && value !== '') {
                            const isFileField = dynamicFieldsEngine.isFileField(fieldInfo, value);
                            
                            if (isFileField) {
                                const fileName = String(value);
                                const displayName = dynamicFieldsEngine.getFileDisplayName(fileName);
                                
                                const downloadUrl = fileDownloadUrls[key];
                                
                                if (downloadUrl) {
                                    return `
                                        <div class="field">
                                            <div class="field-label">${fieldInfo.label}:</div>
                                            <div class="field-value">
                                                <a href="${downloadUrl}" target="_blank" class="file-link">
                                                    📄 ${displayName}
                                                </a>
                                            </div>
                                        </div>
                                    `;
                                } else {
                                    return `
                                        <div class="field">
                                            <div class="field-label">${fieldInfo.label}:</div>
                                            <div class="field-value">
                                                <span class="file-unavailable">📄 ${displayName} (File not accessible)</span>
                                            </div>
                                        </div>
                                    `;
                                }
                            } else {
                                return `
                                    <div class="field">
                                        <div class="field-label">${fieldInfo.label}:</div>
                                        <div class="field-value">${String(value)}</div>
                                    </div>
                                `;
                            }
                        }
                        return '';
                    }).join('')}
                </div>
                
                <div style="margin-top: 40px; text-align: center; color: #666;">
                    <p>Generated on ${new Date().toLocaleDateString()}</p>
                </div>
                
            </body>
            </html>
        `;

        // Create a new window with the HTML content
        const printWindow = window.open('', '_blank');
        if (printWindow) {
            printWindow.document.write(htmlContent);
            printWindow.document.close();
            
            // Wait for content to load, then trigger print
            printWindow.onload = () => {
                setTimeout(() => {
                    printWindow.print();
                }, 250);
            };
        }
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
        // Create header map from visible columns and filtered fields
        const filteredFields = getFilteredFields();
        if (filteredFields.size === 0) {
            console.warn('No fields available for CSV export');
            return;
        }
        
        const visibleHeaderMap = Array.from(filteredFields.entries())
            .filter(([key]) => visibleColumns[key])
            .map(([key, fieldInfo]) => ({ key, label: fieldInfo.label }));
        
        const headers = visibleHeaderMap.map(h => h.label);

        const csvContent = [
            headers.join(','),
            ...data.map(app => visibleHeaderMap.map(h => {
                const value = (app as any)[h.key];
                
                // Special handling for different field types
                if (h.key === 'finalScore') {
                    return String(app.finalScore);
                }
                if (h.key === 'acceptance') {
                    return `"${app.isAccepted ? 'Accepted' : 'Rejected'}"`;
                }
                if (h.key === 'comments') {
                    return `"${app.comments.replace(/"/g, '""')}"`;
                }
                
                // Default handling for text fields
                const stringValue = String(value || '').replace(/"/g, '""');
                return `"${stringValue}"`;
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
                                <Box>
                                    <button
                                        type="button"
                                        className="columns-toggle"
                                        onClick={handleColumnMenuOpen}
                                        style={{
                                            padding: '8px 16px',
                                            border: '1px solid #ccc',
                                            borderRadius: '4px',
                                            backgroundColor: 'white',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            gap: '8px'
                                        }}
                                    >
                                        <span>Columns</span>
                                        <span style={{ fontSize: '12px', color: '#666' }}>
                                            ({Object.values(visibleColumns).filter(Boolean).length} selected)
                                        </span>
                                    </button>
                                    
                                    <Popover
                                        open={columnsOpen}
                                        anchorEl={columnAnchorEl}
                                        onClose={handleColumnMenuClose}
                                        anchorOrigin={{
                                            vertical: 'bottom',
                                            horizontal: 'left',
                                        }}
                                        transformOrigin={{
                                            vertical: 'top',
                                            horizontal: 'left',
                                        }}
                                        PaperProps={{
                                            style: {
                                                width: '300px',
                                                maxHeight: '400px'
                                            }
                                        }}
                                    >
                                        <Box sx={{ p: 2 }}>
                                            <Typography variant="h6" sx={{ mb: 1 }}>
                                                Select Columns
                                                {selectedProgramType !== 'All' && (
                                                    <Typography variant="caption" sx={{ ml: 1, color: 'text.secondary' }}>
                                                        (Filtered for {selectedProgramType})
                                                    </Typography>
                                                )}
                                            </Typography>
                                            
                                            <TextField
                                                fullWidth
                                                size="small"
                                                placeholder="Search columns..."
                                                value={columnSearchQuery}
                                                onChange={(e) => setColumnSearchQuery(e.target.value)}
                                                InputProps={{
                                                    startAdornment: (
                                                        <InputAdornment position="start">
                                                            <SearchIcon fontSize="small" />
                                                        </InputAdornment>
                                                    ),
                                                }}
                                                sx={{ mb: 2 }}
                                            />
                                            
                                            <Box sx={{ mb: 1 }}>
                                                <button
                                                    onClick={handleSelectAllColumns}
                                                    style={{
                                                        background: 'none',
                                                        border: 'none',
                                                        color: '#1976d2',
                                                        cursor: 'pointer',
                                                        fontSize: '14px',
                                                        textDecoration: 'underline'
                                                    }}
                                                >
                                                    {Array.from(getFilteredFields().keys()).every(key => visibleColumns[key]) ? 'Deselect All' : 'Select All'}
                                                </button>
                                            </Box>
                                            
                                            <Divider sx={{ mb: 1 }} />
                                            
                                            <List sx={{ maxHeight: '250px', overflow: 'auto' }}>
                                                {Array.from(getFilteredAndSearchedColumns().entries()).map(([key, fieldInfo]) => (
                                                    <ListItem key={key} disablePadding>
                                                        <ListItemButton
                                                            dense
                                                            onClick={() => handleColumnToggle(key)}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: '36px' }}>
                                                                <Checkbox
                                                                    checked={visibleColumns[key] || false}
                                                                    size="small"
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={fieldInfo.label}
                                                                secondary={key}
                                                                primaryTypographyProps={{ fontSize: '14px' }}
                                                                secondaryTypographyProps={{ fontSize: '12px', color: 'text.secondary' }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                ))}
                                                {/* Add admin action columns to the selector */}
                                                {['finalScore', 'recommended', 'acceptance', 'comments', 'save'].map(key => (
                                                    <ListItem key={key} disablePadding>
                                                        <ListItemButton
                                                            dense
                                                            onClick={() => handleColumnToggle(key)}
                                                        >
                                                            <ListItemIcon sx={{ minWidth: '36px' }}>
                                                                <Checkbox
                                                                    checked={visibleColumns[key] || false}
                                                                    size="small"
                                                                />
                                                            </ListItemIcon>
                                                            <ListItemText
                                                                primary={key === 'finalScore' ? 'Final Score' : 
                                                                        key === 'recommended' ? 'Recommended' :
                                                                        key === 'acceptance' ? 'Acceptance' :
                                                                        key === 'comments' ? 'Comments' :
                                                                        key === 'save' ? 'Save' : key}
                                                                secondary={key}
                                                                primaryTypographyProps={{ fontSize: '14px' }}
                                                                secondaryTypographyProps={{ fontSize: '12px', color: 'text.secondary' }}
                                                            />
                                                        </ListItemButton>
                                                    </ListItem>
                                                ))}
                                                {getFilteredAndSearchedColumns().size === 0 && (
                                                    <ListItem>
                                                        <ListItemText
                                                            primary="No columns found"
                                                            sx={{ textAlign: 'center', color: 'text.secondary' }}
                                                        />
                                                    </ListItem>
                                                )}
                                            </List>
                                        </Box>
                                    </Popover>
                                </Box>
                            </div>
                            {loading ? (
                                <div className="loading-indicator">Loading applications...</div>
                            ) : allAvailableFields.size === 0 ? (
                                <div className="loading-indicator">Loading form fields...</div>
                            ) : (
                                <div className="table-scroll-wrapper">
                                    <table className="applications-table">
                                        <thead>
                                            <tr>
                                                <th className="pdf-column" data-admin-column="true">PDF</th>
                                                {Array.from(getFilteredFields().entries()).map(([key, fieldInfo]) => {
                                                    if (!visibleColumns[key]) return null;
                                                    
                                                    const isSortable = ['name', 'programType', 'institution', 'finalScore', 'requested', 'recommended'].includes(key);
                                                    const isAdminColumn = ['finalScore', 'recommended', 'acceptance', 'comments', 'save'].includes(key);
                                                    
                                                    return (
                                                        <th 
                                                            key={key}
                                                            onClick={isSortable ? () => handleSort(key as SortField) : undefined}
                                                            className={isSortable ? "sortable" : ""}
                                                            data-admin-column={isAdminColumn ? "true" : "false"}
                                                        >
                                                            {fieldInfo.label} {isSortable && getSortIcon(key as SortField)}
                                                        </th>
                                                    );
                                                })}
                                                {/* Always show admin action columns */}
                                                {visibleColumns.finalScore && (
                                                    <th className="sortable" data-admin-column="true" onClick={() => handleSort('finalScore')}>
                                                        Final Score {getSortIcon('finalScore')}
                                                    </th>
                                                )}
                                                {visibleColumns.recommended && (
                                                    <th className="sortable" data-admin-column="true" onClick={() => handleSort('recommended')}>
                                                        Recommended {getSortIcon('recommended')}
                                                    </th>
                                                )}
                                                {visibleColumns.acceptance && (
                                                    <th data-admin-column="true">Acceptance</th>
                                                )}
                                                {visibleColumns.comments && (
                                                    <th data-admin-column="true">Comments</th>
                                                )}
                                                {visibleColumns.save && (
                                                    <th data-admin-column="true">Save</th>
                                                )}
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {sortedApplications.map((app) => (
                                                <tr key={app.id}>
                                                    <td className="pdf-column" data-admin-column="true">
                                                        <button
                                                            className="pdf-btn"
                                                            onClick={async () => await generatePDF(app)}
                                                            title="Generate PDF Report"
                                                            aria-label={`Generate PDF report for ${app.name}`}
                                                        >
                                                            <FaFilePdf />
                                                        </button>
                                                    </td>
                                                    {Array.from(getFilteredFields().entries()).map(([key, fieldInfo]) => {
                                                        if (!visibleColumns[key]) return null;
                                                        
                                                        const value = (app as any)[key];
                                                        const isEmpty = !value || value === '';
                                                        
                                                        // Skip admin action columns as they're handled separately
                                                        if (['finalScore', 'recommended', 'acceptance', 'comments', 'save'].includes(key)) {
                                                            return null;
                                                        }
                                                        
                                                        // Default field rendering
                                                        const isLongText = dynamicFieldsEngine.isLongTextField(fieldInfo, value);
                                                        const isFileField = dynamicFieldsEngine.isFileField(fieldInfo, value);
                                                        
                                                        if (isFileField && !isEmpty) {
                                                            const fileName = String(value);
                                                            const displayName = `📄 ${dynamicFieldsEngine.getFileDisplayName(fileName)}`;
                                                            
                                                            return (
                                                                <td key={key} className="cell-with-button">
                                                                    <button
                                                                        className="file-link-btn"
                                                                        onClick={() => handleFileClick(fileName, app.id)}
                                                                        title={`Open ${fileName}`}
                                                                    >
                                                                        {displayName}
                                                                    </button>
                                                                </td>
                                                            );
                                                        }
                                                        
                                                        if (isLongText && !isEmpty) {
                                                            return (
                                                                <td key={key} className="cell-with-button">
                                                                    <div className="text-preview">
                                                                        {String(value).substring(0, 100)}...
                                                                    </div>
                                                                    <button
                                                                        className="view-text-btn"
                                                                        onClick={() => openTextModal(fieldInfo.label, String(value))}
                                                                        title={`View full ${fieldInfo.label}`}
                                                                    >
                                                                        View
                                                                    </button>
                                                                </td>
                                                            );
                                                        }
                                                        
                                                        return (
                                                            <td key={key} className={isEmpty ? 'cell-empty' : ''}>
                                                                {value || '—'}
                                                            </td>
                                                        );
                                                    })}
                                                    {/* Always show admin action columns */}
                                                    {visibleColumns.finalScore && (
                                                        <td data-admin-column="true" className={!app.finalScoreAvailable ? 'cell-empty' : ''}>
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
                                                    {visibleColumns.recommended && (
                                                        <td data-admin-column="true">
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
                                                        <td data-admin-column="true">
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
                                                        <td data-admin-column="true">
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
                                                        <td data-admin-column="true">
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
            
            <TextModal
                isOpen={textModal.isOpen}
                title={textModal.title}
                content={textModal.content}
                onClose={closeTextModal}
            />
        </div>
    );
}

export default GrantAwards;