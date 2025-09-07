import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Sidebar from '../../components/sidebar/Sidebar';
import { getSidebarbyRole } from '../../types/sidebar-types';
import { FormTemplate, FormPage, FormField, FieldType } from '../../types/form-template-types';
import { getFormTemplate, updateFormTemplate } from '../../backend/form-template-service';
import FormPageEditor from './components/FormPageEditor';
import FormFieldEditor from './components/FormFieldEditor';
import FormPreview from './components/FormPreview';
import { toast } from 'react-toastify';
import './FormTemplateEditor.css';
import { 
  FaSave, 
  FaEye, 
  FaPlus, 
  FaTrash, 
  FaArrowUp, 
  FaArrowDown,
  FaArrowLeft,
  FaCopy
} from 'react-icons/fa';

const FormTemplateEditor: React.FC = () => {
  const { templateId } = useParams<{ templateId: string }>();
  const navigate = useNavigate();
  const sidebarItems = getSidebarbyRole('admin');

  const [template, setTemplate] = useState<FormTemplate | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [selectedPageId, setSelectedPageId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    if (templateId) {
      loadTemplate();
    }
  }, [templateId]);

  const loadTemplate = async () => {
    if (!templateId) return;
    
    try {
      setLoading(true);
      const fetchedTemplate = await getFormTemplate(templateId);
      if (fetchedTemplate) {
        setTemplate(fetchedTemplate);
        if (fetchedTemplate.pages.length > 0) {
          setSelectedPageId(fetchedTemplate.pages[0].id);
        }
      } else {
        toast.error('Template not found');
        navigate('/admin/form-builder');
      }
    } catch (error) {
      console.error('Error loading template:', error);
      toast.error('Failed to load template');
      navigate('/admin/form-builder');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!template || !templateId) return;

    setSaving(true);
    try {
      await updateFormTemplate(templateId, template, 'admin@example.com');
      setHasUnsavedChanges(false);
      toast.success('Template saved successfully!');
    } catch (error) {
      console.error('Error saving template:', error);
      toast.error('Failed to save template');
    } finally {
      setSaving(false);
    }
  };

  const handleTemplateChange = (updates: Partial<FormTemplate>) => {
    if (!template) return;
    setTemplate({ ...template, ...updates });
    setHasUnsavedChanges(true);
  };

  const handleAddPage = () => {
    if (!template) return;

    const newPage: FormPage = {
      id: `page-${Date.now()}`,
      title: 'New Page',
      description: '',
      order: template.pages.length + 1,
      fields: [],
      metadata: {
        instructions: ''
      }
    };

    handleTemplateChange({
      pages: [...template.pages, newPage]
    });
    setSelectedPageId(newPage.id);
  };

  const handleDeletePage = (pageId: string) => {
    if (!template || template.pages.length <= 1) {
      toast.error('Cannot delete the last page');
      return;
    }

    if (!window.confirm('Are you sure you want to delete this page?')) return;

    const updatedPages = template.pages.filter(page => page.id !== pageId);
    // Reorder pages
    updatedPages.forEach((page, index) => {
      page.order = index + 1;
    });

    handleTemplateChange({ pages: updatedPages });
    
    if (selectedPageId === pageId) {
      setSelectedPageId(updatedPages[0]?.id || null);
    }
  };

  const handlePageChange = (pageId: string, updates: Partial<FormPage>) => {
    if (!template) return;

    const updatedPages = template.pages.map(page =>
      page.id === pageId ? { ...page, ...updates } : page
    );

    handleTemplateChange({ pages: updatedPages });
  };

  const handleMovePageUp = (pageId: string) => {
    if (!template) return;

    const pageIndex = template.pages.findIndex(p => p.id === pageId);
    if (pageIndex <= 0) return;

    const updatedPages = [...template.pages];
    [updatedPages[pageIndex], updatedPages[pageIndex - 1]] = 
    [updatedPages[pageIndex - 1], updatedPages[pageIndex]];

    // Update order numbers
    updatedPages.forEach((page, index) => {
      page.order = index + 1;
    });

    handleTemplateChange({ pages: updatedPages });
  };

  const handleMovePageDown = (pageId: string) => {
    if (!template) return;

    const pageIndex = template.pages.findIndex(p => p.id === pageId);
    if (pageIndex >= template.pages.length - 1) return;

    const updatedPages = [...template.pages];
    [updatedPages[pageIndex], updatedPages[pageIndex + 1]] = 
    [updatedPages[pageIndex + 1], updatedPages[pageIndex]];

    // Update order numbers
    updatedPages.forEach((page, index) => {
      page.order = index + 1;
    });

    handleTemplateChange({ pages: updatedPages });
  };

  const handleAddField = (pageId: string) => {
    if (!template) return;

    const page = template.pages.find(p => p.id === pageId);
    if (!page) return;

    const newField: FormField = {
      id: `field-${Date.now()}`,
      type: 'text',
      label: 'New Field',
      placeholder: '',
      required: false,
      order: page.fields.length + 1,
      width: 'full'
    };

    const updatedFields = [...page.fields, newField];
    handlePageChange(pageId, { fields: updatedFields });
    setSelectedFieldId(newField.id);
  };

  const handleFieldChange = (pageId: string, fieldId: string, updates: Partial<FormField>) => {
    if (!template) return;

    const updatedPages = template.pages.map(page => {
      if (page.id === pageId) {
        const updatedFields = page.fields.map(field =>
          field.id === fieldId ? { ...field, ...updates } : field
        );
        return { ...page, fields: updatedFields };
      }
      return page;
    });

    handleTemplateChange({ pages: updatedPages });
  };

  const handleDeleteField = (pageId: string, fieldId: string) => {
    if (!template || !window.confirm('Are you sure you want to delete this field?')) return;

    const updatedPages = template.pages.map(page => {
      if (page.id === pageId) {
        const updatedFields = page.fields.filter(field => field.id !== fieldId);
        // Reorder fields
        updatedFields.forEach((field, index) => {
          field.order = index + 1;
        });
        return { ...page, fields: updatedFields };
      }
      return page;
    });

    handleTemplateChange({ pages: updatedPages });
    
    if (selectedFieldId === fieldId) {
      setSelectedFieldId(null);
    }
  };

  const handleDuplicateField = (pageId: string, fieldId: string) => {
    if (!template) return;

    const page = template.pages.find(p => p.id === pageId);
    const field = page?.fields.find(f => f.id === fieldId);
    if (!page || !field) return;

    const duplicatedField: FormField = {
      ...field,
      id: `field-${Date.now()}`,
      label: `${field.label} (Copy)`,
      order: field.order + 1
    };

    const updatedFields = [...page.fields];
    updatedFields.splice(field.order, 0, duplicatedField);
    
    // Reorder fields
    updatedFields.forEach((field, index) => {
      field.order = index + 1;
    });

    handlePageChange(pageId, { fields: updatedFields });
  };

  const getCurrentPage = () => {
    if (!template || !selectedPageId) return null;
    return template.pages.find(page => page.id === selectedPageId);
  };

  const getCurrentField = () => {
    const currentPage = getCurrentPage();
    if (!currentPage || !selectedFieldId) return null;
    return currentPage.fields.find(field => field.id === selectedFieldId);
  };

  if (loading) {
    return (
      <div className="form-template-editor">
        <Sidebar links={sidebarItems} />
        <div className="main-content">
          <div className="loading-container">
            <div className="loading-spinner"></div>
            <p>Loading template...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!template) {
    return (
      <div className="form-template-editor">
        <Sidebar links={sidebarItems} />
        <div className="main-content">
          <div className="error-container">
            <h2>Template Not Found</h2>
            <button onClick={() => navigate('/admin/form-builder')}>
              Return to Form Builder
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (showPreview) {
    return (
      <FormPreview 
        template={template}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <div className="form-template-editor">
      <Sidebar links={sidebarItems} />
      
      <div className="editor-content">
        {/* Header */}
        <div className="editor-header">
          <div className="header-left">
            <button 
              onClick={() => navigate('/admin/form-builder')}
              className="back-btn"
            >
              <FaArrowLeft /> Back
            </button>
            <div className="template-info">
              <h1>{template.name}</h1>
              <span className="template-version">Version {template.version}</span>
              {hasUnsavedChanges && <span className="unsaved-indicator">• Unsaved changes</span>}
            </div>
          </div>
          
          <div className="header-actions">
            <button 
              onClick={() => setShowPreview(true)}
              className="preview-btn"
            >
              <FaEye /> Preview
            </button>
            <button 
              onClick={handleSave}
              disabled={saving || !hasUnsavedChanges}
              className="save-btn"
            >
              {saving ? 'Saving...' : <><FaSave /> Save</>}
            </button>
          </div>
        </div>

        <div className="editor-body">
          {/* Pages Panel */}
          <div className="pages-panel">
            <div className="panel-header">
              <h3>Pages</h3>
              <button onClick={handleAddPage} className="add-btn">
                <FaPlus /> Add Page
              </button>
            </div>
            
            <div className="pages-list">
              {template.pages.map((page, index) => (
                <div 
                  key={page.id}
                  className={`page-item ${selectedPageId === page.id ? 'selected' : ''}`}
                  onClick={() => setSelectedPageId(page.id)}
                >
                  <div className="page-info">
                    <div className="page-number">{index + 1}</div>
                    <div className="page-details">
                      <div className="page-title">{page.title}</div>
                      <div className="page-meta">{page.fields.length} fields</div>
                    </div>
                  </div>
                  
                  <div className="page-actions">
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMovePageUp(page.id); }}
                      disabled={index === 0}
                      className="move-btn"
                    >
                      <FaArrowUp />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleMovePageDown(page.id); }}
                      disabled={index === template.pages.length - 1}
                      className="move-btn"
                    >
                      <FaArrowDown />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); handleDeletePage(page.id); }}
                      className="delete-btn"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Main Editor */}
          <div className="main-editor">
            {getCurrentPage() && (
              <FormPageEditor
                page={getCurrentPage()!}
                onPageChange={(updates) => handlePageChange(selectedPageId!, updates)}
                onAddField={() => handleAddField(selectedPageId!)}
                onFieldSelect={setSelectedFieldId}
                onFieldChange={(fieldId, updates) => handleFieldChange(selectedPageId!, fieldId, updates)}
                onDeleteField={(fieldId) => handleDeleteField(selectedPageId!, fieldId)}
                onDuplicateField={(fieldId) => handleDuplicateField(selectedPageId!, fieldId)}
                selectedFieldId={selectedFieldId}
              />
            )}
          </div>

          {/* Properties Panel */}
          <div className="properties-panel">
            <div className="panel-header">
              <h3>Properties</h3>
            </div>
            
            <div className="properties-content">
              {getCurrentField() ? (
                <FormFieldEditor
                  field={getCurrentField()!}
                  onFieldChange={(updates) => handleFieldChange(selectedPageId!, selectedFieldId!, updates)}
                />
              ) : getCurrentPage() ? (
                <div className="page-properties">
                  <h4>Page Properties</h4>
                  <div className="form-group">
                    <label>Page Title</label>
                    <input
                      type="text"
                      value={getCurrentPage()!.title}
                      onChange={(e) => handlePageChange(selectedPageId!, { title: e.target.value })}
                      className="form-input"
                    />
                  </div>
                  <div className="form-group">
                    <label>Description</label>
                    <textarea
                      value={getCurrentPage()!.description || ''}
                      onChange={(e) => handlePageChange(selectedPageId!, { description: e.target.value })}
                      className="form-textarea"
                      rows={3}
                    />
                  </div>
                  <div className="form-group">
                    <label>Instructions</label>
                    <textarea
                      value={getCurrentPage()!.metadata?.instructions || ''}
                      onChange={(e) => handlePageChange(selectedPageId!, { 
                        metadata: { 
                          ...getCurrentPage()!.metadata,
                          instructions: e.target.value 
                        }
                      })}
                      className="form-textarea"
                      rows={4}
                    />
                  </div>
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select a page or field to edit its properties</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FormTemplateEditor;
