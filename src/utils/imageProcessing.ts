/**
 * Convert HEIC image to JPEG
 */
export async function convertHeicToJpeg(file: File): Promise<File> {
  try {
    // Dynamic import to avoid SSR issues
    const heic2any = (await import('heic2any')).default;

    const convertedBlob = await heic2any({
      blob: file,
      toType: 'image/jpeg',
      quality: 0.9,
    });

    // heic2any can return Blob or Blob[]
    const blob = Array.isArray(convertedBlob) ? convertedBlob[0] : convertedBlob;

    // Create a new File from the Blob
    return new File([blob], file.name.replace(/\.heic$/i, '.jpg'), {
      type: 'image/jpeg',
      lastModified: Date.now(),
    });
  } catch (error) {
    console.error('Error converting HEIC:', error);
    throw new Error('Failed to convert HEIC image');
  }
}

/**
 * Compress image while maintaining quality
 */
export async function compressImage(file: File): Promise<File> {
  const options = {
    maxSizeMB: 1, // Max file size in MB
    maxWidthOrHeight: 1024, // Max width/height for avatars
    useWebWorker: true,
    quality: 0.9, // High quality (0-1)
  };

  try {
    // Dynamic import to avoid SSR issues
    const imageCompression = (await import('browser-image-compression')).default;

    const compressedFile = await imageCompression(file, options);
    return compressedFile;
  } catch (error) {
    console.error('Error compressing image:', error);
    throw new Error('Failed to compress image');
  }
}

/**
 * Process image: convert HEIC if needed, then compress
 */
export async function processImageForUpload(file: File): Promise<File> {
  let processedFile = file;

  // Check if HEIC/HEIF and convert to JPEG
  if (file.type === 'image/heic' || file.type === 'image/heif' || file.name.toLowerCase().endsWith('.heic')) {
    console.log('Converting HEIC to JPEG...');
    processedFile = await convertHeicToJpeg(file);
  }

  // Compress the image
  console.log('Compressing image...');
  processedFile = await compressImage(processedFile);

  return processedFile;
}

/**
 * Convert base64 data URL to File
 */
export function dataURLToFile(dataUrl: string, filename: string): File {
  const arr = dataUrl.split(',');
  const mime = arr[0].match(/:(.*?);/)?.[1] || 'image/jpeg';
  const bstr = atob(arr[1]);
  let n = bstr.length;
  const u8arr = new Uint8Array(n);

  while (n--) {
    u8arr[n] = bstr.charCodeAt(n);
  }

  return new File([u8arr], filename, { type: mime });
}
