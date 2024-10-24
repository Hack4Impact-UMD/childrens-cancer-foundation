import { useState } from 'react';
import './ApplicationForm.css';
import Breadcrumb from './Components/Breadcrumbs';
import { useNavigate } from 'react-router-dom';
import Information from './subquestions/Information';
import ApplicationQuestions from './subquestions/ApplicationQuestions';

function ApplicationForm(): JSX.Element {
    const [currentPage, setCurrentPage] = useState(1);
    const pages = ["My Information", "Application Questions", "Grant Proposal", "Review"];
    const totalPages = 5;

    const navigate = useNavigate();

    const goBack = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        } else {
            navigate('/applicant-dashboard');
        }
    };

    const handleContinue = () => {
        if (currentPage < totalPages) setCurrentPage(currentPage + 1);
    };

    const handleSubmit = () => {
        console.log('Form submitted!');
    };

      const renderPage = () => {
        switch (currentPage) {
          case 1:
            return <Information />
          case 2:
            return <ApplicationQuestions />
          default:
            return
        }
      };
    
      return (
        <div className="main-container">
            <h1 className="main-header">
                Research/NextGen Grant
            </h1>
          <Breadcrumb currentPage={currentPage} pages={pages} />

        <h1 className="form-header">
            {pages[currentPage - 1]}
        </h1>
          {renderPage()}
    
          <div className="btn-container">
            <button onClick={goBack} className="back-btn">Go Back</button>
    
            {currentPage < totalPages ? (
              <button onClick={handleContinue} className="save-btn">Save and Continue</button>
            ) : (
              <button onClick={handleSubmit} className="save-btn">Save and Submit</button>
            )}
          </div>
        </div>
      );
    };

export default ApplicationForm;