import React, { useState, useEffect } from 'react';
import { dynamicFieldsEngine, FieldInfo, FieldFilterOptions } from '../../services/dynamic-fields-engine';
import './DynamicFieldsViewer.css';

interface DynamicFieldsViewerProps {
    className?: string;
    showTitle?: boolean;
    showFilters?: boolean;
    showStats?: boolean;
    initialGrantType?: string;
    onFieldSelect?: (fieldId: string, fieldInfo: FieldInfo) => void;
}

const DynamicFieldsViewer: React.FC<DynamicFieldsViewerProps> = ({
    className = '',
    showTitle = true,
    showFilters = true,
    showStats = true,
    initialGrantType = 'all',
    onFieldSelect
}) => {
    const [fields, setFields] = useState<Map<string, FieldInfo>>(new Map());
    const [filteredFields, setFilteredFields] = useState<Map<string, FieldInfo>>(new Map());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    // Filter states
    const [selectedGrantType, setSelectedGrantType] = useState(initialGrantType);
    const [selectedFieldType, setSelectedFieldType] = useState('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [availableGrantTypes, setAvailableGrantTypes] = useState<string[]>([]);
    const [availableFieldTypes, setAvailableFieldTypes] = useState<string[]>([]);
    
    // Stats
    const [stats, setStats] = useState({
        totalFields: 0,
        requiredFields: 0,
        fileFields: 0,
        textFields: 0,
        grantTypeCounts: {} as Record<string, number>
    });

    // Load all fields and available options
    useEffect(() => {
        const loadFields = async () => {
            try {
                setLoading(true);
                setError(null);
                
                const allFields = await dynamicFieldsEngine.getAllFields();
                setFields(allFields);
                
                // Get available grant types and field types
                const grantTypes = await dynamicFieldsEngine.getAvailableGrantTypes();
                const fieldTypes = await dynamicFieldsEngine.getAvailableFieldTypes();
                
                setAvailableGrantTypes(['all', ...grantTypes]);
                setAvailableFieldTypes(['all', ...fieldTypes]);
                
                // Calculate stats
                const fieldArray = Array.from(allFields.values());
                const requiredCount = fieldArray.filter(f => f.isRequired).length;
                const fileCount = fieldArray.filter(f => f.type === 'file').length;
                const textCount = fieldArray.filter(f => ['text', 'textarea'].includes(f.type)).length;
                
                const grantTypeCounts: Record<string, number> = {};
                fieldArray.forEach(field => {
                    field.grantTypes.forEach(grantType => {
                        grantTypeCounts[grantType] = (grantTypeCounts[grantType] || 0) + 1;
                    });
                });
                
                setStats({
                    totalFields: allFields.size,
                    requiredFields: requiredCount,
                    fileFields: fileCount,
                    textFields: textCount,
                    grantTypeCounts
                });
                
            } catch (err) {
                console.error('Error loading dynamic fields:', err);
                setError('Failed to load dynamic fields. Please try again.');
            } finally {
                setLoading(false);
            }
        };

        loadFields();
    }, []);

    // Apply filters whenever filter states change
    useEffect(() => {
        const applyFilters = async () => {
            if (fields.size === 0) return;

            try {
                const filterOptions: FieldFilterOptions = {};
                
                if (selectedGrantType !== 'all') {
                    filterOptions.grantTypes = [selectedGrantType];
                }
                
                if (selectedFieldType !== 'all') {
                    filterOptions.fieldTypes = [selectedFieldType];
                }
                
                if (searchQuery.trim()) {
                    filterOptions.searchQuery = searchQuery.trim();
                }
                
                const filtered = await dynamicFieldsEngine.getFilteredFields(filterOptions);
                setFilteredFields(filtered);
                
            } catch (err) {
                console.error('Error applying filters:', err);
                setError('Failed to apply filters. Please try again.');
            }
        };

        applyFilters();
    }, [fields, selectedGrantType, selectedFieldType, searchQuery]);

    const handleFieldClick = (fieldId: string, fieldInfo: FieldInfo) => {
        if (onFieldSelect) {
            onFieldSelect(fieldId, fieldInfo);
        }
    };

    const clearFilters = () => {
        setSelectedGrantType('all');
        setSelectedFieldType('all');
        setSearchQuery('');
    };

    const renderFieldCard = (fieldId: string, fieldInfo: FieldInfo) => {
        const isClickable = !!onFieldSelect;
        
        return (
            <div 
                key={fieldId}
                className={`field-card ${isClickable ? 'clickable' : ''}`}
                onClick={() => isClickable && handleFieldClick(fieldId, fieldInfo)}
            >
                <div className="field-header">
                    <h4 className="field-label">{fieldInfo.label}</h4>
                    <div className="field-badges">
                        {fieldInfo.isRequired && (
                            <span className="badge required">Required</span>
                        )}
                        <span className="badge type">{fieldInfo.type}</span>
                    </div>
                </div>
                
                <div className="field-details">
                    <div className="field-id">
                        <strong>ID:</strong> {fieldId}
                    </div>
                    
                    {fieldInfo.helpText && (
                        <div className="field-help">
                            <strong>Help:</strong> {fieldInfo.helpText}
                        </div>
                    )}
                    
                    <div className="field-grant-types">
                        <strong>Grant Types:</strong>
                        <div className="grant-type-tags">
                            {fieldInfo.grantTypes.map(grantType => (
                                <span key={grantType} className="grant-type-tag">
                                    {grantType}
                                </span>
                            ))}
                        </div>
                    </div>
                    
                    {fieldInfo.options && fieldInfo.options.length > 0 && (
                        <div className="field-options">
                            <strong>Options:</strong>
                            <div className="options-list">
                                {fieldInfo.options.map((option, index) => (
                                    <span key={index} className="option-tag">
                                        {option}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    if (loading) {
        return (
            <div className={`dynamic-fields-viewer ${className}`}>
                <div className="loading-container">
                    <div className="loading-spinner"></div>
                    <p>Loading dynamic fields...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className={`dynamic-fields-viewer ${className}`}>
                <div className="error-container">
                    <p className="error-message">{error}</p>
                    <button 
                        className="retry-button"
                        onClick={() => window.location.reload()}
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className={`dynamic-fields-viewer ${className}`}>
            {showTitle && (
                <div className="viewer-header">
                    <h2>Dynamic Fields Explorer</h2>
                    <p>Explore all available form fields across the system</p>
                </div>
            )}

            {showStats && (
                <div className="stats-container">
                    <div className="stat-card">
                        <div className="stat-number">{stats.totalFields}</div>
                        <div className="stat-label">Total Fields</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.requiredFields}</div>
                        <div className="stat-label">Required Fields</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.fileFields}</div>
                        <div className="stat-label">File Fields</div>
                    </div>
                    <div className="stat-card">
                        <div className="stat-number">{stats.textFields}</div>
                        <div className="stat-label">Text Fields</div>
                    </div>
                </div>
            )}

            {showFilters && (
                <div className="filters-container">
                    <div className="filter-row">
                        <div className="filter-group">
                            <label htmlFor="grant-type-filter">Grant Type:</label>
                            <select
                                id="grant-type-filter"
                                value={selectedGrantType}
                                onChange={(e) => setSelectedGrantType(e.target.value)}
                            >
                                {availableGrantTypes.map(grantType => (
                                    <option key={grantType} value={grantType}>
                                        {grantType === 'all' ? 'All Grant Types' : grantType}
                                        {grantType !== 'all' && stats.grantTypeCounts[grantType] && 
                                            ` (${stats.grantTypeCounts[grantType]})`
                                        }
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="field-type-filter">Field Type:</label>
                            <select
                                id="field-type-filter"
                                value={selectedFieldType}
                                onChange={(e) => setSelectedFieldType(e.target.value)}
                            >
                                {availableFieldTypes.map(fieldType => (
                                    <option key={fieldType} value={fieldType}>
                                        {fieldType === 'all' ? 'All Field Types' : fieldType}
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="filter-group">
                            <label htmlFor="search-filter">Search:</label>
                            <input
                                id="search-filter"
                                type="text"
                                placeholder="Search fields by name or ID..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>

                        <button 
                            className="clear-filters-button"
                            onClick={clearFilters}
                            disabled={selectedGrantType === 'all' && selectedFieldType === 'all' && !searchQuery}
                        >
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            <div className="fields-container">
                <div className="fields-header">
                    <h3>
                        Fields ({filteredFields.size})
                        {selectedGrantType !== 'all' && ` for ${selectedGrantType}`}
                        {selectedFieldType !== 'all' && ` of type ${selectedFieldType}`}
                        {searchQuery && ` matching "${searchQuery}"`}
                    </h3>
                </div>

                {filteredFields.size === 0 ? (
                    <div className="no-fields-message">
                        <p>No fields found matching your criteria.</p>
                        <button onClick={clearFilters}>Clear all filters</button>
                    </div>
                ) : (
                    <div className="fields-grid">
                        {Array.from(filteredFields.entries()).map(([fieldId, fieldInfo]) =>
                            renderFieldCard(fieldId, fieldInfo)
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default DynamicFieldsViewer;
