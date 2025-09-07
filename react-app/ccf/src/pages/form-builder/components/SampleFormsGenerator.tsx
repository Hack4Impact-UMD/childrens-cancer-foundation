import React, { useState } from 'react';
import { runSampleFormsScript } from '../../../scripts/create-sample-forms';
import { toast } from 'react-toastify';
import { FaRocket, FaCheck } from 'react-icons/fa';

interface SampleFormsGeneratorProps {
  onFormsCreated: () => void;
}

const SampleFormsGenerator: React.FC<SampleFormsGeneratorProps> = ({ onFormsCreated }) => {
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(false);

  const handleGenerateForms = async () => {
    if (!window.confirm('This will create 3 sample form templates (Research, NextGen, and Non-Research). Continue?')) {
      return;
    }

    setGenerating(true);
    try {
      await runSampleFormsScript();
      setGenerated(true);
      toast.success('Sample forms created successfully!');
      onFormsCreated();
    } catch (error) {
      console.error('Error generating sample forms:', error);
      toast.error('Failed to generate sample forms. Please check console for details.');
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      padding: '1.5rem',
      background: 'linear-gradient(135deg, #e3f2fd, #f3e5f5)',
      border: '1px solid #bbdefb',
      borderRadius: '8px',
      margin: '1rem 0',
      textAlign: 'center'
    }}>
      <h3 style={{ margin: '0 0 1rem 0', color: '#1565c0' }}>
        Generate Sample Forms
      </h3>
      <p style={{ margin: '0 0 1.5rem 0', color: '#1976d2' }}>
        Create sample form templates based on your existing application forms (Research, NextGen, and Non-Research).
      </p>
      
      <button
        onClick={handleGenerateForms}
        disabled={generating || generated}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '0.5rem',
          background: generated ? '#28a745' : '#007bff',
          color: 'white',
          border: 'none',
          padding: '0.75rem 1.5rem',
          borderRadius: '6px',
          fontSize: '0.875rem',
          fontWeight: '500',
          cursor: generating || generated ? 'not-allowed' : 'pointer',
          margin: '0 auto',
          opacity: generating || generated ? 0.7 : 1,
          transition: 'all 0.2s ease'
        }}
      >
        {generating ? (
          <>
            <div style={{
              width: '14px',
              height: '14px',
              border: '2px solid transparent',
              borderTop: '2px solid currentColor',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }} />
            Generating Forms...
          </>
        ) : generated ? (
          <>
            <FaCheck />
            Forms Generated!
          </>
        ) : (
          <>
            <FaRocket />
            Generate Sample Forms
          </>
        )}
      </button>

      {generated && (
        <p style={{ 
          margin: '1rem 0 0 0', 
          color: '#155724', 
          fontSize: '0.875rem',
          fontWeight: '500'
        }}>
          ✅ Sample forms have been created and are ready for editing!
        </p>
      )}
    </div>
  );
};

export default SampleFormsGenerator;
