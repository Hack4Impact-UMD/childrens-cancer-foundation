# Dynamic Fields Engine

## Overview

The Dynamic Fields Engine is a centralized service that provides a single source of truth for managing dynamic form fields across the entire application. It eliminates hardcoded field references and ensures all components can dynamically discover, filter, and render form fields based on the actual form templates in the database.

## Key Benefits

- **No More Hardcoded Fields**: All field discovery is dynamic based on form templates
- **Centralized Logic**: Single place to manage field filtering, validation, and rendering
- **Caching**: Efficient caching to avoid repeated API calls
- **Type Safety**: Full TypeScript support with proper interfaces
- **Reusable**: Can be used across all components (Admin, Reviewer, Applicant dashboards)

## Quick Start

```typescript
import { dynamicFieldsEngine } from '../services/dynamic-fields-engine';

// Get all available fields
const fields = await dynamicFieldsEngine.getAllFields();

// Get fields for a specific grant type
const researchFields = await dynamicFieldsEngine.getFieldsForGrantType('research');

// Search fields
const searchResults = await dynamicFieldsEngine.searchFields('proposal');

// Extract application data dynamically
const extractedData = dynamicFieldsEngine.extractApplicationData(applicationData, formData);
```

## Core Methods

### Field Discovery

```typescript
// Get all fields from all form templates
const allFields = await dynamicFieldsEngine.getAllFields();

// Get fields for specific grant types
const fields = await dynamicFieldsEngine.getFieldsForGrantTypes(['research', 'nextgen']);

// Search fields by label or ID
const searchResults = await dynamicFieldsEngine.searchFields('proposal');
```

### Field Filtering

```typescript
const options: FieldFilterOptions = {
    grantTypes: ['research'],
    fieldTypes: ['file', 'text'],
    excludeFields: ['internal_notes'],
    searchQuery: 'proposal'
};

const filteredFields = await dynamicFieldsEngine.getFilteredFields(options);
```

### Data Extraction

```typescript
// Extract application data dynamically (replaces hardcoded field mappings)
const extractedData = dynamicFieldsEngine.extractApplicationData(
    applicationData, 
    formData
);
```

### Field Type Detection

```typescript
// Check if a field is a file field
const isFile = dynamicFieldsEngine.isFileField(fieldInfo, value);

// Check if a field is a long text field
const isLongText = dynamicFieldsEngine.isLongTextField(fieldInfo, value);

// Get display name for file fields
const displayName = dynamicFieldsEngine.getFileDisplayName(fileValue);
```

## Usage Examples

### Administrator Dashboard

```typescript
import { useAdminDashboardFields } from '../services/dynamic-fields-usage-examples';

const AdminDashboard = () => {
    const [fields, setFields] = useState<Map<string, FieldInfo>>(new Map());
    
    useEffect(() => {
        const loadFields = async () => {
            const allFields = await useAdminDashboardFields(selectedGrantType);
            setFields(allFields);
        };
        loadFields();
    }, [selectedGrantType]);
    
    return (
        <div>
            {Array.from(fields.entries()).map(([fieldId, fieldInfo]) => (
                <div key={fieldId}>
                    <label>{fieldInfo.label}</label>
                    {/* Render field based on type */}
                </div>
            ))}
        </div>
    );
};
```

### Reviewer Dashboard

```typescript
import { useReviewerDashboardFields } from '../services/dynamic-fields-usage-examples';

const ReviewerDashboard = () => {
    const [fields, setFields] = useState<Map<string, FieldInfo>>(new Map());
    
    useEffect(() => {
        const loadFields = async () => {
            // Get fields for applications this reviewer is working with
            const grantTypes = ['research', 'nextgen']; // From reviewer's assignments
            const reviewerFields = await useReviewerDashboardFields(grantTypes);
            setFields(reviewerFields);
        };
        loadFields();
    }, []);
    
    // Render fields dynamically...
};
```

### Application Modal

```typescript
import { useModalFields, renderApplicationData } from '../services/dynamic-fields-usage-examples';

const ApplicationModal = ({ application, grantType }) => {
    const [fields, setFields] = useState<Map<string, FieldInfo>>(new Map());
    
    useEffect(() => {
        const loadFields = async () => {
            const modalFields = await useModalFields({
                grantTypes: [grantType],
                excludeFields: ['internal_notes', 'admin_comments']
            });
            setFields(modalFields);
        };
        loadFields();
    }, [grantType]);
    
    return (
        <div className="modal-content">
            {renderApplicationData(application, fields)}
        </div>
    );
};
```

## Migration Guide

### Before (Hardcoded)

```typescript
// OLD: Hardcoded field mappings
const extracted = {
    name: getValue('principal_investigator', ['principalInvestigator', 'name']),
    institution: getValue('institution_name', ['institution']),
    title: getValue('title', ['project_title', 'grant_title']),
    // ... many hardcoded mappings
};

// OLD: Hardcoded field lists
const standardFields = {
    name: { label: 'Name (Last, First)', type: 'text' },
    institution: { label: 'Institution', type: 'text' },
    // ... hardcoded field definitions
};
```

### After (Dynamic)

```typescript
// NEW: Dynamic field discovery
const fields = await dynamicFieldsEngine.getAllFields();

// NEW: Dynamic data extraction
const extracted = dynamicFieldsEngine.extractApplicationData(applicationData, formData);

// NEW: Dynamic field rendering
for (const [fieldId, fieldInfo] of fields) {
    // Render field based on fieldInfo.label, fieldInfo.type, etc.
}
```

## Best Practices

1. **Always use the engine**: Don't hardcode field names or types
2. **Cache appropriately**: The engine handles caching automatically
3. **Handle errors gracefully**: Always wrap engine calls in try-catch
4. **Use type safety**: Leverage the FieldInfo interface for type safety
5. **Filter efficiently**: Use the filtering options to get only needed fields

## Cache Management

```typescript
// Clear cache when form templates are updated
dynamicFieldsEngine.clearCache();

// Check cache status
const stats = dynamicFieldsEngine.getCacheStats();
console.log(`Cache size: ${stats.size}, Last update: ${stats.lastUpdate}`);
```

## Error Handling

```typescript
try {
    const fields = await dynamicFieldsEngine.getAllFields();
    // Use fields...
} catch (error) {
    console.error('Error loading dynamic fields:', error);
    // Fallback to empty fields or show error message
    return new Map();
}
```

## Performance Considerations

- The engine uses caching to avoid repeated API calls
- Cache duration is 5 minutes by default
- Use filtering options to get only needed fields
- Consider using `getFieldsForGrantType()` instead of `getAllFields()` when possible

## Integration Checklist

When integrating the engine into a new component:

- [ ] Import the engine: `import { dynamicFieldsEngine } from '../services/dynamic-fields-engine'`
- [ ] Replace hardcoded field lists with engine calls
- [ ] Use `extractApplicationData()` instead of hardcoded field mappings
- [ ] Use engine methods for field type detection (`isFileField`, `isLongTextField`)
- [ ] Handle errors gracefully with try-catch blocks
- [ ] Test with different grant types and form templates
- [ ] Remove any remaining hardcoded field references
