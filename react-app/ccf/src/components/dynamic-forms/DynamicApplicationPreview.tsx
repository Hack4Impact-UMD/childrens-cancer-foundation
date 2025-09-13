import React, { useState, useEffect } from 'react';
import { dynamicFieldsEngine, FieldInfo } from '../../services/dynamic-fields-engine';
import { Application } from '../../types/application-types';
import { DynamicApplication } from '../../types/form-template-types';
import './DynamicApplicationPreview.css';

interface DynamicApplicationPreviewProps {
    application: Application;
    showAllFields?: boolean;
    maxFields?: number;
    className?: string;
    onShowAllFields?: () => void;
}

interface FieldDisplayData {
    fieldId: string;
    fieldInfo: FieldInfo;
    value: any;
    displayValue: string;
    isFile: boolean;
    isLongText: boolean;
}

const DynamicApplicationPreview: React.FC<DynamicApplicationPreviewProps> = ({
    application,
    showAllFields = true,
    maxFields = 50,
    className = '',
    onShowAllFields
}) => {
    const [fieldData, setFieldData] = useState<FieldDisplayData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [showFullText, setShowFullText] = useState<{ [key: string]: boolean }>({});

    useEffect(() => {
        const loadFieldData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get fields for the application's grant type
                const fields = await dynamicFieldsEngine.getFieldsForGrantType(application.grantType);
                
                // Extract application data using the dynamic fields engine
                const extractedData = dynamicFieldsEngine.extractApplicationData(
                    application, 
                    (application as any).formData
                );

                // Create field display data
                const displayData: FieldDisplayData[] = [];
                
                for (const [fieldId, fieldInfo] of Array.from(fields.entries())) {
                    const value = extractedData[fieldId];
                    
                    if (value !== undefined && value !== null && value !== '') {
                        const isFile = dynamicFieldsEngine.isFileField(fieldInfo, value);
                        const isLongText = dynamicFieldsEngine.isLongTextField(fieldInfo, value);
                        
                        let displayValue = '';
                        if (isFile) {
                            displayValue = dynamicFieldsEngine.getFileDisplayName(value);
                        } else if (isLongText) {
                            displayValue = typeof value === 'string' ? value.substring(0, 100) + '...' : String(value);
                        } else {
                            displayValue = String(value);
                        }

                        displayData.push({
                            fieldId,
                            fieldInfo,
                            value,
                            displayValue,
                            isFile,
                            isLongText
                        });
                    }
                }

                // Fields are already in the correct order from the Map (preserves insertion order)
                // No additional sorting needed - the Map maintains the order from form templates

                // Apply field limit if not showing all fields
                const finalData = showAllFields ? displayData : displayData.slice(0, maxFields);
                setFieldData(finalData);

            } catch (err) {
                console.error('Error loading field data:', err);
                setError('Failed to load application field data');
            } finally {
                setLoading(false);
            }
        };

        loadFieldData();
    }, [application, showAllFields, maxFields]);

    const toggleFullText = (fieldId: string) => {
        setShowFullText(prev => ({
            ...prev,
            [fieldId]: !prev[fieldId]
        }));
    };

    const handleFileClick = (value: any) => {
        // Handle file download/viewing
        if (typeof value === 'string') {
            // If it's a URL or file path, open it
            if (value.startsWith('http') || value.includes('.')) {
                window.open(value, '_blank');
            } else {
                // If it's a UUID or file reference, you might need to construct the URL
                console.log('File reference:', value);
                // Implement file viewing logic here
            }
        }
    };

    if (loading) {
        return (
            <div className={`dynamic-application-preview loading ${className}`}>
                <div className="loading-spinner"></div>
                <span>Loading application data...</span>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`dynamic-application-preview error ${className}`}>
                <span className="error-message">{error}</span>
            </div>
        );
    }

    if (fieldData.length === 0) {
        return (
            <div className={`dynamic-application-preview empty ${className}`}>
                <span>No dynamic field data available for this application.</span>
            </div>
        );
    }

    return (
        <div className={`dynamic-application-preview ${className}`}>
            <div className="preview-header">
                <h4>Application Details</h4>
                <span className="field-count">
                    {fieldData.length} {fieldData.length === 1 ? 'field' : 'fields'} shown
                    {!showAllFields && fieldData.length === maxFields && ' (limited)'}
                </span>
            </div>
            
            <div className="fields-container">
                {fieldData.map(({ fieldId, fieldInfo, value, displayValue, isFile, isLongText }) => (
                    <div key={fieldId} className="field-item">
                        <div className="field-label">
                            {fieldInfo.label}
                            {fieldInfo.isRequired && <span className="required-indicator">*</span>}
                            <span className="field-type-badge">{fieldInfo.type}</span>
                        </div>
                        
                        <div className="field-value">
                            {isFile ? (
                                <button 
                                    className="file-button"
                                    onClick={() => handleFileClick(value)}
                                >
                                    📄 {displayValue}
                                </button>
                            ) : isLongText ? (
                                <div className="long-text-container">
                                    <div className="text-content">
                                        {showFullText[fieldId] ? value : displayValue}
                                    </div>
                                    {value.length > 100 && (
                                        <button 
                                            className="show-more-button"
                                            onClick={() => toggleFullText(fieldId)}
                                        >
                                            {showFullText[fieldId] ? 'Show Less' : 'Show More'}
                                        </button>
                                    )}
                                </div>
                            ) : (
                                <span className="text-value">{displayValue}</span>
                            )}
                        </div>
                        
                        {fieldInfo.helpText && (
                            <div className="field-help">
                                <small>{fieldInfo.helpText}</small>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            
            {!showAllFields && fieldData.length === maxFields && onShowAllFields && (
                <div className="show-all-container">
                    <button 
                        className="show-all-button"
                        onClick={onShowAllFields}
                    >
                        View Complete Application Data
                    </button>
                </div>
            )}
        </div>
    );
};

export default DynamicApplicationPreview;
