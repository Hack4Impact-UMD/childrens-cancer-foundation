import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
  Box,
  Container,
  Typography,
  Button,
  Card,
  CardContent,
  TextField,
  InputAdornment,
  Paper,
  Chip,
  CircularProgress,
  Fade,
  useTheme,
  useMediaQuery
} from '@mui/material';
import {
  Add as AddIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  CheckCircle as CheckCircleIcon,
  Edit as EditIcon,
  Archive as ArchiveIcon
} from '@mui/icons-material';
import Sidebar from '../../components/sidebar/Sidebar';
import { getSidebarbyRole } from '../../types/sidebar-types';
import { FormTemplate, FormTemplateFilter, GrantType } from '../../types/form-template-types';
import { getFormTemplates, deleteFormTemplate, activateFormTemplate } from '../../backend/form-template-service';
import FormTemplateCard from './components/FormTemplateCard';
import FormTemplateFilters from './components/FormTemplateFilters';
import CreateTemplateModal from './components/CreateTemplateModal';
import SampleFormsGenerator from './components/SampleFormsGenerator';
import BaseFormsGenerator from './components/BaseFormsGenerator';
import FixTemplateIds from './components/FixTemplateIds';
import FormTemplateEditor from './FormTemplateEditor';
import { toast } from 'react-toastify';

const FormBuilderPage: React.FC = () => {
  const navigate = useNavigate();
  const { templateId } = useParams<{ templateId: string }>();
  const sidebarItems = getSidebarbyRole('admin');
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  
  const [templates, setTemplates] = useState<FormTemplate[]>([]);
  const [filteredTemplates, setFilteredTemplates] = useState<FormTemplate[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filters, setFilters] = useState<FormTemplateFilter>({
    grantType: 'all',
    status: 'all'
  });
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    loadTemplates();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [templates, searchTerm, filters]);

  useEffect(() => {
    // If we have a templateId in the URL, this is an edit or preview page
    if (templateId) {
      // For now, we'll show a placeholder. In a full implementation,
      // this would load the specific template for editing
      console.log('Edit/Preview mode for template:', templateId);
    }
  }, [templateId]);

  const loadTemplates = async () => {
    try {
      setLoading(true);
      const fetchedTemplates = await getFormTemplates();
      setTemplates(fetchedTemplates);
    } catch (error) {
      console.error('Error loading templates:', error);
      toast.error('Failed to load form templates');
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...templates];

    // Apply search filter
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      filtered = filtered.filter(template =>
        template.name.toLowerCase().includes(search) ||
        template.metadata?.description?.toLowerCase().includes(search)
      );
    }

    // Apply grant type filter
    if (filters.grantType && filters.grantType !== 'all') {
      filtered = filtered.filter(template => template.grantType === filters.grantType);
    }

    // Apply status filter
    if (filters.status && filters.status !== 'all') {
      switch (filters.status) {
        case 'active':
          filtered = filtered.filter(template => template.isActive);
          break;
        case 'draft':
          filtered = filtered.filter(template => !template.isPublished);
          break;
        case 'archived':
          filtered = filtered.filter(template => !template.isActive && template.isPublished);
          break;
      }
    }

    setFilteredTemplates(filtered);
  };

  const handleCreateTemplate = () => {
    setShowCreateModal(true);
  };

  const handleEditTemplate = (templateId: string) => {
    navigate(`/admin/form-builder/edit/${templateId}`);
  };

  const handlePreviewTemplate = (templateId: string) => {
    navigate(`/admin/form-builder/preview/${templateId}`);
  };

  const handleDuplicateTemplate = async (templateId: string) => {
    try {
      // This would be implemented to duplicate a template
      toast.info('Duplicate functionality coming soon');
    } catch (error) {
      console.error('Error duplicating template:', error);
      toast.error('Failed to duplicate template');
    }
  };

  const handleDeleteTemplate = async (templateId: string) => {
    if (!window.confirm('Are you sure you want to delete this template? This action cannot be undone.')) {
      return;
    }

    try {
      await deleteFormTemplate(templateId);
      await loadTemplates();
      toast.success('Template deleted successfully');
    } catch (error) {
      console.error('Error deleting template:', error);
      toast.error('Failed to delete template');
    }
  };

  const handleActivateTemplate = async (templateId: string) => {
    try {
      await activateFormTemplate(templateId);
      await loadTemplates();
      toast.success('Template activated successfully');
    } catch (error) {
      console.error('Error activating template:', error);
      toast.error('Failed to activate template');
    }
  };

  const handleCreateModalClose = () => {
    setShowCreateModal(false);
  };

  const handleTemplateCreated = (templateId: string) => {
    setShowCreateModal(false);
    navigate(`/admin/form-builder/edit/${templateId}`);
  };

  const getStatusStats = () => {
    const stats = {
      total: templates.length,
      active: templates.filter(t => t.isActive).length,
      draft: templates.filter(t => !t.isPublished).length,
      archived: templates.filter(t => !t.isActive && t.isPublished).length
    };
    return stats;
  };

  const stats = getStatusStats();

  // Check if any templates have invalid IDs (empty, null, or just whitespace)
  const hasInvalidIds = templates.some(template => 
    !template.id || template.id.trim() === '' || template.id === ' '
  );

  // Show edit/preview mode
  if (templateId) {
    return <FormTemplateEditor />;
  }

  if (loading) {
    return (
      <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
        <Sidebar links={sidebarItems} />
        <Box sx={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Box sx={{ textAlign: 'center' }}>
            <CircularProgress size={60} sx={{ color: '#003e83', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              Loading form templates...
            </Typography>
          </Box>
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f3f4f6' }}>
      <Sidebar links={sidebarItems} />
      
      <Box sx={{ flex: 1, ml: { xs: 0, md: '280px' } }}>
        {/* Header */}
        <Paper 
          elevation={2} 
          sx={{ 
            p: 3, 
            mb: 3, 
            backgroundColor: '#F0C567',
            borderRadius: 2
          }}
        >
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 2 }}>
            <Box>
              <Typography 
                variant="h3" 
                component="h1" 
                sx={{ 
                  color: '#BE0019', 
                  fontWeight: 'bold',
                  mb: 1,
                  fontSize: { xs: '2rem', md: '2.5rem' }
                }}
              >
                Form Builder
              </Typography>
              <Typography variant="h6" color="text.secondary">
                Create and manage dynamic grant application forms
              </Typography>
            </Box>
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={handleCreateTemplate}
              sx={{
                backgroundColor: '#003e83',
                color: 'white',
                px: 3,
                py: 1.5,
                fontSize: '1rem',
                fontWeight: 'bold',
                borderRadius: 2,
                '&:hover': {
                  backgroundColor: '#002a5c',
                }
              }}
            >
              Create New Template
            </Button>
          </Box>
        </Paper>

        <Container maxWidth="xl" sx={{ px: { xs: 2, md: 3 } }}>
          {/* Stats Cards */}
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: { xs: 'repeat(2, 1fr)', sm: 'repeat(4, 1fr)' },
            gap: 3, 
            mb: 4 
          }}>
            <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'white' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#003e83', fontWeight: 'bold', mb: 1 }}>
                  {stats.total}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Total Templates
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'white' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#28a745', fontWeight: 'bold', mb: 1 }}>
                  {stats.active}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Active
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'white' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#ffc107', fontWeight: 'bold', mb: 1 }}>
                  {stats.draft}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Drafts
                </Typography>
              </CardContent>
            </Card>
            <Card sx={{ textAlign: 'center', p: 2, backgroundColor: 'white' }}>
              <CardContent>
                <Typography variant="h3" sx={{ color: '#6c757d', fontWeight: 'bold', mb: 1 }}>
                  {stats.archived}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ textTransform: 'uppercase', fontWeight: 'bold' }}>
                  Archived
                </Typography>
              </CardContent>
            </Card>
          </Box>

          {/* Search and Filters */}
          <Paper elevation={1} sx={{ p: 3, mb: 4, backgroundColor: 'white' }}>
            <Box sx={{ 
              display: 'flex', 
              flexDirection: { xs: 'column', md: 'row' },
              gap: 3, 
              alignItems: { xs: 'stretch', md: 'center' }
            }}>
              <Box sx={{ flex: 1 }}>
                <TextField
                  fullWidth
                  placeholder="Search templates..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon sx={{ color: '#003e83' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2,
                    }
                  }}
                />
              </Box>
              <Box sx={{ minWidth: { xs: '100%', md: '300px' } }}>
                <FormTemplateFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </Box>
            </Box>
          </Paper>

          {/* Utility Components */}
          {templates.length === 0 && (
            <Fade in={true}>
              <Box sx={{ mb: 4 }}>
                <BaseFormsGenerator onFormsCreated={loadTemplates} />
              </Box>
            </Fade>
          )}

          {hasInvalidIds && (
            <Fade in={true}>
              <Box sx={{ mb: 4 }}>
                <FixTemplateIds onFixed={loadTemplates} />
              </Box>
            </Fade>
          )}

          {/* Templates Grid */}
          {filteredTemplates.length === 0 ? (
            <Paper 
              elevation={1} 
              sx={{ 
                p: 6, 
                textAlign: 'center', 
                backgroundColor: 'white',
                borderRadius: 2
              }}
            >
              <DescriptionIcon sx={{ fontSize: 64, color: '#6c757d', mb: 2 }} />
              <Typography variant="h4" sx={{ color: '#003e83', mb: 2, fontWeight: 'bold' }}>
                No templates found
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 500, mx: 'auto' }}>
                {templates.length === 0
                  ? 'Get started by generating sample forms or creating your first template.'
                  : 'Try adjusting your search criteria or filters.'
                }
              </Typography>
              {templates.length === 0 && (
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={handleCreateTemplate}
                  sx={{
                    backgroundColor: '#003e83',
                    color: 'white',
                    px: 4,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 'bold',
                    borderRadius: 2,
                    '&:hover': {
                      backgroundColor: '#002a5c',
                    }
                  }}
                >
                  Create Your First Template
                </Button>
              )}
            </Paper>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)', lg: 'repeat(3, 1fr)' },
              gap: 3 
            }}>
              {filteredTemplates.map((template, index) => (
                <Fade in={true} timeout={300 + index * 100} key={template.id}>
                  <Box>
                    <FormTemplateCard
                      template={template}
                      onEdit={handleEditTemplate}
                      onPreview={handlePreviewTemplate}
                      onDuplicate={handleDuplicateTemplate}
                      onDelete={handleDeleteTemplate}
                      onActivate={handleActivateTemplate}
                    />
                  </Box>
                </Fade>
              ))}
            </Box>
          )}
        </Container>
      </Box>

      {showCreateModal && (
        <CreateTemplateModal
          isOpen={showCreateModal}
          onClose={handleCreateModalClose}
          onTemplateCreated={handleTemplateCreated}
        />
      )}
    </Box>
  );
};

export default FormBuilderPage;
