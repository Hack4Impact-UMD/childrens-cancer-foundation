import React, { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaFileAlt, FaArrowRight } from 'react-icons/fa';
import Sidebar from '../../components/sidebar/Sidebar';
import Button from '../../components/buttons/Button';
import logo from "../../assets/ccf-logo.png";
import { AssignReviewers } from '../../types/application-types';  
import './AssignReviewers.css';

const AssignReviewersPage: React.FC = () => {
  const sidebarLinks = [
    { name: 'Home', path: '/Login' },
    { name: 'Account Settings', path: '/account' },
    { name: 'All Accounts', path: '/all' },
    { name: 'Assign Reviewers', path: '/assign-reviewers' },
    { name: 'Assign Awards', path: '/assign-awards' },
    { name: 'Database', path: '/database' },
  ];

  const [applications, setApplications] = useState<AssignReviewers[]>([
    { 
      id: '1', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: null,
      secondaryReviewer: null,
      status: 'not-started',
      expanded: true
    },
    { 
      id: '2', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: null,
      secondaryReviewer: null,
      status: 'not-started',
      expanded: false
    },
    { 
      id: '3', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: null,
      secondaryReviewer: null,
      status: 'not-started',
      expanded: false
    },
    { 
      id: '4', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'in-progress',
      expanded: true
    },
    { 
      id: '5', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'in-progress',
      expanded: false
    },
    { 
      id: '6', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'in-progress',
      expanded: false
    },
    { 
      id: '7', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'completed',
      expanded: true
    },
    { 
      id: '8', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'completed',
      expanded: false
    },
    { 
      id: '9', 
      title: 'Application Title',
      applicant: 'Applicant Type (Next Gen/Research)',
      primaryReviewer: 'FirstName LastName',
      secondaryReviewer: 'FirstName LastName',
      status: 'completed',
      expanded: false
    },
  ]);

  const toggleExpand = (id: string) => {
    setApplications(applications.map(app => 
      app.id === id ? { ...app, expanded: !app.expanded } : app
    ));
  };

  const confirmReviewers = (id: string) => {
    // Implementation to be added
  };

  const renderApplications = (status: AssignReviewers['status']) => {
    return applications
      .filter(app => app.status === status)
      .map(app => (
        <div key={app.id} className="ar-application-card">
          <div 
            className={`ar-application-header ${app.expanded ? 'expanded' : ''}`} 
            onClick={() => toggleExpand(app.id)}
          >
            <div className="ar-application-icon-title">
              <FaFileAlt className="ar-application-icon" />
              <div className="ar-application-info">
                <h3>{app.title}</h3>
                <p className="ar-applicant-type">{app.applicant}</p>
              </div>
            </div>
            <span className="ar-expand-icon">
              {app.expanded ? <FaArrowUp color="#1e3a8a" /> : <FaArrowDown color="white" />}
            </span>
          </div>
          
          {app.expanded && (
            <div className="ar-application-details">
              <div className="ar-application-divider"></div>
              <div className="ar-reviewer-fields">
                {status === 'not-started' ? (
                  <>
                    <div className="ar-reviewer-field">
                      <label>Primary Reviewer:</label>
                      <div className="ar-reviewer-input-container">
                        <button className="ar-add-reviewer">+</button>
                      </div>
                    </div>
                    <div className="ar-reviewer-field">
                      <label>Secondary Reviewer:</label>
                      <div className="ar-reviewer-input-container">
                        <button className="ar-add-reviewer">+</button>
                      </div>
                    </div>
                  </>
                ) : status === 'in-progress' ? (
                  <>
                    <div className="ar-reviewer-field">
                      <label>Primary Reviewer:</label>
                      <div className="ar-reviewer-assigned">
                        <span className='ar-reviewer'>{app.primaryReviewer}</span>
                        <button className="ar-remove-reviewer">×</button>
                      </div>
                    </div>
                    <div className="ar-reviewer-field">
                      <label>Secondary Reviewer:</label>
                      <div className="ar-reviewer-assigned">
                        <span className='ar-reviewer'>{app.secondaryReviewer}</span>
                        <button className="ar-remove-reviewer">×</button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="ar-reviewer-field">
                      <label>Primary Reviewer:</label>
                      <span className="ar-reviewer-completed">{app.primaryReviewer}</span>
                    </div>
                    <div className="ar-reviewer-field">
                      <label>Secondary Reviewer:</label>
                      <span className="ar-reviewer-completed">{app.secondaryReviewer}</span>
                    </div>
                  </>
                )}
              </div>
              
              {(status === 'not-started' || status === 'in-progress') && (
                <div className="ar-confirm-btn-container">
                  <Button 
                    variant="blue" 
                    width="100%" 
                    height="40px" 
                    borderRadius="8px"
                    onClick={() => confirmReviewers(app.id)}
                  >
                    Confirm Reviewers
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      ));
  };

  return (
    <div className="ar-assign-reviewers-page">
      <Sidebar links={sidebarLinks} />
      
      <div className="ar-assign-reviewers-container">
        <div className="ar-page-header">
          <div className="ar-logo-container">
            <img src={logo} alt="Logo" className="ar-logo" />
            <h1>Assign Reviewers</h1>
          </div>
        </div>
        
        <div className="ar-page-content">
          <div className="ar-applications-section">
            <h2>Not Started Assignments</h2>
            <div className="ar-applications-border-container">
              <div className="ar-applications-container">
                {renderApplications('not-started')}
              </div>
            </div>
          </div>

          <div className="ar-applications-section">
            <h2>In Progress Assignments</h2>
            <div className="ar-applications-border-container">
              <div className="ar-applications-container">
                {renderApplications('in-progress')}
              </div>
            </div>
          </div>

          <div className="ar-applications-section">
            <h2>Completed Assignments</h2>
            <div className="ar-applications-border-container">
              <div className="ar-applications-container">
                {renderApplications('completed')}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignReviewersPage;