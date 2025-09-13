/**
 * Dynamic Fields Engine
 * 
 * Centralized service for managing dynamic form fields across the entire application.
 * This engine provides a single source of truth for field discovery, filtering, and rendering.
 * 
 * Usage:
 * - Administrator Dashboard: Use to show all available fields for any application type
 * - Reviewer Dashboard: Use to show fields relevant to the applications being reviewed
 * - Applicant Dashboard: Use to show fields from the applicant's submitted applications
 * - Any other component: Use to dynamically render form fields without hardcoding
 */

import { getFormTemplates } from '../backend/form-template-service';
import { FormTemplate, GrantType } from '../types/form-template-types';

export interface FieldInfo {
    id: string;
    label: string;
    type: string;
    grantTypes: string[];
    isRequired?: boolean;
    helpText?: string;
    options?: string[];
    order?: number;
}

export interface FieldFilterOptions {
    grantTypes?: string[];
    fieldTypes?: string[];
    excludeFields?: string[];
    includeFields?: string[];
    searchQuery?: string;
}

export interface ApplicationFieldData {
    [fieldId: string]: any;
}

export class DynamicFieldsEngine {
    private static instance: DynamicFieldsEngine;
    private fieldCache: Map<string, FieldInfo> = new Map();
    private lastCacheUpdate: number = 0;
    private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

    private constructor() {}

    public static getInstance(): DynamicFieldsEngine {
        if (!DynamicFieldsEngine.instance) {
            DynamicFieldsEngine.instance = new DynamicFieldsEngine();
        }
        return DynamicFieldsEngine.instance;
    }

    /**
     * Get all available fields from form templates
     * Uses caching to avoid repeated API calls
     */
    public async getAllFields(): Promise<Map<string, FieldInfo>> {
        const now = Date.now();
        
        // Return cached data if still fresh
        if (this.fieldCache.size > 0 && (now - this.lastCacheUpdate) < this.CACHE_DURATION) {
            return this.fieldCache;
        }

        try {
            const templates = await getFormTemplates();
            this.fieldCache.clear();

            // Extract fields from all form templates
            templates.forEach(template => {
                template.pages.forEach(page => {
                    page.fields.forEach(field => {
                        const fieldId = field.id;
                        
                        if (this.fieldCache.has(fieldId)) {
                            // If field already exists, add this grant type to the list
                            const existingField = this.fieldCache.get(fieldId)!;
                            if (!existingField.grantTypes.includes(template.grantType)) {
                                existingField.grantTypes.push(template.grantType);
                            }
                        } else {
                            // Create new field entry
                            this.fieldCache.set(fieldId, {
                                id: fieldId,
                                label: field.label,
                                type: field.type,
                                grantTypes: [template.grantType],
                                isRequired: field.required || false,
                                helpText: field.helpText,
                                options: field.options,
                                order: field.order || 0
                            });
                        }
                    });
                });
            });

            this.lastCacheUpdate = now;
            return this.fieldCache;
        } catch (error) {
            console.error('Error fetching form templates:', error);
            throw new Error('Failed to load dynamic fields');
        }
    }

    /**
     * Get fields filtered by options
     */
    public async getFilteredFields(options: FieldFilterOptions = {}): Promise<Map<string, FieldInfo>> {
        const allFields = await this.getAllFields();
        const filtered = new Map<string, FieldInfo>();

        for (const [fieldId, fieldInfo] of Array.from(allFields.entries())) {
            // Apply grant type filter
            if (options.grantTypes && options.grantTypes.length > 0) {
                const hasMatchingGrantType = fieldInfo.grantTypes.some((grantType: string) => 
                    options.grantTypes!.includes(grantType)
                );
                if (!hasMatchingGrantType) continue;
            }

            // Apply field type filter
            if (options.fieldTypes && options.fieldTypes.length > 0) {
                if (!options.fieldTypes.includes(fieldInfo.type)) continue;
            }

            // Apply exclude filter
            if (options.excludeFields && options.excludeFields.includes(fieldId)) {
                continue;
            }

            // Apply include filter (if specified, only include these fields)
            if (options.includeFields && options.includeFields.length > 0) {
                if (!options.includeFields.includes(fieldId)) continue;
            }

            // Apply search filter
            if (options.searchQuery) {
                const searchLower = options.searchQuery.toLowerCase();
                const matchesLabel = fieldInfo.label.toLowerCase().includes(searchLower);
                const matchesId = fieldId.toLowerCase().includes(searchLower);
                if (!matchesLabel && !matchesId) continue;
            }

            filtered.set(fieldId, fieldInfo);
        }

        return filtered;
    }

    /**
     * Get fields for a specific grant type in the correct order from form templates
     */
    public async getFieldsForGrantType(grantType: string): Promise<Map<string, FieldInfo>> {
        try {
            const templates = await getFormTemplates();
            const orderedFields = new Map<string, FieldInfo>();
            
            // Find the template for this grant type
            const template = templates.find(t => t.grantType === grantType);
            if (!template) {
                return orderedFields;
            }
            
            // Extract fields in the order they appear in the template
            template.pages.forEach(page => {
                page.fields.forEach(field => {
                    const fieldId = field.id;
                    
                    if (!orderedFields.has(fieldId)) {
                        orderedFields.set(fieldId, {
                            id: fieldId,
                            label: field.label,
                            type: field.type,
                            grantTypes: [grantType],
                            isRequired: field.required || false,
                            helpText: field.helpText,
                            options: field.options,
                            order: field.order || 0
                        });
                    }
                });
            });
            
            return orderedFields;
        } catch (error) {
            console.error('Error getting fields for grant type:', error);
            return new Map();
        }
    }

    /**
     * Get fields for multiple grant types
     */
    public async getFieldsForGrantTypes(grantTypes: string[]): Promise<Map<string, FieldInfo>> {
        return this.getFilteredFields({ grantTypes });
    }

    /**
     * Get fields of a specific type (e.g., 'file', 'text', 'number')
     */
    public async getFieldsByType(fieldType: string): Promise<Map<string, FieldInfo>> {
        return this.getFilteredFields({ fieldTypes: [fieldType] });
    }

    /**
     * Search fields by label or ID
     */
    public async searchFields(query: string): Promise<Map<string, FieldInfo>> {
        return this.getFilteredFields({ searchQuery: query });
    }

    /**
     * Get field information by ID
     */
    public async getFieldById(fieldId: string): Promise<FieldInfo | null> {
        const allFields = await this.getAllFields();
        return allFields.get(fieldId) || null;
    }

    /**
     * Check if a field exists
     */
    public async fieldExists(fieldId: string): Promise<boolean> {
        const allFields = await this.getAllFields();
        return allFields.has(fieldId);
    }

    /**
     * Get all unique grant types
     */
    public async getAvailableGrantTypes(): Promise<string[]> {
        const allFields = await this.getAllFields();
        const grantTypes = new Set<string>();
        
        for (const fieldInfo of Array.from(allFields.values())) {
            fieldInfo.grantTypes.forEach((grantType: string) => grantTypes.add(grantType));
        }
        
        return Array.from(grantTypes);
    }

    /**
     * Get all unique field types
     */
    public async getAvailableFieldTypes(): Promise<string[]> {
        const allFields = await this.getAllFields();
        const fieldTypes = new Set<string>();
        
        for (const fieldInfo of Array.from(allFields.values())) {
            fieldTypes.add(fieldInfo.type);
        }
        
        return Array.from(fieldTypes);
    }

    /**
     * Extract application data dynamically
     * This replaces hardcoded field extraction logic
     */
    public extractApplicationData(
        applicationData: any, 
        formData?: Record<string, any>
    ): ApplicationFieldData {
        const extracted: ApplicationFieldData = {};

        // Helper function to get value with fallbacks
        const getValue = (fieldId: string, fallbackFields: string[] = []): any => {
            // First try formData (primary source for dynamic forms)
            if (formData && formData[fieldId] !== undefined && formData[fieldId] !== null && formData[fieldId] !== '') {
                return formData[fieldId];
            }
            
            // Then try fallback fields (for legacy compatibility)
            for (const fallback of fallbackFields) {
                if (applicationData[fallback] !== undefined && applicationData[fallback] !== null && applicationData[fallback] !== '') {
                    return applicationData[fallback];
                }
            }
            
            return '';
        };

        // Add all formData fields dynamically - this is the primary source
        if (formData) {
            Object.entries(formData).forEach(([key, value]) => {
                if (value !== undefined && value !== null && value !== '') {
                    extracted[key] = value;
                }
            });
        }

        // Add any top-level fields from the application document that aren't already in formData
        Object.entries(applicationData).forEach(([key, value]) => {
            if (value !== undefined && value !== null && value !== '' && !extracted.hasOwnProperty(key)) {
                extracted[key] = value;
            }
        });

        return extracted;
    }

    /**
     * Check if a field value represents a file
     */
    public isFileField(fieldInfo: FieldInfo, value: any): boolean {
        // Check by field type
        if (fieldInfo.type === 'file') {
            return true;
        }

        // Check by value content (for legacy data)
        if (typeof value === 'string') {
            const fileExtensions = ['.pdf', '.doc', '.docx', '.txt'];
            const hasFileExtension = fileExtensions.some(ext => value.toLowerCase().includes(ext));
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
            return hasFileExtension || isUuid;
        }

        return false;
    }

    /**
     * Check if a field value represents long text
     */
    public isLongTextField(fieldInfo: FieldInfo, value: any): boolean {
        if (fieldInfo.type === 'textarea') {
            return true;
        }

        if (typeof value === 'string' && value.length > 100) {
            return true;
        }

        return false;
    }

    /**
     * Get display name for a file field
     */
    public getFileDisplayName(value: any): string {
        if (typeof value === 'string') {
            const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
            return isUuid ? 'Uploaded File' : value;
        }
        return 'File';
    }

    /**
     * Clear the field cache (useful for testing or when form templates are updated)
     */
    public clearCache(): void {
        this.fieldCache.clear();
        this.lastCacheUpdate = 0;
    }

    /**
     * Get cache statistics
     */
    public getCacheStats(): { size: number; lastUpdate: number; isStale: boolean } {
        const now = Date.now();
        return {
            size: this.fieldCache.size,
            lastUpdate: this.lastCacheUpdate,
            isStale: (now - this.lastCacheUpdate) >= this.CACHE_DURATION
        };
    }
}

// Export singleton instance
export const dynamicFieldsEngine = DynamicFieldsEngine.getInstance();

// Export convenience functions for easier usage
export const getDynamicFields = () => dynamicFieldsEngine.getAllFields();
export const getFilteredDynamicFields = (options: FieldFilterOptions) => dynamicFieldsEngine.getFilteredFields(options);
export const getFieldsForGrantType = (grantType: string) => dynamicFieldsEngine.getFieldsForGrantType(grantType);
export const getFieldsForGrantTypes = (grantTypes: string[]) => dynamicFieldsEngine.getFieldsForGrantTypes(grantTypes);
export const searchDynamicFields = (query: string) => dynamicFieldsEngine.searchFields(query);
export const extractDynamicApplicationData = (applicationData: any, formData?: Record<string, any>) => 
    dynamicFieldsEngine.extractApplicationData(applicationData, formData);
