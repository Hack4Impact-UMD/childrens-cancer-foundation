import { getFormTemplates } from '../backend/form-template-service';
import { FormTemplate, GrantType } from '../types/form-template-types';

/**
 * Service for applicant-facing form operations
 * Handles the selection and routing for application forms
 */

export interface AvailableForm {
  templateId: string;
  name: string;
  grantType: GrantType;
  description?: string;
  estimatedTime?: number;
  isDynamic: boolean;
  route: string;
}

/**
 * Get all available application forms for applicants
 * Returns both dynamic and fallback static forms
 */
export const getAvailableApplicationForms = async (): Promise<AvailableForm[]> => {
  try {
    // Get active dynamic form templates
    const dynamicTemplates = await getFormTemplates({ status: 'active' });
    const activeDynamicForms = dynamicTemplates.filter(template => template.isActive);

    const availableForms: AvailableForm[] = [];

    // Check each grant type for dynamic forms
    const grantTypes: GrantType[] = ['research', 'nextgen', 'nonresearch'];
    
    for (const grantType of grantTypes) {
      const dynamicTemplate = activeDynamicForms.find(template => template.grantType === grantType);
      
      if (dynamicTemplate) {
        // Use dynamic form if available
        availableForms.push({
          templateId: dynamicTemplate.id,
          name: dynamicTemplate.name,
          grantType: dynamicTemplate.grantType,
          description: dynamicTemplate.metadata?.description,
          estimatedTime: dynamicTemplate.metadata?.estimatedTime,
          isDynamic: true,
          route: `/applicant/application-form/dynamic/${grantType}`
        });
      } else {
        // Fallback to static form
        const staticFormInfo = getStaticFormInfo(grantType);
        if (staticFormInfo) {
          availableForms.push(staticFormInfo);
        }
      }
    }

    return availableForms;
  } catch (error) {
    console.error('Error fetching available forms:', error);
    
    // Return static forms as fallback
    return [
      getStaticFormInfo('research'),
      getStaticFormInfo('nextgen'),
      getStaticFormInfo('nonresearch')
    ].filter(Boolean) as AvailableForm[];
  }
};

/**
 * Get static form information for fallback
 */
const getStaticFormInfo = (grantType: GrantType): AvailableForm | null => {
  switch (grantType) {
    case 'research':
      return {
        templateId: 'static-research',
        name: 'Research Grant Application',
        grantType: 'research',
        description: 'Traditional research grant application form',
        estimatedTime: 45,
        isDynamic: false,
        route: '/applicant/application-form/dynamic/research'
      };
    case 'nextgen':
      return {
        templateId: 'static-nextgen',
        name: 'NextGen Grant Application',
        grantType: 'nextgen',
        description: 'NextGen grant application form for innovative research',
        estimatedTime: 40,
        isDynamic: false,
        route: '/applicant/application-form/dynamic/nextgen'
      };
    case 'nonresearch':
      return {
        templateId: 'static-nonresearch',
        name: 'Non-Research Grant Application',
        grantType: 'nonresearch',
        description: 'Non-research grant application form for programs and initiatives',
        estimatedTime: 30,
        isDynamic: false,
        route: '/applicant/application-form/dynamic/nonresearch'
      };
    default:
      return null;
  }
};

/**
 * Get the appropriate form route for a specific grant type
 */
export const getFormRouteForGrantType = async (grantType: GrantType): Promise<string> => {
  try {
    const availableForms = await getAvailableApplicationForms();
    const form = availableForms.find(f => f.grantType === grantType);
    return form?.route || `/applicant/application-form/dynamic/${grantType}`;
  } catch (error) {
    console.error('Error getting form route:', error);
    // Fallback to dynamic route
    return `/applicant/application-form/dynamic/${grantType}`;
  }
};

/**
 * Check if dynamic forms are available for a grant type
 */
export const isDynamicFormAvailable = async (grantType: GrantType): Promise<boolean> => {
  try {
    const availableForms = await getAvailableApplicationForms();
    const form = availableForms.find(f => f.grantType === grantType);
    return form?.isDynamic || false;
  } catch (error) {
    console.error('Error checking dynamic form availability:', error);
    return false;
  }
};

/**
 * Get active form template for a grant type
 */
export const getActiveFormTemplate = async (grantType: GrantType): Promise<FormTemplate | null> => {
  try {
    const dynamicTemplates = await getFormTemplates({ 
      grantType: grantType,
      status: 'active' 
    });
    
    const activeTemplate = dynamicTemplates.find(template => 
      template.grantType === grantType && template.isActive
    );
    
    return activeTemplate || null;
  } catch (error) {
    console.error('Error getting active form template:', error);
    return null;
  }
};
