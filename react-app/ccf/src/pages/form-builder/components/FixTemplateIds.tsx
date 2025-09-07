import React, { useState } from 'react';
import { fixTemplateIds } from '../../../scripts/fix-template-ids';
import { toast } from 'react-toastify';
import { FaTools, FaCheckCircle } from 'react-icons/fa';

interface FixTemplateIdsProps {
  onFixed?: () => void;
}

const FixTemplateIds: React.FC<FixTemplateIdsProps> = ({ onFixed }) => {
  const [isFixing, setIsFixing] = useState(false);
  const [isFixed, setIsFixed] = useState(false);

  const handleFix = async () => {
    if (isFixing || isFixed) return;

    setIsFixing(true);
    
    try {
      console.log('Starting template ID fix...');
      
      // Show progress toast
      const progressToast = toast.info('Fixing template IDs...', {
        autoClose: false,
        hideProgressBar: false
      });

      // Fix all template IDs
      await fixTemplateIds();
      
      // Update toast to success
      toast.dismiss(progressToast);
      toast.success('✅ All template IDs fixed successfully!', {
        autoClose: 5000
      });

      setIsFixed(true);
      
      // Call callback to refresh the form list
      if (onFixed) {
        setTimeout(() => {
          onFixed();
        }, 1000);
      }

      console.log('✅ Template ID fix completed successfully');
      
    } catch (error) {
      console.error('❌ Error fixing template IDs:', error);
      toast.error('Failed to fix template IDs. Please try again.');
    } finally {
      setIsFixing(false);
    }
  };

  return (
    <div style={{ 
      background: '#fff3cd', 
      border: '1px solid #ffeaa7', 
      borderRadius: '8px', 
      padding: '1rem', 
      margin: '1rem 0' 
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
        <FaTools style={{ color: '#856404' }} />
        <strong style={{ color: '#856404' }}>Template ID Fix Required</strong>
      </div>
      
      <p style={{ margin: '0 0 1rem 0', color: '#856404', fontSize: '0.875rem' }}>
        Some templates have invalid IDs which prevent edit/preview functionality. 
        Click the button below to fix this issue.
      </p>
      
      <button
        onClick={handleFix}
        disabled={isFixing || isFixed}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          background: isFixed ? '#28a745' : '#ffc107',
          color: isFixed ? 'white' : '#212529',
          border: 'none',
          padding: '0.75rem 1rem',
          borderRadius: '6px',
          cursor: isFixing || isFixed ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          opacity: isFixing ? 0.7 : 1
        }}
      >
        {isFixing ? (
          <>
            <div style={{
              width: '16px',
              height: '16px',
              border: '2px solid rgba(0,0,0,0.3)',
              borderTop: '2px solid #212529',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            Fixing Template IDs...
          </>
        ) : isFixed ? (
          <>
            <FaCheckCircle />
            Template IDs Fixed!
          </>
        ) : (
          <>
            <FaTools />
            Fix Template IDs
          </>
        )}
      </button>
      
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FixTemplateIds;
