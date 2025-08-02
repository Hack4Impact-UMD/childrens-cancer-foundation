import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaArrowUp, FaFileAlt, FaSearch, FaTimes, FaEye } from 'react-icons/fa';
import Sidebar from '../../components/sidebar/Sidebar';
import Button from '../../components/buttons/Button';
import logo from "../../assets/ccf-logo.png";
import './AssignReviewers.css';
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { db } from "../.."; // Assuming you have a firebase config file
import { useNavigate } from 'react-router-dom';
import { getSidebarbyRole } from '../../types/sidebar-types';
import {
  assignReviewersToApplication,
  getReviewsForApplication,
  findReviewForReviewerAndApplication
} from '../../services/review-service';
import { GrantApplication, Reviewer } from '../../types/application-types';

// Interface definitions
interface ExtendedGrantApplication extends GrantApplication {
  document_id: string;
  title: string;
  principalInvestigator: string;
  grantType: string;
  institution: string;
  status: 'not-started' | 'in-progress' | 'completed';
  primaryReviewerId?: string;
  secondaryReviewerId?: string;
  primaryReviewStatus?: string;
  secondaryReviewStatus?: string;
  submittedDate?: string;
  expanded: boolean;
}

// Modal component for selecting reviewers
const ReviewerSelectionModal: React.FC<{
  isOpen: boolean;
  onClose: () => void;
  reviewers: Reviewer[];
  onSelectReviewer: (reviewer: Reviewer) => void;
  currentApplication?: ExtendedGrantApplication;
  reviewerType?: 'primary' | 'secondary';
}> = ({ isOpen, onClose, reviewers, onSelectReviewer, currentApplication, reviewerType }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredReviewers, setFilteredReviewers] = useState<Reviewer[]>(reviewers);

  useEffect(() => {
    let availableReviewers = reviewers;

    // Filter out reviewer already assigned to the other role
    if (currentApplication && reviewerType) {
      const otherReviewerId = reviewerType === 'primary'
        ? currentApplication.secondaryReviewerId
        : currentApplication.primaryReviewerId;

      if (otherReviewerId) {
        availableReviewers = reviewers.filter(reviewer => reviewer.document_id !== otherReviewerId);
      }
    }

    if (searchTerm) {
      const filtered = availableReviewers.filter(reviewer =>
        reviewer.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reviewer.affiliation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviewers(filtered);
    } else {
      setFilteredReviewers(availableReviewers);
    }
  }, [searchTerm, reviewers, currentApplication, reviewerType]);

  if (!isOpen) return null;

  return (
    <div className="ar-modal-overlay">
      <div className="ar-modal-content">
        <div className="ar-modal-header">
          <h2>Select Reviewer</h2>
          <button className="ar-modal-close" onClick={onClose} title="Close modal">
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
  const navigate = useNavigate();
  const sidebarLinks = getSidebarbyRole("admin");

  const [applications, setApplications] = useState<ExtendedGrantApplication[]>([]);
  const [reviewers, setReviewers] = useState<Reviewer[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [currentApplicationId, setCurrentApplicationId] = useState<string | null>(null);
  const [reviewerType, setReviewerType] = useState<'primary' | 'secondary' | null>(null);

  // Fetch applications and reviewers from Firebase
  useEffect(() => {
    const fetchApplications = async () => {
      try {
        setLoading(true);

        // Fetch applications
        const applicationsSnapshot = await getDocs(collection(db, 'applications'));
        const applicationsData: ExtendedGrantApplication[] = [];

        for (const doc of applicationsSnapshot.docs) {
          const data = doc.data();

          // Get review information from the reviews collection
          let primaryReviewerId: string | undefined;
          let secondaryReviewerId: string | undefined;
          let primaryReviewStatus = 'not-started';
          let secondaryReviewStatus = 'not-started';
          let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';

          try {
            const reviewSummary = await getReviewsForApplication(doc.id);

            if (reviewSummary.primaryReview) {
              primaryReviewerId = reviewSummary.primaryReview.reviewerId;
              primaryReviewStatus = reviewSummary.primaryReview.status;
            }

            if (reviewSummary.secondaryReview) {
              secondaryReviewerId = reviewSummary.secondaryReview.reviewerId;
              secondaryReviewStatus = reviewSummary.secondaryReview.status;
            }

            // Determine application status based on reviews
            if (primaryReviewStatus === 'completed' && secondaryReviewStatus === 'completed') {
              status = 'completed';
            } else if (primaryReviewerId || secondaryReviewerId) {
              status = 'in-progress';
            }
          } catch (error) {
            // No reviews exist yet, keep default values
            console.log(`No reviews found for application ${doc.id}`);
          }

          applicationsData.push({
            document_id: doc.id,
            title: data.title || 'Untitled Application',
            grantType: data.grantType || 'Unknown Type',
            principalInvestigator: data.principalInvestigator || 'Unknown',
            institution: data.institution || 'Unknown Institution',
            primaryReviewerId,
            secondaryReviewerId,
            primaryReviewStatus,
            secondaryReviewStatus,
            status,
            submittedDate: data.submittedDate || '',
            expanded: false
          });
        }

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
        }, [] as ExtendedGrantApplication[]);

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
            name: data.name || `${data.firstName} ${data.lastName}`,
            role: data.role || 'reviewer',
            title: data.title || '',
            assignedApplications: data.assignedApplications || []
          });
        });

        setReviewers(reviewersData);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching applications:', error);
        setError('Failed to load applications. Please try again.');
        setLoading(false);
      }
    };

    fetchApplications();
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
      const application = applications.find(app => app.document_id === currentApplicationId);
      if (!application) return;

      // Check if this reviewer is already assigned to the other role
      const otherReviewerId = reviewerType === 'primary' ? application.secondaryReviewerId : application.primaryReviewerId;
      if (otherReviewerId === reviewer.document_id) {
        setError('This reviewer is already assigned to the other role for this application. Please select a different reviewer.');
        return;
      }

      // Update local state only - don't create reviews yet
      setApplications(prevApps => {
        const updatedApps = prevApps.map(app => {
          if (app.document_id === currentApplicationId) {
            const updatedApp = { ...app };
            if (reviewerType === 'primary') {
              updatedApp.primaryReviewerId = reviewer.document_id;
              updatedApp.primaryReviewStatus = 'not-started';
            } else {
              updatedApp.secondaryReviewerId = reviewer.document_id;
              updatedApp.secondaryReviewStatus = 'not-started';
            }
            // Keep status as 'not-started' until both are assigned and confirmed
            return updatedApp;
          }
          return app;
        });

        return updatedApps;
      });

      // Close modal
      setModalOpen(false);
      setCurrentApplicationId(null);
      setReviewerType(null);

    } catch (err) {
      console.error('Error selecting reviewer:', err);
      setError('Failed to select reviewer. Please try again.');
    }
  };

  const confirmReviewers = async (applicationId: string) => {
    try {
      const application = applications.find(app => app.document_id === applicationId);
      if (!application) return;

      if (!application.primaryReviewerId || !application.secondaryReviewerId) {
        setError('Both primary and secondary reviewers must be assigned before confirming.');
        return;
      }

      // Check if same reviewer is assigned to both roles (additional safety check)
      if (application.primaryReviewerId === application.secondaryReviewerId) {
        setError('The same reviewer cannot be assigned to both primary and secondary roles.');
        return;
      }

      setLoading(true);

      // Now actually create the reviews in Firebase
      await assignReviewersToApplication(
        applicationId,
        application.primaryReviewerId,
        application.secondaryReviewerId
      );

      // Update reviewer assignments in their documents
      const reviewerUpdates = [
        { id: application.primaryReviewerId, applicationId },
        { id: application.secondaryReviewerId, applicationId }
      ];

      for (const reviewerUpdate of reviewerUpdates) {
        const reviewerRef = doc(db, 'reviewers', reviewerUpdate.id);
        const reviewerDoc = await getDoc(reviewerRef);
        const reviewerData = reviewerDoc.data();

        if (reviewerData && !reviewerData.assignedApplications) {
          await updateDoc(reviewerRef, {
            assignedApplications: [reviewerUpdate.applicationId]
          });
        } else {
          await updateDoc(reviewerRef, {
            assignedApplications: arrayUnion(reviewerUpdate.applicationId)
          });
        }
      }

      // Update local state to show confirmed status
      setApplications(prevApps =>
        prevApps.map(app =>
          app.document_id === applicationId
            ? {
              ...app,
              status: 'in-progress', // Now move to in-progress since both are assigned and confirmed
              primaryReviewStatus: 'not-started',
              secondaryReviewStatus: 'not-started'
            }
            : app
        )
      );

      setLoading(false);

    } catch (err) {
      console.error('Error confirming reviewers:', err);
      setError('Failed to assign reviewers. Please try again.');
      setLoading(false);
    }
  };

  const removeReviewer = async (applicationId: string, type: 'primary' | 'secondary') => {
    try {
      const application = applications.find(app => app.document_id === applicationId);
      if (!application) return;

      const reviewerId = type === 'primary' ? application.primaryReviewerId : application.secondaryReviewerId;
      if (!reviewerId) return;

      // If application is in-progress, it means reviews have been created and confirmed
      if (application.status === 'in-progress') {
        // Check if review has been started - if so, warn user
        const review = await findReviewForReviewerAndApplication(applicationId, reviewerId);
        if (review && review.status !== 'not-started') {
          if (!window.confirm('This reviewer has already started their review. Removing them will delete their progress. Are you sure?')) {
            return;
          }
        }

        // TODO: Implement review deletion from reviews/{applicationId}/reviewers/{reviewId}
        // For now, we'll just warn the user that this functionality is limited
        return;
      }

      // For not-started applications, just remove from local state (no reviews created yet)
      setApplications(applications.map(app => {
        if (app.document_id === applicationId) {
          const updatedApp = { ...app };
          if (type === 'primary') {
            updatedApp.primaryReviewerId = undefined;
            updatedApp.primaryReviewStatus = undefined;
          } else {
            updatedApp.secondaryReviewerId = undefined;
            updatedApp.secondaryReviewStatus = undefined;
          }

          // Keep status as not-started if no reviewers assigned
          if (!updatedApp.primaryReviewerId && !updatedApp.secondaryReviewerId) {
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

  const viewReview = (applicationId: string) => {
    // Navigate to a review summary page with the application ID
    navigate(`/reviewer/review-application?id=${applicationId}`);
  };

  // Function to get reviewer name from ID
  const getReviewerName = (reviewerId?: string) => {
    if (!reviewerId) return '';

    const reviewer = reviewers.find(r => r.document_id === reviewerId);
    return reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Unknown Reviewer';
  };

  // Function to check if at least one review is completed
  const hasCompletedReview = (app: ExtendedGrantApplication) => {
    return app.primaryReviewStatus === 'completed' || app.secondaryReviewStatus === 'completed';
  };

  // Function to render the review status badge
  const renderReviewStatusBadge = (status?: string) => {
    if (!status || status === 'not-started') {
      return <span className="ar-status-badge not-started">Not Started</span>;
    } else if (status === 'in-progress') {
      return <span className="ar-status-badge in-progress">In Progress</span>;
    } else if (status === 'completed') {
      return <span className="ar-status-badge completed">Completed</span>;
    }
    return null;
  };

  const renderApplications = (status: ExtendedGrantApplication['status']) => {
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
              <div className="ar-reviewer-field">
                <label>Primary Reviewer:</label>
                {app.primaryReviewerId ? (
                  <div className="ar-reviewer-assigned">
                    <span className='ar-reviewer'>{getReviewerName(app.primaryReviewerId)}</span>
                    {renderReviewStatusBadge(app.primaryReviewStatus)}
                    {(app.status === 'not-started' || app.status === 'in-progress') && (
                      <button
                        className="ar-remove-reviewer"
                        onClick={() => removeReviewer(app.document_id, 'primary')}
                      >
                        ×
                      </button>
                    )}
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
                {app.secondaryReviewerId ? (
                  <div className="ar-reviewer-assigned">
                    <span className='ar-reviewer'>{getReviewerName(app.secondaryReviewerId)}</span>
                    {renderReviewStatusBadge(app.secondaryReviewStatus)}
                    {(app.status === 'not-started' || app.status === 'in-progress') && (
                      <button
                        className="ar-remove-reviewer"
                        onClick={() => removeReviewer(app.document_id, 'secondary')}
                      >
                        ×
                      </button>
                    )}
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
            </div>

            <div className="ar-action-buttons">
              {/* View Reviews button - show if at least one review is completed */}
              {hasCompletedReview(app) && (
                <button
                  className="ar-view-reviews-btn"
                  onClick={() => viewReview(app.document_id)}
                >
                  <FaEye className="ar-eye-icon" /> View Reviews
                </button>
              )}

              {/* Assign/Confirm Reviewers button */}
              {(status === 'not-started') && (
                <Button
                  variant="blue"
                  width="100%"
                  height="40px"
                  borderRadius="8px"
                  onClick={() => confirmReviewers(app.document_id)}
                  disabled={!app.primaryReviewerId || !app.secondaryReviewerId || loading}
                >
                  {loading ? 'Assigning...' : 'Assign Reviewers'}
                </Button>
              )}

              {/* Show assigned status for in-progress */}
              {status === 'in-progress' && (
                <div className="ar-assigned-status">
                  Reviewers Assigned
                </div>
              )}
            </div>
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
        currentApplication={applications.find(app => app.document_id === currentApplicationId)}
        reviewerType={reviewerType || undefined}
      />
    </div>
  );
};

export default AssignReviewersPage;