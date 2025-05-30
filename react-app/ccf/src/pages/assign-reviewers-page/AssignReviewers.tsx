import React, { useState, useEffect } from 'react';
import { FaArrowDown, FaArrowUp, FaFileAlt, FaSearch, FaTimes, FaEye } from 'react-icons/fa';
import Sidebar from '../../components/sidebar/Sidebar';
import Button from '../../components/buttons/Button';
import logo from "../../assets/ccf-logo.png";
import './AssignReviewers.css';
import { collection, getDocs, doc, updateDoc, getDoc, arrayUnion } from 'firebase/firestore';
import { db } from "../.."; // Assuming you have a firebase config file
import { useNavigate } from 'react-router-dom';
import { getSidebarbyRole } from '../../types/sidebar-types';

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
  primaryReviewStatus?: 'not-started' | 'in-progress' | 'completed';
  secondaryReviewStatus?: 'not-started' | 'in-progress' | 'completed';
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
        reviewer.affiliation.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredReviewers(filtered);
    } else {
      setFilteredReviewers(reviewers);
    }
  }, [searchTerm, reviewers]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Select Reviewer</h3>
          <button className="close-button" onClick={onClose} title="Close modal">
            <FaTimes />
          </button>
        </div>
        <div className="search-container">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search reviewers..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <div className="reviewers-list">
          {filteredReviewers.map((reviewer) => (
            <div
              key={reviewer.document_id}
              className="reviewer-item"
              onClick={() => onSelectReviewer(reviewer)}
            >
              <div className="reviewer-info">
                <strong>{reviewer.firstName} {reviewer.lastName}</strong>
                <p>{reviewer.affiliation}</p>
                <small>{reviewer.email}</small>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const AssignReviewersPage: React.FC = () => {
  const navigate = useNavigate();
  const sidebarLinks = getSidebarbyRole("admin");

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

          // Determine application status based on reviewers and their review status
          let status: 'not-started' | 'in-progress' | 'completed' = 'not-started';

          if (data.primaryReviewer && data.secondaryReviewer) {
            const primaryStatus = data.primaryReviewStatus || 'not-started';
            const secondaryStatus = data.secondaryReviewStatus || 'not-started';

            if (primaryStatus === 'completed' && secondaryStatus === 'completed') {
              status = 'completed';
            } else if (primaryStatus !== 'not-started' || secondaryStatus !== 'not-started') {
              status = 'in-progress';
            }
          } else if (data.primaryReviewer || data.secondaryReviewer) {
            status = 'in-progress';
          }

          applicationsData.push({
            document_id: doc.id,
            title: data.title || 'Untitled Application',
            grantType: data.grantType || 'Unknown',
            principalInvestigator: data.principalInvestigator || 'Unknown',
            primaryReviewer: data.primaryReviewer || '',
            secondaryReviewer: data.secondaryReviewer || '',
            primaryReviewStatus: data.primaryReviewStatus || 'not-started',
            secondaryReviewStatus: data.secondaryReviewStatus || 'not-started',
            status,
            expanded: false,
          });
        });

        setApplications(applicationsData);

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
            name: `${data.firstName || ''} ${data.lastName || ''}`.trim(),
            role: data.role || 'reviewer',
            title: data.title || '',
          });
        });

        setReviewers(reviewersData);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching data:', err);
        setError('Failed to load data. Please try again.');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Toggle expanded state for applications
  const toggleExpanded = (applicationId: string) => {
    setApplications(prev =>
      prev.map(app =>
        app.document_id === applicationId
          ? { ...app, expanded: !app.expanded }
          : app
      )
    );
  };

  // Function to get reviewer name by ID
  const getReviewerName = (reviewerId: string): string => {
    const reviewer = reviewers.find(r => r.document_id === reviewerId);
    return reviewer ? `${reviewer.firstName} ${reviewer.lastName}` : 'Not Assigned';
  };

  // Function to handle reviewer assignment
  const handleAssignReviewer = (applicationId: string, type: 'primary' | 'secondary') => {
    setCurrentApplicationId(applicationId);
    setReviewerType(type);
    setModalOpen(true);
  };

  // Function to handle reviewer selection
  const handleSelectReviewer = async (reviewer: Reviewer) => {
    if (!currentApplicationId || !reviewerType) return;

    try {
      const applicationRef = doc(db, 'applications', currentApplicationId);
      const updateData: any = {};

      if (reviewerType === 'primary') {
        updateData.primaryReviewer = reviewer.document_id;
        updateData.primaryReviewStatus = 'not-started';
      } else {
        updateData.secondaryReviewer = reviewer.document_id;
        updateData.secondaryReviewStatus = 'not-started';
      }

      await updateDoc(applicationRef, updateData);

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.document_id === currentApplicationId
            ? {
              ...app,
              [reviewerType === 'primary' ? 'primaryReviewer' : 'secondaryReviewer']: reviewer.document_id,
              [reviewerType === 'primary' ? 'primaryReviewStatus' : 'secondaryReviewStatus']: 'not-started'
            }
            : app
        )
      );

      // Close modal
      setModalOpen(false);
      setCurrentApplicationId(null);
      setReviewerType(null);

    } catch (err) {
      console.error('Error assigning reviewer:', err);
      alert('Failed to assign reviewer. Please try again.');
    }
  };

  // Function to handle removing reviewer
  const handleRemoveReviewer = async (applicationId: string, type: 'primary' | 'secondary') => {
    try {
      const applicationRef = doc(db, 'applications', applicationId);
      const updateData: any = {};

      if (type === 'primary') {
        updateData.primaryReviewer = '';
        updateData.primaryReviewStatus = 'not-started';
      } else {
        updateData.secondaryReviewer = '';
        updateData.secondaryReviewStatus = 'not-started';
      }

      await updateDoc(applicationRef, updateData);

      // Update local state
      setApplications(prev =>
        prev.map(app =>
          app.document_id === applicationId
            ? {
              ...app,
              [type === 'primary' ? 'primaryReviewer' : 'secondaryReviewer']: '',
              [type === 'primary' ? 'primaryReviewStatus' : 'secondaryReviewStatus']: 'not-started'
            }
            : app
        )
      );

    } catch (err) {
      console.error('Error removing reviewer:', err);
      alert('Failed to remove reviewer. Please try again.');
    }
  };

  // Function to view application details
  const handleViewApplication = (applicationId: string) => {
    // Navigate to application details page
    navigate(`/admin/application/${applicationId}`);
  };

  if (loading) {
    return (
      <div className="assign-reviewers-container">
        <Sidebar links={sidebarLinks} />
        <div className="assign-reviewers-content">
          <div className="assign-reviewers-header">
            <img src={logo} alt="Logo" className="assign-reviewers-logo" />
            <h1>Assign Reviewers</h1>
          </div>
          <div className="loading-container">
            <p>Loading applications and reviewers...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="assign-reviewers-container">
        <Sidebar links={sidebarLinks} />
        <div className="assign-reviewers-content">
          <div className="assign-reviewers-header">
            <img src={logo} alt="Logo" className="assign-reviewers-logo" />
            <h1>Assign Reviewers</h1>
          </div>
          <div className="error-container">
            <p>{error}</p>
            <Button
              variant="blue"
              onClick={() => window.location.reload()}
            >
              Retry
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="assign-reviewers-container">
      <Sidebar links={sidebarLinks} />
      <div className="assign-reviewers-content">
        <div className="assign-reviewers-header">
          <img src={logo} alt="Logo" className="assign-reviewers-logo" />
          <h1>Assign Reviewers</h1>
        </div>

        <div className="applications-list">
          {applications.length === 0 ? (
            <div className="no-applications">
              <p>No applications found.</p>
            </div>
          ) : (
            applications.map((application) => (
              <div key={application.document_id} className="application-card">
                <div className="application-header" onClick={() => toggleExpanded(application.document_id)}>
                  <div className="application-info">
                    <div className="application-title-info">
                      <FaFileAlt className="application-icon" />
                      <div>
                        <h3>{application.title}</h3>
                        <p>PI: {application.principalInvestigator} | Type: {application.grantType}</p>
                      </div>
                    </div>
                    <div className="application-status">
                      <span className={`status-badge ${application.status}`}>
                        {application.status.charAt(0).toUpperCase() + application.status.slice(1).replace('-', ' ')}
                      </span>
                    </div>
                  </div>
                  <div className="expand-icon">
                    {application.expanded ? <FaArrowUp /> : <FaArrowDown />}
                  </div>
                </div>

                {application.expanded && (
                  <div className="application-details">
                    <div className="reviewers-section">
                      <div className="reviewer-assignment">
                        <h4>Primary Reviewer</h4>
                        <div className="reviewer-info">
                          {application.primaryReviewer ? (
                            <div className="assigned-reviewer">
                              <span>{getReviewerName(application.primaryReviewer)}</span>
                              <span className={`review-status ${application.primaryReviewStatus}`}>
                                {application.primaryReviewStatus?.replace('-', ' ')}
                              </span>
                              <button
                                className="remove-reviewer-btn"
                                onClick={() => handleRemoveReviewer(application.document_id, 'primary')}
                                title="Remove primary reviewer"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="blue"
                              onClick={() => handleAssignReviewer(application.document_id, 'primary')}
                            >
                              Assign Primary Reviewer
                            </Button>
                          )}
                        </div>
                      </div>

                      <div className="reviewer-assignment">
                        <h4>Secondary Reviewer</h4>
                        <div className="reviewer-info">
                          {application.secondaryReviewer ? (
                            <div className="assigned-reviewer">
                              <span>{getReviewerName(application.secondaryReviewer)}</span>
                              <span className={`review-status ${application.secondaryReviewStatus}`}>
                                {application.secondaryReviewStatus?.replace('-', ' ')}
                              </span>
                              <button
                                className="remove-reviewer-btn"
                                onClick={() => handleRemoveReviewer(application.document_id, 'secondary')}
                                title="Remove secondary reviewer"
                              >
                                <FaTimes />
                              </button>
                            </div>
                          ) : (
                            <Button
                              variant="blue"
                              onClick={() => handleAssignReviewer(application.document_id, 'secondary')}
                            >
                              Assign Secondary Reviewer
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="application-actions">
                      <Button
                        variant="blue"
                        onClick={() => handleViewApplication(application.document_id)}
                      >
                        <FaEye /> View Application
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            ))
          )}
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