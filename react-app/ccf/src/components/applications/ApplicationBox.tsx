import React from 'react';
import { FaFileAlt, FaArrowRight, FaEye } from "react-icons/fa";
import './ApplicationBox.css';

export interface Application {
    id?: string;
    applicationType: string;
    dueDate: string;
    status?: string;
    title?: string;
    principalInvestigator?: string;
    reviewId?: string;
    archived?: boolean;
}

interface ApplicationBoxProps {
    id?: string;
    applicationType: string;
    dueDate: string;
    status?: string;
    title?: string;
    principalInvestigator?: string;
    onClick?: (dueDate: string, applicationId?: string) => void;
    onModalOpen?: (applicationId: string) => void;
    archived?: boolean;
    // When provided, an Archive/Unarchive control (and "Archived" tag) is shown.
    onToggleArchive?: () => void;
}

const ApplicationBox = ({
    id = "",
    applicationType,
    dueDate,
    status,
    title,
    principalInvestigator,
    onClick = () => { },
    onModalOpen = () => { },
    archived = false,
    onToggleArchive
}: ApplicationBoxProps): JSX.Element => {
    // Handle click with optional applicationId
    const handleClick = () => {
        onClick(dueDate, id);
    };

    const handleModalOpen = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering the parent onClick
        if (id) {
            onModalOpen(id);
        } else {
            console.error("No application ID provided for modal");
        }
    };

    const handleToggleArchive = (e: React.MouseEvent) => {
        e.stopPropagation();
        onToggleArchive?.();
    };

    return (
        <div className="single-application-box">
            <div className="application-info">
                <FaFileAlt className="application-icon" />
                <div className="application-text">
                    {title && (
                        <p className="application-title">
                            {title}
                            {archived && <span className="archived-tag">Archived</span>}
                        </p>
                    )}
                    <p>{applicationType}{principalInvestigator ? ` - ${principalInvestigator}` : ''}</p>
                </div>
            </div>
            <div className="application-actions">
                <button
                    className="due-date-button"
                    onClick={handleClick}
                >
                    {dueDate}
                    <FaArrowRight className="arrow" />
                </button>
                <button
                    className="modal-button"
                    onClick={handleModalOpen}
                >
                    <FaEye />
                    View Details
                </button>
                {onToggleArchive && (
                    <button
                        className="archive-btn"
                        onClick={handleToggleArchive}
                    >
                        {archived ? 'Unarchive' : 'Archive'}
                    </button>
                )}
            </div>
        </div>
    );
}

export default ApplicationBox;
