const hasImgbb = !!process.env.IMGBB_API_KEY;

if (hasImgbb) {
  console.log('ImgBB media storage client active.');
} else {
  console.log('ImgBB config missing. Initialized base64/mock media fallback.');
}

/**
 * Upload an image file to ImgBB
 * @param fileString Base64 image data or file URL
 */
export async function uploadImage(fileString: string): Promise<string> {
  if (!fileString) return '';

  const apiKey = process.env.IMGBB_API_KEY;
  if (apiKey && (fileString.startsWith('data:') || fileString.startsWith('http'))) {
    try {
      // Strip data uri prefix if base64 to send raw base64
      let cleanImage = fileString;
      if (fileString.startsWith('data:')) {
        const parts = fileString.split(',');
        if (parts.length > 1) {
          cleanImage = parts[1];
        }
      }

      const formData = new URLSearchParams();
      formData.append('image', cleanImage);

      const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: formData.toString(),
      });

      if (!response.ok) {
        throw new Error(`ImgBB upload failed with status ${response.status}`);
      }

      const result = await response.json();
      if (result && result.data && result.data.url) {
        return result.data.url;
      }
    } catch (error) {
      console.error('ImgBB upload failed, falling back to original:', error);
    }
  }

  // Fallback
  return fileString;
}
