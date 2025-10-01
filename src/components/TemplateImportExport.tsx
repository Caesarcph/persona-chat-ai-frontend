import React, { useState, useRef } from 'react';
import { usePersonaStore } from '../stores';

interface TemplateImportExportProps {
  onClose: () => void;
  isOpen: boolean;
  mode: 'import' | 'export';
  templateId?: string; // For export mode
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  templateCount: number;
  details: Array<{
    index: number;
    name: string;
    valid: boolean;
    errors: string[];
    warnings: string[];
  }>;
}

const TemplateImportExport: React.FC<TemplateImportExportProps> = ({
  onClose,
  isOpen,
  mode,
  templateId
}) => {
  const { exportTemplate, importTemplate, validateTemplate } = usePersonaStore();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [validationResult, setValidationResult] = useState<ValidationResult | null>(null);
  const [importData, setImportData] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    if (!templateId) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const exportResult = await exportTemplate(templateId);
      
      if (exportResult.success && exportResult.data) {
        // Create and download the file
        const blob = new Blob([exportResult.data.content], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = exportResult.data.filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        setResult({
          success: true,
          message: `Template "${exportResult.data.template}" exported successfully!`,
          filename: exportResult.data.filename
        });
      } else {
        setResult({
          success: false,
          message: exportResult.error || 'Export failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Export failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
      handleValidation(content);
    };
    reader.readAsText(file);
  };

  const handleValidation = async (data: string) => {
    if (!data.trim()) {
      setValidationResult(null);
      return;
    }

    try {
      const parsedData = JSON.parse(data);
      const validationResult = await validateTemplate(parsedData);
      
      if (validationResult.success) {
        setValidationResult(validationResult.data);
      } else {
        setValidationResult({
          valid: false,
          errors: [validationResult.error || 'Validation failed'],
          warnings: [],
          templateCount: 0,
          details: []
        });
      }
    } catch (error) {
      setValidationResult({
        valid: false,
        errors: ['Invalid JSON format'],
        warnings: [],
        templateCount: 0,
        details: []
      });
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) return;
    
    setIsProcessing(true);
    setResult(null);
    
    try {
      const parsedData = JSON.parse(importData);
      const importResult = await importTemplate(parsedData);
      
      if (importResult.success) {
        setResult({
          success: true,
          message: 'Template imported successfully!',
          data: importResult.data
        });
        setImportData('');
        setValidationResult(null);
      } else {
        setResult({
          success: false,
          message: importResult.error || 'Import failed'
        });
      }
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Import failed'
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleTextareaChange = (event: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = event.target.value;
    setImportData(value);
    handleValidation(value);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold text-gray-900">
              {mode === 'export' ? 'Export Template' : 'Import Template'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Export Mode */}
          {mode === 'export' && (
            <div className="space-y-4">
              <p className="text-gray-600">
                Export this template as a JSON file that can be imported later or shared with others.
              </p>
              
              <div className="flex items-center justify-center">
                <button
                  onClick={handleExport}
                  disabled={isProcessing}
                  className="px-6 py-3 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Exporting...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      <span>Download Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Import Mode */}
          {mode === 'import' && (
            <div className="space-y-6">
              <p className="text-gray-600">
                Import a template from a JSON file or paste the template data directly.
              </p>

              {/* File Upload */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Upload Template File
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".json"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 border border-gray-300 rounded-md hover:bg-gray-50 flex items-center space-x-2"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                    </svg>
                    <span>Choose File</span>
                  </button>
                  <span className="text-sm text-gray-500">or paste JSON below</span>
                </div>
              </div>

              {/* Text Input */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Template JSON Data
                </label>
                <textarea
                  value={importData}
                  onChange={handleTextareaChange}
                  placeholder="Paste template JSON data here..."
                  className="w-full h-40 p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                />
              </div>

              {/* Validation Results */}
              {validationResult && (
                <div className="space-y-3">
                  <h3 className="font-medium text-gray-900">Validation Results</h3>
                  
                  {/* Summary */}
                  <div className={`p-3 rounded-md ${
                    validationResult.valid 
                      ? 'bg-green-50 border border-green-200' 
                      : 'bg-red-50 border border-red-200'
                  }`}>
                    <div className="flex items-center space-x-2">
                      {validationResult.valid ? (
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      )}
                      <span className={`font-medium ${
                        validationResult.valid ? 'text-green-800' : 'text-red-800'
                      }`}>
                        {validationResult.valid ? 'Valid Template Data' : 'Invalid Template Data'}
                      </span>
                    </div>
                    
                    <div className="mt-2 text-sm">
                      <p className={validationResult.valid ? 'text-green-700' : 'text-red-700'}>
                        Found {validationResult.templateCount} template{validationResult.templateCount !== 1 ? 's' : ''}
                      </p>
                    </div>
                  </div>

                  {/* Errors */}
                  {validationResult.errors.length > 0 && (
                    <div className="bg-red-50 border border-red-200 rounded-md p-3">
                      <h4 className="font-medium text-red-800 mb-2">Errors:</h4>
                      <ul className="text-sm text-red-700 space-y-1">
                        {validationResult.errors.map((error, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-red-500 mt-0.5">•</span>
                            <span>{error}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Warnings */}
                  {validationResult.warnings.length > 0 && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-md p-3">
                      <h4 className="font-medium text-yellow-800 mb-2">Warnings:</h4>
                      <ul className="text-sm text-yellow-700 space-y-1">
                        {validationResult.warnings.map((warning, index) => (
                          <li key={index} className="flex items-start space-x-2">
                            <span className="text-yellow-500 mt-0.5">⚠</span>
                            <span>{warning}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Template Details */}
                  {validationResult.details.length > 0 && (
                    <div className="space-y-2">
                      <h4 className="font-medium text-gray-900">Template Details:</h4>
                      {validationResult.details.map((detail, index) => (
                        <div key={index} className={`p-2 rounded border ${
                          detail.valid 
                            ? 'bg-green-50 border-green-200' 
                            : 'bg-red-50 border-red-200'
                        }`}>
                          <div className="flex items-center justify-between">
                            <span className="font-medium text-sm">{detail.name}</span>
                            <span className={`text-xs px-2 py-1 rounded ${
                              detail.valid 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {detail.valid ? 'Valid' : 'Invalid'}
                            </span>
                          </div>
                          {detail.errors.length > 0 && (
                            <ul className="mt-1 text-xs text-red-600 space-y-1">
                              {detail.errors.map((error, errorIndex) => (
                                <li key={errorIndex}>• {error}</li>
                              ))}
                            </ul>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Import Button */}
              <div className="flex justify-end">
                <button
                  onClick={handleImport}
                  disabled={isProcessing || !importData.trim() || (validationResult ? validationResult.valid !== true : false)}
                  className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
                >
                  {isProcessing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 11l3 3m0 0l3-3m-3 3V8" />
                      </svg>
                      <span>Import Template</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          )}

          {/* Result Display */}
          {result && (
            <div className={`mt-6 p-4 rounded-md ${
              result.success 
                ? 'bg-green-50 border border-green-200' 
                : 'bg-red-50 border border-red-200'
            }`}>
              <div className="flex items-center space-x-2">
                {result.success ? (
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                )}
                <span className={`font-medium ${
                  result.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {result.message}
                </span>
              </div>
              
              {result.filename && (
                <p className="mt-2 text-sm text-green-700">
                  File: {result.filename}
                </p>
              )}
              
              {result.data && result.data.nameChanged && (
                <p className="mt-2 text-sm text-yellow-700">
                  Template name was changed to avoid conflicts: "{result.data.importedName}"
                </p>
              )}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              {result?.success ? 'Done' : 'Cancel'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TemplateImportExport;