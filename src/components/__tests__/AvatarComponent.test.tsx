import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AvatarComponent from '../AvatarComponent';
import { Persona } from '../../types/persona';

// Mock fetch
global.fetch = jest.fn();

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

const mockOnAvatarChange = jest.fn();
const mockOnAvatarUpload = jest.fn();

describe('AvatarComponent', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockClear();
  });

  it('renders with generated avatar by default', () => {
    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    expect(screen.getByAltText('Avatar')).toBeInTheDocument();
    expect(screen.getByText('Generated Avatar')).toBeInTheDocument();
    expect(screen.getByText('Generate New')).toBeInTheDocument();
    expect(screen.getByText('Upload Image')).toBeInTheDocument();
  });

  it('renders with uploaded avatar when configured', () => {
    const personaWithUploadedAvatar = {
      ...mockPersona,
      avatar: {
        type: 'uploaded' as const,
        uploadedPath: 'abc123.jpg',
        uploadedFilename: 'my-avatar.jpg'
      }
    };

    render(
      <AvatarComponent
        persona={personaWithUploadedAvatar}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    expect(screen.getByText('Uploaded Avatar')).toBeInTheDocument();
    expect(screen.getByText('Use Generated')).toBeInTheDocument();
  });

  it('hides controls for small size', () => {
    render(
      <AvatarComponent
        persona={mockPersona}
        size="small"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    expect(screen.queryByText('Generate New')).not.toBeInTheDocument();
    expect(screen.queryByText('Upload Image')).not.toBeInTheDocument();
  });

  it('generates new avatar when Generate New is clicked', async () => {
    const user = userEvent.setup();
    
    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    await user.click(screen.getByText('Generate New'));

    expect(mockOnAvatarChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generated',
        generatedSeed: expect.any(String)
      })
    );
  });

  it('switches to generated avatar when Use Generated is clicked', async () => {
    const user = userEvent.setup();
    const personaWithUploadedAvatar = {
      ...mockPersona,
      avatar: {
        type: 'uploaded' as const,
        uploadedPath: 'abc123.jpg',
        uploadedFilename: 'my-avatar.jpg'
      }
    };

    render(
      <AvatarComponent
        persona={personaWithUploadedAvatar}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    await user.click(screen.getByText('Use Generated'));

    expect(mockOnAvatarChange).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'generated'
      })
    );
  });

  it('validates file type on upload', async () => {
    const user = userEvent.setup();
    
    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    const file = new File(['test'], 'test.txt', { type: 'text/plain' });
    const input = screen.getByRole('button', { name: /upload image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Invalid file type/)).toBeInTheDocument();
    });
  });

  it('validates file size on upload', async () => {
    const user = userEvent.setup();
    
    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    // Create a file larger than 2MB
    const largeFile = new File(['x'.repeat(3 * 1024 * 1024)], 'large.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /upload image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, largeFile);

    await waitFor(() => {
      expect(screen.getByText(/File size too large/)).toBeInTheDocument();
    });
  });

  it('handles successful file upload', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        success: true,
        filePath: 'abc123.jpg',
        filename: 'avatar.jpg'
      })
    });

    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /upload image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, file);

    await waitFor(() => {
      expect(mockOnAvatarChange).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'uploaded',
          uploadedPath: 'abc123.jpg',
          uploadedFilename: 'avatar.jpg'
        })
      );
    });
  });

  it('handles upload error', async () => {
    const user = userEvent.setup();
    
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      statusText: 'Bad Request'
    });

    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    const file = new File(['test'], 'avatar.jpg', { type: 'image/jpeg' });
    const input = screen.getByRole('button', { name: /upload image/i }).parentElement?.querySelector('input[type="file"]') as HTMLInputElement;
    
    await user.upload(input, file);

    await waitFor(() => {
      expect(screen.getByText(/Upload failed: Bad Request/)).toBeInTheDocument();
    });
  });

  it('shows upload guidelines', () => {
    render(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={true}
        onAvatarChange={mockOnAvatarChange}
        onAvatarUpload={mockOnAvatarUpload}
      />
    );

    expect(screen.getByText('JPEG, PNG, WebP • Max 2MB')).toBeInTheDocument();
  });

  it('applies correct size classes', () => {
    const { rerender } = render(
      <AvatarComponent
        persona={mockPersona}
        size="small"
        uploadEnabled={false}
      />
    );

    let avatarContainer = screen.getByAltText('Avatar').parentElement;
    expect(avatarContainer).toHaveClass('w-8', 'h-8');

    rerender(
      <AvatarComponent
        persona={mockPersona}
        size="medium"
        uploadEnabled={false}
      />
    );

    avatarContainer = screen.getByAltText('Avatar').parentElement;
    expect(avatarContainer).toHaveClass('w-16', 'h-16');

    rerender(
      <AvatarComponent
        persona={mockPersona}
        size="large"
        uploadEnabled={false}
      />
    );

    avatarContainer = screen.getByAltText('Avatar').parentElement;
    expect(avatarContainer).toHaveClass('w-24', 'h-24');
  });
});