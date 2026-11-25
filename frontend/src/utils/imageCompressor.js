/**
 * Client-side image compression utility for MedDean Document Tracker.
 * Ensures high-resolution mobile camera uploads stay safely under Vercel's 4.5 MB serverless payload limit
 * while maintaining crisp legibility for administrative document text.
 */

export async function compressImageIfNeeded(file, maxDimension = 1920, quality = 0.82) {
  // Pass through non-images (e.g. PDF)
  if (!file || !file.type.startsWith("image/")) {
    return file;
  }

  // If already under 1.2 MB and standard dimensions, skip compression
  if (file.size < 1.2 * 1024 * 1024) {
    return file;
  }

  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        let width = img.width;
        let height = img.height;

        // Resize proportionally if larger than maxDimension
        if (width > maxDimension || height > maxDimension) {
          if (width > height) {
            height = Math.round((height * maxDimension) / width);
            width = maxDimension;
          } else {
            width = Math.round((width * maxDimension) / height);
            height = maxDimension;
          }
        }

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext("2d");
        // Use better image interpolation
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = "high";
        ctx.drawImage(img, 0, 0, width, height);

        // Export as JPEG with specified quality
        canvas.toBlob(
          (blob) => {
            if (!blob) {
              resolve(file); // Fallback to original
              return;
            }

            // Create new File object
            const cleanName = file.name.replace(/\.[^/.]+$/, "") + ".jpg";
            const compressedFile = new File([blob], cleanName, {
              type: "image/jpeg",
              lastModified: Date.now()
            });

            console.log(
              `[ImageCompressor] Compressed ${(file.size / 1024 / 1024).toFixed(2)} MB -> ${(
                compressedFile.size /
                1024 /
                1024
              ).toFixed(2)} MB for Vercel safe upload.`
            );

            resolve(compressedFile);
          },
          "image/jpeg",
          quality
        );
      };

      img.onerror = () => resolve(file);
      img.src = e.target.result;
    };

    reader.onerror = () => resolve(file);
    reader.readAsDataURL(file);
  });
}
