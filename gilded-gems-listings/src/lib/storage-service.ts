import { supabase } from "@/integrations/supabase/client";

const BUCKET_NAME = "property-images";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export interface UploadedImage {
  url: string;
  path: string;
  publicUrl: string;
}

/**
 * Uploads an image to Supabase Storage
 * @param file - The file to upload
 * @param path - Optional path within the bucket (e.g., "properties/property-id")
 * @returns Upload result with URL and path
 */
export async function uploadImage(
  file: File,
  path?: string
): Promise<UploadedImage> {
  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    throw new Error(`File size exceeds ${MAX_FILE_SIZE / 1024 / 1024}MB limit`);
  }

  // Validate file type
  if (!file.type.startsWith("image/")) {
    throw new Error("File must be an image");
  }

  // Generate unique filename
  const fileExt = file.name.split(".").pop();
  const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
  const filePath = path ? `${path}/${fileName}` : fileName;

  // Upload to Supabase Storage
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(filePath, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    throw new Error(`Upload failed: ${error.message}`);
  }

  // Get public URL
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(data.path);

  return {
    url: publicUrl,
    path: data.path,
    publicUrl,
  };
}

/**
 * Uploads multiple images
 * @param files - Array of files to upload
 * @param path - Optional path within the bucket
 * @returns Array of upload results
 */
export async function uploadImages(
  files: File[],
  path?: string
): Promise<UploadedImage[]> {
  const uploads = files.map((file) => uploadImage(file, path));
  return Promise.all(uploads);
}

/**
 * Deletes an image from Supabase Storage
 * @param path - Path to the file in storage
 */
export async function deleteImage(path: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove([path]);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Deletes multiple images from Supabase Storage
 * @param paths - Array of paths to delete
 */
export async function deleteImages(paths: string[]): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET_NAME).remove(paths);

  if (error) {
    throw new Error(`Delete failed: ${error.message}`);
  }
}

/**
 * Gets a public URL for an image
 * @param path - Path to the file in storage
 * @returns Public URL
 */
export function getImageUrl(path: string): string {
  const {
    data: { publicUrl },
  } = supabase.storage.from(BUCKET_NAME).getPublicUrl(path);
  return publicUrl;
}

