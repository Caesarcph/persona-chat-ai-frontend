import { Persona } from '../types/persona';

// Generate a consistent seed for boring avatars based on persona data
export const generateAvatarSeed = (persona: Persona): string => {
  const seedData = [
    persona.age?.toString() || '',
    persona.gender || '',
    persona.occupation || '',
    persona.nationality || ''
  ].join('-');
  
  // Simple hash function to create consistent seed
  let hash = 0;
  for (let i = 0; i < seedData.length; i++) {
    const char = seedData.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  
  return Math.abs(hash).toString();
};

// Get avatar URL for display
export const getAvatarUrl = (persona: Persona): string => {
  if (!persona.avatar) {
    // Default to generated avatar
    const seed = generateAvatarSeed(persona);
    return `https://source.boringavatars.com/beam/120/${seed}`;
  }
  
  if (persona.avatar.type === 'uploaded' && persona.avatar.uploadedPath) {
    return `/api/avatars/${persona.avatar.uploadedPath}`;
  }
  
  // Generated avatar
  const seed = persona.avatar.generatedSeed || generateAvatarSeed(persona);
  return `https://source.boringavatars.com/beam/120/${seed}`;
};

// Validate file for avatar upload
export const validateAvatarFile = (file: File): { valid: boolean; error?: string } => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  const maxSize = 2 * 1024 * 1024; // 2MB
  
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: 'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
    };
  }
  
  if (file.size > maxSize) {
    return {
      valid: false,
      error: 'File size too large. Maximum size is 2MB.'
    };
  }
  
  return { valid: true };
};

// Get size classes for different avatar sizes
export const getAvatarSizeClasses = (size: 'small' | 'medium' | 'large'): string => {
  switch (size) {
    case 'small':
      return 'w-8 h-8';
    case 'medium':
      return 'w-16 h-16';
    case 'large':
      return 'w-24 h-24';
    default:
      return 'w-16 h-16';
  }
};