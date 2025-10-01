import React, { useState, useRef } from 'react';
import { AvatarComponentProps, AvatarUploadResponse } from '../types/persona';
import { getAvatarUrl, validateAvatarFile, getAvatarSizeClasses, generateAvatarSeed } from '../utils/avatar';

const AvatarComponent: React.FC<AvatarComponentProps> = ({
  persona,
  size,
  uploadEnabled,
  onAvatarChange,
  onAvatarUpload
}) => {
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const avatarUrl = getAvatarUrl(persona);
  const sizeClasses = getAvatarSizeClasses(size);
  const isGenerated = !persona.avatar || persona.avatar.type === 'generated';
  
  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    setUploadError(null);
    
    // Validate file
    const validation = validateAvatarFile(file);
    if (!validation.valid) {
      setUploadError(validation.error || 'Invalid file');
      return;
    }
    
    setIsUploading(true);
    
    try {
      if (onAvatarUpload) {
        await onAvatarUpload(file);
      } else {
        // Default upload implementation
        await uploadAvatar(file);
      }
    } catch (error) {
      setUploadError(error instanceof Error ? error.message : 'Upload failed');
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };
  
  const uploadAvatar = async (file: File): Promise<void> => {
    const formData = new FormData();
    formData.append('avatar', file);
    
    const response = await fetch('/api/avatars/upload', {
      method: 'POST',
      body: formData,
    });
    
    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }
    
    const result: AvatarUploadResponse = await response.json();
    
    if (!result.success) {
      throw new Error(result.error || 'Upload failed');
    }
    
    // Update persona with uploaded avatar
    if (onAvatarChange && result.filePath) {
      onAvatarChange({
        type: 'uploaded',
        generatedSeed: generateAvatarSeed(persona),
        uploadedPath: result.filePath,
        uploadedFilename: result.filename
      });
    }
  };
  
  const handleGenerateNew = () => {
    if (onAvatarChange) {
      const newSeed = Date.now().toString(); // Simple random seed
      onAvatarChange({
        type: 'generated',
        generatedSeed: newSeed
      });
    }
  };
  
  const handleUseGenerated = () => {
    if (onAvatarChange) {
      onAvatarChange({
        type: 'generated',
        generatedSeed: generateAvatarSeed(persona)
      });
    }
  };
  
  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };
  
  return (
    <div className="flex flex-col items-center space-y-2">
      {/* Avatar Display */}
      <div className={`${sizeClasses} rounded-full overflow-hidden border-2 border-gray-300 bg-gray-100`}>
        <img
          src={avatarUrl}
          alt="Avatar"
          className="w-full h-full object-cover"
          onError={(e) => {
            // Fallback to a default generated avatar if image fails to load
            const target = e.target as HTMLImageElement;
            target.src = `https://source.boringavatars.com/beam/120/${generateAvatarSeed(persona)}`;
          }}
        />
      </div>
      
      {/* Upload Error */}
      {uploadError && (
        <div className="text-red-600 text-sm text-center max-w-xs">
          {uploadError}
        </div>
      )}
      
      {/* Controls */}
      {uploadEnabled && size !== 'small' && (
        <div className="flex flex-col items-center space-y-2">
          {/* Avatar Type Indicator */}
          <div className="text-xs text-gray-500">
            {isGenerated ? 'Generated Avatar' : 'Uploaded Avatar'}
          </div>
          
          {/* Action Buttons */}
          <div className="flex space-x-2">
            {isGenerated ? (
              <button
                onClick={handleGenerateNew}
                className="px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors"
                disabled={isUploading}
              >
                Generate New
              </button>
            ) : (
              <button
                onClick={handleUseGenerated}
                className="px-3 py-1 text-xs bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                disabled={isUploading}
              >
                Use Generated
              </button>
            )}
            
            <button
              onClick={handleUploadClick}
              className="px-3 py-1 text-xs bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors"
              disabled={isUploading}
            >
              {isUploading ? 'Uploading...' : 'Upload Image'}
            </button>
          </div>
          
          {/* File Input */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {/* Upload Guidelines */}
          <div className="text-xs text-gray-400 text-center max-w-xs">
            JPEG, PNG, WebP • Max 2MB
          </div>
        </div>
      )}
    </div>
  );
};

export default AvatarComponent;