import React, { useState, useRef } from 'react';
import { Image, X, Upload, Loader2 } from 'lucide-react';
import { useImageUpload } from '../../hooks/useImageUpload';
import toast from 'react-hot-toast';

interface ChatImageUploadProps {
  onImageUploaded: (imageData: {
    url: string;
    publicId: string;
    thumbnailUrl?: string;
    width?: number;
    height?: number;
    filename: string;
    size: number;
  }) => void;
  disabled?: boolean;
  className?: string;
}

export const ChatImageUpload: React.FC<ChatImageUploadProps> = ({
  onImageUploaded,
  disabled = false,
  className = ''
}) => {
  const { uploadImage, isUploading } = useImageUpload();
  const [preview, setPreview] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (file: File) => {
    // Validate file
    if (!file.type.startsWith('image/')) {
      toast.error('Please select an image file');
      return;
    }

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      toast.error('Image size must be less than 10MB');
      return;
    }

    // Show preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    try {
      const result = await uploadImage(file, { type: 'chat' });
      
      onImageUploaded({
        url: result.url,
        publicId: result.publicId,
        thumbnailUrl: (result as any).thumbnailUrl,
        width: result.width,
        height: result.height,
        filename: file.name,
        size: file.size
      });

      setPreview(null);
      toast.success('Image uploaded successfully!');
    } catch (error) {
      console.error('Image upload error:', error);
      setPreview(null);
      toast.error('Failed to upload image');
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);

    const file = e.dataTransfer.files[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleCancelPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (preview) {
    return (
      <div className="relative bg-gray-50 border border-gray-200 rounded-lg p-4">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium text-gray-700">Image Preview</span>
          <button
            onClick={handleCancelPreview}
            className="p-1 text-gray-400 hover:text-gray-600 rounded"
            disabled={isUploading}
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <div className="relative">
          <img 
            src={preview} 
            alt="Preview" 
            className="max-w-full max-h-48 object-contain rounded-md border border-gray-200"
          />
          
          {isUploading && (
            <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-md">
              <div className="flex items-center text-white">
                <Loader2 className="h-5 w-5 animate-spin mr-2" />
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`relative ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileInputChange}
        className="hidden"
        disabled={disabled || isUploading}
      />
      
      <button
        onClick={handleClick}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        disabled={disabled || isUploading}
        className={`
          w-full p-4 border-2 border-dashed rounded-lg text-center transition-all duration-200
          ${dragOver 
            ? 'border-blue-400 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }
          ${disabled || isUploading 
            ? 'opacity-50 cursor-not-allowed' 
            : 'cursor-pointer'
          }
        `}
      >
        <div className="flex flex-col items-center">
          {isUploading ? (
            <>
              <Loader2 className="h-8 w-8 text-blue-500 animate-spin mb-2" />
              <p className="text-sm text-gray-600">Uploading image...</p>
            </>
          ) : (
            <>
              <Image className="h-8 w-8 text-gray-400 mb-2" />
              <p className="text-sm text-gray-600">
                <span className="font-medium text-blue-600">Click to upload</span> or drag and drop
              </p>
              <p className="text-xs text-gray-500 mt-1">PNG, JPG, GIF up to 10MB</p>
            </>
          )}
        </div>
      </button>
    </div>
  );
}; 