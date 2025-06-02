import React from 'react';
import { FaFileAlt, FaArrowRight } from "react-icons/fa";
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
}

const ApplicationBox = ({
                            id = "",
                            applicationType,
                            dueDate,
                            status,
                            title,
                            principalInvestigator,
                            onClick = () => {}
                        }: ApplicationBoxProps): JSX.Element => {
    // Handle click with optional applicationId
    const handleClick = () => {
        onClick(dueDate, id);
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
        </div>
    );
}

export default ApplicationBox;