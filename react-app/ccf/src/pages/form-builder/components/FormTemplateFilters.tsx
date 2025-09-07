import React from 'react';
import { FormTemplateFilter, GrantType } from '../../../types/form-template-types';
import './FormTemplateFilters.css';

interface FormTemplateFiltersProps {
  filters: FormTemplateFilter;
  onFiltersChange: (filters: FormTemplateFilter) => void;
}

const FormTemplateFilters: React.FC<FormTemplateFiltersProps> = ({
  filters,
  onFiltersChange
}) => {
  const handleGrantTypeChange = (grantType: string) => {
    onFiltersChange({ ...filters, grantType: grantType as GrantType | 'all' });
  };

  const handleStatusChange = (status: string) => {
    onFiltersChange({ ...filters, status: status as any });
  };

  return (
    <div className="form-template-filters">
      <div className="filter-group">
        <label htmlFor="grant-type-filter">Grant Type</label>
        <select
          id="grant-type-filter"
          value={filters.grantType || 'all'}
          onChange={(e) => handleGrantTypeChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Types</option>
          <option value="research">Research</option>
          <option value="nextgen">NextGen</option>
          <option value="nonresearch">Non-Research</option>
        </select>
      </div>

      <div className="filter-group">
        <label htmlFor="status-filter">Status</label>
        <select
          id="status-filter"
          value={filters.status || 'all'}
          onChange={(e) => handleStatusChange(e.target.value)}
          className="filter-select"
        >
          <option value="all">All Status</option>
          <option value="active">Active</option>
          <option value="draft">Draft</option>
          <option value="archived">Archived</option>
        </select>
      </div>
    </div>
  );
};

export default FormTemplateFilters;