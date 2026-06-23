// Placeholder for S3 / Cloudflare R2 storage integration
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

// Note: To use this, you'll need to install @aws-sdk/client-s3
// npm install @aws-sdk/client-s3

export const s3Client = new S3Client({
  region: process.env.S3_REGION || "auto",
  endpoint: process.env.S3_ENDPOINT,
  credentials: {
    accessKeyId: process.env.S3_ACCESS_KEY || "",
    secretAccessKey: process.env.S3_SECRET_KEY || "",
  },
});

export async function uploadFileToS3(file: Buffer, fileName: string, contentType: string) {
  const bucket = process.env.S3_BUCKET_NAME;
  
  if (!bucket) {
    throw new Error("S3_BUCKET_NAME is not defined in environment variables");
  }

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: fileName,
    Body: file,
    ContentType: contentType,
  });

  try {
    const response = await s3Client.send(command);
    return response;
  } catch (error) {
    console.error("Error uploading to S3:", error);
    throw error;
  }
}
