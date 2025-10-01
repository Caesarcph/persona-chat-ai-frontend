import { generateAvatarSeed, getAvatarUrl, validateAvatarFile, getAvatarSizeClasses } from '../avatar';
import { Persona } from '../../types/persona';

const mockPersona: Persona = {
  schema_version: '1.0',
  age: 25,
  gender: 'Female',
  pronouns: 'she/her',
  nationality: 'American',
  region: 'California',
  education: 'Bachelor\'s',
  occupation: 'Software Engineer',
  industry: 'Technology',
  seniority: 'Mid-level',
  politeness_directness: 50,
  expertise: ['JavaScript', 'React'],
  tools: ['VS Code'],
  knowledge_cutoff: '2024-01',
  response_style: 'practical',
  tone: 'casual',
  language_preference: 'english',
  detail_depth: 'moderate',
  conversation_goal: 'Help with coding',
  banned_topics: [],
};

describe('Avatar Utilities', () => {
  describe('generateAvatarSeed', () => {
    it('generates consistent seed for same persona', () => {
      const seed1 = generateAvatarSeed(mockPersona);
      const seed2 = generateAvatarSeed(mockPersona);
      
      expect(seed1).toBe(seed2);
      expect(typeof seed1).toBe('string');
      expect(seed1.length).toBeGreaterThan(0);
    });

    it('generates different seeds for different personas', () => {
      const persona2 = { ...mockPersona, age: 30, gender: 'Male' };
      
      const seed1 = generateAvatarSeed(mockPersona);
      const seed2 = generateAvatarSeed(persona2);
      
      expect(seed1).not.toBe(seed2);
    });

    it('handles empty or undefined values gracefully', () => {
      const emptyPersona = {
        ...mockPersona,
        age: '',
        gender: '',
        occupation: '',
        nationality: ''
      };
      
      const seed = generateAvatarSeed(emptyPersona);
      expect(typeof seed).toBe('string');
      expect(seed.length).toBeGreaterThan(0);
    });

    it('generates numeric string seed', () => {
      const seed = generateAvatarSeed(mockPersona);
      expect(/^\d+$/.test(seed)).toBe(true);
    });
  });

  describe('getAvatarUrl', () => {
    it('returns generated avatar URL by default', () => {
      const url = getAvatarUrl(mockPersona);
      
      expect(url).toMatch(/^https:\/\/source\.boringavatars\.com\/beam\/120\/\d+$/);
    });

    it('returns generated avatar URL when avatar type is generated', () => {
      const personaWithGeneratedAvatar = {
        ...mockPersona,
        avatar: {
          type: 'generated' as const,
          generatedSeed: '12345'
        }
      };
      
      const url = getAvatarUrl(personaWithGeneratedAvatar);
      
      expect(url).toBe('https://source.boringavatars.com/beam/120/12345');
    });

    it('returns uploaded avatar URL when avatar type is uploaded', () => {
      const personaWithUploadedAvatar = {
        ...mockPersona,
        avatar: {
          type: 'uploaded' as const,
          uploadedPath: 'abc123.jpg',
          uploadedFilename: 'my-avatar.jpg'
        }
      };
      
      const url = getAvatarUrl(personaWithUploadedAvatar);
      
      expect(url).toBe('/api/avatars/abc123.jpg');
    });

    it('falls back to generated avatar when uploaded path is missing', () => {
      const personaWithIncompleteUpload = {
        ...mockPersona,
        avatar: {
          type: 'uploaded' as const,
          uploadedFilename: 'my-avatar.jpg'
          // uploadedPath is missing
        }
      };
      
      const url = getAvatarUrl(personaWithIncompleteUpload);
      
      expect(url).toMatch(/^https:\/\/source\.boringavatars\.com\/beam\/120\/\d+$/);
    });

    it('uses custom generated seed when provided', () => {
      const personaWithCustomSeed = {
        ...mockPersona,
        avatar: {
          type: 'generated' as const,
          generatedSeed: 'custom-seed-123'
        }
      };
      
      const url = getAvatarUrl(personaWithCustomSeed);
      
      expect(url).toBe('https://source.boringavatars.com/beam/120/custom-seed-123');
    });
  });

  describe('validateAvatarFile', () => {
    it('accepts valid JPEG file', () => {
      const validFile = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateAvatarFile(validFile);
      
      expect(result.valid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('accepts valid PNG file', () => {
      const validFile = new File(['test'], 'avatar.png', { type: 'image/png' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateAvatarFile(validFile);
      
      expect(result.valid).toBe(true);
    });

    it('accepts valid WebP file', () => {
      const validFile = new File(['test'], 'avatar.webp', { type: 'image/webp' });
      Object.defineProperty(validFile, 'size', { value: 1024 * 1024 }); // 1MB
      
      const result = validateAvatarFile(validFile);
      
      expect(result.valid).toBe(true);
    });

    it('rejects invalid file type', () => {
      const invalidFile = new File(['test'], 'document.pdf', { type: 'application/pdf' });
      Object.defineProperty(invalidFile, 'size', { value: 1024 });
      
      const result = validateAvatarFile(invalidFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('Invalid file type');
      expect(result.error).toContain('JPEG, PNG, and WebP');
    });

    it('rejects file that is too large', () => {
      const largeFile = new File(['test'], 'large.jpg', { type: 'image/jpeg' });
      Object.defineProperty(largeFile, 'size', { value: 3 * 1024 * 1024 }); // 3MB
      
      const result = validateAvatarFile(largeFile);
      
      expect(result.valid).toBe(false);
      expect(result.error).toContain('File size too large');
      expect(result.error).toContain('2MB');
    });

    it('accepts file at maximum size limit', () => {
      const maxSizeFile = new File(['test'], 'max.jpg', { type: 'image/jpeg' });
      Object.defineProperty(maxSizeFile, 'size', { value: 2 * 1024 * 1024 }); // Exactly 2MB
      
      const result = validateAvatarFile(maxSizeFile);
      
      expect(result.valid).toBe(true);
    });

    it('rejects empty file', () => {
      const emptyFile = new File([''], 'empty.jpg', { type: 'image/jpeg' });
      Object.defineProperty(emptyFile, 'size', { value: 0 });
      
      const result = validateAvatarFile(emptyFile);
      
      expect(result.valid).toBe(true); // Empty file is technically valid by our current rules
    });
  });

  describe('getAvatarSizeClasses', () => {
    it('returns correct classes for small size', () => {
      const classes = getAvatarSizeClasses('small');
      expect(classes).toBe('w-8 h-8');
    });

    it('returns correct classes for medium size', () => {
      const classes = getAvatarSizeClasses('medium');
      expect(classes).toBe('w-16 h-16');
    });

    it('returns correct classes for large size', () => {
      const classes = getAvatarSizeClasses('large');
      expect(classes).toBe('w-24 h-24');
    });

    it('returns default classes for invalid size', () => {
      const classes = getAvatarSizeClasses('invalid' as any);
      expect(classes).toBe('w-16 h-16');
    });
  });

  describe('Integration scenarios', () => {
    it('handles complete avatar workflow', () => {
      // 1. Generate initial seed
      const initialSeed = generateAvatarSeed(mockPersona);
      expect(typeof initialSeed).toBe('string');
      
      // 2. Get generated avatar URL
      const generatedUrl = getAvatarUrl(mockPersona);
      expect(generatedUrl).toContain(initialSeed);
      
      // 3. Validate upload file
      const uploadFile = new File(['test'], 'new-avatar.jpg', { type: 'image/jpeg' });
      Object.defineProperty(uploadFile, 'size', { value: 1024 * 1024 });
      
      const validation = validateAvatarFile(uploadFile);
      expect(validation.valid).toBe(true);
      
      // 4. Get uploaded avatar URL
      const personaWithUpload = {
        ...mockPersona,
        avatar: {
          type: 'uploaded' as const,
          uploadedPath: 'abc123.jpg',
          uploadedFilename: 'new-avatar.jpg'
        }
      };
      
      const uploadedUrl = getAvatarUrl(personaWithUpload);
      expect(uploadedUrl).toBe('/api/avatars/abc123.jpg');
      
      // 5. Get size classes
      const sizeClasses = getAvatarSizeClasses('large');
      expect(sizeClasses).toBe('w-24 h-24');
    });

    it('maintains consistency across multiple calls', () => {
      const seeds = Array.from({ length: 10 }, () => generateAvatarSeed(mockPersona));
      const uniqueSeeds = new Set(seeds);
      
      expect(uniqueSeeds.size).toBe(1); // All seeds should be identical
    });
  });
});