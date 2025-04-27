import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaArrowUp, FaFileAlt, FaSearch, FaTimes } from 'react-icons/fa';
import Sidebar from '../../components/sidebar/Sidebar';
import Button from '../../components/buttons/Button';
import logo from "../../assets/ccf-logo.png";
import './AssignReviewers.css';
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from "../.."; // Assuming you have a firebase config file

// Interface definitions
interface Reviewer {
  document_id: string;
  affiliation: string;
  email: string;
  firstName: string;
  lastName: string;
  name?: string;
  role: string;
  title?: string;
}

interface GrantApplication {
  document_id: string;
  title: string;
  grantType: string;
  principalInvestigator: string;
  primaryReviewer?: string;
  secondaryReviewer?: string;
  status: 'not-started' | 'in-progress' | 'completed';
  expanded: boolean;
}

// Modal component for selecting reviewers
const ReviewerSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reviewers: Reviewer[];
  onSelectReviewer: (reviewer: Reviewer) => void;
}> = ({ isOpen, onClose, reviewers, onSelectReviewer }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>(reviewers);

  useEffect(() => {
    if (searchTerm) {
      const filtered = reviewers.filter(reviewer =>
          reviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          reviewer.affiliation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviewers(filtered);
    } else {
      setFilteredReviewers(reviewers);
    }
  }, [searchTerm, reviewers]);

  if (!isOpen) return null;

  return (
      <div className="ar-modal-overlay">
        <div className="ar-modal-content">
          <div className="ar-modal-header">
            <h2>Select Reviewer</h2>
            <button className="ar-modal-close" onClick={onClose}>
              <FaTimes />
            </button>
          </div>
          <div className="ar-modal-search">
            <div className="ar-search-input-container">
              <FaSearch className="ar-search-icon" />
              <input
                  type="text"
                  placeholder="Search by name, email, or affiliation..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="ar-search-input"
              />
            </div>
          </div>
          <div className="ar-reviewers-list">
            {filteredReviewers.length > 0 ? (
                filteredReviewers.map((reviewer) => (
                    <div
                        key={reviewer.document_id}
                        className="ar-reviewer-item"
                        onClick={() => onSelectReviewer(reviewer)}
                    >
                      <div className="ar-reviewer-name">
                        {`${reviewer.firstName} ${reviewer.lastName}`}
                        {reviewer.title && <span className="ar-reviewer-title">, {reviewer.title}</span>}
                      </div>
                      <div className="ar-reviewer-details">
                        <div className="ar-reviewer-email">{reviewer.email}</div>
                        <div className="ar-reviewer-affiliation">{reviewer.affiliation}</div>
                      </div>
                    </div>
                ))
            ) : (
                <div className="ar-no-reviewers">No reviewers found</div>
            )}
          </div>
        </div>
      </div>
  );
};

const AssignReviewersPage: React.FC = () => {
  const sidebarLinks = [
    { name: 'Home', path: '/Login' },
    { name: 'Account Settings', path: '/account' },
    { name: 'All Accounts', path: '/all' },
    { name: 'Assign Reviewers', path: '/assign-reviewers' },
    { name: 'Assign Awards', path: '/assign-awards' },
    { name: 'Database', path: '/database' },
  ];

  const [applications, setApplications] = useState<GrantApplication[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [reviewerType, setReviewerType] = useState<'primary' | 'secondary' | null>(null);

  // Fetch applications and reviewers from Firebase
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch applications
        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const applicationsData: GrantApplication[] = [];

        applicationsSnapshot.forEach((doc) => {
          const data = doc.data();

          // Determine application status based on reviewers
          let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';
          if (data.primaryReviewer && data.secondaryReviewer) {
            status = data.decision ? 'completed' : 'in-progress';
          } else if (data.primaryReviewer || data.secondaryReviewer) {
            status = 'in-progress';
          }

          applicationsData.push({
            document_id: doc.id,
            title: data.title || 'Untitled Application',
            grantType: data.grantType || 'Unknown Type',
            principalInvestigator: data.principalInvestigator || 'Unknown',
            primaryReviewer: data.primaryReviewer || undefined,
            secondaryReviewer: data.secondaryReviewer || undefined,
            status,
            expanded: false
          });
        });

        // Sort and group applications by status
        const sortedApplications = [
          ...applicationsData.filter(app => app.status === 'not-started'),
          ...applicationsData.filter(app => app.status === 'in-progress'),
          ...applicationsData.filter(app => app.status === 'completed')
        ];

        // Expand the first application in each category
        const groupedApplications = sortedApplications.reduce((acc, app, index, array) => {
          const prevStatus = index > 0 ? array[index - 1].status : null;
          if (index === 0 || app.status !== prevStatus) {
            app.expanded = true;
          }
          acc.push(app);
          return acc;
        }, [] as GrantApplication[]);

        setApplications(groupedApplications);

        // Fetch reviewers
        const reviewersSnapshot = await getDocs(collection(db, 'reviewers'));
        const reviewersData: Reviewer[] = [];

        reviewersSnapshot.forEach((doc) => {
          const data = doc.data();
          reviewersData.push({
            document_id: doc.id,
            affiliation: data.affiliation || '',
            email: data.email || '',
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            name: data.name || '',
            role: data.role || 'reviewer',
            title: data.title || ''
          });
        });

        setReviewers(reviewersData);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please refresh the page.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const toggleExpand = (id: string) => {
    setApplications(applications.map(app =>
        app.document_id === id ? { ...app, expanded: !app.expanded } : app
    ));
  };

  const openReviewerModal = (applicationId: string, type: 'primary' | 'secondary') => {
    setCurrentApplicationId(applicationId);
    setReviewerType(type);
    setModalOpen(true);
  };

  const handleSelectReviewer = async (reviewer: Reviewer) => {
    if (!currentApplicationId || !reviewerType) return;

    try {
      // Get current application
      const application = applications.find(app => app.document_id === currentApplicationId);
      if (!application) return;

      // Update application in Firestore
      const applicationRef = doc(db, 'applications', currentApplicationId);

      const updateData: { [key: string]: string } = {};
      updateData[`${reviewerType}Reviewer`] = reviewer.document_id;

      await updateDoc(applicationRef, updateData);

      // Update reviewer in Firestore - add application to their assignments
      const reviewerRef = doc(db, 'reviewers', reviewer.document_id);

      // First check if the reviewer has an "assignedApplications" field
      const reviewerDoc = await getDoc(reviewerRef);
      const reviewerData = reviewerDoc.data();

      if (reviewerData && !reviewerData.assignedApplications) {
        // If the field doesn't exist, create it with the new assignment
        await updateDoc(reviewerRef, {
          assignedApplications: [currentApplicationId]
        });
      } else {
        // If the field exists, use arrayUnion to add the new assignment
        await updateDoc(reviewerRef, {
          assignedApplications: arrayUnion(currentApplicationId)
        });
      }

      // Update UI
      setApplications(applications.map(app => {
        if (app.document_id === currentApplicationId) {
          const updatedApp = { ...app };
          if (reviewerType === 'primary') {
            updatedApp.primaryReviewer = reviewer.document_id;
          } else {
            updatedApp.secondaryReviewer = reviewer.document_id;
          }

          // Update status if needed
          if (updatedApp.status === 'not-started') {
            updatedApp.status = 'in-progress';
          }

          return updatedApp;
        }
        return app;
      }));

      // Close modal
      setModalOpen(false);
      setCurrentApplicationId(null);
      setReviewerType(null);

    } catch (err) {
      console.error('Error assigning reviewer:', err);
      setError('Failed to assign reviewer. Please try again.');
    }
  };

  const removeReviewer = async (applicationId: string, type: 'primary' | 'secondary') => {
    try {
      // Get current application
      const application = applications.find(app => app.document_id === applicationId);
      if (!application) return;

      const reviewerId = type === 'primary' ? application.primaryReviewer : application.secondaryReviewer;
      if (!reviewerId) return;

      // Update application in Firestore
      const applicationRef = doc(db, 'grantApplications', applicationId);

      const updateData: { [key: string]: null } = {};
      updateData[`${type}Reviewer`] = null;

      await updateDoc(applicationRef, updateData);

      // Update reviewer in Firestore - remove application from their assignments
      // Note: This is more complex as we need to read the array, filter it, and write it back
      const reviewerRef = doc(db, 'reviewers', reviewerId);
      const reviewerDoc = await getDoc(reviewerRef);

      if (reviewerDoc.exists()) {
        const reviewerData = reviewerDoc.data();
        if (reviewerData.assignedApplications && Array.isArray(reviewerData.assignedApplications)) {
          const updatedAssignments = reviewerData.assignedApplications.filter(
              (id: string) => id !== applicationId
          );

          await updateDoc(reviewerRef, {
            assignedApplications: updatedAssignments
          });
        }
      }

      // Update UI
      setApplications(applications.map(app => {
        if (app.document_id === applicationId) {
          const updatedApp = { ...app };
          if (type === 'primary') {
            updatedApp.primaryReviewer = undefined;
          } else {
            updatedApp.secondaryReviewer = undefined;
          }

          // Update status if needed
          if (!updatedApp.primaryReviewer && !updatedApp.secondaryReviewer) {
            updatedApp.status = 'not-started';
          }

          return updatedApp;
        }
        return app;
      }));

    } catch (err) {
      console.error('Error removing reviewer:', err);
      setError('Failed to remove reviewer. Please try again.');
    }
  };

  const confirmReviewers = async (applicationId: string) => {
    try {
      const application = applications.find(app => app.document_id === applicationId);
      if (!application) return;

      if (!application.primaryReviewer || !application.secondaryReviewer) {
        setError('Both primary and secondary reviewers must be assigned before confirming.');
        return;
      }

      // In a real application, you might want to update some fields to indicate confirmation
      // For now, we'll just update the UI to show a confirmation message
      alert('Reviewers confirmed successfully!');

    } catch (err) {
      console.error('Error confirming reviewers:', err);
      setError('Failed to confirm reviewers. Please try again.');
    }
  };

  // Function to get reviewer name from ID
  const getReviewerName = (reviewerId?: string) => {
    if (!reviewerId) return '';

    const reviewer = reviewers.find(r => r.document_id === reviewerId);
    return reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown Reviewer';
  };

  const renderApplications = (status: GrantApplication['status']) => {
    const filteredApps = applications.filter(app => app.status === status);

    if (loading) {
      return <div className="ar-loading">Loading applications...</div>;
    }

    if (filteredApps.length === 0) {
      return <div className="ar-no-applications">No applications found</div>;
    }

    return filteredApps.map(app => (
        <div key={app.document_id} className="ar-application-card">
          <div
              className={`ar-application-header ${app.expanded ? 'expanded' : ''}`}
              onClick={() => toggleExpand(app.document_id)}
          >
            <div className="ar-application-icon-title">
              <FaFileAlt className="ar-application-icon" />
              <div className="ar-application-info">
                <h3>{app.title}</h3>
                <p className="ar-applicant-type">{app.grantType} - {app.principalInvestigator}</p>
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
                            <button
                                className="ar-add-reviewer"
                                onClick={() => openReviewerModal(app.document_id, 'primary')}
                            >
                              +
                            </button>
                          </div>
                        </div>
                        <div className="ar-reviewer-field">
                          <label>Secondary Reviewer:</label>
                          <div className="ar-reviewer-input-container">
                            <button
                                className="ar-add-reviewer"
                                onClick={() => openReviewerModal(app.document_id, 'secondary')}
                            >
                              +
                            </button>
                          </div>
                        </div>
                      </>
                  ) : status === 'in-progress' ? (
                      <>
                        <div className="ar-reviewer-field">
                          <label>Primary Reviewer:</label>
                          {app.primaryReviewer ? (
                              <div className="ar-reviewer-assigned">
                                <span className='ar-reviewer'>{getReviewerName(app.primaryReviewer)}</span>
                                <button
                                    className="ar-remove-reviewer"
                                    onClick={() => removeReviewer(app.document_id, 'primary')}
                                >
                                  ×
                                </button>
                              </div>
                          ) : (
                              <div className="ar-reviewer-input-container">
                                <button
                                    className="ar-add-reviewer"
                                    onClick={() => openReviewerModal(app.document_id, 'primary')}
                                >
                                  +
                                </button>
                              </div>
                          )}
                        </div>
                        <div className="ar-reviewer-field">
                          <label>Secondary Reviewer:</label>
                          {app.secondaryReviewer ? (
                              <div className="ar-reviewer-assigned">
                                <span className='ar-reviewer'>{getReviewerName(app.secondaryReviewer)}</span>
                                <button
                                    className="ar-remove-reviewer"
                                    onClick={() => removeReviewer(app.document_id, 'secondary')}
                                >
                                  ×
                                </button>
                              </div>
                          ) : (
                              <div className="ar-reviewer-input-container">
                                <button
                                    className="ar-add-reviewer"
                                    onClick={() => openReviewerModal(app.document_id, 'secondary')}
                                >
                                  +
                                </button>
                              </div>
                          )}
                        </div>
                      </>
                  ) : (
                      <>
                        <div className="ar-reviewer-field">
                          <label>Primary Reviewer:</label>
                          <span className="ar-reviewer-completed">{getReviewerName(app.primaryReviewer)}</span>
                        </div>
                        <div className="ar-reviewer-field">
                          <label>Secondary Reviewer:</label>
                          <span className="ar-reviewer-completed">{getReviewerName(app.secondaryReviewer)}</span>
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
                          onClick={() => confirmReviewers(app.document_id)}
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

          {error && (
              <div className="ar-error-message">
                <p>{error}</p>
                <button onClick={() => setError(null)}>×</button>
              </div>
          )}

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

        <ReviewerSelectionModal
            isOpen={modalOpen}
            onClose={() => {
              setModalOpen(false);
              setCurrentApplicationId(null);
              setReviewerType(null);
            }}
            reviewers={reviewers}
            onSelectReviewer={handleSelectReviewer}
        />
      </div>
  );
};

export default AssignReviewersPage;