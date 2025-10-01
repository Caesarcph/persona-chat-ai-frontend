import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateSelector from '../TemplateSelector';
import { usePersonaStore, usePresetTemplates, usePersonaLoading } from '../../stores';

// Mock the stores
jest.mock('../../stores');

const mockUsePersonaStore = usePersonaStore as jest.MockedFunction<typeof usePersonaStore>;
const mockUsePresetTemplates = usePresetTemplates as jest.MockedFunction<typeof usePresetTemplates>;
const mockUsePersonaLoading = usePersonaLoading as jest.MockedFunction<typeof usePersonaLoading>;

const mockTemplates = [
  {
    id: 'template-1',
    name: 'Backend Engineer',
    persona: {
      schema_version: '1.0',
      age: 28,
      gender: 'male',
      pronouns: 'he/him',
      nationality: 'Canadian',
      region: 'Toronto',
      education: 'Bachelor\'s in Computer Science',
      occupation: 'Senior Backend Engineer',
      industry: 'Technology',
      seniority: 'Senior',
      expertise: ['Node.js', 'Python', 'PostgreSQL'],
      tools: ['VS Code', 'Git', 'Docker'],
      knowledge_cutoff: '2024-01',
      response_style: 'practical',
      tone: 'professional',
      language_preference: 'english',
      detail_depth: 'detailed',
      conversation_goal: 'Provide technical guidance',
      politeness_directness: 80,
      banned_topics: []
    },
    is_template: true,
    created_at: '2024-01-01T00:00:00.000Z'
  },
  {
    id: 'template-2',
    name: 'High School Student',
    persona: {
      schema_version: '1.0',
      age: 17,
      gender: 'non-binary',
      pronouns: 'they/them',
      nationality: 'American',
      region: 'California',
      education: 'High School Senior',
      occupation: 'Student',
      industry: 'Education',
      seniority: 'Student',
      expertise: ['Social Media', 'Gaming'],
      tools: ['Instagram', 'TikTok'],
      knowledge_cutoff: '2024-01',
      response_style: 'storytelling',
      tone: 'casual',
      language_preference: 'english',
      detail_depth: 'moderate',
      conversation_goal: 'Learn new things and get help with homework',
      politeness_directness: 70,
      banned_topics: ['Adult content']
    },
    is_template: true,
    created_at: '2024-01-01T00:00:00.000Z'
  }
];

const mockLoadPresetTemplates = jest.fn();

describe('TemplateSelector', () => {
  const mockOnTemplateSelect = jest.fn();
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePresetTemplates.mockReturnValue(mockTemplates);
    mockUsePersonaLoading.mockReturnValue({ isLoading: false, isSaving: false, error: null });
    mockUsePersonaStore.mockReturnValue({
      loadPresetTemplates: mockLoadPresetTemplates,
      // Add other required store methods as needed
    } as any);
  });

  it('should render when open', () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Choose a Persona Template')).toBeInTheDocument();
    expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
    expect(screen.getByText('High School Student')).toBeInTheDocument();
  });

  it('should not render when closed', () => {
    render(
      <TemplateSelector
        isOpen={false}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.queryByText('Choose a Persona Template')).not.toBeInTheDocument();
  });

  it('should load templates when opened', async () => {
    mockUsePresetTemplates.mockReturnValue([]);
    
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    await waitFor(() => {
      expect(mockLoadPresetTemplates).toHaveBeenCalled();
    });
  });

  it('should display loading state', () => {
    mockUsePersonaLoading.mockReturnValue({ isLoading: true, isSaving: false, error: null });
    
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('Loading templates...')).toBeInTheDocument();
  });

  it('should display template information correctly', () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    // Check Backend Engineer template
    expect(screen.getByText('Senior Backend Engineer in Technology')).toBeInTheDocument();
    expect(screen.getByText('28')).toBeInTheDocument();
    expect(screen.getByText('Toronto')).toBeInTheDocument();
    expect(screen.getByText('Practical')).toBeInTheDocument();
    expect(screen.getByText('Professional')).toBeInTheDocument();

    // Check High School Student template
    expect(screen.getByText('Student in Education')).toBeInTheDocument();
    expect(screen.getByText('17')).toBeInTheDocument();
    expect(screen.getByText('California')).toBeInTheDocument();
  });

  it('should filter templates based on search', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search templates by name, role, or expertise...');
    
    fireEvent.change(searchInput, { target: { value: 'engineer' } });

    await waitFor(() => {
      expect(screen.getByText('Backend Engineer')).toBeInTheDocument();
      expect(screen.queryByText('High School Student')).not.toBeInTheDocument();
    });
  });

  it('should handle template selection', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    const useTemplateButton = screen.getAllByText('Use Template')[0];
    fireEvent.click(useTemplateButton);

    await waitFor(() => {
      expect(mockOnTemplateSelect).toHaveBeenCalledWith('template-1');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should open template detail modal', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
      expect(screen.getByText('Areas of Expertise')).toBeInTheDocument();
    });
  });

  it('should close template detail modal', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    // Open detail modal
    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Basic Information')).toBeInTheDocument();
    });

    // Close detail modal
    const closeButtons = screen.getAllByRole('button');
    const modalCloseButton = closeButtons.find(button => 
      button.querySelector('svg') && 
      button.closest('.fixed') // In the modal
    );
    
    if (modalCloseButton) {
      fireEvent.click(modalCloseButton);
    }

    await waitFor(() => {
      expect(screen.queryByText('Basic Information')).not.toBeInTheDocument();
    });
  });

  it('should handle close button click', () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    const closeButton = screen.getByRole('button', { name: /close/i });
    fireEvent.click(closeButton);

    expect(mockOnClose).toHaveBeenCalled();
  });

  it('should display empty state when no templates', () => {
    mockUsePresetTemplates.mockReturnValue([]);
    
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('No templates available')).toBeInTheDocument();
  });

  it('should display no results when search has no matches', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    const searchInput = screen.getByPlaceholderText('Search templates by name, role, or expertise...');
    fireEvent.change(searchInput, { target: { value: 'nonexistent' } });

    await waitFor(() => {
      expect(screen.getByText('No templates found')).toBeInTheDocument();
      expect(screen.getByText('Try adjusting your search terms')).toBeInTheDocument();
    });
  });

  it('should display template count', () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    expect(screen.getByText('2 templates available')).toBeInTheDocument();
  });

  it('should handle template selection from detail modal', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    // Open detail modal
    const viewDetailsButton = screen.getAllByText('View Details')[0];
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Use This Template')).toBeInTheDocument();
    });

    // Select from modal
    const useThisTemplateButton = screen.getByText('Use This Template');
    fireEvent.click(useThisTemplateButton);

    await waitFor(() => {
      expect(mockOnTemplateSelect).toHaveBeenCalledWith('template-1');
      expect(mockOnClose).toHaveBeenCalled();
    });
  });

  it('should display personality traits in detail modal', async () => {
    render(
      <TemplateSelector
        isOpen={true}
        onTemplateSelect={mockOnTemplateSelect}
        onClose={mockOnClose}
      />
    );

    // Open detail modal for template with Big5 traits
    const templateWithBig5 = {
      ...mockTemplates[0],
      persona: {
        ...mockTemplates[0].persona,
        big5: {
          openness: 90,
          conscientiousness: 85,
          extraversion: 40,
          agreeableness: 70,
          neuroticism: 30
        }
      }
    };

    mockUsePresetTemplates.mockReturnValue([templateWithBig5]);

    const viewDetailsButton = screen.getByText('View Details');
    fireEvent.click(viewDetailsButton);

    await waitFor(() => {
      expect(screen.getByText('Personality Traits')).toBeInTheDocument();
      expect(screen.getByText('openness:')).toBeInTheDocument();
      expect(screen.getByText('90')).toBeInTheDocument();
    });
  });
});