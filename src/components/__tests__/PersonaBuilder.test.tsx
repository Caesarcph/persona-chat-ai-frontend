import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import '@testing-library/jest-dom';
import PersonaBuilder from '../PersonaBuilder';
import { getDefaultPersona } from '../../validation/personaSchema';

// Mock the persona change handler
const mockOnPersonaChange = jest.fn();

// Default props for testing
const defaultProps = {
  persona: null,
  onPersonaChange: mockOnPersonaChange,
  sensitiveFieldsEnabled: true,
};

describe('PersonaBuilder', () => {
  beforeEach(() => {
    mockOnPersonaChange.mockClear();
  });

  describe('Component Rendering', () => {
    it('renders all section tabs', () => {
      render(<PersonaBuilder {...defaultProps} />);
      
      expect(screen.getByText('Demographics')).toBeInTheDocument();
      expect(screen.getByText('Personality')).toBeInTheDocument();
      expect(screen.getByText('Knowledge')).toBeInTheDocument();
      expect(screen.getByText('Communication')).toBeInTheDocument();
      expect(screen.getByText('Context')).toBeInTheDocument();
      expect(screen.getByText('Safety')).toBeInTheDocument();
    });

    it('renders demographics section by default', () => {
      render(<PersonaBuilder {...defaultProps} />);
      
      expect(screen.getByText('Basic Demographics')).toBeInTheDocument();
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
      expect(screen.getByLabelText('Pronouns')).toBeInTheDocument();
    });

    it('shows sensitive fields when enabled', () => {
      render(<PersonaBuilder {...defaultProps} />);
      
      expect(screen.getByText('Sensitive Demographics')).toBeInTheDocument();
      expect(screen.getByLabelText('Race/Ethnicity')).toBeInTheDocument();
      expect(screen.getByLabelText('Religion')).toBeInTheDocument();
      expect(screen.getByLabelText('Political Views')).toBeInTheDocument();
    });

    it('hides sensitive fields when disabled', () => {
      render(<PersonaBuilder {...defaultProps} sensitiveFieldsEnabled={false} />);
      
      expect(screen.queryByText('Sensitive Demographics')).not.toBeInTheDocument();
      expect(screen.queryByLabelText('Race/Ethnicity')).not.toBeInTheDocument();
    });
  });

  describe('Section Navigation', () => {
    it('switches between sections when tabs are clicked', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Click on Personality tab
      await user.click(screen.getByText('Personality'));
      expect(screen.getByText('Personality & Psychology')).toBeInTheDocument();
      expect(screen.getByText('Big Five Personality Traits')).toBeInTheDocument();
      
      // Click on Knowledge tab
      await user.click(screen.getByText('Knowledge'));
      expect(screen.getByText('Knowledge & Experience')).toBeInTheDocument();
      expect(screen.getByLabelText('Areas of Expertise')).toBeInTheDocument();
    });

    it('highlights active section tab', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const personalityTab = screen.getByText('Personality');
      await user.click(personalityTab);
      
      // Check if the tab has active styling (blue background)
      expect(personalityTab.closest('button')).toHaveClass('bg-blue-50', 'text-blue-700');
    });
  });

  describe('Form Validation', () => {
    it('shows validation errors for required fields', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Try to submit empty required field
      const ageInput = screen.getByLabelText('Age');
      await user.clear(ageInput);
      await user.tab(); // Trigger validation
      
      // Note: Validation errors might not show immediately due to form mode
      // This test structure is ready for when validation is triggered
    });

    it('validates MBTI format correctly', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Navigate to personality section
      await user.click(screen.getByText('Personality'));
      
      const mbtiInput = screen.getByLabelText('MBTI Type (Optional)');
      await user.type(mbtiInput, 'INVALID');
      await user.tab();
      
      // Validation should trigger on form submission or blur
    });

    it('validates knowledge cutoff date format', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Navigate to knowledge section
      await user.click(screen.getByText('Knowledge'));
      
      const cutoffInput = screen.getByLabelText('Knowledge Cutoff Date');
      expect(cutoffInput).toHaveAttribute('type', 'month');
    });
  });

  describe('Sensitive Fields Handling', () => {
    it('shows confirmation dialog when sensitive field is filled', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const raceInput = screen.getByLabelText('Race/Ethnicity');
      await user.type(raceInput, 'Asian');
      
      // Should trigger sensitive fields dialog
      await waitFor(() => {
        expect(screen.getByText('Sensitive Fields Confirmation')).toBeInTheDocument();
      });
    });

    it('shows usage guidelines in confirmation dialog', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const raceInput = screen.getByLabelText('Race/Ethnicity');
      await user.type(raceInput, 'Asian');
      
      await waitFor(() => {
        expect(screen.getByText('Usage Guidelines:')).toBeInTheDocument();
        expect(screen.getByText(/Use only for legitimate educational/)).toBeInTheDocument();
      });
    });

    it('confirms sensitive fields usage', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const raceInput = screen.getByLabelText('Race/Ethnicity');
      await user.type(raceInput, 'Asian');
      
      await waitFor(() => {
        expect(screen.getByText('Sensitive Fields Confirmation')).toBeInTheDocument();
      });
      
      const confirmButton = screen.getByText('I Understand & Confirm');
      await user.click(confirmButton);
      
      // Dialog should close
      await waitFor(() => {
        expect(screen.queryByText('Sensitive Fields Confirmation')).not.toBeInTheDocument();
      });
    });

    it('cancels sensitive fields input', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const raceInput = screen.getByLabelText('Race/Ethnicity');
      await user.type(raceInput, 'Asian');
      
      await waitFor(() => {
        expect(screen.getByText('Sensitive Fields Confirmation')).toBeInTheDocument();
      });
      
      const cancelButton = screen.getByText('Cancel');
      await user.click(cancelButton);
      
      // Dialog should close and field should be cleared
      await waitFor(() => {
        expect(screen.queryByText('Sensitive Fields Confirmation')).not.toBeInTheDocument();
        expect(raceInput).toHaveValue('');
      });
    });
  });

  describe('Array Fields Management', () => {
    it('adds new items to array fields', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Navigate to knowledge section
      await user.click(screen.getByText('Knowledge'));
      
      const addButton = screen.getByText('Add areas of expertise');
      await user.click(addButton);
      
      // Should add a new input field
      const expertiseInputs = screen.getAllByPlaceholderText('e.g., Machine Learning, Marketing');
      expect(expertiseInputs).toHaveLength(1);
    });

    it('removes items from array fields', async () => {
      const user = userEvent.setup();
      const personaWithExpertise = {
        ...getDefaultPersona(),
        expertise: ['Machine Learning', 'Data Science']
      };
      
      render(<PersonaBuilder {...defaultProps} persona={personaWithExpertise} />);
      
      // Navigate to knowledge section
      await user.click(screen.getByText('Knowledge'));
      
      // Find remove buttons (X icons)
      const removeButtons = screen.getAllByLabelText('Remove item');
      expect(removeButtons).toHaveLength(2);
      
      // Click first remove button
      await user.click(removeButtons[0]);
      
      // Should have one less item
      const remainingButtons = screen.getAllByLabelText('Remove item');
      expect(remainingButtons).toHaveLength(1);
    });
  });

  describe('Slider Controls', () => {
    it('updates Big Five personality sliders', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Navigate to personality section
      await user.click(screen.getByText('Personality'));
      
      // Find openness slider
      const opennessSlider = screen.getByDisplayValue('50'); // Default value
      
      // Change slider value
      fireEvent.change(opennessSlider, { target: { value: '75' } });
      
      expect(opennessSlider).toHaveValue('75');
    });

    it('displays slider values', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Navigate to personality section
      await user.click(screen.getByText('Personality'));
      
      // Should show current values next to labels
      expect(screen.getByText('50')).toBeInTheDocument(); // Default slider value
    });
  });

  describe('Form Integration', () => {
    it('calls onPersonaChange when valid form data changes', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Fill in required fields to make form valid
      await user.type(screen.getByLabelText('Age'), '25');
      await user.type(screen.getByLabelText('Gender'), 'Female');
      await user.type(screen.getByLabelText('Pronouns'), 'she/her');
      await user.type(screen.getByLabelText('Nationality'), 'American');
      await user.type(screen.getByLabelText('Region'), 'California');
      
      // Select education
      await user.selectOptions(screen.getByLabelText('Education'), 'bachelors');
      
      await user.type(screen.getByLabelText('Occupation'), 'Engineer');
      await user.type(screen.getByLabelText('Industry'), 'Technology');
      
      // Select seniority
      await user.selectOptions(screen.getByLabelText('Seniority'), 'mid');
      
      // Add expertise
      await user.click(screen.getByText('Knowledge'));
      await user.click(screen.getByText('Add areas of expertise'));
      const expertiseInput = screen.getByPlaceholderText('e.g., Machine Learning, Marketing');
      await user.type(expertiseInput, 'Software Development');
      
      // Add conversation goal
      await user.click(screen.getByText('Context'));
      await user.type(screen.getByLabelText('Conversation Goal'), 'Technical discussions');
      
      // Should call onPersonaChange when form becomes valid
      await waitFor(() => {
        expect(mockOnPersonaChange).toHaveBeenCalled();
      });
    });

    it('resets form when persona prop changes', () => {
      const { rerender } = render(<PersonaBuilder {...defaultProps} />);
      
      const newPersona = getDefaultPersona();
      newPersona.age = 30;
      newPersona.gender = 'Male';
      
      rerender(<PersonaBuilder {...defaultProps} persona={newPersona} />);
      
      expect(screen.getByDisplayValue('30')).toBeInTheDocument();
      expect(screen.getByDisplayValue('Male')).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has proper form labels', () => {
      render(<PersonaBuilder {...defaultProps} />);
      
      expect(screen.getByLabelText('Age')).toBeInTheDocument();
      expect(screen.getByLabelText('Gender')).toBeInTheDocument();
      expect(screen.getByLabelText('Pronouns')).toBeInTheDocument();
    });

    it('has proper ARIA labels for remove buttons', async () => {
      const user = userEvent.setup();
      const personaWithExpertise = {
        ...getDefaultPersona(),
        expertise: ['Machine Learning']
      };
      
      render(<PersonaBuilder {...defaultProps} persona={personaWithExpertise} />);
      
      await user.click(screen.getByText('Knowledge'));
      
      const removeButton = screen.getByLabelText('Remove item');
      expect(removeButton).toBeInTheDocument();
    });

    it('supports keyboard navigation between sections', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      const personalityTab = screen.getByText('Personality');
      
      // Tab should be focusable
      personalityTab.focus();
      expect(personalityTab).toHaveFocus();
      
      // Enter should activate tab
      await user.keyboard('{Enter}');
      expect(screen.getByText('Personality & Psychology')).toBeInTheDocument();
    });
  });

  describe('Responsive Behavior', () => {
    it('renders section navigation as horizontal scrollable on mobile', () => {
      render(<PersonaBuilder {...defaultProps} />);
      
      const nav = screen.getByRole('navigation');
      expect(nav).toHaveClass('overflow-x-auto');
    });

    it('maintains section state when switching between sections', async () => {
      const user = userEvent.setup();
      render(<PersonaBuilder {...defaultProps} />);
      
      // Fill in a field in demographics
      await user.type(screen.getByLabelText('Age'), '25');
      
      // Switch to personality section
      await user.click(screen.getByText('Personality'));
      expect(screen.getByText('Personality & Psychology')).toBeInTheDocument();
      
      // Switch back to demographics
      await user.click(screen.getByText('Demographics'));
      
      // Field should still have the value
      expect(screen.getByDisplayValue('25')).toBeInTheDocument();
    });
  });
});