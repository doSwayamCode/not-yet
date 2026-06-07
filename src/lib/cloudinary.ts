import { v2 as cloudinary } from 'cloudinary';

const hasCloudinary = !!(
  process.env.CLOUDINARY_CLOUD_NAME &&
  process.env.CLOUDINARY_API_KEY &&
  process.env.CLOUDINARY_API_SECRET
);

if (hasCloudinary) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
  console.log('Cloudinary media storage client initialized.');
} else {
  console.log('Cloudinary config missing. Initialized base64/mock media fallback.');
}

/**
 * Upload an image file (base64 string or file path)
 * @param fileString Base64 image data or file path
 * @param folder Folder name in Cloudinary
 */
export async function uploadImage(fileString: string, folder = 'notyet'): Promise<string> {
  if (!fileString) return '';

  if (hasCloudinary) {
    try {
      const result = await cloudinary.uploader.upload(fileString, {
        folder,
        resource_type: 'image',
      });
      return result.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed, falling back to base64.', error);
    }
  }

  // Fallback: If it's already a base64 string, just return it. If it's a URL, return it.
  return fileString;
}
