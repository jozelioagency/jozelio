/**
 * Utility to convert any image File to a WebP Blob client-side.
 * Downscales images to ensure they do not exceed maxDimension to conserve storage and optimize loading.
 */
export async function convertToWebP(file: File, quality = 0.75, maxDimension = 1000): Promise<Blob> {
  return new Promise((resolve, reject) => {
    // If it's not a standard image, fail immediately
    if (!file.type.startsWith("image/")) {
      reject(new Error("File is not an image."));
      return;
    }

    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target?.result as string;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Failed to get 2D canvas context."));
          return;
        }

        let width = img.width;
        let height = img.height;

        // Downscale matching aspect ratio
        if (width > height) {
          if (width > maxDimension) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          }
        } else {
          if (height > maxDimension) {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => {
            if (blob) {
              resolve(blob);
            } else {
              reject(new Error("Canvas conversion returned null."));
            }
          },
          "image/webp",
          quality
        );
      };
      img.onerror = (err) => reject(new Error("Failed to load image element."));
    };
    reader.onerror = (err) => reject(new Error("Failed to read image file."));
  });
}
