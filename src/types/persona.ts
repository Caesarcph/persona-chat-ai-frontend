export interface Persona {
  schema_version: string;
  
  // Basic Demographics
  age: number | string;
  gender: string;
  pronouns: string;
  nationality: string;
  region: string;
  education: string;
  occupation: string;
  industry: string;
  seniority: string;
  income_range?: string;
  
  // Personality & Psychology
  mbti?: string;
  big5?: {
    openness: number;
    conscientiousness: number;
    extraversion: number;
    agreeableness: number;
    neuroticism: number;
  };
  enneagram?: string;
  risk_preference?: string;
  decision_style?: string;
  humor?: string;
  politeness_directness: number;
  
  // Knowledge & Experience
  expertise: string[];
  tools: string[];
  certifications?: string[];
  knowledge_cutoff: string;
  information_sources?: string[];
  
  // Communication Preferences
  response_style: string;
  tone: string;
  language_preference: string;
  detail_depth: string;
  structure_preference?: string[];
  
  // Contextual Variables
  conversation_goal: string;
  time_pressure?: string;
  budget_constraints?: string;
  compliance_requirements?: string[];
  cultural_considerations?: string[];
  
  // Safety & Restrictions
  banned_topics: string[];
  sensitive_handling?: string;
  disclaimers?: string[];
  
  // Avatar Configuration
  avatar?: {
    type: 'generated' | 'uploaded';
    generatedSeed?: string; // For Boring Avatars
    uploadedPath?: string; // Server file path
    uploadedFilename?: string; // Original filename for display
  };
  
  // Sensitive Fields (optional)
  race_ethnicity?: string;
  religion?: string;
  political_views?: string;
  sensitive_usage_confirmed?: boolean;
}

export interface PersonaBuilderProps {
  persona: Persona | null;
  onPersonaChange: (persona: Persona) => void;
  sensitiveFieldsEnabled: boolean;
}

export interface SensitiveFieldsDialogProps {
  isOpen: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  fields: string[];
}

export interface AvatarConfig {
  type: 'generated' | 'uploaded';
  generatedSeed: string;
  uploadedPath?: string;
  uploadedFilename?: string;
}

export interface AvatarComponentProps {
  persona: Persona;
  size: 'small' | 'medium' | 'large';
  uploadEnabled: boolean;
  onAvatarChange?: (avatar: AvatarConfig) => void;
  onAvatarUpload?: (file: File) => Promise<void>;
}

export interface AvatarUploadResponse {
  success: boolean;
  filePath?: string;
  filename?: string;
  error?: string;
}

export interface SavedPersona {
  id: string;
  name: string;
  persona: Persona;
  created_at: string;
  updated_at?: string;
  is_template: boolean;
  description?: string;
  tags?: string[];
}

export interface PersonaFormData extends Persona {
  // Additional form-specific fields if needed
}

export interface TemplateImportExportProps {
  isOpen: boolean;
  mode: 'import' | 'export';
  onClose: () => void;
}

export interface TemplateSelectorProps {
  isOpen: boolean;
  onTemplateSelect: (templateId: string) => void;
  onClose: () => void;
}