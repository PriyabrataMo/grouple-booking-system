import AWS from "aws-sdk";
import { v4 as uuidv4 } from "uuid";
import path from "path";

// Check for required environment variables
const requiredEnvVars = [
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
  "AWS_REGION",
  "AWS_S3_BUCKET_NAME",
];

// Log warning for any missing variables
const missingVars = requiredEnvVars.filter((varName) => !process.env[varName]);
if (missingVars.length > 0) {
  console.warn(
    `⚠️ Missing S3 environment variables: ${missingVars.join(", ")}`
  );
  console.warn("Image uploads will not work without these variables set");
}

// Get bucket name with fallback
const bucketName = process.env.AWS_S3_BUCKET_NAME || "";

// Initialize S3 with environment variables
const s3 = new AWS.S3({
  region: process.env.AWS_REGION ?? "ap-south-1", // Provide default region
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

/**
 * Uploads a file to S3 bucket
 * @param file The file to upload (from multer)
 * @param folder Optional folder path within the bucket
 * @returns A Promise that resolves to the URL of the uploaded file
 */
export const uploadFileToS3 = async (
  file: Express.Multer.File,
  folder: string = "restaurant-images"
): Promise<string> => {
  // Check if S3 is properly configured
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  // Generate a unique filename with original extension
  const ext = path.extname(file.originalname);
  const key = `${folder}/${uuidv4()}${ext}`;

  // Upload file to S3
  await s3
    .putObject({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ContentDisposition: "attachment",
    })
    .promise();

  // Return the URL to the uploaded file
  return `https://${bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;
};

/**
 * Extracts the key from a full S3 URL
 * @param url The S3 URL
 * @returns The S3 object key
 */
const extractKeyFromUrl = (url: string): string | null => {
  // Check if it's an S3 URL
  if (!url || !url.includes(bucketName)) {
    return null;
  }

  try {
    // Parse the URL to extract the pathname
    const urlObj = new URL(url);
    // The path starts with /, so remove the first character
    return urlObj.pathname.startsWith("/")
      ? urlObj.pathname.substring(1)
      : urlObj.pathname;
  } catch (error) {
    console.error("Error parsing S3 URL:", error);
    return null;
  }
};

/**
 * Deletes a file from S3 bucket using its URL
 * @param url The URL of the file to delete
 * @returns A Promise that resolves when the file is deleted
 */
export const deleteFileFromS3 = async (url: string): Promise<boolean> => {
  if (!bucketName) {
    console.error("AWS_S3_BUCKET_NAME environment variable is not set");
    return false;
  }

  try {
    const key = extractKeyFromUrl(url);
    if (!key) {
      console.error(`Invalid S3 URL or could not extract key: ${url}`);
      return false;
    }

    await s3
      .deleteObject({
        Bucket: bucketName,
        Key: key,
      })
      .promise();

    console.log(`Successfully deleted file from S3: ${key}`);
    return true;
  } catch (error) {
    console.error(`Error deleting file from S3:`, error);
    return false;
  }
};

/**
 * Generates a presigned URL for uploading a file directly to S3
 * @param filename Original filename to determine extension
 * @param folder Optional folder path within the bucket
 * @param contentType MIME type of the file being uploaded
 * @param expiresIn Time in seconds until the presigned URL expires (default: 60 minutes)
 * @returns Object with the upload URL and the file's key in S3
 */
export const generatePresignedUploadUrl = (
  filename: string,
  folder: string = "restaurant-images",
  contentType: string = "image/jpeg",
  expiresIn: number = 3600
): { uploadUrl: string; key: string } => {
  // Check if S3 is properly configured
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  // Generate a unique filename with original extension
  const ext = path.extname(filename);
  const key = `${folder}/${uuidv4()}${ext}`;

  // Generate a presigned URL for uploading
  const uploadUrl = s3.getSignedUrl("putObject", {
    Bucket: bucketName,
    Key: key,
    ContentType: contentType,
    Expires: expiresIn,
  });

  return { uploadUrl, key };
};

/**
 * Generates a presigned URL for downloading/accessing a file from S3
 * @param key The S3 object key or full S3 URL
 * @param expiresIn Time in seconds until the presigned URL expires (default: 1 hour)
 * @returns A Promise that resolves to the presigned URL
 */
export const generatePresignedGetUrl = async (
  key: string,
  expiresIn: number = 3600
): Promise<string> => {
  // Check if S3 is properly configured
  if (!bucketName) {
    throw new Error("AWS_S3_BUCKET_NAME environment variable is not set");
  }

  // If a full URL was passed, extract the key
  const fileKey = key.includes("http") ? extractKeyFromUrl(key) || key : key;
  
  if (!fileKey) {
    throw new Error("Invalid S3 key or URL provided");
  }

  // Generate a presigned URL for downloading/viewing
  const presignedUrl = s3.getSignedUrl("getObject", {
    Bucket: bucketName,
    Key: fileKey,
    Expires: expiresIn,
  });

  return presignedUrl;
};
