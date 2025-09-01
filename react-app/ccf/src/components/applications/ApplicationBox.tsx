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
}

const ApplicationBox = ({
    id = "",
    applicationType,
    dueDate,
    status,
    title,
    principalInvestigator,
    onClick = () => { },
    onModalOpen = () => { }
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

    return (
        <div className="single-application-box">
            <div className="application-info">
                <FaFileAlt className="application-icon" />
                <div className="application-text">
                    {title && <p className="application-title">{title}</p>}
                    <p>{applicationType}{principalInvestigator ? ` - ${principalInvestigator}` : ''}</p>
                </div>
            </div>
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
        </div>
    );
}

export default ApplicationBox;