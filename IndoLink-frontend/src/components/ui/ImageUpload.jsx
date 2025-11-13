import { useState, useRef, useCallback } from 'react';
import { Button } from './button';
import { Card, CardContent } from './card';
import { X, Upload, Image as ImageIcon, Plus } from 'lucide-react';
import { toast } from 'sonner';

const ImageUpload = ({ 
  images = [], 
  onImagesChange, 
  maxImages = 5, 
  maxSize = 5 * 1024 * 1024, // 5MB
  acceptedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
  className = '',
  onDeleteImage = null
}) => {
  const [dragActive, setDragActive] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef(null);

  const validateFile = (file) => {
    if (!acceptedTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload JPEG, PNG, WebP, or GIF images.');
      return false;
    }
    if (file.size > maxSize) {
      toast.error(`File size too large. Maximum size is ${maxSize / (1024 * 1024)}MB.`);
      return false;
    }
    return true;
  };

  const handleFiles = useCallback((files) => {
    const fileArray = Array.from(files);
    const validFiles = fileArray.filter(validateFile);
    
    if (validFiles.length === 0) return;
    
    if (images.length + validFiles.length > maxImages) {
      toast.error(`Maximum ${maxImages} images allowed.`);
      return;
    }

    const newImages = validFiles.map((file, index) => ({
      id: `temp-${Date.now()}-${index}`,
      file,
      preview: URL.createObjectURL(file),
      isPrimary: images.length === 0 && index === 0, // First image is primary by default
      isUploading: true
    }));

    onImagesChange([...images, ...newImages]);
    
    // Simulate upload process
    newImages.forEach((image, index) => {
      setTimeout(() => {
        onImagesChange(prev => 
          prev.map(img => 
            img.id === image.id 
              ? { ...img, isUploading: false }
              : img
          )
        );
      }, 1000 + index * 500);
    });
  }, [images, maxImages, onImagesChange]);

  const handleDrag = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  }, [handleFiles]);

  const handleFileInput = useCallback((e) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  }, [handleFiles]);

  const removeImage = (imageId) => {
    if (onDeleteImage) {
      onDeleteImage(imageId);
    } else {
      onImagesChange(images.filter(img => img.id !== imageId));
    }
  };

  const setPrimary = (imageId) => {
    onImagesChange(images.map(img => ({
      ...img,
      isPrimary: img.id === imageId
    })));
  };

  const openFileDialog = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-4 ${className}`}>
      {/* Upload Area */}
      {images.length < maxImages && (
        <Card 
          className={`border-2 border-dashed transition-colors cursor-pointer ${
            dragActive 
              ? 'border-primary bg-primary/5' 
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          onClick={openFileDialog}
        >
          <CardContent className="flex flex-col items-center justify-center py-8">
            <div className="flex flex-col items-center space-y-2">
              <div className="p-3 rounded-full bg-primary/10">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium text-foreground">
                  Drop images here or click to upload
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  PNG, JPG, WebP, GIF up to 5MB each
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept={acceptedTypes.join(',')}
        onChange={handleFileInput}
        className="hidden"
      />

      {/* Image Preview Grid */}
      {images.length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {images.map((image, index) => (
            <Card key={image.id} className="relative group overflow-hidden">
              <CardContent className="p-0">
                <div className="aspect-square relative">
                  <img
                    src={image.preview || image.imageUrl || image.image}
                    alt={`Upload ${index + 1}`}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Uploading Overlay */}
                  {image.isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                    </div>
                  )}
                  
                  {/* Primary Badge */}
                  {image.isPrimary && (
                    <div className="absolute top-2 left-2">
                      <span className="bg-primary text-primary-foreground text-xs px-2 py-1 rounded">
                        Primary
                      </span>
                    </div>
                  )}
                  
                  {/* Action Buttons */}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center space-x-2">
                    {!image.isPrimary && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={(e) => {
                          e.stopPropagation();
                          setPrimary(image.id);
                        }}
                      >
                        Set Primary
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage(image.id);
                      }}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
          
          {/* Add More Button */}
          {images.length < maxImages && (
            <Card 
              className="border-2 border-dashed border-muted-foreground/25 hover:border-primary/50 cursor-pointer transition-colors"
              onClick={openFileDialog}
            >
              <CardContent className="flex flex-col items-center justify-center h-full min-h-[120px]">
                <Plus className="h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Add More</p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Image Count */}
      <div className="text-xs text-muted-foreground text-center">
        {images.length} of {maxImages} images uploaded
      </div>
    </div>
  );
};

export default ImageUpload;
