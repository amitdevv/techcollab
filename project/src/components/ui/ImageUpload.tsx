import React from "react";
import { Upload, X } from "lucide-react";
import { toast } from "react-hot-toast";
import { useImageUpload } from "../../hooks/useImageUpload";

interface ImageUploadProps {
  onImageUploaded: (imageUrl: string, publicId: string) => void;
  className?: string;
  maxSizeInMB?: number;
  allowedTypes?: string[];
  uploadType?: 'profile' | 'event' | 'gig' | 'general';
}

export const ImageUpload: React.FC<ImageUploadProps> = ({
  onImageUploaded,
  className = "",
  maxSizeInMB = 5,
  allowedTypes = ["image/jpeg", "image/png", "image/gif"],
  uploadType = 'general',
}) => {
  const { uploadImage, isUploading } = useImageUpload();

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      toast.error(`File size should be less than ${maxSizeInMB}MB`);
      return;
    }

    // Validate file type
    if (!allowedTypes.includes(file.type)) {
      toast.error("Invalid file type. Please upload an image file.");
      return;
    }

    try {
      const result = await uploadImage(file, { type: uploadType });
      onImageUploaded(result.url, result.publicId);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error('Image upload error:', error);
      toast.error("Failed to upload image");
    }
  };

  return (
    <div className={`relative ${className}`}>
      <input
        type="file"
        onChange={handleFileChange}
        accept={allowedTypes.join(",")}
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        disabled={isUploading}
      />
      <div className="border-2 border-dashed border-emerald-300 rounded-lg p-4 text-center hover:border-emerald-500 hover:bg-emerald-50 transition-all duration-200">
        <Upload className="mx-auto h-8 w-8 text-emerald-500" />
        <p className="mt-2 text-sm text-emerald-700 font-medium">
          {isUploading ? "Uploading..." : "Click or drag to upload image"}
        </p>
        <p className="text-xs text-emerald-600 mt-1">Max size: {maxSizeInMB}MB</p>
      </div>
    </div>
  );
};

interface ImagePreviewProps {
  imageUrl: string;
  onRemove: () => void;
  className?: string;
}

export const ImagePreview: React.FC<ImagePreviewProps> = ({
  imageUrl,
  onRemove,
  className = "",
}) => {
  return (
    <div className={`relative rounded-lg overflow-hidden group ${className}`}>
      <img
        src={imageUrl}
        alt="Preview"
        className="w-full h-full object-cover"
      />
      <button
        onClick={onRemove}
        className="absolute top-2 right-2 p-1.5 bg-red-500 rounded-full text-white hover:bg-red-600 transition-colors opacity-0 group-hover:opacity-100 shadow-lg"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
