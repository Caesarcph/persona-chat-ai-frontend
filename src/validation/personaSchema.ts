import { z } from 'zod';

export const PersonaSchema = z.object({
  schema_version: z.string().default('1.0'),
  
  // Basic Demographics
  age: z.union([z.number().min(0).max(120), z.string().min(1)]),
  gender: z.string().min(1, 'Gender is required'),
  pronouns: z.string().min(1, 'Pronouns are required'),
  nationality: z.string().min(1, 'Nationality is required'),
  region: z.string().min(1, 'Region is required'),
  education: z.string().min(1, 'Education is required'),
  occupation: z.string().min(1, 'Occupation is required'),
  industry: z.string().min(1, 'Industry is required'),
  seniority: z.string().min(1, 'Seniority is required'),
  income_range: z.string(),
  
  // Personality & Psychology
  mbti: z.string().regex(/^[IE][SN][TF][JP]$/, 'Invalid MBTI format').optional().or(z.literal('')),
  big5: z.object({
    openness: z.number().min(0).max(100),
    conscientiousness: z.number().min(0).max(100),
    extraversion: z.number().min(0).max(100),
    agreeableness: z.number().min(0).max(100),
    neuroticism: z.number().min(0).max(100),
  }),
  enneagram: z.string().regex(/^[1-9]w?[0-9]?$/, 'Invalid Enneagram format').optional().or(z.literal('')),
  risk_preference: z.enum(['low', 'medium', 'high']).optional(),
  decision_style: z.enum(['analytical', 'intuitive', 'collaborative', 'decisive']).optional(),
  humor: z.enum(['dry', 'playful', 'witty', 'serious', 'none']).optional(),
  politeness_directness: z.number().min(0).max(100),
  
  // Knowledge & Experience
  expertise: z.array(z.string()).min(1, 'At least one expertise area is required'),
  tools: z.array(z.string()),
  certifications: z.array(z.string()),
  knowledge_cutoff: z.string().regex(/^\d{4}-\d{2}$/, 'Format should be YYYY-MM'),
  information_sources: z.array(z.string()),
  
  // Communication Preferences
  response_style: z.enum(['academic', 'practical', 'storytelling', 'bullet_points', 'socratic']),
  tone: z.enum(['formal', 'casual', 'playful', 'serious', 'encouraging', 'neutral']),
  language_preference: z.enum(['english', 'chinese', 'bilingual']),
  detail_depth: z.enum(['concise', 'moderate', 'detailed']),
  structure_preference: z.array(z.string()),
  
  // Contextual Variables
  conversation_goal: z.string().min(1, 'Conversation goal is required'),
  time_pressure: z.enum(['low', 'medium', 'high']).optional(),
  budget_constraints: z.string(),
  compliance_requirements: z.array(z.string()),
  cultural_considerations: z.array(z.string()),
  
  // Avatar Configuration
  avatar: z.object({
    type: z.enum(['generated', 'uploaded']),
    generatedSeed: z.string().optional(),
    uploadedPath: z.string().optional(),
    uploadedFilename: z.string().optional(),
  }).optional(),
  
  // Safety & Restrictions
  banned_topics: z.array(z.string()),
  sensitive_handling: z.enum(['strict', 'moderate', 'relaxed']).optional(),
  disclaimers: z.array(z.string()),
  
  // Sensitive Fields (optional)
  race_ethnicity: z.string().optional(),
  religion: z.string().optional(),
  political_views: z.string().optional(),
  sensitive_usage_confirmed: z.boolean().optional(),
}).refine((data) => {
  // If sensitive fields are present, confirmation must be true
  const hasSensitiveFields = data.race_ethnicity || data.religion || data.political_views;
  return !hasSensitiveFields || data.sensitive_usage_confirmed === true;
}, {
  message: "Sensitive fields require explicit usage confirmation",
  path: ["sensitive_usage_confirmed"]
});

export type PersonaFormData = z.infer<typeof PersonaSchema>;

export const getDefaultPersona = (): PersonaFormData => ({
  schema_version: '1.0',
  
  // Basic Demographics - provide sensible defaults
  age: '30',
  gender: 'Prefer not to say',
  pronouns: 'they/them',
  nationality: 'Global',
  region: 'International',
  education: 'bachelors',
  occupation: 'Professional',
  industry: 'Technology',
  seniority: 'mid',
  income_range: '',
  
  // Personality & Psychology
  mbti: '',
  big5: {
    openness: 50,
    conscientiousness: 50,
    extraversion: 50,
    agreeableness: 50,
    neuroticism: 50,
  },
  enneagram: '',
  risk_preference: 'medium' as const,
  decision_style: 'analytical' as const,
  humor: 'none' as const,
  politeness_directness: 50,
  
  // Knowledge & Experience
  expertise: ['General Knowledge'],
  tools: [],
  certifications: [],
  knowledge_cutoff: new Date().toISOString().slice(0, 7), // Current YYYY-MM
  information_sources: [],
  
  // Communication Preferences
  response_style: 'practical' as const,
  tone: 'neutral' as const,
  language_preference: 'english' as const,
  detail_depth: 'moderate' as const,
  structure_preference: [],
  
  // Contextual Variables
  conversation_goal: 'Provide helpful and informative responses to user questions and engage in meaningful conversation.',
  time_pressure: 'medium' as const,
  budget_constraints: '',
  compliance_requirements: [],
  cultural_considerations: [],
  
  // Safety & Restrictions
  banned_topics: [],
  sensitive_handling: 'moderate' as const,
  disclaimers: [],
  
  // Sensitive Fields
  race_ethnicity: '',
  religion: '',
  political_views: '',
  sensitive_usage_confirmed: false,
});