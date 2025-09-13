/**
 * Dynamic Fields Engine Usage Examples
 * 
 * This file demonstrates how to use the DynamicFieldsEngine in different components
 * across the application. Copy and adapt these patterns for your specific use cases.
 */

import { dynamicFieldsEngine, FieldInfo, FieldFilterOptions } from './dynamic-fields-engine';

// ============================================================================
// EXAMPLE 1: Administrator Dashboard - Show all fields for any application type
// ============================================================================

export const useAdminDashboardFields = async (selectedGrantType?: string) => {
    try {
        let fields: Map<string, FieldInfo>;
        
        if (selectedGrantType && selectedGrantType !== 'all') {
            // Get fields specific to the selected grant type
            fields = await dynamicFieldsEngine.getFieldsForGrantType(selectedGrantType);
        } else {
            // Get all fields
            fields = await dynamicFieldsEngine.getAllFields();
        }
        
        return fields;
    } catch (error) {
        console.error('Error loading fields for admin dashboard:', error);
        return new Map();
    }
};

// ============================================================================
// EXAMPLE 2: Reviewer Dashboard - Show fields relevant to applications being reviewed
// ============================================================================

export const useReviewerDashboardFields = async (applicationGrantTypes: string[]) => {
    try {
        // Get fields for all grant types that the reviewer is working with
        const fields = await dynamicFieldsEngine.getFieldsForGrantTypes(applicationGrantTypes);
        return fields;
    } catch (error) {
        console.error('Error loading fields for reviewer dashboard:', error);
        return new Map();
    }
};

// ============================================================================
// EXAMPLE 3: Applicant Dashboard - Show fields from submitted applications
// ============================================================================

export const useApplicantDashboardFields = async (applications: any[]) => {
    try {
        // Extract unique grant types from applicant's applications
        const grantTypes = Array.from(new Set(applications.map((app: any) => app.grantType)));
        
        // Get fields for those grant types
        const fields = await dynamicFieldsEngine.getFieldsForGrantTypes(grantTypes);
        return fields;
    } catch (error) {
        console.error('Error loading fields for applicant dashboard:', error);
        return new Map();
    }
};

// ============================================================================
// EXAMPLE 4: Modal Component - Show specific fields in a modal
// ============================================================================

export const useModalFields = async (options: {
    grantTypes?: string[];
    fieldTypes?: string[];
    excludeFields?: string[];
    searchQuery?: string;
}) => {
    try {
        const filterOptions: FieldFilterOptions = {
            grantTypes: options.grantTypes,
            fieldTypes: options.fieldTypes,
            excludeFields: options.excludeFields,
            searchQuery: options.searchQuery
        };
        
        const fields = await dynamicFieldsEngine.getFilteredFields(filterOptions);
        return fields;
    } catch (error) {
        console.error('Error loading fields for modal:', error);
        return new Map();
    }
};

// ============================================================================
// EXAMPLE 5: Application Display Component - Render application data dynamically
// ============================================================================

export interface FieldRenderData {
    fieldId: string;
    fieldInfo: FieldInfo;
    value: any;
    displayName?: string;
    isFile: boolean;
    isLongText: boolean;
}

export const getApplicationFieldData = (application: any, fields: Map<string, FieldInfo>): FieldRenderData[] => {
    const fieldData: FieldRenderData[] = [];
    
    for (const [fieldId, fieldInfo] of Array.from(fields.entries())) {
        const value = application[fieldId];
        
        if (value !== undefined && value !== null && value !== '') {
            const isFile = dynamicFieldsEngine.isFileField(fieldInfo, value);
            const isLongText = dynamicFieldsEngine.isLongTextField(fieldInfo, value);
            const displayName = isFile ? dynamicFieldsEngine.getFileDisplayName(value) : undefined;
            
            fieldData.push({
                fieldId,
                fieldInfo,
                value,
                displayName,
                isFile,
                isLongText
            });
        }
    }
    
    return fieldData;
};

// ============================================================================
// EXAMPLE 6: Search and Filter Component
// ============================================================================

export const useFieldSearch = async (searchQuery: string, grantType?: string) => {
    try {
        let fields: Map<string, FieldInfo>;
        
        if (searchQuery.trim()) {
            // Search fields by query
            fields = await dynamicFieldsEngine.searchFields(searchQuery);
            
            // Further filter by grant type if specified
            if (grantType && grantType !== 'all') {
                const filtered = new Map<string, FieldInfo>();
                for (const [fieldId, fieldInfo] of Array.from(fields.entries())) {
                    if (fieldInfo.grantTypes.includes(grantType)) {
                        filtered.set(fieldId, fieldInfo);
                    }
                }
                fields = filtered;
            }
        } else if (grantType && grantType !== 'all') {
            // Get fields for specific grant type
            fields = await dynamicFieldsEngine.getFieldsForGrantType(grantType);
        } else {
            // Get all fields
            fields = await dynamicFieldsEngine.getAllFields();
        }
        
        return fields;
    } catch (error) {
        console.error('Error searching fields:', error);
        return new Map();
    }
};

// ============================================================================
// EXAMPLE 7: Column Selection Component
// ============================================================================

export const useColumnSelection = async (selectedGrantType: string) => {
    try {
        const fields = await dynamicFieldsEngine.getFieldsForGrantType(selectedGrantType);
        
        // Convert to array for easier rendering in dropdowns
        const fieldOptions = Array.from(fields.entries()).map(([fieldId, fieldInfo]) => ({
            id: fieldId,
            label: fieldInfo.label,
            type: fieldInfo.type,
            grantTypes: fieldInfo.grantTypes
        }));
        
        return fieldOptions;
    } catch (error) {
        console.error('Error loading column options:', error);
        return [];
    }
};

// ============================================================================
// EXAMPLE 8: Application Data Extraction
// ============================================================================

export const extractApplicationDataForDisplay = (applicationData: any, formData?: Record<string, any>) => {
    // Use the engine to extract data dynamically
    return dynamicFieldsEngine.extractApplicationData(applicationData, formData);
};

// ============================================================================
// EXAMPLE 9: Field Validation
// ============================================================================

export const validateApplicationFields = async (applicationData: any, grantType: string) => {
    try {
        const fields = await dynamicFieldsEngine.getFieldsForGrantType(grantType);
        const errors: string[] = [];
        
        for (const [fieldId, fieldInfo] of Array.from(fields.entries())) {
            if (fieldInfo.isRequired) {
                const value = applicationData[fieldId];
                if (!value || value === '' || value === null || value === undefined) {
                    errors.push(`${fieldInfo.label} is required`);
                }
            }
        }
        
        return errors;
    } catch (error) {
        console.error('Error validating fields:', error);
        return ['Error validating application fields'];
    }
};

// ============================================================================
// EXAMPLE 10: Cache Management
// ============================================================================

export const refreshFieldCache = () => {
    // Clear the cache when form templates are updated
    dynamicFieldsEngine.clearCache();
};

export const getFieldCacheStats = () => {
    // Get cache statistics for debugging
    return dynamicFieldsEngine.getCacheStats();
};

// Helper function for showing full text (implement based on your modal system)
export const showFullText = (title: string, content: string) => {
    // Implement your modal logic here
    console.log('Show full text:', title, content);
};
