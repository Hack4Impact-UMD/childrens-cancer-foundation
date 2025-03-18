import React, { useState } from 'react';
import { FaArrowDown, FaArrowUp, FaFileAlt, FaArrowRight } from 'react-icons/fa';
import Sidebar from '../../components/sidebar/Sidebar';
import Button from '../../components/buttons/Button';
import logo from "../../assets/ccf-logo.png";
import './AssignReviewers.css';

interface Application {
  id: string;
  title: string;
  applicant: string;
  primaryReviewer: string | null;
  secondaryReviewer: string | null;
  status: 'not-started' | 'in-progress' | 'completed';
  expanded: boolean;
}

const AssignReviewersPage: React.FC = () => {
  const sidebarLinks = [
    { name: 'Home', path: '/' },
    { name: 'Account Settings', path: '/account' },
    { name: 'All Accounts', path: '/accounts' },
    { name: 'Assign Reviewers', path: '/assign-reviewers' },
    { name: 'Assign Awards', path: '/assign-awards' },
    { name: 'Database', path: '/database' },
    { name: 'Email Blast', path: '/email-blast' },
  ];

  const [applications, setApplications] = useState<Application[]>([
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
    console.log(`Confirming reviewers for application ${id}`);
    
  };

  return (
    <div className="assign-reviewers-page">
      <Sidebar links={sidebarLinks} />
      
      <div className="dashboard-container">
        <div className="page-header">
          <div className="logo-container">
            <img src={logo} alt="Logo" className="logo" />
            <h1>Assign Reviewers</h1>
          </div>
        </div>
        
        <div className="page-content">
          <div className="applications-section">
            <h2>Not Started Assignments</h2>
            <div className="applications-container">
              {applications
                .filter(app => app.status === 'not-started')
                .map(app => (
                  <div key={app.id} className="application-card">
                    <div 
                      className={`application-header ${app.expanded ? 'expanded' : ''}`} 
                      onClick={() => toggleExpand(app.id)}
                    >
                      <div className="application-icon-title">
                        <FaFileAlt className="application-icon" />
                        <div className="application-info">
                          <h3>{app.title}</h3>
                          <p className="applicant-type">{app.applicant}</p>
                        </div>
                      </div>
                      <span className="expand-icon">{app.expanded ? <FaArrowUp /> : <FaArrowDown />}</span>
                    </div>
                    
                    {app.expanded && (
                      <div className="application-details">
                        <div className="reviewer-fields">
                          <div className="reviewer-field">
                            <label>Primary Reviewer:</label>
                            <div className="reviewer-input-container">
                              <input type="text" placeholder="Select reviewer" />
                              <button className="add-reviewer">+</button>
                            </div>
                          </div>
                          <div className="reviewer-field">
                            <label>Secondary Reviewer:</label>
                            <div className="reviewer-input-container">
                              <input type="text" placeholder="Select reviewer" />
                              <button className="add-reviewer">+</button>
                            </div>
                          </div>
                        </div>
                        <div className="confirm-btn-container">
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
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="applications-section">
            <h2>In Progress Assignments</h2>
            <div className="applications-container">
              {applications
                .filter(app => app.status === 'in-progress')
                .map(app => (
                  <div key={app.id} className="application-card">
                    <div 
                      className={`application-header ${app.expanded ? 'expanded' : ''}`} 
                      onClick={() => toggleExpand(app.id)}
                    >
                      <div className="application-icon-title">
                        <FaFileAlt className="application-icon" />
                        <div className="application-info">
                          <h3>{app.title}</h3>
                          <p className="applicant-type">{app.applicant}</p>
                        </div>
                      </div>
                      <span className="expand-icon">{app.expanded ? <FaArrowUp /> : <FaArrowDown />}</span>
                    </div>
                    
                    {app.expanded && (
                      <div className="application-details">
                        <div className="reviewer-fields">
                          <div className="reviewer-field">
                            <label>Primary Reviewer:</label>
                            <div className="reviewer-assigned">
                              <span className='reviewer'>{app.primaryReviewer}</span>
                              <button className="remove-reviewer">×</button>
                            </div>
                          </div>
                          <div className="reviewer-field">
                            <label>Secondary Reviewer:</label>
                            <div className="reviewer-assigned">
                              <span className='reviewer'>{app.secondaryReviewer}</span>
                              <button className="remove-reviewer">×</button>
                            </div>
                          </div>
                        </div>
                        <div className="confirm-btn-container">
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
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>

          <div className="applications-section">
            <h2>Completed Assignments</h2>
            <div className="applications-container">
              {applications
                .filter(app => app.status === 'completed')
                .map(app => (
                  <div key={app.id} className="application-card">
                    <div 
                      className={`application-header ${app.expanded ? 'expanded' : ''}`} 
                      onClick={() => toggleExpand(app.id)}
                    >
                      <div className="application-icon-title">
                        <FaFileAlt className="application-icon" />
                        <div className="application-info">
                          <h3>{app.title}</h3>
                          <p className="applicant-type">{app.applicant}</p>
                        </div>
                      </div>
                      <span className="expand-icon">{app.expanded ? <FaArrowUp /> : <FaArrowDown />}</span>
                    </div>
                    
                    {app.expanded && (
                      <div className="application-details">
                        <div className="reviewer-fields">
                          <div className="reviewer-field">
                            <label>Primary Reviewer:</label>
                            <span className="reviewer-completed">{app.primaryReviewer}</span>
                          </div>
                          <div className="reviewer-field">
                            <label>Secondary Reviewer:</label>
                            <span className="reviewer-completed">{app.secondaryReviewer}</span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AssignReviewersPage;
