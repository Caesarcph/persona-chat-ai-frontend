import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import TemplateImportExport from '../TemplateImportExport';
import { usePersonaStore } from '../../stores';

// Mock the store
jest.mock('../../stores');

const mockUsePersonaStore = usePersonaStore as jest.MockedFunction<typeof usePersonaStore>;

// Mock fetch
global.fetch = jest.fn();

// Mock URL.createObjectURL and related APIs
global.URL.createObjectURL = jest.fn(() => 'mock-url');
global.URL.revokeObjectURL = jest.fn();

// Mock document.createElement and related DOM APIs
const mockAnchorElement = {
  href: '',
  download: '',
  click: jest.fn(),
};

const originalCreateElement = document.createElement;
document.createElement = jest.fn((tagName) => {
  if (tagName === 'a') {
    return mockAnchorElement as any;
  }
  return originalCreateElement.call(document, tagName);
});

const mockExportTemplate = jest.fn();
const mockImportTemplate = jest.fn();
const mockValidateTemplate = jest.fn();

describe('TemplateImportExport', () => {
  const mockOnClose = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
    
    mockUsePersonaStore.mockReturnValue({
      exportTemplate: mockExportTemplate,
      importTemplate: mockImportTemplate,
      validateTemplate: mockValidateTemplate,
    } as any);

    // Reset DOM mocks
    mockAnchorElement.click.mockClear();
    (global.URL.createObjectURL as jest.Mock).mockClear();
    (global.URL.revokeObjectURL as jest.Mock).mockClear();
  });

  describe('Export Mode', () => {
    it('should render export interface', () => {
      render(
        <TemplateImportExport
          isOpen={true}
          mode="export"
          templateId="template-123"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Export Template')).toBeInTheDocument();
      expect(screen.getByText('Download Template')).toBeInTheDocument();
      expect(screen.getByText(/Export this template as a JSON file/)).toBeInTheDocument();
    });

    it('should handle successful export', async () => {
      const mockExportData = {
        success: true,
        data: {
          content: '{"version":"1.0","template":{"name":"Test Template"}}',
          filename: 'template-test-2024-01-01.json',
          template: 'Test Template'
        }
      };

      mockExportTemplate.mockResolvedValue(mockExportData);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="export"
          templateId="template-123"
          onClose={mockOnClose}
        />
      );

      const downloadButton = screen.getByText('Download Template');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(mockExportTemplate).toHaveBeenCalledWith('template-123');
        expect(global.URL.createObjectURL).toHaveBeenCalled();
        expect(mockAnchorElement.click).toHaveBeenCalled();
        expect(screen.getByText(/Template "Test Template" exported successfully!/)).toBeInTheDocument();
      });
    });

    it('should handle export failure', async () => {
      mockExportTemplate.mockResolvedValue({
        success: false,
        error: 'Export failed'
      });

      render(
        <TemplateImportExport
          isOpen={true}
          mode="export"
          templateId="template-123"
          onClose={mockOnClose}
        />
      );

      const downloadButton = screen.getByText('Download Template');
      fireEvent.click(downloadButton);

      await waitFor(() => {
        expect(screen.getByText('Export failed')).toBeInTheDocument();
      });
    });

    it('should show loading state during export', async () => {
      mockExportTemplate.mockImplementation(() => new Promise(resolve => setTimeout(resolve, 100)));

      render(
        <TemplateImportExport
          isOpen={true}
          mode="export"
          templateId="template-123"
          onClose={mockOnClose}
        />
      );

      const downloadButton = screen.getByText('Download Template');
      fireEvent.click(downloadButton);

      expect(screen.getByText('Exporting...')).toBeInTheDocument();
    });
  });

  describe('Import Mode', () => {
    it('should render import interface', () => {
      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      expect(screen.getByText('Import Template')).toBeInTheDocument();
      expect(screen.getByText('Choose File')).toBeInTheDocument();
      expect(screen.getByPlaceholderText('Paste template JSON data here...')).toBeInTheDocument();
    });

    it('should handle file upload', async () => {
      const mockValidationResult = {
        success: true,
        data: {
          valid: true,
          errors: [],
          warnings: [],
          templateCount: 1,
          details: []
        }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const fileInput = screen.getByRole('button', { name: /choose file/i }).previousElementSibling as HTMLInputElement;
      
      const mockFile = new File(['{"version":"1.0","template":{"name":"Test"}}'], 'template.json', {
        type: 'application/json'
      });

      // Mock FileReader
      const mockFileReader = {
        readAsText: jest.fn(),
        onload: null as any,
        result: '{"version":"1.0","template":{"name":"Test"}}'
      };

      global.FileReader = jest.fn(() => mockFileReader) as any;

      fireEvent.change(fileInput, { target: { files: [mockFile] } });

      // Simulate FileReader onload
      mockFileReader.onload({ target: { result: mockFileReader.result } });

      await waitFor(() => {
        expect(mockValidateTemplate).toHaveBeenCalled();
      });
    });

    it('should validate template data on text input', async () => {
      const mockValidationResult = {
        success: true,
        data: {
          valid: true,
          errors: [],
          warnings: [],
          templateCount: 1,
          details: [{
            index: 0,
            name: 'Test Template',
            valid: true,
            errors: [],
            warnings: []
          }]
        }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      const validJson = '{"version":"1.0","template":{"name":"Test Template","persona":{}}}';
      
      fireEvent.change(textarea, { target: { value: validJson } });

      await waitFor(() => {
        expect(mockValidateTemplate).toHaveBeenCalledWith(JSON.parse(validJson));
        expect(screen.getByText('Valid Template Data')).toBeInTheDocument();
      });
    });

    it('should show validation errors', async () => {
      const mockValidationResult = {
        success: true,
        data: {
          valid: false,
          errors: ['Template name is required'],
          warnings: ['Some warning'],
          templateCount: 1,
          details: [{
            index: 0,
            name: 'Invalid Template',
            valid: false,
            errors: ['Missing required fields'],
            warnings: []
          }]
        }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      fireEvent.change(textarea, { target: { value: '{"invalid":"data"}' } });

      await waitFor(() => {
        expect(screen.getByText('Invalid Template Data')).toBeInTheDocument();
        expect(screen.getByText('Template name is required')).toBeInTheDocument();
        expect(screen.getByText('Some warning')).toBeInTheDocument();
      });
    });

    it('should handle successful import', async () => {
      const mockValidationResult = {
        success: true,
        data: { valid: true, errors: [], warnings: [], templateCount: 1, details: [] }
      };

      const mockImportResult = {
        success: true,
        data: {
          template: { name: 'Imported Template' },
          nameChanged: false
        }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);
      mockImportTemplate.mockResolvedValue(mockImportResult);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      const validJson = '{"version":"1.0","template":{"name":"Test","persona":{}}}';
      
      fireEvent.change(textarea, { target: { value: validJson } });

      await waitFor(() => {
        expect(screen.getByText('Valid Template Data')).toBeInTheDocument();
      });

      const importButton = screen.getByText('Import Template');
      fireEvent.click(importButton);

      await waitFor(() => {
        expect(mockImportTemplate).toHaveBeenCalledWith(JSON.parse(validJson));
        expect(screen.getByText('Template imported successfully!')).toBeInTheDocument();
      });
    });

    it('should handle import failure', async () => {
      const mockValidationResult = {
        success: true,
        data: { valid: true, errors: [], warnings: [], templateCount: 1, details: [] }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);
      mockImportTemplate.mockResolvedValue({
        success: false,
        error: 'Import failed'
      });

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      fireEvent.change(textarea, { target: { value: '{"version":"1.0","template":{}}' } });

      await waitFor(() => {
        const importButton = screen.getByText('Import Template');
        fireEvent.click(importButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Import failed')).toBeInTheDocument();
      });
    });

    it('should disable import button for invalid data', async () => {
      const mockValidationResult = {
        success: true,
        data: { valid: false, errors: ['Invalid'], warnings: [], templateCount: 1, details: [] }
      };

      mockValidateTemplate.mockResolvedValue(mockValidationResult);

      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      fireEvent.change(textarea, { target: { value: '{"invalid":"data"}' } });

      await waitFor(() => {
        const importButton = screen.getByText('Import Template');
        expect(importButton).toBeDisabled();
      });
    });

    it('should handle JSON parse errors', async () => {
      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const textarea = screen.getByPlaceholderText('Paste template JSON data here...');
      fireEvent.change(textarea, { target: { value: 'invalid json' } });

      await waitFor(() => {
        expect(screen.getByText('Invalid Template Data')).toBeInTheDocument();
        expect(screen.getByText('Invalid JSON format')).toBeInTheDocument();
      });
    });
  });

  describe('Common functionality', () => {
    it('should not render when closed', () => {
      render(
        <TemplateImportExport
          isOpen={false}
          mode="import"
          onClose={mockOnClose}
        />
      );

      expect(screen.queryByText('Import Template')).not.toBeInTheDocument();
    });

    it('should handle close button click', () => {
      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const closeButton = screen.getAllByRole('button').find(button => 
        button.querySelector('svg') && 
        button.getAttribute('aria-label') !== 'Choose File'
      );
      
      if (closeButton) {
        fireEvent.click(closeButton);
        expect(mockOnClose).toHaveBeenCalled();
      }
    });

    it('should handle cancel button click', () => {
      render(
        <TemplateImportExport
          isOpen={true}
          mode="import"
          onClose={mockOnClose}
        />
      );

      const cancelButton = screen.getByText('Cancel');
      fireEvent.click(cancelButton);

      expect(mockOnClose).toHaveBeenCalled();
    });
  });
});