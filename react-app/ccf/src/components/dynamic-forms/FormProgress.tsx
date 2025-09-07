import React from 'react';
import './FormProgress.css';

interface FormProgressProps {
  currentPage: number;
  totalPages: number;
  pageNames: string[];
}

const FormProgress: React.FC<FormProgressProps> = ({
  currentPage,
  totalPages,
  pageNames
}) => {
  const progressPercentage = (currentPage / totalPages) * 100;

  return (
    <div className="form-progress">
      <div className="progress-header">
        <span className="progress-text">
          Step {currentPage} of {totalPages}
        </span>
        <span className="progress-percentage">
          {Math.round(progressPercentage)}% Complete
        </span>
      </div>
      
      <div className="progress-bar-container">
        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </div>
      
      <div className="progress-steps">
        {pageNames.map((pageName, index) => {
          const stepNumber = index + 1;
          const isActive = stepNumber === currentPage;
          const isCompleted = stepNumber < currentPage;
          const isUpcoming = stepNumber > currentPage;
          
          return (
            <div
              key={index}
              className={`progress-step ${
                isActive ? 'active' : 
                isCompleted ? 'completed' : 
                'upcoming'
              }`}
            >
              <div className="step-indicator">
                {isCompleted ? (
                  <span className="step-check">✓</span>
                ) : (
                  <span className="step-number">{stepNumber}</span>
                )}
              </div>
              <div className="step-info">
                <div className="step-name">{pageName}</div>
                <div className="step-status">
                  {isActive && 'In Progress'}
                  {isCompleted && 'Completed'}
                  {isUpcoming && 'Upcoming'}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default FormProgress;
