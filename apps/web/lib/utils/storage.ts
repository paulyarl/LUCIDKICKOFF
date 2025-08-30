import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import { v4 as uuidv4 } from 'uuid';
import { Database } from '@/lib/database.types';

const supabase = createClientComponentClient<Database>();

type FileType = 'artwork' | 'profile' | 'temporary';

const getBucketName = (type: FileType): string => {
  switch (type) {
    case 'artwork':
      return 'artworks';
    case 'profile':
      return 'avatars';
    case 'temporary':
      return 'temporary-uploads';
    default:
      throw new Error(`Unknown file type: ${type}`);
  }
};

const getFileExtension = (filename: string): string => {
  return filename.split('.').pop()?.toLowerCase() || '';
};

export const uploadFile = async (
  file: File, 
  type: FileType,
  options: {
    path?: string;
    public?: boolean;
    upsert?: boolean;
  } = {}
) => {
  try {
    const fileExt = getFileExtension(file.name);
    const fileName = `${options.path || ''}${uuidv4()}.${fileExt}`;
    const bucketName = getBucketName(type);
    
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: options.upsert || false,
      });

    if (error) {
      throw error;
    }

    // Get the public URL if the file is public
    if (options.public) {
      const { data: { publicUrl } } = supabase.storage
        .from(bucketName)
        .getPublicUrl(fileName);
      
      return {
        path: data.path,
        fullPath: `${bucketName}/${data.path}`,
        publicUrl,
      };
    }

    // For private files, return a signed URL that expires
    const { data: signedUrlData } = await supabase.storage
      .from(bucketName)
      .createSignedUrl(fileName, 3600); // 1 hour expiration

    return {
      path: data.path,
      fullPath: `${bucketName}/${data.path}`,
      signedUrl: signedUrlData?.signedUrl || '',
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

export const deleteFile = async (filePath: string, type: FileType) => {
  try {
    const bucketName = getBucketName(type);
    const { error } = await supabase.storage
      .from(bucketName)
      .remove([filePath]);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    throw error;
  }
};

export const getPublicUrl = (filePath: string, type: FileType) => {
  const bucketName = getBucketName(type);
  const { data } = supabase.storage
    .from(bucketName)
    .getPublicUrl(filePath);
  
  return data.publicUrl;
};

export const createSignedUrl = async (filePath: string, type: FileType, expiresIn = 3600) => {
  const bucketName = getBucketName(type);
  const { data, error } = await supabase.storage
    .from(bucketName)
    .createSignedUrl(filePath, expiresIn);
  
  if (error) {
    throw error;
  }
  
  return data.signedUrl;
};

// Optimize image URL for web display
export const optimizeImage = (
  url: string, 
  options: {
    width?: number;
    height?: number;
    quality?: number;
    resize?: 'cover' | 'contain' | 'fill' | 'inside' | 'outside';
    format?: 'origin' | 'auto' | 'webp' | 'jpg' | 'jpeg' | 'png' | 'avif';
  } = {}
) => {
  if (!url) return '';
  
  // If it's not a Supabase Storage URL, return as is
  if (!url.includes('supabase.co/storage/v1/object/public/')) {
    return url;
  }
  
  const urlObj = new URL(url);
  const searchParams = new URLSearchParams();
  
  // Add image transformation parameters
  if (options.width) searchParams.append('width', options.width.toString());
  if (options.height) searchParams.append('height', options.height.toString());
  if (options.quality) searchParams.append('quality', options.quality.toString());
  if (options.resize) searchParams.append('resize', options.resize);
  if (options.format && options.format !== 'origin') {
    searchParams.append('format', options.format);
  }
  
  // If we have any transformations, add them to the URL
  if (searchParams.toString()) {
    // Check if URL already has query parameters
    const separator = urlObj.search ? '&' : '?';
    return `${url}${separator}${searchParams.toString()}`;
  }
  
  return url;
};

// Generate a thumbnail URL for an image
export const getThumbnailUrl = (
  url: string, 
  size: { width: number; height: number } = { width: 300, height: 200 }
) => {
  return optimizeImage(url, {
    ...size,
    resize: 'cover',
    quality: 80,
    format: 'webp',
  });
};

// Handle file validation before upload
export const validateFile = (
  file: File, 
  options: {
    maxSizeMB?: number;
    allowedTypes?: string[];
  } = {}
): { valid: boolean; error?: string } => {
  const { maxSizeMB = 5, allowedTypes = ['image/jpeg', 'image/png', 'image/webp'] } = options;
  
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
    };
  }
  
  // Check file size (default 5MB)
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File is too large. Maximum size is ${maxSizeMB}MB`,
    };
  }
  
  return { valid: true };
};

// Convert a File/Blob to a data URL
export const fileToDataUrl = (file: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
};

// Resize an image file to a maximum dimension while maintaining aspect ratio
export const resizeImageFile = async (
  file: File,
  maxWidth: number,
  maxHeight: number,
  quality = 0.8
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      
      if (!ctx) {
        reject(new Error('Could not create canvas context'));
        return;
      }
      
      // Calculate new dimensions while maintaining aspect ratio
      let width = img.width;
      let height = img.height;
      
      if (width > maxWidth) {
        const ratio = maxWidth / width;
        width = maxWidth;
        height = height * ratio;
      }
      
      if (height > maxHeight) {
        const ratio = maxHeight / height;
        height = maxHeight;
        width = width * ratio;
      }
      
      // Set canvas dimensions
      canvas.width = width;
      canvas.height = height;
      
      // Draw and compress image
      ctx.drawImage(img, 0, 0, width, height);
      
      // Convert to blob with specified quality
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }
          resolve(blob);
        },
        file.type,
        quality
      );
      
      // Clean up
      URL.revokeObjectURL(url);
    };
    
    img.onerror = (error) => {
      URL.revokeObjectURL(url);
      reject(error);
    };
    
    img.src = url;
  });
};
