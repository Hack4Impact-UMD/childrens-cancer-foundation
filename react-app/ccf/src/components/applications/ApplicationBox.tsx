import React from 'react';
import { FaFileAlt, FaArrowRight } from "react-icons/fa";
import './ApplicationBox.css';

export interface Application {
  applicationType: string;
  dueDate: string;
  status?: string;
}

interface ApplicationBoxProps {
  applicationType: string;
  dueDate: string;
  status?: string;
  onClick?: (dueDate: string) => void;
}

const ApplicationBox = ({ 
  applicationType, 
  dueDate, 
  status,
  onClick = () => {} 
}: ApplicationBoxProps) => {
  return (
    <div className="single-application-box">
      <div className="application-info">
        <FaFileAlt className="application-icon" />
        <p>{applicationType}</p>
      </div>
      <button
        className="due-date-button"
        onClick={() => onClick(dueDate)}
      >
        {dueDate}
        <FaArrowRight className="arrow" />
      </button>
    </div>
  );
};
export default ApplicationBox;