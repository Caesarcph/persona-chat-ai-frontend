import { useState, useEffect, useCallback } from 'react';
import { Persona } from '../types/persona';

export interface SafetyValidationResult {
  isValid: boolean;
  warnings: SafetyWarning[];
  errors: SafetyError[];
  requiresConfirmation: boolean;
  sensitiveFields: string[];
}

export interface SafetyWarning {
  type: 'sensitive_fields' | 'professional_context' | 'banned_topics' | 'expertise_mismatch';
  field?: string;
  message: string;
  suggestion?: string;
}

export interface SafetyError {
  type: 'missing_confirmation' | 'invalid_configuration' | 'safety_violation';
  field?: string;
  message: string;
}

export interface SafetyValidationOptions {
  allowSensitiveFields: boolean;
  strictValidation: boolean;
}

const PROFESSIONAL_CONTEXTS = {
  medical: ['doctor', 'physician', 'nurse', 'medical', 'health', 'medicine', 'therapy', 'treatment', 'healthcare'],
  legal: ['lawyer', 'attorney', 'legal', 'law', 'court', 'litigation', 'contract', 'paralegal', 'judge'],
  financial: ['financial advisor', 'accountant', 'banker', 'investment', 'finance', 'trading', 'stocks', 'cpa']
};

const SENSITIVE_FIELD_NAMES = ['race_ethnicity', 'religion', 'political_views'];

const PROBLEMATIC_BANNED_TOPICS = ['safety', 'help', 'assistance', 'emergency', 'crisis'];

export const useSafetyValidation = (options: SafetyValidationOptions) => {
  const [validationResult, setValidationResult] = useState<SafetyValidationResult>({
    isValid: true,
    warnings: [],
    errors: [],
    requiresConfirmation: false,
    sensitiveFields: []
  });

  const validatePersona = useCallback((persona: Persona): SafetyValidationResult => {
    const warnings: SafetyWarning[] = [];
    const errors: SafetyError[] = [];
    const sensitiveFields: string[] = [];

    // Check for sensitive fields
    SENSITIVE_FIELD_NAMES.forEach(fieldName => {
      const value = persona[fieldName as keyof Persona] as string;
      if (value && value.trim()) {
        sensitiveFields.push(fieldName);
        
        if (!options.allowSensitiveFields) {
          errors.push({
            type: 'safety_violation',
            field: fieldName,
            message: `Sensitive field "${fieldName.replace('_', ' ')}" is not allowed in current configuration`
          });
        } else if (!persona.sensitive_usage_confirmed) {
          errors.push({
            type: 'missing_confirmation',
            field: fieldName,
            message: 'Sensitive fields require explicit confirmation of responsible usage'
          });
        }
      }
    });

    // Check for professional context warnings
    const occupation = persona.occupation?.toLowerCase() || '';
    const expertise = persona.expertise?.join(' ').toLowerCase() || '';
    const industry = persona.industry?.toLowerCase() || '';
    
    Object.entries(PROFESSIONAL_CONTEXTS).forEach(([contextType, keywords]) => {
      const hasContext = keywords.some(keyword => 
        occupation.includes(keyword) || 
        expertise.includes(keyword) || 
        industry.includes(keyword)
      );
      
      if (hasContext) {
        warnings.push({
          type: 'professional_context',
          message: `This persona represents a ${contextType} professional. Responses will include appropriate disclaimers.`,
          suggestion: `Ensure the persona's expertise aligns with their professional background`
        });
      }
    });

    // Check for problematic banned topics
    const problematicBans = persona.banned_topics?.filter(topic => 
      PROBLEMATIC_BANNED_TOPICS.some(problematic => 
        topic.toLowerCase().includes(problematic)
      )
    ) || [];

    if (problematicBans.length > 0) {
      warnings.push({
        type: 'banned_topics',
        message: `Banned topics include safety-related terms: ${problematicBans.join(', ')}`,
        suggestion: 'Consider allowing safety-related assistance while restricting specific harmful content'
      });
    }

    // Check for expertise-occupation mismatch
    if (persona.expertise?.length > 0 && persona.occupation) {
      const expertiseStr = persona.expertise.join(' ').toLowerCase();
      const occupationStr = persona.occupation.toLowerCase();
      
      // Simple heuristic: if expertise contains very different domain than occupation
      const techKeywords = ['programming', 'software', 'coding', 'development', 'computer'];
      const medicalKeywords = ['medical', 'health', 'medicine', 'clinical'];
      const legalKeywords = ['legal', 'law', 'litigation', 'contract'];
      
      const expertiseHasTech = techKeywords.some(k => expertiseStr.includes(k));
      const expertiseHasMedical = medicalKeywords.some(k => expertiseStr.includes(k));
      const expertiseHasLegal = legalKeywords.some(k => expertiseStr.includes(k));
      
      const occupationHasTech = techKeywords.some(k => occupationStr.includes(k));
      const occupationHasMedical = medicalKeywords.some(k => occupationStr.includes(k));
      const occupationHasLegal = legalKeywords.some(k => occupationStr.includes(k));
      
      if ((expertiseHasTech && !occupationHasTech && (occupationHasMedical || occupationHasLegal)) ||
          (expertiseHasMedical && !occupationHasMedical && (occupationHasTech || occupationHasLegal)) ||
          (expertiseHasLegal && !occupationHasLegal && (occupationHasTech || occupationHasMedical))) {
        warnings.push({
          type: 'expertise_mismatch',
          message: 'Expertise areas may not align with stated occupation',
          suggestion: 'Ensure expertise matches the persona\'s professional background for consistency'
        });
      }
    }

    // Check for missing required fields in strict mode
    if (options.strictValidation) {
      const requiredFields = ['occupation', 'conversation_goal', 'expertise'];
      requiredFields.forEach(field => {
        const value = persona[field as keyof Persona];
        if (!value || (Array.isArray(value) && value.length === 0)) {
          errors.push({
            type: 'invalid_configuration',
            field,
            message: `${field.replace('_', ' ')} is required for complete persona configuration`
          });
        }
      });
    }

    const requiresConfirmation = sensitiveFields.length > 0 && !persona.sensitive_usage_confirmed;
    const isValid = errors.length === 0;

    return {
      isValid,
      warnings,
      errors,
      requiresConfirmation,
      sensitiveFields
    };
  }, [options]);

  const validatePersonaAsync = useCallback(async (persona: Persona): Promise<SafetyValidationResult> => {
    // For now, just use synchronous validation
    // In the future, this could call backend validation APIs
    return validatePersona(persona);
  }, [validatePersona]);

  const getSafetyRecommendations = useCallback((persona: Persona): string[] => {
    const recommendations: string[] = [];
    
    // Check for professional contexts
    const occupation = persona.occupation?.toLowerCase() || '';
    if (PROFESSIONAL_CONTEXTS.medical.some(k => occupation.includes(k))) {
      recommendations.push('Consider adding medical disclaimers to banned topics or conversation guidelines');
    }
    if (PROFESSIONAL_CONTEXTS.legal.some(k => occupation.includes(k))) {
      recommendations.push('Consider adding legal disclaimers to conversation guidelines');
    }
    if (PROFESSIONAL_CONTEXTS.financial.some(k => occupation.includes(k))) {
      recommendations.push('Consider adding financial disclaimers to conversation guidelines');
    }
    
    // Check for sensitive fields
    if (persona.race_ethnicity || persona.religion || persona.political_views) {
      recommendations.push('Use sensitive demographic fields responsibly and avoid stereotyping');
      recommendations.push('Consider the ethical implications of demographic-based persona simulation');
    }
    
    // Check for banned topics
    if (!persona.banned_topics || persona.banned_topics.length === 0) {
      recommendations.push('Consider adding some banned topics to prevent inappropriate conversations');
    }
    
    return recommendations;
  }, []);

  return {
    validationResult,
    validatePersona,
    validatePersonaAsync,
    getSafetyRecommendations,
    setValidationResult
  };
};

export default useSafetyValidation;