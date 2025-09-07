import React, { useState } from 'react';
import { createAllBaseForms } from '../../../scripts/create-base-forms';
import { toast } from 'react-toastify';
import { FaRocket, FaCheckCircle, FaExclamationTriangle } from 'react-icons/fa';
import './BaseFormsGenerator.css';

interface BaseFormsGeneratorProps {
  onFormsCreated?: () => void;
  showAsCard?: boolean;
}

const BaseFormsGenerator: React.FC<BaseFormsGeneratorProps> = ({ 
  onFormsCreated,
  showAsCard = true 
}) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isComplete, setIsComplete] = useState(false);

  const handleGenerateForms = async () => {
    if (isGenerating || isComplete) return;

    setIsGenerating(true);
    
    try {
      console.log('Starting base forms generation...');
      
      // Show progress toast
      const progressToast = toast.info('Creating base application forms...', {
        autoClose: false,
        hideProgressBar: false
      });

      // Create all base forms
      await createAllBaseForms();
      
      // Update toast to success
      toast.dismiss(progressToast);
      toast.success('✅ All base forms created successfully!', {
        autoClose: 5000
      });

      setIsComplete(true);
      
      // Call callback to refresh the form list
      if (onFormsCreated) {
        setTimeout(() => {
          onFormsCreated();
        }, 1000);
      }

      console.log('✅ Base forms generation completed successfully');
      
    } catch (error) {
      console.error('❌ Error generating base forms:', error);
      toast.error('Failed to create base forms. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  if (!showAsCard) {
    return (
      <button
        onClick={handleGenerateForms}
        disabled={isGenerating || isComplete}
        className={`base-forms-btn ${isGenerating ? 'generating' : ''} ${isComplete ? 'complete' : ''}`}
      >
        {isGenerating ? (
          <>
            <div className="spinner"></div>
            Generating Forms...
          </>
        ) : isComplete ? (
          <>
            <FaCheckCircle />
            Forms Created!
          </>
        ) : (
          <>
            <FaRocket />
            Generate Base Forms
          </>
        )}
      </button>
    );
  }

  return (
    <div className="base-forms-generator">
      <div className="generator-card">
        <div className="card-header">
          <div className="header-icon">
            <FaRocket />
          </div>
          <div className="header-content">
            <h3>Create Base Application Forms</h3>
            <p>Generate the 3 essential application forms to get started</p>
          </div>
        </div>

        <div className="card-body">
          <div className="forms-preview">
            <div className="form-item">
              <div className="form-icon research">R</div>
              <div className="form-details">
                <h4>Research Grant</h4>
                <span>5 pages • 20+ fields</span>
                <p>Comprehensive form for research funding applications</p>
              </div>
            </div>

            <div className="form-item">
              <div className="form-icon nextgen">N</div>
              <div className="form-details">
                <h4>NextGen Grant</h4>
                <span>5 pages • 20+ fields</span>
                <p>Innovative research approaches and methodologies</p>
              </div>
            </div>

            <div className="form-item">
              <div className="form-icon non-research">NR</div>
              <div className="form-details">
                <h4>Non-Research Grant</h4>
                <span>4 pages • 15+ fields</span>
                <p>Programs, support services, and awareness initiatives</p>
              </div>
            </div>
          </div>

          {!isComplete && (
            <div className="info-box">
              <FaExclamationTriangle className="info-icon" />
              <div className="info-content">
                <strong>Note:</strong> This will create 3 new form templates based on your existing 
                application forms. These can be customized further using the form editor.
              </div>
            </div>
          )}

          {isComplete && (
            <div className="success-box">
              <FaCheckCircle className="success-icon" />
              <div className="success-content">
                <strong>Success!</strong> All base forms have been created. You can now view, 
                edit, and activate them from the form builder.
              </div>
            </div>
          )}
        </div>

        <div className="card-footer">
          <button
            onClick={handleGenerateForms}
            disabled={isGenerating || isComplete}
            className={`generate-btn ${isGenerating ? 'generating' : ''} ${isComplete ? 'complete' : ''}`}
          >
            {isGenerating ? (
              <>
                <div className="spinner"></div>
                Creating Forms...
              </>
            ) : isComplete ? (
              <>
                <FaCheckCircle />
                Forms Created Successfully!
              </>
            ) : (
              <>
                <FaRocket />
                Generate All Base Forms
              </>
            )}
          </button>

          {isComplete && (
            <div className="completion-stats">
              <div className="stat">
                <strong>3</strong>
                <span>Forms Created</span>
              </div>
              <div className="stat">
                <strong>14</strong>
                <span>Total Pages</span>
              </div>
              <div className="stat">
                <strong>55+</strong>
                <span>Form Fields</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BaseFormsGenerator;
